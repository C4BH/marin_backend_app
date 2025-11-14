import mongoose, { ObjectId } from "mongoose";
import {
    FormCategoryType,
    FormAnswerTypeValue,
    AllFormCategories,
    AllFormAnswerTypes,
    GenderType
} from "./constants";

const formResponseSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    formQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FormQuestion",
    },
    answer: {
        type: String,
        required: true
    },
    answeredAt: {
        type: Date,
        default: Date.now
    }
});

const formQuestionSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    questionNumber: {
        type: Number,
        required: true
    },
    questionText: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: AllFormCategories,
        required: true
    },
    answerType: {
        type: String,
        enum: AllFormAnswerTypes,
        required: true
    },
    options: {
        type: [String],
        required: false
    },
    isRequired: {
        type: Boolean,
        required: true
    },
    order: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true
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


interface FormQuestion extends mongoose.Document {
    _id: ObjectId,
    questionNumber: number,
    questionText: string,
    category: FormCategoryType,
    
    answerType: FormAnswerTypeValue,
    options?: string[], // multiple_choice için
    
    isRequired: boolean,
    order: number,
    isActive: boolean,
    
    createdAt: Date,
    updatedAt: Date
}

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