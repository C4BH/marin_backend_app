/**
 * Şifre güvenliğini kontrol eden yardımcı fonksiyon
 * @param password Kontrol edilecek şifre
 * @returns Hata mesajları dizisi veya başarı durumunda boş dizi
 */
export const validateStrongPassword = (password: string): string[] => {
    // Şifre kriterleri
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    // Hata mesajları
    const errors: string[] = [];
    
    if (password.length < minLength) {
        errors.push(`Şifre en az ${minLength} karakter uzunluğunda olmalıdır`);
    }
    if (!hasUpperCase) {
        errors.push('Şifre en az bir büyük harf içermelidir');
    }
    if (!hasLowerCase) {
        errors.push('Şifre en az bir küçük harf içermelidir');
    }
    if (!hasNumbers) {
        errors.push('Şifre en az bir rakam içermelidir');
    }
    if (!hasSpecialChar) {
        errors.push('Şifre en az bir özel karakter içermelidir (!@#$%^&*()_+-=[]{};\'"\\|,.<>/?)');
    }
    if (password.includes(" ")) {
        errors.push('Şifre boşluk içeremez');
    }

    return errors;
}; 