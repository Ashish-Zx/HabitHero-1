import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Calendar } from "lucide-react";
import type { Habit } from "@shared/schema";

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
}

export function HabitCard({ habit, onComplete }: HabitCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{habit.name}</CardTitle>
        <div className="text-muted-foreground">
          <Calendar className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span>Current Streak</span>
            </div>
            <span className="text-2xl font-bold">{habit.currentStreak}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Best Streak</span>
            </div>
            <span className="text-2xl font-bold">{habit.bestStreak}</span>
          </div>
          <Button
            className="w-full mt-4"
            onClick={onComplete}
          >
            Complete Today
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
