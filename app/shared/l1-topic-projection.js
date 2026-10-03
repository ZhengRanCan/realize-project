'use strict';

const directional = new Set(['consumes', 'produces', 'depends-on', 'contains', 'validates', 'controls', 'constrains', 'transforms-to']);
function projectTopic(map, topicId, {plan}={}) {
  const topic = map.topics.find((item) => item.id === topicId);
  if (!topic) throw new Error(`unknown topic ${topicId}`);
  const inside = map.elements.filter((element) => element.topics.includes(topicId));
  const ids = new Set(inside.map((element) => element.id));
  const classify = (edge) => {
    const fromInside = ids.has(edge.from), toInside = ids.has(edge.to);
    if (fromInside && toInside) return 'internal';
    if (!fromInside && !toInside) return 'external';
    if (!directional.has(edge.type)) return 'crossing';
    return toInside ? 'inbound' : 'outbound';
  };
  const relations = map.edges.map((edge) => ({ edge, role: classify(edge) })).filter(({ role }) => role !== 'external');
  const relationClasses = { internal: [], inbound: [], outbound: [], crossing: [] };
  relations.forEach(({ edge, role }) => relationClasses[role].push(edge.id));
  const blockOrganization = Object.prototype.hasOwnProperty.call(topic, 'blockIds')
    ? { state: topic.blockIds.length ? 'known' : 'empty', ids: [...topic.blockIds] }
    : { state: 'unknown' };
  const result={ kind: 'L1TopicViewModel', topic: Object.freeze({ id: topic.id, title: topic.title, proposition: topic.proposition }), inside: Object.freeze(inside.map((e) => Object.freeze({ id: e.id, label: e.label }))), relations: Object.freeze(relations.map(({ edge, role }) => Object.freeze({ id: edge.id, from: edge.from, to: edge.to, type: edge.type, role }))), relationClasses: Object.freeze(Object.fromEntries(Object.entries(relationClasses).map(([key, ids]) => [key, Object.freeze(ids)]))), blockOrganization: Object.freeze(blockOrganization), representation: relations.length ? 'boundary-map' : 'boundary-summary' };
  if(plan && blockOrganization.state==='known') {
    const order=['what','how','prove','boundary'];
    result.blockEntries=blockOrganization.ids.map(id=>{const b=plan.blocks.find(x=>x.id===id);if(!b) throw new Error(`dangling topic block ${id}`);return {id:b.id,title:b.title,stage:b.stage};}).sort((a,b)=>order.indexOf(a.stage)-order.indexOf(b.stage));
  }
  return Object.freeze(result);
}
module.exports = { projectTopic };
