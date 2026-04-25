import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config as loadEnv, parse as parseEnv } from 'dotenv';

const path = join(process.cwd(), 'backend', '.env');
const raw = readFileSync(path);
console.log('raw length', raw.length);
console.log('hex prefix', raw.slice(0, 200).toString('hex'));
console.log('utf8 prefix', raw.slice(0, 200).toString('utf8'));
console.log('utf8 full:', raw.toString('utf8'));
const parsed = parseEnv(raw.toString('utf8'));
console.log('parsed keys', Object.keys(parsed));
console.log('parsed MONGO_URI', parsed.MONGO_URI);
loadEnv({ path, override: true });
console.log('process.env MONGO_URI', process.env.MONGO_URI);
