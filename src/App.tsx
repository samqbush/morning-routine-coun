import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, ArrowRight, Bug, Toilet, ForkKnife, Backpack, Bus, SpeakerHigh, SpeakerX, Moon, GameController, Book, Pill } from '@phosphor-icons/react';

interface RoutineStep {
  time: string;
  activity: string;
  description: string;
  timeInMinutes: number;
  icon: React.ComponentType<any>;
  iconColor: string;
  routineType: 'morning' | 'evening';
}

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

const MORNING_ROUTINE: RoutineStep[] = [
  {
    time: "6:30 AM",
    activity: "Wake Up Time!",
    description: "Brush Teeth & Potty",
    timeInMinutes: 6 * 60 + 30,
    icon: Toilet,
    iconColor: "text-blue-500",
    routineType: 'morning'
  },
  {
    time: "6:50 AM",
    activity: "Breakfast Time!",
    description: "Quick Breakfast of Pancakes & Sausage",
    timeInMinutes: 6 * 60 + 50,
    icon: ForkKnife,
    iconColor: "text-orange-500",
    routineType: 'morning'
  },
  {
    time: "7:05 AM",
    activity: "Pack Snacks!",
    description: "Fill Water Bottles and Choose Snacks",
    timeInMinutes: 7 * 60 + 5,
    icon: () => <div className="text-6xl">🥤</div>,
    iconColor: "text-cyan-500",
    routineType: 'morning'
  },
  {
    time: "7:10 AM",
    activity: "Get Ready!",
    description: "Put on Shoes and Backpack",
    timeInMinutes: 7 * 60 + 10,
    icon: Backpack,
    iconColor: "text-purple-500",
    routineType: 'morning'
  },
  {
    time: "7:17 AM",
    activity: "School Time!",
    description: "Leave for School Bus",
    timeInMinutes: 7 * 60 + 17,
    icon: Bus,
    iconColor: "text-yellow-500",
    routineType: 'morning'
  }
];

