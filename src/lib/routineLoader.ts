import React from 'react';
import {
  Clock,
  CheckCircle,
  Toilet,
  ForkKnife,
  Backpack,
  Bus,
  Pill,
  Book,
  GameController,
  Moon,
} from '@phosphor-icons/react';
import routinesConfig from '../../public/routines.json';

export interface RoutineStep {
  time: string;
  activity: string;
  description: string;
  timeInMinutes: number;
  icon: React.ComponentType<any>;
  iconColor: string;
  routineType: 'morning' | 'evening';
}

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

// Map icon name strings to Phosphor icon components
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Clock,
  CheckCircle,
  Toilet,
  ForkKnife,
  Backpack,
  Bus,
  Pill,
  Book,
  GameController,
  Moon,
};

// Recommended Tailwind text color classes for routine step icons
const VALID_ICON_COLORS = [
  'text-blue-500',
  'text-orange-500',
  'text-purple-500',
  'text-yellow-500',
  'text-pink-500',
  'text-green-500',
  'text-red-500',
  'text-amber-500',
  'text-teal-500',
  'text-indigo-500',
  'text-violet-500',
];

/**
 * Validates icon reference (either icon name or emoji)
 */
function parseIcon(iconRef: string): React.ComponentType<any> {
  if (iconRef.startsWith('emoji:')) {
    const emoji = iconRef.slice(6);
    // Return a component that renders the emoji and respects size/className props
    return (props: any) => {
      const { size, className = '', ...restProps } = props || {};

      // Map a numeric size (similar to Phosphor) to a Tailwind text size class
      let sizeClass = 'text-6xl';
      if (typeof size === 'number') {
        if (size <= 16) sizeClass = 'text-lg';
        else if (size <= 24) sizeClass = 'text-xl';
        else if (size <= 32) sizeClass = 'text-2xl';
        else if (size <= 40) sizeClass = 'text-3xl';
        else if (size <= 48) sizeClass = 'text-4xl';
        else if (size <= 56) sizeClass = 'text-5xl';
        else sizeClass = 'text-6xl';
      }

      const combinedClassName = `${sizeClass} ${className}`.trim();
      return React.createElement('div', { className: combinedClassName, ...restProps }, emoji);
    };
  }

  if (!(iconRef in ICON_MAP)) {
    throw new Error(
      `Invalid icon name: "${iconRef}". Must be one of: ${Object.keys(ICON_MAP).join(', ')}, or use emoji: prefix (e.g., "emoji:🚗")`
    );
  }

  return ICON_MAP[iconRef];
}

/**
 * Validates a single routine step from config
 */
function validateStep(step: any, day: string, index: number): void {
  const requiredFields = ['time', 'activity', 'description', 'timeInMinutes', 'icon', 'iconColor'];

  for (const field of requiredFields) {
    if (!(field in step)) {
      throw new Error(`Missing required field "${field}" in ${day} step ${index}`);
    }
  }

  if (typeof step.timeInMinutes !== 'number' || step.timeInMinutes < 0 || step.timeInMinutes >= 1440) {
    throw new Error(
      `Invalid timeInMinutes "${step.timeInMinutes}" in ${day} step ${index}. Must be a number between 0 and 1439`
    );
  }

  // Strict check to avoid false positives (e.g., "text-blue-500-something")
  if (!VALID_ICON_COLORS.includes(step.iconColor)) {
    // Allow custom color classes, but warn if the pattern looks off
    const isTailwindTextColor = /^text-[a-z-]+-\d{3}$/.test(step.iconColor);
    if (!isTailwindTextColor) {
      console.warn(
        `Unusual iconColor in ${day} step ${index}: "${step.iconColor}". Expected Tailwind class like "text-blue-500".`
      );
    } else {
      console.warn(
        `Non-standard iconColor in ${day} step ${index}: "${step.iconColor}". Not in recommended set, using as-is.`
      );
    }
  }
}

/**
 * Loads and validates the routines config file
 * Throws detailed error if config is invalid
 */
export function loadRoutines(): {
  weekdayMorning: RoutineStep[];
  saturdayMorning: RoutineStep[];
  eveningRoutines: Record<DayOfWeek, RoutineStep[]>;
} {
  try {
    // Validate config structure
    if (!routinesConfig || typeof routinesConfig !== 'object') {
      throw new Error('Invalid routines config: must be a JSON object');
    }

    const { weekdayMorning, saturdayMorning, eveningRoutines } = routinesConfig as any;

    if (!Array.isArray(weekdayMorning)) {
      throw new Error('Invalid routines config: "weekdayMorning" must be an array');
    }

    if (!Array.isArray(saturdayMorning)) {
      throw new Error('Invalid routines config: "saturdayMorning" must be an array');
    }

    if (!eveningRoutines || typeof eveningRoutines !== 'object') {
      throw new Error('Invalid routines config: "eveningRoutines" must be an object');
    }

    const validDays: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of validDays) {
      if (!Array.isArray(eveningRoutines[day])) {
        throw new Error(`Invalid routines config: eveningRoutines.${day} must be an array`);
      }
    }

    // Validate all steps
    weekdayMorning.forEach((step, i) => validateStep(step, 'weekdayMorning', i));
    saturdayMorning.forEach((step, i) => validateStep(step, 'saturdayMorning', i));

    for (const day of validDays) {
      eveningRoutines[day].forEach((step: any, i: number) => validateStep(step, `eveningRoutines.${day}`, i));
    }

    // Parse icons for all steps
    const convertStep = (step: any, routineType: 'morning' | 'evening'): RoutineStep => {
      return {
        time: step.time,
        activity: step.activity,
        description: step.description,
        timeInMinutes: step.timeInMinutes,
        icon: parseIcon(step.icon),
        iconColor: step.iconColor,
        routineType,
      };
    };

    return {
      weekdayMorning: weekdayMorning.map(step => convertStep(step, 'morning')),
      saturdayMorning: saturdayMorning.map(step => convertStep(step, 'morning')),
      eveningRoutines: Object.fromEntries(
        validDays.map(day => [
          day,
          eveningRoutines[day].map((step: any) => convertStep(step, 'evening')),
        ])
      ) as Record<DayOfWeek, RoutineStep[]>,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load routines config: ${message}`);
  }
}
