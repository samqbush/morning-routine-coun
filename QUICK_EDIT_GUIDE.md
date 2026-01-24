# Quick Edit Reference - Routine Configuration

## 📍 File Location
**Edit this file:** `public/routines.json` (in any text editor)

## ⏱️ Time Format
All times use **24-hour minutes** from midnight (0-1439):
- **6:30 AM** = 390 minutes
- **12:00 PM** = 720 minutes  
- **5:30 PM** = 1050 minutes
- **8:30 PM** = 1230 minutes

**Formula:** `(hours × 60) + minutes`

## 🎨 Icon Reference

### Built-in Icons (Use Name Directly)
| Icon | Code | When to Use |
|------|------|------------|
| ⏰ | `"Clock"` | Waiting/countdown times |
| ✅ | `"CheckCircle"` | Completion, milestones |
| 🚽 | `"Toilet"` | Bathroom time |
| 🍴 | `"ForkKnife"` | Meals, eating |
| 🎒 | `"Backpack"` | Packing, getting ready |
| 🚌 | `"Bus"` | School, transportation |
| 💊 | `"Pill"` | Medicine, health |
| 📖 | `"Book"` | Reading, stories |
| 🎮 | `"GameController"` | Games, play time |
| 🌙 | `"Moon"` | Bedtime, sleep |

### Emoji Icons (Use `emoji:` Prefix)
| Example | Code |
|---------|------|
| 🚗 Car | `"emoji:🚗"` |
| 🩰 Ballet | `"emoji:🩰"` |
| 🥋 Karate | `"emoji:🥋"` |
| 🛁 Bath | `"emoji:🛁"` |
| 🧹 Cleaning | `"emoji:🧹"` |
| 👕 Clothes | `"emoji:👕"` |
| 👨‍👩‍👧‍👦 Family | `"emoji:👨‍👩‍👧‍👦"` |
| 🍎 Apple | `"emoji:🍎"` |

## 🌈 Color Reference

**Use any of these for `"iconColor"`:**

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
  "time": "7:30 AM",
  "activity": "Ava & Dana School Time!",  // ← Change this
  "description": "Get in the Car",
  "timeInMinutes": 450,
  "icon": "emoji:🚗",
  "iconColor": "text-pink-500"
}
```

### ⏱️ Change Activity Time
```json
{
  "time": "5:30 PM",        // ← Change 12-hour display
  "activity": "Dinner Time!",
  "description": "Family Dinner",
  "timeInMinutes": 1050,    // ← Change minutes (5:30 = 5*60+30 = 330... wait!)
  "icon": "ForkKnife",
  "iconColor": "text-red-500"
}
```
**Math check:** 5:30 PM = 17:30 = (17×60)+30 = **1050** ✓

### 🎨 Change Icon
```json
{
  "time": "6:30 AM",
  "activity": "Wake Up!",
  "description": "Time to get up",
  "timeInMinutes": 390,
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
  "time": "3:30 PM",
  "activity": "Snack Time!",
  "description": "Eat a healthy snack",
  "timeInMinutes": 930,
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
  "time": "7:15 PM",
  "activity": "Game Time!",
  "description": "Jack & Daddy Play Video Games",
  "timeInMinutes": 1155,
  "icon": "GameController",
  "iconColor": "text-green-500"
}
```

## ✅ Checklist Before Saving

- [ ] All `{` have matching `}`
- [ ] All times are in correct order (6:30 AM before 6:40 AM)
- [ ] `timeInMinutes` matches the time display (6:30 AM = 390?)
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
