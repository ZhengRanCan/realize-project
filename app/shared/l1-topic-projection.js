'use strict';

const directional = new Set(['consumes', 'produces', 'depends-on', 'contains', 'validates', 'controls', 'constrains', 'transforms-to']);
// The display projection owns its copies, including optional nested metadata.
function copyFrozen(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(copyFrozen));
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copyFrozen(item)])));
  return value;
}
function pick(value, keys) {
  return Object.fromEntries(keys.filter(key => Object.prototype.hasOwnProperty.call(value, key)).map(key => [key, value[key]]));
}
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
  const outsideIds = new Set(relations.filter(r => r.role !== 'internal').flatMap(({edge}) => [edge.from, edge.to]).filter(id => !ids.has(id)));
  const elementFields = ['id', 'label', 'type', 'sectionRefs', 'sourceUnitIds'];
  const result = {
    kind: 'L1TopicViewModel',
    document: pick(map.document || {}, ['id', 'title', 'sourcePath', 'role']),
    topic: pick(topic, ['id', 'title', 'proposition', 'sectionRefs']),
    inside: inside.map(e => pick(e, elementFields)),
    outside: map.elements.filter(e => outsideIds.has(e.id)).map(e => pick(e, elementFields)),
    relations: relations.map(({edge, role}) => ({...pick(edge, ['id', 'from', 'to', 'type', 'label', 'qualifiers', 'note']), role})),
    relationClasses, blockOrganization,
    representation: relations.length ? 'boundary-map' : 'boundary-summary',
  };
  if(plan && blockOrganization.state==='known') {
    const order=['what','how','prove','boundary'];
    result.blockEntries=blockOrganization.ids.map(id=>{const b=plan.blocks.find(x=>x.id===id);if(!b) throw new Error(`dangling topic block ${id}`);return {id:b.id,title:b.title,stage:b.stage};}).sort((a,b)=>order.indexOf(a.stage)-order.indexOf(b.stage));
  }
  return copyFrozen(result);
}
module.exports = { projectTopic };
