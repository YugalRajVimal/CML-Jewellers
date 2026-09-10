// // Canonical API envelope shapes — mirrors PART 5 (API Contract).

// export interface ApiSuccess<T> {
//   success: true;
//   message: string;
//   data: T;
//   meta?: {
//     page?: number;
//     limit?: number;
//     total?: number;
//   };
// }

// export interface ApiError {
//   success: false;
//   message: string;
//   error: {
//     code: string;
//     details?: Record<string, unknown>;
//   };
// }

// export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// export interface Address {
//   id: string;
//   label?: string;
//   line1: string;
//   line2?: string;
//   city: string;
//   state: string;
//   postalCode: string;
//   country: string;
//   phone: string;
//   isDefault?: boolean;
// }

// export type SortOption =
//   | "newest"
//   | "price_asc"
//   | "price_desc"
//   | "popular"
//   | "bestselling"
//   | "discount"
//   | "recommended";

// export interface ProductListParams {
//   page?: number;
//   limit?: number;
//   category?: string;
//   minPrice?: number;
//   maxPrice?: number;
//   metal?: string;
//   sort?: SortOption;
//   q?: string;
// }

// export interface User {
//   id: string;
//   name: string;
//   email?: string;
//   phone?: string;
//   addresses?: Address[];
// }

// export interface ProductVariant {
//   id: string;
//   sku: string;
//   attributes: Record<string, string>; // e.g. { metal: "Gold", size: "6" }
//   price: number;
//   mrp?: number;
//   stock: number;
// }

// export interface Product {
//   id: string;
//   slug: string;
//   name: string;
//   description: string;
//   images: string[];
//   category: string;
//   price: number;
//   mrp?: number;
//   rating?: number;
//   reviewCount?: number;
//   variants: ProductVariant[];
//   relatedSlugs?: string[];
// }

// export interface Category {
//   id: string;
//   slug: string;
//   name: string;
//   image?: string;
//   subcategories?: Category[];
// }

// export interface CartItem {
//   id: string;
//   productId: string;
//   productName: string;
//   productSlug: string;
//   image?: string;
//   variantId: string;
//   variantAttributes: Record<string, string>;
//   quantity: number;
//   price: number; // price backend charged when added
//   currentPrice: number; // live price, for price-change detection
//   stock: number;
// }

// export interface Cart {
//   id: string;
//   items: CartItem[];
//   subtotal: number;
//   discount: number;
//   total: number;
//   couponCode?: string;
// }

// export interface WishlistItem {
//   id: string;
//   product: Product;
// }

// export type OrderStatus =
//   | "Pending"
//   | "Confirmed"
//   | "Processing"
//   | "Shipped"
//   | "Delivered"
//   | "Cancelled"
//   | "ReturnRequested";

// export interface OrderLineItem {
//   id: string;
//   productName: string;
//   productSlug: string;
//   image?: string;
//   variantAttributes: Record<string, string>;
//   quantity: number;
//   price: number;
// }

// export interface Order {
//   id: string;
//   status: OrderStatus;
//   items: OrderLineItem[];
//   subtotal: number;
//   discount: number;
//   shipping: number;
//   total: number;
//   address: Address;
//   createdAt: string;
//   trackingNumber?: string;
//   trackingCarrier?: string;
// }

// export type PaymentStatus = "Created" | "Pending" | "Success" | "Failed" | "Cancelled";

// export interface PaymentSession {
//   paymentId: string;
//   paymentLink: string;
// }

// export type ReturnStatus = "Requested" | "Approved" | "PickedUp" | "Received" | "Inspected" | "Refunded" | "Rejected" | "Cancelled";

// export interface ReturnRequest {
//   id: string;
//   orderId: string;
//   status: ReturnStatus;
//   reason: string;
//   createdAt: string;
// }


// Canonical API envelope shapes — mirrors PART 5 (API Contract).

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error: {
    code: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface Address {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export type SortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular"
  | "bestselling"
  | "discount"
  | "recommended";

export interface ProductListParams {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  metal?: string;
  sort?: SortOption;
  q?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  addresses?: Address[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>; // e.g. { metal: "Gold", size: "6" }
  price: number;
  mrp?: number;
  stock: number;
}

// Matches what /products and /products/:slug actually return — prices are
// integer paise/cents, attributes is a flat key/value bag (metal, purity,
// stone, gender, occasion, jewelryType, ...), and category/subcategory/
// collection are raw ObjectId strings unless the backend populates them.
export interface Product {
  _id: string;
  id?: string; // normalized alias for _id where consumers expect .id
  slug: string;
  name: string;
  description: string;
  images: string[];
  sku: string;

  categoryId: string;
  subcategoryId?: string;
  collectionId?: string;
  // Present only when the backend populates the ref instead of returning a bare id.
  category?: { id: string; name: string; slug: string };
  subcategory?: { id: string; name: string; slug: string };
  collection?: { id: string; name: string; slug: string };

  attributes: {
    material?: string;
    metal?: string;
    purity?: string;
    stone?: string;
    gender?: string;
    occasion?: string;
    jewelryType?: string;
    [key: string]: string | undefined;
  };

  price: number;
  basePrice: number;
  mrp?: number;
  discountPercent?: number;

  status: "active" | "draft" | "archived";
  isFeatured: boolean;
  isNewArrival: boolean;
  inStock: boolean;

  isWishlisted?: boolean;

  ratingAvg: number;
  ratingCount: number;

  variantCount: number;
  totalAvailable: number;
  variants?: ProductVariant[];
  defaultVariantId?: string

  publishedAt?: string;
  createdAt: string;
  updatedAt: string;

  relatedSlugs?: string[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  image?: string;
  subcategories?: Category[];
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  image?: string;
  variantId: string;
  variantAttributes: Record<string, string>;
  quantity: number;
  price: number; // price backend charged when added
  currentPrice: number; // live price, for price-change detection
  stock: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
}

export interface WishlistItem {
  id: string;
  product: Product;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "ReturnRequested";

export interface OrderLineItem {
  id: string;
  productName: string;
  productSlug: string;
  image?: string;
  variantAttributes: Record<string, string>;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderLineItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  address: Address;
  createdAt: string;
  trackingNumber?: string;
  trackingCarrier?: string;
}

export type PaymentStatus = "Created" | "Pending" | "Success" | "Failed" | "Cancelled";

export interface PaymentSession {
  paymentId: string;
  paymentLink: string;
}

export type ReturnStatus = "Requested" | "Approved" | "PickedUp" | "Received" | "Inspected" | "Refunded" | "Rejected" | "Cancelled";

export interface ReturnRequest {
  id: string;
  orderId: string;
  status: ReturnStatus;
  reason: string;
  createdAt: string;
}