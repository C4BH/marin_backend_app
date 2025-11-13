import User from "../../models/user";
import { Request, Response } from "express";
import { verifyToken } from "../../middlewares/auth";
import { WeightAndHeightService } from "../../services/form";

export const postUserWeightAndHeight = async (req: Request, res: Response) => {
    try {
        const { weight, height } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Kullanıcı bulunamadı" });
        }
        console.log("İstek body:", { weight, height });
        console.log("User ID:", userId);

        const { isSuccess, message, error } = await WeightAndHeightService(userId , weight, height);

        if (!isSuccess) {
            return res.status(400).json({ message: error });
        }
    } catch (error) {
        console.error("Bir hata oluştu:", error);
        return res.status(500).json({ message: "Bir hata oluştu", error: error instanceof Error ? error.message : String(error) });
    }
}
