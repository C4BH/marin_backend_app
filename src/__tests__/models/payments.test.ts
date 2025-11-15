import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Payment from '../../models/payments';

describe('Payment Model', () => {
  describe('Schema validation', () => {
    it('should create a payment with all required fields', async () => {
      const paymentData = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 29.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentIntentId: 'pi_1234567890',
        stripeChargeId: 'ch_1234567890',
        subscriptionPlan: 'pro',
        subscriptionDuration: 30,
        completedAt: new Date(),
      };

      const payment = await Payment.create(paymentData);

      expect(payment._id).toBeDefined();
      expect(payment.userId).toEqual(paymentData.userId);
      expect(payment.amount).toBe(29.99);
      expect(payment.currency).toBe('USD');
      expect(payment.paymentMethod).toBe('card');
      expect(payment.status).toBe('completed');
      expect(payment.stripePaymentIntentId).toBe('pi_1234567890');
      expect(payment.stripeChargeId).toBe('ch_1234567890');
      expect(payment.subscriptionPlan).toBe('pro');
      expect(payment.subscriptionDuration).toBe(30);
      expect(payment.completedAt).toBeDefined();
    });

    it('should create payment with default timestamps', async () => {
      const payment = await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 19.99,
        currency: 'EUR',
        paymentMethod: 'card',
        status: 'pending',
        stripePaymentIntentId: 'pi_test',
        stripeChargeId: 'ch_test',
        subscriptionPlan: 'basic',
        subscriptionDuration: 30,
        completedAt: new Date(),
      });

      expect(payment.createdAt).toBeDefined();
      expect(payment.createdAt).toBeInstanceOf(Date);
      expect(payment.updatedAt).toBeDefined();
      expect(payment.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle different currencies', async () => {
      const currencies = ['USD', 'EUR', 'GBP', 'TRY'];

      for (const currency of currencies) {
        const payment = await Payment.create({
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          amount: 50,
          currency,
          paymentMethod: 'card',
          status: 'completed',
          stripePaymentIntentId: `pi_${currency}`,
          stripeChargeId: `ch_${currency}`,
          subscriptionPlan: 'pro',
          subscriptionDuration: 30,
          completedAt: new Date(),
        });

        expect(payment.currency).toBe(currency);
      }
    });

    it('should handle different payment statuses', async () => {
      const statuses = ['pending', 'completed', 'failed', 'refunded'];

      for (const status of statuses) {
        const payment = await Payment.create({
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          amount: 30,
          currency: 'USD',
          paymentMethod: 'card',
          status,
          stripePaymentIntentId: `pi_${status}`,
          stripeChargeId: `ch_${status}`,
          subscriptionPlan: 'basic',
          subscriptionDuration: 30,
          completedAt: new Date(),
        });

        expect(payment.status).toBe(status);
      }
    });
  });

  describe('Payment methods', () => {
    it('should accept card payment method', async () => {
      const payment = await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 49.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentIntentId: 'pi_card_test',
        stripeChargeId: 'ch_card_test',
        subscriptionPlan: 'enterprise',
        subscriptionDuration: 365,
        completedAt: new Date(),
      });

      expect(payment.paymentMethod).toBe('card');
    });

    it('should accept other payment methods', async () => {
      const methods = ['card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay'];

      for (const method of methods) {
        const payment = await Payment.create({
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          amount: 25,
          currency: 'USD',
          paymentMethod: method,
          status: 'completed',
          stripePaymentIntentId: `pi_${method}`,
          stripeChargeId: `ch_${method}`,
          subscriptionPlan: 'basic',
          subscriptionDuration: 30,
          completedAt: new Date(),
        });

        expect(payment.paymentMethod).toBe(method);
      }
    });
  });

  describe('Subscription plans', () => {
    it('should handle different subscription plans', async () => {
      const plans = ['basic', 'pro', 'enterprise'];

      for (const plan of plans) {
        const payment = await Payment.create({
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          amount: 100,
          currency: 'USD',
          paymentMethod: 'card',
          status: 'completed',
          stripePaymentIntentId: `pi_${plan}`,
          stripeChargeId: `ch_${plan}`,
          subscriptionPlan: plan,
          subscriptionDuration: 30,
          completedAt: new Date(),
        });

        expect(payment.subscriptionPlan).toBe(plan);
      }
    });

    it('should handle different subscription durations', async () => {
      const durations = [7, 30, 90, 365];

      for (const duration of durations) {
        const payment = await Payment.create({
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          amount: 50,
          currency: 'USD',
          paymentMethod: 'card',
          status: 'completed',
          stripePaymentIntentId: `pi_${duration}`,
          stripeChargeId: `ch_${duration}`,
          subscriptionPlan: 'pro',
          subscriptionDuration: duration,
          completedAt: new Date(),
        });

        expect(payment.subscriptionDuration).toBe(duration);
      }
    });
  });

  describe('Optional fields', () => {
    it('should store metadata', async () => {
      const metadata = {
        orderId: 'ORD-12345',
        promoCode: 'SAVE20',
        referralSource: 'email_campaign',
      };

      const payment = await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 39.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentIntentId: 'pi_metadata',
        stripeChargeId: 'ch_metadata',
        subscriptionPlan: 'pro',
        subscriptionDuration: 30,
        metadata,
        completedAt: new Date(),
      });

      expect(payment.metadata).toEqual(metadata);
      expect(payment.metadata.orderId).toBe('ORD-12345');
      expect(payment.metadata.promoCode).toBe('SAVE20');
    });

    it('should store error message for failed payments', async () => {
      const errorMessage = 'Insufficient funds';

      const payment = await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'failed',
        stripePaymentIntentId: 'pi_failed',
        stripeChargeId: 'ch_failed',
        subscriptionPlan: 'enterprise',
        subscriptionDuration: 365,
        errorMessage,
        completedAt: new Date(),
      });

      expect(payment.errorMessage).toBe(errorMessage);
    });
  });

  describe('Stripe integration', () => {
    it('should store Stripe payment intent ID', async () => {
      const paymentIntentId = 'pi_3ABcDeFgHiJkLmNo';

      const payment = await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 29.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: 'ch_test',
        subscriptionPlan: 'basic',
        subscriptionDuration: 30,
        completedAt: new Date(),
      });

      expect(payment.stripePaymentIntentId).toBe(paymentIntentId);
    });

    it('should store Stripe charge ID', async () => {
      const chargeId = 'ch_3ABcDeFgHiJkLmNo';

      const payment = await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 29.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentIntentId: 'pi_test',
        stripeChargeId: chargeId,
        subscriptionPlan: 'basic',
        subscriptionDuration: 30,
        completedAt: new Date(),
      });

      expect(payment.stripeChargeId).toBe(chargeId);
    });
  });

  describe('Query operations', () => {
    it('should find payments by userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId,
        amount: 19.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentIntentId: 'pi_user_test',
        stripeChargeId: 'ch_user_test',
        subscriptionPlan: 'basic',
        subscriptionDuration: 30,
        completedAt: new Date(),
      });

      const found = await Payment.find({ userId });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].userId).toEqual(userId);
    });

    it('should find payments by status', async () => {
      await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 29.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentIntentId: 'pi_status_test',
        stripeChargeId: 'ch_status_test',
        subscriptionPlan: 'pro',
        subscriptionDuration: 30,
        completedAt: new Date(),
      });

      const found = await Payment.find({ status: 'completed' });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].status).toBe('completed');
    });

    it('should find payments by subscription plan', async () => {
      await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 49.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentIntentId: 'pi_plan_test',
        stripeChargeId: 'ch_plan_test',
        subscriptionPlan: 'pro',
        subscriptionDuration: 30,
        completedAt: new Date(),
      });

      const found = await Payment.find({ subscriptionPlan: 'pro' });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].subscriptionPlan).toBe('pro');
    });

    it('should find payments by Stripe payment intent ID', async () => {
      const paymentIntentId = 'pi_unique_12345';
      await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 39.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: 'ch_unique_12345',
        subscriptionPlan: 'enterprise',
        subscriptionDuration: 365,
        completedAt: new Date(),
      });

      const found = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

      expect(found).toBeDefined();
      expect(found?.stripePaymentIntentId).toBe(paymentIntentId);
    });

    it('should update payment status', async () => {
      const payment = await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        amount: 29.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'pending',
        stripePaymentIntentId: 'pi_update_test',
        stripeChargeId: 'ch_update_test',
        subscriptionPlan: 'basic',
        subscriptionDuration: 30,
        completedAt: new Date(),
      });

      payment.status = 'completed';
      payment.completedAt = new Date();
      await payment.save();

      const updated = await Payment.findById(payment._id);
      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeDefined();
    });
  });

  describe('References', () => {
    it('should maintain reference to user', async () => {
      const userId = new mongoose.Types.ObjectId();

      const payment = await Payment.create({
        _id: new mongoose.Types.ObjectId(),
        userId,
        amount: 19.99,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'completed',
        stripePaymentIntentId: 'pi_ref_test',
        stripeChargeId: 'ch_ref_test',
        subscriptionPlan: 'basic',
        subscriptionDuration: 30,
        completedAt: new Date(),
      });

      expect(payment.userId).toEqual(userId);
    });
  });
});
