import { SubscriptionPlan, SubscriptionStatus, UserRole } from './../../models/constants';
import { Request, Response } from "express";
import User from "../../models/user";

export const BecomePremium = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Kullanıcı bulunamadı" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        }
        user.subscription.plan = SubscriptionPlan.PERSONAL;
        user.subscription.status = SubscriptionStatus.ACTIVE;
        await user.save();
        return res.status(200).json({ message: "Kullanıcı premium olarak güncellendi" });
    } catch (error) {
        console.error("Bir hata oluştu:", error);
        return res.status(500).json({ message: "Bir hata oluştu" });
    }
}