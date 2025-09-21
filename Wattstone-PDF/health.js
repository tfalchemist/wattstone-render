// health.js
module.exports.handler = async () => {
  console.log('health handler invoked');
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      ts: new Date().toISOString(),
      stage: process.env.STAGE || 'dev',
      env: {
        BREVO_DISABLED: process.env.BREVO_DISABLED,
        MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL
      }
    })
  };
};
