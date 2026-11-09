import { z } from "zod";

// Describes what a valid REGISTER request body looks like.
// Anything not listed here (like "isAdmin": true) is silently removed by Zod.
export const registerSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters").max(72), // bcrypt ignores bytes past 72
    role: z.enum(["donor", "ngo"], { message: "Role must be 'donor' or 'ngo'" }),
    organization: z.string().trim().max(120).optional(),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});
