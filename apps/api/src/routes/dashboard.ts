import { Router } from "express";
import { summarize } from "../services/posts.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    res.json(await summarize());
  } catch (err) {
    next(err);
  }
});
