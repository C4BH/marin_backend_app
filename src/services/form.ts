import FormResponse from "../models/form";
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
        console.log("updatedUser:", updatedUser);
        return { isSuccess: true, message: "Ağırlık ve boy değerleri başarıyla güncellendi" };
    } catch (error) {
        console.error("Bir hata oluştu:", error);
        return { isSuccess: false, message: "Bir hata oluştu", error: error instanceof Error ? error.message : String(error) };
    }
}

export const healthProfileService = async (userId: string, data: any) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return { isSuccess: false, message: "Kullanıcı bulunamadı" };
        }
        const formData = {
            age: data.age,
            occupation: data.occupation,
            height: data.height,
            weight: data.weight,
            gender: data.gender,
            exerciseRegularly: data.exerciseRegularly,
            alcoholSmoking: data.alcoholSmoking,
            dietTypes: data.dietTypes,
            allergies: data.allergies,
            abnormalBloodTests: data.abnormalBloodTests,
            chronicConditions: data.chronicConditions,
            medications: data.medications,
            supplementGoals: data.supplementGoals,
            additionalNotes: data.additionalNotes,
        }
        const formResponse = new FormResponse({
            userId: userId,
            formData: formData,
            answeredAt: new Date(),
        });
        await formResponse.save();
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: { formData: formData, isFormFilled: true } }, { new: true });
        if (!updatedUser) {
            return { isSuccess: false, message: "Kullanıcı bulunamadı" };
        }
        return { isSuccess: true, message: "Sağlık profili başarıyla kaydedildi" };
    } catch (error) {
        console.error("healthProfileService hatası:", error);
        return { isSuccess: false, message: "healthProfileService hatası", error: error instanceof Error ? error.message : String(error) };
    }
}

