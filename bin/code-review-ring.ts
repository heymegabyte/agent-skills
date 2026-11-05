#!/usr/bin/env node
/**
 * Multi-Agent Mutual Code Review Ring
 * Routes every pull request through a circular peer review matrix (Author -> Inspector -> Sentry -> Boss),
 * collecting structured approve/reject verdicts.
 */

export interface ReviewVerdict {
  reviewerRole: "Inspector" | "Sentry" | "Architect";
  decision: "APPROVE" | "REQUEST_CHANGES";
  comments: string[];
}

export interface ReviewSessionReport {
  pullRequestId: string;
  authorRole: string;
  allReviewsComplete: boolean;
  canMerge: boolean;
  verdicts: ReviewVerdict[];
  summary: string;
}

export function evaluateReviewRing(
  pullRequestId: string,
  authorRole: string,
  verdicts: ReviewVerdict[]
): ReviewSessionReport {
  const requiredRoles: ("Inspector" | "Sentry" | "Architect")[] = ["Inspector", "Sentry", "Architect"];
  const submittedRoles = new Set(verdicts.map((v) => v.reviewerRole));

  const allReviewsComplete = requiredRoles.every((r) => submittedRoles.has(r));
  const hasRejections = verdicts.some((v) => v.decision === "REQUEST_CHANGES");
  const canMerge = allReviewsComplete && !hasRejections;

  const summary = canMerge
    ? `PR ${pullRequestId} approved by full review ring (Inspector, Sentry, Architect). Ready to merge.`
    : hasRejections
    ? `PR ${pullRequestId} blocked: changes requested by ${verdicts.filter((v) => v.decision === "REQUEST_CHANGES").map((v) => v.reviewerRole).join(", ")}.`
    : `PR ${pullRequestId} pending remaining reviews from: ${requiredRoles.filter((r) => !submittedRoles.has(r)).join(", ")}.`;

  return {
    pullRequestId,
    authorRole,
    allReviewsComplete,
    canMerge,
    verdicts,
    summary,
  };
}

if (process.argv[1]?.endsWith("code-review-ring.ts")) {
  console.log("Code Review Ring ready.");
}
