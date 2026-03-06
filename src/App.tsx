import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, ArrowUp, ArrowDown, Bug, SpeakerHigh, SpeakerX, CheckCircle, Play, Pause, SkipForward } from '@phosphor-icons/react';
import { loadRoutines, RoutineStep, EveningStep } from '@/lib/routineLoader';

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

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
  const [lastStep, setLastStep] = useState<number>(-3);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [activityNotification, setActivityNotification] = useState<string | null>(null);
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Evening routine state
  const [eveningMode, setEveningMode] = useState<'select' | 'active' | 'complete'>('select');
  const [selectedSteps, setSelectedSteps] = useState<EveningStep[]>([]);
  const [currentEveningStep, setCurrentEveningStep] = useState(0);
  const [stepStartTime, setStepStartTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTimeRemaining, setPausedTimeRemaining] = useState<number | null>(null);
  const [eveningInitialized, setEveningInitialized] = useState(false);

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
                <li><code className="font-mono">eveningPresets</code> (object with Mon-Sun keys → step ID arrays)</li>
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
    if (!loadedRoutines) {
      return [];
    }
    
    const dayOfWeek = getDayOfWeek(isDebugMode ? debugTime : currentTime);
    
    if (isSchoolDay(isDebugMode ? debugTime : currentTime)) {
      return loadedRoutines.weekdayMorning;
    } else if (dayOfWeek === 'Saturday') {
      return loadedRoutines.saturdayMorning;
    }
    return [];
  };

  // Initialize evening preset based on day of week
  const dayForPreset = getDayOfWeek(isDebugMode ? debugTime : currentTime);

  useEffect(() => {
    if (!loadedRoutines || eveningInitialized) return;
    const presetIds = loadedRoutines.eveningPresets[dayForPreset];
    const steps = presetIds
      .map(id => loadedRoutines!.eveningSteps.find(s => s.id === id))
      .filter((s): s is EveningStep => s !== undefined);
    setSelectedSteps(steps);
    setEveningInitialized(true);
  }, [dayForPreset, eveningInitialized]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check speech synthesis availability on mount
  useEffect(() => {
    const checkSpeechAvailability = () => {
      // Check if speechSynthesis exists
      if (!('speechSynthesis' in window)) {
        setSpeechAvailable(false);
        return;
      }

      // Try to detect Samsung TV browser
      const userAgent = navigator.userAgent.toLowerCase();
      const isSamsungTV = userAgent.includes('tizen') || 
                          (userAgent.includes('samsung') && userAgent.includes('smart-tv'));
      
      if (isSamsungTV) {
        setSpeechAvailable(false);
        console.warn('Samsung TV detected - Speech Synthesis not supported');
        return;
      }

      // Rely on feature/UA detection; some browsers require user gesture before speak()
      setSpeechAvailable(true);
    };

    checkSpeechAvailability();
  }, []);

  // Cleanup notification timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Initialize audio context on first user interaction
  const initializeAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  // Play notification sound
  const playStepChangeSound = () => {
    initializeAudio();
    
    if (!audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      
      // Create a pleasant chime sound
      const oscillator1 = ctx.createOscillator();
      const oscillator2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Connect nodes
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Set frequencies for a pleasant chord (C major)
      oscillator1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      
      // Set wave types
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      
      // Create envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      // Start and stop
      const startTime = ctx.currentTime;
      oscillator1.start(startTime);
      oscillator2.start(startTime);
      oscillator1.stop(startTime + 0.8);
      oscillator2.stop(startTime + 0.8);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  };

  // Announce activity using speech synthesis
  const announceActivity = (stepIndex: number) => {
    // If the user has turned voice off, do not speak or show fallback notifications
    if (!speechEnabled) {
      return;
    }

    // If speech is unavailable, show visual notification instead
    if (!speechAvailable || !('speechSynthesis' in window)) {
      showActivityNotification(stepIndex);
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
      
      let message = '';
      const DAILY_ROUTINE = getDailyRoutine();
      
      if (stepIndex === -2) {
        message = 'Good morning! Get ready to start your routine!';
      } else if (stepIndex === -1) {
        message = 'Good night! See you tomorrow morning!';
      } else if (stepIndex >= DAILY_ROUTINE.length) {
        message = 'Great job! Now it\'s Sam and Jill time. Mommy and Daddy can relax together!';
      } else if (stepIndex >= 0 && stepIndex < DAILY_ROUTINE.length) {
        const activity = DAILY_ROUTINE[stepIndex];
        message = `Time for ${activity.activity}! ${activity.description}`;
      }
      
      if (message) {
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
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        // Add error handler to fallback to visual notification if speech fails
        utterance.onerror = () => {
          setSpeechAvailable(false);
          showActivityNotification(stepIndex);
        };
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn('Speech synthesis failed:', error);
      setSpeechAvailable(false);
      // Fallback to visual notification
      showActivityNotification(stepIndex);
    }
  };

  // Show visual notification for activity changes
  const dismissNotification = () => {
    setActivityNotification(null);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
  };

  const showActivityNotification = (stepIndex: number) => {
    let message = '';
    const DAILY_ROUTINE = getDailyRoutine();
    
    if (stepIndex === -2) {
      message = 'Good morning! Get ready to start your routine!';
    } else if (stepIndex === -1) {
      message = 'Good night! See you tomorrow morning!';
    } else if (stepIndex >= DAILY_ROUTINE.length) {
      message = 'Great job! Now it\'s Sam and Jill time. Mommy and Daddy can relax together!';
    } else if (stepIndex >= 0 && stepIndex < DAILY_ROUTINE.length) {
      const activity = DAILY_ROUTINE[stepIndex];
      message = `Time for ${activity.activity}!\n${activity.description}`;
    }
    
    if (message) {
      // Clear any existing timeout
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      
      setActivityNotification(message);
      // Auto-hide after 8 seconds
      notificationTimeoutRef.current = setTimeout(() => {
        dismissNotification();
      }, 8000);
    }
  };

  // Announce evening activity using speech synthesis
  const announceEveningActivity = (step: EveningStep | null, isComplete?: boolean) => {
    if (!speechEnabled) return;

    let message = '';
    if (isComplete) {
      message = 'Great job! The evening routine is complete. Now it\'s Sam and Jill time!';
    } else if (step) {
      message = `Time for ${step.activity}! ${step.description}. You have ${step.durationMinutes} minutes.`;
    }

    if (!message) return;

    if (!speechAvailable || !('speechSynthesis' in window)) {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      setActivityNotification(message);
      notificationTimeoutRef.current = setTimeout(() => dismissNotification(), 8000);
      return;
    }

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
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        setActivityNotification(message);
        notificationTimeoutRef.current = setTimeout(() => dismissNotification(), 8000);
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeechAvailable(false);
    }
  };

  // Evening step selection helpers
  const toggleStep = (step: EveningStep) => {
    setSelectedSteps(prev => {
      const exists = prev.find(s => s.id === step.id);
      if (exists) return prev.filter(s => s.id !== step.id);
      return [...prev, step];
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setSelectedSteps(prev => {
      const newSteps = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSteps.length) return prev;
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      return newSteps;
    });
  };

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
    setEveningMode('select');
    setCurrentEveningStep(0);
    setStepStartTime(null);
    setIsPaused(false);
    setPausedTimeRemaining(null);
    // Re-initialize from preset
    setEveningInitialized(false);
  };

  const skipEveningStep = () => {
    advanceEveningStep();
  };

  const togglePause = () => {
    if (isPaused) {
      // Resume: set new start time based on remaining time
      if (pausedTimeRemaining !== null) {
        const durationSeconds = selectedSteps[currentEveningStep].durationMinutes * 60;
        const elapsed = durationSeconds - pausedTimeRemaining;
        setStepStartTime(Date.now() - elapsed * 1000);
      }
      setIsPaused(false);
      setPausedTimeRemaining(null);
    } else {
      // Pause: store remaining time
      const remaining = getEveningTimeRemaining();
      setPausedTimeRemaining(remaining);
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

  // Evening timer tick
  useEffect(() => {
    if (eveningMode !== 'active' || isPaused) return;
    const interval = setInterval(() => {
      const remaining = getEveningTimeRemaining();
      if (remaining <= 0) {
        advanceEveningStep();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [eveningMode, isPaused, currentEveningStep, stepStartTime, selectedSteps]);

  const setDebugTimeToStep = (stepIndex: number) => {
    initializeAudio();
    
    const DAILY_ROUTINE = getDailyRoutine();
    
    if (stepIndex === -1) {
      const newTime = new Date();
      newTime.setHours(22, 0, 0, 0);
      setDebugTime(newTime);
    } else if (stepIndex === -2) {
      const newTime = new Date();
      newTime.setHours(6, 15, 0, 0);
      setDebugTime(newTime);
    } else if (stepIndex === -3) {
      // After morning — set time past last morning step
      if (DAILY_ROUTINE.length > 0) {
        const lastStep = DAILY_ROUTINE[DAILY_ROUTINE.length - 1];
        const breakTime = lastStep.timeInMinutes + 5;
        const newTime = new Date();
        newTime.setHours(Math.floor(breakTime / 60), breakTime % 60, 0, 0);
        setDebugTime(newTime);
      }
    } else if (stepIndex >= DAILY_ROUTINE.length) {
      const newTime = new Date();
      newTime.setHours(21, 0, 0, 0);
      setDebugTime(newTime);
    } else {
      const stepTime = DAILY_ROUTINE[stepIndex].timeInMinutes;
      const newTime = new Date();
      newTime.setHours(Math.floor(stepTime / 60), stepTime % 60, 0, 0);
      setDebugTime(newTime);
      
      setTimeout(() => {
        playStepChangeSound();
        announceActivity(stepIndex);
      }, 100);
    }
  };

  // Debug controls component
  const DebugControls = () => {
    const DAILY_ROUTINE = getDailyRoutine();
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return (
    <Card className="p-6 border-2 border-destructive">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bug size={24} className="text-destructive" />
          <h3 className="text-xl font-bold text-destructive">Debug Mode - Test Different Times & Days</h3>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Current debug time: {(isDebugMode ? debugTime : currentTime).toLocaleTimeString()}
          {debugDay && <span className="ml-2 font-semibold">({debugDay})</span>}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Select Day of Week:</h4>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {days.map((day) => (
              <Button 
                key={day}
                size="sm" 
                variant={debugDay === day ? "default" : "outline"}
                onClick={() => setDebugDay(day)}
              >
                {day.slice(0, 3)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Jump to Activity:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button size="sm" variant="outline" onClick={() => setDebugTimeToStep(-2)}>
              Before Start (6:15 AM)
            </Button>
            {DAILY_ROUTINE.map((step, index) => (
              <Button key={index} size="sm" variant="outline" onClick={() => setDebugTimeToStep(index)}>
                {step.time} - {step.activity}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={() => setDebugTimeToStep(-3)}>
              Break Time (After Morning)
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDebugTimeToStep(DAILY_ROUTINE.length)}>
              Finished (9:00 PM)
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDebugTimeToStep(-1)}>
              Late Night (10:00 PM)
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => {
              setIsDebugMode(false);
              setDebugTime(new Date());
              setDebugDay(null);
            }}
          >
            Exit Debug Mode
          </Button>
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
            variant="outline" 
            onClick={() => announceActivity(getCurrentStep())}
            className="gap-2"
          >
            {speechEnabled ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
            Test Voice
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
      </div>
    </Card>
  );};

  const getCurrentTimeInMinutes = () => {
    const timeToUse = isDebugMode ? debugTime : currentTime;
    return timeToUse.getHours() * 60 + timeToUse.getMinutes();
  };

  const getCurrentStep = () => {
    const timeInMinutes = getCurrentTimeInMinutes();
    const DAILY_ROUTINE = getDailyRoutine();
    
    if (timeInMinutes > 21 * 60) {
      return -1;
    }
    
    // No morning routine today — go straight to evening selection
    if (DAILY_ROUTINE.length === 0) {
      return -3;
    }

    if (timeInMinutes < DAILY_ROUTINE[0].timeInMinutes) {
      return -2;
    }
    
    // Morning-only routine: find current step or mark as done
    for (let i = DAILY_ROUTINE.length - 1; i >= 0; i--) {
      if (timeInMinutes >= DAILY_ROUTINE[i].timeInMinutes) {
        const nextStepTime = i + 1 < DAILY_ROUTINE.length ? DAILY_ROUTINE[i + 1].timeInMinutes : DAILY_ROUTINE[i].timeInMinutes + 15;
        if (timeInMinutes < nextStepTime) {
          return i;
        }
      }
    }
    
    // Past all morning steps
    return -3;
  };

  const getTimeUntilNextStep = () => {
    const currentStep = getCurrentStep();
    const DAILY_ROUTINE = getDailyRoutine();
    
    if (currentStep === -2) {
      const timeToUse = isDebugMode ? debugTime : currentTime;
      const currentTimeInSeconds = timeToUse.getHours() * 3600 + timeToUse.getMinutes() * 60 + timeToUse.getSeconds();
      if (DAILY_ROUTINE.length === 0) return 0;
      const firstStepTimeInSeconds = DAILY_ROUTINE[0].timeInMinutes * 60;
      return Math.max(0, (firstStepTimeInSeconds - currentTimeInSeconds));
    }
    
    if (currentStep >= DAILY_ROUTINE.length || currentStep < 0) {
      return 0;
    }
    
    const timeToUse = isDebugMode ? debugTime : currentTime;
    const currentTimeInSeconds = timeToUse.getHours() * 3600 + timeToUse.getMinutes() * 60 + timeToUse.getSeconds();
    
    const nextStepTime = currentStep + 1 < DAILY_ROUTINE.length 
      ? DAILY_ROUTINE[currentStep + 1].timeInMinutes 
      : DAILY_ROUTINE[currentStep].timeInMinutes + 15;
    
    const nextStepTimeInSeconds = nextStepTime * 60;
    
    return Math.max(0, nextStepTimeInSeconds - currentTimeInSeconds);
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds === 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const currentStep = getCurrentStep();
    if (currentStep < 0) return 0;
    
    const timeInMinutes = getCurrentTimeInMinutes();
    const DAILY_ROUTINE = getDailyRoutine();
    
    let completedSteps = 0;
    for (let i = 0; i < DAILY_ROUTINE.length; i++) {
      const nextStepTime = i + 1 < DAILY_ROUTINE.length ? DAILY_ROUTINE[i + 1].timeInMinutes : DAILY_ROUTINE[i].timeInMinutes + 15;
      if (timeInMinutes >= nextStepTime) {
        completedSteps++;
      } else {
        break;
      }
    }
    
    const totalSteps = DAILY_ROUTINE.length;
    return (completedSteps / totalSteps) * 100;
  };

  const getStepDuration = () => {
    const currentStep = getCurrentStep();
    const DAILY_ROUTINE = getDailyRoutine();
    
    if (currentStep === -2) {
      const timeToUse = isDebugMode ? debugTime : currentTime;
      const currentTimeInSeconds = timeToUse.getHours() * 3600 + timeToUse.getMinutes() * 60 + timeToUse.getSeconds();
      if (DAILY_ROUTINE.length === 0) return 300;
      const firstStepTimeInSeconds = DAILY_ROUTINE[0].timeInMinutes * 60;
      return Math.max(0, (firstStepTimeInSeconds - currentTimeInSeconds));
    }
    
    if (currentStep < 0 || currentStep >= DAILY_ROUTINE.length) {
      return 300;
    }
    
    const nextStepTime = currentStep + 1 < DAILY_ROUTINE.length 
      ? DAILY_ROUTINE[currentStep + 1].timeInMinutes 
      : DAILY_ROUTINE[currentStep].timeInMinutes + 15;
    
    const stepDurationInMinutes = nextStepTime - DAILY_ROUTINE[currentStep].timeInMinutes;
    return stepDurationInMinutes * 60;
  };

  // Get color based on time remaining percentage
  const getTimerColor = () => {
    const stepDuration = getStepDuration();
    const timeRemainingSeconds = getTimeUntilNextStep();
    const percentageRemaining = stepDuration > 0 ? timeRemainingSeconds / stepDuration : 0;
    
    // Green (good time) to yellow (moderate) to red (urgent)
    if (percentageRemaining > 0.5) {
      // Green to yellow transition (100% = green, 50% = yellow)
      const greenToYellow = (percentageRemaining - 0.5) * 2;
      return `rgb(${Math.round(255 * (1 - greenToYellow))}, 255, 0)`;
    } else {
      // Yellow to red transition (50% = yellow, 0% = red)
      const yellowToRed = percentageRemaining * 2;
      return `rgb(255, ${Math.round(255 * yellowToRed)}, 0)`;
    }
  };

  const currentStep = getCurrentStep();
  const timeRemaining = getTimeUntilNextStep();
  const progressPercentage = getProgressPercentage();
  const DAILY_ROUTINE = getDailyRoutine();

  useEffect(() => {
    if (currentStep !== lastStep) {
      if (lastStep >= -3 && lastStep !== currentStep) {
        playStepChangeSound();
        announceActivity(currentStep);
      }
      setLastStep(currentStep);
    }
  }, [currentStep, lastStep]);

  // Helper to render a reusable timer color for evening
  const getEveningTimerColor = () => {
    const remaining = getEveningTimeRemaining();
    const duration = getEveningStepDuration();
    const percentageRemaining = duration > 0 ? remaining / duration : 0;
    if (percentageRemaining > 0.5) {
      const greenToYellow = (percentageRemaining - 0.5) * 2;
      return `rgb(${Math.round(255 * (1 - greenToYellow))}, 255, 0)`;
    } else {
      const yellowToRed = percentageRemaining * 2;
      return `rgb(255, ${Math.round(255 * yellowToRed)}, 0)`;
    }
  };

  // Render Test Mode button (reusable)
  const TestModeButton = () => !isDebugMode ? (
    <div className="fixed top-4 right-4 z-50">
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          initializeAudio();
          setIsDebugMode(true);
          if (!debugDay) setDebugDay(getDayOfWeek(currentTime));
        }}
        className="gap-2"
      >
        <Bug size={16} />
        Test Mode
      </Button>
    </div>
  ) : null;

  if (currentStep === -3) {
    // Morning complete — show evening routine UI
    if (eveningMode === 'active' && selectedSteps.length > 0) {
      // Active evening countdown
      const evStep = selectedSteps[currentEveningStep];
      const nextEvStep = currentEveningStep + 1 < selectedSteps.length ? selectedSteps[currentEveningStep + 1] : null;
      const evRemaining = getEveningTimeRemaining();
      const evDuration = getEveningStepDuration();
      const evColor = getEveningTimerColor();
      const evProgress = (currentEveningStep / selectedSteps.length) * 100;

      return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <TestModeButton />
            {isDebugMode && <DebugControls />}

            {/* Fullscreen Activity Notification */}
            {activityNotification && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500"
                onClick={dismissNotification}
                role="alert"
                aria-live="assertive"
              >
                <Card className="p-16 max-w-4xl mx-8 border-4 border-primary bg-gradient-to-br from-primary/20 to-secondary/20">
                  <div className="space-y-6 text-center">
                    <div className="text-8xl">🔔</div>
                    <h2 className="text-6xl font-black text-primary leading-tight whitespace-pre-line">
                      {activityNotification}
                    </h2>
                    <p className="text-3xl text-muted-foreground mt-8">Tap anywhere to dismiss</p>
                  </div>
                </Card>
              </div>
            )}

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
                <div className="flex justify-center gap-6 mt-8">
                  <Button size="lg" variant="outline" onClick={togglePause} className="gap-3 text-2xl px-8 py-6">
                    {isPaused ? <Play size={32} /> : <Pause size={32} />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button size="lg" variant="secondary" onClick={skipEveningStep} className="gap-3 text-2xl px-8 py-6">
                    <SkipForward size={32} />
                    Skip
                  </Button>
                  <Button size="lg" variant="destructive" onClick={resetEveningRoutine} className="gap-3 text-2xl px-8 py-6">
                    Stop
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
      // Evening routine complete
      return (
        <div className="min-h-screen bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center p-8">
          <TestModeButton />
          <div className="w-full max-w-4xl space-y-8">
            {isDebugMode && <DebugControls />}
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

    // Evening selection screen (eveningMode === 'select')
    const allEveningSteps = loadedRoutines?.eveningSteps ?? [];
    const totalMinutes = selectedSteps.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMins = totalMinutes % 60;

    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 to-secondary/20 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <TestModeButton />
          {isDebugMode && <DebugControls />}

          {/* Morning Complete Banner */}
          {getDailyRoutine().length > 0 && (
            <Card className="p-8 text-center">
              <div className="flex items-center justify-center gap-4">
                <CheckCircle size={48} className="text-accent" />
                <h2 className="text-3xl font-black text-accent">Morning Routine Complete! 🎉</h2>
              </div>
            </Card>
          )}

          {/* Evening Routine Header */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-black text-foreground">Evening Routine</h1>
                <p className="text-xl text-muted-foreground mt-2">
                  Select and order your activities for tonight
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {totalHours > 0 ? `${totalHours}h ${remainingMins}m` : `${remainingMins}m`}
                </div>
                <p className="text-lg text-muted-foreground">total time</p>
              </div>
            </div>

            {/* Selected Steps - Reorderable */}
            <div className="space-y-3 mb-8">
              <h3 className="text-2xl font-bold mb-4">Tonight's Routine ({selectedSteps.length} steps)</h3>
              {selectedSteps.length === 0 && (
                <p className="text-xl text-muted-foreground py-8 text-center">No steps selected. Add steps from below.</p>
              )}
              {selectedSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp size={20} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === selectedSteps.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown size={20} />
                    </Button>
                  </div>
                  <step.icon size={40} className={step.iconColor} />
                  <div className="flex-1">
                    <div className="text-xl font-bold">{step.activity}</div>
                    <div className="text-lg text-muted-foreground">{step.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">{step.durationMinutes}m</Badge>
                  <Button size="sm" variant="destructive" onClick={() => toggleStep(step)} className="text-lg px-4 py-2">
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {/* Available Steps to Add */}
            {allEveningSteps.filter(s => !selectedSteps.find(sel => sel.id === s.id)).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-2xl font-bold mb-4">Available Steps</h3>
                {allEveningSteps
                  .filter(s => !selectedSteps.find(sel => sel.id === s.id))
                  .map(step => (
                    <div key={step.id} className="flex items-center gap-4 p-4 bg-muted/30 border border-muted rounded-lg">
                      <step.icon size={40} className={step.iconColor} />
                      <div className="flex-1">
                        <div className="text-xl font-bold">{step.activity}</div>
                        <div className="text-lg text-muted-foreground">{step.description}</div>
                      </div>
                      <Badge variant="outline" className="text-lg px-3 py-1">{step.durationMinutes}m</Badge>
                      <Button size="sm" variant="default" onClick={() => toggleStep(step)} className="text-lg px-4 py-2">
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* Start Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={startEveningRoutine}
              disabled={selectedSteps.length === 0}
              className="text-3xl px-12 py-8 gap-4"
            >
              <Play size={40} />
              Start Evening Routine
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === -1) {
    const timeToUse = isDebugMode ? debugTime : currentTime;
    const hoursUntilTomorrow = 24 - timeToUse.getHours() + 6;
    const minutesUntilTomorrow = (hoursUntilTomorrow * 60) - timeToUse.getMinutes() + 30;
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-8">
        <TestModeButton />
        <div className="w-full max-w-4xl space-y-8">
          {isDebugMode && <DebugControls />}
          
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

  if (currentStep === -2) {
    const timeUntilStart = getTimeUntilNextStep();
    const timeToUse = isDebugMode ? debugTime : currentTime;
    const isWeekend = !isSchoolDay(timeToUse);
    const dayOfWeek = getDayOfWeek(timeToUse);
    
    if (isWeekend && DAILY_ROUTINE.length > 0 && timeUntilStart > 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center p-8">
          <TestModeButton />
          <div className="w-full max-w-4xl space-y-8">
            {isDebugMode && <DebugControls />}
            
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
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center p-8">
        <TestModeButton />
        <div className="w-full max-w-4xl space-y-8">
          {isDebugMode && <DebugControls />}
          
          <Card className="p-12 text-center">
            <div className="space-y-8">
              <h1 className="text-6xl font-black text-primary">Good Morning! 🌅</h1>
              <p className="text-3xl font-semibold text-muted-foreground">Get Ready to Start Your Routine!</p>
              
              <div className="relative w-64 h-64 mx-auto">
                <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    className="text-muted/30"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke={getTimerColor()}
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (timeUntilStart / getStepDuration())}`}
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

  if (currentStep >= DAILY_ROUTINE.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center p-8">
        <TestModeButton />
        <div className="w-full max-w-4xl space-y-8">
          {isDebugMode && <DebugControls />}
          
          <Card className="p-12 text-center">
            <div className="space-y-8">
              <CheckCircle size={120} className="text-accent mx-auto" />
              <h1 className="text-6xl font-black text-accent">Great Job! 🎉</h1>
              <p className="text-3xl font-semibold text-muted-foreground">Now it's Sam and Jill time!</p>
              <p className="text-xl text-muted-foreground">Mommy and Daddy can relax together</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep < 0 || currentStep >= DAILY_ROUTINE.length) {
    return null;
  }

  const currentActivity = DAILY_ROUTINE[currentStep];
  const nextActivity = currentStep + 1 < DAILY_ROUTINE.length ? DAILY_ROUTINE[currentStep + 1] : null;



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <TestModeButton />

        {/* Debug Controls */}
        {isDebugMode && <DebugControls />}
        
        {/* Speech Unavailable Warning Banner */}
        {!speechAvailable && (
          <Card className="p-6 border-2 border-orange-500 bg-orange-50">
            <div className="flex items-center gap-4">
              <SpeakerX size={48} className="text-orange-600" />
              <div>
                <h3 className="text-2xl font-bold text-orange-900">Voice Announcements Not Available</h3>
                <p className="text-lg text-orange-700 mt-1">
                  Your TV browser doesn't support voice announcements. Watch for the large visual notifications when activities change!
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Fullscreen Activity Notification - replaces speech on TV */}
        {activityNotification && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500"
            onClick={dismissNotification}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <Card className="p-16 max-w-4xl mx-8 border-4 border-primary bg-gradient-to-br from-primary/20 to-secondary/20">
              <div className="space-y-6 text-center">
                <div className="text-8xl" aria-hidden="true">🔔</div>
                <h2 
                  id="notification-title"
                  className="text-6xl font-black text-primary leading-tight whitespace-pre-line"
                >
                  {activityNotification}
                </h2>
                <p className="text-3xl text-muted-foreground mt-8">
                  Tap anywhere to dismiss
                </p>
              </div>
            </Card>
          </div>
        )}
        
        {/* Progress Bar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Morning Routine Progress</h3>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {currentStep >= 0 ? `Step ${currentStep + 1} of ${DAILY_ROUTINE.length}` : 'Starting Soon'}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-4 mb-6" />
          
          {/* Visual routine overview */}
          <div className="grid grid-cols-5 gap-2 md:grid-cols-6 lg:grid-cols-11">
            {DAILY_ROUTINE.map((step, index) => {
              const timeInMinutes = getCurrentTimeInMinutes();
              const stepStarted = timeInMinutes >= step.timeInMinutes;
              const nextStepTime = index + 1 < DAILY_ROUTINE.length ? DAILY_ROUTINE[index + 1].timeInMinutes : step.timeInMinutes + 15;
              const stepCompleted = timeInMinutes >= nextStepTime;
              const stepActive = stepStarted && !stepCompleted;
              
              return (
                <div 
                  key={index} 
                  className={`text-center p-3 rounded-lg transition-all ${
                    stepCompleted
                      ? 'bg-accent/20 border-2 border-accent' 
                      : stepActive
                      ? 'bg-primary/20 border-2 border-primary animate-pulse' 
                      : 'bg-muted/50 border border-muted'
                  }`}
                >
                  <step.icon 
                    size={32} 
                    className={`mx-auto mb-2 ${
                      stepCompleted
                        ? 'text-accent' 
                        : stepActive
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                  <div className={`text-sm font-semibold ${
                    stepCompleted
                      ? 'text-accent' 
                      : stepActive
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}>
                    {step.time}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Main Timer Display */}
        <Card className="p-12 text-center">
          <div className="space-y-6">
            
            {/* Current Time */}
            <div className="flex items-center justify-center gap-4 text-2xl text-muted-foreground">
              <Clock size={32} />
              <span>{(isDebugMode ? debugTime : currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {isDebugMode && <Badge variant="destructive" className="ml-2">TEST MODE</Badge>}
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

            {/* Countdown Timer with color transition */}
            <div 
              className="text-9xl font-black animate-pulse transition-colors duration-1000"
              style={{ color: getTimerColor() }}
            >
              {formatTimeRemaining(timeRemaining)}
            </div>

            {/* Visual Timer Ring for Non-Readers */}
            <div className="relative w-64 h-64 mx-auto my-8">
              {/* Background circle */}
              <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  className="text-muted/30"
                />
                {/* Progress circle with color transition */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke={getTimerColor()}
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - (timeRemaining / getStepDuration()))}`}
                  className="transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <currentActivity.icon size={80} className={`mx-auto ${currentActivity.iconColor}`} />
                  <div 
                    className="mt-2 text-lg font-bold transition-colors duration-1000"
                    style={{ color: getTimerColor() }}
                  >
                    {Math.ceil(timeRemaining / 60)}min
                  </div>
                </div>
              </div>
            </div>



            {/* Current Activity */}
            <div className="space-y-4">
              <Badge variant="default" className="text-2xl px-8 py-3">
                {currentActivity.time}
              </Badge>
              <h1 className="text-5xl font-black text-foreground">
                {currentActivity.activity}
              </h1>
              <p className="text-3xl font-semibold text-muted-foreground">
                {currentActivity.description}
              </p>
            </div>

          </div>
        </Card>

        {/* Next Activity Preview */}
        {nextActivity && (
          <Card className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <nextActivity.icon size={48} className={nextActivity.iconColor} />
                <div>
                  <h3 className="text-2xl font-bold text-muted-foreground mb-2">Up Next:</h3>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xl px-4 py-2">
                      {nextActivity.time}
                    </Badge>
                    <span className="text-2xl font-semibold">{nextActivity.activity}</span>
                  </div>
                  <p className="text-xl text-muted-foreground mt-2">{nextActivity.description}</p>
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

export default App;