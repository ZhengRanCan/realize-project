'use strict';

const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

const fs = require('node:fs');
const assert = require('node:assert/strict');
const { projectL2Overview } = require('../app/shared/reading-projection');

const fixture = JSON.parse(fs.readFileSync(require.resolve('../samples/context-consumption/design-review.json'), 'utf8'));
const view = projectL2Overview(fixture.overview);
const sourceBlocks = fixture.overview.sections.flatMap((section) => section.blocks);
const projectedBlocks = view.sections.flatMap((section) => section.blocks);

assert.equal(view.kind, 'L2ViewModel');
assert.deepEqual(projectedBlocks.map((block) => block.id), sourceBlocks.map((block) => block.id), 'identity/order parity');
assert.deepEqual(projectedBlocks.map((block) => block.content), sourceBlocks.map((block) => block.content), 'generated content parity');
assert.deepEqual(projectedBlocks.map((block) => block.sourceRefs), sourceBlocks.map((block) => block.sources), 'source coverage parity');
assert.equal(projectedBlocks.find((block) => block.id === 'O-01').reviewObjectLinks.relation, 'related', 'review references are not evidence');
const absent = projectL2Overview({ sections: [{ id: 'what', title: 'x', purpose: 'x', blocks: [{ id: 'O-X', title: 'x', stage: 'what', defaultExpanded: true, sources: ['§1'], content: { type: 'prose' } }] }] }).sections[0].blocks[0];
const empty = projectL2Overview({ sections: [{ id: 'what', title: 'x', purpose: 'x', blocks: [{ id: 'O-Y', title: 'y', stage: 'what', defaultExpanded: true, sources: ['§1'], reviewObjects: [], content: { type: 'prose' } }] }] }).sections[0].blocks[0];
assert.equal(absent.reviewObjectLinks.state, 'unknown');
assert.equal(empty.reviewObjectLinks.state, 'empty');
const renderer = fs.readFileSync(require.resolve('../app/renderer/app.js'), 'utf8');
assert.doesNotMatch(renderer, /state\.model\.overview/);
assert.doesNotMatch(renderer, /block\.reviewObjects|block\.sources/);
console.log('reading runtime tests passed: 8 assertions');
