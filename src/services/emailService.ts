import {Resend}from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  name: string,
  verificationToken: string
): Promise<void> => {
  const verificationUrl =
    `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM as string,
    to: email,
    subject: "Verify your Aesthetics account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to Aesthetics, ${name}!</h2>

        <p>
          Thanks for creating your Aesthetics account.
        </p>

        <p>
          Please verify your email address by clicking the button below:
        </p>

        <a
          href="${verificationUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #111827;
            color: white;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Verify Email
        </a>

        <p style="margin-top: 20px;">
          This verification link will expire in 15 minutes.
        </p>

        <p>
          If you did not create this account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetUrl =
    `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM as string,
    to: email,
    subject: "Reset your Aesthetics password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Password Reset Request</h2>

        <p>Hello ${name},</p>

        <p>
          We received a request to reset your Aesthetics account password.
        </p>

        <p>
          Click the button below to create a new password:
        </p>

        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #111827;
            color: white;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Reset Password
        </a>

        <p style="margin-top: 20px;">
          This link will expire in 15 minutes.
        </p>

        <p>
          If you did not request a password reset, you can safely ignore this
          email.
        </p>
      </div>
    `,
  });
};