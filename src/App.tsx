import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, ArrowRight, Bug } from '@phosphor-icons/react';

interface RoutineStep {
  time: string;
  activity: string;
  description: string;
  timeInMinutes: number;
}

const MORNING_ROUTINE: RoutineStep[] = [
  {
    time: "6:45",
    activity: "Wake Up Time!",
    description: "Brush Teeth & Potty",
    timeInMinutes: 6 * 60 + 45
  },
  {
    time: "6:50",
    activity: "Breakfast Time!",
    description: "Quick Breakfast of Pancakes & Sausage",
    timeInMinutes: 6 * 60 + 50
  },
  {
    time: "7:05",
    activity: "Pack Snacks!",
    description: "Fill Water Bottles and Choose Snacks",
    timeInMinutes: 7 * 60 + 5
  },
  {
    time: "7:10",
    activity: "Get Ready!",
    description: "Put on Shoes and Backpack",
    timeInMinutes: 7 * 60 + 10
  },
  {
    time: "7:15",
    activity: "School Time!",
    description: "Leave for School Bus",
    timeInMinutes: 7 * 60 + 15
  }
];

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugTime, setDebugTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const setDebugTimeToStep = (stepIndex: number) => {
    if (stepIndex === -1) {
      // Set to 10 PM (waiting for tomorrow)
      const newTime = new Date();
      newTime.setHours(22, 0, 0, 0);
      setDebugTime(newTime);
    } else if (stepIndex === -2) {
      // Set to 6:30 AM (before routine starts)
      const newTime = new Date();
      newTime.setHours(6, 30, 0, 0);
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
            Before Start (6:30)
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
    
    for (let i = 0; i < MORNING_ROUTINE.length; i++) {
      if (timeInMinutes <= MORNING_ROUTINE[i].timeInMinutes) {
        return i;
      }
    }
    return MORNING_ROUTINE.length; // All steps completed
  };

  const getTimeUntilNextStep = () => {
    const currentStep = getCurrentStep();
    if (currentStep >= MORNING_ROUTINE.length || currentStep < 0) return 0;
    
    const timeInMinutes = getCurrentTimeInMinutes();
    const nextStepTime = MORNING_ROUTINE[currentStep].timeInMinutes;
    return Math.max(0, nextStepTime - timeInMinutes);
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes === 0) return "00:00";
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const currentStep = getCurrentStep();
    if (currentStep < 0) return 0;
    const totalSteps = MORNING_ROUTINE.length;
    return (currentStep / totalSteps) * 100;
  };

  const currentStep = getCurrentStep();
  const timeRemaining = getTimeUntilNextStep();
  const progressPercentage = getProgressPercentage();

  // Late in day case - show waiting for tomorrow
  if (currentStep === -1) {
    const timeToUse = isDebugMode ? debugTime : currentTime;
    const hoursUntilTomorrow = 24 - timeToUse.getHours() + 6; // Until 6 AM tomorrow
    const minutesUntilTomorrow = (hoursUntilTomorrow * 60) - timeToUse.getMinutes() + 45; // Until 6:45 AM
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-8">
        {/* Debug Mode Toggle */}
        {!isDebugMode && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDebugMode(true)}
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
              <p className="text-2xl font-semibold text-muted-foreground">The morning routine will start again at 6:45 AM</p>
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
  if (getCurrentTimeInMinutes() < MORNING_ROUTINE[0].timeInMinutes) {
    const timeUntilStart = MORNING_ROUTINE[0].timeInMinutes - getCurrentTimeInMinutes();
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center p-8">
        {/* Debug Mode Toggle */}
        {!isDebugMode && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDebugMode(true)}
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
              onClick={() => setIsDebugMode(true)}
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
              onClick={() => setIsDebugMode(true)}
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
              Step {currentStep + 1} of {MORNING_ROUTINE.length}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-4" />
        </Card>

        {/* Main Timer Display */}
        <Card className="p-12 text-center">
          <div className="space-y-6">
            
            {/* Current Time */}
            <div className="flex items-center justify-center gap-4 text-2xl text-muted-foreground">
              <Clock size={32} />
              <span>{(isDebugMode ? debugTime : currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {isDebugMode && <Badge variant="destructive" className="ml-2">TEST MODE</Badge>}
            </div>

            {/* Countdown Timer */}
            <div className="text-9xl font-black text-primary animate-pulse">
              {formatTimeRemaining(timeRemaining)}
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
              <ArrowRight size={48} className="text-muted-foreground" />
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}

export default App;