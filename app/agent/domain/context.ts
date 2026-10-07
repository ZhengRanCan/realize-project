import { createHash } from "node:crypto";
import type { ContextPolicy, ModelContext } from "../core/protocol";
import { DomainWorkspace } from "./workspace";

export interface DomainOperation { name: string; systemInstructions: string; includeSource?: boolean; artifacts?: readonly string[] }
export interface ContextEvidence { operation: string; readSet: readonly string[]; fingerprint: string }
export class DomainContextPolicy implements ContextPolicy<{ workspace: DomainWorkspace; operation: DomainOperation }> {
  lastEvidence: ContextEvidence | null = null;
  async build({ domainStateRef }: Parameters<ContextPolicy<{ workspace: DomainWorkspace; operation: DomainOperation }>["build"]>[0]): Promise<ModelContext> {
    const { workspace, operation } = domainStateRef; const readSet: string[] = []; const payload: Record<string, unknown> = { operation: operation.name };
    if (operation.includeSource) { payload.source = await workspace.readSource(); readSet.push(`source:${workspace.ref.sourceSha256}`); }
    if (operation.artifacts) { const artifacts: Record<string, unknown> = {}; for (const kind of operation.artifacts) { const current = await workspace.readCurrent(kind); artifacts[kind] = current.value; readSet.push(`${current.record.kind}@${current.record.version}:${current.record.sha256}`); } payload.artifacts = artifacts; }
    const content = JSON.stringify(payload); const fingerprint = createHash("sha256").update(content).digest("hex"); this.lastEvidence = { operation: operation.name, readSet: readSet.sort(), fingerprint };
    return { systemInstructions: operation.systemInstructions, messages: [{ role: "user", content }], metadata: { operation: operation.name, readSetFingerprint: fingerprint } };
  }
}
