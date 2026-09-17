// // import axios from 'axios';
// // import { env } from '../../config/env';
// // import { AppError } from '../../utils/AppError';
// // import { logger } from '../../utils/logger';

// // const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// // // ---------------------------------------------------------------------------
// // // Auth — Shiprocket tokens are valid for ~10 days. We cache the token in
// // // memory and re-login lazily whenever it's missing/expired, the same pattern
// // // cashfreeClient.ts uses for its own credentials, just with a login step
// // // instead of static keys.
// // // ---------------------------------------------------------------------------

// // let cachedToken: { value: string; expiresAt: number } | null = null;

// // // Re-login a little before the documented 10-day expiry so an in-flight
// // // request never gets caught using a token Shiprocket has already dropped.
// // const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;

// // async function login(): Promise<string> {
// //   if (!env.shiprocket.email || !env.shiprocket.password) {
// //     throw AppError.internal('Shiprocket credentials are not configured', 'SHIPROCKET_NOT_CONFIGURED');
// //   }

// //   try {
// //     const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
// //       email: env.shiprocket.email,
// //       password: env.shiprocket.password,
// //     });

// //     const token = response.data.token as string;
// //     cachedToken = { value: token, expiresAt: Date.now() + TOKEN_TTL_MS };
// //     return token;
// //   } catch (error) {
// //     const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };
// //     logger.error('Shiprocket login failed', {
// //       message: axiosError.message,
// //       status: axiosError.response?.status,
// //       data: axiosError.response?.data,
// //     });
// //     throw AppError.internal('Failed to authenticate with Shiprocket', 'SHIPROCKET_AUTH_FAILED');
// //   }
// // }

// // async function getToken(): Promise<string> {
// //   if (cachedToken && cachedToken.expiresAt > Date.now()) {
// //     return cachedToken.value;
// //   }
// //   return login();
// // }

// // async function client() {
// //   const token = await getToken();
// //   return axios.create({
// //     baseURL: SHIPROCKET_BASE_URL,
// //     headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
// //   });
// // }

// // /** Wraps a Shiprocket call so a single 401 (token expired/invalidated server-side
// //  * despite our cache) triggers exactly one forced re-login-and-retry. */
// // async function withAuthRetry<T>(fn: (http: Awaited<ReturnType<typeof client>>) => Promise<T>): Promise<T> {
// //   let http = await client();
// //   try {
// //     return await fn(http);
// //   } catch (error) {
// //     const status = (error as { response?: { status?: number } }).response?.status;
// //     if (status === 401) {
// //       cachedToken = null;
// //       http = await client();
// //       return await fn(http);
// //     }
// //     throw error;
// //   }
// // }

// // function handleError(error: unknown, message: string, code: string): never {
// //   const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };
// //   logger.error(message, {
// //     message: axiosError.message,
// //     status: axiosError.response?.status,
// //     data: axiosError.response?.data,
// //   });
// //   throw AppError.internal(message, code);
// // }

// // // ---------------------------------------------------------------------------
// // // Types
// // // ---------------------------------------------------------------------------

// // export interface ShiprocketOrderItem {
// //   name: string;
// //   sku: string;
// //   units: number;
// //   selling_price: number;
// // }

// // export interface CreateShiprocketOrderInput {
// //   orderNumber: string;
// //   orderDate: string; // "YYYY-MM-DD HH:mm"
// //   pickupLocation: string;
// //   billingCustomerName: string;
// //   billingLastName?: string;
// //   billingAddress: string;
// //   billingCity: string;
// //   billingPincode: string;
// //   billingState: string;
// //   billingCountry: string;
// //   billingEmail: string;
// //   billingPhone: string;
// //   paymentMethod: 'Prepaid' | 'COD';
// //   subTotal: number;
// //   items: ShiprocketOrderItem[];
// //   weightKg: number;
// //   lengthCm: number;
// //   breadthCm: number;
// //   heightCm: number;
// // }

// // export interface CreateShiprocketOrderResult {
// //   shiprocketOrderId: string;
// //   shipmentId: string;
// //   status: string;
// // }

// // export interface ServiceableCourier {
// //   courierId: string;
// //   courierName: string;
// //   rate: number;
// //   estimatedDeliveryDays: string;
// //   codAvailable: boolean;
// // }

// // export interface AssignAwbResult {
// //   awbCode: string;
// //   courierName: string;
// //   courierId: string;
// // }

// // export interface TrackingResult {
// //   currentStatus: string;
// //   awbCode?: string;
// //   trackingUrl?: string;
// //   activities: { date: string; status: string; location?: string }[];
// // }

// // // ---------------------------------------------------------------------------
// // // Forward shipment flow
// // // ---------------------------------------------------------------------------

// // /** Creates a Shiprocket order for a forward shipment (adhoc — no separate cart step). */
// // function normalizePhone(phone: string): string {
// //   if (!phone) return "";
// //   let value = String(phone).replace(/\D/g, "");
// //   // +91XXXXXXXXXX or 91XXXXXXXXXX
// //   if (value.length === 12 && value.startsWith("91")) {
// //     value = value.substring(2);
// //   }
// //   // 0XXXXXXXXXX
// //   if (value.length === 11 && value.startsWith("0")) {
// //     value = value.substring(1);
// //   }
// //   console.log("Normalized phone number:", value);
// //   return value;
// // }

// // export async function createShiprocketOrder(input: CreateShiprocketOrderInput): Promise<CreateShiprocketOrderResult> {
// //   if (!env.shiprocket.pickupLocation && !input.pickupLocation) {
// //     throw AppError.badRequest(
// //       'No Shiprocket pickup location is configured. Register one in Shiprocket (Settings -> Pickup Addresses) and set SHIPROCKET_PICKUP_LOCATION.',
// //       'SHIPROCKET_PICKUP_LOCATION_MISSING'
// //     );
// //   }

