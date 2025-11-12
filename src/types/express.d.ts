import { TokenPayload } from "../utils/generate_token";

/**
 * Express Request interface'ine user property'si ekler
 * verifyToken middleware'i, doğrulanmış token bilgisini req.user'a ekler
 * 
 * Bu dosya TypeScript'in module augmentation özelliğini kullanarak
 * Express'in Request interface'ini genişletir. Böylece tüm projede
 * req.user kullanılabilir ve tip güvenliği sağlanır.
 */
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export {};

