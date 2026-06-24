// Apply the bucket CORS policy that lets the browser PUT directly to R2 from
// the app origin(s). Without this, presigned-PUT uploads fail with a generic
// "network error during upload" — the browser's preflight OPTIONS gets no
// Access-Control-Allow-Origin back and blocks the request.
//
// Run with:
//   set -a; source .env.local; set +a; node --experimental-strip-types scripts/r2-set-cors.ts
//
// Add any extra origins you upload from (e.g. a Vercel preview URL) to
// ALLOWED_ORIGINS below, then re-run. CORS changes take effect within seconds.

import {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";

const endpoint = process.env.R2_ENDPOINT!;
const bucket = process.env.R2_BUCKET!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

// Exact-match origins (scheme + host, apex and www are distinct to CORS).
const ALLOWED_ORIGINS = [
  "https://www.joinmasani.com",
  "https://joinmasani.com",
  "http://localhost:3000",
];

console.log(`endpoint: ${endpoint}`);
console.log(`bucket:   ${bucket}`);
console.log(`origins:  ${ALLOWED_ORIGINS.join(", ")}\n`);

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: false,
});

await client.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ALLOWED_ORIGINS,
          // PUT for uploads; GET/HEAD so presigned reads work cross-origin too.
          AllowedMethods: ["PUT", "GET", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);
console.log("✓ CORS policy applied. Current policy:\n");

const current = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
console.log(JSON.stringify(current.CORSRules, null, 2));
