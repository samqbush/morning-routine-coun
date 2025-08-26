import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, ArrowRight } from '@phosphor-icons/react';

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getCurrentTimeInMinutes = () => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  };

  const getCurrentStep = () => {
    const timeInMinutes = getCurrentTimeInMinutes();
    
    // If it's late in the day (after 8 AM), automatically reset for next day
    if (timeInMinutes > 8 * 60) {
      return -1; // Special case for "waiting for tomorrow"
    }
    
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

  const currentStep = getCurrentStep();
  const timeRemaining = getTimeUntilNextStep();
  const progressPercentage = getProgressPercentage();

  // Late in day case - show waiting for tomorrow
  if (currentStep === -1) {
    const hoursUntilTomorrow = 24 - currentTime.getHours() + 6; // Until 6 AM tomorrow
    const minutesUntilTomorrow = (hoursUntilTomorrow * 60) - currentTime.getMinutes() + 45; // Until 6:45 AM
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-8">
        <Card className="w-full max-w-4xl p-12 text-center">
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
    );
  }

  // Early morning case - automatically show waiting screen
  if (getCurrentTimeInMinutes() < MORNING_ROUTINE[0].timeInMinutes) {
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
          </div>
        </Card>
      </div>
    );
  }

  // All done case - automatically reset after 10 minutes
  if (currentStep >= MORNING_ROUTINE.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center p-8">
        <Card className="w-full max-w-4xl p-12 text-center">
          <div className="space-y-8">
            <CheckCircle size={120} className="text-accent mx-auto" />
            <h1 className="text-6xl font-black text-accent">Great Job! 🎉</h1>
            <p className="text-3xl font-semibold text-muted-foreground">Have a wonderful day at school!</p>
            <p className="text-xl text-muted-foreground">This screen will automatically reset for tomorrow</p>
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

      </div>
    </div>
  );
}

export default App;