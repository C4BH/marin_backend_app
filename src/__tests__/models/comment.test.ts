import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Comment from '../../models/comment';

describe('Comment Model', () => {
  describe('Schema validation', () => {
    it('should create a comment for supplement', async () => {
      const commentData = {
        _id: new mongoose.Types.ObjectId(),
        rating: 4.5,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: new mongoose.Types.ObjectId(),
        text: 'Great supplement, really helped me!',
      };

      const comment = await Comment.create(commentData);

      expect(comment._id).toBeDefined();
      expect(comment.rating).toBe(4.5);
      expect(comment.targetType).toBe('supplement');
      expect(comment.text).toBe('Great supplement, really helped me!');
    });

    it('should create a comment for advisor', async () => {
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 5,
        author: new mongoose.Types.ObjectId(),
        targetType: 'advisor',
        targetId: new mongoose.Types.ObjectId(),
        text: 'Excellent advisor, very knowledgeable',
      });

      expect(comment.targetType).toBe('advisor');
      expect(comment.rating).toBe(5);
    });

    it('should create a comment for meeting', async () => {
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 4,
        author: new mongoose.Types.ObjectId(),
        targetType: 'meeting',
        targetId: new mongoose.Types.ObjectId(),
        text: 'Very productive meeting',
      });

      expect(comment.targetType).toBe('meeting');
      expect(comment.rating).toBe(4);
    });

    it('should allow comment without text', async () => {
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 3.5,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: new mongoose.Types.ObjectId(),
      });

      expect(comment.text).toBeUndefined();
      expect(comment.rating).toBe(3.5);
    });
  });

  describe('Rating validation', () => {
    it('should accept valid rating values', async () => {
      const ratings = [1, 2, 3, 4, 5, 1.5, 2.5, 3.5, 4.5];

      for (const rating of ratings) {
        const comment = await Comment.create({
          _id: new mongoose.Types.ObjectId(),
          rating,
          author: new mongoose.Types.ObjectId(),
          targetType: 'supplement',
          targetId: new mongoose.Types.ObjectId(),
        });

        expect(comment.rating).toBe(rating);
      }
    });

    it('should store decimal ratings', async () => {
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 4.7,
        author: new mongoose.Types.ObjectId(),
        targetType: 'advisor',
        targetId: new mongoose.Types.ObjectId(),
      });

      expect(comment.rating).toBe(4.7);
    });
  });

  describe('Target type validation', () => {
    it('should accept supplement target type', async () => {
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 5,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: new mongoose.Types.ObjectId(),
      });

      expect(comment.targetType).toBe('supplement');
    });

    it('should accept advisor target type', async () => {
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 5,
        author: new mongoose.Types.ObjectId(),
        targetType: 'advisor',
        targetId: new mongoose.Types.ObjectId(),
      });

      expect(comment.targetType).toBe('advisor');
    });

    it('should accept meeting target type', async () => {
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 5,
        author: new mongoose.Types.ObjectId(),
        targetType: 'meeting',
        targetId: new mongoose.Types.ObjectId(),
      });

      expect(comment.targetType).toBe('meeting');
    });
  });

  describe('Relationships', () => {
    it('should reference author as ObjectId', async () => {
      const authorId = new mongoose.Types.ObjectId();
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 4,
        author: authorId,
        targetType: 'supplement',
        targetId: new mongoose.Types.ObjectId(),
      });

      expect(comment.author).toEqual(authorId);
    });

    it('should reference target as ObjectId', async () => {
      const targetId = new mongoose.Types.ObjectId();
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 4,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: targetId,
      });

      expect(comment.targetId).toEqual(targetId);
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt automatically', async () => {
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 4,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: new mongoose.Types.ObjectId(),
      });

      expect(comment.createdAt).toBeDefined();
      expect(comment.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Query operations', () => {
    it('should find comments by target type and id', async () => {
      const targetId = new mongoose.Types.ObjectId();

      await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 5,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: targetId,
        text: 'Comment 1',
      });

      await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 4,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: targetId,
        text: 'Comment 2',
      });

      const comments = await Comment.find({ targetType: 'supplement', targetId });

      expect(comments).toHaveLength(2);
    });

    it('should find comments by author', async () => {
      const authorId = new mongoose.Types.ObjectId();

      await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 5,
        author: authorId,
        targetType: 'supplement',
        targetId: new mongoose.Types.ObjectId(),
      });

      await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 4,
        author: authorId,
        targetType: 'advisor',
        targetId: new mongoose.Types.ObjectId(),
      });

      const comments = await Comment.find({ author: authorId });

      expect(comments).toHaveLength(2);
    });

    it('should calculate average rating for target', async () => {
      const targetId = new mongoose.Types.ObjectId();

      await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 5,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: targetId,
      });

      await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 3,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: targetId,
      });

      const comments = await Comment.find({ targetId });
      const avgRating = comments.reduce((sum, c) => sum + c.rating, 0) / comments.length;

      expect(avgRating).toBe(4);
    });

    it('should update comment text', async () => {
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 4,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: new mongoose.Types.ObjectId(),
        text: 'Original text',
      });

      comment.text = 'Updated text';
      await comment.save();

      const updated = await Comment.findById(comment._id);
      expect(updated?.text).toBe('Updated text');
    });
  });

  describe('Text content', () => {
    it('should store long comment text', async () => {
      const longText = 'Lorem ipsum '.repeat(100);
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 4,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: new mongoose.Types.ObjectId(),
        text: longText,
      });

      expect(comment.text).toBe(longText);
      expect(comment.text!.length).toBeGreaterThan(1000);
    });

    it('should handle special characters in text', async () => {
      const specialText = 'Great! 😊 Works perfectly. Rating: 5/5 ⭐⭐⭐⭐⭐';
      const comment = await Comment.create({
        _id: new mongoose.Types.ObjectId(),
        rating: 5,
        author: new mongoose.Types.ObjectId(),
        targetType: 'supplement',
        targetId: new mongoose.Types.ObjectId(),
        text: specialText,
      });

      expect(comment.text).toBe(specialText);
    });
  });
});
