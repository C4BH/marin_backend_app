/**
 * User Service
 * Kullanıcı işlemleri için servis katmanı
 */

import User from "../models/user";

// TODO: Implement user-related service functions
// - getUserProfile
// - updateUserProfile
// - getUserSupplements
// etc.


export const getUserProfile = async (userId: string) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return { isSuccess: false, message: "Kullanıcı bulunamadı" };
        }
        return { isSuccess: true, message: "Kullanıcı profili başarıyla alındı", data: {
            name: user.name,
            surname: user.surname,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
        } };
    } catch (error) {
        console.error("getUserProfile hatası:", error);
        return { isSuccess: false, message: "getUserProfile hatası", error: error instanceof Error ? error.message : String(error) };
    }
}

export const updateUserProfile = async (userId: string, data: any) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return { isSuccess: false, message: "Kullanıcı bulunamadı" };
        }
        const updatedUser = await User.findByIdAndUpdate(userId, data, { new: true });
        if (!updatedUser) {
            return { isSuccess: false, message: "Kullanıcı bulunamadı" };
        }
        return { isSuccess: true, message: "Kullanıcı profili başarıyla güncellendi", data: updatedUser };
    } catch (error) {
        console.error("updateUserProfile hatası:", error);
        return { isSuccess: false, message: "updateUserProfile hatası", error: error instanceof Error ? error.message : String(error) };
    }
}



