import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, CalendarBlank, SpeakerHigh, SpeakerX, CheckCircle, Play, Pause, SkipForward, ArrowsClockwise, Sun, ArrowLeft, Eye } from '@phosphor-icons/react';
import { loadRoutines, RoutineStep, EveningStep } from '@/lib/routineLoader';

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
type MorningPlan = 'dual' | 'shared' | 'none';
type MorningView = 'jack-only' | 'split' | 'twins-only' | 'shared';
type AppState = 'late-night' | 'before-start' | 'morning-active' | 'morning-complete';

// Evening routine won't auto-start until this time (5:00 PM)
const EVENING_START_MINUTES = 17 * 60;

// Minutes after last step before routine is considered "done"
const LAST_STEP_WINDOW = 5;

// Load routines from config at app startup
let loadedRoutines: ReturnType<typeof loadRoutines> | null = null;
let routinesError: Error | null = null;

try {
  loadedRoutines = loadRoutines();
} catch (error) {
  routinesError = error instanceof Error ? error : new Error(String(error));
}

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugTime, setDebugTime] = useState(new Date());
  const [debugDay, setDebugDay] = useState<DayOfWeek | null>(null);
  const [showScheduleReview, setShowScheduleReview] = useState(false);
  const [lastStepJack, setLastStepJack] = useState<number>(-3);
  const [lastStepTwins, setLastStepTwins] = useState<number>(-3);
  const [lastStepShared, setLastStepShared] = useState<number>(-3);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const [audioManifest, setAudioManifest] = useState<Record<string, { text: string; file: string }> | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);

  // Evening routine state
  const [eveningMode, setEveningMode] = useState<'idle' | 'active' | 'complete'>('idle');
  const [selectedSteps, setSelectedSteps] = useState<EveningStep[]>([]);
  const [currentEveningStep, setCurrentEveningStep] = useState(0);
  const [stepStartTime, setStepStartTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTimeRemaining, setPausedTimeRemaining] = useState<number | null>(null);

  // Show error screen if config failed to load
  if (routinesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-8">
        <Card className="p-8 max-w-2xl border-2 border-red-500">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-red-700">Configuration Error</h1>
            <p className="text-lg text-red-600 font-semibold">Failed to load routines configuration</p>
            <div className="bg-red-50 border border-red-300 rounded p-4">
              <p className="text-sm font-mono text-red-700 whitespace-pre-wrap break-words">
                {routinesError.message}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-300 rounded p-4">
              <p className="text-sm text-amber-800">
                <strong>Help:</strong> Please check that <code className="font-mono bg-amber-100 px-2 py-1">public/routines.json</code> exists and is valid JSON with all required fields:
              </p>
              <ul className="text-sm text-amber-800 list-disc list-inside mt-2 space-y-1">
                <li><code className="font-mono">weekdayMorning</code> (array)</li>
                <li><code className="font-mono">saturdayMorning</code> (array)</li>
                <li><code className="font-mono">eveningSteps</code> (array with id, durationMinutes)</li>
                <li><code className="font-mono">eveningRoutine</code> (array of step ID strings)</li>
              </ul>
              <p className="text-sm text-amber-800 mt-3">
                Morning steps need: <code className="font-mono">time (24-hour HH:MM), activity, description, icon, iconColor</code>
                <br />
                Evening steps need: <code className="font-mono">id, activity, description, durationMinutes, icon, iconColor</code>
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Day & Routine Helpers ────────────────────────────────────────────

  const getDayOfWeek = (date: Date): DayOfWeek => {
    if (isDebugMode && debugDay) {
      return debugDay;
    }
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const isSchoolDay = (date: Date): boolean => {
    const day = getDayOfWeek(date);
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day);
  };

  const getDailyRoutine = (): RoutineStep[] => {
    if (!loadedRoutines) return [];
    const dayOfWeek = getDayOfWeek(isDebugMode ? debugTime : currentTime);
    if (isSchoolDay(isDebugMode ? debugTime : currentTime)) {
      return loadedRoutines.weekdayMorning;
    } else if (dayOfWeek === 'Saturday') {
      return loadedRoutines.saturdayMorning;
    }
    return [];
  };

  const getMorningPlan = (): MorningPlan => {
    if (!loadedRoutines) return 'none';
    const timeToUse = isDebugMode ? debugTime : currentTime;
    const dayOfWeek = getDayOfWeek(timeToUse);
    if (isSchoolDay(timeToUse) && loadedRoutines.weekdayMorningJack.length > 0 && loadedRoutines.weekdayMorningTwins.length > 0) {
      return 'dual';
    }
    if (dayOfWeek === 'Saturday' && loadedRoutines.saturdayMorning.length > 0) {
      return 'shared';
    }
    if (isSchoolDay(timeToUse) && loadedRoutines.weekdayMorning.length > 0) {
      return 'shared';
    }
    return 'none';
  };

  const getCurrentTimeInMinutes = () => {
    const timeToUse = isDebugMode ? debugTime : currentTime;
    return timeToUse.getHours() * 60 + timeToUse.getMinutes();
  };

  const getCurrentTimeInSeconds = () => {
    const timeToUse = isDebugMode ? debugTime : currentTime;
    return timeToUse.getHours() * 3600 + timeToUse.getMinutes() * 60 + timeToUse.getSeconds();
  };

  // ─── Parameterized Computation Functions ──────────────────────────────

  const getCurrentStepForRoutine = (routine: RoutineStep[]): number => {
    const timeInMinutes = getCurrentTimeInMinutes();
    if (routine.length === 0) return -3;
    if (timeInMinutes < routine[0].timeInMinutes) return -2;

    for (let i = routine.length - 1; i >= 0; i--) {
      if (timeInMinutes >= routine[i].timeInMinutes) {
        const nextStepTime = i + 1 < routine.length
          ? routine[i + 1].timeInMinutes
          : routine[i].timeInMinutes + LAST_STEP_WINDOW;
        if (timeInMinutes < nextStepTime) {
          return i;
        }
      }
    }
    return -3;
  };

  const getTimeUntilNextStepForRoutine = (routine: RoutineStep[]): number => {
    const step = getCurrentStepForRoutine(routine);
    const currentSec = getCurrentTimeInSeconds();

    if (step === -2) {
      if (routine.length === 0) return 0;
      return Math.max(0, routine[0].timeInMinutes * 60 - currentSec);
    }
    if (step < 0 || step >= routine.length) return 0;

    const nextStepTime = step + 1 < routine.length
      ? routine[step + 1].timeInMinutes
      : routine[step].timeInMinutes + LAST_STEP_WINDOW;
    return Math.max(0, nextStepTime * 60 - currentSec);
  };

  const getStepDurationForRoutine = (routine: RoutineStep[]): number => {
    const step = getCurrentStepForRoutine(routine);

    if (step === -2) {
      if (routine.length === 0) return 300;
      const currentSec = getCurrentTimeInSeconds();
      return Math.max(1, routine[0].timeInMinutes * 60 - currentSec);
    }
    if (step < 0 || step >= routine.length) return 300;

    const nextStepTime = step + 1 < routine.length
      ? routine[step + 1].timeInMinutes
      : routine[step].timeInMinutes + LAST_STEP_WINDOW;
    return (nextStepTime - routine[step].timeInMinutes) * 60;
  };

  const getTimerColorForRoutine = (routine: RoutineStep[]): string => {
    const duration = getStepDurationForRoutine(routine);
    const remaining = getTimeUntilNextStepForRoutine(routine);
    const pct = duration > 0 ? remaining / duration : 0;
    if (pct > 0.5) {
      const g2y = (pct - 0.5) * 2;
      return `rgb(${Math.round(255 * (1 - g2y))}, 255, 0)`;
    }
    const y2r = pct * 2;
    return `rgb(255, ${Math.round(255 * y2r)}, 0)`;
  };

  const getProgressForRoutine = (routine: RoutineStep[]): number => {
    const step = getCurrentStepForRoutine(routine);
    if (step < 0) return step === -3 ? 100 : 0;
    const timeInMinutes = getCurrentTimeInMinutes();
    let completed = 0;
    for (let i = 0; i < routine.length; i++) {
      const next = i + 1 < routine.length ? routine[i + 1].timeInMinutes : routine[i].timeInMinutes + LAST_STEP_WINDOW;
      if (timeInMinutes >= next) completed++;
      else break;
    }
    return (completed / routine.length) * 100;
  };

  // Legacy wrappers that operate on the shared/combined daily routine
  const getCurrentStep = () => getCurrentStepForRoutine(getDailyRoutine());
  const getTimeUntilNextStep = () => getTimeUntilNextStepForRoutine(getDailyRoutine());
  const getStepDuration = () => getStepDurationForRoutine(getDailyRoutine());
  const getTimerColor = () => getTimerColorForRoutine(getDailyRoutine());
  const getProgressPercentage = () => getProgressForRoutine(getDailyRoutine());

  // ─── App-Level State Machine ──────────────────────────────────────────

  const getAppState = (): AppState => {
    const timeInMinutes = getCurrentTimeInMinutes();
    if (timeInMinutes > 21 * 60) return 'late-night';

    const plan = getMorningPlan();
    if (plan === 'none') return 'morning-complete';

    if (plan === 'dual' && loadedRoutines) {
      const jackStep = getCurrentStepForRoutine(loadedRoutines.weekdayMorningJack);
      const twinsStep = getCurrentStepForRoutine(loadedRoutines.weekdayMorningTwins);
      if (jackStep === -2 && twinsStep === -2) return 'before-start';
      if (jackStep === -3 && twinsStep === -3) return 'morning-complete';
      // At least one routine is active or not yet started while the other is active
      return 'morning-active';
    }

    // shared plan
    const sharedStep = getCurrentStep();
    if (sharedStep === -2) return 'before-start';
    if (sharedStep === -1) return 'late-night';
    if (sharedStep === -3) return 'morning-complete';
    if (sharedStep >= 0) return 'morning-active';
    return 'morning-complete';
  };

  const getMorningView = (): MorningView => {
    const plan = getMorningPlan();
    if (plan !== 'dual' || !loadedRoutines) return 'shared';

    const jackStep = getCurrentStepForRoutine(loadedRoutines.weekdayMorningJack);
    const twinsStep = getCurrentStepForRoutine(loadedRoutines.weekdayMorningTwins);

    const jackActive = jackStep >= 0;
    const jackDone = jackStep === -3;
    const twinsActive = twinsStep >= 0;
    const twinsNotStarted = twinsStep === -2;

    if (jackActive && twinsNotStarted) return 'jack-only';
    if (jackActive && twinsActive) return 'split';
    if (jackDone && twinsActive) return 'twins-only';
    // Edge: both before-start shouldn't reach here (appState would be before-start)
    // Edge: jack before-start, twins active (unlikely given times but handle)
    if (twinsActive) return 'twins-only';
    if (jackActive) return 'jack-only';
    return 'shared';
  };

  // ─── Effects ──────────────────────────────────────────────────────────

  // Initialize evening routine from config
  useEffect(() => {
    if (!loadedRoutines) return;
    const routineIds = loadedRoutines.eveningRoutine;
    const steps = routineIds
      .map(id => loadedRoutines!.eveningSteps.find(s => s.id === id))
      .filter((s): s is EveningStep => s !== undefined);
    setSelectedSteps(steps);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Clean up audio unlock timer on unmount
  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    };
  }, []);

  // Check speech synthesis availability and load audio manifest on mount
  useEffect(() => {
    const checkSpeechAvailability = () => {
      if (!('speechSynthesis' in window)) {
        setSpeechAvailable(false);
        return;
      }
      const userAgent = navigator.userAgent.toLowerCase();
      const isSamsungTV = userAgent.includes('tizen') ||
                          (userAgent.includes('samsung') && userAgent.includes('smart-tv'));
      if (isSamsungTV) {
        setSpeechAvailable(false);
        console.warn('Samsung TV detected - Speech Synthesis not supported');
        return;
      }
      setSpeechAvailable(true);
    };
    checkSpeechAvailability();

    // Load pre-generated audio manifest for fallback TTS
    const basePath = import.meta.env.BASE_URL || '/';
    fetch(`${basePath}audio/manifest.json`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setAudioManifest(data); })
      .catch(() => {});
  }, []);

  // Attempt to unlock audio on mount and show prompt if blocked
  useEffect(() => {
    // Small delay to let AudioContext initialize
    const timer = setTimeout(() => tryUnlockAudio(), 500);
    return () => clearTimeout(timer);
  }, []);

  // ─── Audio & Speech ───────────────────────────────────────────────────

  const initializeAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume suspended AudioContext (required after user gesture for autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  };

  // Attempt to unlock audio; if blocked, show the prompt overlay
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tryUnlockAudio = () => {
    if (audioUnlocked) return;
    const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContextRef.current) audioContextRef.current = ctx;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        setAudioUnlocked(true);
        setShowAudioPrompt(false);
      }).catch(() => {
        setShowAudioPrompt(true);
      });
      // Also show prompt if still suspended after a short delay
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = setTimeout(() => {
        if (ctx.state === 'suspended') {
          setShowAudioPrompt(true);
        }
        unlockTimerRef.current = null;
      }, 200);
    } else {
      setAudioUnlocked(true);
      setShowAudioPrompt(false);
    }
  };

  // Handle user gesture to unlock audio (for autoplay policy)
  const handleAudioUnlock = () => {
    initializeAudio();
    if (audioContextRef.current) {
      audioContextRef.current.resume().then(() => {
        setAudioUnlocked(true);
        setShowAudioPrompt(false);
        // Play a short confirmation chime
        playStepChangeSound();
      }).catch(() => {});
    }
    // Also try playing and immediately pausing a silent audio element to unlock HTMLAudioElement
    try {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      silentAudio.play().then(() => { silentAudio.pause(); }).catch(() => {});
    } catch {}
  };

  const playStepChangeSound = () => {
    initializeAudio();
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      console.warn('AudioContext suspended — chime skipped (autoplay policy)');
      return;
    }
    try {
      const oscillator1 = ctx.createOscillator();
      const oscillator2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator1.frequency.setValueAtTime(523.25, ctx.currentTime);
      oscillator2.frequency.setValueAtTime(659.25, ctx.currentTime);
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      const startTime = ctx.currentTime;
      oscillator1.start(startTime);
      oscillator2.start(startTime);
      oscillator1.stop(startTime + 0.8);
      oscillator2.stop(startTime + 0.8);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  };

  // Play pre-generated audio files sequentially by manifest keys
  const playAudioByKeys = (keys: string[]) => {
    if (!audioManifest || keys.length === 0) return;

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    const basePath = import.meta.env.BASE_URL || '/';
    let index = 0;

    const playNext = () => {
      if (index >= keys.length) return;
      const entry = audioManifest[keys[index]];
      if (!entry) { index++; playNext(); return; }

      const audio = new Audio(`${basePath}audio/${entry.file}`);
      currentAudioRef.current = audio;
      audio.onended = () => { index++; playNext(); };
      audio.onerror = (e) => {
        console.warn(`Audio file failed to load: ${entry.file}`, e);
        index++; playNext();
      };
      audio.play().catch((err) => {
        console.warn(`Audio play() rejected for ${entry.file}:`, err.message);
        index++; playNext();
      });
    };

    playNext();
  };

  const speakMessage = (message: string, audioKeys?: string[]) => {
    if (!speechEnabled) return;

    // Try browser speech synthesis first (works on desktop/mobile)
    if (speechAvailable && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice =>
          voice.name.includes('Samantha') ||
          voice.name.includes('Karen') ||
          voice.name.includes('Daniel') ||
          voice.lang.startsWith('en-')
        );
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.onerror = () => {
          setSpeechAvailable(false);
        };
        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        setSpeechAvailable(false);
      }
    }

    // Fallback: play pre-generated audio (works on Samsung TV)
    if (audioKeys && audioKeys.length > 0) {
      playAudioByKeys(audioKeys);
    }
  };

  // Build a speech message and audio key for a step change in a given routine
  const buildStepMessage = (stepIndex: number, routine: RoutineStep[], label: string): string => {
    if (stepIndex === -2) return `${label}: Get ready to start your routine!`;
    if (stepIndex === -3) return '';
    if (stepIndex >= 0 && stepIndex < routine.length) {
      return `${label}: Time for ${routine[stepIndex].activity}! ${routine[stepIndex].description}`;
    }
    return '';
  };

  const buildStepAudioKey = (stepIndex: number, keyPrefix: string): string => {
    if (stepIndex === -2) return `${keyPrefix}.get-ready`;
    if (stepIndex >= 0) return `${keyPrefix}.step.${stepIndex}`;
    return '';
  };

  // Get the audio key prefix for shared/legacy mode based on current day
  const getSharedAudioPrefix = (): string => {
    const dayOfWeek = getDayOfWeek(isDebugMode ? debugTime : currentTime);
    return dayOfWeek === 'Saturday' ? 'morning.saturday' : 'morning.shared';
  };

  // Announce for shared/legacy single-routine mode
  const announceActivity = (stepIndex: number) => {
    if (!speechEnabled) return;
    const DAILY_ROUTINE = getDailyRoutine();
    const prefix = getSharedAudioPrefix();
    let message = '';
    let audioKey = '';
    if (stepIndex === -2) {
      message = 'Good morning! Get ready to start your routine!';
      audioKey = 'morning.shared.get-ready';
    } else if (stepIndex === -1) {
      message = 'Good night! See you tomorrow morning!';
      audioKey = 'morning.shared.good-night';
    } else if (stepIndex >= DAILY_ROUTINE.length) {
      message = "Great job everyone! Morning routine complete. Have a wonderful work day!";
      audioKey = 'morning.shared.complete';
    } else if (stepIndex >= 0 && stepIndex < DAILY_ROUTINE.length) {
      message = `Time for ${DAILY_ROUTINE[stepIndex].activity}! ${DAILY_ROUTINE[stepIndex].description}`;
      audioKey = `${prefix}.step.${stepIndex}`;
    }
    if (message) speakMessage(message, audioKey ? [audioKey] : undefined);
  };



  // Announce evening activity using speech synthesis
  const announceEveningActivity = (step: EveningStep | null, isComplete?: boolean) => {
    if (!speechEnabled) return;
    let message = '';
    let audioKey = '';
    if (isComplete) {
      message = "Great job! The evening routine is complete. Now it's Sam and Jill time!";
      audioKey = 'evening.complete';
    } else if (step && loadedRoutines) {
      message = `Time for ${step.activity}! ${step.description}. You have ${step.durationMinutes} minutes.`;
      // Use position in selectedSteps (runtime order, respects bath/family swap)
      const runtimeIndex = selectedSteps.findIndex(s => s.id === step.id);
      if (runtimeIndex >= 0) audioKey = `evening.step.${runtimeIndex}`;
    }
    if (message) speakMessage(message, audioKey ? [audioKey] : undefined);
  };

  // ─── Evening Routine Functions ────────────────────────────────────────

  const startEveningRoutine = () => {
    if (selectedSteps.length === 0) return;
    initializeAudio();
    setEveningMode('active');
    setCurrentEveningStep(0);
    setStepStartTime(Date.now());
    setIsPaused(false);
    setPausedTimeRemaining(null);
    playStepChangeSound();
    announceEveningActivity(selectedSteps[0]);
  };

  const resetEveningRoutine = () => {
    setCurrentEveningStep(0);
    setStepStartTime(Date.now());
    setIsPaused(false);
    setPausedTimeRemaining(null);
    setEveningMode('active');
    if (selectedSteps.length > 0) {
      playStepChangeSound();
      announceEveningActivity(selectedSteps[0]);
    }
  };

  const skipEveningStep = () => advanceEveningStep();

  const togglePause = () => {
    if (isPaused) {
      if (pausedTimeRemaining !== null) {
        const durationSeconds = selectedSteps[currentEveningStep].durationMinutes * 60;
        const elapsed = durationSeconds - pausedTimeRemaining;
        setStepStartTime(Date.now() - elapsed * 1000);
      }
      setIsPaused(false);
      setPausedTimeRemaining(null);
    } else {
      setPausedTimeRemaining(getEveningTimeRemaining());
      setIsPaused(true);
    }
  };

  const advanceEveningStep = () => {
    const nextStep = currentEveningStep + 1;
    if (nextStep >= selectedSteps.length) {
      setEveningMode('complete');
      playStepChangeSound();
      announceEveningActivity(null, true);
    } else {
      setCurrentEveningStep(nextStep);
      setStepStartTime(Date.now());
      setIsPaused(false);
      setPausedTimeRemaining(null);
      playStepChangeSound();
      announceEveningActivity(selectedSteps[nextStep]);
    }
  };

  const getEveningTimeRemaining = (): number => {
    if (isPaused && pausedTimeRemaining !== null) return pausedTimeRemaining;
    if (stepStartTime === null || currentEveningStep >= selectedSteps.length) return 0;
    const durationSeconds = selectedSteps[currentEveningStep].durationMinutes * 60;
    const elapsed = (Date.now() - stepStartTime) / 1000;
    return Math.max(0, durationSeconds - elapsed);
  };

  const getEveningStepDuration = (): number => {
    if (currentEveningStep >= selectedSteps.length) return 1;
    return selectedSteps[currentEveningStep].durationMinutes * 60;
  };

  const getEveningTimerColor = () => {
    const remaining = getEveningTimeRemaining();
    const duration = getEveningStepDuration();
    const pct = duration > 0 ? remaining / duration : 0;
    if (pct > 0.5) {
      const g2y = (pct - 0.5) * 2;
      return `rgb(${Math.round(255 * (1 - g2y))}, 255, 0)`;
    }
    const y2r = pct * 2;
    return `rgb(255, ${Math.round(255 * y2r)}, 0)`;
  };

  // Evening timer tick
  useEffect(() => {
    if (eveningMode !== 'active' || isPaused) return;
    const interval = setInterval(() => {
      if (getEveningTimeRemaining() <= 0) advanceEveningStep();
    }, 500);
    return () => clearInterval(interval);
  }, [eveningMode, isPaused, currentEveningStep, stepStartTime, selectedSteps]);

  // ─── Step Change Tracking ─────────────────────────────────────────────

  const appState = getAppState();
  const morningPlan = getMorningPlan();
  const morningView = getMorningView();

  // Per-child step tracking for dual mode
  useEffect(() => {
    if (morningPlan !== 'dual' || !loadedRoutines) return;

    const jackStep = getCurrentStepForRoutine(loadedRoutines.weekdayMorningJack);
    const twinsStep = getCurrentStepForRoutine(loadedRoutines.weekdayMorningTwins);
    const jackChanged = jackStep !== lastStepJack;
    const twinsChanged = twinsStep !== lastStepTwins;

    if (!jackChanged && !twinsChanged) return;

    const messages: string[] = [];
    const audioKeys: string[] = [];

    if (jackChanged) {
      const msg = buildStepMessage(jackStep, loadedRoutines.weekdayMorningJack, 'Jack');
      if (msg) {
        messages.push(msg);
        const key = buildStepAudioKey(jackStep, 'morning.jack');
        if (key) audioKeys.push(key);
      }
      setLastStepJack(jackStep);
    }

    if (twinsChanged) {
      const msg = buildStepMessage(twinsStep, loadedRoutines.weekdayMorningTwins, 'Ava and Dana');
      if (msg) {
        messages.push(msg);
        const key = buildStepAudioKey(twinsStep, 'morning.twins');
        if (key) audioKeys.push(key);
      }
      setLastStepTwins(twinsStep);
    }

    // Only announce "all done" when BOTH routines are complete
    if (jackStep === -3 && twinsStep === -3 && (jackChanged || twinsChanged)) {
      messages.length = 0;
      audioKeys.length = 0;
      messages.push("Great job everyone! Morning routine complete. Have a wonderful work day!");
      audioKeys.push('morning.shared.complete');
    }

    if (messages.length > 0) {
      playStepChangeSound();
      speakMessage(messages.join(' '), audioKeys);
    }
  }, [currentTime, debugTime, morningPlan]);

  // Shared/legacy step tracking
  useEffect(() => {
    if (morningPlan === 'dual') return;
    const step = getCurrentStep();
    if (step !== lastStepShared) {
      if (lastStepShared >= -3 && lastStepShared !== step) {
        playStepChangeSound();
        announceActivity(step);
      }
      setLastStepShared(step);
    }
  }, [currentTime, debugTime, morningPlan]);

  // Reset evening routine to idle at the start of a new morning so it can auto-start that evening
  useEffect(() => {
    if ((appState === 'before-start' || appState === 'morning-active') && eveningMode === 'complete') {
      setEveningMode('idle');
    }
  }, [appState, eveningMode]);

  // Auto-start evening routine when morning is truly complete (only after 5 PM)
  useEffect(() => {
    const timeInMinutes = getCurrentTimeInMinutes();
    if (appState === 'morning-complete' && eveningMode === 'idle' && selectedSteps.length > 0 && timeInMinutes >= EVENING_START_MINUTES) {
      initializeAudio();
      setEveningMode('active');
      setCurrentEveningStep(0);
      setStepStartTime(Date.now());
      setIsPaused(false);
      setPausedTimeRemaining(null);
      playStepChangeSound();
      announceEveningActivity(selectedSteps[0]);
    }
  }, [appState, eveningMode, selectedSteps.length, currentTime]);

  // ─── Schedule Review Helpers ────────────────────────────────────────

  const setDebugTimeFromMinutes = (mins: number) => {
    const newTime = new Date();
    newTime.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    setDebugTime(newTime);
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds === 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /** Get the morning steps that would display for a given day */
  const getMorningStepsForDay = (day: DayOfWeek): { label: string; steps: RoutineStep[] }[] => {
    if (!loadedRoutines) return [];
    const weekdays: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (weekdays.includes(day)) {
      if (loadedRoutines.weekdayMorningJack.length > 0 && loadedRoutines.weekdayMorningTwins.length > 0) {
        return [
          { label: "Jack's Morning", steps: loadedRoutines.weekdayMorningJack },
          { label: "Ava & Dana's Morning", steps: loadedRoutines.weekdayMorningTwins },
        ];
      }
      return [{ label: 'Morning Routine', steps: loadedRoutines.weekdayMorning }];
    }
    if (day === 'Saturday') {
      return [{ label: 'Saturday Morning', steps: loadedRoutines.saturdayMorning }];
    }
    return [];
  };

  /** Get evening steps with computed start times for display */
  const getEveningStepsWithTimes = (): { step: EveningStep; startTime: string; startMinutes: number }[] => {
    if (!loadedRoutines) return [];
    const orderedSteps = loadedRoutines.eveningRoutine
      .map(id => loadedRoutines!.eveningSteps.find(s => s.id === id))
      .filter((s): s is EveningStep => !!s);

    let runningMinutes = EVENING_START_MINUTES;
    return orderedSteps.map(step => {
      const startMinutes = runningMinutes;
      const hours = Math.floor(runningMinutes / 60);
      const mins = runningMinutes % 60;
      const startTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      runningMinutes += step.durationMinutes;
      return { step, startTime, startMinutes };
    });
  };

  /** Preview a morning step from the schedule review */
  const previewMorningStep = (step: RoutineStep, day: DayOfWeek) => {
    initializeAudio();
    setDebugDay(day);
    setDebugTimeFromMinutes(step.timeInMinutes);
    setIsDebugMode(true);
    setShowScheduleReview(false);
  };

  /** Preview an evening time from the schedule review */
  const previewEveningTime = (startTimeMinutes: number, day: DayOfWeek) => {
    initializeAudio();
    setDebugDay(day);
    setDebugTimeFromMinutes(startTimeMinutes);
    setIsDebugMode(true);
    setShowScheduleReview(false);
  };

  // ─── Schedule Review ──────────────────────────────────────────────────

  const ScheduleReview = () => {
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const selectedDay = debugDay || getDayOfWeek(currentTime);
    const morningGroups = getMorningStepsForDay(selectedDay);
    const eveningStepsWithTimes = getEveningStepsWithTimes();
    const hasMorning = morningGroups.length > 0 && morningGroups.some(g => g.steps.length > 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarBlank size={32} className="text-primary" />
              <h1 className="text-3xl font-black text-primary">Schedule Review</h1>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setShowScheduleReview(false);
                setDebugDay(null);
              }}
              className="gap-2"
            >
              Close
            </Button>
          </div>

          {/* Day picker */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Select Day</h3>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {days.map((day) => (
                <Button
                  key={day}
                  size="sm"
                  variant={selectedDay === day ? "default" : "outline"}
                  onClick={() => setDebugDay(day)}
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </Card>

          {/* Morning section */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              ☀️ Morning
              {!hasMorning && <Badge variant="outline" className="ml-2 text-muted-foreground">No routine</Badge>}
            </h2>
            {hasMorning ? (
              <div className="space-y-6">
                {morningGroups.map((group, gi) => (
                  <div key={gi}>
                    {morningGroups.length > 1 && (
                      <h3 className={`text-lg font-semibold mb-3 ${gi === 0 ? 'text-blue-600' : 'text-pink-600'}`}>
                        {group.label}
                      </h3>
                    )}
                    <div className="space-y-2">
                      {group.steps.map((step, si) => (
                        <button
                          key={`${gi}-${si}`}
                          type="button"
                          className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/10 cursor-pointer transition-colors group w-full text-left"
                          onClick={() => previewMorningStep(step, selectedDay)}
                        >
                          <Badge variant="outline" className="text-base px-3 py-1 font-mono min-w-[70px] text-center">
                            {step.time}
                          </Badge>
                          <step.icon size={28} className={step.iconColor} />
                          <div className="flex-1">
                            <div className="font-semibold text-lg">{step.activity}</div>
                            <div className="text-sm text-muted-foreground">{step.description}</div>
                          </div>
                          <Eye size={20} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {selectedDay === 'Sunday' ? 'No routine scheduled for Sunday — enjoy your day!' : 'No morning routine for this day.'}
              </p>
            )}
          </Card>

          {/* Evening section */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-primary mb-1 flex items-center gap-2">
              🌙 Evening
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Starts at 5:00 PM · Times are estimated based on step durations
            </p>
            <div className="space-y-2">
              {eveningStepsWithTimes.map(({ step, startTime, startMinutes }) => {
                return (
                  <button
                    key={step.id}
                    type="button"
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/10 cursor-pointer transition-colors group w-full text-left"
                    onClick={() => previewEveningTime(startMinutes, selectedDay)}
                  >
                    <Badge variant="outline" className="text-base px-3 py-1 font-mono min-w-[70px] text-center">
                      {startTime}
                    </Badge>
                    <step.icon size={28} className={step.iconColor} />
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{step.activity}</div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{step.durationMinutes}min</Badge>
                    <Eye size={20} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Sound test */}
          <Card className="p-4">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm font-semibold text-muted-foreground mr-2">Audio:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => playStepChangeSound()}
                className="gap-2"
              >
                <SpeakerHigh size={16} />
                Test Sound
              </Button>
              <Button
                size="sm"
                variant={speechEnabled ? "default" : "secondary"}
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className="gap-2"
              >
                {speechEnabled ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
                {speechEnabled ? 'Voice On' : 'Voice Off'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ─── Schedule Button & Back Button ────────────────────────────────────

  const ScheduleButton = () => (
    <div className="fixed top-4 right-4 z-50">
      {isDebugMode ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setIsDebugMode(false);
            setDebugTime(new Date());
            setShowScheduleReview(true);
          }}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Schedule
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            initializeAudio();
            if (!debugDay) setDebugDay(getDayOfWeek(currentTime));
            setShowScheduleReview(true);
          }}
          className="gap-2"
        >
          <CalendarBlank size={16} />
          Schedule
        </Button>
      )}
    </div>
  );


  // ─── Reusable Timer Panel ─────────────────────────────────────────────

  const renderTimerPanel = (config: {
    routine: RoutineStep[];
    currentStep: number;
    timeRemaining: number;
    stepDuration: number;
    timerColor: string;
    progress: number;
    label: string;
    labelColor: string;
    compact?: boolean;
  }) => {
    const { routine, currentStep: step, timeRemaining: remaining, stepDuration: duration, timerColor, progress, label, labelColor, compact } = config;
    const countdownSize = compact ? 'text-7xl' : 'text-9xl';
    const ringSize = compact ? 'w-48 h-48' : 'w-64 h-64';
    const ringR = compact ? 88 : 120;
    const ringViewBox = compact ? '0 0 192 192' : '0 0 256 256';
    const ringCenter = compact ? 96 : 128;
    const headingSize = compact ? 'text-4xl' : 'text-5xl';
    const iconSize = compact ? 60 : 80;

    const currentActivity = step >= 0 && step < routine.length ? routine[step] : null;
    const nextActivity = step >= 0 && step + 1 < routine.length ? routine[step + 1] : null;

    return (
      <div className="space-y-6">
        {/* Label Header */}
        <h2 className={`${compact ? 'text-3xl' : 'text-4xl'} font-black ${labelColor} text-center`}>{label}</h2>

        {/* Progress Bar */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold`}>Progress</h3>
            <Badge variant="secondary" className={`${compact ? 'text-sm px-3 py-1' : 'text-lg px-4 py-2'}`}>
              {step >= 0 ? `Step ${step + 1} of ${routine.length}` : step === -3 ? 'Done!' : 'Starting Soon'}
            </Badge>
          </div>
          <Progress value={progress} className="h-3 mb-4" />
          <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-4 md:grid-cols-5'}`}>
            {routine.map((s, index) => {
              const timeInMinutes = getCurrentTimeInMinutes();
              const stepStarted = timeInMinutes >= s.timeInMinutes;
              const nextTime = index + 1 < routine.length ? routine[index + 1].timeInMinutes : s.timeInMinutes + LAST_STEP_WINDOW;
              const stepCompleted = timeInMinutes >= nextTime;
              const stepActive = stepStarted && !stepCompleted;
              return (
                <div
                  key={index}
                  className={`text-center p-2 rounded-lg transition-all ${
                    stepCompleted
                      ? 'bg-accent/20 border-2 border-accent'
                      : stepActive
                      ? 'bg-primary/20 border-2 border-primary animate-pulse'
                      : 'bg-muted/50 border border-muted'
                  }`}
                >
                  <s.icon
                    size={compact ? 24 : 32}
                    className={`mx-auto mb-1 ${
                      stepCompleted ? 'text-accent'
                        : stepActive ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <div className={`text-xs font-semibold ${
                    stepCompleted ? 'text-accent'
                      : stepActive ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}>
                    {s.time}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Timer Display */}
        {currentActivity && (
          <Card className={`${compact ? 'p-6' : 'p-12'} text-center`}>
            <div className="space-y-4">
              {/* Countdown */}
              <div
                className={`${countdownSize} font-black animate-pulse transition-colors duration-1000`}
                style={{ color: timerColor }}
              >
                {formatTimeRemaining(remaining)}
              </div>

              {/* Timer Ring */}
              <div className={`relative ${ringSize} mx-auto my-4`}>
                <svg className={`${ringSize} transform -rotate-90`} viewBox={ringViewBox}>
                  <circle cx={ringCenter} cy={ringCenter} r={ringR} stroke="currentColor" strokeWidth="12" fill="none" className="text-muted/30" />
                  <circle
                    cx={ringCenter} cy={ringCenter} r={ringR}
                    stroke={timerColor}
                    strokeWidth="12" fill="none"
                    strokeDasharray={`${2 * Math.PI * ringR}`}
                    strokeDashoffset={`${2 * Math.PI * ringR * (1 - (duration > 0 ? remaining / duration : 0))}`}
                    className="transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <currentActivity.icon size={iconSize} className={`mx-auto ${currentActivity.iconColor}`} />
                    <div className="mt-1 text-sm font-bold transition-colors duration-1000" style={{ color: timerColor }}>
                      {Math.ceil(remaining / 60)}min
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Info */}
              <div className="space-y-2">
                <Badge variant="default" className={`${compact ? 'text-lg px-4 py-2' : 'text-2xl px-8 py-3'}`}>
                  {currentActivity.time}
                </Badge>
                <h1 className={`${headingSize} font-black text-foreground`}>
                  {currentActivity.activity}
                </h1>
                <p className={`${compact ? 'text-xl' : 'text-3xl'} font-semibold text-muted-foreground`}>
                  {currentActivity.description}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* "Done" state for individual routine */}
        {step === -3 && (
          <Card className={`${compact ? 'p-6' : 'p-12'} text-center`}>
            <CheckCircle size={compact ? 60 : 80} className="text-accent mx-auto mb-4" />
            <h2 className={`${headingSize} font-black text-accent`}>Done! ✅</h2>
          </Card>
        )}

        {/* Next Activity Preview */}
        {nextActivity && (
          <Card className={`${compact ? 'p-4' : 'p-8'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <nextActivity.icon size={compact ? 32 : 48} className={nextActivity.iconColor} />
                <div>
                  <h3 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-muted-foreground mb-1`}>Up Next:</h3>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`${compact ? 'text-sm px-2 py-1' : 'text-xl px-4 py-2'}`}>
                      {nextActivity.time}
                    </Badge>
                    <span className={`${compact ? 'text-lg' : 'text-2xl'} font-semibold`}>{nextActivity.activity}</span>
                  </div>
                  <p className={`${compact ? 'text-base' : 'text-xl'} text-muted-foreground mt-1`}>{nextActivity.description}</p>
                </div>
              </div>
              <ArrowRight size={compact ? 32 : 48} className="text-muted-foreground" />
            </div>
          </Card>
        )}
      </div>
    );
  };

  // ─── Main Rendering ───────────────────────────────────────────────────

  const timeToUse = isDebugMode ? debugTime : currentTime;

  // Audio unlock overlay — rendered in every view, positioned fixed
  const audioUnlockOverlay = showAudioPrompt ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleAudioUnlock}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          handleAudioUnlock();
        }
      }}
    >
      <button
        autoFocus
        onClick={(e) => { e.stopPropagation(); handleAudioUnlock(); }}
        className="flex flex-col items-center gap-6 rounded-3xl bg-white/95 px-16 py-12 shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary"
      >
        <SpeakerHigh size={80} className="text-primary" />
        <span className="text-4xl font-bold text-foreground">Press OK to Enable Sound</span>
        <span className="text-2xl text-muted-foreground">Sound requires a button press to start</span>
      </button>
    </div>
  ) : null;

  // ── SCHEDULE REVIEW ──
  if (showScheduleReview) {
    return (
      <>
        {audioUnlockOverlay}
        <ScheduleReview />
      </>
    );
  }

  // ── LATE NIGHT ──
  if (appState === 'late-night') {
    const hoursUntilTomorrow = 24 - timeToUse.getHours() + 6;
    const minutesUntilTomorrow = (hoursUntilTomorrow * 60) - timeToUse.getMinutes() + 30;
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-8">
        {audioUnlockOverlay}
        <ScheduleButton />
        <div className="w-full max-w-4xl space-y-8">
          <Card className="p-12 text-center">
            <div className="space-y-8">
              <h1 className="text-5xl font-black text-primary">See You Tomorrow! 🌙</h1>
              <p className="text-2xl font-semibold text-muted-foreground">The morning routine will start again at 6:30 AM</p>
              <div className="text-6xl font-black text-secondary">
                {Math.floor(minutesUntilTomorrow / 60)}h {minutesUntilTomorrow % 60}m
              </div>
              <p className="text-xl text-muted-foreground">until tomorrow's routine</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── MORNING COMPLETE → Evening ──
  if (appState === 'morning-complete') {
    if (eveningMode === 'active' && selectedSteps.length > 0) {
      const evStep = selectedSteps[currentEveningStep];
      const nextEvStep = currentEveningStep + 1 < selectedSteps.length ? selectedSteps[currentEveningStep + 1] : null;
      const evRemaining = getEveningTimeRemaining();
      const evDuration = getEveningStepDuration();
      const evColor = getEveningTimerColor();
      const evProgress = (currentEveningStep / selectedSteps.length) * 100;

      return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
          {audioUnlockOverlay}
          <div className="max-w-6xl mx-auto space-y-8">
            <ScheduleButton />

            {/* Progress Bar */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Evening Routine Progress</h3>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Step {currentEveningStep + 1} of {selectedSteps.length}
                </Badge>
              </div>
              <Progress value={evProgress} className="h-4 mb-6" />
              <div className="grid grid-cols-5 gap-2 md:grid-cols-6 lg:grid-cols-11">
                {selectedSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`text-center p-3 rounded-lg transition-all ${
                      index < currentEveningStep
                        ? 'bg-accent/20 border-2 border-accent'
                        : index === currentEveningStep
                        ? 'bg-primary/20 border-2 border-primary animate-pulse'
                        : 'bg-muted/50 border border-muted'
                    }`}
                  >
                    <step.icon
                      size={32}
                      className={`mx-auto mb-2 ${
                        index < currentEveningStep ? 'text-accent'
                          : index === currentEveningStep ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <div className={`text-sm font-semibold ${
                      index < currentEveningStep ? 'text-accent'
                        : index === currentEveningStep ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}>
                      {step.durationMinutes}m
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Main Timer */}
            <Card className="p-12 text-center">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4 text-2xl text-muted-foreground">
                  <Clock size={32} />
                  <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSpeechEnabled(!speechEnabled)}
                    className="gap-1 text-sm"
                    disabled={!speechAvailable}
                  >
                    {speechEnabled && speechAvailable ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
                    <span className="text-xs">
                      {!speechAvailable ? 'Voice Unavailable' : speechEnabled ? 'Voice On' : 'Voice Off'}
                    </span>
                  </Button>
                </div>

                <div
                  className="text-9xl font-black animate-pulse transition-colors duration-1000"
                  style={{ color: evColor }}
                >
                  {formatTimeRemaining(evRemaining)}
                </div>

                {/* Timer Ring */}
                <div className="relative w-64 h-64 mx-auto my-8">
                  <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
                    <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="16" fill="none" className="text-muted/30" />
                    <circle
                      cx="128" cy="128" r="120"
                      stroke={evColor}
                      strokeWidth="16" fill="none"
                      strokeDasharray={`${2 * Math.PI * 120}`}
                      strokeDashoffset={`${2 * Math.PI * 120 * (1 - (evRemaining / evDuration))}`}
                      className="transition-all duration-1000 ease-linear"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <evStep.icon size={80} className={`mx-auto ${evStep.iconColor}`} />
                      <div className="mt-2 text-lg font-bold transition-colors duration-1000" style={{ color: evColor }}>
                        {Math.ceil(evRemaining / 60)}min
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Activity */}
                <div className="space-y-4">
                  <Badge variant="default" className="text-2xl px-8 py-3">
                    {evStep.durationMinutes} min
                  </Badge>
                  <h1 className="text-5xl font-black text-foreground">{evStep.activity}</h1>
                  <p className="text-3xl font-semibold text-muted-foreground">{evStep.description}</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap justify-center gap-6 mt-8">
                  <Button size="lg" variant="outline" onClick={togglePause} className="gap-3 text-2xl px-8 py-6">
                    {isPaused ? <Play size={32} /> : <Pause size={32} />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button size="lg" variant="secondary" onClick={skipEveningStep} className="gap-3 text-2xl px-8 py-6">
                    <SkipForward size={32} />
                    Skip
                  </Button>
                  <Button size="lg" variant="destructive" onClick={resetEveningRoutine} className="gap-3 text-2xl px-8 py-6">
                    <ArrowsClockwise size={32} />
                    Restart
                  </Button>
                </div>
              </div>
            </Card>

            {/* Next Activity Preview */}
            {nextEvStep && (
              <Card className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <nextEvStep.icon size={48} className={nextEvStep.iconColor} />
                    <div>
                      <h3 className="text-2xl font-bold text-muted-foreground mb-2">Up Next:</h3>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-xl px-4 py-2">{nextEvStep.durationMinutes} min</Badge>
                        <span className="text-2xl font-semibold">{nextEvStep.activity}</span>
                      </div>
                      <p className="text-xl text-muted-foreground mt-2">{nextEvStep.description}</p>
                    </div>
                  </div>
                  <ArrowRight size={48} className="text-muted-foreground" />
                </div>
              </Card>
            )}
          </div>
        </div>
      );
    }

    if (eveningMode === 'complete') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center p-8">
          {audioUnlockOverlay}
          <ScheduleButton />
          <div className="w-full max-w-4xl space-y-8">
            <Card className="p-12 text-center">
              <div className="space-y-8">
                <CheckCircle size={120} className="text-accent mx-auto" />
                <h1 className="text-6xl font-black text-accent">Great Job! 🎉</h1>
                <p className="text-3xl font-semibold text-muted-foreground">Now it's Sam and Jill time!</p>
                <p className="text-xl text-muted-foreground">Mommy and Daddy can relax together</p>
                <Button size="lg" variant="outline" onClick={resetEveningRoutine} className="text-2xl px-8 py-6 mt-8">
                  Start New Routine
                </Button>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Evening idle — morning complete screen
    const timeInMinutes = getCurrentTimeInMinutes();
    const isEveningTime = timeInMinutes >= EVENING_START_MINUTES;

    if (isEveningTime) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-8">
          {audioUnlockOverlay}
          <ScheduleButton />
          <div className="w-full max-w-4xl space-y-8">
            <Card className="p-12 text-center">
              <h1 className="text-5xl font-black text-primary animate-pulse">Starting Evening Routine...</h1>
            </Card>
          </div>
        </div>
      );
    }

    const minutesUntilEvening = EVENING_START_MINUTES - timeInMinutes;
    const hoursUntil = Math.floor(minutesUntilEvening / 60);
    const minsUntil = minutesUntilEvening % 60;
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center p-8">
        {audioUnlockOverlay}
        <ScheduleButton />
        <div className="w-full max-w-4xl space-y-8">
          <Card className="p-12 text-center">
            <div className="space-y-8">
              <Sun size={120} className="text-yellow-500 mx-auto" weight="fill" />
              <h1 className="text-6xl font-black text-primary">Morning Complete! ☀️</h1>
              <p className="text-3xl font-semibold text-muted-foreground">Enjoy your day!</p>
              <div className="text-5xl font-black text-secondary">
                {hoursUntil > 0 ? `${hoursUntil}h ${minsUntil}m` : `${minsUntil}m`}
              </div>
              <p className="text-xl text-muted-foreground">until evening routine starts at 5:00 PM</p>
              <Button
                size="lg"
                variant="outline"
                onClick={startEveningRoutine}
                className="text-2xl px-8 py-6 mt-4"
              >
                Start Evening Early
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── BEFORE START ──
  if (appState === 'before-start') {
    const dayOfWeek = getDayOfWeek(timeToUse);
    const isWeekend = !isSchoolDay(timeToUse);

    // Determine earliest start time
    let earliestStartMinutes: number;
    if (morningPlan === 'dual' && loadedRoutines) {
      earliestStartMinutes = Math.min(
        loadedRoutines.weekdayMorningJack[0]?.timeInMinutes ?? Infinity,
        loadedRoutines.weekdayMorningTwins[0]?.timeInMinutes ?? Infinity,
      );
    } else {
      const routine = getDailyRoutine();
      earliestStartMinutes = routine.length > 0 ? routine[0].timeInMinutes : 0;
    }
    const currentSec = getCurrentTimeInSeconds();
    const timeUntilStart = Math.max(0, earliestStartMinutes * 60 - currentSec);
    const totalWait = Math.max(1, earliestStartMinutes * 60 - currentSec);

    if (isWeekend && getDailyRoutine().length > 0 && timeUntilStart > 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center p-8">
          {audioUnlockOverlay}
          <ScheduleButton />
          <div className="w-full max-w-4xl space-y-8">
            <Card className="p-12 text-center">
              <div className="space-y-8">
                <h1 className="text-6xl font-black text-primary">Happy {dayOfWeek}! 🎉</h1>
                <p className="text-3xl font-semibold text-muted-foreground">No school today - enjoy your weekend!</p>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Compute timer color for before-start countdown
    const beforeStartPct = totalWait > 0 ? timeUntilStart / totalWait : 0;
    const beforeStartColor = beforeStartPct > 0.5
      ? `rgb(${Math.round(255 * (1 - (beforeStartPct - 0.5) * 2))}, 255, 0)`
      : `rgb(255, ${Math.round(255 * beforeStartPct * 2)}, 0)`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center p-8">
        {audioUnlockOverlay}
        <ScheduleButton />
        <div className="w-full max-w-4xl space-y-8">
          <Card className="p-12 text-center">
            <div className="space-y-8">
              <h1 className="text-6xl font-black text-primary">Good Morning! 🌅</h1>
              <p className="text-3xl font-semibold text-muted-foreground">Get Ready to Start Your Routine!</p>

              <div className="relative w-64 h-64 mx-auto">
                <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
                  <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="16" fill="none" className="text-muted/30" />
                  <circle
                    cx="128" cy="128" r="120"
                    stroke={beforeStartColor}
                    strokeWidth="16" fill="none"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (timeUntilStart / totalWait)}`}
                    className="transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">⏰</div>
                    <div className="text-lg font-bold text-secondary">
                      {Math.ceil(timeUntilStart / 60)}min
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-8xl font-black text-secondary animate-pulse">
                {formatTimeRemaining(timeUntilStart)}
              </div>
              <p className="text-2xl text-muted-foreground">until routine begins</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── MORNING ACTIVE ──
  if (appState === 'morning-active') {
    // ── SHARED VIEW (Saturday or fallback) ──
    if (morningView === 'shared') {
      const DAILY_ROUTINE = getDailyRoutine();
      const sharedStep = getCurrentStep();
      const sharedRemaining = getTimeUntilNextStep();
      const sharedDuration = getStepDuration();
      const sharedColor = getTimerColor();
      const sharedProgress = getProgressPercentage();

      return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
          {audioUnlockOverlay}
          <div className="max-w-6xl mx-auto space-y-8">
            <ScheduleButton />
            {renderTimerPanel({
              routine: DAILY_ROUTINE,
              currentStep: sharedStep,
              timeRemaining: sharedRemaining,
              stepDuration: sharedDuration,
              timerColor: sharedColor,
              progress: sharedProgress,
              label: 'Morning Routine',
              labelColor: 'text-primary',
            })}
            {/* Current time & voice toggle */}
            <div className="flex items-center justify-center gap-4 text-2xl text-muted-foreground">
              <Clock size={32} />
              <span>{timeToUse.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className="gap-1 text-sm"
                disabled={!speechAvailable}
              >
                {speechEnabled && speechAvailable ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
                <span className="text-xs">
                  {!speechAvailable ? 'Voice Unavailable' : speechEnabled ? 'Voice On' : 'Voice Off'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // ── DUAL VIEW (jack-only, split, twins-only) ──
    if (!loadedRoutines) return null;

    const jackRoutine = loadedRoutines.weekdayMorningJack;
    const twinsRoutine = loadedRoutines.weekdayMorningTwins;
    const jackStep = getCurrentStepForRoutine(jackRoutine);
    const twinsStep = getCurrentStepForRoutine(twinsRoutine);

    const jackPanelConfig = {
      routine: jackRoutine,
      currentStep: jackStep,
      timeRemaining: getTimeUntilNextStepForRoutine(jackRoutine),
      stepDuration: getStepDurationForRoutine(jackRoutine),
      timerColor: getTimerColorForRoutine(jackRoutine),
      progress: getProgressForRoutine(jackRoutine),
      label: 'Jack',
      labelColor: 'text-blue-600',
    };

    const twinsPanelConfig = {
      routine: twinsRoutine,
      currentStep: twinsStep,
      timeRemaining: getTimeUntilNextStepForRoutine(twinsRoutine),
      stepDuration: getStepDurationForRoutine(twinsRoutine),
      timerColor: getTimerColorForRoutine(twinsRoutine),
      progress: getProgressForRoutine(twinsRoutine),
      label: 'Ava & Dana',
      labelColor: 'text-pink-600',
    };

    const isSplitView = morningView === 'split';

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
        {audioUnlockOverlay}
        <div className={`${isSplitView ? 'max-w-7xl' : 'max-w-6xl'} mx-auto space-y-8`}>
          <ScheduleButton />

          {/* Current time & voice toggle */}
          <div className="flex items-center justify-center gap-4 text-2xl text-muted-foreground">
            <Clock size={32} />
            <span>{timeToUse.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className="gap-1 text-sm"
              disabled={!speechAvailable}
            >
              {speechEnabled && speechAvailable ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
              <span className="text-xs">
                {!speechAvailable ? 'Voice Unavailable' : speechEnabled ? 'Voice On' : 'Voice Off'}
              </span>
            </Button>
          </div>

          {isSplitView ? (
            <div className="grid grid-cols-2 gap-6">
              {renderTimerPanel({ ...jackPanelConfig, compact: true })}
              {renderTimerPanel({ ...twinsPanelConfig, compact: true })}
            </div>
          ) : morningView === 'jack-only' ? (
            renderTimerPanel(jackPanelConfig)
          ) : (
            renderTimerPanel(twinsPanelConfig)
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

export default App;
