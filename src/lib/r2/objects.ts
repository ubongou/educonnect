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
 * Presigned URL the browser PUTs raw bytes to. We deliberately do NOT pass
 * ContentType / ContentLength on the command: when those are present the
 * SDK signs them as required headers, and R2's strict header matching has
 * been observed to 403 on otherwise-valid PUTs (browser-set Content-Length
 * can't be overridden, and unsigned-payload PUTs vary subtly across
 * fetch/XHR). Server-side validation in the action is the authoritative
 * gate; the browser still sends Content-Type, R2 just doesn't validate it
 * against the signature.
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
  });
  return getSignedUrl(client, cmd, { expiresIn: input.ttlSeconds ?? 600 });
}

export type PresignGetOptions = {
  ttlSeconds?: number;
  /** Override the Content-Disposition header on the response. */
  contentDisposition?: string;
  /** Override the Content-Type header on the response (for inline rendering). */
  contentType?: string;
};

/**
 * Presigned GET URL with short TTL (default 60s). Caller resolves the
 * RLS-gated metadata first; this just turns the storage_key into a
 * temporary download URL the browser can redirect to. Pass
 * `contentDisposition` to force a particular display behaviour
 * (e.g. `attachment; filename="..."` to force download).
 */
export async function presignGet(
  key: string,
  options: PresignGetOptions = {},
): Promise<string> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  if (!client || !bucket) {
    throw new Error("R2 is not configured (missing R2_* env vars)");
  }
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: options.contentDisposition,
    ResponseContentType: options.contentType,
  });
  return getSignedUrl(client, cmd, { expiresIn: options.ttlSeconds ?? 60 });
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