// //   return withAuthRetry(async (http) => {
// //     try {
// //       const billingPhoneNormalized = normalizePhone(input.billingPhone);
// //       const response = await http.post('/orders/create/adhoc', {
// //         order_id: input.orderNumber,
// //         order_date: input.orderDate,
// //         pickup_location: input.pickupLocation,
// //         billing_customer_name: input.billingCustomerName,
// //         billing_last_name: input.billingLastName || '',
// //         billing_address: input.billingAddress,
// //         billing_city: input.billingCity,
// //         billing_pincode: input.billingPincode,
// //         billing_state: input.billingState,
// //         billing_country: input.billingCountry,
// //         billing_email: input.billingEmail,
// //         billing_phone: billingPhoneNormalized,
// //         shipping_is_billing: true,
// //         order_items: input.items.map((i) => ({
// //           name: i.name,
// //           sku: i.sku,
// //           units: i.units,
// //           selling_price: i.selling_price,
// //         })),
// //         payment_method: input.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
// //         sub_total: input.subTotal,
// //         length: input.lengthCm,
// //         breadth: input.breadthCm,
// //         height: input.heightCm,
// //         weight: input.weightKg,
// //       });

// //       return {
// //         shiprocketOrderId: String(response.data.order_id),
// //         shipmentId: String(response.data.shipment_id),
// //         status: response.data.status,
// //       };
// //     } catch (error) {
// //       return handleError(error, 'Failed to create Shiprocket order', 'SHIPROCKET_ORDER_CREATE_FAILED');
// //     }
// //   });
// // }

// // /** Checks courier serviceability/rates for a shipment so an admin can pick one manually. */
// // export async function checkServiceability(params: {
// //   pickupPincode: string;
// //   deliveryPincode: string;
// //   weightKg: number;
// //   cod: boolean;
// // }): Promise<ServiceableCourier[]> {
// //   return withAuthRetry(async (http) => {
// //     try {
// //       console.log('Checking serviceability with params:', params);
// //       const response = await http.get('/courier/serviceability/', {
// //         params: {
// //           pickup_postcode: params.pickupPincode,
// //           delivery_postcode: params.deliveryPincode,
// //           weight: params.weightKg,
// //           cod: params.cod ? 1 : 0,
// //         },
// //       });
// //       console.log('Shiprocket serviceability response:', response.data);

// //       const couriers = response.data?.data?.available_courier_companies ?? [];
// //       return couriers.map((c: Record<string, unknown>) => ({
// //         courierId: String(c.courier_company_id),
// //         courierName: String(c.courier_name),
// //         rate: Number(c.rate ?? c.freight_charge ?? 0),
// //         estimatedDeliveryDays: String(c.estimated_delivery_days ?? c.etd ?? ''),
// //         codAvailable: Boolean(c.cod ?? c.is_surface ?? false),
// //       }));
// //     } catch (error) {
// //       console.log('Error checking Shiprocket serviceability:', error);
// //       return handleError(error, 'Failed to check Shiprocket serviceability', 'SHIPROCKET_SERVICEABILITY_FAILED');
// //     }
// //   });
// // }

// // /** Assigns an AWB for a shipment. Pass courierId for a manually-chosen courier;
// //  * omit it to let Shiprocket auto-pick the cheapest/recommended one. */
// // export async function assignAWB(shipmentId: string, courierId?: string): Promise<AssignAwbResult> {
// //   return withAuthRetry(async (http) => {
// //     try {
// //       const response = await http.post('/courier/assign/awb', {
// //         shipment_id: shipmentId,
// //         ...(courierId ? { courier_id: courierId } : {}),
// //       });

// //       const data = response.data?.response?.data;
// //       if (!data) {
// //         throw new Error('Shiprocket did not return AWB assignment data');
// //       }
// //       return {
// //         awbCode: String(data.awb_code),
// //         courierName: String(data.courier_name),
// //         courierId: String(data.courier_company_id),
// //       };
// //     } catch (error) {
// //       return handleError(error, 'Failed to assign AWB via Shiprocket', 'SHIPROCKET_AWB_ASSIGN_FAILED');
// //     }
// //   });
// // }

// // /** Requests a courier pickup for an already-AWB-assigned shipment. */
// // export async function generatePickup(shipmentId: string): Promise<{ pickupScheduledDate?: string }> {
// //   return withAuthRetry(async (http) => {
// //     try {
// //       const response = await http.post('/courier/generate/pickup', { shipment_id: [shipmentId] });
// //       return { pickupScheduledDate: response.data?.response?.pickup_scheduled_date };
// //     } catch (error) {
// //       return handleError(error, 'Failed to generate Shiprocket pickup', 'SHIPROCKET_PICKUP_FAILED');
// //     }
// //   });
// // }

// // /** Tracks a shipment by AWB — used for the defensive sync endpoint (mirrors syncPaymentStatus's role for Cashfree). */
// // export async function trackShipment(awbCode: string): Promise<TrackingResult> {
// //   return withAuthRetry(async (http) => {
// //     try {
// //       const response = await http.get(`/courier/track/awb/${awbCode}`);
// //       const trackData = response.data?.tracking_data;
// //       return {
// //         currentStatus: trackData?.shipment_track?.[0]?.current_status ?? 'UNKNOWN',
// //         awbCode,
// //         trackingUrl: trackData?.track_url,
// //         activities: (trackData?.shipment_track_activities ?? []).map((a: Record<string, unknown>) => ({
// //           date: String(a.date),
// //           status: String(a.status),
// //           location: a.location ? String(a.location) : undefined,
// //         })),
// //       };
// //     } catch (error) {
// //       return handleError(error, 'Failed to fetch Shiprocket tracking', 'SHIPROCKET_TRACKING_FAILED');
// //     }
// //   });
// // }

// // // ---------------------------------------------------------------------------
// // // Return (reverse pickup) flow
// // // ---------------------------------------------------------------------------

// // export interface CreateShiprocketReturnInput {
// //   orderNumber: string; // original forward order number this return belongs to
// //   orderDate: string;
// //   pickupCustomerName: string; // the customer's address — Shiprocket picks UP from here
// //   pickupAddress: string;
// //   pickupCity: string;
// //   pickupPincode: string;
// //   pickupState: string;
// //   pickupCountry: string;
// //   pickupEmail: string;
// //   pickupPhone: string;
// //   // Return shipments are delivered back to us, so the "delivery" side of a
// //   // return order is our own warehouse/pickup location.
// //   warehouseName: string;
// //   items: ShiprocketOrderItem[];
// //   subTotal: number;
// //   weightKg: number;
// //   lengthCm: number;
// //   breadthCm: number;
// //   heightCm: number;
// // }

