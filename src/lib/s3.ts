import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
  },
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME as string;

export function publicObjectUrl(key: string): string {
  const base = (process.env.S3_PUBLIC_URL_BASE as string).replace(/\/$/, "");
  return `${base}/${key}`;
}
