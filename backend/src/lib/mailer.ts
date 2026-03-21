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
  return transporter
    .sendMail({ from: FROM, ...options })
    .catch((err: unknown) => console.error('Email send failed:', err));
}
