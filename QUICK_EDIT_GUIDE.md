# Quick Edit Reference - Routine Configuration

## 📍 File Location
**Edit this file:** `public/routines.json` (in any text editor)

## ⏱️ Time Format

**Morning steps** use **24-hour time** in `HH:MM` format:
- **06:30** = 6:30 AM
- **12:00** = noon
- **17:30** = 5:30 PM
- **20:30** = 8:30 PM

**Evening steps** do **not** use clock times — they use `durationMinutes` (a positive number of minutes) instead.

## 🎨 Icon Reference

### Built-in Icons (Use Name Directly)
| Icon | Code | When to Use |
|------|------|------------|
| ⏰ | "Clock" | Waiting/countdown times |
| ✅ | "CheckCircle" | Completion, milestones |
| 🚽 | "Toilet" | Bathroom time |
| 🍴 | "ForkKnife" | Meals, eating |
| 🎒 | "Backpack" | Packing, getting ready |
| 🚌 | "Bus" | School, transportation |
| 💊 | "Pill" | Medicine, health |
| 📖 | "Book" | Reading, stories |
| 🎮 | "GameController" | Games, play time |
| 🌙 | "Moon" | Bedtime, sleep |

### Emoji Icons (Use `emoji:` Prefix)
| Example | Code |
|---------|------|
| 🚗 Car | "emoji:🚗" |
| 🩰 Ballet | "emoji:🩰" |
| 🥋 Karate | "emoji:🥋" |
| 🛁 Bath | "emoji:🛁" |
| 🧹 Cleaning | "emoji:🧹" |
| 👕 Clothes | "emoji:👕" |
| 👨‍👩‍👧‍👦 Family | "emoji:👨‍👩‍👧‍👦" |
| 🍎 Apple | "emoji:🍎" |

## 🌈 Color Reference

**Use any of these for "iconColor":**

| Dark Colors | Bright Colors | Neutral Colors |
|-------------|---------------|----------------|
| `text-blue-500` | `text-orange-500` | `text-amber-500` |
| `text-purple-500` | `text-yellow-500` | `text-gray-500` |
| `text-indigo-500` | `text-red-500` | `text-slate-500` |
| `text-violet-500` | `text-green-500` | `text-stone-500` |
| `text-teal-500` | `text-pink-500` | |

## 📝 Common Edits

### ✏️ Edit Activity Name (Morning)
```json
{
  "time": "07:30",
  "activity": "Ava & Dana School Time!",  // ← Change this
  "description": "Get in the Car",
  "icon": "emoji:🚗",
  "iconColor": "text-pink-500"
}
```

### ⏱️ Change Morning Activity Time
```json
{
  "time": "07:00",        // ← Change time (24-hour format)
  "activity": "Breakfast Time!",
  "description": "Eat Breakfast",
  "icon": "ForkKnife",
  "iconColor": "text-red-500"
}
```

### 🌙 Edit Evening Step Duration
```json
{
  "id": "dinner",
  "activity": "Dinner Time!",
  "description": "Family Dinner Together",
  "durationMinutes": 45,      // ← Change duration (in minutes)
  "icon": "ForkKnife",
  "iconColor": "text-red-500"
}
```

### 🎨 Change Icon
```json
{
  "icon": "Clock",           // ← Was "Toilet", now "Clock"
  "iconColor": "text-blue-500"
}
```

### 🌈 Change Color
```json
{
  "icon": "ForkKnife",
  "iconColor": "text-orange-500"  // ← Was text-red-500
}
```

### ➕ Add New Evening Step
1. Add to `eveningSteps` array:
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
2. Add `"snack"` to the relevant day in `eveningPresets`

### ❌ Remove Evening Step
1. Delete the step from `eveningSteps`
2. Remove its ID from all `eveningPresets` day arrays

Or, just toggle it off in the app UI before starting — no config edit needed!

## ✅ Checklist Before Saving

- [ ] All `{` have matching `}`
- [ ] Morning times are in correct order (06:30 before 06:40)
- [ ] Morning time format is 24-hour `HH:MM` (e.g., 06:30)
- [ ] Evening steps have `durationMinutes` (positive number)
- [ ] Evening step IDs are unique
- [ ] All preset IDs reference valid step IDs
- [ ] Icon names are spelled correctly (Toilet not Tolit)
- [ ] Color class looks right (`text-blue-500` not `text-blue`)
- [ ] No trailing commas (last item doesn't have `,`)

## 🧪 Test Your Changes

1. Edit `public/routines.json`
2. Save the file
3. Refresh your browser (Ctrl+R or Cmd+R)
4. **See error?** Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md#-error-handling)

## 📍 Where Each Routine Appears

```
weekdayMorning           → Monday through Friday mornings (school days)
saturdayMorning          → Saturday mornings (ballet)
eveningSteps             → All available evening activities (with durations)
eveningPresets.Monday     → Default selection for Monday (karate + bath)
eveningPresets.Tuesday    → Default selection for Tuesday (games + family time)
eveningPresets.Wednesday  → Default selection for Wednesday (karate + bath)
eveningPresets.Thursday   → Default selection for Thursday (family time)
eveningPresets.Friday     → Default selection for Friday (games + bath)
eveningPresets.Saturday   → Default selection for Saturday (games)
eveningPresets.Sunday     → Default selection for Sunday (family time)
```

**Note:** Evening presets are just defaults — you can toggle steps on/off and reorder them in the app each night before clicking Start.

## 🆘 Need More Help?

See **[CONFIG_GUIDE.md](CONFIG_GUIDE.md)** for detailed examples and troubleshooting.
