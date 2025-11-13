import User from "../../models/user";
import { Request, Response } from "express";
import { verifyToken } from "../../middlewares/auth";

export const postUserWeightAndHeight = async (req: Request, res: Response) => {
    try {
        const { weight, height } = req.body;
        const userId = req.user?.userId;

        console.log("Request body:", { weight, height });
        console.log("User ID:", userId);

        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        // Weight ve height değerlerini kontrol et
        if (weight === undefined && height === undefined) {
            return res.status(400).json({ message: "Weight or height must be provided" });
        }

        // findByIdAndUpdate kullanarak direkt veritabanını güncelle
        const updateData: { weight?: number; height?: number } = {};
        if (weight !== undefined) updateData.weight = Number(weight);
        if (height !== undefined) updateData.height = Number(height);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Updated user:", { weight: updatedUser.weight, height: updatedUser.height });

        return res.status(200).json({ 
            message: "Ağırlık ve boy değerleri başarıyla güncellendi",
            weight: updatedUser.weight,
            height: updatedUser.height
        });

    } catch (error) {
        console.error("Error updating weight and height:", error);
        return res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : String(error) });
    }
}

export const getUserWeightAndHeight = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user?.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ 
            weight: user?.weight, 
            height: user?.height,
            message: "Ağırlık ve boy değerleri başarıyla alındı"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}