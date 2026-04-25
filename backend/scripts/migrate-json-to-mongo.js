import { config as loadEnv, parse as parseEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { MongooseModels } from '../models/mongooseModels.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, '../.env');
loadEnv({ path: ENV_PATH, override: true });
const rawEnv = readFileSync(ENV_PATH, 'utf8');
const parsedEnv = parseEnv(rawEnv);
console.log(`Loaded migration env: ${ENV_PATH}`);
console.log(`Parsed migration env keys: ${Object.keys(parsedEnv).join(', ')}`);
for (const key of ['MONGO_URI', 'MONGODB_URI', 'DATABASE_URL']) {
  if (!process.env[key] && parsedEnv[key]) {
    process.env[key] = parsedEnv[key];
  }
}
const rawFallback = Array.from(rawEnv.matchAll(/^(MONGO_URI|MONGODB_URI|DATABASE_URL)\s*=\s*(.*)$/gim));
for (const [, key, value] of rawFallback) {
  if (!process.env[key]) {
    process.env[key] = value.trim();
    console.log(`Raw fallback loaded ${key}`);
  }
}
console.log(`MONGO_URI ${process.env.MONGO_URI ? 'found' : 'missing'}`);
const DATA_DIR = join(__dirname, '../data');
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

const collections = {
  leads: 'leads.json',
  projects: 'projects.json',
  payments: 'payments.json',
  users: 'users.json',
  activities: 'activities.json',
  settings: 'settings.json'
};

const loadJson = async (filename) => {
  const filePath = join(DATA_DIR, filename);
  const file = await readFile(filePath, 'utf8');
  return JSON.parse(file);
};

const migrateCollection = async (collectionName, filename) => {
  const model = MongooseModels[collectionName];
  if (!model) {
    console.warn(`Skipping unknown collection: ${collectionName}`);
    return;
  }

  const data = await loadJson(filename);
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`No data found for ${collectionName}, skipping.`);
    return;
  }

  console.log(`Migrating ${data.length} records to ${collectionName}...`);
  let migratedCount = 0;

  for (const doc of data) {
    if (!doc || !doc.id) {
      continue;
    }
    await model.findOneAndUpdate(
      { id: doc.id },
      { $set: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    migratedCount += 1;
  }

  console.log(`Migrated ${migratedCount} records into ${collectionName}.`);
};

const run = async () => {
  if (!mongoUri) {
    console.error('Missing MongoDB connection string. Set MONGO_URI, MONGODB_URI, or DATABASE_URL.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas.');

    for (const [collectionName, filename] of Object.entries(collections)) {
      await migrateCollection(collectionName, filename);
    }

    console.log('Data migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();
