# Quick Edit Reference - Routine Configuration

## 📍 File Location
**Edit this file:** `public/routines.json` (in any text editor)

## ⏱️ Time Format
All times use **24-hour time** in `HH:MM` format:
- **06:30** = 6:30 AM
- **12:00** = noon
- **17:30** = 5:30 PM
- **20:30** = 8:30 PM

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

### ✏️ Edit Activity Name
```json
{
  "time": "07:30",
  "activity": "Ava & Dana School Time!",  // ← Change this
  "description": "Get in the Car",
  "icon": "emoji:🚗",
  "iconColor": "text-pink-500"
}
```

### ⏱️ Change Activity Time
```json
{
  "time": "17:30",        // ← Change time
  "activity": "Dinner Time!",
  "description": "Family Dinner",
  "icon": "ForkKnife",
  "iconColor": "text-red-500"
}
```

### 🎨 Change Icon
```json
{
  "time": "06:30",
  "activity": "Wake Up!",
  "description": "Time to get up",
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

### ➕ Add New Step (Keep Time Order!)
```json
{
  "time": "15:30",
  "activity": "Snack Time!",
  "description": "Eat a healthy snack",
  "icon": "emoji:🍎",
  "iconColor": "text-red-500"
}
// Add somewhere between other afternoon steps, SORTED BY TIME
```

### ❌ Remove Step
Just delete the entire `{ ... }` object. Example:

```json
// Delete this whole block:
{
  "time": "19:15",
  "activity": "Game Time!",
  "description": "Jack & Daddy Play Video Games",
  "icon": "GameController",
  "iconColor": "text-green-500"
}
```

## ✅ Checklist Before Saving

- [ ] All `{` have matching `}`
- [ ] All times are in correct order (06:30 before 06:40)
- [ ] Time format is 24-hour `HH:MM` (e.g., 06:30 or 17:30)
- [ ] Icon name is spelled correctly (Toilet not Tolit)
- [ ] Color class looks right (`text-blue-500` not `text-blue`)
- [ ] No trailing commas (last item doesn't have `,`)
- [ ] Using correct day name (Monday, Tuesday, etc.)

## 🧪 Test Your Changes

1. Edit `public/routines.json`
2. Save the file
3. Refresh your browser (Ctrl+R or Cmd+R)
4. **See error?** Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md#-error-handling)

## 📍 Where Each Routine Appears

```
weekdayMorning          → Monday through Friday mornings (school days)
saturdayMorning         → Saturday mornings (ballet)
eveningRoutines.Monday  → Monday evening (karate + bath)
eveningRoutines.Tuesday → Tuesday evening (games + family time)
eveningRoutines.Wednesday → Wednesday evening (karate + bath)
eveningRoutines.Thursday → Thursday evening (family time)
eveningRoutines.Friday  → Friday evening (games + bath)
eveningRoutines.Saturday → Saturday evening (games + no school next day)
eveningRoutines.Sunday  → Sunday evening (family time)
```

## 🆘 Need More Help?

See **[CONFIG_GUIDE.md](CONFIG_GUIDE.md)** for detailed examples and troubleshooting.
