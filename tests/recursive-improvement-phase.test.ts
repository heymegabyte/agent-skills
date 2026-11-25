import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  acceptedImprovementRequirements,
  compileAcceptedImprovements,
  createImprovementConvergenceState,
  evaluateImprovementPhase,
  evaluateImprovementPhaseForRun,
  loadImprovementPhase,
  loadImprovementConvergenceState,
  recordImprovementConvergenceRound,
  reopenImprovementConvergence,
  saveImprovementPhase,
  saveImprovementConvergenceState,
  type DurableImprovementCandidate,
} from "../bin/recursive-improvement.ts";
import { createRunState } from "../bin/orchestration-run-state.ts";

const fixture = JSON.parse(readFileSync(new URL("../fixtures/orchestration/improvement-phase/candidates.json", import.meta.url), "utf8")) as {
  runId: string; runStateDigest: string; changeId: string; sourceRevision: string; evaluatedAt: string;
  policy: { confidenceFloor: number; valueFloor: number; maxCost: number; maxWip: number };
  candidates: DurableImprovementCandidate[];
};
const deliverySchema = JSON.parse(readFileSync(new URL("../schemas/delivery-trace.schema.json", import.meta.url), "utf8"));
const convergenceFixture = JSON.parse(readFileSync(new URL("../fixtures/orchestration/improvement-phase/convergence-rounds.json", import.meta.url), "utf8"));

