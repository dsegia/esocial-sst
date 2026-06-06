// @ts-nocheck
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET!

export async function uploadCertR2(empresaId: string, pfxBuffer: Buffer): Promise<string> {
  const path = `certificados/${empresaId}/cert.pfx`
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: path,
    Body: pfxBuffer,
    ContentType: 'application/x-pkcs12',
  }))
  return path
}

export async function downloadCertR2(path: string): Promise<Buffer> {
  const resp = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: path }))
  const chunks: Buffer[] = []
  for await (const chunk of resp.Body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
