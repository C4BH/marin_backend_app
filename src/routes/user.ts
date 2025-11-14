import {  postUserWeightAndHeight } from "../controllers/user/form";
import { getUserProfile, updateUserProfile, deleteUser, healthProfile, isFormFilled } from "../controllers/user/profile";
import { Router } from "express";
import { verifyToken } from "../middlewares/auth";

const router = Router();

router.use(verifyToken);
router.post("/weight-and-height", postUserWeightAndHeight);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.delete("/profile", deleteUser);
router.post("/health-form", healthProfile);
router.get("/is-form-filled", isFormFilled);

export default router;