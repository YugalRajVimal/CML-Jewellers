// import { Request, Response } from 'express';
// import { asyncHandler } from '../utils/asyncHandler';
// import { sendSuccess } from '../utils/apiResponse';
// import * as checkoutService from '../services/checkout.service';

// export const validate = asyncHandler(async (req: Request, res: Response) => {
//   const { addressId } = req.body;
//   const { address, totals, issues } = await checkoutService.validateCheckout(req.user!.sub, addressId);
//   sendSuccess(res, { message: 'Checkout is valid', data: { address, totals, issues } });
// });


import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as checkoutService from '../services/checkout.service';
import { getSettings } from '../models/Setting.model';

export const validate = asyncHandler(async (req: Request, res: Response) => {
  const { addressId } = req.body;
  const [{ address, totals, issues }, settings] = await Promise.all([
    checkoutService.validateCheckout(req.user!.sub, addressId),
    getSettings(),
  ]);
  sendSuccess(res, {
    message: 'Checkout is valid',
    data: { address, totals, issues, codEnabled: settings.codEnabled },
  });
});
