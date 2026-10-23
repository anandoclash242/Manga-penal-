import { Layer, LayerGroup, PartCategory } from '../types';

/**
 * Organizes a flat list of layers into a hierarchical tree grouped by category/parent.
 */
export function groupLayersByCategory(layers: Layer[]): LayerGroup[] {
  const groupsMap = new Map<PartCategory, Layer[]>();

  // Initialize known categories in standard drawing order (bottom to top)
  const categoryOrder: PartCategory[] = [
    'background',
    'body',
    'clothing',
    'face',
    'hair',
    'accessories',
    'prop',
    'custom',
  ];

  for (const cat of categoryOrder) {
    groupsMap.set(cat, []);
  }

  for (const layer of layers) {
    const list = groupsMap.get(layer.category) || [];
    list.push(layer);
    groupsMap.set(layer.category, list);
  }

  const result: LayerGroup[] = [];
  for (const cat of categoryOrder) {
    const groupLayers = groupsMap.get(cat) || [];
    if (groupLayers.length > 0) {
      const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
      result.push({
        id: `group-${cat}`,
        name: displayName,
        category: cat,
        collapsed: false,
        layers: groupLayers.sort((a, b) => a.order - b.order),
      });
    }
  }

  return result;
}

/**
 * Reorders a layer to a new index in the flat list.
 */
export function reorderLayers(
  layers: Layer[],
  sourceIndex: number,
  destinationIndex: number
): Layer[] {
  if (
    sourceIndex < 0 ||
    sourceIndex >= layers.length ||
    destinationIndex < 0 ||
    destinationIndex >= layers.length ||
    sourceIndex === destinationIndex
  ) {
    return layers;
  }

  const result = [...layers];
  const [removed] = result.splice(sourceIndex, 1);
  result.splice(destinationIndex, 0, removed);

  // Reassign order
  return result.map((layer, idx) => ({
    ...layer,
    order: idx,
  }));
}

/**
 * Duplicates a given layer with a new unique ID and title.
 */
export function duplicateLayer(layers: Layer[], layerId: string): Layer[] {
  const targetIndex = layers.findIndex((l) => l.id === layerId);
  if (targetIndex === -1) return layers;

  const target = layers[targetIndex];
  const copy: Layer = {
    ...target,
    id: `${target.id}-copy-${Date.now().toString(36)}`,
    name: `${target.name} (Copy)`,
    order: target.order + 1,
  };

  const nextLayers = [...layers];
  nextLayers.splice(targetIndex + 1, 0, copy);
  return nextLayers.map((l, idx) => ({ ...l, order: idx }));
}

/**
 * Deletes a layer by ID.
 */
export function deleteLayer(layers: Layer[], layerId: string): Layer[] {
  return layers
    .filter((l) => l.id !== layerId)
    .map((l, idx) => ({ ...l, order: idx }));
}

/**
 * Toggles visibility for a specific layer.
 */
export function toggleLayerVisibility(layers: Layer[], layerId: string): Layer[] {
  return layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l));
}

/**
 * Toggles lock state for a specific layer.
 */
export function toggleLayerLock(layers: Layer[], layerId: string): Layer[] {
  return layers.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l));
}

/**
 * Updates opacity of a layer.
 */
export function updateLayerOpacity(
  layers: Layer[],
  layerId: string,
  opacity: number
): Layer[] {
  const clamped = Math.max(0, Math.min(1, opacity));
  return layers.map((l) => (l.id === layerId ? { ...l, opacity: clamped } : l));
}

/**
 * Renames a layer.
 */
export function renameLayer(layers: Layer[], layerId: string, newName: string): Layer[] {
  const trimmed = newName.trim();
  if (!trimmed) return layers;
  return layers.map((l) => (l.id === layerId ? { ...l, name: trimmed } : l));
}
