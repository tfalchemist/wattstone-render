// reports.cjs
const { getWattstone } = require('./ssm.cjs');
const { buildReportPdf } = require('./render.cjs');


exports.handler = async (event) => {
  const stage = process.env.STAGE || 'dev';
  const body = parse(event?.body);
  const calc = body?.calc || {};
  const customer = body?.customer || {};
  const meta = body?.meta || {};

  const [brevoDisabled, brevoKey, fromEmail, fromName, delivery, cdnLogo] =
    await Promise.all([
      pick('BREVO_DISABLED', stage, false),
      pick('BREVO_KEY', stage, true),
      pick('MAIL_FROM_EMAIL', stage, false),
      pick('MAIL_FROM_NAME', stage, false),
      pick('MAIL_DELIVERY_MODE', stage, false),
      pick('CDN_LOGO', stage, false),
    ]);

  // 1) PDF bauen
  const { bytes, filename, mime } = await buildReportPdf(calc, customer, { logoUrl: cdnLogo });

  // 2) Mail optional
  let mailResult = null;
  const disabled = toBool(brevoDisabled ?? 'true');
  const sendTo = customer?.email;
  const mode = (delivery || 'attachment').toLowerCase();

  if (!disabled && sendTo && brevoKey && brevoKey.length > 5) {
    const { sendBrevo } = require('./mail.cjs'); // <= klein + erst hier laden
    const subject = 'Ihr Wattstone-Berechnungsbericht';
    const html = `<p>Hallo,</p><p>anbei Ihr PDF-Bericht.</p><p>Viele Grüße<br/>Wattstone</p>`;
    const attachment = (mode === 'attachment')
      ? { name: filename, type: mime, content: Buffer.from(bytes).toString('base64') }
      : null;

    try {
      mailResult = await sendBrevo({
        apiKey: brevoKey,
        fromEmail: fromEmail || 'noreply@example.com',
        fromName: fromName || 'Wattstone Reports',
        toEmail: sendTo,
        subject, html, attachment,
      });
    } catch (err) {
      mailResult = { error: true, message: err.message, status: err.status || 0 };
    }
  }

  // 3) Response
  if (disabled || !sendTo) {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        note: 'PDF inline (Mail disabled oder kein Empfänger) – base64 im Feld data',
        stage, meta,
        pdf: { filename, mime },
        data: Buffer.from(bytes).toString('base64'),
      }),
      isBase64Encoded: false,
    };
  }

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      note: `Mail ${mode === 'attachment' ? 'mit Anhang' : 'ohne Anhang'} ausgelöst`,
      stage, meta,
      sent: !!mailResult && !mailResult.error,
      mailResult,
    }),
  };
};

function parse(s){ try{ return JSON.parse(s||'{}'); } catch { return {}; } }
function toBool(v){ return String(v).toLowerCase() === 'true'; }
async function pick(key, stage, decrypt){
  if (process.env[key]) return process.env[key];
  try { return await getWattstone(stage, key, { decrypt }); }
  catch { return undefined; }
}