import type { JsonValue } from "../core/protocol";

export const ARTIFACT_KINDS = ["inventory", "design-review", "framework-map", "map-selection", "overview-plan", "stage2-block", "overview"] as const;
export type ArtifactKind = typeof ARTIFACT_KINDS[number];
export interface ArtifactRef { kind: ArtifactKind; version: number; sha256: string }
export interface RunInputManifest { runId: string; sourceName: string; sourceSha256: string; sourceBytes: number; createdAt: string }
export interface ArtifactRecord extends ArtifactRef { status: "current" | "rejected"; candidatePath: string; dependencies: readonly ArtifactRef[]; readSet: readonly string[]; verdict?: JsonValue }
export interface DomainWorkspaceRef { runId: string; root: string; sourceSha256: string }

export function assertRunId(value: string): void { if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value)) throw new Error("invalid_run_id"); }
export function assertKind(value: string): asserts value is ArtifactKind { if (!(ARTIFACT_KINDS as readonly string[]).includes(value)) throw new Error("invalid_artifact_kind"); }
