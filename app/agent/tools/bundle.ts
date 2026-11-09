import type { InputRef } from "../domain/dependencies";
import type { ProofRecord } from "../domain/dependencies";
import * as fs from "node:fs";

interface ExportOptions { source: string; design: string; plan: string; generated: string; map: string; out: string; analysisId: string }
interface ExportResult { manifestPath: string }
export async function publishReadingBundle(options: ExportOptions & { repositoryRoot: string; signal?: AbortSignal; frozenVersionVector: readonly InputRef[]; readVersionVector: () => readonly InputRef[]; frozenEpoch: number; readEpoch: () => number; supportProofIds: readonly string[] }): Promise<{ manifestPath: string; readBackStage: string; proof: ProofRecord }> {
  if (!options.generated || !options.map) throw new Error("structural_bundle_requires_generated_and_map");
  const exporter = require(`${options.repositoryRoot}/scripts/export-reading-bundle.js`) as { exportReadingBundle(options: Record<string, unknown>): Promise<ExportResult> };
  const reader = require(`${options.repositoryRoot}/app/main/reading-bundle.js`) as { readReadingBundle(path: string): Promise<{ ok: boolean; stage: string; errors: string[] }> };
  const expected = vectorFingerprint(options.frozenVersionVector);
  const result = await exporter.exportReadingBundle({ source: options.source, design: options.design, plan: options.plan, generated: options.generated, map: options.map, out: options.out, analysisId: options.analysisId, signal: options.signal, commit: ({ staging, out }: { staging: string; out: string }) => { if (options.signal?.aborted) throw abortError(); if (options.readEpoch() !== options.frozenEpoch) throw new Error("publication_epoch_changed"); if (vectorFingerprint(options.readVersionVector()) !== expected) throw new Error("publication_vector_changed"); if (fs.existsSync(out)) throw new Error("输出目录已存在，拒绝覆盖"); fs.renameSync(staging, out); } });
  const readBack = await reader.readReadingBundle(result.manifestPath); if (!readBack.ok) throw new Error(`published_bundle_readback_failed:${readBack.errors.join(";")}`);
  return { manifestPath: result.manifestPath, readBackStage: readBack.stage, proof: { proofId: "bundle-readback", subject: "bundle", directInputs: options.frozenVersionVector, supportProofIds: options.supportProofIds, ruleFingerprint: "reading-bundle-v1", status: "passed" } };
}
export function vectorFingerprint(vector: readonly InputRef[]): string { return JSON.stringify([...vector].sort((a, b) => `${a.namespace}:${a.subject}`.localeCompare(`${b.namespace}:${b.subject}`))); }
function abortError(): Error { const error = new Error("The operation was aborted"); error.name = "AbortError"; return error; }
