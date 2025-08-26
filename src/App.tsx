import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, ArrowRight, RotateCcw } from '@phosphor-icons/react';

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
  const [manualStart, setManualStart] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getCurrentTimeInMinutes = () => {
    const time = manualStart && startTime ? startTime : currentTime;
    return time.getHours() * 60 + time.getMinutes();
  };

  const getCurrentStep = () => {
    const timeInMinutes = getCurrentTimeInMinutes();
    
    for (let i = 0; i < MORNING_ROUTINE.length; i++) {
      if (timeInMinutes < MORNING_ROUTINE[i].timeInMinutes) {
        return i;
      }
    }
    return MORNING_ROUTINE.length; // All steps completed
  };

  const getTimeUntilNextStep = () => {
    const currentStep = getCurrentStep();
    if (currentStep >= MORNING_ROUTINE.length) return 0;
    
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
    const totalSteps = MORNING_ROUTINE.length;
    return (currentStep / totalSteps) * 100;
  };

  const handleManualStart = () => {
    setManualStart(true);
    setStartTime(new Date(new Date().setHours(6, 45, 0, 0)));
  };

  const handleReset = () => {
    setManualStart(false);
    setStartTime(null);
  };

  const currentStep = getCurrentStep();
  const timeRemaining = getTimeUntilNextStep();
  const progressPercentage = getProgressPercentage();

  // Early morning case
  if (getCurrentTimeInMinutes() < MORNING_ROUTINE[0].timeInMinutes && !manualStart) {
    const timeUntilStart = MORNING_ROUTINE[0].timeInMinutes - getCurrentTimeInMinutes();
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center p-8">
        <Card className="w-full max-w-4xl p-12 text-center">
          <div className="space-y-8">
            <h1 className="text-6xl font-black text-primary">Good Morning! 🌅</h1>
            <p className="text-3xl font-semibold text-muted-foreground">Get Ready to Start Your Routine!</p>
            <div className="text-8xl font-black text-secondary animate-pulse">
              {formatTimeRemaining(timeUntilStart)}
            </div>
            <p className="text-2xl text-muted-foreground">until routine begins</p>
            <Button onClick={handleManualStart} size="lg" className="text-2xl px-12 py-6">
              Start Now!
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // All done case
  if (currentStep >= MORNING_ROUTINE.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center p-8">
        <Card className="w-full max-w-4xl p-12 text-center">
          <div className="space-y-8">
            <CheckCircle size={120} className="text-accent mx-auto" />
            <h1 className="text-6xl font-black text-accent">Great Job! 🎉</h1>
            <p className="text-3xl font-semibold text-muted-foreground">Have a wonderful day at school!</p>
            <Button onClick={handleReset} size="lg" className="text-2xl px-12 py-6">
              <RotateCcw size={32} className="mr-4" />
              Start Over
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentActivity = MORNING_ROUTINE[currentStep];
  const nextActivity = currentStep + 1 < MORNING_ROUTINE.length ? MORNING_ROUTINE[currentStep + 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
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
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

        {/* Manual Controls */}
        <div className="flex justify-center gap-4">
          <Button onClick={handleReset} variant="outline" size="lg" className="text-xl px-8 py-4">
            <RotateCcw size={24} className="mr-2" />
            Reset Routine
          </Button>
          {!manualStart && (
            <Button onClick={handleManualStart} size="lg" className="text-xl px-8 py-4">
              Start Manual Timer
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;