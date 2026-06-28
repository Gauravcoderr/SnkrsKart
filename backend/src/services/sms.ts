export async function sendSMS(phone: string, message: string): Promise<void> {
  const deviceId = process.env.TEXTBEE_DEVICE_ID;
  const apiKey = process.env.TEXTBEE_API_KEY;

  if (!deviceId || !apiKey) {
    console.warn('[SMS] TEXTBEE_DEVICE_ID or TEXTBEE_API_KEY not set — skipping');
    return;
  }

  const normalized = phone.startsWith('+91') ? phone : `+91${phone.replace(/^0/, '')}`;

  const res = await fetch(
    `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/sendSMS`,
    {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receivers: [normalized], message }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('[SMS] textbee error:', err);
    throw new Error(`SMS failed: ${err}`);
  }
}
