import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

export const dbHost = env.DB_HOST || 'localhost';
export const dbPort = Number(env.DB_PORT) || 3306;
export const dbUser = env.DB_USER || 'root';
export const dbPass = env.DB_PASS || '';
export const dbDatabase = env.DB_NAME || '';
