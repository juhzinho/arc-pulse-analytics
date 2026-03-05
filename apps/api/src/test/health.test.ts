import { createTestApp } from "./helpers";

describe("health route", () => {
  it("returns ok envelope", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "GET",
      url: "/v1/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty("data.status", "ok");
  });
});