// // export interface CreateShiprocketReturnResult {
// //   shiprocketOrderId: string;
// //   shipmentId: string;
// // }

// // /** Creates a Shiprocket "return order" — this auto-generates a reverse-pickup
// //  * shipment (picking up from the customer, delivering to our warehouse). */
// // export async function createReturnOrder(input: CreateShiprocketReturnInput): Promise<CreateShiprocketReturnResult> {
// //   return withAuthRetry(async (http) => {
// //     try {
// //       const response = await http.post('/orders/create/return', {
// //         order_id: `RET-${input.orderNumber}-${Date.now()}`,
// //         order_date: input.orderDate,
// //         pickup_customer_name: input.pickupCustomerName,
// //         pickup_address: input.pickupAddress,
// //         pickup_city: input.pickupCity,
// //         pickup_pincode: input.pickupPincode,
// //         pickup_state: input.pickupState,
// //         pickup_country: input.pickupCountry,
// //         pickup_email: input.pickupEmail,
// //         pickup_phone: input.pickupPhone,
// //         shipping_customer_name: input.warehouseName,
// //         shipping_country: input.pickupCountry,
// //         order_items: input.items.map((i) => ({
// //           name: i.name,
// //           sku: i.sku,
// //           units: i.units,
// //           selling_price: i.selling_price,
// //         })),
// //         payment_method: 'Prepaid',
// //         sub_total: input.subTotal,
// //         length: input.lengthCm,
// //         breadth: input.breadthCm,
// //         height: input.heightCm,
// //         weight: input.weightKg,
// //       });

// //       return {
// //         shiprocketOrderId: String(response.data.order_id),
// //         shipmentId: String(response.data.shipment_id),
// //       };
// //     } catch (error) {
// //       return handleError(error, 'Failed to create Shiprocket return order', 'SHIPROCKET_RETURN_CREATE_FAILED');
// //     }
// //   });
// // }


// import axios from 'axios';
// import { env } from '../../config/env';
// import { AppError } from '../../utils/AppError';
// import { logger } from '../../utils/logger';

// // ---------------------------------------------------------------------------
// // Environment
// // ---------------------------------------------------------------------------

// const SHIPROCKET_BASE_URL =
//   env.shiprocket.environment === 'sandbox'
//     ? env.shiprocket.sandboxBaseUrl
//     : env.shiprocket.productionBaseUrl;

// if (
//   env.shiprocket.environment === 'sandbox' &&
//   !SHIPROCKET_BASE_URL
// ) {
//   throw new Error(
//     'SHIPROCKET_SANDBOX_BASE_URL is required when SHIPROCKET_ENVIRONMENT=sandbox'
//   );
// }

// // ---------------------------------------------------------------------------
// // Auth
// // ---------------------------------------------------------------------------

// let cachedToken: {
//   value: string;
//   expiresAt: number;
// } | null = null;

// // Re-login before the documented token expiry.
// const TOKEN_TTL_MS =
//   9 * 24 * 60 * 60 * 1000;

// // ---------------------------------------------------------------------------
// // Sandbox authentication
// // ---------------------------------------------------------------------------

// async function getSandboxToken(): Promise<string> {
//   if (!env.shiprocket.sandboxToken) {
//     throw AppError.internal(
//       'Shiprocket sandbox token is not configured',
//       'SHIPROCKET_SANDBOX_TOKEN_MISSING'
//     );
//   }

//   return env.shiprocket.sandboxToken;
// }

// // ---------------------------------------------------------------------------
// // Production authentication
// // ---------------------------------------------------------------------------

// async function loginProduction(): Promise<string> {
//   if (
//     !env.shiprocket.productionEmail ||
//     !env.shiprocket.productionPassword
//   ) {
//     throw AppError.internal(
//       'Shiprocket production credentials are not configured',
//       'SHIPROCKET_PRODUCTION_NOT_CONFIGURED'
//     );
//   }

//   try {
//     const response = await axios.post(
//       `${SHIPROCKET_BASE_URL}/auth/login`,
//       {
//         email: env.shiprocket.productionEmail,
//         password: env.shiprocket.productionPassword,
//       }
//     );

//     const token = response.data?.token as string;

//     if (!token) {
//       throw new Error(
//         'Shiprocket did not return an authentication token'
//       );
//     }

//     cachedToken = {
//       value: token,
//       expiresAt: Date.now() + TOKEN_TTL_MS,
//     };

//     return token;
//   } catch (error) {
//     const axiosError = error as {
//       response?: {
//         data?: unknown;
//         status?: number;
//       };
//       message: string;
//     };

//     logger.error('Shiprocket production login failed', {
//       environment: env.shiprocket.environment,
//       message: axiosError.message,
//       status: axiosError.response?.status,
//       data: axiosError.response?.data,
//     });

//     throw AppError.internal(
//       'Failed to authenticate with Shiprocket',
//       'SHIPROCKET_AUTH_FAILED'
//     );
//   }
// }

// // ---------------------------------------------------------------------------
// // Get authentication token
// // ---------------------------------------------------------------------------

// async function getToken(): Promise<string> {
//   if (env.shiprocket.environment === 'sandbox') {
//     return getSandboxToken();
//   }

//   if (
//     cachedToken &&
//     cachedToken.expiresAt > Date.now()
//   ) {
//     return cachedToken.value;
//   }

//   return loginProduction();
// }

// // ---------------------------------------------------------------------------
// // HTTP client
// // ---------------------------------------------------------------------------

// async function client() {
//   const token = await getToken();

//   return axios.create({
//     baseURL: SHIPROCKET_BASE_URL,

//     headers: {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     },
//   });
// }

// // ---------------------------------------------------------------------------
// // Auth retry
// // ---------------------------------------------------------------------------

// async function withAuthRetry<T>(
//   fn: (
//     http: Awaited<ReturnType<typeof client>>
//   ) => Promise<T>
// ): Promise<T> {
//   let http = await client();

