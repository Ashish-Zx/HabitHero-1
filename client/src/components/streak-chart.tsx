import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Habit } from "@shared/schema";

interface StreakChartProps {
  habits: Habit[];
}

export function StreakChart({ habits }: StreakChartProps) {
  const data = habits.map((habit) => ({
    name: habit.name,
    currentStreak: habit.currentStreak,
    bestStreak: habit.bestStreak,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="currentStreak"
            stroke="#4A90E2"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="bestStreak"
            stroke="#34C759"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
