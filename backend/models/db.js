import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';
import { generateProjectId, generateEntityId } from '../utils/idGenerator.js';
import { getMongooseModel } from './mongooseModels.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, '../.env');
loadEnv({ path: ENV_PATH, override: true });
const DATA_DIR = join(__dirname, '../data');

const FILES = {
  leads: 'leads.json',
  projects: 'projects.json',
  payments: 'payments.json',
  users: 'users.json',
  activities: 'activities.json',
  settings: 'settings.json'
};

class JSONDatabase {
  constructor() {
    this.cache = new Map();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      await access(DATA_DIR);
    } catch {
      await mkdir(DATA_DIR, { recursive: true });
    }

    for (const [key, filename] of Object.entries(FILES)) {
      const filepath = join(DATA_DIR, filename);
      try {
        await access(filepath);
      } catch {
        await writeFile(filepath, JSON.stringify([], null, 2), 'utf8');
      }
    }

    this.initialized = true;
  }

  async read(collection) {
    if (this.cache.has(collection)) {
      return this.cache.get(collection);
    }

    const filepath = join(DATA_DIR, FILES[collection]);
    try {
      const data = await readFile(filepath, 'utf8');
      const parsed = JSON.parse(data);
      this.cache.set(collection, parsed);
      return parsed;
    } catch {
      return [];
    }
  }

  async write(collection, data) {
    const filepath = join(DATA_DIR, FILES[collection]);
    await writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    this.cache.set(collection, data);
    return data;
  }

  async find(collection, query = {}) {
    const data = await this.read(collection);
    if (!query || Object.keys(query).length === 0) return data;

    return data.filter(item => {
      return Object.entries(query).every(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          if (value.$regex) return new RegExp(value.$regex, 'i').test(item[key]);
          if (value.$in) return value.$in.includes(item[key]);
          if (value.$ne) return item[key] !== value.$ne;
          if (value.$gte) return item[key] >= value.$gte;
          if (value.$lte) return item[key] <= value.$lte;
        }
        return item[key] === value;
      });
    });
  }

  async findOne(collection, query) {
    const results = await this.find(collection, query);
    return results[0] || null;
  }

  async findById(collection, id) {
    return this.findOne(collection, { id });
  }

  async insert(collection, document) {
    const data = await this.read(collection);
    
    let docId;
    if (collection === 'projects' && !document.id) {
      docId = generateProjectId(data);
    } else if (collection === 'leads' && !document.id) {
      docId = generateEntityId('LEAD', data);
    } else if (collection === 'payments' && !document.id) {
      docId = generateEntityId('PAY', data);
    } else {
      docId = document.id || randomUUID();
    }
    
    const newDoc = {
      ...document,
      id: docId,
      createdAt: document.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newDoc);
    await this.write(collection, data);
    return newDoc;
  }

  async update(collection, id, updates) {
    const data = await this.read(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;

    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.write(collection, data);
    return data[index];
  }

  async delete(collection, id) {
    const data = await this.read(collection);
    const filtered = data.filter(item => item.id !== id);
    if (filtered.length === data.length) return false;
    await this.write(collection, filtered);
    return true;
  }

  async count(collection, query = {}) {
    const data = await this.find(collection, query);
    return data.length;
  }
}

class MongooseDatabase {
  async init() {
    return Promise.resolve();
  }

  async read(collection) {
    const model = getMongooseModel(collection);
    return model.find({}).lean();
  }

