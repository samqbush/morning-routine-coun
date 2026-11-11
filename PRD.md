# Morning Routine Timer for Kids

A visual countdown timer displayed on Samsung TV to help children follow their morning school routine with clear timing and activity guidance.

**Experience Qualities**: 
1. **Playful** - Bright colors and engaging visuals that make routine fun for kids
2. **Clear** - Large text and obvious progression that's readable from across the room
3. **Motivating** - Visual feedback and countdown creates urgency and accomplishment

**Complexity Level**: Light Application (multiple features with basic state)
- Simple timer functionality with predefined schedule, visual progress indicators, and clear activity display optimized for TV viewing distance.

## Essential Features

### Countdown Timer Display
- **Functionality**: Shows time remaining until next activity with large, readable text
- **Purpose**: Creates urgency and helps kids understand time management
- **Trigger**: Automatically starts based on current time or manual start button
- **Progression**: Live countdown updates → Activity change notification → Next activity display
- **Success Criteria**: Timer accurately counts down and transitions between activities

### Activity Progress Visualization
- **Functionality**: Shows current activity, next activity, and overall progress through routine
- **Purpose**: Provides context and motivation by showing progress and what's coming next
- **Trigger**: Updates automatically as timer progresses through schedule
- **Progression**: Current activity highlighted → Progress bar updates → Next activity preview
- **Success Criteria**: Clear visual indication of where kids are in their routine

### Large TV-Optimized Display
- **Functionality**: Typography and layout designed for viewing from across the room
- **Purpose**: Ensures readability on large screen from typical TV viewing distance
- **Trigger**: Responsive design automatically optimizes for large displays
- **Progression**: Content scales appropriately → High contrast maintained → Text remains crisp
- **Success Criteria**: All text and elements clearly visible from 8+ feet away

### Schedule Management
- **Functionality**: Predefined morning routine with specific times and activities
- **Purpose**: Eliminates guesswork and provides structure for morning preparation
- **Trigger**: Loads schedule on app start
- **Progression**: Schedule data loads → Current time compared → Appropriate activity displayed
- **Success Criteria**: Correct activity shown based on current time

## Edge Case Handling

- **Late Start**: If accessed after 7:15, shows "School Time!" message with encouragement
- **Early Access**: If accessed before 6:45, shows "Good Morning! Get Ready to Start!" with countdown to first activity
- **Weekend/Holiday**: Shows different message encouraging rest or family time
- **Manual Override**: Reset button to restart routine from beginning if needed

## Design Direction

The design should feel energetic and encouraging like a friendly coach, with bright morning colors that feel fresh and motivating while maintaining high contrast for TV readability.

## Color Selection

Triadic color scheme to create energy and visual interest while maintaining clear hierarchy.

- **Primary Color**: Bright Morning Blue (oklch(0.65 0.15 250)) - communicates alertness and new day energy
- **Secondary Colors**: Sunny Yellow (oklch(0.85 0.12 90)) for highlights and Warm Orange (oklch(0.75 0.15 50)) for urgency/action items
- **Accent Color**: Fresh Green (oklch(0.70 0.13 140)) - success and completion indicators
- **Foreground/Background Pairings**: 
  - Background White (oklch(0.98 0 0)): Dark Navy text (oklch(0.20 0.05 250)) - Ratio 8.2:1 ✓
  - Primary Blue (oklch(0.65 0.15 250)): White text (oklch(0.98 0 0)) - Ratio 4.9:1 ✓
  - Accent Green (oklch(0.70 0.13 140)): White text (oklch(0.98 0 0)) - Ratio 4.1:1 ✓
  - Secondary Yellow (oklch(0.85 0.12 90)): Dark Navy text (oklch(0.20 0.05 250)) - Ratio 7.1:1 ✓

## Font Selection

Bold, friendly sans-serif fonts that convey energy and are highly legible at distance - using Inter for its excellent readability and modern feel.

- **Typographic Hierarchy**: 
  - H1 (Countdown Timer): Inter Black/72px/tight letter spacing for maximum impact
  - H2 (Current Activity): Inter Bold/48px/normal spacing for clear activity identification  
  - H3 (Next Activity): Inter Semibold/32px/relaxed spacing for preview information
  - Body (Instructions): Inter Medium/24px/relaxed spacing for detailed descriptions

## Animations

Gentle, purposeful animations that guide attention without being distracting during morning routine focus.

- **Purposeful Meaning**: Smooth transitions between activities maintain calm energy while countdown pulses create appropriate urgency
- **Hierarchy of Movement**: Timer gets subtle pulse animation, activity transitions slide smoothly, progress indicators fill with satisfying motion

## Component Selection

- **Components**: Card for main display area, Progress for routine visualization, Button for manual controls, Badge for time displays
- **Customizations**: Extra large text variants, TV-safe color combinations, simplified touch targets for remote control
- **States**: Timer running/paused, activity transitions, completion celebrations, early/late states
- **Icon Selection**: Clock for time, CheckCircle for completed tasks, ArrowRight for progression, Play/Pause for controls
- **Spacing**: Generous padding (8-12 Tailwind units) for TV viewing, consistent 6-unit gaps between major sections
- **Mobile**: While optimized for TV, maintains functionality on mobile with appropriately scaled text and touch targets