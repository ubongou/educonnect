// Generate a presigned PUT URL the same way the app does, then PUT to it
// from Node.js so we can see R2's actual response body (browsers strip
// cross-origin error bodies via CORS).
//
// Run with: set -a; source .env.local; set +a; node --experimental-strip-types scripts/r2-presign-smoke.ts

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.R2_ENDPOINT!;
const bucket = process.env.R2_BUCKET!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

console.log(`endpoint: ${endpoint}`);
console.log(`bucket:   ${bucket}`);

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: false,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const key = `smoke-presign/${Date.now()}.mp4`;
// 1.5MB binary body to mimic the failing browser upload.
const body = Buffer.alloc(1_570_024, "x");

const url = await getSignedUrl(
  client,
  new PutObjectCommand({ Bucket: bucket, Key: key }),
  { expiresIn: 600 },
);
console.log(`\nPresigned URL:\n${url}\n`);

const res = await fetch(url, {
  method: "PUT",
  body,
  headers: {
    "Content-Type": "video/mp4",
    Origin: "https://www.joinmasani.com",
    Referer: "https://www.joinmasani.com/",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
    "sec-ch-ua":
      '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
  },
});
console.log(`status: ${res.status} ${res.statusText}`);
const text = await res.text();
console.log(`body:   ${text || "(empty)"}`);
console.log("response headers:");
for (const [k, v] of res.headers) console.log(`  ${k}: ${v}`);

if (res.ok) console.log("\n✓ presign PUT works");
else console.log("\n✗ presign PUT failed");
