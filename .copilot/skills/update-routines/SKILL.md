---
name: update-routines
description: Manages the Morning Routine Timer app's routine schedule and TTS audio. Use this skill whenever the user wants to change, add, remove, or reorder routine steps, modify activity times, update evening or morning schedules, rename activities, or make any change to routines.json. Also use when the user mentions voice announcements, TTS audio, or audio files for the routine timer. This skill ensures audio files stay in sync with routine definitions — a step that's easy to forget and breaks voice on the Samsung TV if missed.
---

# Update Routines Skill

This skill handles changes to the Morning Routine Timer's schedule definitions and ensures the pre-generated TTS audio files stay synchronized. The app runs on a Samsung Frame TV where the browser doesn't support Web Speech API, so all voice announcements are pre-generated MP3 files that must match the routine definitions exactly.

## Key Files

| File | Purpose |
|------|---------|
| `public/routines.json` | All routine definitions (morning weekday/saturday, evening steps) |
| `scripts/generate-audio.mjs` | Reads routines.json → generates MP3s via macOS `say` + `ffmpeg` |
| `public/audio/manifest.json` | Generated mapping of audio keys → MP3 filenames |
| `public/audio/*.mp3` | Pre-generated announcement audio files (~35 files) |
| `src/App.tsx` | App logic — references routines and audio keys |
| `src/lib/routineLoader.ts` | Parses and validates routines.json at runtime |

## Routine Structure in routines.json

```json
{
  "weekdayMorning": [...],         // Shared/legacy morning (8 steps)
  "weekdayMorningJack": [...],     // Jack's individual morning (4 steps)
  "weekdayMorningTwins": [...],    // Ava & Dana's morning (4 steps)
  "saturdayMorning": [...],        // Saturday ballet morning (3 steps)
  "eveningSteps": [...],           // All possible evening steps with durations
  "eveningRoutine": [...]          // Ordered list of evening step IDs to use
}
```

Each morning step has: `time` (HH:MM), `activity`, `description`, `icon`, `iconColor`.
Each evening step has: `id`, `activity`, `description`, `durationMinutes`, `icon`, `iconColor`.

## How Audio Keys Map to Routines

The generation script creates audio keys based on array position:
- `morning.shared.step.{i}` — weekdayMorning steps
- `morning.saturday.step.{i}` — saturdayMorning steps
- `morning.jack.step.{i}` — weekdayMorningJack steps
- `morning.twins.step.{i}` — weekdayMorningTwins steps
- `evening.step.{i}` — eveningRoutine steps (by position in eveningRoutine array)
- Special keys: `morning.shared.get-ready`, `morning.shared.good-night`, `morning.shared.complete`, `morning.jack.get-ready`, `morning.twins.get-ready`, `evening.complete`

## Workflow: Making Routine Changes

Every time you modify `public/routines.json`, you MUST also regenerate the audio files. Here's the complete workflow:

### 1. Edit routines.json

Make the requested changes. Common operations:
- **Change a time**: Update the `time` field (24-hour "HH:MM" format)
- **Rename an activity**: Update `activity` and/or `description` fields
- **Add a step**: Add a new object to the appropriate array. For evening, also add the step's `id` to `eveningRoutine`
- **Remove a step**: Remove from the array. For evening, also remove from `eveningRoutine`
- **Reorder evening**: Change the order of IDs in `eveningRoutine`
- **Change duration**: Update `durationMinutes` on the evening step object

### 2. Regenerate audio files

```bash
npm run generate-audio
```

This reads routines.json and regenerates all MP3 files and the manifest. It uses macOS `say` (Samantha voice) and `ffmpeg`. The script skips files that already exist by default. Use `--force` to regenerate all files (required when activity text changes):

```bash
npm run generate-audio -- --force
```

### 3. Verify the output

After regeneration, check:
- The correct number of MP3 files were generated (count should match total steps + special messages)
- The manifest.json has entries for all audio keys
- Run `npm run build` to verify no build errors

### 4. Commit both routines.json AND audio files

Always commit `public/routines.json`, `public/audio/manifest.json`, and all `public/audio/*.mp3` files together in the same commit so they stay in sync.

## Audio Generation Details

The announcement text for each step follows these patterns (mirroring App.tsx logic):

- **Morning shared steps**: `"Time for {activity}! {description}"`
- **Morning Jack steps**: `"Jack: Time for {activity}! {description}"`
- **Morning twins steps**: `"Ava and Dana: Time for {activity}! {description}"`
- **Evening steps**: `"Time for {activity}! {description}. You have {N} minutes."`
- **Get ready messages**: `"{label}: Get ready to start your routine!"`
- **Complete messages**: Fixed strings (see generate-audio.mjs for exact text)

The label for twins in the app is "Ava and Dana" (not "Twins"). This matters because the audio text must match what users expect to hear.

## App.tsx Audio Key References

When updating App.tsx code that calls `speakMessage()`, the second argument is an array of audio keys. These keys must match entries in the manifest. The key format is position-based (e.g., `morning.jack.step.2`), not content-based, so reordering steps changes which key maps to which announcement.

## Icons

Icons come from Phosphor Icons (`@phosphor-icons/react`). Use icon names like `Toilet`, `ForkKnife`, `Backpack`, `Bus`, `CheckCircle`, `Pill`, `Book`, `Moon`. For emoji icons, use the format `"emoji:🧦"`.
