import { releaseExpiredReservations } from '../services/checkout.service';
import { logger } from '../utils/logger';

const INTERVAL_MS = 5 * 60 * 1000; // run every 5 minutes
const EXPIRY_MINUTES = 30; // release stock for Pending orders older than this

export function startReservationExpiryJob(): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      const count = await releaseExpiredReservations(EXPIRY_MINUTES);
      if (count > 0) {
        logger.info(`Reservation expiry job: released stock for ${count} stale Pending order(s)`);
      }
    } catch (err) {
      logger.error('Reservation expiry job failed', err);
    }
  }, INTERVAL_MS);
}