import { Request, Response } from "express";
import { verifyToken } from "../../middlewares/auth";
import User from "../../models/user";
import { getUserProfile as getUserProfileService } from "../../services/user";
import { updateUserProfile as updateUserProfileService } from "../../services/user";
import { healthProfileService as healthProfileServiceService } from "../../services/form";

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Kullanıcı bulunamadı" });
        }
        const result = await getUserProfileService(userId);
        if (!result.isSuccess) {
            return res.status(400).json({ message: result.message });
        }
        return res.status(200).json({ message: result.message, data: result.data });
    } catch (error) {
        console.error("getUserProfile hatası:", error);
        return res.status(500).json({ message: "getUserProfile hatası", error: error instanceof Error ? error.message : String(error) });
    }
}

export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        console.log("userId:", userId);
        if (!userId) {
            return res.status(401).json({ message: "Kullanıcı bulunamadı" });
        }
        const data = req.body;
        console.log("data:", data);
        const result = await updateUserProfileService(userId, data);
        if (!result.isSuccess) {
            return res.status(400).json({ message: result.message });
        }
        return res.status(200).json({ message: result.message, data: result.data });
    } catch (error) {
        console.error("updateUserProfile hatası:", error);
        return res.status(500).json({ message: "updateUserProfile hatası", error: error instanceof Error ? error.message : String(error) });
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Kullanıcı bulunamadı" });
        }
        const result = await User.findByIdAndDelete(userId);
        if (!result) {
            return res.status(400).json({ message: "Kullanıcı bulunamadı" });
        }
        return res.status(200).json({ message: "Kullanıcı başarıyla silindi" });
    } catch (error) {
        console.error("deleteUser hatası:", error);
        return res.status(500).json({ message: "deleteUser hatası", error: error instanceof Error ? error.message : String(error) });
    }
}

export const healthProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Kullanıcı bulunamadı" });
        }
        const data = req.body;
        console.log("data:", data);
        const result = await healthProfileServiceService(userId, data);
        if (!result.isSuccess) {
            return res.status(400).json({ message: result.message });
        }
        return res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("healthProfile hatası:", error);
        return res.status(500).json({ message: "healthProfile hatası", error: error instanceof Error ? error.message : String(error) });
    }
}

export const isFormFilled = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Kullanıcı bulunamadı" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "Kullanıcı bulunamadı" });
        }
        if (user.isFormFilled) {
            return res.status(200).json({ message: "Kullanıcı formunu daha önce doldurdu" });
        }
        return res.status(400).json({ message: "Kullanıcı formunu daha önce doldurmadı" });
    } catch (error) {
        console.error("isFormFilled hatası:", error);
        return res.status(500).json({ message: "isFormFilled hatası", error: error instanceof Error ? error.message : String(error) });
    }
}