const EVENING_ROUTINES: Record<DayOfWeek, RoutineStep[]> = {
  Monday: [
    {
      time: "5:30 PM",
      activity: "Dinner Time!",
      description: "Family Dinner Together",
      timeInMinutes: 17 * 60 + 30,
      icon: ForkKnife,
      iconColor: "text-red-500",
      routineType: 'evening'
    },
    {
      time: "6:30 PM",
      activity: "Family Activity!",
      description: "Fun Time Together",
      timeInMinutes: 18 * 60 + 30,
      icon: () => <div className="text-6xl">👨‍👩‍👧‍👦</div>,
      iconColor: "text-pink-500",
      routineType: 'evening'
    },
    {
      time: "7:00 PM",
      activity: "Twins Get Ready!",
      description: "Brush Teeth, Potty & Allergy Medicine",
      timeInMinutes: 19 * 60 + 0,
      icon: Pill,
      iconColor: "text-teal-500",
      routineType: 'evening'
    },
    {
      time: "7:15 PM",
      activity: "Story Time!",
      description: "Daddy Reads Books to Twins",
      timeInMinutes: 19 * 60 + 15,
      icon: Book,
      iconColor: "text-indigo-500",
      routineType: 'evening'
    },
    {
      time: "7:30 PM",
      activity: "Game Time!",
      description: "Jack & Daddy Play Video Games",
      timeInMinutes: 19 * 60 + 30,
      icon: GameController,
      iconColor: "text-green-500",
      routineType: 'evening'
    },
    {
      time: "8:30 PM",
      activity: "Jack's Bedtime!",
      description: "Brush Teeth & Get a Book",
      timeInMinutes: 20 * 60 + 30,
      icon: Book,
      iconColor: "text-violet-500",
      routineType: 'evening'
    }
  ],
  Tuesday: [
    {
      time: "5:30 PM",
      activity: "Dinner Time!",
      description: "Family Dinner Together",
      timeInMinutes: 17 * 60 + 30,
      icon: ForkKnife,
      iconColor: "text-red-500",
      routineType: 'evening'
    },
    {
      time: "6:30 PM",
      activity: "Family Activity!",
      description: "Fun Time Together",
      timeInMinutes: 18 * 60 + 30,
      icon: () => <div className="text-6xl">👨‍👩‍👧‍👦</div>,
      iconColor: "text-pink-500",
      routineType: 'evening'
    },
    {
      time: "7:00 PM",
      activity: "Twins Get Ready!",
      description: "Brush Teeth, Potty & Allergy Medicine",
      timeInMinutes: 19 * 60 + 0,
      icon: Pill,
      iconColor: "text-teal-500",
      routineType: 'evening'
    },
    {
      time: "7:15 PM",
      activity: "Story Time!",
      description: "Daddy Reads Books to Twins",
      timeInMinutes: 19 * 60 + 15,
      icon: Book,
      iconColor: "text-indigo-500",
      routineType: 'evening'
    },
    {
      time: "7:30 PM",
      activity: "Game Time!",
      description: "Jack & Daddy Play Video Games",
      timeInMinutes: 19 * 60 + 30,
      icon: GameController,
      iconColor: "text-green-500",
      routineType: 'evening'
    },
    {
      time: "8:30 PM",
      activity: "Jack's Bedtime!",
      description: "Brush Teeth & Get a Book",
      timeInMinutes: 20 * 60 + 30,
      icon: Book,
      iconColor: "text-violet-500",
      routineType: 'evening'
    }
  ],
  Wednesday: [
    {
      time: "5:30 PM",
      activity: "Dinner Time!",
      description: "Family Dinner Together",
      timeInMinutes: 17 * 60 + 30,
      icon: ForkKnife,
      iconColor: "text-red-500",
      routineType: 'evening'
    },
    {
      time: "6:30 PM",
      activity: "Family Activity!",
      description: "Fun Time Together",
      timeInMinutes: 18 * 60 + 30,
      icon: () => <div className="text-6xl">👨‍👩‍👧‍👦</div>,
      iconColor: "text-pink-500",
      routineType: 'evening'
    },
    {
      time: "7:00 PM",
      activity: "Twins Get Ready!",
      description: "Brush Teeth, Potty & Allergy Medicine",
      timeInMinutes: 19 * 60 + 0,
      icon: Pill,
      iconColor: "text-teal-500",
      routineType: 'evening'
    },
    {
      time: "7:15 PM",
      activity: "Story Time!",
      description: "Daddy Reads Books to Twins",
      timeInMinutes: 19 * 60 + 15,
      icon: Book,
      iconColor: "text-indigo-500",
      routineType: 'evening'
    },
    {
      time: "7:30 PM",
      activity: "Game Time!",
      description: "Jack & Daddy Play Video Games",
      timeInMinutes: 19 * 60 + 30,
      icon: GameController,
      iconColor: "text-green-500",
      routineType: 'evening'
    },
    {
      time: "8:30 PM",
      activity: "Jack's Bedtime!",
      description: "Brush Teeth & Get a Book",
      timeInMinutes: 20 * 60 + 30,
      icon: Book,
      iconColor: "text-violet-500",
      routineType: 'evening'
    }
  ],
  Thursday: [
    {
      time: "5:30 PM",
      activity: "Dinner Time!",
      description: "Family Dinner Together",
      timeInMinutes: 17 * 60 + 30,
      icon: ForkKnife,
      iconColor: "text-red-500",
      routineType: 'evening'
    },
    {
      time: "6:30 PM",
      activity: "Family Activity!",
      description: "Fun Time Together",
      timeInMinutes: 18 * 60 + 30,
      icon: () => <div className="text-6xl">👨‍👩‍👧‍👦</div>,
      iconColor: "text-pink-500",
      routineType: 'evening'
    },
    {
      time: "7:00 PM",
      activity: "Twins Get Ready!",
      description: "Brush Teeth, Potty & Allergy Medicine",
      timeInMinutes: 19 * 60 + 0,
      icon: Pill,
      iconColor: "text-teal-500",
      routineType: 'evening'
    },
    {
      time: "7:15 PM",
      activity: "Story Time!",
      description: "Daddy Reads Books to Twins",
      timeInMinutes: 19 * 60 + 15,
      icon: Book,
      iconColor: "text-indigo-500",
      routineType: 'evening'
    },
    {
      time: "7:30 PM",
      activity: "Game Time!",
      description: "Jack & Daddy Play Video Games",
      timeInMinutes: 19 * 60 + 30,
      icon: GameController,
      iconColor: "text-green-500",
      routineType: 'evening'
    },
    {
      time: "8:30 PM",
      activity: "Jack's Bedtime!",
      description: "Brush Teeth & Get a Book",
      timeInMinutes: 20 * 60 + 30,
      icon: Book,
      iconColor: "text-violet-500",
      routineType: 'evening'
    }
  ],
  Friday: [
    {
      time: "5:30 PM",
      activity: "Dinner Time!",
      description: "Family Dinner Together",
      timeInMinutes: 17 * 60 + 30,
      icon: ForkKnife,
      iconColor: "text-red-500",
      routineType: 'evening'
    },
    {
      time: "6:30 PM",
      activity: "Family Activity!",
      description: "Fun Time Together",
      timeInMinutes: 18 * 60 + 30,
      icon: () => <div className="text-6xl">👨‍👩‍👧‍👦</div>,
      iconColor: "text-pink-500",
      routineType: 'evening'
    },
    {
      time: "7:00 PM",
      activity: "Twins Get Ready!",
      description: "Brush Teeth, Potty & Allergy Medicine",
      timeInMinutes: 19 * 60 + 0,
      icon: Pill,
      iconColor: "text-teal-500",
      routineType: 'evening'
    },
    {
      time: "7:15 PM",
      activity: "Story Time!",
      description: "Daddy Reads Books to Twins",
      timeInMinutes: 19 * 60 + 15,
      icon: Book,
      iconColor: "text-indigo-500",
      routineType: 'evening'
    },
    {
      time: "7:30 PM",
      activity: "Game Time!",
      description: "Jack & Daddy Play Video Games",
      timeInMinutes: 19 * 60 + 30,
      icon: GameController,
      iconColor: "text-green-500",
      routineType: 'evening'
    },
    {
      time: "8:30 PM",
      activity: "Jack's Bedtime!",
      description: "Brush Teeth & Get a Book",
      timeInMinutes: 20 * 60 + 30,
      icon: Book,
      iconColor: "text-violet-500",
      routineType: 'evening'
    }
  ],
  Saturday: [
    {
      time: "5:30 PM",
      activity: "Dinner Time!",
      description: "Family Dinner Together",
      timeInMinutes: 17 * 60 + 30,
      icon: ForkKnife,
      iconColor: "text-red-500",
      routineType: 'evening'
    },
    {
      time: "6:30 PM",
      activity: "Family Activity!",
      description: "Fun Time Together",
      timeInMinutes: 18 * 60 + 30,
      icon: () => <div className="text-6xl">👨‍👩‍👧‍👦</div>,
      iconColor: "text-pink-500",
      routineType: 'evening'
    },
    {
      time: "7:00 PM",
      activity: "Twins Get Ready!",
      description: "Brush Teeth, Potty & Allergy Medicine",
      timeInMinutes: 19 * 60 + 0,
      icon: Pill,
      iconColor: "text-teal-500",
      routineType: 'evening'
    },
    {
      time: "7:15 PM",
      activity: "Story Time!",
      description: "Daddy Reads Books to Twins",
      timeInMinutes: 19 * 60 + 15,
      icon: Book,
      iconColor: "text-indigo-500",
      routineType: 'evening'
    },
    {
      time: "7:30 PM",
      activity: "Game Time!",
      description: "Jack & Daddy Play Video Games",
      timeInMinutes: 19 * 60 + 30,
      icon: GameController,
      iconColor: "text-green-500",
      routineType: 'evening'
    },
    {
      time: "8:30 PM",
      activity: "Jack's Bedtime!",
      description: "Brush Teeth & Get a Book",
      timeInMinutes: 20 * 60 + 30,
      icon: Book,
      iconColor: "text-violet-500",
      routineType: 'evening'
    }
  ],
  Sunday: [
    {
      time: "5:30 PM",
      activity: "Dinner Time!",
      description: "Family Dinner Together",
      timeInMinutes: 17 * 60 + 30,
      icon: ForkKnife,
      iconColor: "text-red-500",
      routineType: 'evening'
    },
    {
      time: "6:30 PM",
      activity: "Family Activity!",
      description: "Fun Time Together",
      timeInMinutes: 18 * 60 + 30,
      icon: () => <div className="text-6xl">👨‍👩‍👧‍👦</div>,
      iconColor: "text-pink-500",
      routineType: 'evening'
    },
    {
      time: "7:00 PM",
      activity: "Twins Get Ready!",
      description: "Brush Teeth, Potty & Allergy Medicine",
      timeInMinutes: 19 * 60 + 0,
      icon: Pill,
      iconColor: "text-teal-500",
      routineType: 'evening'
    },
    {
      time: "7:15 PM",
      activity: "Story Time!",
      description: "Daddy Reads Books to Twins",
      timeInMinutes: 19 * 60 + 15,
      icon: Book,
      iconColor: "text-indigo-500",
      routineType: 'evening'
    },
    {
      time: "7:30 PM",
      activity: "Game Time!",
      description: "Jack & Daddy Play Video Games",
      timeInMinutes: 19 * 60 + 30,
      icon: GameController,
      iconColor: "text-green-500",
      routineType: 'evening'
    },
    {
      time: "8:30 PM",
      activity: "Jack's Bedtime!",
      description: "Brush Teeth & Get a Book",
      timeInMinutes: 20 * 60 + 30,
      icon: Book,
      iconColor: "text-violet-500",
      routineType: 'evening'
    }
  ]
};

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugTime, setDebugTime] = useState(new Date());
  const [debugDay, setDebugDay] = useState<DayOfWeek | null>(null);
  const [lastStep, setLastStep] = useState<number>(-3);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);

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
    const timeToUse = isDebugMode ? debugTime : currentTime;
    const dayOfWeek = getDayOfWeek(timeToUse);
    const morningRoutine = isSchoolDay(timeToUse) ? MORNING_ROUTINE : [];
    const eveningRoutine = EVENING_ROUTINES[dayOfWeek];
    return [...morningRoutine, ...eveningRoutine];
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
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
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
      
      let message = '';
      const DAILY_ROUTINE = getDailyRoutine();
      
      if (stepIndex === -2) {
        message = 'Good morning! Get ready to start your routine!';
      } else if (stepIndex === -1) {
        message = 'Good night! See you tomorrow morning!';
      } else if (stepIndex >= DAILY_ROUTINE.length) {
        message = 'Great job! You completed all your routines for today!';
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
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn('Speech synthesis failed:', error);
    }
  };

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
    
    if (DAILY_ROUTINE.length === 0 || timeInMinutes < DAILY_ROUTINE[0].timeInMinutes) {
      return -2;
    }
    
    for (let i = DAILY_ROUTINE.length - 1; i >= 0; i--) {
      if (timeInMinutes >= DAILY_ROUTINE[i].timeInMinutes) {
        const nextStepTime = i + 1 < DAILY_ROUTINE.length ? DAILY_ROUTINE[i + 1].timeInMinutes : DAILY_ROUTINE[i].timeInMinutes + 15;
        if (timeInMinutes < nextStepTime) {
          console.log(`Current time: ${timeInMinutes}, Step ${i} (${DAILY_ROUTINE[i].time}) - ${DAILY_ROUTINE[i].activity}`);
          return i;
        }
      }
    }
    
    return DAILY_ROUTINE.length;
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

  if (currentStep === -1) {
    const timeToUse = isDebugMode ? debugTime : currentTime;
    const hoursUntilTomorrow = 24 - timeToUse.getHours() + 6;
    const minutesUntilTomorrow = (hoursUntilTomorrow * 60) - timeToUse.getMinutes() + 30;
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-8">
        {!isDebugMode && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                initializeAudio();
                setIsDebugMode(true);
                if (!debugDay) {
                  setDebugDay(getDayOfWeek(currentTime));
                }
              }}
              className="gap-2"
            >
              <Bug size={16} />
              Test Mode
            </Button>
          </div>
        )}

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
          {!isDebugMode && (
            <div className="fixed top-4 right-4 z-50">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  initializeAudio();
                  setIsDebugMode(true);
                  if (!debugDay) {
                    setDebugDay(getDayOfWeek(currentTime));
                  }
                }}
                className="gap-2"
              >
                <Bug size={16} />
                Test Mode
              </Button>
            </div>
          )}

          <div className="w-full max-w-4xl space-y-8">
            {isDebugMode && <DebugControls />}
            
            <Card className="p-12 text-center">
              <div className="space-y-8">
                <h1 className="text-6xl font-black text-primary">Happy {dayOfWeek}! 🎉</h1>
                <p className="text-3xl font-semibold text-muted-foreground">No school today - enjoy your weekend!</p>
                <p className="text-2xl text-muted-foreground">Evening routine starts at 5:30 PM</p>
              </div>
            </Card>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center p-8">
        {!isDebugMode && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                initializeAudio();
                setIsDebugMode(true);
                if (!debugDay) {
                  setDebugDay(getDayOfWeek(currentTime));
                }
              }}
              className="gap-2"
            >
              <Bug size={16} />
              Test Mode
            </Button>
          </div>
        )}

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
        {!isDebugMode && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                initializeAudio();
                setIsDebugMode(true);
                if (!debugDay) {
                  setDebugDay(getDayOfWeek(currentTime));
                }
              }}
              className="gap-2"
            >
              <Bug size={16} />
              Test Mode
            </Button>
          </div>
        )}

        <div className="w-full max-w-4xl space-y-8">
          {isDebugMode && <DebugControls />}
          
          <Card className="p-12 text-center">
            <div className="space-y-8">
              <CheckCircle size={120} className="text-accent mx-auto" />
              <h1 className="text-6xl font-black text-accent">Great Job! 🎉</h1>
              <p className="text-3xl font-semibold text-muted-foreground">You completed all your routines for today!</p>
              <p className="text-xl text-muted-foreground">This screen will automatically reset for tomorrow</p>
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
        
        {!isDebugMode && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                initializeAudio();
                setIsDebugMode(true);
                if (!debugDay) {
                  setDebugDay(getDayOfWeek(currentTime));
                }
              }}
              className="gap-2"
            >
              <Bug size={16} />
              Test Mode
            </Button>
          </div>
        )}

        {/* Debug Controls */}
        {isDebugMode && <DebugControls />}
        
        {/* Progress Bar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Daily Routine Progress</h3>
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
              >
                {speechEnabled ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
                <span className="text-xs">{speechEnabled ? 'Voice On' : 'Voice Off'}</span>
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