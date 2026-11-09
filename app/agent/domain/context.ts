import { createHash } from "node:crypto";
import type { ContextPolicy, ModelContext } from "../core/protocol";
import { DomainWorkspace } from "./workspace";

export interface DomainArtifactInput { kind: string; subject?: string }
export interface DomainOperation { name: string; systemInstructions: string; includeSource?: boolean; artifacts?: readonly (string | DomainArtifactInput)[]; toolCallIds?: readonly string[] }
export interface ContextEvidence { operation: string; readSet: readonly string[]; fingerprint: string }
export class DomainContextPolicy implements ContextPolicy<{ workspace: DomainWorkspace; operation: DomainOperation }> {
  lastEvidence: ContextEvidence | null = null;
  async build({ domainStateRef, toolExchanges }: Parameters<ContextPolicy<{ workspace: DomainWorkspace; operation: DomainOperation }>["build"]>[0]): Promise<ModelContext> {
    const { workspace, operation } = domainStateRef; const readSet: string[] = []; const payload: Record<string, unknown> = { operation: operation.name };
    if (operation.includeSource) { payload.source = await workspace.readSource(); readSet.push(`source:${workspace.ref.sourceSha256}`); }
    if (operation.artifacts) { const artifacts: Record<string, unknown> = {}; for (const input of operation.artifacts) { const kind = typeof input === "string" ? input : input.kind, subject = typeof input === "string" ? undefined : input.subject, current = await workspace.readCurrent(kind, subject), key = `${kind}${subject === undefined ? "" : `:${subject}`}`; artifacts[key] = current.value; readSet.push(`${key}@${current.record.version}:${current.record.sha256}`); } payload.artifacts = artifacts; }
    const content = JSON.stringify(payload); const messages: Array<ModelContext["messages"][number]> = [{ role: "user", content }]; const allowed = new Set(operation.toolCallIds ?? []);
    for (const exchange of toolExchanges) if (allowed.has(exchange.call.callId)) { messages.push({ role: "assistant", content: "", toolCalls: [exchange.call] }, { role: "tool", callId: exchange.call.callId, content: JSON.stringify(exchange.observation) }); readSet.push(`tool:${exchange.call.callId}`); }
    const fingerprint = createHash("sha256").update(JSON.stringify(messages)).digest("hex"); this.lastEvidence = { operation: operation.name, readSet: readSet.sort(), fingerprint };
    return { systemInstructions: operation.systemInstructions, messages, metadata: { operation: operation.name, readSetFingerprint: fingerprint } };
  }
}
