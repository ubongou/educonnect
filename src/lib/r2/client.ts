import { S3Client } from "@aws-sdk/client-s3";

let cached: S3Client | null = null;

/**
 * Lazy R2 (S3-compatible) singleton. Returns null when the R2_* env vars
 * aren't set so local dev / preview deploys without the secrets can still
 * boot — callers must treat null as a configuration error.
 */
export function getR2Client(): S3Client | null {
  if (cached) return cached;
  // Trim every value — Vercel's env-var UI can preserve trailing newlines
  // or spaces when secrets are pasted in, and any whitespace on the secret
  // makes SigV4 silently produce wrong signatures (R2 returns
  // SignatureDoesNotMatch with no obvious diagnostic).
  const endpoint = process.env.R2_ENDPOINT?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  cached = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    // Virtual-hosted style works most reliably with R2 presigned PUTs.
    // Path-style works for direct server-side PutObject but observed to
    // 403 when the SDK presigns the URL.
    forcePathStyle: false,
    // AWS SDK v3.726+ adds a precomputed CRC32 checksum to PUT presigns.
    // R2 rejects the signature because the browser's actual body checksum
    // won't match the empty-body checksum signed at URL-generation time.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cached;
}

export function getR2Bucket(): string | null {
  return process.env.R2_BUCKET ?? null;
}
