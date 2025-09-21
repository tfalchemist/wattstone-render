import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { calc } from './calc';
import ejs from 'ejs';
import chromium from '@sparticuz/chromium-min';
import playwright from 'playwright-core';
import { sendEmail } from './mail';
import fs from 'fs';
import path from 'path';

const ddb = new DynamoDBClient({});
const s3 = new S3Client({});
const TABLE = process.env.JOBS_TABLE!;
const BUCKET = process.env.BUCKET!;
const CDN_LOGO = process.env.CDN_LOGO || 'https://cdn.shopify.com/s/files/.../Calculation_Logo.png';
const CSS_PDF = fs.readFileSync(path.join(__dirname,'../assets/pdf.css'),'utf8'); // nimm dein CSS rein

export const handler = async (event: SQSEvent) => {
  for (const rec of event.Records) {
    const { jobId, tenantId, payload } = JSON.parse(rec.body);
    try {
      await update(jobId, { status:'processing' });

      const out = calc(payload.inputs);
      const html = await ejs.renderFile(path.join(__dirname,'template.ejs'), {
        css: CSS_PDF,
        logoUrl: payload.branding?.logoUrl || CDN_LOGO,
        dateStr: new Date().toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric'}),
        stoneLabel: payload.inputs.stone,
        orientationLabel: payload.inputs.orientation==='S'?'Südausrichtung':'Ost-West',
        terrainLabel: ['','I – See/Küste','II – Offen/Land','III – Vorstadt','IV – Stadt/Kern'][payload.inputs.terrain],
        roofLabel: payload.inputs.roofType,
        area: payload.inputs.moduleH*payload.inputs.moduleW,
        moduleWeight: payload.inputs.moduleWeight,
        height: payload.inputs.height,
        windZone: payload.inputs.windZone,
        vb0: out.vb0, qp50: out.qp50, qpRef: out.qpRef,
        groups: out.groups, allNegative: out.allNegative, maxPositiveK: out.maxPositiveK,
        deflector: out.deflector, combBallast: out.combBallast,
        fmt: (n:number,d=1)=> Number(n).toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d})
      });

      const browser = await playwright.chromium.launch({
        args: chromium.args, executablePath: await chromium.executablePath(), headless: true
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin:{ top:'10mm', right:'10mm', bottom:'12mm', left:'10mm' }});
      await browser.close();

      const key = `tenants/${tenantId}/reports/${jobId}.pdf`;
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: pdf, ContentType:'application/pdf' }));

      await update(jobId, { status:'done', s3Key: key });

      // Mail
      if (payload.delivery?.email) {
        await sendEmail({
          to: payload.delivery.email,
          subject: 'Ihr Windsog/Haftreibung Bericht',
          text: 'Ihr Bericht steht bereit.',
          s3: { bucket: BUCKET, key },
          attach: payload.delivery.sendAttachment === true
        });
      }
    } catch (err:any) {
      await update(jobId, { status:'failed', error: String(err?.message || err) });
      console.error('WORKER ERROR', jobId, err);
    }
  }
};

async function update(jobId: string, patch: Record<string,any>){
  const now = new Date().toISOString();
  const exp = ['SET updatedAt = :u'];
  const vals: any = { ':u': { S: now } };
  for (const [k,v] of Object.entries(patch)) {
    exp.push(` ${k} = :${k}`);
    vals[`:${k}`] = typeof v === 'string' ? { S: v } : v?.S ? v : { S: String(v) };
  }
  await ddb.send(new UpdateItemCommand({
    TableName: TABLE, Key: { jobId: { S: jobId } },
    UpdateExpression: exp.join(','), ExpressionAttributeValues: vals
  }));
}
