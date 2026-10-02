import { describe, it, expect } from "vitest";
import { createUserSchema } from "./user-admin.schema";

const validBody = {
  fullName: "Jane Doe",
  username: "janedoe",
  email: "jane@example.com",
  password: "supersecret",
  role: "admin",
};

describe("createUserSchema", () => {
  it("accepts a valid payload", () => {
    expect(createUserSchema.safeParse(validBody).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(
      createUserSchema.safeParse({ ...validBody, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      createUserSchema.safeParse({ ...validBody, password: "short" }).success,
    ).toBe(false);
  });
});
