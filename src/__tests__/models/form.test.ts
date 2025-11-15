import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import FormResponse from '../../models/form';

describe('FormResponse Model', () => {
  describe('Schema validation', () => {
    it('should create a form response with required fields', async () => {
      const formData = {
        userId: new mongoose.Types.ObjectId(),
        formData: {
          medications: ['Aspirin', 'Vitamin D'],
        },
        answeredAt: new Date(),
      };

      const formResponse = await FormResponse.create(formData);

      expect(formResponse._id).toBeDefined();
      expect(formResponse.userId).toEqual(formData.userId);
      expect(formResponse.formData.medications).toEqual(['Aspirin', 'Vitamin D']);
      expect(formResponse.answeredAt).toBeDefined();
    });

    it('should create form response with default timestamps', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.createdAt).toBeDefined();
      expect(formResponse.createdAt).toBeInstanceOf(Date);
      expect(formResponse.updatedAt).toBeDefined();
      expect(formResponse.updatedAt).toBeInstanceOf(Date);
    });

    it('should create form response with complete data', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          age: 35,
          occupation: 'Software Engineer',
          height: 180,
          weight: 75,
          gender: 'Male',
          exerciseRegularly: true,
          alcoholSmoking: 'none',
          dietTypes: ['balanced', 'low-carb'],
          allergies: ['peanuts'],
          abnormalBloodTests: ['high cholesterol'],
          chronicConditions: ['hypertension'],
          medications: ['Lisinopril', 'Atorvastatin'],
          supplementGoals: ['heart health', 'energy'],
          additionalNotes: 'Looking to improve overall health',
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.age).toBe(35);
      expect(formResponse.formData.occupation).toBe('Software Engineer');
      expect(formResponse.formData.height).toBe(180);
      expect(formResponse.formData.weight).toBe(75);
      expect(formResponse.formData.gender).toBe('Male');
      expect(formResponse.formData.exerciseRegularly).toBe(true);
      expect(formResponse.formData.alcoholSmoking).toBe('none');
      expect(formResponse.formData.dietTypes).toHaveLength(2);
      expect(formResponse.formData.allergies).toContain('peanuts');
      expect(formResponse.formData.abnormalBloodTests).toContain('high cholesterol');
      expect(formResponse.formData.chronicConditions).toContain('hypertension');
      expect(formResponse.formData.medications).toHaveLength(2);
      expect(formResponse.formData.supplementGoals).toContain('heart health');
      expect(formResponse.formData.additionalNotes).toBe('Looking to improve overall health');
    });
  });

  describe('Gender field', () => {
    it('should accept male gender', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          gender: 'Male',
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.gender).toBe('Male');
    });

    it('should accept female gender', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          gender: 'Female',
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.gender).toBe('Female');
    });

    it('should accept other gender', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          gender: 'Other',
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.gender).toBe('Other');
    });
  });

  describe('Physical measurements', () => {
    it('should store age, height, and weight', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          age: 28,
          height: 165,
          weight: 60,
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.age).toBe(28);
      expect(formResponse.formData.height).toBe(165);
      expect(formResponse.formData.weight).toBe(60);
    });
  });

  describe('Lifestyle fields', () => {
    it('should store exercise information', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          exerciseRegularly: true,
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.exerciseRegularly).toBe(true);
    });

    it('should store alcohol and smoking habits', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          alcoholSmoking: 'occasional',
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.alcoholSmoking).toBe('occasional');
    });

    it('should store diet types as array', async () => {
      const dietTypes = ['vegetarian', 'gluten-free', 'low-sodium'];

      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          dietTypes,
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.dietTypes).toHaveLength(3);
      expect(formResponse.formData.dietTypes).toEqual(dietTypes);
    });

    it('should store occupation', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          occupation: 'Teacher',
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.occupation).toBe('Teacher');
    });
  });

  describe('Health conditions', () => {
    it('should store allergies as array', async () => {
      const allergies = ['shellfish', 'peanuts', 'dairy'];

      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          allergies,
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.allergies).toHaveLength(3);
      expect(formResponse.formData.allergies).toEqual(allergies);
    });

    it('should store abnormal blood tests as array', async () => {
      const abnormalTests = ['high cholesterol', 'low vitamin D', 'elevated glucose'];

      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          abnormalBloodTests: abnormalTests,
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.abnormalBloodTests).toHaveLength(3);
      expect(formResponse.formData.abnormalBloodTests).toEqual(abnormalTests);
    });

    it('should store chronic conditions as array', async () => {
      const conditions = ['diabetes', 'asthma', 'arthritis'];

      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          chronicConditions: conditions,
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.chronicConditions).toHaveLength(3);
      expect(formResponse.formData.chronicConditions).toEqual(conditions);
    });

    it('should store medications as array', async () => {
      const medications = ['Metformin', 'Lisinopril', 'Atorvastatin', 'Aspirin'];

      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          medications,
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.medications).toHaveLength(4);
      expect(formResponse.formData.medications).toEqual(medications);
    });
  });

  describe('Goals and notes', () => {
    it('should store supplement goals as array', async () => {
      const goals = ['weight loss', 'muscle gain', 'better sleep', 'more energy'];

      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          supplementGoals: goals,
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.supplementGoals).toHaveLength(4);
      expect(formResponse.formData.supplementGoals).toEqual(goals);
    });

    it('should store additional notes', async () => {
      const notes = 'I have been feeling tired lately and want to improve my energy levels. I also have trouble sleeping.';

      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          additionalNotes: notes,
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.additionalNotes).toBe(notes);
    });
  });

  describe('Optional fields handling', () => {
    it('should allow creating form with only required medications field', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.medications).toEqual([]);
      expect(formResponse.formData.age).toBeUndefined();
      expect(formResponse.formData.height).toBeUndefined();
      expect(formResponse.formData.weight).toBeUndefined();
    });

    it('should handle partial form data', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          age: 30,
          gender: 'Female',
          medications: ['Birth Control'],
          supplementGoals: ['hormonal balance'],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.age).toBe(30);
      expect(formResponse.formData.gender).toBe('Female');
      expect(formResponse.formData.medications).toContain('Birth Control');
      expect(formResponse.formData.supplementGoals).toContain('hormonal balance');
      expect(formResponse.formData.height).toBeUndefined();
      expect(formResponse.formData.occupation).toBeUndefined();
    });
  });

  describe('Query operations', () => {
    it('should find form responses by userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      await FormResponse.create({
        userId,
        formData: {
          age: 25,
          medications: [],
        },
        answeredAt: new Date(),
      });

      const found = await FormResponse.find({ userId });

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].userId).toEqual(userId);
    });

    it('should update form response', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          age: 30,
          weight: 70,
          medications: [],
        },
        answeredAt: new Date(),
      });

      formResponse.formData.age = 31;
      formResponse.formData.weight = 68;
      formResponse.formData.supplementGoals = ['weight maintenance'];
      await formResponse.save();

      const updated = await FormResponse.findById(formResponse._id);
      expect(updated?.formData.age).toBe(31);
      expect(updated?.formData.weight).toBe(68);
      expect(updated?.formData.supplementGoals).toContain('weight maintenance');
    });

    it('should find most recent form response for a user', async () => {
      const userId = new mongoose.Types.ObjectId();

      await FormResponse.create({
        userId,
        formData: { medications: [] },
        answeredAt: new Date('2025-01-01'),
      });

      await FormResponse.create({
        userId,
        formData: { medications: ['New Med'] },
        answeredAt: new Date('2025-11-15'),
      });

      const found = await FormResponse.findOne({ userId }).sort({ answeredAt: -1 });

      expect(found).toBeDefined();
      expect(found?.formData.medications).toContain('New Med');
    });
  });

  describe('References', () => {
    it('should maintain reference to user', async () => {
      const userId = new mongoose.Types.ObjectId();

      const formResponse = await FormResponse.create({
        userId,
        formData: {
          medications: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.userId).toEqual(userId);
    });
  });

  describe('Empty arrays handling', () => {
    it('should handle empty arrays for all array fields', async () => {
      const formResponse = await FormResponse.create({
        userId: new mongoose.Types.ObjectId(),
        formData: {
          dietTypes: [],
          allergies: [],
          abnormalBloodTests: [],
          chronicConditions: [],
          medications: [],
          supplementGoals: [],
        },
        answeredAt: new Date(),
      });

      expect(formResponse.formData.dietTypes).toEqual([]);
      expect(formResponse.formData.allergies).toEqual([]);
      expect(formResponse.formData.abnormalBloodTests).toEqual([]);
      expect(formResponse.formData.chronicConditions).toEqual([]);
      expect(formResponse.formData.medications).toEqual([]);
      expect(formResponse.formData.supplementGoals).toEqual([]);
    });
  });
});
