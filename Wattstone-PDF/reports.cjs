// Wattstone-PDF/reports.cjs
// Echo-Stub im CommonJS-Format (kein import, kein aws-sdk nötig)
module.exports.handler = async (event) => {
  let body = {};
  try {
    // HTTP API sendet den Body als String
    body = event && event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Invalid JSON body", detail: String(e) }),
    };
  }

  const env = process.env || {};
  const mail = {
    from: env.MAIL_FROM_EMAIL || "",
    delivery: env.MAIL_DELIVERY_MODE || "",
    brevoDisabled: (env.BREVO_DISABLED || "").toString(),
    brevoKeyPresent: !!(env.BREVO_KEY && env.BREVO_KEY.length > 0),
  };

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ok: true,
      note: "Echo-Stub (CJS) – Rendering/Mail folgt als Nächstes",
      stage: env.STAGE || "dev",
      mail,
      cdnLogo: env.CDN_LOGO || "",
      received: body,
    }),
  };
};
