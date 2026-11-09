import * as fs from "node:fs/promises";
import path from "node:path";
import type { JsonValue } from "../core/protocol";
import { artifactInput, artifactProofId, verdictStatus } from "../domain/completion";
import type { ProofRecord } from "../domain/dependencies";
import type { ArtifactRecord } from "../domain/types";
import { DomainWorkspace } from "../domain/workspace";

export async function assembleOverview(options: { repositoryRoot: string; workspace: DomainWorkspace; stagingRoot: string; out: string; now?: () => string }): Promise<{ outPath: string; output: JsonValue; proof: ProofRecord }> {
  const design = await options.workspace.readCurrent("design-review"), plan = await options.workspace.readCurrent("overview-plan"), planValue = object(plan.value), planBlocks = planValue.blocks;
  if (!Array.isArray(planBlocks)) throw new Error("assembly_plan_blocks_invalid"); const ids = planBlocks.map((block) => field(object(block), "id")); if (new Set(ids).size !== ids.length) throw new Error("assembly_plan_blocks_duplicate");
  await fs.mkdir(options.stagingRoot, { recursive: true }); const blocksDir = await fs.mkdtemp(path.join(options.stagingRoot, "assembly-blocks-")), records: ArtifactRecord[] = [design.record, plan.record];
  try {
    for (const id of ids) { const current = await options.workspace.readCurrent("stage2-block", id); if (verdictStatus(current.record.verdict) !== "passed" || object(current.value).id !== id) throw new Error(`assembly_block_not_valid:${id}`); records.push(current.record); const directory = path.join(blocksDir, id); await fs.mkdir(directory, { recursive: true }); await fs.writeFile(path.join(directory, "block.generated.json"), `${JSON.stringify(current.value, null, 2)}\n`); await fs.writeFile(path.join(directory, "check-block.txt"), "结果：PASS\n"); await fs.writeFile(path.join(directory, "request.json"), JSON.stringify({ model: "host-validated", promptSha256: null, finishReason: null })); }
    const assembler = require(`${options.repositoryRoot}/scripts/assemble-overview.js`) as { assembleOverviewFromPaths(options: Record<string, unknown>): Promise<{ outPath: string; output: JsonValue }> }, result = await assembler.assembleOverviewFromPaths({ plan: path.join(options.workspace.ref.root, plan.record.candidatePath), design: path.join(options.workspace.ref.root, design.record.candidatePath), blocks: blocksDir, out: options.out, ...(options.now === undefined ? {} : { now: options.now }) });
    const output = result.output as { generation?: { complete?: boolean; missingBlocks?: unknown[]; failedBlocks?: unknown[]; generatedBlocks?: number; totalPlanBlocks?: number } }; if (output.generation?.complete !== true || output.generation.generatedBlocks !== ids.length || output.generation.totalPlanBlocks !== ids.length) throw new Error(`assembly_incomplete:missing=${JSON.stringify(output.generation?.missingBlocks ?? [])}:failed=${JSON.stringify(output.generation?.failedBlocks ?? [])}`);
    const directInputs = records.map(artifactInput); return { ...result, proof: { proofId: "assembly", subject: "overview", directInputs, supportProofIds: records.map(artifactProofId), ruleFingerprint: "assemble-overview-v1", status: "passed" } };
  } finally { await fs.rm(blocksDir, { recursive: true, force: true }); }
}
function object(value: unknown): Record<string, unknown> { if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("assembly_value_invalid"); return value as Record<string, unknown>; }
function field(value: Record<string, unknown>, name: string): string { if (typeof value[name] !== "string") throw new Error(`assembly_${name}_invalid`); return value[name] as string; }
