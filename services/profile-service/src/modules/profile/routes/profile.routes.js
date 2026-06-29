import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { requireAuth } from "@finboard/contracts";
import { validate } from "@finboard/shared";
import { profileUpdateSchema } from "../validators/profile.schema.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);
profileRouter.get("/me", getProfile);
profileRouter.put("/me", validate(profileUpdateSchema), updateProfile);
