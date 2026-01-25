# Routine Configuration Guide

The morning routine timer is now fully configurable through `public/routines.json`. No code changes needed!

## File Structure

```json
{
  "weekdayMorning": [ /* Monday-Friday morning steps */ ],
  "saturdayMorning": [ /* Saturday morning steps */ ],
  "eveningRoutines": {
    "Monday": [ /* Monday evening steps */ ],
    "Tuesday": [ /* Tuesday evening steps */ ],
    /* ... Wed, Thu, Fri, Sat, Sun ... */
  }
}
```

## Step Definition

Each routine step requires these fields:

```json
{
  "time": "6:30 AM",                    // Display time (required)
  "activity": "Jack Wake Up!",          // Activity name (required)
  "description": "Brush Teeth & Potty", // Detailed description (required)
  "timeInMinutes": 390,                 // Minutes since midnight (0-1439, required)
  "icon": "Toilet",                     // Icon name or emoji: prefix (required)
  "iconColor": "text-blue-500"          // Tailwind color class (required)
}
```

### Time Calculation

`timeInMinutes` = (hours × 60) + minutes in 24-hour format:
- 6:30 AM = (6 × 60) + 30 = **390**
- 5:00 PM = (17 × 60) + 0 = **1020**
- 8:30 PM = (20 × 60) + 30 = **1230**

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

## Example: Adding a New Step

To add "Snack Time" at 3:30 PM on Tuesday with an apple emoji:

1. Find **eveningRoutines.Tuesday** in `public/routines.json`
2. Add this step in the correct time order:

```json
{
  "time": "3:30 PM",
  "activity": "Snack Time!",
  "description": "Eat a healthy snack",
  "timeInMinutes": 930,
  "icon": "emoji:🍎",
  "iconColor": "text-red-500"
}
```

3. Save the file and refresh your browser (no rebuild needed in dev mode)

## Example: Changing a Time

To move "Dinner Time" from 5:30 PM to 5:45 PM:

1. Find the **"Dinner Time!"** step in the relevant days
2. Change `"time": "5:30 PM"` → `"time": "5:45 PM"`
3. Change `"timeInMinutes": 1050` → `"timeInMinutes": 1065`

## Example: Removing a Step

Simply delete the entire step object from the array. For example, to remove "Game Time" on Tuesday:

```json
// Remove this entire object from Tuesday's array:
{
  "time": "7:15 PM",
  "activity": "Game Time!",
  ...
}
```

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

- **Copy entire blocks** when adding similar days (e.g., copy Monday's routines to Wednesday, then modify)
- **Keep times in order** — steps should be sorted by time from earliest to latest
- **Use emoji for clarity** — parents can visually scan emoji icons when editing
- **Test in Debug Mode** — click "Test Mode" button in the app to jump to any step and verify timings

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App shows red error screen | Check error message; verify JSON syntax (use [jsonlint.com](https://jsonlint.com)) |
| Step doesn't appear | Check `timeInMinutes` is in correct range (0-1439) and steps are ordered by time |
| Icon doesn't display | Verify icon name is spelled correctly or emoji: prefix is used |
| Color looks wrong | Check Tailwind color class spelling (e.g., `text-blue-500` not `text-blue500`) |