//   try {
//     return await fn(http);
//   } catch (error) {
//     const status = (
//       error as {
//         response?: {
//           status?: number;
//         };
//       }
//     ).response?.status;

//     /**
//      * Sandbox uses a static token.
//      * Don't attempt production-style login on a sandbox 401.
//      */
//     if (
//       status === 401 &&
//       env.shiprocket.environment === 'production'
//     ) {
//       cachedToken = null;

//       http = await client();

//       return await fn(http);
//     }

//     throw error;
//   }
// }

// // ---------------------------------------------------------------------------
// // Error handling
// // ---------------------------------------------------------------------------

// function handleError(
//   error: unknown,
//   message: string,
//   code: string
// ): never {
//   const axiosError = error as {
//     response?: {
//       data?: unknown;
//       status?: number;
//     };
//     message: string;
//   };

//   logger.error(message, {
//     environment: env.shiprocket.environment,
//     message: axiosError.message,
//     status: axiosError.response?.status,
//     data: axiosError.response?.data,
//   });

//   throw AppError.internal(message, code);
// }

// // ---------------------------------------------------------------------------
// // Types
// // ---------------------------------------------------------------------------

// export interface ShiprocketOrderItem {
//   name: string;
//   sku: string;
//   units: number;
//   selling_price: number;
// }

// export interface CreateShiprocketOrderInput {
//   orderNumber: string;
//   orderDate: string;

//   pickupLocation: string;

//   billingCustomerName: string;
//   billingLastName?: string;

//   billingAddress: string;
//   billingCity: string;
//   billingPincode: string;
//   billingState: string;
//   billingCountry: string;

//   billingEmail: string;
//   billingPhone: string;

//   paymentMethod: 'Prepaid' | 'COD';

//   subTotal: number;

//   items: ShiprocketOrderItem[];

//   weightKg: number;
//   lengthCm: number;
//   breadthCm: number;
//   heightCm: number;
// }

// export interface CreateShiprocketOrderResult {
//   shiprocketOrderId: string;
//   shipmentId: string;
//   status: string;
// }

// export interface ServiceableCourier {
//   courierId: string;
//   courierName: string;
//   rate: number;
//   estimatedDeliveryDays: string;
//   codAvailable: boolean;
// }

// export interface AssignAwbResult {
//   awbCode: string;
//   courierName: string;
//   courierId: string;
// }

// export interface TrackingResult {
//   currentStatus: string;
//   awbCode?: string;
//   trackingUrl?: string;

//   activities: {
//     date: string;
//     status: string;
//     location?: string;
//   }[];
// }

// // ---------------------------------------------------------------------------
// // Phone normalization
// // ---------------------------------------------------------------------------

// function normalizePhone(phone: string): string {
//   if (!phone) {
//     return '';
//   }

//   let value = String(phone).replace(/\D/g, '');

//   // +91XXXXXXXXXX / 91XXXXXXXXXX
//   if (
//     value.length === 12 &&
//     value.startsWith('91')
//   ) {
//     value = value.substring(2);
//   }

//   // 0XXXXXXXXXX
//   if (
//     value.length === 11 &&
//     value.startsWith('0')
//   ) {
//     value = value.substring(1);
//   }

//   return value;
// }

// // ---------------------------------------------------------------------------
// // Forward shipment
// // ---------------------------------------------------------------------------

// export async function createShiprocketOrder(
//   input: CreateShiprocketOrderInput
// ): Promise<CreateShiprocketOrderResult> {
//   if (
//     !env.shiprocket.pickupLocation &&
//     !input.pickupLocation
//   ) {
//     throw AppError.badRequest(
//       'No Shiprocket pickup location is configured. Register one in Shiprocket and set SHIPROCKET_PICKUP_LOCATION.',
//       'SHIPROCKET_PICKUP_LOCATION_MISSING'
//     );
//   }

//   return withAuthRetry(async (http) => {
//     try {
//       const billingPhoneNormalized =
//         normalizePhone(input.billingPhone);

//       if (
//         !/^[6-9]\d{9}$/.test(
//           billingPhoneNormalized
//         )
//       ) {
//         throw AppError.badRequest(
//           'Invalid customer phone number',
//           'INVALID_PHONE_NUMBER'
//         );
//       }

//       const response = await http.post(
//         '/orders/create/adhoc',
//         {
//           order_id: input.orderNumber,

//           order_date: input.orderDate,

//           pickup_location:
//             input.pickupLocation ||
//             env.shiprocket.pickupLocation,

//           billing_customer_name:
//             input.billingCustomerName,

//           billing_last_name:
//             input.billingLastName || '',

//           billing_address:
//             input.billingAddress,

//           billing_city:
//             input.billingCity,

//           billing_pincode:
//             input.billingPincode,

//           billing_state:
//             input.billingState,

//           billing_country:
//             input.billingCountry,

//           billing_email:
//             input.billingEmail,

//           billing_phone:
//             billingPhoneNormalized,

//           shipping_is_billing: true,

//           order_items:
//             input.items.map((item) => ({
//               name: item.name,
//               sku: item.sku,
//               units: item.units,
//               selling_price:
//                 item.selling_price,
//             })),

//           payment_method:
//             input.paymentMethod === 'COD'
//               ? 'COD'
//               : 'Prepaid',

//           sub_total: input.subTotal,

//           length: input.lengthCm,
//           breadth: input.breadthCm,
//           height: input.heightCm,

//           weight: input.weightKg,
//         }
//       );

//       return {
//         shiprocketOrderId: String(
//           response.data.order_id
//         ),

//         shipmentId: String(
//           response.data.shipment_id
//         ),

//         status: response.data.status,
//       };
//     } catch (error) {
//       if (
//         error instanceof AppError
//       ) {
//         throw error;
//       }

//       return handleError(
//         error,
//         'Failed to create Shiprocket order',
//         'SHIPROCKET_ORDER_CREATE_FAILED'
//       );
//     }
//   });
// }

// // ---------------------------------------------------------------------------
// // Courier serviceability
// // ---------------------------------------------------------------------------