describe("persisted post-request improvement phase", () => {
  it("ranks evidence-backed candidates and rejects authority or decision conflicts", () => {
    const state = evaluateImprovementPhase(fixture);
    assert.equal(state.phase, "post-request-improvement");
    assert.match(state.stateDigest, /^sha256:[a-f0-9]{64}$/);
    assert.deepEqual(state.rankedCandidates.map(({ rank }) => rank), [1, 2, 3]);
    assert.equal(state.rankedCandidates.filter(({ disposition }) => disposition === "accepted").length, 1);
    assert.equal(state.rankedCandidates.find(({ id }) => id === "IMPROVEMENT-EXTERNAL-DEPLOY")?.reasons.includes("authority-requires-external-authority"), true);
    assert.equal(state.rankedCandidates.find(({ id }) => id === "IMPROVEMENT-CONFLICT")?.reasons.includes("conflicting-candidate"), true);
  });

  it("persists digest-bound state and detects mutation", () => {
    const directory = mkdtempSync(join(tmpdir(), "improvement-phase-"));
    const path = join(directory, "state.json");
    saveImprovementPhase(path, evaluateImprovementPhase(fixture));
    assert.equal(loadImprovementPhase(path).runId, fixture.runId);
    const tampered = JSON.parse(readFileSync(path, "utf8")); tampered.rankedCandidates[0].cost = 0;
    writeFileSync(path, JSON.stringify(tampered));
    assert.throws(() => loadImprovementPhase(path), /digest mismatch/);
  });

  it("promotes only accepted candidates into proposed delivery traces", () => {
    const state = evaluateImprovementPhase(fixture);
    const requirements = acceptedImprovementRequirements(state);
    assert.equal(requirements.length, 1);
    assert.equal(requirements[0].id, state.rankedCandidates.find(({ disposition }) => disposition === "accepted")?.requirementId);
    const bundle = compileAcceptedImprovements(state, {
      title: "Post-request improvements", summary: "Evidence-backed improvements promoted after requested delivery.",
      architectIdentity: "assigned architect", evidenceIds: ["EVIDENCE:RETRY-GAP"],
    }, deliverySchema);
    assert.equal(bundle.ledger.changeId, fixture.changeId);
    assert.equal(bundle.ledger.sourceRevision, fixture.sourceRevision);
    assert.equal(bundle.ledger.records.length, 1);
    assert.equal(bundle.ledger.records[0].implementation.state, "proposed");
    assert.equal(bundle.ledger.records[0].requirement.id, requirements[0].id);
    assert.equal(bundle.ledger.records.some((record: any) => record.requirement.id.includes("EXTERNAL")), false);
  });

  it("refuses candidates without objective verification or evidence", () => {
    const unsafe = { ...fixture.candidates[0], id: "IMPROVEMENT-UNVERIFIED", evidenceIds: [], verification: { method: "", objective: false } };
    const state = evaluateImprovementPhase({ ...fixture, candidates: [unsafe] });
    assert.equal(state.rankedCandidates[0].disposition, "rejected");
    assert.deepEqual(state.rankedCandidates[0].reasons.filter((reason) => reason.startsWith("missing-") || reason.startsWith("verification-")), ["missing-candidate-evidence", "verification-not-objective"]);
  });

  it("does not attach the post-request phase before its orchestration run completes", () => {
    const run = createRunState(fixture.runId, fixture.changeId);
    assert.throws(() => evaluateImprovementPhaseForRun(run, {
      sourceRevision: fixture.sourceRevision, evaluatedAt: fixture.evaluatedAt,
      policy: fixture.policy, candidates: fixture.candidates,
    }), /completed orchestration run/);
  });

  it("converges only after two separately refreshed no-winner rounds", () => {
    let convergence = createImprovementConvergenceState(evaluateImprovementPhase(fixture));
    convergence = recordImprovementConvergenceRound(convergence, convergenceFixture.stableNoWinnerRounds[0]);
    assert.equal(convergence.status, "open");
    assert.equal(convergence.consecutiveNoWinnerRounds, 1);
    convergence = recordImprovementConvergenceRound(convergence, convergenceFixture.stableNoWinnerRounds[1]);
    assert.equal(convergence.status, "converged");
    assert.equal(convergence.consecutiveNoWinnerRounds, 2);
    assert.notEqual(convergence.rounds[0].receiptDigest, convergence.rounds[1].receiptDigest);
  });

  it("new evidence reopens work and resets the no-winner streak", () => {
    let convergence = createImprovementConvergenceState(evaluateImprovementPhase(fixture));
    for (const round of convergenceFixture.newEvidenceRounds) convergence = recordImprovementConvergenceRound(convergence, round);
    assert.equal(convergence.rounds[1].disposition, "work-continues");
    assert.equal(convergence.rounds[2].consecutiveNoWinnerRounds, 1);
    assert.equal(convergence.status, "converged");
  });

  it("a changed evidence refresh cannot serve as the second no-winner round", () => {
    let convergence = createImprovementConvergenceState(evaluateImprovementPhase(fixture));
    convergence = recordImprovementConvergenceRound(convergence, convergenceFixture.stableNoWinnerRounds[0]);
    convergence = recordImprovementConvergenceRound(convergence, { ...convergenceFixture.stableNoWinnerRounds[1], evidenceIds: ["EVIDENCE:BASELINE", "EVIDENCE:NEW"] });
    assert.equal(convergence.status, "open");
    assert.equal(convergence.consecutiveNoWinnerRounds, 1);
    assert.equal(convergence.rounds.at(-1)?.disposition, "work-reopened");
  });

  it("persists convergence and requires genuinely changed evidence to reopen it", () => {
    let convergence = createImprovementConvergenceState(evaluateImprovementPhase(fixture));
    for (const round of convergenceFixture.stableNoWinnerRounds) convergence = recordImprovementConvergenceRound(convergence, round);
    assert.throws(() => reopenImprovementConvergence(convergence, convergenceFixture.stableNoWinnerRounds[1]), /unchanged evidence/);
    convergence = reopenImprovementConvergence(convergence, { evidenceIds: ["EVIDENCE:BASELINE", "EVIDENCE:LATE"], coverageIds: ["COVERAGE:RUNTIME"], refreshedAt: "2026-11-25T15:00:00.000Z" });
    assert.equal(convergence.status, "open");
    assert.equal(convergence.consecutiveNoWinnerRounds, 0);
    const directory = mkdtempSync(join(tmpdir(), "improvement-convergence-"));
    const path = join(directory, "state.json"); saveImprovementConvergenceState(path, convergence);
    const persisted = loadImprovementConvergenceState(path);
    assert.equal(persisted.resetRoundOffsets.at(-1), 2);
    assert.deepEqual(persisted.reopenings[0].evidenceIds, ["EVIDENCE:BASELINE", "EVIDENCE:LATE"]);
  });
});
