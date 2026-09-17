import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'ReturnRequested';

/** Allowed forward transitions per PART 7 state machine. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped'],
  Shipped: ['Delivered'],
  Delivered: ['ReturnRequested'],
  Cancelled: [],
  ReturnRequested: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface IOrderItem {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  name: string; // snapshot at order time — product may change/be deleted later
  sku: string;
  qty: number;
  price: number; // unit price at order time
  image?: string;
}

export interface IShipment {
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  courierId?: string;
  courierName?: string;
  awbCode?: string;
  trackingUrl?: string;
  pickupScheduledAt?: Date;
  // Mirrors Shiprocket's own tracking vocabulary (e.g. "OUT FOR DELIVERY",
  // "DELIVERED", "RTO") — kept separate from Order.status so we retain the
  // raw courier status even where it doesn't map cleanly onto our own
  // fulfilment states.
  lastTrackingStatus?: string;
  lastTrackingSyncedAt?: Date;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  items: IOrderItem[];
  addressId: Types.ObjectId;
  addressSnapshot: Record<string, unknown>;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
  status: OrderStatus;
  // "Prepaid" always went through Cashfree; "COD" is settled on delivery and
  // is only accepted when the site-wide COD toggle is on (see
  // Setting.model.ts / checkout.service.ts). Defaults to "Prepaid" so every
  // pre-existing order keeps its current (only) behaviour.
  paymentMethod: 'Prepaid' | 'COD';
  paymentId?: Types.ObjectId;
  shipment?: IShipment;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String },
  },
  { _id: false }
);

const shipmentSchema = new Schema<IShipment>(
  {
    shiprocketOrderId: { type: String },
    shiprocketShipmentId: { type: String },
    courierId: { type: String },
    courierName: { type: String },
    awbCode: { type: String },
    trackingUrl: { type: String },
    pickupScheduledAt: { type: Date },
    lastTrackingStatus: { type: String },
    lastTrackingSyncedAt: { type: Date },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    addressId: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    addressSnapshot: { type: Schema.Types.Mixed, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: { type: String, uppercase: true, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'ReturnRequested'],
      default: 'Pending',
      index: true,
    },
    paymentMethod: { type: String, enum: ['Prepaid', 'COD'], default: 'Prepaid' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    shipment: { type: shipmentSchema, default: undefined },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });

export const Order = model<IOrder>('Order', orderSchema);
