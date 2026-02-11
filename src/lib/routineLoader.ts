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

const TIME_24H_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

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

function parseTimeToMinutes(time: string, day: string, index: number): number {
  if (typeof time !== 'string') {
    throw new Error(`Invalid time in ${day} step ${index}. Expected a 24-hour time string like "18:20".`);
  }

  const match = TIME_24H_PATTERN.exec(time.trim());
  if (!match) {
    throw new Error(`Invalid time "${time}" in ${day} step ${index}. Use 24-hour format like "18:20".`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

/**
 * Validates a single routine step from config
 */
function validateStep(step: any, day: string, index: number): void {
  const requiredFields = ['time', 'activity', 'description', 'icon', 'iconColor'];

  for (const field of requiredFields) {
    if (!(field in step)) {
      throw new Error(`Missing required field "${field}" in ${day} step ${index}`);
    }
  }

  if ('timeInMinutes' in step) {
    console.warn(
      `Ignoring timeInMinutes in ${day} step ${index}. It is now auto-calculated from the 24-hour time string.`
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
    const convertStep = (
      step: any,
      routineType: 'morning' | 'evening',
      day: string,
      index: number
    ): RoutineStep => {
      return {
        time: step.time,
        activity: step.activity,
        description: step.description,
        timeInMinutes: parseTimeToMinutes(step.time, day, index),
        icon: parseIcon(step.icon),
        iconColor: step.iconColor,
        routineType,
      };
    };

    return {
      weekdayMorning: weekdayMorning.map((step, i) => convertStep(step, 'morning', 'weekdayMorning', i)),
      saturdayMorning: saturdayMorning.map((step, i) => convertStep(step, 'morning', 'saturdayMorning', i)),
      eveningRoutines: Object.fromEntries(
        validDays.map(day => [
          day,
          eveningRoutines[day].map((step: any, i: number) => convertStep(step, 'evening', `eveningRoutines.${day}`, i)),
        ])
      ) as Record<DayOfWeek, RoutineStep[]>,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load routines config: ${message}`);
  }
}
