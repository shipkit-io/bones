/**
 * Regression tests for the Redis-backed cache and metrics services.
 *
 * Both used `redis!` behind a `private readonly enabled = !!redis` flag. The
 * assertions are gone and each method now narrows the client itself, so these
 * pin the two behaviors that refactor had to preserve: every method is a safe
 * no-op when Redis is unconfigured, and every method still reaches the client
 * when it is configured.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const redisCalls: { method: string; args: unknown[] }[] = [];

const recorder = (method: string, result: unknown = null) =>
  vi.fn((...args: unknown[]) => {
    redisCalls.push({ method, args });
    return Promise.resolve(result);
  });

const makeFakeRedis = () => {
  const pipeline = {
    incrby: vi.fn(() => pipeline),
    zadd: vi.fn(() => pipeline),
    exec: recorder("pipeline.exec", []),
  };
  return {
    get: recorder("get"),
    set: recorder("set", "OK"),
    setex: recorder("setex", "OK"),
    del: recorder("del", 1),
    zadd: recorder("zadd", 1),
    zrange: recorder("zrange", []),
    zremrangebyscore: recorder("zremrangebyscore", 0),
    keys: recorder("keys", []),
    pipeline: () => pipeline,
    _pipeline: pipeline,
  };
};

describe("cache and metrics services without Redis configured", () => {
  beforeEach(() => {
    redisCalls.length = 0;
    vi.resetModules();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.doMock("@/server/services/redis-service", () => ({ redisClient: null }));
  });

  it("returns cache misses and swallows writes instead of throwing", async () => {
    const { cacheService } = await import("@/server/services/cache-service");

    await expect(cacheService.get("missing")).resolves.toBeNull();
    await expect(cacheService.set("key", { a: 1 })).resolves.toBeUndefined();
    await expect(cacheService.delete("key")).resolves.toBeUndefined();
    expect(redisCalls).toEqual([]);
  });

  it("computes the value exactly once through getOrSet with caching off", async () => {
    const { cacheService } = await import("@/server/services/cache-service");
    const factory = vi.fn(() => Promise.resolve("computed"));

    await expect(cacheService.getOrSet("key", factory)).resolves.toBe("computed");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("returns metric defaults rather than asserting a client", async () => {
    const { metricsService } = await import("@/server/services/metrics-service");

    await expect(metricsService.recordMetric("api.requests", 1)).resolves.toBeUndefined();
    await expect(metricsService.recordTiming("api.latency", Date.now())).resolves.toBeUndefined();
    await expect(metricsService.incrementCounter("api.errors")).resolves.toBeUndefined();
    await expect(metricsService.getMetrics("api.requests")).resolves.toEqual([]);
    await expect(metricsService.getCounter("api.errors")).resolves.toBe(0);
    await expect(metricsService.resetCounter("api.errors")).resolves.toBeUndefined();
    await expect(metricsService.cleanup()).resolves.toBeUndefined();
    expect(redisCalls).toEqual([]);
  });
});

describe("cache and metrics services with Redis configured", () => {
  beforeEach(() => {
    redisCalls.length = 0;
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("still reaches the client for every cache operation", async () => {
    const fake = makeFakeRedis();
    vi.doMock("@/server/services/redis-service", () => ({ redisClient: fake }));

    const { cacheService } = await import("@/server/services/cache-service");

    await cacheService.set("key", { a: 1 });
    await cacheService.set("key", { a: 1 }, { ttl: 60 });
    await cacheService.delete("key");
    await cacheService.get("key");

    expect(redisCalls.map((call) => call.method)).toEqual(["set", "setex", "del", "get"]);
    expect(redisCalls[0]?.args[0]).toBe("cache:key");
  });

  it("round-trips a cached value through get", async () => {
    const fake = makeFakeRedis();
    fake.get = vi.fn(() =>
      Promise.resolve(
        JSON.stringify({ data: { hello: "world" }, createdAt: 1, updatedAt: 1 })
      )
    );
    vi.doMock("@/server/services/redis-service", () => ({ redisClient: fake }));

    const { cacheService } = await import("@/server/services/cache-service");

    await expect(cacheService.get("key")).resolves.toEqual({ hello: "world" });
  });

  it("still reaches the client for every metrics operation", async () => {
    const fake = makeFakeRedis();
    /*
     * A function, not an arrow: metrics-service calls `new Redis(...)`, an
     * arrow cannot be constructed, and the module swallows that failure by
     * leaving the client null, which makes the test pass for the wrong reason.
     */
    vi.doMock("@upstash/redis", () => ({
      Redis: function RedisStub() {
        return fake;
      },
    }));
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    const { metricsService } = await import("@/server/services/metrics-service");

    await metricsService.recordMetric("api.requests", 1);
    await metricsService.incrementCounter("api.errors");
    await metricsService.getMetrics("api.requests");
    await metricsService.getCounter("api.errors");
    await metricsService.resetCounter("api.errors");
    await metricsService.cleanup();

    expect(redisCalls.map((call) => call.method)).toEqual([
      "zadd",
      "pipeline.exec",
      "zrange",
      "get",
      "del",
      "keys",
    ]);
    expect(redisCalls[0]?.args[0]).toBe("metrics:api.requests");
  });
});
