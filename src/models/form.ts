import mongoose, { ObjectId } from "mongoose";
import {
    FormCategoryType,
    FormAnswerTypeValue,
    AllFormCategories,
    AllFormAnswerTypes,
    GenderType,
    AllGenders
} from "./constants";

const formResponseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    formData: {
        age: {
            type: Number,
            required: false
        },
        occupation: {
            type: String,
            required: false
        },
        height: {
            type: Number,
            required: false
        },
        weight: {
            type: Number,
            required: false
        },
        gender: {
            type: String,
            enum: AllGenders,
            required: false
        },
        exerciseRegularly: {
            type: Boolean,
            required: false
        },
        alcoholSmoking: {
            type: String,
            required: false
        },
        dietTypes: {
            type: [String],
            required: false
        },
        allergies: {
            type: [String],
            required: false
        },
        abnormalBloodTests: {
            type: [String],
            required: false
        },
        chronicConditions: {
            type: [String],
            required: false
        },
        medications: {
            type: [String],
            required: true
        },
        supplementGoals: {
            type: [String],
            required: false
        },
        additionalNotes: {
            type: String,
            required: false
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    answeredAt: {
        type: Date,
        required: true
    }
});

interface FormResponse extends mongoose.Document {
    _id: ObjectId,
    userId: ObjectId,
    formData: {
        age: number,
        occupation: string,
        height: number,
        weight: number,
        gender: GenderType,
        exerciseRegularly: boolean,
        alcoholSmoking: string,
        dietTypes: string[],
        allergies: string[],
        abnormalBloodTests: string[],
        chronicConditions: string[],
        medications: string[],
        supplementGoals: string[],
        additionalNotes: string
},
    createdAt: Date,
    updatedAt: Date,
    answeredAt: Date
}

const FormResponse = mongoose.model<FormResponse>("FormResponse", formResponseSchema);

export default FormResponse;