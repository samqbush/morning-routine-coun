import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, ArrowRight, Bug, Toilet, ForkKnife, Backpack, Sneaker, Bus, SpeakerHigh } from '@phosphor-icons/react';

interface RoutineStep {
  time: string;
  activity: string;
  description: string;
  timeInMinutes: number;
  icon: React.ComponentType<any>;
  iconColor: string;
}

const MORNING_ROUTINE: RoutineStep[] = [
  {
    time: "6:30",
    activity: "Wake Up Time!",
    description: "Brush Teeth & Potty",
    timeInMinutes: 6 * 60 + 30,
    icon: Toilet,
    iconColor: "text-blue-500"
  },
  {
    time: "6:50",
    activity: "Breakfast Time!",
    description: "Quick Breakfast of Pancakes & Sausage",
    timeInMinutes: 6 * 60 + 50,
    icon: ForkKnife,
    iconColor: "text-orange-500"
  },
  {
    time: "7:05",
    activity: "Pack Snacks!",
    description: "Fill Water Bottles and Choose Snacks",
    timeInMinutes: 7 * 60 + 5,
    icon: () => <div className="text-6xl">🥤</div>,
    iconColor: "text-cyan-500"
  },
  {
    time: "7:10",
    activity: "Get Ready!",
    description: "Put on Shoes and Backpack",
    timeInMinutes: 7 * 60 + 10,
    icon: Backpack,
    iconColor: "text-purple-500"
  },
  {
    time: "7:15",
    activity: "School Time!",
    description: "Leave for School Bus",
    timeInMinutes: 7 * 60 + 15,
    icon: Bus,
    iconColor: "text-yellow-500"
  }
];

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugTime, setDebugTime] = useState(new Date());
  const [lastStep, setLastStep] = useState<number>(-3); // Track the last step to detect changes
  const audioContextRef = useRef<AudioContext | null>(null);

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

  const setDebugTimeToStep = (stepIndex: number) => {
    initializeAudio(); // Initialize audio when using debug controls
    
    if (stepIndex === -1) {
      // Set to 10 PM (waiting for tomorrow)
      const newTime = new Date();
      newTime.setHours(22, 0, 0, 0);
      setDebugTime(newTime);
    } else if (stepIndex === -2) {
      // Set to 6:15 AM (before routine starts)
      const newTime = new Date();
      newTime.setHours(6, 15, 0, 0);
      setDebugTime(newTime);
    } else if (stepIndex >= MORNING_ROUTINE.length) {
      // Set to after routine is done (7:30 AM)
      const newTime = new Date();
      newTime.setHours(7, 30, 0, 0);
      setDebugTime(newTime);
    } else {
      // Set to the exact step time
      const stepTime = MORNING_ROUTINE[stepIndex].timeInMinutes;
      const newTime = new Date();
      newTime.setHours(Math.floor(stepTime / 60), stepTime % 60, 0, 0);
      setDebugTime(newTime);
      
      // Play sound when jumping to a new step in debug mode
      setTimeout(() => playStepChangeSound(), 100);
    }
  };

  // Debug controls component
  const DebugControls = () => (
    <Card className="p-6 border-2 border-destructive">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bug size={24} className="text-destructive" />
          <h3 className="text-xl font-bold text-destructive">Debug Mode - Test Different Times</h3>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Current debug time: {(isDebugMode ? debugTime : currentTime).toLocaleTimeString()}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button size="sm" variant="outline" onClick={() => setDebugTimeToStep(-2)}>
            Before Start (6:15)
          </Button>
          {MORNING_ROUTINE.map((step, index) => (
            <Button key={index} size="sm" variant="outline" onClick={() => setDebugTimeToStep(index)}>
              {step.time} - {step.activity}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => setDebugTimeToStep(MORNING_ROUTINE.length)}>
            Finished (7:30)
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDebugTimeToStep(-1)}>
            Evening (10:00 PM)
          </Button>
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => {
              setIsDebugMode(false);
              setDebugTime(new Date());
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
        </div>
      </div>
    </Card>
  );

  const getCurrentTimeInMinutes = () => {
    const timeToUse = isDebugMode ? debugTime : currentTime;
    return timeToUse.getHours() * 60 + timeToUse.getMinutes();
  };

  const getCurrentStep = () => {
    const timeInMinutes = getCurrentTimeInMinutes();
    
    // If it's late in the day (after 8 AM), automatically reset for next day
    if (timeInMinutes > 8 * 60) {
      return -1; // Special case for "waiting for tomorrow"
    }
    
    // Find which step we're currently in
    // If we haven't reached the first step, return -2 (waiting to start)
    if (timeInMinutes < MORNING_ROUTINE[0].timeInMinutes) {
      return -2;
    }
    
    // Find the current active step - the last step whose time has passed
    for (let i = MORNING_ROUTINE.length - 1; i >= 0; i--) {
      if (timeInMinutes >= MORNING_ROUTINE[i].timeInMinutes) {
        // Check if we're still within this step's duration
        const nextStepTime = i + 1 < MORNING_ROUTINE.length ? MORNING_ROUTINE[i + 1].timeInMinutes : MORNING_ROUTINE[i].timeInMinutes + 15;
        if (timeInMinutes < nextStepTime) {
          console.log(`Current time: ${timeInMinutes}, Step ${i} (${MORNING_ROUTINE[i].time}) - ${MORNING_ROUTINE[i].activity}`);
          return i; // We're currently in this step
        }
      }
    }
    
    return MORNING_ROUTINE.length; // All steps completed
  };

  const getTimeUntilNextStep = () => {
    const currentStep = getCurrentStep();
    
    // Handle special cases
    if (currentStep === -2) {
      // Waiting for routine to start
      const timeToUse = isDebugMode ? debugTime : currentTime;
      const currentTimeInSeconds = timeToUse.getHours() * 3600 + timeToUse.getMinutes() * 60 + timeToUse.getSeconds();
      const firstStepTimeInSeconds = MORNING_ROUTINE[0].timeInMinutes * 60;
      return Math.max(0, (firstStepTimeInSeconds - currentTimeInSeconds));
    }
    
    if (currentStep >= MORNING_ROUTINE.length || currentStep < 0) {
      return 0;
    }
    
    // Time remaining in current step
    const timeToUse = isDebugMode ? debugTime : currentTime;
    const currentTimeInSeconds = timeToUse.getHours() * 3600 + timeToUse.getMinutes() * 60 + timeToUse.getSeconds();
    
    // Calculate when this step ends (next step starts, or +15 minutes for last step)
    const nextStepTime = currentStep + 1 < MORNING_ROUTINE.length 
      ? MORNING_ROUTINE[currentStep + 1].timeInMinutes 
      : MORNING_ROUTINE[currentStep].timeInMinutes + 15;
    
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
    
    // Count completed steps (steps where their end time has passed)
    let completedSteps = 0;
    for (let i = 0; i < MORNING_ROUTINE.length; i++) {
      const nextStepTime = i + 1 < MORNING_ROUTINE.length ? MORNING_ROUTINE[i + 1].timeInMinutes : MORNING_ROUTINE[i].timeInMinutes + 15;
      if (timeInMinutes >= nextStepTime) {
        completedSteps++;
      } else {
        break;
      }
    }
    
    const totalSteps = MORNING_ROUTINE.length;
    return (completedSteps / totalSteps) * 100;
  };

  const getStepDuration = () => {
    const currentStep = getCurrentStep();
    
    if (currentStep === -2) {
      // Duration until first step starts
      const timeToUse = isDebugMode ? debugTime : currentTime;
      const currentTimeInSeconds = timeToUse.getHours() * 3600 + timeToUse.getMinutes() * 60 + timeToUse.getSeconds();
      const firstStepTimeInSeconds = MORNING_ROUTINE[0].timeInMinutes * 60;
      return Math.max(0, (firstStepTimeInSeconds - currentTimeInSeconds));
    }
    
    if (currentStep < 0 || currentStep >= MORNING_ROUTINE.length) {
      return 300; // Default 5 minutes for edge cases
    }
    
    // Duration of current step
    const nextStepTime = currentStep + 1 < MORNING_ROUTINE.length 
      ? MORNING_ROUTINE[currentStep + 1].timeInMinutes 
      : MORNING_ROUTINE[currentStep].timeInMinutes + 15;
    
    const stepDurationInMinutes = nextStepTime - MORNING_ROUTINE[currentStep].timeInMinutes;
    return stepDurationInMinutes * 60; // Convert to seconds
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

  // Detect step changes and play sound
  useEffect(() => {
    if (currentStep !== lastStep && currentStep >= 0) {
      // Only play sound for actual step changes (not initial load or special states)
      if (lastStep >= -2) {
        playStepChangeSound();
      }
      setLastStep(currentStep);
    }
  }, [currentStep, lastStep]);

  // Late in day case - show waiting for tomorrow
  if (currentStep === -1) {
    const timeToUse = isDebugMode ? debugTime : currentTime;
    const hoursUntilTomorrow = 24 - timeToUse.getHours() + 6; // Until 6 AM tomorrow
    const minutesUntilTomorrow = (hoursUntilTomorrow * 60) - timeToUse.getMinutes() + 30; // Until 6:30 AM
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-8">
        {/* Debug Mode Toggle */}
        {!isDebugMode && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                initializeAudio(); // Initialize audio on user interaction
                setIsDebugMode(true);
              }}
              className="gap-2"
            >
              <Bug size={16} />
              Test Mode
            </Button>
          </div>
        )}

        <div className="w-full max-w-4xl space-y-8">
          {/* Debug Controls */}
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

  // Early morning case - automatically show waiting screen
  if (currentStep === -2) {
    const timeUntilStart = getTimeUntilNextStep();
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center p-8">
        {/* Debug Mode Toggle */}
        {!isDebugMode && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                initializeAudio(); // Initialize audio on user interaction
                setIsDebugMode(true);
              }}
              className="gap-2"
            >
              <Bug size={16} />
              Test Mode
            </Button>
          </div>
        )}

        <div className="w-full max-w-4xl space-y-8">
          {/* Debug Controls */}
          {isDebugMode && <DebugControls />}
          
          <Card className="p-12 text-center">
            <div className="space-y-8">
              <h1 className="text-6xl font-black text-primary">Good Morning! 🌅</h1>
              <p className="text-3xl font-semibold text-muted-foreground">Get Ready to Start Your Routine!</p>
              
              {/* Visual Timer Ring for Pre-Routine */}
              <div className="relative w-64 h-64 mx-auto">
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
                  {/* Progress circle */}
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
                
                {/* Center content */}
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

  // All done case - automatically reset after 10 minutes
  if (currentStep >= MORNING_ROUTINE.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center p-8">
        {/* Debug Mode Toggle */}
        {!isDebugMode && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                initializeAudio(); // Initialize audio on user interaction
                setIsDebugMode(true);
              }}
              className="gap-2"
            >
              <Bug size={16} />
              Test Mode
            </Button>
          </div>
        )}

        <div className="w-full max-w-4xl space-y-8">
          {/* Debug Controls */}
          {isDebugMode && <DebugControls />}
          
          <Card className="p-12 text-center">
            <div className="space-y-8">
              <CheckCircle size={120} className="text-accent mx-auto" />
              <h1 className="text-6xl font-black text-accent">Great Job! 🎉</h1>
              <p className="text-3xl font-semibold text-muted-foreground">Have a wonderful day at school!</p>
              <p className="text-xl text-muted-foreground">This screen will automatically reset for tomorrow</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Ensure we have a valid current step
  if (currentStep < 0 || currentStep >= MORNING_ROUTINE.length) {
    // This shouldn't happen with our logic, but safety check
    return null;
  }

  const currentActivity = MORNING_ROUTINE[currentStep];
  const nextActivity = currentStep + 1 < MORNING_ROUTINE.length ? MORNING_ROUTINE[currentStep + 1] : null;



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Debug Mode Toggle */}
        {!isDebugMode && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                initializeAudio(); // Initialize audio on user interaction
                setIsDebugMode(true);
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
            <h3 className="text-2xl font-bold">Morning Routine Progress</h3>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {currentStep >= 0 ? `Step ${currentStep + 1} of ${MORNING_ROUTINE.length}` : 'Starting Soon'}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-4 mb-6" />
          
          {/* Visual routine overview */}
          <div className="grid grid-cols-5 gap-4">
            {MORNING_ROUTINE.map((step, index) => {
              const timeInMinutes = getCurrentTimeInMinutes();
              const stepStarted = timeInMinutes >= step.timeInMinutes;
              const nextStepTime = index + 1 < MORNING_ROUTINE.length ? MORNING_ROUTINE[index + 1].timeInMinutes : step.timeInMinutes + 15;
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
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <SpeakerHigh size={16} />
                <span className="text-xs">Audio Alerts</span>
              </div>
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

            {/* Activity Icon */}
            <div className="my-8">
              <currentActivity.icon size={120} className={`mx-auto ${currentActivity.iconColor}`} />
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