  async write(collection, data) {
    const model = getMongooseModel(collection);
    await model.deleteMany({});
    if (!Array.isArray(data)) {
      throw new Error('Mongoose write expects an array of documents');
    }

    if (data.length === 0) {
      return [];
    }

    const bulk = data.map((item) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date()
    }));

    const created = await model.insertMany(bulk);
    return created.map((doc) => doc.toObject());
  }

  buildQuery(query = {}) {
    const q = {};
    for (const [key, value] of Object.entries(query)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value.$regex) q[key] = new RegExp(value.$regex, 'i');
        else if (value.$in) q[key] = { $in: value.$in };
        else if (value.$ne) q[key] = { $ne: value.$ne };
        else if (value.$gte || value.$lte) {
          q[key] = {};
          if (value.$gte !== undefined) q[key].$gte = value.$gte;
          if (value.$lte !== undefined) q[key].$lte = value.$lte;
        } else {
          q[key] = value;
        }
      } else {
        q[key] = value;
      }
    }
    return q;
  }

  async find(collection, query = {}) {
    const model = getMongooseModel(collection);
    return model.find(this.buildQuery(query)).lean();
  }

  async findOne(collection, query = {}) {
    const model = getMongooseModel(collection);
    return model.findOne(this.buildQuery(query)).lean();
  }

  async findById(collection, id) {
    const model = getMongooseModel(collection);
    return model.findOne({ id }).lean();
  }

  async insert(collection, document) {
    const model = getMongooseModel(collection);
    let data = await model.find({}).lean();

    const shouldGenerateId = !document.id && ['projects', 'leads', 'payments'].includes(collection);
    let docId;
    if (collection === 'projects' && shouldGenerateId) {
      docId = generateProjectId(data);
    } else if (collection === 'leads' && shouldGenerateId) {
      docId = generateEntityId('LEAD', data);
    } else if (collection === 'payments' && shouldGenerateId) {
      docId = generateEntityId('PAY', data);
    } else {
      docId = document.id || randomUUID();
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await model.create({
          ...document,
          id: docId,
          createdAt: document.createdAt || new Date(),
          updatedAt: new Date()
        });
        return created.toObject();
      } catch (err) {
        if (err.code === 11000 && shouldGenerateId && attempt < 4) {
          data = await model.find({}).lean();
          if (collection === 'projects') {
            docId = generateProjectId(data);
          } else if (collection === 'leads') {
            docId = generateEntityId('LEAD', data);
          } else if (collection === 'payments') {
            docId = generateEntityId('PAY', data);
          } else {
            docId = randomUUID();
          }
          continue;
        }
        throw err;
      }
    }

    throw new Error('Failed to generate a unique ID after multiple attempts');
  }

  async update(collection, id, updates) {
    const model = getMongooseModel(collection);
    const updated = await model.findOneAndUpdate(
      { id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
    return updated;
  }

  async delete(collection, id) {
    const model = getMongooseModel(collection);
    const result = await model.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async count(collection, query = {}) {
    const model = getMongooseModel(collection);
    return model.countDocuments(this.buildQuery(query));
  }
}

const useMongoose = Boolean(process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL);

class DatabaseWrapper {
  constructor() {
    this.instance = null;
  }

  getInstance() {
    if (!this.instance) {
      // Re-evaluate at runtime to ensure env vars are loaded
      const shouldUseMongoose = Boolean(process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL);
      this.instance = shouldUseMongoose ? new MongooseDatabase() : new JSONDatabase();
      console.log(`Database mode: ${shouldUseMongoose ? 'MongoDB' : 'JSON'}`);
    }
    return this.instance;
  }

  async init() {
    return this.getInstance().init();
  }

  async read(collection) {
    return this.getInstance().read(collection);
  }

  async write(collection, data) {
    return this.getInstance().write(collection, data);
  }

  async find(collection, query = {}) {
    return this.getInstance().find(collection, query);
  }

  async findOne(collection, query = {}) {
    return this.getInstance().findOne(collection, query);
  }

  async findById(collection, id) {
    return this.getInstance().findById(collection, id);
  }

  async insert(collection, document) {
    return this.getInstance().insert(collection, document);
  }

  async update(collection, id, updates) {
    return this.getInstance().update(collection, id, updates);
  }

  async delete(collection, id) {
    return this.getInstance().delete(collection, id);
  }

  async count(collection, query = {}) {
    return this.getInstance().count(collection, query);
  }
}

export const db = new DatabaseWrapper();
export default db;
