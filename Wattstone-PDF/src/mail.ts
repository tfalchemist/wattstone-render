import fetch from 'node-fetch';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});
const BREVO_KEY = process.env.BREVO_KEY || '';
const BREVO_DISABLED = String(process.env.BREVO_DISABLED || 'false') === 'true';
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL || 'noreply@example.com';
const MAIL_FROM_NAME  = process.env.MAIL_FROM_NAME  || 'Wattstone Reports';
const MODE = (process.env.MAIL_DELIVERY_MODE || 'attachment').toLowerCase(); // attachment|link

export async function sendEmail(opts: {
  to: string; subject: string; text: string;
  s3?: { bucket: string; key: string };
}) {
  // Wenn Brevo deaktiviert → nichts senden, nur Log
  if (BREVO_DISABLED) {
    let signed: string|undefined;
    if (opts.s3) {
      signed = await getSignedUrl(s3, new GetObjectCommand({ Bucket: opts.s3.bucket, Key: opts.s3.key }), { expiresIn: 3600 });
    }
    console.log('[MAIL_DISABLED] would send to:', opts.to, 'link:', signed);
    return;
  }

  const payload: any = {
    sender: { email: MAIL_FROM_EMAIL, name: MAIL_FROM_NAME },
    to: [{ email: opts.to }],
    subject: opts.subject,
    htmlContent: `<p>${opts.text}</p>`,
  };

  if (opts.s3) {
    if (MODE === 'attachment') {
      const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: opts.s3.bucket, Key: opts.s3.key }), { expiresIn: 300 });
      const res = await fetch(url);
      const buf = Buffer.from(await res.arrayBuffer());
      payload.attachment = [{ name: 'Wattstone_Berechnung.pdf', content: buf.toString('base64') }];
    } else {
      const link = await getSignedUrl(s3, new GetObjectCommand({ Bucket: opts.s3.bucket, Key: opts.s3.key }), { expiresIn: 3600 });
      payload.htmlContent += `<p><a href="${link}">PDF herunterladen</a> (Link 60 min gültig)</p>`;
    }
  }

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method:'POST',
    headers:{ 'api-key': BREVO_KEY, 'content-type':'application/json' },
    body: JSON.stringify(payload)
  });
}
