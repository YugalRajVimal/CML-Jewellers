import crypto from 'crypto';

/** Human-friendly, sufficiently-unique order number: CML-YYYYMMDD-XXXXXX */
export function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CML-${datePart}-${randomPart}`;
}
