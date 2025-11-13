import mongoose, { ObjectId } from "mongoose";
import {
    SupplementFormType,
    EffectivenessType,
    SourceTypeType,
    AllSupplementForms,
    AllEffectivenessLevels,
    AllSourceTypes
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
    form: {
        type: String,
        enum: AllSupplementForms,
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
      dailyValue: Number,
      source: {
        type: String,
        enum: ['natural', 'synthetic'],
        required: false
      }
    }],
    usage: {
      type: {
        recommendedDosage: {
          type: String,
          required: false
        },
        frequency: {
          type: String,
          required: false
        },
        timing: {
          type: String,
          required: false
        },
        duration: {
          type: String,
          required: false
        }
      },
      required: false,
      _id: false
    },
    scientificData: {
      type: {
        consensusScore: {
          type: Number,
          required: false
        },
        studyCount: {
          type: Number,
          required: false
        },
        effectiveness: {
          type: String,
          enum: AllEffectivenessLevels,
          required: false
        },
        summary: {
          type: String,
          required: false
        },
        lastUpdated: {
          type: Date,
          required: false
        },
        sources: {
          type: [{
            title: {
              type: String,
              required: true
            },
            url: {
              type: String,
              required: true
            },
            publicationDate: {
              type: Date,
              required: false
            }
          }],
          required: false
        }
      },
      required: false,
      _id: false
    },
    medicalInfo: {
      type: {
        description: {
          type: String,
          required: false
        },
        approvedUses: {
          type: [String],
          required: false
        },
        sideEffects: {
          type: [String],
          required: false
        },
        interactions: {
          type: [String],
          required: false
        },
        contraindications: {
          type: [String],
          required: false
        },
        warnings: {
          type: [String],
          required: false
        }
      },
      required: false,
      _id: false
    },
    rating: {
      type: Number,
      required: false
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    category: {
      type: [String],
      required: false
    },
    sourceType: {
      type: String,
      enum: AllSourceTypes,
      required: true
    },
    sourceId: {
      type: String,
      required: false
    },
    lastSynced: {
      type: Date,
      required: false
    },
    price: {
      type: Number,
      required: false
    },
    currency: {
      type: String,
      required: false
    },
    availability: {
      type: Boolean,
      required: false
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
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