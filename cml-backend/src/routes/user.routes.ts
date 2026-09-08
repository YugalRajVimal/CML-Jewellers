import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import * as userController from '../controllers/user.controller';
import { updateProfileSchema, addressSchema, updateAddressSchema } from '../validators/user.validators';

const router = Router();

router.use(requireAuth);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);

router.get('/me/addresses', userController.listAddresses);
router.post('/me/addresses', validate(addressSchema), userController.createAddress);
router.patch('/me/addresses/:id', validate(updateAddressSchema), userController.updateAddress);
router.delete('/me/addresses/:id', userController.deleteAddress);

export default router;
