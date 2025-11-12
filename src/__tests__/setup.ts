import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// Test başlamadan önce in-memory MongoDB başlat
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Environment variables for testing
  process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-12345';
});

// Her testten sonra collections temizle
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Testler bittikten sonra bağlantıyı kapat
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
