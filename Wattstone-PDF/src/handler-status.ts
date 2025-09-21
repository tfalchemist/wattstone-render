import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const ddb = new DynamoDBClient({});
const s3 = new S3Client({});
const TABLE = process.env.JOBS_TABLE!;
const BUCKET = process.env.BUCKET!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const jobId = event.pathParameters?.jobId!;
  const r = await ddb.send(new GetItemCommand({ TableName: TABLE, Key: { jobId:{ S:jobId }}}));
  if (!r.Item) return { statusCode:404, body:'Not found' };
  const status = r.Item.status.S!;
  const s3Key = r.Item.s3Key?.S;

  let downloadUrl;
  if (status==='done' && s3Key) {
    downloadUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }), { expiresIn: 3600 });
  }
  return { statusCode:200, body: JSON.stringify({ jobId, status, downloadUrl }) };
};
