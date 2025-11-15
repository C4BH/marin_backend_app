import mongoose from "mongoose"
import { ObjectId } from "mongoose";


const paymentSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    stripePaymentIntentId: {
        type: String,
        required: true
    },
    stripeChargeId: {
        type: String,
        required: true
    },
    subscriptionPlan: {
        type: String,
        required: true
    },
    subscriptionDuration: {
        type: Number,
        required: true
    },
    metadata: {
        type: Object,
        required: false
    },
    errorMessage: {
        type: String,
        required: false
    },
    completedAt: {
        type: Date,
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


interface Payment extends mongoose.Document {
    _id: ObjectId,
    userId: ObjectId,
    amount: number,
    currency: string,
    paymentMethod: string,
    status: string,
    stripePaymentIntentId: string,
    stripeChargeId: string,
    subscriptionPlan: string,
    subscriptionDuration: number,
    metadata: any,
    errorMessage: string,
    completedAt: Date,
    createdAt: Date,
    updatedAt: Date
}

const Payment = mongoose.model<Payment>("Payment", paymentSchema);

export default Payment;