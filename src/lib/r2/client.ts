import { S3Client } from "@aws-sdk/client-s3";

let cached: S3Client | null = null;

/**
 * Lazy R2 (S3-compatible) singleton. Returns null when the R2_* env vars
 * aren't set so local dev / preview deploys without the secrets can still
 * boot — callers must treat null as a configuration error.
 */
export function getR2Client(): S3Client | null {
  if (cached) return cached;
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  cached = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    // R2 quirk: SigV4 expects path-style URLs.
    forcePathStyle: true,
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
