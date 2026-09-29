// Stub. Install the @shipkit/lemonsqueezy registry item to replace this file.

import { logger } from "@/lib/logger";
import { BasePaymentProvider } from "./base-provider";
import {
  type CheckoutOptions,
  type ImportStats,
  type OrderData,
  PaymentProviderError,
  type ProductData,
} from "./types";

const NOT_INSTALLED = "Lemon Squeezy is not installed; add @shipkit/lemonsqueezy";

/**
 * Placeholder provider. providers/index.ts only imports this file when
 * NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED is set, so it is never reached until the
 * lemonsqueezy item is installed. Every method throws so a misconfigured deployment
 * fails loudly instead of pretending payments work.
 */
export class LemonSqueezyProvider extends BasePaymentProvider {
  readonly name = "Lemon Squeezy";
  readonly id = "lemonsqueezy";

  protected validateConfig(): void {
    logger.debug(NOT_INSTALLED);
    this._isConfigured = false;
  }

  private notInstalled(): never {
    throw new PaymentProviderError(NOT_INSTALLED, this.id, "provider_not_installed");
  }

  async getPaymentStatus(_userId: string): Promise<boolean> {
    return this.notInstalled();
  }

  async hasUserPurchasedProduct(_userId: string, _productId: string): Promise<boolean> {
    return this.notInstalled();
  }

  async hasUserActiveSubscription(_userId: string): Promise<boolean> {
    return this.notInstalled();
  }

  async getUserPurchasedProducts(_userId: string): Promise<ProductData[]> {
    return this.notInstalled();
  }

  async getAllOrders(): Promise<OrderData[]> {
    return this.notInstalled();
  }

  async getOrdersByEmail(_email: string): Promise<OrderData[]> {
    return this.notInstalled();
  }

  async getOrderById(_orderId: string): Promise<OrderData | null> {
    return this.notInstalled();
  }

  async importPayments(): Promise<ImportStats> {
    return this.notInstalled();
  }

  async handleWebhookEvent(_event: unknown): Promise<void> {
    return this.notInstalled();
  }

  async createCheckoutUrl(_options: CheckoutOptions): Promise<string | null> {
    return this.notInstalled();
  }

  async listProducts(): Promise<ProductData[]> {
    return this.notInstalled();
  }
}

export const lemonSqueezyProvider = new LemonSqueezyProvider();
