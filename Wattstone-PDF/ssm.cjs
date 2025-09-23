// CommonJS + AWS SDK v3
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const client = new SSMClient({}); // Region kommt aus Lambda-Env
const cache = new Map();

async function getParam(name, { decrypt = false } = {}) {
  const key = `${name}|${decrypt}`;
  if (cache.has(key)) return cache.get(key);

  const cmd = new GetParameterCommand({
    Name: name,
    WithDecryption: !!decrypt,
  });
  const resp = await client.send(cmd);
  const val = resp?.Parameter?.Value ?? '';
  cache.set(key, val);
  return val;
}

async function getWattstone(stage, key, { decrypt = false } = {}) {
  const path = `/wattstone/${stage}/${key}`;
  return getParam(path, { decrypt });
}

module.exports = { getParam, getWattstone };
