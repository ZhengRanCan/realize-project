'use strict';
function projectL3(planBlock, reviewObjects) {
  const reviews = (planBlock.reviewObjects || []).map((id) => reviewObjects.find((item) => item.id === id)).filter(Boolean).map((item) => ({ id: item.id, evidence: [...(item.evidence || [])] }));
  return Object.freeze({ blockId: planBlock.id, traceability: Object.freeze({ sourceUnitIds: Object.freeze([...planBlock.covers]), sourceRefs: Object.freeze([...planBlock.sourceRefs]) }), reviewContext: Object.freeze(reviews), claimVerification: Object.freeze({ space: 'CapabilityAvailability', state: 'absent' }) });
}
module.exports = { projectL3 };
