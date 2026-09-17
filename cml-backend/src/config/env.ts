// // import dotenv from 'dotenv';

// // dotenv.config();

// // function required(key: string, fallback?: string): string {
// //   const value = process.env[key] ?? fallback;
// //   if (value === undefined) {
// //     throw new Error(`Missing required environment variable: ${key}`);
// //   }
// //   if (process.env.NODE_ENV === 'production' && value === fallback && fallback !== undefined) {
// //     throw new Error(`Refusing to start in production with the default value for ${key} — set it explicitly.`);
// //   }
// //   return value;
// // }

// // function bool(key: string, fallback = false): boolean {
// //   const value = process.env[key];
// //   if (value === undefined) return fallback;
// //   return value.toLowerCase() === 'true';
// // }

// // export const env = {
// //   nodeEnv: process.env.NODE_ENV || 'development',
// //   port: parseInt(process.env.PORT || '5000', 10),

// //   mongodbUri: required('MONGODB_URI', 'mongodb://localhost:27017/cml-jewellers'),

// //   jwt: {
// //     accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
// //     refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
// //     adminAccessSecret: required('JWT_ADMIN_ACCESS_SECRET', 'dev_admin_secret'),
// //     accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
// //     refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
// //     adminAccessExpiresIn: process.env.JWT_ADMIN_ACCESS_EXPIRES_IN || '1d',
// //   },

// //   otp: {
// //     emailEnabled: bool('EMAIL_OTP_ENABLED', true),
// //     smsEnabled: bool('SMS_OTP_ENABLED', true),
// //     expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
// //     resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
// //     maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
// //   },

// //   smtp: {
// //     email: process.env.SMTP_EMAIL || '',
// //     password: process.env.SMTP_PASSWORD || '',
// //   },

// //   twilio: {
// //     accountSid: process.env.TWILIO_ACCOUNT_SID || '',
// //     authToken: process.env.TWILIO_AUTH_TOKEN || '',
// //     phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
// //   },

// //   cloudinary: {
// //     cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
// //     apiKey: process.env.CLOUDINARY_API_KEY || '',
// //     apiSecret: process.env.CLOUDINARY_API_SECRET || '',
// //   },

// //   cashfree: {
// //     appId: process.env.CASHFREE_APP_ID || '',
// //     secretKey: process.env.CASHFREE_SECRET_KEY || '',
// //     webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET || '',
// //     mode: (process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox') as 'production' | 'sandbox',
// //   },

// //   cors: {
// //     client: process.env.CORS_ORIGIN_CLIENT || 'http://localhost:3000',
// //     admin: process.env.CORS_ORIGIN_ADMIN || 'http://localhost:3001',
// //   },

// //   superAdmin: {
// //     email: process.env.SUPER_ADMIN_EMAIL || 'admin@cmljewellers.com',
// //     password: required('SUPER_ADMIN_PASSWORD', 'ChangeMe123!'),
// //   },
// // };


// import dotenv from 'dotenv';

// dotenv.config();

// function required(key: string, fallback?: string): string {
//   const value = process.env[key] ?? fallback;
//   if (value === undefined) {
//     throw new Error(`Missing required environment variable: ${key}`);
//   }
//   if (process.env.NODE_ENV === 'production' && value === fallback && fallback !== undefined) {
//     throw new Error(`Refusing to start in production with the default value for ${key} — set it explicitly.`);
//   }
//   return value;
// }

// function bool(key: string, fallback = false): boolean {
//   const value = process.env[key];
//   if (value === undefined) return fallback;
//   return value.toLowerCase() === 'true';
// }

// export const env = {
//   nodeEnv: process.env.NODE_ENV || 'development',
//   port: parseInt(process.env.PORT || '5000', 10),

//   mongodbUri: required('MONGODB_URI', 'mongodb://localhost:27017/cml-jewellers'),

//   jwt: {
//     accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
//     refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
//     adminAccessSecret: required('JWT_ADMIN_ACCESS_SECRET', 'dev_admin_secret'),
//     accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
//     refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
//     adminAccessExpiresIn: process.env.JWT_ADMIN_ACCESS_EXPIRES_IN || '1d',
//   },

//   otp: {
//     emailEnabled: bool('EMAIL_OTP_ENABLED', true),
//     smsEnabled: bool('SMS_OTP_ENABLED', true),
//     expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
//     resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
//     maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
//   },

//   smtp: {
//     email: process.env.SMTP_EMAIL || '',
//     password: process.env.SMTP_PASSWORD || '',
//   },

