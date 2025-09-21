// reports.cjs
const { loadConfig } = require('./ssm.cjs');

module.exports.handler = async (event) => {
  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch {}

  const cfg = await loadConfig();

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      ok: true,
      hint: 'Echo-Stub läuft – SSM wird zur Laufzeit gelesen.',
      stage: cfg.STAGE,
      mail: {
        from: { email: cfg.MAIL_FROM_EMAIL, name: cfg.MAIL_FROM_NAME },
        delivery: cfg.MAIL_DELIVERY_MODE,
        brevoDisabled: cfg.BREVO_DISABLED,
        brevoKeyPresent: cfg.BREVO_KEY ? true : false
      },
      cdnLogo: cfg.CDN_LOGO,
      received: payload
    })
  };
};
