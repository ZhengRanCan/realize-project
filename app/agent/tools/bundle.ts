import type { InputRef } from "../domain/dependencies";

interface ExportOptions { source: string; design: string; plan: string; generated?: string; map?: string; out: string; analysisId: string }
interface ExportResult { manifestPath: string }
export async function publishReadingBundle(options: ExportOptions & { repositoryRoot: string; signal?: AbortSignal; frozenVersionVector: readonly InputRef[]; readVersionVector: () => Promise<readonly InputRef[]>; frozenEpoch: number; readEpoch: () => number }): Promise<{ manifestPath: string; readBackStage: string }> {
  const exporter = require(`${options.repositoryRoot}/scripts/export-reading-bundle.js`) as { exportReadingBundle(options: Record<string, unknown>): Promise<ExportResult> };
  const reader = require(`${options.repositoryRoot}/app/main/reading-bundle.js`) as { readReadingBundle(path: string): Promise<{ ok: boolean; stage: string; errors: string[] }> };
  const expected = vectorFingerprint(options.frozenVersionVector);
  const result = await exporter.exportReadingBundle({ source: options.source, design: options.design, plan: options.plan, ...(options.generated === undefined ? {} : { generated: options.generated }), ...(options.map === undefined ? {} : { map: options.map }), out: options.out, analysisId: options.analysisId, signal: options.signal, beforeCommit: async () => { if (options.signal?.aborted) throw abortError(); if (options.readEpoch() !== options.frozenEpoch) throw new Error("publication_epoch_changed"); if (vectorFingerprint(await options.readVersionVector()) !== expected) throw new Error("publication_vector_changed"); } });
  const readBack = await reader.readReadingBundle(result.manifestPath); if (!readBack.ok) throw new Error(`published_bundle_readback_failed:${readBack.errors.join(";")}`);
  return { manifestPath: result.manifestPath, readBackStage: readBack.stage };
}
export function vectorFingerprint(vector: readonly InputRef[]): string { return JSON.stringify([...vector].sort((a, b) => `${a.namespace}:${a.subject}`.localeCompare(`${b.namespace}:${b.subject}`))); }
function abortError(): Error { const error = new Error("The operation was aborted"); error.name = "AbortError"; return error; }
