import type { JsonValue } from "../core/protocol";

export async function assembleOverview(options: { repositoryRoot: string; plan: string; design: string; blocks: string; out: string; now?: () => string }): Promise<{ outPath: string; output: JsonValue }> {
  const assembler = require(`${options.repositoryRoot}/scripts/assemble-overview.js`) as { assembleOverviewFromPaths(options: Record<string, unknown>): Promise<{ outPath: string; output: JsonValue }> };
  const result = await assembler.assembleOverviewFromPaths({ plan: options.plan, design: options.design, blocks: options.blocks, out: options.out, ...(options.now === undefined ? {} : { now: options.now }) });
  const output = result.output as { generation?: { complete?: boolean; missingBlocks?: unknown[]; failedBlocks?: unknown[] } };
  if (output.generation?.complete !== true) throw new Error(`assembly_incomplete:missing=${JSON.stringify(output.generation?.missingBlocks ?? [])}:failed=${JSON.stringify(output.generation?.failedBlocks ?? [])}`);
  return result;
}
