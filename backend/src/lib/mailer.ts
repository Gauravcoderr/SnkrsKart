import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const FROM = process.env.EMAIL_FROM || 'SNKRS CART <noreply@snkrscart.com>';

export function sendMail(options: { to: string; subject: string; html: string }) {
  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
    console.warn('Brevo credentials not set — email skipped');
    return Promise.resolve();
  }
  console.log(`[mailer] Sending email to ${options.to} | subject: ${options.subject}`);
  return transporter
    .sendMail({ from: FROM, ...options })
    .then((info) => console.log('[mailer] Email sent:', info.messageId))
    .catch((err: unknown) => console.error('[mailer] Email send failed:', JSON.stringify(err)));
}
