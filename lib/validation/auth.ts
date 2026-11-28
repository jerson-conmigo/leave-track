import { z } from "zod";

/**
 * Account form input (TASK-024). Shared by the client forms and the server actions,
 * which always re-validate. 12–72 bytes: 72 bytes is bcrypt's input limit (the
 * provider would silently ignore the rest).
 */
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 72;

export const SetPasswordSchema = z
  .object({
    password: z
      .string({ error: "Enter a new password." })
      .min(PASSWORD_MIN, { error: `Use at least ${PASSWORD_MIN} characters.` })
      .refine((p) => new TextEncoder().encode(p).length <= PASSWORD_MAX, {
        error: `Use at most ${PASSWORD_MAX} characters.`,
      }),
    confirm: z.string({ error: "Repeat the new password." }),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    error: "The passwords don't match.",
  });

export const ForgotPasswordSchema = z.object({
  email: z.email({ error: "Enter your work email." }).max(320),
});
