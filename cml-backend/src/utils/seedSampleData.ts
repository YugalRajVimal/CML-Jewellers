/**
 * Sample data seeder — fills every collection with realistic, interconnected
 * records for local development and manual API testing. Idempotent: re-running
 * it clears out prior sample data (identified by well-known slugs/codes/emails)
 * before reinserting.
 *
 * This is DEV/TEST DATA ONLY. Never run against a production database.
 *
 * Usage: npm run seed:sample
 * Run `npm run seed` first (or let this script do it) to get base roles/permissions.
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '@/config/db';
import { logger } from '@/utils/logger';

import { Permission } from '@/models/Permission.model';
import { Role } from '@/models/Role.model';
import { AdminUser } from '@/models/AdminUser.model';
import { User } from '@/models/User.model';
import { Address } from '@/models/Address.model';
import { Category } from '@/models/Category.model';
import { Collection } from '@/models/Collection.model';
import { Product } from '@/models/Product.model';
import { ProductVariant } from '@/models/ProductVariant.model';
import { Inventory } from '@/models/Inventory.model';
import { InventoryTransaction } from '@/models/InventoryTransaction.model';
import { Wishlist } from '@/models/Wishlist.model';
import { Cart } from '@/models/Cart.model';
import { Coupon } from '@/models/Coupon.model';
import { Order } from '@/models/Order.model';
import { Payment } from '@/models/Payment.model';
import { Return } from '@/models/Return.model';
import { Refund } from '@/models/Refund.model';
import { Supplier } from '@/models/Supplier.model';
import { Purchase } from '@/models/Purchase.model';
import { Banner } from '@/models/Banner.model';
import { HomepageContent } from '@/models/HomepageContent.model';
import { Review } from '@/models/Review.model';
import { Otp } from '@/models/Otp.model';

import { ALL_PERMISSIONS, BASE_ROLES } from '@/constants/permissions';
import { slugify } from '@/utils/slugify';
import { generateOrderNumber } from '@/utils/orderNumber';

// ---------------------------------------------------------------------------
// Well-known identifiers for sample records, so re-runs can clean up by them
// instead of wiping entire collections (which may also hold real dev work).
// ---------------------------------------------------------------------------
const SAMPLE_CUSTOMER_EMAILS = ['priya.sharma@example.com', 'rohan.mehta@example.com'];
const SAMPLE_ADMIN_EMAIL = 'content.manager@cmljewellers.in';
const SAMPLE_CATEGORY_SLUGS = ['rings', 'engagement-rings', 'necklaces', 'earrings'];
const SAMPLE_COLLECTION_SLUGS = ['bridal-collection', 'festive-collection'];
const SAMPLE_PRODUCT_SLUGS = [
  'classic-gold-band-ring',
  'diamond-solitaire-ring',
  'temple-gold-necklace',
  'pearl-drop-earrings',
];
const SAMPLE_SUPPLIER_NAMES = ['Rajesh Gold Suppliers', 'Mumbai Gems Traders'];
const SAMPLE_COUPON_CODES = ['WELCOME15', 'SAVE10'];

async function cleanupPreviousRun(): Promise<void> {
  logger.info('Cleaning up any previous sample-data run...');

  const users = await User.find({ email: { $in: SAMPLE_CUSTOMER_EMAILS } }).select('_id');
  const userIds = users.map((u) => u._id);

  const products = await Product.find({ slug: { $in: SAMPLE_PRODUCT_SLUGS } }).select('_id');
  const productIds = products.map((p) => p._id);
  const variants = await ProductVariant.find({ productId: { $in: productIds } }).select('_id');
  const variantIds = variants.map((v) => v._id);

  const suppliers = await Supplier.find({ name: { $in: SAMPLE_SUPPLIER_NAMES } }).select('_id');
  const supplierIds = suppliers.map((s) => s._id);

  const orders = await Order.find({ userId: { $in: userIds } }).select('_id');
  const orderIds = orders.map((o) => o._id);

  await Promise.all([
    Review.deleteMany({ userId: { $in: userIds } }),
    Return.deleteMany({ orderId: { $in: orderIds } }),
    Payment.deleteMany({ orderId: { $in: orderIds } }),
    Refund.deleteMany({}), // refunds only ever created by this script in a fresh dev DB
    Order.deleteMany({ userId: { $in: userIds } }),
    Cart.deleteMany({ userId: { $in: userIds } }),
    Wishlist.deleteMany({ userId: { $in: userIds } }),
    Address.deleteMany({ userId: { $in: userIds } }),
    Purchase.deleteMany({ supplierId: { $in: supplierIds } }),
    Supplier.deleteMany({ _id: { $in: supplierIds } }),
    InventoryTransaction.deleteMany({ variantId: { $in: variantIds } }),
    Inventory.deleteMany({ variantId: { $in: variantIds } }),
    ProductVariant.deleteMany({ _id: { $in: variantIds } }),
    Product.deleteMany({ _id: { $in: productIds } }),
    Coupon.deleteMany({ code: { $in: SAMPLE_COUPON_CODES } }),
    Banner.deleteMany({ title: { $regex: '^\\[Sample\\]' } }),
    HomepageContent.deleteMany({ section: { $regex: '^sample_' } }),
    User.deleteMany({ email: { $in: SAMPLE_CUSTOMER_EMAILS } }),
    AdminUser.deleteMany({ email: SAMPLE_ADMIN_EMAIL }),
    Otp.deleteMany({ identifier: { $in: SAMPLE_CUSTOMER_EMAILS } }),
  ]);

  await Category.deleteMany({ slug: { $in: SAMPLE_CATEGORY_SLUGS } });
  await Collection.deleteMany({ slug: { $in: SAMPLE_COLLECTION_SLUGS } });

  logger.info('Cleanup complete.');
}

async function seedPermissionsAndRoles(): Promise<Map<string, mongoose.Types.ObjectId>> {
  const permissionIds = new Map<string, mongoose.Types.ObjectId>();
  for (const key of ALL_PERMISSIONS) {
    const doc = await Permission.findOneAndUpdate({ key }, { key }, { upsert: true, new: true, setDefaultsOnInsert: true });
    permissionIds.set(key, doc._id);
  }

  const roleIds = new Map<string, mongoose.Types.ObjectId>();
  for (const roleDef of BASE_ROLES) {
    const permissionObjectIds = roleDef.permissions.map((p) => permissionIds.get(p)).filter(Boolean);
    const doc = await Role.findOneAndUpdate(
      { name: roleDef.name },
      { name: roleDef.name, description: roleDef.description, permissions: permissionObjectIds, isSystem: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    roleIds.set(roleDef.name, doc._id);
  }

  logger.info(`Ensured ${permissionIds.size} permissions and ${roleIds.size} base roles exist.`);
  return roleIds;
}

async function seedSampleAdmin(roleIds: Map<string, mongoose.Types.ObjectId>) {
  const contentManagerRoleId = roleIds.get('Content Manager');
  const passwordHash = await bcrypt.hash('SamplePass123!', 12);

  const admin = await AdminUser.create({
    name: 'Ananya Iyer',
    email: SAMPLE_ADMIN_EMAIL,
    passwordHash,
    roleId: contentManagerRoleId,
    isActive: true,
  });

  logger.info(`Sample admin created: ${admin.email} / SamplePass123!`);
  return admin;
}

async function seedCustomers() {
  const passwordHash = await bcrypt.hash('SamplePass123!', 12);

  const priya = await User.create({
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+919810000001',
    passwordHash,
    emailVerified: true,
    phoneVerified: true,
  });

  const rohan = await User.create({
    name: 'Rohan Mehta',
    email: 'rohan.mehta@example.com',
    phone: '+919810000002',
    passwordHash,
    emailVerified: true,
    phoneVerified: false,
  });

  const priyaAddress = await Address.create({
    userId: priya._id,
    label: 'Home',
    line1: '14 MG Road',
    line2: 'Near City Mall',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248001',
    country: 'India',
    isDefault: true,
  });

  const rohanAddress = await Address.create({
    userId: rohan._id,
    label: 'Home',
    line1: '221 Sector 15',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122001',
    country: 'India',
    isDefault: true,
  });

  logger.info('Sample customers + addresses created.');
  return { priya, rohan, priyaAddress, rohanAddress };
}

async function seedCatalog() {
  const rings = await Category.create({ name: 'Rings', slug: 'rings', displayOrder: 1 });
  const engagementRings = await Category.create({
    name: 'Engagement Rings',
    slug: 'engagement-rings',
    parentId: rings._id,
    displayOrder: 1,
  });
  const necklaces = await Category.create({ name: 'Necklaces', slug: 'necklaces', displayOrder: 2 });
  const earrings = await Category.create({ name: 'Earrings', slug: 'earrings', displayOrder: 3 });

  const bridal = await Collection.create({
    name: 'Bridal Collection',
    slug: 'bridal-collection',
    description: 'Timeless pieces for the big day',
    isFeatured: true,
    displayOrder: 1,
  });
  const festive = await Collection.create({
    name: 'Festive Collection',
    slug: 'festive-collection',
    description: 'Statement pieces for celebrations',
    isFeatured: true,
    displayOrder: 2,
  });

  const productDefs = [
    {
      name: 'Classic Gold Band Ring',
      categoryId: rings._id,
      subcategoryId: engagementRings._id,
      collectionId: bridal._id,
      description: 'A timeless 22K gold band, hand-finished for everyday elegance.',
      basePrice: 45000,
      mrp: 52000,
      sku: 'CML-RNG-001',
      attributes: { material: 'Gold', metal: 'Yellow Gold', purity: '22K', stone: 'None', gender: 'women', occasion: 'Wedding', jewelryType: 'Ring' },
      images: ['https://res.cloudinary.com/demo/image/upload/sample-ring-1.jpg'],
      status: 'active',
      isFeatured: true,
      variants: [
        { sku: 'CML-RNG-001-06', attributes: { size: '6' }, price: 45000, mrp: 52000, stock: 8 },
        { sku: 'CML-RNG-001-07', attributes: { size: '7' }, price: 45500, mrp: 52500, stock: 5 },
      ],
    },
    {
      name: 'Diamond Solitaire Ring',
      categoryId: rings._id,
      subcategoryId: engagementRings._id,
      collectionId: bridal._id,
      description: 'A brilliant-cut solitaire diamond set in 18K white gold.',
      basePrice: 125000,
      mrp: 145000,
      sku: 'CML-RNG-002',
      attributes: { material: 'Gold', metal: 'White Gold', purity: '18K', stone: 'Diamond', gender: 'women', occasion: 'Wedding', jewelryType: 'Ring' },
      images: ['https://res.cloudinary.com/demo/image/upload/sample-ring-2.jpg'],
      status: 'active',
      isFeatured: true,
      variants: [
        { sku: 'CML-RNG-002-06', attributes: { size: '6' }, price: 125000, mrp: 145000, stock: 3 },
        { sku: 'CML-RNG-002-07', attributes: { size: '7' }, price: 126000, mrp: 146000, stock: 0 },
      ],
    },
    {
      name: 'Temple Gold Necklace',
      categoryId: necklaces._id,
      collectionId: festive._id,
      description: 'Traditional temple-motif necklace in 22K gold, festive-ready.',
      basePrice: 210000,
      mrp: 230000,
      sku: 'CML-NCK-001',
      attributes: { material: 'Gold', metal: 'Yellow Gold', purity: '22K', stone: 'None', gender: 'women', occasion: 'Festive', jewelryType: 'Necklace' },
      images: ['https://res.cloudinary.com/demo/image/upload/sample-necklace-1.jpg'],
      status: 'active',
      isNewArrival: true,
      variants: [{ sku: 'CML-NCK-001-OS', attributes: {}, price: 210000, mrp: 230000, stock: 4 }],
    },
    {
      name: 'Pearl Drop Earrings',
      categoryId: earrings._id,
      description: 'Freshwater pearl drops on delicate gold hooks.',
      basePrice: 18000,
      mrp: 21000,
      sku: 'CML-EAR-001',
      attributes: { material: 'Gold', metal: 'Yellow Gold', purity: '18K', stone: 'Pearl', gender: 'women', occasion: 'Daily Wear', jewelryType: 'Earrings' },
      images: ['https://res.cloudinary.com/demo/image/upload/sample-earrings-1.jpg'],
      status: 'active',
      variants: [{ sku: 'CML-EAR-001-OS', attributes: {}, price: 18000, mrp: 21000, stock: 15 }],
    },
  ] as const;

  const createdProducts: Record<string, { productId: mongoose.Types.ObjectId; variantIds: mongoose.Types.ObjectId[] }> = {};

  for (const def of productDefs) {
    const product = await Product.create({
      name: def.name,
      slug: slugify(def.name),
      categoryId: def.categoryId,
      subcategoryId: 'subcategoryId' in def ? def.subcategoryId : undefined,
      collectionId: 'collectionId' in def ? def.collectionId : undefined,
      description: def.description,
      basePrice: def.basePrice,
      mrp: def.mrp,
      sku: def.sku,
      attributes: def.attributes,
      images: def.images,
      status: def.status,
      isFeatured: 'isFeatured' in def ? def.isFeatured : false,
      isNewArrival: 'isNewArrival' in def ? def.isNewArrival : false,
      publishedAt: new Date(),
    });

    const variantIds: mongoose.Types.ObjectId[] = [];
    for (const v of def.variants) {
      const variant = await ProductVariant.create({
        productId: product._id,
        sku: v.sku,
        attributes: v.attributes,
        price: v.price,
        mrp: v.mrp,
        isActive: true,
      });
      const inventory = await Inventory.create({
        variantId: variant._id,
        available: v.stock,
        reserved: 0,
        sold: 0,
        damaged: 0,
        returned: 0,
        lowStockThreshold: 5,
      });
      if (v.stock > 0) {
        await InventoryTransaction.create({
          inventoryId: inventory._id,
          variantId: variant._id,
          type: 'purchase',
          qty: v.stock,
          refId: 'SEED-INITIAL-STOCK',
          note: 'Initial sample stock',
        });
      }
      variantIds.push(variant._id);
    }

    createdProducts[def.sku] = { productId: product._id, variantIds };
  }

  logger.info(`Sample catalog created: ${Object.keys(createdProducts).length} products, categories, and collections.`);
  return { rings, engagementRings, necklaces, earrings, bridal, festive, createdProducts };
}

async function seedSuppliersAndPurchase(createdProducts: Record<string, { productId: mongoose.Types.ObjectId; variantIds: mongoose.Types.ObjectId[] }>) {
  const supplier1 = await Supplier.create({
    name: 'Rajesh Gold Suppliers',
    contact: { email: 'contact@rajeshgold.example', phone: '+919811111111', contactPerson: 'Rajesh Kumar' },
    address: { line1: 'Karol Bagh Gold Market', city: 'New Delhi', state: 'Delhi', pincode: '110005', country: 'India' },
    isActive: true,
  });

  const supplier2 = await Supplier.create({
    name: 'Mumbai Gems Traders',
    contact: { email: 'sales@mumbaigems.example', phone: '+919822222222', contactPerson: 'Anil Shah' },
    address: { line1: 'Zaveri Bazaar', city: 'Mumbai', state: 'Maharashtra', pincode: '400002', country: 'India' },
    isActive: true,
  });

  const ringVariantId = createdProducts['CML-RNG-002'].variantIds[1]; // the currently out-of-stock size-7 solitaire

  const purchase = await Purchase.create({
    purchaseNumber: `PO-SEED-${Date.now()}`,
    supplierId: supplier2._id,
    items: [{ variantId: ringVariantId, orderedQty: 10, receivedQty: 6, cost: 98000 }],
    status: 'PartiallyReceived',
    notes: 'Restocking size-7 solitaire rings ahead of wedding season',
  });

  // Reflect the partial receipt in Inventory + InventoryTransaction, consistent with purchase.service logic.
  const inventory = await Inventory.findOneAndUpdate(
    { variantId: ringVariantId },
    { $inc: { available: 6 } },
    { new: true }
  );
  if (inventory) {
    await InventoryTransaction.create({
      inventoryId: inventory._id,
      variantId: ringVariantId,
      type: 'purchase',
      qty: 6,
      refId: purchase.purchaseNumber,
      note: 'Partial receipt against PO',
    });
  }

  logger.info('Sample suppliers + a partially-received purchase order created.');
  return { supplier1, supplier2, purchase };
}

async function seedCoupons() {
  const welcome = await Coupon.create({
    code: 'WELCOME15',
    type: 'percent',
    value: 15,
    minCartValue: 5000,
    maxDiscountAmount: 10000,
    expiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    usageLimit: 500,
    usageLimitPerUser: 1,
    isActive: true,
  });

  const save10 = await Coupon.create({
    code: 'SAVE10',
    type: 'flat',
    value: 1000,
    minCartValue: 10000,
    expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    usageLimit: 0, // unlimited
    usageLimitPerUser: 3,
    isActive: true,
  });

  logger.info('Sample coupons created: WELCOME15, SAVE10.');
  return { welcome, save10 };
}

async function seedWishlistAndCart(
  priya: InstanceType<typeof User>,
  rohan: InstanceType<typeof User>,
  createdProducts: Record<string, { productId: mongoose.Types.ObjectId; variantIds: mongoose.Types.ObjectId[] }>
) {
  await Wishlist.create({
    userId: priya._id,
    items: [
      { productId: createdProducts['CML-RNG-002'].productId, addedAt: new Date() },
      { productId: createdProducts['CML-EAR-001'].productId, addedAt: new Date() },
    ],
  });

  const earringVariant = await ProductVariant.findById(createdProducts['CML-EAR-001'].variantIds[0]);

  await Cart.create({
    userId: rohan._id,
    items: [
      {
        productId: createdProducts['CML-EAR-001'].productId,
        variantId: createdProducts['CML-EAR-001'].variantIds[0],
        qty: 1,
        priceSnapshot: earringVariant!.price,
        addedAt: new Date(),
      },
    ],
    couponCode: 'SAVE10',
  });

  logger.info('Sample wishlist (Priya) and cart (Rohan) created.');
}

async function seedOrdersPaymentsReturns(
  priya: InstanceType<typeof User>,
  priyaAddress: InstanceType<typeof Address>,
  createdProducts: Record<string, { productId: mongoose.Types.ObjectId; variantIds: mongoose.Types.ObjectId[] }>
) {
  const ringVariantId = createdProducts['CML-RNG-001'].variantIds[0];
  const ringVariant = await ProductVariant.findById(ringVariantId);
  const ringProduct = await Product.findById(createdProducts['CML-RNG-001'].productId);

  // --- Order 1: fully completed lifecycle (Delivered, paid, reviewed) ---
  const deliveredOrder = await Order.create({
    orderNumber: generateOrderNumber(),
    userId: priya._id,
    items: [
      {
        productId: ringProduct!._id,
        variantId: ringVariant!._id,
        name: ringProduct!.name,
        sku: ringVariant!.sku,
        qty: 1,
        price: ringVariant!.price,
        image: ringProduct!.images[0],
      },
    ],
    addressId: priyaAddress._id,
    addressSnapshot: priyaAddress.toObject(),
    subtotal: ringVariant!.price,
    discount: 0,
    shipping: 0,
    tax: Math.round(ringVariant!.price * 0.03),
    total: ringVariant!.price + Math.round(ringVariant!.price * 0.03),
    status: 'Delivered',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  });

  const successfulPayment = await Payment.create({
    orderId: deliveredOrder._id,
    provider: 'cashfree',
    providerRefId: deliveredOrder.orderNumber,
    cfPaymentSessionId: 'seed-session-001',
    amount: deliveredOrder.total,
    status: 'Success',
    verifiedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  });

  deliveredOrder.paymentId = successfulPayment._id;
  await deliveredOrder.save();

  await Review.create({
    productId: ringProduct!._id,
    userId: priya._id,
    orderId: deliveredOrder._id,
    rating: 5,
    title: 'Beautiful craftsmanship',
    comment: 'The band fits perfectly and the finish is stunning. Highly recommend!',
    status: 'approved',
  });
  await Product.findByIdAndUpdate(ringProduct!._id, { ratingAvg: 5, ratingCount: 1 });

  // --- Order 2: a second (different) delivered order, now under a completed Return/Refund ---
  const returnedOrder = await Order.create({
    orderNumber: generateOrderNumber(),
    userId: priya._id,
    items: [
      {
        productId: ringProduct!._id,
        variantId: ringVariant!._id,
        name: ringProduct!.name,
        sku: ringVariant!.sku,
        qty: 1,
        price: ringVariant!.price,
        image: ringProduct!.images[0],
      },
    ],
    addressId: priyaAddress._id,
    addressSnapshot: priyaAddress.toObject(),
    subtotal: ringVariant!.price,
    discount: 0,
    shipping: 0,
    tax: Math.round(ringVariant!.price * 0.03),
    total: ringVariant!.price + Math.round(ringVariant!.price * 0.03),
    status: 'ReturnRequested',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  });

  const returnedOrderPayment = await Payment.create({
    orderId: returnedOrder._id,
    provider: 'cashfree',
    providerRefId: returnedOrder.orderNumber,
    cfPaymentSessionId: 'seed-session-002',
    amount: returnedOrder.total,
    status: 'Success',
    verifiedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  });
  returnedOrder.paymentId = returnedOrderPayment._id;
  await returnedOrder.save();

  const refund = await Refund.create({
    paymentId: returnedOrderPayment._id,
    amount: returnedOrder.total,
    status: 'Completed',
  });

  const sampleReturn = await Return.create({
    orderId: returnedOrder._id,
    userId: priya._id,
    items: [{ orderItemProductId: ringProduct!._id, variantId: ringVariant!._id, qty: 1, reason: 'Size did not fit' }],
    reason: 'Size did not fit as expected',
    status: 'Refunded',
    inspectionNotes: 'Item returned in original condition, no damage found.',
    refundId: refund._id,
  });
  refund.returnId = sampleReturn._id;
  await refund.save();

  // --- Order 3: freshly placed, still Pending (no payment yet) — exercises the checkout/retry flow ---
  const necklaceVariantId = createdProducts['CML-NCK-001'].variantIds[0];
  const necklaceVariant = await ProductVariant.findById(necklaceVariantId);
  const necklaceProduct = await Product.findById(createdProducts['CML-NCK-001'].productId);

  const pendingOrder = await Order.create({
    orderNumber: generateOrderNumber(),
    userId: priya._id,
    items: [
      {
        productId: necklaceProduct!._id,
        variantId: necklaceVariant!._id,
        name: necklaceProduct!.name,
        sku: necklaceVariant!.sku,
        qty: 1,
        price: necklaceVariant!.price,
        image: necklaceProduct!.images[0],
      },
    ],
    addressId: priyaAddress._id,
    addressSnapshot: priyaAddress.toObject(),
    subtotal: necklaceVariant!.price,
    discount: 0,
    shipping: 0,
    tax: Math.round(necklaceVariant!.price * 0.03),
    total: necklaceVariant!.price + Math.round(necklaceVariant!.price * 0.03),
    status: 'Pending',
  });

  // Reserve stock for the pending order, mirroring what reserveStock() does at real checkout.
  const necklaceInventory = await Inventory.findOneAndUpdate(
    { variantId: necklaceVariantId, available: { $gte: 1 } },
    { $inc: { available: -1, reserved: 1 } },
    { new: true }
  );
  if (necklaceInventory) {
    await InventoryTransaction.create({
      inventoryId: necklaceInventory._id,
      variantId: necklaceVariantId,
      type: 'reservation',
      qty: 1,
      refId: pendingOrder.orderNumber,
    });
  }

  await Payment.create({
    orderId: pendingOrder._id,
    provider: 'cashfree',
    providerRefId: pendingOrder.orderNumber,
    cfPaymentSessionId: 'seed-session-003',
    amount: pendingOrder.total,
    status: 'Pending',
  });

  logger.info('Sample orders (Delivered+reviewed, Refunded return, Pending+reserved) created.');
}

async function seedContentAndBanners() {
  await Banner.create([
    {
      type: 'hero',
      title: '[Sample] Timeless Bridal Edit',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample-hero-bridal.jpg',
      ctaText: 'Shop Bridal',
      ctaUrl: '/collections/bridal-collection',
      order: 1,
      isActive: true,
    },
    {
      type: 'promo',
      title: '[Sample] Festive Season Sale',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample-promo-festive.jpg',
      ctaText: 'Explore Festive',
      ctaUrl: '/collections/festive-collection',
      order: 2,
      isActive: true,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ]);

  await HomepageContent.create([
    {
      section: 'sample_featured_collections',
      title: 'Featured Collections',
      data: { collectionSlugs: ['bridal-collection', 'festive-collection'] },
      order: 1,
      isActive: true,
    },
    {
      section: 'sample_testimonials',
      title: 'What Our Customers Say',
      data: {
        quotes: [
          { author: 'Priya S.', quote: 'The craftsmanship exceeded my expectations.' },
          { author: 'Rohan M.', quote: 'Fast delivery and beautifully packaged.' },
        ],
      },
      order: 2,
      isActive: true,
    },
  ]);

  logger.info('Sample banners and homepage content sections created.');
}

async function run(): Promise<void> {
  await connectDB();

  await cleanupPreviousRun();

  const roleIds = await seedPermissionsAndRoles();
  await seedSampleAdmin(roleIds);

  const { priya, rohan, priyaAddress } = await seedCustomers();
  const { createdProducts } = await seedCatalog();
  await seedSuppliersAndPurchase(createdProducts);
  await seedCoupons();
  await seedWishlistAndCart(priya, rohan, createdProducts);
  await seedOrdersPaymentsReturns(priya, priyaAddress, createdProducts);
  await seedContentAndBanners();

  logger.info('--------------------------------------------------');
  logger.info('Sample data seeding complete. Every schema now has data:');
  logger.info('Permission, Role, AdminUser, User, Address, Category, Collection,');
  logger.info('Product, ProductVariant, Inventory, InventoryTransaction, Supplier,');
  logger.info('Purchase, Coupon, Wishlist, Cart, Order, Payment, Return, Refund,');
  logger.info('Banner, HomepageContent, Review.');
  logger.info('(Otp and AuditLog are populated organically by the app at runtime —');
  logger.info(' this script leaves them empty except for cleaning up any stale rows.)');
  logger.info('--------------------------------------------------');
  logger.info('Sample login credentials (password: SamplePass123!):');
  logger.info('  Customer: priya.sharma@example.com / +919810000001');
  logger.info('  Customer: rohan.mehta@example.com / +919810000002');
  logger.info(`  Admin (Content Manager): ${SAMPLE_ADMIN_EMAIL}`);
  logger.info('--------------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  logger.error('Sample data seeding failed', err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});