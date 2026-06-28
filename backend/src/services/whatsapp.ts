import { Client, LocalAuth } from 'whatsapp-web.js';

let client: Client | null = null;
let ready = false;
let pairingCode: string | null = null;

export function getPairingCode() { return pairingCode; }

export function initWhatsApp(): void {
  if (client) return;

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    webVersionCache: { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wwebjs/wwebjs-wa-version/main/wa-version.json' },
  });

  client.on('ready', () => {
    ready = true;
    pairingCode = null;
    console.log('[WhatsApp] Client ready ✅');
  });

  client.on('disconnected', () => {
    ready = false;
    console.warn('[WhatsApp] Disconnected');
  });

  client.initialize().then(async () => {
    // After init, if not yet authenticated, request pairing code
    if (!ready) {
      const phone = process.env.WHATSAPP_PHONE;
      if (!phone) {
        console.warn('[WhatsApp] Set WHATSAPP_PHONE=91XXXXXXXXXX in .env to use pairing code');
        return;
      }
      try {
        pairingCode = await (client as any).requestPairingCode(phone);
        console.log(`[WhatsApp] Pairing code for ${phone}: ${pairingCode}`);
        console.log('[WhatsApp] Enter this code in WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number');
      } catch (e) {
        console.error('[WhatsApp] Failed to get pairing code:', e);
      }
    }
  }).catch((e) => console.error('[WhatsApp] Init error:', e));
}

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!client || !ready) {
    console.warn('[WhatsApp] Client not ready — skipping');
    return;
  }
  const digits = phone.replace(/^\+/, '').replace(/^91/, '').replace(/^0/, '');
  const chatId = `91${digits}@c.us`;
  try {
    await client.sendMessage(chatId, message);
    console.log('[WhatsApp] Sent to', chatId);
  } catch (err) {
    console.error('[WhatsApp] sendMessage failed:', chatId, err);
    throw err;
  }
}
