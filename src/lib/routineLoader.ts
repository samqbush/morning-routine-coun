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

export interface EveningStep {
  id: string;
  activity: string;
  description: string;
  durationMinutes: number;
  icon: React.ComponentType<any>;
  iconColor: string;
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

const TIME_24H_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validates icon reference (either icon name or emoji)
 */
function parseIcon(iconRef: string): React.ComponentType<any> {
  if (iconRef.startsWith('emoji:')) {
    const emoji = iconRef.slice(6);
    return (props: any) => {
      const { size, className = '', ...restProps } = props || {};

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
  const displayIndex = index + 1;
  if (typeof time !== 'string') {
    throw new Error(`Invalid time in ${day} step ${displayIndex}. Expected a 24-hour time string like "18:20".`);
  }

  const match = TIME_24H_PATTERN.exec(time.trim());
  if (!match) {
    throw new Error(`Invalid time "${time}" in ${day} step ${displayIndex}. Use 24-hour format like "18:20".`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

function validateIconColor(iconColor: string, context: string): void {
  if (!VALID_ICON_COLORS.includes(iconColor)) {
    const isTailwindTextColor = /^text-[a-z-]+-\d{3}$/.test(iconColor);
    if (!isTailwindTextColor) {
      console.warn(`Unusual iconColor in ${context}: "${iconColor}". Expected Tailwind class like "text-blue-500".`);
    } else {
      console.warn(`Non-standard iconColor in ${context}: "${iconColor}". Not in recommended set, using as-is.`);
    }
  }
}

/**
 * Validates a single morning routine step from config
 */
function validateMorningStep(step: any, day: string, index: number): void {
  const displayIndex = index + 1;
  const requiredFields = ['time', 'activity', 'description', 'icon', 'iconColor'];

  for (const field of requiredFields) {
    if (!(field in step)) {
      throw new Error(`Missing required field "${field}" in ${day} step ${displayIndex}`);
    }
  }

  if ('timeInMinutes' in step) {
    console.warn(
      `Ignoring timeInMinutes in ${day} step ${displayIndex}. It is now auto-calculated from the 24-hour time string.`
    );
  }

  validateIconColor(step.iconColor, `${day} step ${displayIndex}`);
}

/**
 * Validates a single evening step from config
 */
function validateEveningStep(step: any, index: number): void {
  const displayIndex = index + 1;
  const requiredFields = ['id', 'activity', 'description', 'durationMinutes', 'icon', 'iconColor'];

  for (const field of requiredFields) {
    if (!(field in step)) {
      throw new Error(`Missing required field "${field}" in eveningSteps step ${displayIndex}`);
    }
  }

  if (typeof step.id !== 'string' || step.id.trim() === '') {
    throw new Error(`Invalid id in eveningSteps step ${displayIndex}: must be a non-empty string`);
  }

  if (typeof step.durationMinutes !== 'number' || step.durationMinutes <= 0) {
    throw new Error(`Invalid durationMinutes in eveningSteps step ${displayIndex} ("${step.id}"): must be a positive number`);
  }

  validateIconColor(step.iconColor, `eveningSteps step ${displayIndex} ("${step.id}")`);
}

/**
 * Loads and validates the routines config file
 * Throws detailed error if config is invalid
 */
export function loadRoutines(): {
  weekdayMorning: RoutineStep[];
  saturdayMorning: RoutineStep[];
  eveningSteps: EveningStep[];
  eveningPresets: Record<DayOfWeek, string[]>;
} {
  try {
    if (!routinesConfig || typeof routinesConfig !== 'object') {
      throw new Error('Invalid routines config: must be a JSON object');
    }

    const { weekdayMorning, saturdayMorning, eveningSteps, eveningPresets } = routinesConfig as any;

    if (!Array.isArray(weekdayMorning)) {
      throw new Error('Invalid routines config: "weekdayMorning" must be an array');
    }

    if (!Array.isArray(saturdayMorning)) {
      throw new Error('Invalid routines config: "saturdayMorning" must be an array');
    }

    // Validate evening steps
    if (!Array.isArray(eveningSteps)) {
      throw new Error('Invalid routines config: "eveningSteps" must be an array');
    }

    if (!eveningPresets || typeof eveningPresets !== 'object') {
      throw new Error('Invalid routines config: "eveningPresets" must be an object');
    }

    // Validate morning steps
    weekdayMorning.forEach((step, i) => validateMorningStep(step, 'weekdayMorning', i));
    saturdayMorning.forEach((step, i) => validateMorningStep(step, 'saturdayMorning', i));

    // Validate and parse evening steps
    eveningSteps.forEach((step: any, i: number) => validateEveningStep(step, i));

    // Check for duplicate evening step IDs
    const stepIds = new Set<string>();
    for (const step of eveningSteps) {
      if (stepIds.has(step.id)) {
        throw new Error(`Duplicate evening step id: "${step.id}"`);
      }
      stepIds.add(step.id);
    }

    // Validate evening presets
    const validDays: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of validDays) {
      if (!Array.isArray(eveningPresets[day])) {
        throw new Error(`Invalid routines config: eveningPresets.${day} must be an array of step IDs`);
      }
      for (const id of eveningPresets[day]) {
        if (!stepIds.has(id)) {
          throw new Error(`Invalid step ID "${id}" in eveningPresets.${day}. Available IDs: ${[...stepIds].join(', ')}`);
        }
      }
    }

    // Parse morning steps
    const convertMorningStep = (step: any, day: string, index: number): RoutineStep => ({
      time: step.time,
      activity: step.activity,
      description: step.description,
      timeInMinutes: parseTimeToMinutes(step.time, day, index),
      icon: parseIcon(step.icon),
      iconColor: step.iconColor,
      routineType: 'morning',
    });

    // Parse evening steps
    const parsedEveningSteps: EveningStep[] = eveningSteps.map((step: any) => ({
      id: step.id,
      activity: step.activity,
      description: step.description,
      durationMinutes: step.durationMinutes,
      icon: parseIcon(step.icon),
      iconColor: step.iconColor,
    }));

    return {
      weekdayMorning: weekdayMorning.map((step, i) => convertMorningStep(step, 'weekdayMorning', i)),
      saturdayMorning: saturdayMorning.map((step, i) => convertMorningStep(step, 'saturdayMorning', i)),
      eveningSteps: parsedEveningSteps,
      eveningPresets: eveningPresets as Record<DayOfWeek, string[]>,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load routines config: ${message}`);
  }
}