// export async function checkServiceability(
//   params: {
//     pickupPincode: string;
//     deliveryPincode: string;
//     weightKg: number;
//     cod: boolean;
//   }
// ): Promise<ServiceableCourier[]> {
//   if (!params.pickupPincode) {
//     throw AppError.badRequest(
//       'Shiprocket pickup pincode is missing',
//       'SHIPROCKET_PICKUP_PINCODE_MISSING'
//     );
//   }

//   if (!params.deliveryPincode) {
//     throw AppError.badRequest(
//       'Delivery pincode is missing',
//       'DELIVERY_PINCODE_MISSING'
//     );
//   }

//   return withAuthRetry(async (http) => {
//     try {
//       logger.info(
//         'Checking Shiprocket serviceability',
//         {
//           environment:
//             env.shiprocket.environment,

//           pickupPincode:
//             params.pickupPincode,

//           deliveryPincode:
//             params.deliveryPincode,

//           weightKg:
//             params.weightKg,

//           cod:
//             params.cod,
//         }
//       );

//       const response = await http.get(
//         '/courier/serviceability/',
//         {
//           params: {
//             pickup_postcode:
//               params.pickupPincode,

//             delivery_postcode:
//               params.deliveryPincode,

//             weight:
//               params.weightKg,

//             cod:
//               params.cod ? 1 : 0,
//           },
//         }
//       );

//       logger.info(
//         'Shiprocket serviceability response',
//         {
//           data: response.data,
//         }
//       );

//       const couriers =
//         response.data
//           ?.data
//           ?.available_courier_companies ?? [];

//       return couriers.map(
//         (courier: Record<string, unknown>) => ({
//           courierId: String(
//             courier.courier_company_id
//           ),

//           courierName: String(
//             courier.courier_name
//           ),

//           rate: Number(
//             courier.rate ??
//               courier.freight_charge ??
//               0
//           ),

//           estimatedDeliveryDays:
//             String(
//               courier.estimated_delivery_days ??
//                 courier.etd ??
//                 ''
//             ),

//           codAvailable:
//             Boolean(
//               courier.cod ??
//                 courier.is_surface ??
//                 false
//             ),
//         })
//       );
//     } catch (error) {
//       return handleError(
//         error,
//         'Failed to check Shiprocket serviceability',
//         'SHIPROCKET_SERVICEABILITY_FAILED'
//       );
//     }
//   });
// }

// // ---------------------------------------------------------------------------
// // Assign AWB
// // ---------------------------------------------------------------------------

// export async function assignAWB(
//   shipmentId: string,
//   courierId?: string
// ): Promise<AssignAwbResult> {
//   return withAuthRetry(async (http) => {
//     try {
//       const response = await http.post(
//         '/courier/assign/awb',
//         {
//           shipment_id: shipmentId,

//           ...(courierId
//             ? {
//                 courier_id: courierId,
//               }
//             : {}),
//         }
//       );

//       const data =
//         response.data?.response?.data;

//       if (!data) {
//         throw new Error(
//           'Shiprocket did not return AWB assignment data'
//         );
//       }

//       return {
//         awbCode: String(
//           data.awb_code
//         ),

//         courierName: String(
//           data.courier_name
//         ),

//         courierId: String(
//           data.courier_company_id
//         ),
//       };
//     } catch (error) {
//       return handleError(
//         error,
//         'Failed to assign AWB via Shiprocket',
//         'SHIPROCKET_AWB_ASSIGN_FAILED'
//       );
//     }
//   });
// }

// // ---------------------------------------------------------------------------
// // Generate pickup
// // ---------------------------------------------------------------------------

// export async function generatePickup(
//   shipmentId: string
// ): Promise<{
//   pickupScheduledDate?: string;
// }> {
//   return withAuthRetry(async (http) => {
//     try {
//       const response = await http.post(
//         '/courier/generate/pickup',
//         {
//           shipment_id: [shipmentId],
//         }
//       );

//       return {
//         pickupScheduledDate:
//           response.data?.response
//             ?.pickup_scheduled_date,
//       };
//     } catch (error) {
//       return handleError(
//         error,
//         'Failed to generate Shiprocket pickup',
//         'SHIPROCKET_PICKUP_FAILED'
//       );
//     }
//   });
// }

// // ---------------------------------------------------------------------------
// // Tracking
// // ---------------------------------------------------------------------------

// export async function trackShipment(
//   awbCode: string
// ): Promise<TrackingResult> {
//   return withAuthRetry(async (http) => {
//     try {
//       const response = await http.get(
//         `/courier/track/awb/${awbCode}`
//       );

//       const trackData =
//         response.data?.tracking_data;

//       return {
//         currentStatus:
//           trackData
//             ?.shipment_track?.[0]
//             ?.current_status ??
//           'UNKNOWN',

//         awbCode,

//         trackingUrl:
//           trackData?.track_url,

//         activities:
//           (
//             trackData
//               ?.shipment_track_activities ??
//             []
//           ).map(
//             (
//               activity: Record<
//                 string,
//                 unknown
//               >
//             ) => ({
//               date: String(
//                 activity.date
//               ),

//               status: String(
//                 activity.status
//               ),

//               location:
//                 activity.location
//                   ? String(
//                       activity.location
//                     )
//                   : undefined,
//             })
//           ),
//       };
//     } catch (error) {
//       return handleError(
//         error,
//         'Failed to fetch Shiprocket tracking',
//         'SHIPROCKET_TRACKING_FAILED'
//       );
//     }
//   });
// }

// // ---------------------------------------------------------------------------
// // Return shipment
// // ---------------------------------------------------------------------------

// export interface CreateShiprocketReturnInput {
//   orderNumber: string;
//   orderDate: string;

//   pickupCustomerName: string;
//   pickupAddress: string;
//   pickupCity: string;
//   pickupPincode: string;
//   pickupState: string;
//   pickupCountry: string;
//   pickupEmail: string;
//   pickupPhone: string;

//   warehouseName: string;

//   items: ShiprocketOrderItem[];

//   subTotal: number;

//   weightKg: number;
//   lengthCm: number;
//   breadthCm: number;
//   heightCm: number;
// }

// export interface CreateShiprocketReturnResult {
//   shiprocketOrderId: string;
//   shipmentId: string;
// }

