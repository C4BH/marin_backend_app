import User from "../models/user";


export const WeightAndHeightService = async (userId: string, weight: number, height: number) => {
    try {
            const user = await User.findById(userId);
            if (!user) {
                return { isSuccess: false, message: "Kullanıcı bulunamadı" };
            }

        // Weight ve height değerlerini kontrol et
        if (weight === undefined && height === undefined) {
            return { isSuccess: false, message: "Ağırlık veya boy değeri sağlanmalıdır" };
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
            return { isSuccess: false, message: "Kullanıcı bulunamadı" };
        }
        return { isSuccess: true, message: "Ağırlık ve boy değerleri başarıyla güncellendi" };
    } catch (error) {
        console.error("Bir hata oluştu:", error);
        return { isSuccess: false, message: "Bir hata oluştu", error: error instanceof Error ? error.message : String(error) };
    }
}

