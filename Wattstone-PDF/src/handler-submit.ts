import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { createReportSchema } from './schema';
import Ajv from 'ajv';
import crypto from 'crypto';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const ajv = new Ajv({ allErrors:true, strict:false });
const validate = ajv.compile(createReportSchema);
const ddb = new DynamoDBClient({});
const sqs = new SQSClient({});

const TABLE = process.env.JOBS_TABLE!;
const QUEUE_URL = process.env.QUEUE_URL!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  if (!apiKey) return { statusCode:401, body:'Missing API key' };
  const tenantId = `t_${apiKey.slice(0,8)}`; // simple mapping; produktiv: echtes Mapping

  const body = event.body ? JSON.parse(event.body) : {};
  if (!validate(body)) {
    return { statusCode:400, body: JSON.stringify({ errors: validate.errors }) };
  }
  const idem = event.headers['Idempotency-Key'] || crypto.randomUUID();
  const jobId = 'js_' + crypto.randomUUID();

  // Job anlegen
  await ddb.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      jobId: { S: jobId },
      tenantId: { S: tenantId },
      status: { S: 'queued' },
      createdAt: { S: new Date().toISOString() },
      updatedAt: { S: new Date().toISOString() },
      email: { S: body.delivery?.email || '' },
      idem: { S: String(idem) }
    }
  }));

  // in Queue
  await sqs.send(new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageGroupId: tenantId,
    MessageDeduplicationId: String(idem),
    MessageBody: JSON.stringify({ jobId, tenantId, payload: body })
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ jobId, status: 'queued' })
  };
};
