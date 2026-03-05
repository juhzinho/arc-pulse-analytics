import { createTestApp } from "./helpers";

describe("markets routes", () => {
  it("requires auth for prediction", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/v1/markets/test-market/predict",
      payload: { choice: "YES" }
    });

    expect(response.statusCode).toBe(401);
  });
});
