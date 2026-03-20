import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { Inquiry } from '../models/Inquiry';

const router = Router();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, productSlug, productName, productBrand, selectedSize, price } = req.body;

    if (!name || !email || !phone || !address || !productSlug) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Save to DB first
    await Inquiry.create({ name, email, phone, address, productSlug, productName, productBrand, selectedSize, price });

    // Respond immediately — don't block on email
    res.json({ success: true });

    const priceFormatted = `₹${Number(price).toLocaleString('en-IN')}`;
    const sizeText = selectedSize ? `UK ${selectedSize}` : 'Not specified';

    // Send emails in background
    transporter.sendMail({
      from: `"SNKRS CART" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `We received your interest — ${productName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
          <div style="background:#111;padding:24px 32px;">
            <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:0.1em;">SNKRS CART</h1>
          </div>
          <div style="padding:32px;">
            <p style="font-size:16px;margin-top:0;">Hi <strong>${name}</strong>,</p>
            <p style="color:#444;">Thank you for your interest! We've received your request and will reach out to you shortly to complete your purchase.</p>
            <div style="background:#f5f5f5;padding:20px;margin:24px 0;border-left:3px solid #111;">
              <p style="margin:0 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.1em;">Your Request</p>
              <p style="margin:4px 0;font-weight:bold;font-size:16px;">${productBrand} ${productName}</p>
              <p style="margin:4px 0;color:#555;">Size: ${sizeText}</p>
              <p style="margin:4px 0;color:#555;">Price: ${priceFormatted}</p>
              <p style="margin:8px 0 0;color:#555;">Delivery to: ${address}</p>
            </div>
            <p style="color:#444;">We'll contact you on <strong>${email}</strong> or <strong>${phone}</strong> within 24 hours to confirm your order.</p>
            <p style="color:#888;font-size:13px;margin-top:32px;">— The SNKRS CART Team<br>Pauri Garhwal, Uttarakhand</p>
          </div>
        </div>
      `,
    }).catch((err: unknown) => console.error('Customer email failed:', err));

    // Email to store
    transporter.sendMail({
      from: `"SNKRS CART" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `New Purchase Inquiry — ${productBrand} ${productName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;color:#111;">
          <h2 style="background:#111;color:#fff;padding:16px 24px;margin:0;">New Inquiry</h2>
          <div style="padding:24px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:8px 0;color:#666;width:130px;">Name</td><td style="padding:8px 0;font-weight:bold;">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;">Address</td><td style="padding:8px 0;">${address}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Product</td><td style="padding:8px 0;font-weight:bold;">${productBrand} ${productName}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Size</td><td style="padding:8px 0;">${sizeText}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Price</td><td style="padding:8px 0;">${priceFormatted}</td></tr>
            </table>
          </div>
        </div>
      `,
    }).catch((err: unknown) => console.error('Store email failed:', err));
  } catch (err) {
    console.error('Inquiry error:', err);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

export default router;