// // ---------------------------------------------------------------------------
// // Create reverse pickup
// // ---------------------------------------------------------------------------

// export async function createReturnOrder(
//   input: CreateShiprocketReturnInput
// ): Promise<CreateShiprocketReturnResult> {
//   return withAuthRetry(async (http) => {
//     try {
//       const response = await http.post(
//         '/orders/create/return',
//         {
//           order_id:
//             `RET-${input.orderNumber}-${Date.now()}`,

//           order_date:
//             input.orderDate,

//           pickup_customer_name:
//             input.pickupCustomerName,

//           pickup_address:
//             input.pickupAddress,

//           pickup_city:
//             input.pickupCity,

//           pickup_pincode:
//             input.pickupPincode,

//           pickup_state:
//             input.pickupState,

//           pickup_country:
//             input.pickupCountry,

//           pickup_email:
//             input.pickupEmail,

//           pickup_phone:
//             normalizePhone(
//               input.pickupPhone
//             ),

//           shipping_customer_name:
//             input.warehouseName,

//           shipping_country:
//             input.pickupCountry,

//           order_items:
//             input.items.map((item) => ({
//               name: item.name,
//               sku: item.sku,
//               units: item.units,
//               selling_price:
//                 item.selling_price,
//             })),

//           payment_method: 'Prepaid',

//           sub_total:
//             input.subTotal,

//           length:
//             input.lengthCm,

//           breadth:
//             input.breadthCm,

//           height:
//             input.heightCm,

//           weight:
//             input.weightKg,
//         }
//       );

//       return {
//         shiprocketOrderId:
//           String(
//             response.data.order_id
//           ),

//         shipmentId:
//           String(
//             response.data.shipment_id
//           ),
//       };
//     } catch (error) {
//       return handleError(
//         error,
//         'Failed to create Shiprocket return order',
//         'SHIPROCKET_RETURN_CREATE_FAILED'
//       );
//     }
//   });
// }

 
import axios from 'axios';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
 
// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
 
const SHIPROCKET_BASE_URL =
  env.shiprocket.environment === 'sandbox'
    ? env.shiprocket.sandboxBaseUrl
    : env.shiprocket.productionBaseUrl;
 
if (
  env.shiprocket.environment === 'sandbox' &&
  !SHIPROCKET_BASE_URL
) {
  throw new Error(
    'SHIPROCKET_SANDBOX_BASE_URL is required when SHIPROCKET_ENVIRONMENT=sandbox'
  );
}
 
// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
 
let cachedToken: {
  value: string;
  expiresAt: number;
} | null = null;
 
// Re-login before the documented token expiry.
const TOKEN_TTL_MS =
  9 * 24 * 60 * 60 * 1000;
 
// ---------------------------------------------------------------------------
// Sandbox authentication
// ---------------------------------------------------------------------------
 
async function getSandboxToken(): Promise<string> {
  if (!env.shiprocket.sandboxToken) {
    throw AppError.internal(
      'Shiprocket sandbox token is not configured',
      'SHIPROCKET_SANDBOX_TOKEN_MISSING'
    );
  }
 
  return env.shiprocket.sandboxToken;
}
 
// ---------------------------------------------------------------------------
// Production authentication
// ---------------------------------------------------------------------------
 
