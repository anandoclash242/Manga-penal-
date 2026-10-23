import test from 'node:test';
import assert from 'node:assert/strict';
import {
  groupLayersByCategory,
  reorderLayers,
  duplicateLayer,
  deleteLayer,
  toggleLayerVisibility,
  updateLayerOpacity,
  renameLayer,
} from './layerTree';
import { Layer } from '../types';

const mockLayers: Layer[] = [
  {
    id: 'layer-bg',
    name: 'Background',
    category: 'background',
    order: 0,
    visible: true,
    locked: false,
    opacity: 1,
    bounds: { x: 0, y: 0, width: 500, height: 500 },
    transparentPngUrl: 'data:image/png;base64,...',
  },
  {
    id: 'layer-hair',
    name: 'Hair - Bangs',
    category: 'hair',
    order: 1,
    visible: true,
    locked: false,
    opacity: 1,
    bounds: { x: 100, y: 50, width: 200, height: 150 },
    transparentPngUrl: 'data:image/png;base64,...',
  },
  {
    id: 'layer-eye',
    name: 'Left Eye',
    category: 'face',
    order: 2,
    visible: true,
    locked: false,
    opacity: 1,
    bounds: { x: 150, y: 120, width: 40, height: 30 },
    transparentPngUrl: 'data:image/png;base64,...',
  },
];

test('groupLayersByCategory groups layers correctly according to category order', () => {
  const groups = groupLayersByCategory(mockLayers);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].category, 'background');
  assert.equal(groups[1].category, 'face');
  assert.equal(groups[2].category, 'hair');
  assert.equal(groups[2].layers[0].name, 'Hair - Bangs');
});

test('reorderLayers safely shifts layers and recalculates sequential order', () => {
  const reordered = reorderLayers(mockLayers, 2, 0);
  assert.equal(reordered[0].id, 'layer-eye');
  assert.equal(reordered[0].order, 0);
  assert.equal(reordered[1].id, 'layer-bg');
  assert.equal(reordered[1].order, 1);
  assert.equal(reordered[2].id, 'layer-hair');
  assert.equal(reordered[2].order, 2);
});

test('duplicateLayer clones layer with distinct ID and (Copy) in title', () => {
  const next = duplicateLayer(mockLayers, 'layer-hair');
  assert.equal(next.length, 4);
  assert.ok(next[2].name.includes('(Copy)'));
  assert.notEqual(next[2].id, 'layer-hair');
});

test('deleteLayer removes layer and updates order indexing', () => {
  const next = deleteLayer(mockLayers, 'layer-hair');
  assert.equal(next.length, 2);
  assert.equal(next[0].id, 'layer-bg');
  assert.equal(next[1].id, 'layer-eye');
  assert.equal(next[1].order, 1);
});

test('toggleLayerVisibility toggles layer visibility', () => {
  const toggled = toggleLayerVisibility(mockLayers, 'layer-eye');
  assert.equal(toggled[2].visible, false);
});

test('updateLayerOpacity clamps opacity between 0 and 1', () => {
  const updated1 = updateLayerOpacity(mockLayers, 'layer-eye', 0.5);
  assert.equal(updated1[2].opacity, 0.5);

  const updated2 = updateLayerOpacity(mockLayers, 'layer-eye', 1.8);
  assert.equal(updated2[2].opacity, 1.0);

  const updated3 = updateLayerOpacity(mockLayers, 'layer-eye', -0.5);
  assert.equal(updated3[2].opacity, 0.0);
});

test('renameLayer trims whitespace and preserves non-empty names', () => {
  const renamed = renameLayer(mockLayers, 'layer-eye', '  Anime Right Eye  ');
  assert.equal(renamed[2].name, 'Anime Right Eye');

  const unchanged = renameLayer(mockLayers, 'layer-eye', '   ');
  assert.equal(unchanged[2].name, 'Left Eye');
});
