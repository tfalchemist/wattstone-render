const { getWattstone } = require('./ssm.cjs');

exports.handler = async (event) => {
  const stage = process.env.STAGE || 'dev';
  const body = parse(event?.body);

  // Konfig mit Fallbacks: ENV → SSM → Defaults
  const [brevoDisabled, brevoKey, fromEmail, fromName, delivery, cdnLogo] =
    await Promise.all([
      pick('BREVO_DISABLED', stage, false),
      pick('BREVO_KEY', stage, true),
      pick('MAIL_FROM_EMAIL', stage, false),
      pick('MAIL_FROM_NAME', stage, false),
      pick('MAIL_DELIVERY_MODE', stage, false),
      pick('CDN_LOGO', stage, false),
    ]);

  return {
    ok: true,
    note: 'Echo-Stub (CJS) – Rendering/Mail folgt im nächsten Schritt',
    stage,
    mail: {
      from: fromEmail || '',
      fromName: fromName || '',
      delivery: delivery || 'attachment',
      brevoDisabled: toBool(brevoDisabled ?? 'true'),
      brevoKeyPresent: !!(brevoKey && brevoKey.length > 3),
    },
    cdnLogo: cdnLogo || '',
    received: body || {},
  };
};

function parse(s) { try { return JSON.parse(s || '{}'); } catch { return {}; } }
function toBool(v) { return String(v).toLowerCase() === 'true'; }

async function pick(key, stage, decrypt) {
  // 1) ENV
  if (process.env[key]) return process.env[key];
  // 2) SSM
  try { return await getWattstone(stage, key, { decrypt }); }
  catch { return undefined; }
}