async function loginProduction(): Promise<string> {
  if (
    !env.shiprocket.productionEmail ||
    !env.shiprocket.productionPassword
  ) {
    throw AppError.internal(
      'Shiprocket production credentials are not configured',
      'SHIPROCKET_PRODUCTION_NOT_CONFIGURED'
    );
  }
 
  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/auth/login`,
      {
        email: env.shiprocket.productionEmail,
        password: env.shiprocket.productionPassword,
      }
    );
 
    const token = response.data?.token as string;
 
    if (!token) {
      throw new Error(
        'Shiprocket did not return an authentication token'
      );
    }
 
    cachedToken = {
      value: token,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    };
 
    return token;
  } catch (error) {
    const axiosError = error as {
      response?: {
        data?: unknown;
        status?: number;
      };
      message: string;
    };
 
    logger.error('Shiprocket production login failed', {
      environment: env.shiprocket.environment,
      message: axiosError.message,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    });
 
    throw AppError.internal(
      'Failed to authenticate with Shiprocket',
      'SHIPROCKET_AUTH_FAILED'
    );
  }
}
 
// ---------------------------------------------------------------------------
// Get authentication token
// ---------------------------------------------------------------------------
 
async function getToken(): Promise<string> {
  if (env.shiprocket.environment === 'sandbox') {
    return getSandboxToken();
  }
 
  if (
    cachedToken &&
    cachedToken.expiresAt > Date.now()
  ) {
    return cachedToken.value;
  }
 
  return loginProduction();
}
 
// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------
 
async function client() {
  const token = await getToken();
 
  return axios.create({
    baseURL: SHIPROCKET_BASE_URL,
 
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}
 
// ---------------------------------------------------------------------------
// Auth retry
// ---------------------------------------------------------------------------
 
async function withAuthRetry<T>(
  fn: (
    http: Awaited<ReturnType<typeof client>>
  ) => Promise<T>
): Promise<T> {
  let http = await client();
 
  try {
    return await fn(http);
  } catch (error) {
    const status = (
      error as {
        response?: {
          status?: number;
        };
      }
    ).response?.status;
 
    /**
     * Sandbox uses a static token.
     * Don't attempt production-style login on a sandbox 401.
     */
    if (
      status === 401 &&
      env.shiprocket.environment === 'production'
    ) {
      cachedToken = null;
 
      http = await client();
 
      return await fn(http);
    }
 
    throw error;
  }
}
 
// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
 
function handleError(
  error: unknown,
  message: string,
  code: string
): never {
  const axiosError = error as {
    response?: {
      data?: unknown;
      status?: number;
    };
    message: string;
  };
 
  logger.error(message, {
    environment: env.shiprocket.environment,
    message: axiosError.message,
    status: axiosError.response?.status,
    data: axiosError.response?.data,
  });
 
  throw AppError.internal(message, code);
}
 
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
 
export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
}
 
export interface CreateShiprocketOrderInput {
  orderNumber: string;
  orderDate: string;
 
  pickupLocation: string;
 
  billingCustomerName: string;
  billingLastName?: string;
 
  billingAddress: string;
  billingCity: string;
  billingPincode: string;
  billingState: string;
  billingCountry: string;
 
  billingEmail: string;
  billingPhone: string;
 
  paymentMethod: 'Prepaid' | 'COD';
 
  subTotal: number;
 
  items: ShiprocketOrderItem[];
 
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
}
 
export interface CreateShiprocketOrderResult {
  shiprocketOrderId: string;
  shipmentId: string;
  status: string;
}
 
export interface ServiceableCourier {
  courierId: string;
  courierName: string;
  rate: number;
  estimatedDeliveryDays: string;
  codAvailable: boolean;
}
 
export interface AssignAwbResult {
  awbCode: string;
  courierName: string;
  courierId: string;
}
 
export interface TrackingResult {
  currentStatus: string;
  awbCode?: string;
  trackingUrl?: string;
 
  activities: {
    date: string;
    status: string;
    location?: string;
  }[];
}
 
// ---------------------------------------------------------------------------
// Phone normalization
// ---------------------------------------------------------------------------
 
function normalizePhone(phone: string): string {
  if (!phone) {
    return '';
  }
 
  let value = String(phone).replace(/\D/g, '');
 
  // +91XXXXXXXXXX / 91XXXXXXXXXX
  if (
    value.length === 12 &&
    value.startsWith('91')
  ) {
    value = value.substring(2);
  }
 
  // 0XXXXXXXXXX
  if (
    value.length === 11 &&
    value.startsWith('0')
  ) {
    value = value.substring(1);
  }
 
  return value;
}
 
// ---------------------------------------------------------------------------
// Forward shipment
// ---------------------------------------------------------------------------
 
export async function createShiprocketOrder(
  input: CreateShiprocketOrderInput
): Promise<CreateShiprocketOrderResult> {
  if (
    !env.shiprocket.pickupLocation &&
    !input.pickupLocation
  ) {
    throw AppError.badRequest(
      'No Shiprocket pickup location is configured. Register one in Shiprocket and set SHIPROCKET_PICKUP_LOCATION.',
      'SHIPROCKET_PICKUP_LOCATION_MISSING'
    );
  }
 
  return withAuthRetry(async (http) => {
    try {
      const billingPhoneNormalized =
        normalizePhone(input.billingPhone);
 
      if (
        !/^[6-9]\d{9}$/.test(
          billingPhoneNormalized
        )
      ) {
        throw AppError.badRequest(
          'Invalid customer phone number',
          'INVALID_PHONE_NUMBER'
        );
      }
 
      const response = await http.post(
        '/orders/create/adhoc',
        {
          order_id: input.orderNumber,
 
          order_date: input.orderDate,
 
          pickup_location:
            input.pickupLocation ||
            env.shiprocket.pickupLocation,
 
          billing_customer_name:
            input.billingCustomerName,
 
          billing_last_name:
            input.billingLastName || '',
 
          billing_address:
            input.billingAddress,
 
          billing_city:
            input.billingCity,
 
          billing_pincode:
            input.billingPincode,
 
          billing_state:
            input.billingState,
 
          billing_country:
            input.billingCountry,
 
          billing_email:
            input.billingEmail,
 
          billing_phone:
            billingPhoneNormalized,
 
          shipping_is_billing: true,
 
          order_items:
            input.items.map((item) => ({
              name: item.name,
              sku: item.sku,
              units: item.units,
              selling_price:
                item.selling_price,
            })),
 
          payment_method:
            input.paymentMethod === 'COD'
              ? 'COD'
              : 'Prepaid',
 
          sub_total: input.subTotal,
 
          length: input.lengthCm,
          breadth: input.breadthCm,
          height: input.heightCm,
 
          weight: input.weightKg,
        }
      );
 
      return {
        shiprocketOrderId: String(
          response.data.order_id
        ),
 
        shipmentId: String(
          response.data.shipment_id
        ),
 
        status: response.data.status,
      };
    } catch (error) {
      if (
        error instanceof AppError
      ) {
        throw error;
      }
 
      return handleError(
        error,
        'Failed to create Shiprocket order',
        'SHIPROCKET_ORDER_CREATE_FAILED'
      );
    }
  });
}
 
// ---------------------------------------------------------------------------
// Courier serviceability
// ---------------------------------------------------------------------------
 
export async function checkServiceability(
  params: {
    pickupPincode: string;
    deliveryPincode: string;
    weightKg: number;
    cod: boolean;
  }
): Promise<ServiceableCourier[]> {
  if (!params.pickupPincode) {
    throw AppError.badRequest(
      'Shiprocket pickup pincode is missing',
      'SHIPROCKET_PICKUP_PINCODE_MISSING'
    );
  }
 
  if (!params.deliveryPincode) {
    throw AppError.badRequest(
      'Delivery pincode is missing',
      'DELIVERY_PINCODE_MISSING'
    );
  }
 
  return withAuthRetry(async (http) => {
    try {
      logger.info(
        'Checking Shiprocket serviceability',
        {
          environment:
            env.shiprocket.environment,
 
          pickupPincode:
            params.pickupPincode,
 
          deliveryPincode:
            params.deliveryPincode,
 
          weightKg:
            params.weightKg,
 
          cod:
            params.cod,
        }
      );
 
      const response = await http.get(
        '/courier/serviceability/',
        {
          params: {
            pickup_postcode:
              params.pickupPincode,
 
            delivery_postcode:
              params.deliveryPincode,
 
            weight:
              params.weightKg,
 
            cod:
              params.cod ? 1 : 0,
          },
        }
      );
 
      logger.info(
        'Shiprocket serviceability response',
        {
          data: response.data,
        }
      );
 
      const couriers =
        response.data
          ?.data
          ?.available_courier_companies ?? [];
 
      return couriers.map(
        (courier: Record<string, unknown>) => ({
          courierId: String(
            courier.courier_company_id
          ),
 
          courierName: String(
            courier.courier_name
          ),
 
          rate: Number(
            courier.rate ??
              courier.freight_charge ??
              0
          ),
 
          estimatedDeliveryDays:
            String(
              courier.estimated_delivery_days ??
                courier.etd ??
                ''
            ),
 
          codAvailable:
            Boolean(
              courier.cod ??
                courier.is_surface ??
                false
            ),
        })
      );
    } catch (error) {
      return handleError(
        error,
        'Failed to check Shiprocket serviceability',
        'SHIPROCKET_SERVICEABILITY_FAILED'
      );
    }
  });
}
 
// ---------------------------------------------------------------------------
// Assign AWB
// ---------------------------------------------------------------------------
 
export async function assignAWB(
  shipmentId: string,
  courierId?: string
): Promise<AssignAwbResult> {
  return withAuthRetry(async (http) => {
    try {
      const response = await http.post(
        '/courier/assign/awb',
        {
          shipment_id: shipmentId,
 
          ...(courierId
            ? {
                courier_id: courierId,
              }
            : {}),
        }
      );
 
      const data =
        response.data?.response?.data;
 
      logger.info('Shiprocket assign/awb raw response', {
        environment: env.shiprocket.environment,
        shipmentId,
        courierId,
        raw: response.data,
      });
 
      if (!data || !data.awb_code) {
        throw AppError.internal(
          data?.awb_assign_status === 0
            ? 'Shiprocket could not assign an AWB (awb_assign_status: 0) — likely no serviceable courier, insufficient sandbox wallet balance, or courier not enabled on this account'
            : 'Shiprocket did not return an AWB code',
          'SHIPROCKET_AWB_ASSIGN_EMPTY'
        );
      }
 
      return {
        awbCode: String(
          data.awb_code
        ),
 
        courierName: String(
          data.courier_name
        ),
 
        courierId: String(
          data.courier_company_id
        ),
      };
    } catch (error) {
      return handleError(
        error,
        'Failed to assign AWB via Shiprocket',
        'SHIPROCKET_AWB_ASSIGN_FAILED'
      );
    }
  });
}
 
// ---------------------------------------------------------------------------
// Generate pickup
// ---------------------------------------------------------------------------
 
export async function generatePickup(
  shipmentId: string
): Promise<{
  pickupScheduledDate?: string;
}> {
  return withAuthRetry(async (http) => {
    try {
      const response = await http.post(
        '/courier/generate/pickup',
        {
          shipment_id: [shipmentId],
        }
      );
 
      return {
        pickupScheduledDate:
          response.data?.response
            ?.pickup_scheduled_date,
      };
    } catch (error) {
      return handleError(
        error,
        'Failed to generate Shiprocket pickup',
        'SHIPROCKET_PICKUP_FAILED'
      );
    }
  });
}
 
// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------
 
export async function trackShipment(
  awbCode: string
): Promise<TrackingResult> {
  return withAuthRetry(async (http) => {
    try {
      const response = await http.get(
        `/courier/track/awb/${awbCode}`
      );
 
      const trackData =
        response.data?.tracking_data;
 
      return {
        currentStatus:
          trackData
            ?.shipment_track?.[0]
            ?.current_status ??
          'UNKNOWN',
 
        awbCode,
 
        trackingUrl:
          trackData?.track_url,
 
        activities:
          (
            trackData
              ?.shipment_track_activities ??
            []
          ).map(
            (
              activity: Record<
                string,
                unknown
              >
            ) => ({
              date: String(
                activity.date
              ),
 
              status: String(
                activity.status
              ),
 
              location:
                activity.location
                  ? String(
                      activity.location
                    )
                  : undefined,
            })
          ),
      };
    } catch (error) {
      return handleError(
        error,
        'Failed to fetch Shiprocket tracking',
        'SHIPROCKET_TRACKING_FAILED'
      );
    }
  });
}
 
// ---------------------------------------------------------------------------
// Return shipment
// ---------------------------------------------------------------------------
 
export interface CreateShiprocketReturnInput {
  orderNumber: string;
  orderDate: string;
 
  pickupCustomerName: string;
  pickupAddress: string;
  pickupCity: string;
  pickupPincode: string;
  pickupState: string;
  pickupCountry: string;
  pickupEmail: string;
  pickupPhone: string;
 
  warehouseName: string;
 
  items: ShiprocketOrderItem[];
 
  subTotal: number;
 
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
}
 
export interface CreateShiprocketReturnResult {
  shiprocketOrderId: string;
  shipmentId: string;
}
 
// ---------------------------------------------------------------------------
// Create reverse pickup
// ---------------------------------------------------------------------------
 
export async function createReturnOrder(
  input: CreateShiprocketReturnInput
): Promise<CreateShiprocketReturnResult> {
  return withAuthRetry(async (http) => {
    try {
      const response = await http.post(
        '/orders/create/return',
        {
          order_id:
            `RET-${input.orderNumber}-${Date.now()}`,
 
          order_date:
            input.orderDate,
 
          pickup_customer_name:
            input.pickupCustomerName,
 
          pickup_address:
            input.pickupAddress,
 
          pickup_city:
            input.pickupCity,
 
          pickup_pincode:
            input.pickupPincode,
 
          pickup_state:
            input.pickupState,
 
          pickup_country:
            input.pickupCountry,
 
          pickup_email:
            input.pickupEmail,
 
          pickup_phone:
            normalizePhone(
              input.pickupPhone
            ),
 
          shipping_customer_name:
            input.warehouseName,
 
          shipping_country:
            input.pickupCountry,
 
          order_items:
            input.items.map((item) => ({
              name: item.name,
              sku: item.sku,
              units: item.units,
              selling_price:
                item.selling_price,
            })),
 
          payment_method: 'Prepaid',
 
          sub_total:
            input.subTotal,
 
          length:
            input.lengthCm,
 
          breadth:
            input.breadthCm,
 
          height:
            input.heightCm,
 
          weight:
            input.weightKg,
        }
      );
 
      return {
        shiprocketOrderId:
          String(
            response.data.order_id
          ),
 
        shipmentId:
          String(
            response.data.shipment_id
          ),
      };
    } catch (error) {
      return handleError(
        error,
        'Failed to create Shiprocket return order',
        'SHIPROCKET_RETURN_CREATE_FAILED'
      );
    }
  });
}