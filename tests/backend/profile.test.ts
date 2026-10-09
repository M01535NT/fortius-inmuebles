import { expect, test } from "vitest";
import { profileSchema } from "@/lib/backend/profile";
test("personal profile rejects privilege fields, remote URLs and oversized images", () => {
  expect(profileSchema.safeParse({ name: "Moisés Núñez", avatar: "", role: "admin" }).success).toBe(false);
  expect(profileSchema.safeParse({ name: "Moisés Núñez", avatar: "https://example.com/photo.jpg" }).success).toBe(false);
  expect(profileSchema.safeParse({ name: "Moisés Núñez", avatar: "data:image/svg+xml;base64,AAAA" }).success).toBe(false);
  expect(profileSchema.safeParse({ name: "Moisés Núñez", avatar: "x".repeat(100001) }).success).toBe(false);
  expect(profileSchema.parse({ name: " Moisés Núñez ", avatar: "" })).toEqual({ name: "Moisés Núñez", avatar: "" });
});
