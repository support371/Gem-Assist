import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getLeadershipData, getCompanyHistory } from "./notion";
import { registerOpsCleanupRoutes } from "./opsCleanup";

export async function registerRoutes(app: Express): Promise<Server> {
  registerOpsCleanupRoutes(app);

  // Leadership data from Notion
  app.get("/api/leadership", async (req, res) => {
    try {
      const data = await getLeadershipData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching leadership data:", error);
      res.status(500).json({ error: "Failed to fetch leadership data" });
    }
  });

  // Company history data
  app.get("/api/company-history", async (req, res) => {
    try {
      const data = await getCompanyHistory();
      res.json(data);
    } catch (error) {
      console.error("Error fetching company history:", error);
      res.status(500).json({ error: "Failed to fetch company history" });
    }
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
