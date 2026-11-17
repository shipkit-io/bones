/**
 * LAC-5269: `payment-service` read `order.attributes` through `(order as any)`
 * and chained `first_order_item?.variant_name ?? variant_name`. The retype
 * moved that into `extractVariantName`; these pin its behaviour.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ safeDbExecute: vi.fn(), db: undefined }));
vi.mock("@/server/db/schema", () => ({ payments: {}, users: {} }));
vi.mock("@/server/providers", () => ({
  getEnabledProviders: vi.fn(() => []),
  getProvider: vi.fn(),
  hasProvider: vi.fn(),
  isProviderEnabled: vi.fn(),
}));

import { extractVariantName } from "@/server/services/payment-service";

describe("extractVariantName", () => {
  it("returns null when there are no attributes", () => {
    expect(extractVariantName(undefined)).toBeNull();
    expect(extractVariantName({})).toBeNull();
  });

  it("prefers the LemonSqueezy nested first_order_item name", () => {
    expect(
      extractVariantName({ first_order_item: { variant_name: "Pro" }, variant_name: "Other" })
    ).toBe("Pro");
  });

  it("falls back to the top-level variant_name", () => {
    expect(extractVariantName({ variant_name: "Team" })).toBe("Team");
    expect(extractVariantName({ first_order_item: {}, variant_name: "Team" })).toBe("Team");
  });

  it("ignores a non-string value instead of storing it as a name", () => {
    expect(extractVariantName({ variant_name: 42 })).toBeNull();
    expect(extractVariantName({ first_order_item: null, variant_name: { a: 1 } })).toBeNull();
  });
});
