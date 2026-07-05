import { Router } from "express";
import { emergencyNumbers } from "../data/emergencyNumbers.js";

export const emergencyNumbersRouter = Router();

emergencyNumbersRouter.get("/", (_req, res) => {
  res.json(emergencyNumbers);
});
