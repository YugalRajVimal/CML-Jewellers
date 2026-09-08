import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimit.middleware';
import * as authController from '../controllers/auth.controller';
import * as otpController from '../controllers/otp.controller';
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validators';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

router.post('/otp/send', otpRateLimiter, validate(sendOtpSchema), otpController.sendOtp);
router.post('/otp/verify', authRateLimiter, validate(verifyOtpSchema), otpController.verifyOtpHandler);
router.post('/otp/resend', otpRateLimiter, validate(resendOtpSchema), otpController.resendOtp);

router.post('/password/forgot', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/password/reset', authRateLimiter, validate(resetPasswordSchema), authController.resetPasswordHandler);

export default router;
