import { config as loadEnv } from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './models/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, '../.env');
loadEnv({ path: ENV_PATH, override: true });

console.log('DB type:', db.constructor.name);
console.log('Mongo URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');

const testProject = {
  customerName: 'Test Customer',
  phone: '1234567890',
  email: 'test@example.com',
  address: 'Test Address',
  systemSize: 5,
  stage: 'Quotation'
};

console.log('Testing project insertion...');
try {
  const result = await db.insert('projects', testProject);
  console.log('Insert result:', result);

  console.log('Testing project retrieval...');
  const projects = await db.find('projects');
  console.log('Total projects:', projects.length);
  console.log('Last project:', projects[projects.length - 1]);
} catch (error) {
  console.error('Error:', error);
}
