import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET_NAME, publicObjectUrl } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const filename = body?.filename;
  const contentType = body?.contentType;

  if (typeof filename !== "string" || typeof contentType !== "string") {
    return NextResponse.json(
      { error: "filename and contentType are required" },
      { status: 400 }
    );
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${Date.now()}-${safeName}`;

  const uploadUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 5 }
  );

  return NextResponse.json({ uploadUrl, objectUrl: publicObjectUrl(key) });
}
