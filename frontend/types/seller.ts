import { Availability } from './index';

export type SellerStatus = 'applied' | 'active' | 'suspended';
export type ListingStatus = 'active' | 'paused' | 'sold_out';
export type SellerOrderStatus = 'pending_payment' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type ProductRequestStatus = 'pending' | 'approved' | 'rejected';
export type PayoutStatus = 'pending' | 'due' | 'paid';

export interface ShipmentCheckpoint {
  message: string;
  location: string;
  at: string | null;
  tag: string;
  subtagMessage: string;
}

export interface Shipment {
  aftershipId: string;
  slug: string;
  tag: string;
  subtag: string;
  subtagMessage: string;
  expectedDelivery: string;
  lastCheckpoint: ShipmentCheckpoint | null;
  checkpoints: ShipmentCheckpoint[];
  syncedAt: string | null;
}

export interface SellerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: SellerStatus;
  businessName: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  whatsapp: string;
  upiId: string;
  mustChangePassword: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  colorway: string;
  image: string;
  productType: string;
  sizes: Array<number | string>;
  allowedSizes: Array<number | string>;
  stringSized: boolean;
}

export interface CatalogOffer {
  size: number | string;
  availability: Availability;
  source: 'store' | 'seller';
  isMine: boolean;
}

export interface CatalogDetail {
  product: CatalogProduct;
  offers: CatalogOffer[];
  mine: Array<{ id: string; size: number | string; sellerPrice: number; availability: Availability; qty: number; status: ListingStatus }>;
  beat: Record<string, number>;
  commissionPct: number;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  hasMore: boolean;
  total: number;
  counts: Record<string, number>;
}

export type ListingCompetition =
  | { lowest: true }
  | { lowest: false; beat: number; by: 'store' | 'seller'; tie: boolean };

export interface SellerListing {
  id: string;
  productId: string;
  product: { id: string; slug: string; name: string; brand: string; colorway: string; image: string } | null;
  size: number | string;
  sellerPrice: number;
  availability: Availability;
  qty: number;
  status: ListingStatus;
  soldCount: number;
  competition: ListingCompetition | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerOrderItem {
  productId: string;
  listingId: string;
  name: string;
  brand: string;
  size: string;
  colorway: string;
  image: string;
  slug: string;
  qty: number;
  sellerPrice: number;
  listPrice?: number;
  availability: Availability;
}

export interface VerificationPhoto {
  angle: string;
  url: string;
}

export interface SellerOrder {
  _id: string;
  order: string;
  orderNumber: string;
  seller: string | { _id: string; name: string; email: string; phone: string; whatsapp?: string; businessName?: string; addressLine?: string; city?: string; state?: string; pincode?: string };
  items: SellerOrderItem[];
  sellerTotal: number;
  status: SellerOrderStatus;
  verification: {
    status: VerificationStatus;
    photos: VerificationPhoto[];
    submittedAt: string | null;
    reviewedAt: string | null;
    adminNote: string;
    attempts: number;
  };
  trackingNumber: string;
  deliveryService: string;
  trackingAddedAt: string | null;
  trackingLockedAt: string | null;
  deliveryCity: string;
  deliveryState: string;
  cancelReason: string;
  confirmedAt?: string | null;
  shipBy?: string | null;
  deliveredAt?: string | null;
  shipment?: Shipment | null;
  payout?: {
    status: PayoutStatus;
    amount: number;
    dueAt: string | null;
    paidAt: string | null;
    screenshotUrl: string;
    reference: string;
    note: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  _id: string;
  seller: string | { _id: string; name: string; email: string; phone?: string; businessName?: string };
  name: string;
  brand: string;
  colorway: string;
  sizes: string[];
  supportingUrls: string[];
  note: string;
  status: ProductRequestStatus;
  adminNote: string;
  product: null | { _id: string; slug: string; name: string; brand: string; images?: string[] };
  reviewedAt: string | null;
  createdAt: string;
}

export interface TatStat {
  avgDays: number | null;
  targetDays: number;
  samples: number;
}

export interface SellerRank {
  position: number | null;
  ranked: number;
  monthSales: number;
  monthOrders: number;
}

export interface SellerDashboard {
  profile: {
    displayName: string;
    score: number | null;
    scoreLabel: string | null;
    ratingMinOrders: number;
    shippedOrders: number;
    rank: SellerRank;
  };
  health: {
    tat: Record<Availability, TatStat>;
    onTimeRate: number | null;
    cancellationRate: number | null;
    photoApprovalRate: number | null;
    lowestOffers: { lowest: number | null; total: number };
  };
  inventory: { activeListings: number; pausedListings: number; soldOutListings: number; units: number; listingValue: number };
  sales: { allTime: number; orders: number; last7Days: number; last30Days: number; avgOrder: number };
  listings: { active: number; paused: number; sold_out: number; units: number; value: number };
  orders: {
    total: number;
    needsVerification: number;
    awaitingReview: number;
    needsTracking: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    pendingPayment: number;
    overdue: number;
    payoutDue: number;
  };
  latePenaltyText?: string;
  earnings: { inProgress: number; due: number; paid: number; thisMonth: number; nextPayoutAt: string | null; payoutDelayDays: number };
  requestsPending: number;
  actionItems: SellerOrder[];
  recentOrders: SellerOrder[];
}

export interface VerificationAngle {
  id: string;
  label: string;
  required: boolean;
}
