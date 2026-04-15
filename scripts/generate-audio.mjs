#!/usr/bin/env node

/**
 * Generate pre-recorded TTS audio files from routines.json.
 *
 * Reads routine definitions, constructs every announcement string
 * (mirroring the logic in App.tsx), and produces MP3 files via
 * macOS `say` (Samantha voice) + `ffmpeg`.
 *
 * Outputs:
 *   public/audio/*.mp3
 *   public/audio/manifest.json   — { key: { text, file } }
 *
 * Usage:  npm run generate-audio
 *         npm run generate-audio -- --force   (regenerate all, even existing)
 * Requires: macOS with `say` command, `ffmpeg` installed
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const AUDIO_DIR = join(ROOT, 'public', 'audio');
const ROUTINES_PATH = join(ROOT, 'public', 'routines.json');

function keyToFilename(key) {
  return key.replace(/\./g, '-') + '.mp3';
}

const force = process.argv.includes('--force');
let failures = 0;

// Load existing manifest to detect text changes (stale audio)
const MANIFEST_PATH = join(AUDIO_DIR, 'manifest.json');
let previousManifest = {};
try {
  if (existsSync(MANIFEST_PATH)) {
    previousManifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  }
} catch {}

function generateMp3(text, filename) {
  const aiffPath = join(AUDIO_DIR, filename.replace('.mp3', '.aiff'));
  const mp3Path = join(AUDIO_DIR, filename);

  if (existsSync(mp3Path) && !force) {
    // Regenerate if the announcement text has changed
    const prevEntry = Object.values(previousManifest).find(e => e.file === filename);
    if (prevEntry && prevEntry.text === text) {
      console.log(`  ✓ exists: ${filename}`);
      return;
    }
    if (prevEntry) {
      console.log(`  ↻ text changed, regenerating: ${filename}`);
    }
  }

  try {
    execFileSync('say', ['-v', 'Samantha', '-o', aiffPath, text]);
    execFileSync('ffmpeg', ['-y', '-i', aiffPath, '-ab', '64k', '-ac', '1', '-ar', '22050', mp3Path], { stdio: 'pipe' });
    if (existsSync(aiffPath)) unlinkSync(aiffPath);
    console.log(`  ✓ generated: ${filename}`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${filename} — ${err.message}`);
    if (existsSync(aiffPath)) unlinkSync(aiffPath);
    failures++;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

mkdirSync(AUDIO_DIR, { recursive: true });

const routines = JSON.parse(readFileSync(ROUTINES_PATH, 'utf-8'));
const manifest = {};

function add(key, text) {
  if (manifest[key]) return; // deduplicate
  const filename = keyToFilename(key);
  manifest[key] = { text, file: filename };
}

// ─── Morning: shared/legacy mode ──────────────────────────────────────

add('morning.shared.get-ready',
  'Good morning! Get ready to start your routine!');

add('morning.shared.good-night',
  'Good night! See you tomorrow morning!');

add('morning.shared.complete',
  "Great job! Now it's Sam and Jill time. Mommy and Daddy can relax together!");

// Weekday morning steps (shared mode)
routines.weekdayMorning.forEach((step, i) => {
  const msg = `Time for ${step.activity}! ${step.description}`;
  add(`morning.shared.step.${i}`, msg);
});

// Saturday morning steps
routines.saturdayMorning.forEach((step, i) => {
  const msg = `Time for ${step.activity}! ${step.description}`;
  add(`morning.saturday.step.${i}`, msg);
});

// ─── Morning: dual mode (Jack) ───────────────────────────────────────

add('morning.jack.get-ready',
  'Jack: Get ready to start your routine!');

(routines.weekdayMorningJack || []).forEach((step, i) => {
  const msg = `Jack: Time for ${step.activity}! ${step.description}`;
  add(`morning.jack.step.${i}`, msg);
});

// ─── Morning: dual mode (Ava and Dana) ───────────────────────────────

add('morning.twins.get-ready',
  'Ava and Dana: Get ready to start your routine!');

(routines.weekdayMorningTwins || []).forEach((step, i) => {
  const msg = `Ava and Dana: Time for ${step.activity}! ${step.description}`;
  add(`morning.twins.step.${i}`, msg);
});

// ─── Evening ─────────────────────────────────────────────────────────

const eveningStepMap = {};
for (const step of routines.eveningSteps) {
  eveningStepMap[step.id] = step;
}

routines.eveningRoutine.forEach((stepId, i) => {
  const step = eveningStepMap[stepId];
  if (!step) {
    console.error(`  ✗ ERROR: eveningRoutine references unknown step ID "${stepId}" at index ${i}`);
    failures++;
    return;
  }
  const msg = `Time for ${step.activity}! ${step.description}. You have ${step.durationMinutes} minutes.`;
  add(`evening.step.${i}`, msg);
});

add('evening.complete',
  "Great job! The evening routine is complete. Now it's Sam and Jill time!");

// ─── Generate ─────────────────────────────────────────────────────────

const entries = Object.entries(manifest);
console.log(`\nGenerating ${entries.length} audio files...\n`);

for (const [key, { text, file }] of entries) {
  generateMp3(text, file);
}

// Write manifest
writeFileSync(
  join(AUDIO_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n'
);

console.log(`\n✓ Manifest written: public/audio/manifest.json (${entries.length} entries)`);

if (failures > 0) {
  console.error(`\n✗ ${failures} file(s) failed to generate. Fix errors above and re-run.`);
  process.exit(1);
}

console.log('Done!\n');
