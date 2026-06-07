import nodemailer from 'nodemailer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY,
    },
  });
}

export async function sendInviteEmail({
  to,
  workspaceName,
  inviterName,
  role,
  workspaceId,
}: {
  to: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  workspaceId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[EMAIL] RESEND_API_KEY is not set');
    return { skipped: true, reason: 'No API key' };
  }

  const fromEmail = process.env.EMAIL_FROM || 'Clientora <onboarding@resend.dev>';
  const workspaceUrl = `${APP_URL}/workspace/${workspaceId}`;

  console.log(`[EMAIL] Sending invite via SMTP to: ${to} from: ${fromEmail}`);

  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject: `You've been invited to "${workspaceName}" on Clientora`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: 600; color: #1A3D2B; margin: 0;">Clientora</h1>
          </div>

          <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 32px;">
            <h2 style="font-size: 18px; font-weight: 600; color: #1A3D2B; margin: 0 0 16px;">
              You've been invited to a workspace
            </h2>

            <p style="font-size: 14px; color: #5A5A5A; line-height: 1.6; margin: 0 0 24px;">
              <strong style="color: #1A3D2B;">${inviterName}</strong> has invited you to join
              <strong style="color: #1A3D2B;"> "${workspaceName}"</strong> as a
              <span style="background: #D4F0E2; padding: 2px 8px; border-radius: 4px; font-weight: 500; color: #1A3D2B;">${role}</span>.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${workspaceUrl}" style="display: inline-block; background: #1A6B45; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                Open Workspace
              </a>
            </div>

            <p style="font-size: 12px; color: #9A9A9A; line-height: 1.5; margin: 0;">
              Or copy this link: <a href="${workspaceUrl}" style="color: #1A6B45;">${workspaceUrl}</a>
            </p>
          </div>

          <p style="font-size: 11px; color: #9A9A9A; text-align: center; margin: 24px 0 0;">
            This invitation was sent via Clientora. If you didn't expect this, you can safely ignore it.
          </p>
        </div>
      `,
    });

    console.log('[EMAIL] Sent successfully:', info.messageId);
    return { success: true, id: info.messageId };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error('[EMAIL] Failed to send:', msg);
    return { error: msg };
  }
}
