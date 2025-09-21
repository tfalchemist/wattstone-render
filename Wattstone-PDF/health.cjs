// health.cjs
module.exports.handler = async (event) => {
  console.log("health invoked", { env: process.env.STAGE, now: new Date().toISOString(), eventVersion: event?.version });
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      ok: true,
      ts: new Date().toISOString(),
      stage: process.env.STAGE || 'n/a',
      note: 'minimal health OK'
    })
  };
};
