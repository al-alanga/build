import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth-validation";

describe("registerSchema", () => {
  it("normalizes email and validates the minimum password length", () => {
    const result = registerSchema.safeParse({
      name: "  Ana M.  ", email: " ANA@EXAMPLE.CO.MZ ", password: "palavra-passe-segura",
      companyName: " Empresa de Obras ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ana@example.co.mz");
      expect(result.data.name).toBe("Ana M.");
      expect(result.data.companyName).toBe("Empresa de Obras");
    }
  });

  it("rejects short passwords and invalid email addresses", () => {
    expect(registerSchema.safeParse({
      name: "Ana", email: "ana@example.co.mz", password: "short", companyName: "Obras Lda",
    }).success).toBe(false);
    expect(registerSchema.safeParse({
      name: "Ana", email: "not-an-email", password: "palavra-passe-segura", companyName: "Obras Lda",
    }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("normalizes email before lookup", () => {
    expect(loginSchema.parse({ email: " USER@EXAMPLE.CO.MZ ", password: "x" }).email)
      .toBe("user@example.co.mz");
  });
});
