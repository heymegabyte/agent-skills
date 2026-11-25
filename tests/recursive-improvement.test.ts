import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runBoundedImprovementRounds, runImprovementWave, type ImprovementCandidate } from "../bin/recursive-improvement.ts";

const strong: ImprovementCandidate = { title: "Add correlated incident evidence", evidence: .95, expectedValue: .9, novelty: .8, reversibility: .9, verifiability: .95, cost: .2, risk: .1 };
const policy = { confidenceFloor: .7, valueFloor: .6, maxCost: .7, maxWip: 2 };
describe("recursive improvement", () => {
  it("rejects repetitive, speculative, untestable and budget-threatening candidates", () => {
    const wave = runImprovementWave([
      strong,
      { ...strong, title: "Repetitive", novelty: .1 },
      { ...strong, title: "Untestable", verifiability: .1 },
      { ...strong, title: "Expensive", cost: .95 },
      { ...strong, title: "Speculative", evidence: .1, expectedValue: .2 },
    ], policy);
    assert.deepEqual(wave.accepted.map((item) => item.title), [strong.title]);
    assert.equal(wave.ledger.filter((item) => item.disposition === "rejected-with-evidence").length, 4);
  });
  it("requires two subsequent no-winner waves after a winning wave", () => {
    const result = runBoundedImprovementRounds([strong], () => [{ ...strong, title: "Weak follow-up", evidence: .1, expectedValue: .1, novelty: .1 }], policy);
    assert.equal(result.terminated, true);
    assert.equal(result.reason, "two-refreshed-no-winner-rounds");
    assert.equal(result.rounds, 3);
  });
});
