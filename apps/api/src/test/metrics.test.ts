import { createTestApp } from "./helpers";

describe("metrics summary", () => {
  it("returns summary envelope", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "GET",
      url: "/v1/metrics/summary?window=24h"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty("data");
  });
});
