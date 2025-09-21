// ssm.cjs
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ssm = new SSMClient({});

/** Holt einen SSM-Parameter. Wenn decrypt=true, auch SecureString entschlüsseln. */
async function getParam(name, { decrypt = false, defaultValue = undefined } = {}) {
  try {
    const out = await ssm.send(new GetParameterCommand({
      Name: name,
      WithDecryption: Boolean(decrypt),
    }));
    return out?.Parameter?.Value ?? defaultValue;
  } catch (err) {
    // z.B. NotFound -> default verwenden
    if (defaultValue !== undefined) return defaultValue;
    throw err;
  }
}

/** Liest unsere App-Config aus SSM unterhalb von process.env.PARAM_PATH_BASE */
async function loadConfig() {
  const base = process.env.PARAM_PATH_BASE || '/wattstone/dev';

  const [
    brevoDisabled,
    brevoKey,
    mailFromEmail,
    mailFromName,
    mailDeliveryMode,
    cdnLogo,
  ] = await Promise.all([
    getParam(`${base}/BREVO_DISABLED`, { defaultValue: 'true' }),
    getParam(`${base}/BREVO_KEY`,      { decrypt: true, defaultValue: '' }),
    getParam(`${base}/MAIL_FROM_EMAIL`,{ defaultValue: process.env.MAIL_FROM_EMAIL }),
    getParam(`${base}/MAIL_FROM_NAME`, { defaultValue: process.env.MAIL_FROM_NAME }),
    getParam(`${base}/MAIL_DELIVERY_MODE`, { defaultValue: process.env.MAIL_DELIVERY_MODE || 'attachment' }),
    getParam(`${base}/CDN_LOGO`,       { defaultValue: process.env.CDN_LOGO }),
  ]);

  return {
    STAGE: process.env.STAGE || 'dev',
    BREVO_DISABLED: brevoDisabled === 'true',
    BREVO_KEY: brevoKey || '',
    MAIL_FROM_EMAIL: mailFromEmail,
    MAIL_FROM_NAME: mailFromName,
    MAIL_DELIVERY_MODE: mailDeliveryMode,
    CDN_LOGO: cdnLogo,
  };
}

module.exports = { getParam, loadConfig };
