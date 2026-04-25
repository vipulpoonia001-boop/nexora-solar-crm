import { config as loadEnv } from 'dotenv';
import { readFileSync, readFile as readFileAsync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { MongooseModels } from '../models/mongooseModels.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, '../.env');

// Load env explicitly
loadEnv({ path: ENV_PATH, override: true });
const rawEnv = readFileSync(ENV_PATH, 'utf8');
const rawFallback = Array.from(rawEnv.matchAll(/^(MONGO_URI|MONGODB_URI|DATABASE_URL)\s*=\s*(.*)$/gim));
for (const [, key, value] of rawFallback) {
  if (!process.env[key]) {
    process.env[key] = value.trim();
  }
}

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

const collections = {
  leads: 'leads.json',
  projects: 'projects.json',
  payments: 'payments.json',
  users: 'users.json',
  activities: 'activities.json',
  settings: 'settings.json'
};

const seedCollection = async (collectionName, filename) => {
  const model = MongooseModels[collectionName];
  if (!model) {
    console.warn(`⚠️  No model for ${collectionName}, skipping.`);
    return 0;
  }

  const existingCount = await model.countDocuments({});
  if (existingCount > 0) {
    console.log(`✓ ${collectionName}: already has ${existingCount} documents, skipping seed.`);
    return 0;
  }

  const filePath = join(__dirname, '../data', filename);
  try {
    const fileContent = await readFileAsync(filePath, 'utf8');
    const docs = JSON.parse(fileContent);
    
    if (!Array.isArray(docs) || docs.length === 0) {
      console.log(`ℹ️  ${collectionName}: no data in JSON file, skipping.`);
      return 0;
    }

    const result = await model.insertMany(docs);
    console.log(`✓ ${collectionName}: seeded ${result.length} documents`);
    return result.length;
  } catch (error) {
    console.error(`✗ ${collectionName}: failed to seed -`, error.message);
    return 0;
  }
};

const run = async () => {
  if (!mongoUri) {
    console.error('❌ MongoDB URI not configured. Set MONGO_URI, MONGODB_URI, or DATABASE_URL.');
    process.exit(1);
  }

  try {
    console.log('\n🌱 Starting MongoDB seed process...\n');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB Atlas\n');

    let totalSeeded = 0;
    for (const [collectionName, filename] of Object.entries(collections)) {
      const seeded = await seedCollection(collectionName, filename);
      totalSeeded += seeded;
    }

    console.log(`\n✅ Seed complete: ${totalSeeded} total documents seeded.`);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');
  }
};

run();
