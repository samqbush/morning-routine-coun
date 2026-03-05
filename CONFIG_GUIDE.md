# Routine Configuration Guide

The morning routine timer is now fully configurable through `public/routines.json`. No code changes needed!

## File Structure

```json
{
  "weekdayMorning": [ /* Monday-Friday morning steps */ ],
  "saturdayMorning": [ /* Saturday morning steps */ ],
  "eveningSteps": [ /* All available evening steps with durations */ ],
  "eveningPresets": {
    "Monday": [ /* Step IDs for Monday's default */ ],
    "Tuesday": [ /* Step IDs for Tuesday's default */ ],
    /* ... Wed, Thu, Fri, Sat, Sun ... */
  }
}
```

## Morning Step Definition

Each morning routine step requires these fields:

```json
{
  "time": "06:30",                     // 24-hour time (required)
  "activity": "Jack Wake Up!",          // Activity name (required)
  "description": "Brush Teeth & Potty", // Detailed description (required)
  "icon": "Toilet",                     // Icon name or emoji: prefix (required)
  "iconColor": "text-blue-500"          // Tailwind color class (required)
}
```

### Time Format (Morning Only)

Use 24-hour time in `HH:MM` format, for example `06:30` or `07:30`.

## Evening Step Definition

Evening steps use **duration in minutes** instead of fixed clock times. The user selects which steps to include and clicks "Start" to begin a countdown timer.

```json
{
  "id": "dinner",                        // Unique step ID (required)
  "activity": "Dinner Time!",            // Activity name (required)
  "description": "Family Dinner Together", // Description (required)
  "durationMinutes": 40,                 // Duration in minutes (required)
  "icon": "ForkKnife",                   // Icon name or emoji: prefix (required)
  "iconColor": "text-red-500"            // Tailwind color class (required)
}
```

## Evening Presets

Presets define which steps are selected by default for each day. They are arrays of step IDs:

```json
"eveningPresets": {
  "Monday": ["karate-prep", "karate", "dinner-prep", "dinner", "cleanup", "outfit", "bath", "twins-ready", "story", "jack-bed", "all-bed"],
  "Tuesday": ["dinner-prep", "dinner", "cleanup", "outfit", "family-activity", "twins-ready", "story", "game-time", "jack-bed", "all-bed"]
}
```

The user can toggle steps on/off and reorder them before starting the routine.

### Icon Options

**Built-in Phosphor Icons** (use icon name directly):
- `Clock`, `CheckCircle`, `Toilet`, `ForkKnife`, `Backpack`, `Bus`, `Pill`, `Book`, `GameController`, `Moon`

**Emoji** (prefix with `emoji:`):
- `"emoji:🚗"`, `"emoji:🩰"`, `"emoji:🥋"`, `"emoji:🛁"`, `"emoji:🧹"`, `"emoji:👕"`, `"emoji:👨‍👩‍👧‍👦"`

### Color Classes

Common Tailwind text colors:
- `text-blue-500`, `text-orange-500`, `text-purple-500`, `text-yellow-500`
- `text-pink-500`, `text-green-500`, `text-red-500`, `text-amber-500`
- `text-teal-500`, `text-indigo-500`, `text-violet-500`

## Example: Adding a New Evening Step

1. Add the step to the **`eveningSteps`** array:

```json
{
  "id": "snack",
  "activity": "Snack Time!",
  "description": "Eat a healthy snack",
  "durationMinutes": 15,
  "icon": "emoji:🍎",
  "iconColor": "text-red-500"
}
```

2. Add the step ID to the relevant **`eveningPresets`** day arrays:

```json
"Tuesday": ["dinner-prep", "snack", "dinner", "cleanup", ...]
```

3. Save the file and refresh your browser (no rebuild needed in dev mode)

## Example: Changing a Duration

To change "Dinner Time" from 40 to 45 minutes:

1. Find the step with `"id": "dinner"` in `eveningSteps`
2. Change `"durationMinutes": 40` → `"durationMinutes": 45`

## Example: Removing an Evening Step

1. Remove the step object from the `eveningSteps` array
2. Remove its ID from all `eveningPresets` day arrays

## Validation & Error Messages

If `public/routines.json` has errors, the app displays a **red error screen** with:
- The specific validation error
- Which field is missing or invalid
- Instructions to fix the issue

**No silent fallbacks** — you'll always know if config is broken.

## Reloading Changes

- **Dev mode**: Refresh browser (changes apply instantly)
- **Production**: Run `npm run build` then `npm run preview` to test, or push to GitHub to deploy

## Parent-Friendly Tips

- **Copy entire blocks** when adding similar steps
- **Evening steps can be toggled on/off** in the app before starting — no need to edit config for one-night changes
- **Use emoji for clarity** — parents can visually scan emoji icons when editing
- **Test in Debug Mode** — click "Test Mode" button in the app to jump to any step and verify timings

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App shows red error screen | Check error message; verify JSON syntax (use [jsonlint.com](https://jsonlint.com)) |
| Morning step doesn't appear | Check the time format is 24-hour `HH:MM` and steps are ordered by time |
| Evening step not in preset | Add its `id` to the appropriate day in `eveningPresets` |
| Icon doesn't display | Verify icon name is spelled correctly or emoji: prefix is used |
| Color looks wrong | Check Tailwind color class spelling (e.g., `text-blue-500` not `text-blue500`) |
