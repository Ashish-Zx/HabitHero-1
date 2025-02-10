import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertHabitSchema } from "@shared/schema";
import { generateMotivationalMessage } from "./openai";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Get all habits for user
  app.get("/api/habits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const habits = await storage.getHabitsByUserId(req.user.id);
    res.json(habits);
  });

  // Create new habit
  app.post("/api/habits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertHabitSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const habit = await storage.createHabit({
      ...parsed.data,
      userId: req.user.id,
    });
    res.status(201).json(habit);
  });

  // Complete habit for today
  app.post("/api/habits/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const habitId = parseInt(req.params.id);
    const habit = await storage.getHabitById(habitId);
    
    if (!habit || habit.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    const completion = await storage.completeHabit(habitId, req.user.id);
    const updatedHabit = await storage.getHabitById(habitId);
    
    const motivation = await generateMotivationalMessage(
      habit.name,
      updatedHabit!.currentStreak,
    );

    res.json({ completion, habit: updatedHabit, motivation });
  });

  const httpServer = createServer(app);
  return httpServer;
}
