export const handler = async () => {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      status: 'ok',
      ts: new Date().toISOString(),
      stage: process.env.STAGE || 'dev'
    })
  };
};
