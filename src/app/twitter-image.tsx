import OpengraphImage from "./opengraph-image";

export const alt =
  "Masani: online tutoring from vetted Nigerian teachers for families in the UK, US and Canada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Same card as the Open Graph image, for X's summary_large_image. */
export default function TwitterImage() {
  return OpengraphImage();
}
