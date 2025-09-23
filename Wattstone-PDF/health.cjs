const { getWattstone } = require('./ssm.cjs');

exports.handler = async () => {
  const stage = process.env.STAGE || 'dev';

  // ENV → SSM (nur zum Test: keine Fehler werfen, wenn fehlt)
  const brevoDisabled =
    process.env.BREVO_DISABLED ??
    (await safe(() => getWattstone(stage, 'BREVO_DISABLED'))) ??
    'true';

  const mailFrom =
    process.env.MAIL_FROM_EMAIL ??
    (await safe(() => getWattstone(stage, 'MAIL_FROM_EMAIL'))) ??
    '';

  return {
    ok: true,
    ts: new Date().toISOString(),
    stage,
    note: 'minimal health OK',
    env: { BREVO_DISABLED: brevoDisabled, MAIL_FROM_EMAIL: mailFrom },
  };
};

async function safe(fn) {
  try { return await fn(); } catch { return undefined; }
}