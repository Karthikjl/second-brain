require('dotenv').config();

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const dbClient = process.env.DB_CLIENT || 'sqlite';
const nodeEnv = process.env.NODE_ENV || 'development';

const config = {
  port: process.env.PORT || 4000,
  nodeEnv,
  dbClient,

  supabase: {
    url: dbClient === 'supabase' ? required('SUPABASE_URL') : (process.env.SUPABASE_URL || ''),
    serviceRoleKey: dbClient === 'supabase' ? required('SUPABASE_SERVICE_ROLE_KEY') : (process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
  },

  jwt: {
    accessSecret: (() => {
      // `next build` loads API route modules to collect page data, with NODE_ENV=production
      // but no runtime secrets. Use a random throwaway key for that build process only; it
      // never signs real tokens and the running server still enforces the checks below.
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return require('crypto').randomBytes(32).toString('hex');
      }
      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret) {
        if (nodeEnv === 'production') {
          throw new Error('FATAL SECURITY ERROR: JWT_ACCESS_SECRET environment variable must be set in production.');
        }
        return 'default_jwt_access_secret_development_key_123456789';
      }
      if (nodeEnv === 'production') {
        // Placeholder secrets published in this repo (README, .env.example, old docker-compose)
        // must never be accepted: anyone could forge admin tokens with them.
        const knownPublicSecrets = [
          'your_super_secret_jwt_access_key_min_64_characters_long_123456789',
          'second_brain_super_secret_jwt_access_key_min_64_characters_long_12345',
          'your_secure_64_character_random_hex_key',
          'default_jwt_access_secret_development_key_123456789',
        ];
        if (knownPublicSecrets.includes(secret)) {
          throw new Error('FATAL SECURITY ERROR: JWT_ACCESS_SECRET is a public placeholder value. Generate a random secret.');
        }
        if (secret.length < 32) {
          throw new Error('FATAL SECURITY ERROR: JWT_ACCESS_SECRET must be at least 32 characters long.');
        }
      }
      return secret;
    })(),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresInDays: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || 30),
  },

  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5500,http://localhost:3000').split(','),
};


module.exports = config;