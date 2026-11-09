import type { HostObservation, RunStatus } from "../core/protocol";
import { evaluateProofClosure, type InputRef, type ProofRecord } from "./dependencies";

export interface DomainCompletionState { run_status: RunStatus; artifact_status: "incomplete" | "structurally_complete"; completionGate: "FAIL" | "PASS"; quality_status: "unreviewed"; missing: readonly string[]; versionVector: readonly InputRef[] }
export function evaluateDomainCompletion(options: { runStatus: RunStatus; requiredRoots: readonly string[]; proofs: readonly ProofRecord[]; currentInputs: readonly InputRef[]; requiredRuleFingerprints?: Readonly<Record<string, string>> }): DomainCompletionState {
  const closure = evaluateProofClosure({ requiredRootProofIds: options.requiredRoots, proofs: options.proofs, currentInputs: options.currentInputs, ...(options.requiredRuleFingerprints === undefined ? {} : { requiredRuleFingerprints: options.requiredRuleFingerprints }) });
  return { run_status: options.runStatus, artifact_status: closure.ok ? "structurally_complete" : "incomplete", completionGate: closure.ok ? "PASS" : "FAIL", quality_status: "unreviewed", missing: closure.failures.map((failure) => `${failure.code}:${failure.id}:${failure.detail}`), versionVector: closure.versionVector };
}
export function completionObservation(state: DomainCompletionState): HostObservation | undefined { return state.completionGate === "PASS" ? undefined : { kind: "host", code: "completion_incomplete", summary: "Structural completion requirements are not satisfied", details: state.missing, nextActionHint: "Repair the listed current artifact or proof and request completion again." }; }
