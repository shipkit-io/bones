// Stub. Install the @shipkit/lemonsqueezy registry item to replace this file.

import { logger } from "@/lib/logger";

const NOT_INSTALLED = "Lemon Squeezy is not installed; add @shipkit/lemonsqueezy";

export interface PaymentData {
  id: string;
  orderId: string;
  userEmail: string;
  userName: string | null;
  amount: number;
  status: "paid" | "refunded" | "pending";
  productName: string;
  purchaseDate: Date;
  isFreeProduct: boolean; // Distinguishes free products from discounted products
}

/*
 * Every export mirrors the installed module's signature and resolves to an
 * empty result. payment-service.ts only reaches this file when the
 * lemonsqueezy provider is registered, which needs the item.
 */
export const getOrdersByEmail = async (_email: string): Promise<PaymentData[]> => {
  logger.debug(NOT_INSTALLED);
  return [];
};

export const getAllOrders = async (): Promise<PaymentData[]> => {
  logger.debug(NOT_INSTALLED);
  return [];
};

export const getLemonSqueezyPaymentStatus = async (_userId: string): Promise<boolean> => {
  logger.debug(NOT_INSTALLED);
  return false;
};

export const fetchLemonSqueezyProducts = async (): Promise<unknown[]> => {
  logger.debug(NOT_INSTALLED);
  return [];
};

export const fetchLemonSqueezyVariants = async (): Promise<unknown[]> => {
  logger.debug(NOT_INSTALLED);
  return [];
};

export const fetchConfiguredLemonSqueezyProducts = async (): Promise<unknown[]> => {
  logger.debug(NOT_INSTALLED);
  return [];
};

export const hasUserPurchasedProduct = async (
  _userId: string,
  _variantId: string | number
): Promise<boolean> => {
  logger.debug(NOT_INSTALLED);
  return false;
};

export const hasUserActiveSubscription = async (_userId: string): Promise<boolean> => {
  logger.debug(NOT_INSTALLED);
  return false;
};

export const getUserPurchasedProducts = async (_userId: string): Promise<unknown[]> => {
  logger.debug(NOT_INSTALLED);
  return [];
};

export const getVariantIdForProduct = async (_productKey: string): Promise<string | null> => {
  logger.debug(NOT_INSTALLED);
  return null;
};

export const getConfiguredVariantIds = async (): Promise<string[]> => {
  logger.debug(NOT_INSTALLED);
  return [];
};

export const getProductKeyForVariant = async (_variantId: string): Promise<string | null> => {
  logger.debug(NOT_INSTALLED);
  return null;
};

export const hasUserPurchasedAnyConfiguredProduct = async (_userId: string): Promise<boolean> => {
  logger.debug(NOT_INSTALLED);
  return false;
};

export const getUserPurchasedConfiguredProducts = async (_userId: string): Promise<string[]> => {
  logger.debug(NOT_INSTALLED);
  return [];
};
