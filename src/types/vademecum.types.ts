// Vademecum API Type Definitions

// ============================================
// 1. Product List Types (Basic List)
// ============================================

export interface VademecumProduct {
    id: number;
    name: string;
}

export interface VademecumApiResponse {
    data: Array<{
        product: VademecumProduct;
        drug: any;
        drugform: any;
        barcodes: any[];
        published: boolean;
    }>;
    product?: VademecumProduct[]; // Legacy field
    _links?: any;
    _meta?: any;
    success?: boolean;
}

// ============================================
// 2. Product Card Types (Detailed Card)
// ============================================

export interface VademecumUnit {
    id: number;
    name: string; // mg, ml, mcg, L, kg, damla, etc.
}

export interface VademecumIngredient {
    id: number;
    name: string;
    alternativeName?: string;
    amount: number;
    unit: VademecumUnit;
}

export interface VademecumImage {
    url: string;
    thumbnailUrl?: string;
}

export interface VademecumPrice {
    effectiveDate: string; // ISO date string
    factory?: number;
    storage?: number;
    taxPercent: number;
    retail: number;
    storageBased: boolean;
    pharmacy?: number;
    discountRate?: number;
    publicPrice?: number;
    publicPriceVat?: number;
    publicPaidPrice?: Array<{
        price: number;
        priceVatInc: number;
        discountedPriceVatInc?: number;
        groupCode?: string;
        groupLowestUnitPrice: boolean;
    }>;
    currencyCode: string; // TRY, USD, EUR
    abroadProduct: boolean;
    abroadPublicPaidPrice?: number | null;
    abroadPublicPrice?: number | null;
    abroadRetail?: number | null;
}

export interface VademecumLicenseeCompany {
    id: number;
    name: string;
    officialname: string;
    website?: string;
    fax?: string;
    phone?: string;
    address?: string;
    email?: string;
    city?: string;
    district?: string;
}

export interface VademecumDrugType {
    id: number;
    name: string; // İlaç, Kozmetik, Besin Desteği, Mama, etc.
}

export interface VademecumPrescriptionType {
    id: number;
    name: string; // Beyaz Reçete, Kırmızı Reçete, Yeşil Reçete, etc.
}

export interface VademecumCardDetails {
    drugType: VademecumDrugType;
    licenseeCompany: VademecumLicenseeCompany;
    prescriptionType?: VademecumPrescriptionType;
    indication?: string; // Kullanım amacı - ÖNEMLİ!
    ingredients: VademecumIngredient[];
    barcodes?: Array<{
        barcode: string;
        skrsStatus: string;
    }>;
    image?: VademecumImage[];
    price?: VademecumPrice;
}

export interface VademecumProductCard {
    product: VademecumProduct;
    card: VademecumCardDetails;
}

// API Response wrapper for product card endpoint
export interface VademecumProductCardResponse {
    data: VademecumProductCard | [];  // Can be empty array if product not found
    success: boolean;
}

// ============================================
// 3. Internal Types (Matching & Processing)
// ============================================

export interface ProductMatchResult {
    id: string; // MongoDB ID
    vademecumId: number;
    name: string;
    imageUrl?: string;
    price?: number;
    currency?: string;
    manufacturer?: string;
    matchScore: number; // 0-100
    matchReason: string;
    category: string[];
    form?: string;
    ingredients?: Array<{
        name: string;
        amount: number;
        unit: string;
    }>;
    indication?: string;
}

// ============================================
// 4. Cache Types
// ============================================

export interface CachedProductCard {
    data: VademecumProductCard;
    timestamp: number;
    expiresAt: number;
}

export interface CachedProductList {
    data: VademecumProduct[];
    timestamp: number;
    expiresAt: number;
}

// ============================================
// 5. Service Response Types
// ============================================

export interface SyncResult {
    success: boolean;
    message: string;
    stats: {
        total: number;
        synced: number;
        failed: number;
        skipped: number;
    };
    brandCounts?: {
        'protein ocean': number;
        'velavit': number;
        'solgar': number;
    };
    errors?: string[];
}

export interface RecommendationResponse {
    recommendations: ProductMatchResult[];
    totalMatches: number;
    userGoals: string[];
}

