import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUserPrompt } from './promptParser';

test('parseUserPrompt accurately extracts categories and parts from custom prompt', () => {
  const prompt =
    'Separate the character black hair into bangs, left hair, and back hair. Extract both eyes, then separate the sweater, collar, arms, and hands.';
  const result = parseUserPrompt(prompt);

  assert.ok(result.detectedCategories.includes('hair'));
  assert.ok(result.detectedCategories.includes('face'));
  assert.ok(result.detectedCategories.includes('clothing'));
  assert.ok(result.detectedCategories.includes('body'));
  assert.ok(result.suggestedParts.includes('bangs'));
  assert.ok(result.suggestedParts.includes('sweater'));
  assert.ok(result.suggestedParts.includes('collar'));
});

test('parseUserPrompt infers ultra detail level when sub-features requested', () => {
  const prompt = 'Extract individual eyelashes, pupil, iris, and separate fingers.';
  const result = parseUserPrompt(prompt);
  assert.equal(result.inferredDetailLevel, 'ultra');
});

test('parseUserPrompt identifies reconstruction requests', () => {
  const prompt = 'Separate character from background and reconstruct occluded hair behind shoulder.';
  const result = parseUserPrompt(prompt);
  assert.equal(result.reconstructionRequested, true);
});

test('parseUserPrompt identifies exclusions', () => {
  const prompt = 'Extract clothing and hair without background, eyes.';
  const result = parseUserPrompt(prompt);
  assert.ok(result.suggestedExclusions.some((e) => e.includes('background') || e.includes('eyes')));
});
