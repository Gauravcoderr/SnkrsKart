# SMS Integration Research — SNKRS CART (India)

## Context

Indian carriers (Jio, Airtel, Vi, BSNL) have NO public email-to-SMS gateways.
US-style textbelt/carrier-email approach does NOT work for India.

Stack: Express + TypeScript + MongoDB + nodemailer already installed.

---

## Option 1 — textbee.dev + Jio SIM (RECOMMENDED, 100% FREE)

**Repo:** https://github.com/vernu/textbee (~1.2k stars, TypeScript)
**Cost:** ₹119/month Jio plan = unlimited SMS, zero API fees

### Setup
1. Install textbee Android app on spare Android phone
2. Insert Jio SIM
3. Register at textbee.dev → get `DEVICE_ID` + `API_KEY`

### .env
```
TEXTBEE_API_KEY=your_key
TEXTBEE_DEVICE_ID=your_device_id
```

### backend/src/services/sms.ts
```typescript
export async function sendSMS(phone: string, message: string) {
  await fetch(
    `https://api.textbee.dev/api/v1/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/sendSMS`,
    {
      method: 'POST',
      headers: {
        'x-api-key': process.env.TEXTBEE_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receivers: [phone.startsWith('+91') ? phone : `+91${phone}`],
        message,
      }),
    }
  );
}
```

### Notes
- No carrier lookup needed — Jio sends to any Indian number
- Phone must stay online and connected
- Good for transactional + promotional

---

## Option 2 — WhatsApp via whatsapp-web.js (FREE, better India reach)

**Repo:** https://github.com/pedroslopez/whatsapp-web.js
**Cost:** Free forever
**India penetration:** ~95% — better reach than SMS

### Install
```bash
npm install whatsapp-web.js qrcode-terminal
```

### backend/src/services/whatsapp.ts
```typescript
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => qrcode.generate(qr, { small: true })); // scan once on first run
client.on('ready', () => console.log('WhatsApp client ready'));
client.initialize();

export async function sendWhatsApp(phone: string, message: string) {
  const chatId = `91${phone.replace(/^\+91/, '')}@c.us`;
  await client.sendMessage(chatId, message);
}
```

### Risk levels
| Use case | Risk |
|---|---|
| Order shipped notification | Low |
| Deal verification verdict | Low |
| OTP / transactional | Low |
| Bulk promotional blast (1k+ users) | High — number may get banned |

### Notes
- Unofficial reverse-engineered API — may break on WhatsApp updates
- Phone must stay online
- No DLT registration required
- Supports rich messages (images, bold, links)

---

## Option 3 — Fast2SMS (free starter credits, then paid)

**URL:** https://www.fast2sms.com
**Cost:** ~100 free credits on signup, then ~₹0.20/SMS

```typescript
await fetch('https://www.fast2sms.com/dev/bulkV2', {
  method: 'POST',
  headers: { authorization: process.env.FAST2SMS_API_KEY! },
  body: new URLSearchParams({
    route: 'q',
    message: 'Your order has shipped!',
    language: 'english',
    numbers: '9876543210',
  }),
});
```

---

## Carrier Lookup (if needed later)

Indian carriers don't expose HLR lookup for free. Options:
- **AbstractAPI** — 250 free lookups/month
- **Prefix-based lookup** — ~80% accurate (breaks after MNP porting)
- Not needed if using textbee (Jio sends to any carrier) or WhatsApp

---

## Recommendation

| Scale | Choice |
|---|---|
| Dev + early prod | textbee.dev + Jio SIM (free) |
| Order/deal notifications | whatsapp-web.js (free, higher reach) |
| Bulk promotional | Fast2SMS + DLT registration |

**DLT note:** TRAI mandates DLT registration for bulk/promotional SMS in India.
Transactional (order updates) has lighter requirements.
textbee and whatsapp-web.js bypass this for small scale.
