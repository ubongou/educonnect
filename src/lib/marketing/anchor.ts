/** Stable fragment id for a section heading, for "On this page" links. */
export function headingAnchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
