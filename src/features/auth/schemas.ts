import { z } from "zod";

// Messages are keys into the `validation` namespace of the message files; the
// form translates them. Limits mirror the API (docs/handoff.md §4).
export const emailSchema = z.string().trim().min(1, "required").max(254, "maxLength").email("isEmail");

export const passwordSchema = z.string().min(8, "passwordLength").max(128, "maxLength");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "required"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterValues = z.infer<typeof registerSchema>;
