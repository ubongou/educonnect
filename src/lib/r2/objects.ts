import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Bucket, getR2Client } from "./client";

export type PresignPutInput = {
  key: string;
  contentType: string;
  contentLength: number;
  ttlSeconds?: number;
};

/**
 * Presigned URL the browser PUTs raw bytes to. The signed URL embeds the
 * Content-Type and Content-Length we expect — the browser MUST send those
 * exact headers or R2 rejects the upload.
 */
export async function presignPut(input: PresignPutInput): Promise<string> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  if (!client || !bucket) {
    throw new Error("R2 is not configured (missing R2_* env vars)");
  }
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });
  return getSignedUrl(client, cmd, { expiresIn: input.ttlSeconds ?? 600 });
}

/**
 * Presigned GET URL with short TTL (default 60s). Caller resolves the
 * RLS-gated metadata first; this just turns the storage_key into a
 * temporary download URL the browser can redirect to.
 */
export async function presignGet(
  key: string,
  ttlSeconds = 60,
): Promise<string> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  if (!client || !bucket) {
    throw new Error("R2 is not configured (missing R2_* env vars)");
  }
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, cmd, { expiresIn: ttlSeconds });
}

/**
 * Best-effort delete. Returns the underlying error if it occurs but does
 * not throw — callers should log and continue (the metadata row is the
 * source of truth).
 */
export async function deleteR2Object(
  key: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  if (!client || !bucket) return { ok: false, error: "R2 not configured" };
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
