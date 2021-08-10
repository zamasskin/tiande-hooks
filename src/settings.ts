import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

export enum Release {
  production,
  development,
}

export const dbHost = env.DB_HOST || 'localhost';
export const dbPort = Number(env.DB_PORT) || 3306;
export const dbUser = env.DB_USER || 'root';
export const dbPass = env.DB_PASS || '';
export const dbDatabase = env.DB_NAME || '';

export const dbMaxConnections = 12;
export const dbMinConnections = 0;

export const dbRelease =
  process.env.APP_RELEASE === 'production'
    ? Release.production
    : Release.development;
