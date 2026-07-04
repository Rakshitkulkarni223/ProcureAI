import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  mongoUrl: required('MONGO_URL'),
  dbName: required('DB_NAME'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  port: parseInt(process.env.PORT || '8002', 10),
  adminEmail: process.env.ADMIN_EMAIL || 'demo@procureai.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Demo@123',
  adminName: process.env.ADMIN_NAME || 'Demo User',
  corsOrigins: process.env.CORS_ORIGINS || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
};
