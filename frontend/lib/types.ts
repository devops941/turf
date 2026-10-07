export type Role = "ADMIN" | "VENUE_OWNER" | "USER";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  status: string;
  createdAt?: string;
}

export interface Venue {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  sportTypes: string[];
  address: string;
  city: string;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images: string[];
  amenities: string[];
  openTime: string;
  closeTime: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  createdAt?: string;
  owner?: { id: string; name: string; email?: string } | null;
}

export interface Slot {
  id: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "OPEN" | "HELD" | "BOOKED" | "BLOCKED";
}

export interface Booking {
  id: string;
  userId: string;
  venueId: string;
  slotId: string;
  orderId: string;
  amount: number;
  splitPercentage: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REFUNDED";
  holdExpiresAt?: string | null;
  confirmedAt?: string | null;
  createdAt?: string;
  venue?: Partial<Venue> | null;
  slot?: Slot | null;
  user?: { id: string; name: string; email: string } | null;
  reviewed?: boolean;
}

export interface Transaction {
  id: string;
  bookingId: string;
  orderId: string;
  amount: number;
  splitPercentage: number;
  venueShare: number;
  adminShare: number;
  status: "CAPTURED" | "REFUNDED";
  createdAt?: string;
  venueName?: string | null;
}

export interface Payout {
  id: string;
  transactionId: string;
  bookingId: string;
  beneficiaryType: "VENUE" | "ADMIN";
  beneficiaryId: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  gatewayRef?: string | null;
  settledAt?: string | null;
  createdAt?: string;
  venueName?: string | null;
}

export interface Review {
  id: string;
  venueId: string;
  userId: string;
  bookingId: string;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  user?: { id: string; name: string } | null;
}

export interface GatewayConfigView {
  provider: string;
  apiKey: string;
  secretKeyMasked: string;
  webhookSecretMasked: string;
  webhookUrl: string;
  isActive: boolean;
  lastTestedAt?: string | null;
  lastTestStatus?: string | null;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
}

export interface VenueGatewayConfigView extends GatewayConfigView {
  configured: boolean;
  platformAccountId: string;
}

export interface SplitOverride {
  id: string;
  venueId?: string | null;
  venueName?: string | null;
  percentage: number;
  effectiveFrom?: string | null;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface SplitSettings {
  globalPercentage: number;
  global: Record<string, unknown> | null;
  venueOverrides: SplitOverride[];
}

export interface Analytics {
  totalBookings: number;
  confirmedBookings: number;
  gmv: number;
  commissionEarned: number;
  totalVenues: number;
  approvedVenues: number;
  pendingVenues: number;
  failedPaymentRate: number;
  topVenues: Array<{ venueId: string; name: string; revenue: number }>;
}

export interface Earnings {
  grossEarnings: number;
  pendingPayouts: number;
  settledPayouts: number;
  transactions: Transaction[];
  payouts: Payout[];
}
