interface EmailFormatCheck {
    email: string;
    isValid: boolean;
    errorMessage?: string;
}

export const validateEmail = (email: string): boolean => {
    if (!email) return false;
    // Daha katı bir email regex kullanıyorum
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Ekstra kontroller
    if (email.includes(' ')) return false;  // Boşluk içeremez
    if (email.includes('..')) return false; // Ardışık nokta içeremez
    if (!email.includes('@')) return false; // @ işareti içermeli
    if (email.indexOf('@') === 0) return false; // @ işareti başta olamaz
    if (email.indexOf('@') === email.length - 1) return false; // @ işareti sonda olamaz
    if (email.split('@')[1].indexOf('.') === -1) return false; // @ işaretinden sonra nokta olmalı
    
    return emailRegex.test(email);
  };
