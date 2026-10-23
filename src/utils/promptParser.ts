import { PartCategory, SegmentationDetail, ProcessingMode } from '../types';

export interface ParsedPromptResult {
  detectedCategories: PartCategory[];
  inferredDetailLevel: SegmentationDetail;
  suggestedParts: string[];
  suggestedExclusions: string[];
  reconstructionRequested: boolean;
  backgroundPreservationRequested: boolean;
}

const CATEGORY_KEYWORDS: Record<PartCategory, string[]> = {
  hair: ['hair', 'bangs', 'ponytail', 'twintail', 'braid', 'locks', 'back hair', 'side hair', 'ahoge'],
  face: ['face', 'eye', 'pupil', 'iris', 'eyebrow', 'mouth', 'lip', 'nose', 'teeth', 'ear', 'cheek', 'skin'],
  body: ['body', 'head', 'neck', 'torso', 'chest', 'arm', 'hand', 'finger', 'leg', 'foot', 'feet'],
  clothing: ['shirt', 'sweater', 'hoodie', 'jacket', 'coat', 'collar', 'sleeve', 'cuff', 'pants', 'skirt', 'dress', 'uniform', 'tie', 'ribbon', 'belt', 'shoes', 'boots', 'socks', 'gloves'],
  accessories: ['glasses', 'earring', 'necklace', 'choker', 'hat', 'cap', 'hairpin', 'headband', 'ring', 'bracelet', 'piercing', 'mask', 'scarf'],
  background: ['background', 'scenery', 'sky', 'room', 'backdrop', 'bg'],
  prop: ['weapon', 'sword', 'blade', 'katana', 'gun', 'staff', 'wand', 'shield', 'book', 'phone', 'bag', 'cup'],
  custom: ['custom', 'other'],
};

/**
 * Analyzes natural language prompt text and generates structured segmentation directives.
 */
export function parseUserPrompt(promptText: string): ParsedPromptResult {
  const normalized = promptText.toLowerCase();

  const detectedCategories: PartCategory[] = [];
  const suggestedParts: string[] = [];
  const suggestedExclusions: string[] = [];

  // Match categories
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [PartCategory, string[]][]) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        if (!detectedCategories.includes(cat)) {
          detectedCategories.push(cat);
        }
        if (!suggestedParts.includes(kw)) {
          suggestedParts.push(kw);
        }
      }
    }
  }

  // Determine detail level
  let inferredDetailLevel: SegmentationDetail = 'detailed';
  if (
    normalized.includes('individual lock') ||
    normalized.includes('finger') ||
    normalized.includes('iris') ||
    normalized.includes('pupil') ||
    normalized.includes('ultra') ||
    normalized.includes('eyelash') ||
    normalized.includes('teeth')
  ) {
    inferredDetailLevel = 'ultra';
  } else if (
    normalized.includes('basic') ||
    normalized.includes('just the character') ||
    normalized.includes('major parts') ||
    normalized.includes('head from body')
  ) {
    inferredDetailLevel = 'basic';
  }

  // Detect exclusions (e.g., "without background", "exclude eyes", "don't extract legs")
  const excludeMatches = normalized.match(/(?:without|exclude|except|no|don't extract)\s+([a-z\s,]+)(?:\.|$)/i);
  if (excludeMatches && excludeMatches[1]) {
    const rawExcludes = excludeMatches[1].split(/,|and/);
    for (const item of rawExcludes) {
      const clean = item.trim();
      if (clean && clean.length > 2) {
        suggestedExclusions.push(clean);
      }
    }
  }

  const reconstructionRequested =
    normalized.includes('reconstruct') ||
    normalized.includes('inpaint') ||
    normalized.includes('hidden') ||
    normalized.includes('occluded') ||
    normalized.includes('missing region');

  const backgroundPreservationRequested =
    normalized.includes('keep background') ||
    normalized.includes('preserve background') ||
    normalized.includes('save background');

  return {
    detectedCategories: detectedCategories.length > 0 ? detectedCategories : ['hair', 'face', 'clothing', 'body'],
    inferredDetailLevel,
    suggestedParts,
    suggestedExclusions,
    reconstructionRequested,
    backgroundPreservationRequested,
  };
}
