#!/usr/bin/env node
/**
 * Human-in-the-Loop (HITL) Critical Action Gate
 * Enforces deterministic pauses and signed approvals for high-blast-radius operations.
 */

import * as crypto from "node:crypto";

export interface HighBlastAction {
  actionType: "DROP_DATABASE" | "FORCE_PUSH" | "PRODUCTION_DEPLOY" | "ROTATE_KEYS" | "PURGE_STORAGE";
  targetResource: string;
  initiatorRole: string;
  justification: string;
}

export interface GateApprovalTicket {
  ticketId: string;
  action: HighBlastAction;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvalSignature?: string;
  approver?: string;
  timestamp: string;
}

export function createHITLTicket(action: HighBlastAction): GateApprovalTicket {
  const ticketId = `HITL-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
  return {
    ticketId,
    action,
    status: "PENDING",
    timestamp: new Date().toISOString(),
  };
}

export function signHITLTicket(
  ticket: GateApprovalTicket,
  approver: string,
  secretKey: string
): GateApprovalTicket {
  const payload = `${ticket.ticketId}:${ticket.action.actionType}:${ticket.action.targetResource}:${approver}`;
  const signature = crypto.createHmac("sha256", secretKey).update(payload).digest("hex");

  return {
    ...ticket,
    status: "APPROVED",
    approver,
    approvalSignature: signature,
  };
}

export function verifyHITLTicket(ticket: GateApprovalTicket, secretKey: string): boolean {
  if (ticket.status !== "APPROVED" || !ticket.approvalSignature || !ticket.approver) {
    return false;
  }
  const payload = `${ticket.ticketId}:${ticket.action.actionType}:${ticket.action.targetResource}:${ticket.approver}`;
  const expected = crypto.createHmac("sha256", secretKey).update(payload).digest("hex");
  return ticket.approvalSignature === expected;
}

if (process.argv[1]?.endsWith("hitl-gate.ts")) {
  console.log("HITL Gate ready.");
}
