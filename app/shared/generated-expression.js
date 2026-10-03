'use strict';
function normalizeGeneratedBlock(input) {
  const block=structuredClone(input), notes=[];
  if (block.content?.type!=='flow' || !Array.isArray(block.content.lanes)) return {block,notes};
  let rewrites=0;
  block.content.lanes.forEach(lane=>{
    if (!Array.isArray(lane.nodes)) return;
    lane.nodes=lane.nodes.map(entry=>{
      if (!entry || typeof entry!=='object' || entry.node || !entry.title) return entry;
      const {edge,...node}=entry;rewrites++;return edge?{node,edge}:{node};
    });
  });
  if (rewrites) notes.push(`[契约] ${rewrites} 个扁平 flow node 已归一为 {node,edge}；文本未修改`);
  return {block,notes};
}
module.exports={normalizeGeneratedBlock};
