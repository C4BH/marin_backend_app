import mongoose, { ObjectId } from "mongoose";
import {
    SupplementFormType,
    EffectivenessType,
    SourceTypeType
} from "./constants";

const supplementSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    ingredients: [{
      name: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        required: true
      },
      dailyValue: Number
    }],
    scientificData: {
      consensusScore: Number,
      studyCount: Number,
      summary: String
    },
    medicalInfo: {
      description: String,
      sideEffects: [String],
      interactions: [String]
    },
    rating: Number, // Ortalama rating
    category: [String]
  });

interface Supplement extends mongoose.Document {
        _id: ObjectId,
        name: string,
        brand: string,
        category: string[],
        
        // Form bilgisi ⭐ Eksik
        form: SupplementFormType,
        
        ingredients: {
          name: string,
          amount: number,
          unit: string,
          dailyValue: number,
          source?: string // 'natural', 'synthetic'
        }[],
        
        // Kullanım bilgisi ⭐ Eksik
        usage: {
            recommendedDosage: string,
            frequency: string,
            timing: string,
            duration?: string
        },
        
        scientificData: {
          consensusScore: number,
          studyCount: number,
          effectiveness: EffectivenessType,
          summary: string,
          lastUpdated?: Date,
          sources?: {
              title: string,
              url: string,
              publicationDate?: Date
          }[]
        },
        
        medicalInfo: {
          description: string,
          approvedUses?: string[], // ⭐ Eksik
          sideEffects: string[],
          interactions: string[],
          contraindications?: string[], // ⭐ Eksik
          warnings?: string[] // ⭐ Eksik - "Gebelikte kullanmayın" vs
        },
        
        // Rating & Reviews
        rating: number,
        reviewCount: number, // ⭐ Eksik
        
        // Veri kaynağı ⭐ Eksik
        sourceType: SourceTypeType,
        sourceId?: string,
        lastSynced?: Date,
        
        // Ticari bilgi (ileride)
        price?: number,
        currency?: string,
        availability?: boolean,
        
        isActive: boolean, // ⭐ Eksik - Admin onayı için
        createdAt: Date,
        updatedAt: Date
}

const Supplement = mongoose.model<Supplement>("Supplement", supplementSchema);

export default Supplement;