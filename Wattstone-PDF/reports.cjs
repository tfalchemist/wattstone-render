module.exports.handler = async (event) => {
  const body = (() => { try { return JSON.parse(event.body || '{}'); } catch { return {}; }})();
  console.log('reports payload', body);

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      received: body,
      hint: "Echo-Stub läuft – als Nächstes render integrieren."
    })
  };
};