//   twilio: {
//     accountSid: process.env.TWILIO_ACCOUNT_SID || '',
//     authToken: process.env.TWILIO_AUTH_TOKEN || '',
//     phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
//   },

//   cloudinary: {
//     cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
//     apiKey: process.env.CLOUDINARY_API_KEY || '',
//     apiSecret: process.env.CLOUDINARY_API_SECRET || '',
//   },

//   cashfree: {
//     appId: process.env.CASHFREE_APP_ID || '',
//     secretKey: process.env.CASHFREE_SECRET_KEY || '',
//     webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET || '',
//     mode: (process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox') as 'production' | 'sandbox',
//   },

//   shiprocket: {
//     email: process.env.SHIPROCKET_EMAIL || '',
//     password: process.env.SHIPROCKET_PASSWORD || '',
//     // Exact pickup location name as registered in Shiprocket's dashboard
//     // (Settings -> Pickup Addresses). Not yet confirmed by the business —
//     // set this once a pickup location exists; order creation will fail
//     // fast with a clear error until it's configured.
//     pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || '',
//     // Shared secret Shiprocket's webhook config is set to send back in the
//     // `x-api-key` header, so we can verify inbound webhook calls actually
//     // came from Shiprocket (see services/shipping/webhook.service.ts).
//     webhookSecret: process.env.SHIPROCKET_WEBHOOK_SECRET || '',
//   },

//   // Whether Cash on Delivery is offered at checkout at all. This is a
//   // deploy-time default; the effective value admins see/toggle at runtime
//   // lives in the Setting collection (see models/Setting.model.ts) — this
//   // flag only seeds that document the first time it's read.
//   codDefaultEnabled: bool('COD_DEFAULT_ENABLED', false),

//   cors: {
//     client: process.env.CORS_ORIGIN_CLIENT || 'http://localhost:3000',
//     admin: process.env.CORS_ORIGIN_ADMIN || 'http://localhost:3001',
//   },

//   superAdmin: {
//     email: process.env.SUPER_ADMIN_EMAIL || 'admin@cmljewellers.com',
//     password: required('SUPER_ADMIN_PASSWORD', 'ChangeMe123!'),
//   },
// };

import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  if (process.env.NODE_ENV === 'production' && value === fallback && fallback !== undefined) {
    throw new Error(`Refusing to start in production with the default value for ${key} — set it explicitly.`);
  }
  return value;
}

function bool(key: string, fallback = false): boolean {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  mongodbUri: required('MONGODB_URI', 'mongodb://localhost:27017/cml-jewellers'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
    adminAccessSecret: required('JWT_ADMIN_ACCESS_SECRET', 'dev_admin_secret'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    adminAccessExpiresIn: process.env.JWT_ADMIN_ACCESS_EXPIRES_IN || '1d',
  },

  otp: {
    emailEnabled: bool('EMAIL_OTP_ENABLED', true),
    smsEnabled: bool('SMS_OTP_ENABLED', true),
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  },

  smtp: {
    email: process.env.SMTP_EMAIL || '',
    password: process.env.SMTP_PASSWORD || '',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  cashfree: {
    appId: process.env.CASHFREE_APP_ID || '',
    secretKey: process.env.CASHFREE_SECRET_KEY || '',
    webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET || '',
    mode: (process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox') as 'production' | 'sandbox',
  },

  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL || '',
    password: process.env.SHIPROCKET_PASSWORD || '',
    // Exact pickup location name as registered in Shiprocket's dashboard
    // (Settings -> Pickup Addresses). Not yet confirmed by the business —
    // set this once a pickup location exists; order creation will fail
    // fast with a clear error until it's configured.
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || '',
    pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE || '',
    // Shared secret Shiprocket's webhook config is set to send back in the
    // `x-api-key` header, so we can verify inbound webhook calls actually
    // came from Shiprocket (see services/shipping/webhook.service.ts).
    webhookSecret: process.env.SHIPROCKET_WEBHOOK_SECRET || '',
  },

  // Whether Cash on Delivery is offered at checkout at all. This is a
  // deploy-time default; the effective value admins see/toggle at runtime
  // lives in the Setting collection (see models/Setting.model.ts) — this
  // flag only seeds that document the first time it's read.
  codDefaultEnabled: bool('COD_DEFAULT_ENABLED', false),

  cors: {
    client: process.env.CORS_ORIGIN_CLIENT || 'http://localhost:3000',
    admin: process.env.CORS_ORIGIN_ADMIN || 'http://localhost:3001',
  },

  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@cmljewellers.com',
    password: required('SUPER_ADMIN_PASSWORD', 'ChangeMe123!'),
  },
};
