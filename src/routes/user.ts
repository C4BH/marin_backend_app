import { getUserWeightAndHeight, postUserWeightAndHeight } from "../controllers/user/form";
import { Router } from "express";
import { verifyToken } from "../middlewares/auth";
const router = Router();

router.use(verifyToken);
router.post("/weight-and-height", postUserWeightAndHeight);
router.get("/weight-and-height", getUserWeightAndHeight);

export default router;