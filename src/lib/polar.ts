// Stub. Install the @shipkit/payments registry item to replace this file.
//
// Exports the same names as ShipKit's src/lib/polar.ts so shared importers
// (server/actions/payments.ts, the polar provider, webhooks) compile without
// @polar-sh/sdk. Every function is a no-op that reports "nothing purchased".

export interface PolarPaymentData {
  id: string;
  orderId: string;
  userEmail: string;
  userName: string | null;
  amount: number;
  status: "paid" | "refunded" | "pending";
  productName: string;
  purchaseDate: Date;
}

interface PolarOrder {
  id: string;
  orderId: string;
  userEmail: string;
  userName: string | null;
  amount: number;
  status: "paid" | "refunded" | "pending";
  productName: string;
  purchaseDate: Date;
  discountCode: string | null;
  attributes: Record<string, any>;
}

export interface PolarOrderAttributes {
  product?: {
    id: string;
    name: string;
  };
  isSubscription?: boolean;
  is_recurring?: boolean;
  subscription_status?: string;
  subscription_end_date?: string | Date;
  expiresAt?: string | Date;
}

export const getOrdersByEmail = async (_email: string): Promise<PolarOrder[]> => [];

export const getAllOrders = async (): Promise<PolarOrder[]> => [];

export const getPolarPaymentStatus = async (_userId: string): Promise<boolean> => false;

export const fetchPolarProducts = async () => [];

export const getOrderById = async (_orderId: string): Promise<PolarOrder | null> => null;

export const processPolarWebhook = async (_event: any) => {};

export const createCheckoutUrl = async (_options: {
  productId: string;
  email?: string;
  userId?: string;
  metadata?: Record<string, any>;
}): Promise<string | null> => null;

export const hasUserPurchasedProduct = async (
  _userId: string,
  _productId: string
): Promise<boolean> => false;

export const hasUserActiveSubscription = async (_userId: string): Promise<boolean> => false;

export const getUserPurchasedProducts = async (_userId: string): Promise<any[]> => [];
