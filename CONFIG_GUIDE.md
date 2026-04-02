# Routine Configuration Guide

The morning routine timer is now fully configurable through `public/routines.json`. No code changes needed!

## File Structure

```json
{
  "weekdayMorning": [ /* Monday-Friday morning steps */ ],
  "saturdayMorning": [ /* Saturday morning steps */ ],
  "eveningSteps": [ /* All available evening steps with durations */ ],
  "eveningRoutine": [ /* Ordered step IDs for the nightly routine */ ]
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

Evening steps use **duration in minutes** instead of fixed clock times. The routine auto-starts when the TV launches at 5:00 PM — no user interaction needed.

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

## Evening Routine

The `eveningRoutine` array defines the ordered sequence of step IDs used every night:

```json
"eveningRoutine": ["dinner-prep", "get-drink", "dinner", "cleanup", "outfit", "bath", "family-activity", "bedtime-prep", "story", "all-bed"]
```

A **swap button** (🛁 ↔ 👨‍👩‍👧‍👦) in the app lets you trade bath and family activity on any given night.

### Icon Options

**Built-in Phosphor Icons** (use icon name directly):
- `Clock`, `CheckCircle`, `Toilet`, `ForkKnife`, `Backpack`, `Bus`, `Pill`, `Book`, `Moon`

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

2. Add the step ID to the **`eveningRoutine`** array:

```json
"eveningRoutine": ["dinner-prep", "get-drink", "snack", "dinner", "cleanup", ...]
```

3. Save the file and refresh your browser (no rebuild needed in dev mode)

## Example: Changing a Duration

To change "Dinner Time" from 40 to 45 minutes:

1. Find the step with `"id": "dinner"` in `eveningSteps`
2. Change `"durationMinutes": 40` → `"durationMinutes": 45`

## Example: Removing an Evening Step

1. Remove the step object from the `eveningSteps` array
2. Remove its ID from the `eveningRoutine` array

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
- **Evening steps can be swapped** (bath ↔ family activity) using the swap button in the app — no config edit needed
- **Use emoji for clarity** — parents can visually scan emoji icons when editing
- **Test in Debug Mode** — click "Test Mode" button in the app to jump to any step and verify timings

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App shows red error screen | Check error message; verify JSON syntax (use [jsonlint.com](https://jsonlint.com)) |
| Morning step doesn't appear | Check the time format is 24-hour `HH:MM` and steps are ordered by time |
| Evening step not in routine | Add its `id` to the `eveningRoutine` array |
| Icon doesn't display | Verify icon name is spelled correctly or emoji: prefix is used |
| Color looks wrong | Check Tailwind color class spelling (e.g., `text-blue-500` not `text-blue500`) |
