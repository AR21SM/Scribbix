import { z } from "zod";

const EmailSchema = z.string().trim().toLowerCase().email().max(254);
const PasswordSchema = z
  .string()
  .min(8)
  .max(72)
  .refine((password) => new TextEncoder().encode(password).length <= 72, {
    message: "Password must be at most 72 bytes",
  });

export const CreateUserSchema = z
  .object({
    username: EmailSchema,
    password: PasswordSchema,
    name: z.string().trim().min(1).max(80),
  })
  .strict();

export const SigninSchema = z
  .object({
    username: EmailSchema,
    password: PasswordSchema,
  })
  .strict();

export const CreateRoomSchema = z
  .object({
    name: z.string().trim().min(3).max(64),
  })
  .strict();
