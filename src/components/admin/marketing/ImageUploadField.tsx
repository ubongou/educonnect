"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadMarketingAsset } from "@/lib/actions/marketing";
import type { SectionId } from "@/lib/marketing/schemas";

/**
 * Per-field image picker. Holds the storage path in form state and shows
 * a preview of either:
 *   • the bundled `/public` fallback (when storagePath is empty), or
 *   • the freshly-uploaded asset (publicUrl from uploadMarketingAsset).
 *
 * The form parent controls the actual save — this component only stages
 * the new path until the user clicks "Save section".
 */
export function ImageUploadField({
  label,
  helpText,
  section,
  slot,
  storagePath,
  fallbackPreview,
  onChange,
}: {
  label: string;
  helpText?: string;
  section: SectionId;
  slot: string;
  storagePath: string;
  fallbackPreview: string;
  onChange: (storagePath: string, publicUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  // Resolve preview source: while a new file is being uploaded we use the
  // browser-side blob URL so the user sees their selection immediately.
  // After upload, the public storage URL becomes the preview. If neither,
  // fall back to the bundled /public asset.
  const previewSrc = pendingPreview ?? (storagePath ? null : fallbackPreview);

  function handlePick(file: File | null) {
    if (!file) return;
    setError(null);

    // Optimistic preview from a blob URL.
    const blobUrl = URL.createObjectURL(file);
    setPendingPreview(blobUrl);

    const fd = new FormData();
    fd.append("section", section);
    fd.append("slot", slot);
    fd.append("file", file);

    startTransition(async () => {
      const result = await uploadMarketingAsset(fd);
      if (!result.ok) {
        setError(result.error);
        URL.revokeObjectURL(blobUrl);
        setPendingPreview(null);
        return;
      }
      onChange(result.storagePath, result.publicUrl);
      // Keep the blob preview until the parent re-renders with the new
      // storagePath — at that point we can drop it.
    });
  }

  return (
    <div className="rounded-md border border-line bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-g600">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {storagePath && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setPendingPreview(null);
                onChange("", null);
              }}
              className="rounded-pill border border-navy/20 bg-white px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-navy hover:bg-paper"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="rounded-pill border border-navy bg-navy px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-yellow hover:bg-navy/90 disabled:opacity-50"
          >
            {pending ? "Uploading…" : storagePath ? "Replace" : "Upload"}
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
      />

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-line bg-paper">
        {previewSrc ? (
          // Use a plain <img> for blob URLs and remote storage previews —
          // next/image doesn't support blob: protocol and the storage URL
          // is already public + cached.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt={label}
            className="h-full w-full object-contain"
          />
        ) : storagePath ? (
          // Storage path is set but no pending blob — preview by direct
          // path through the public bucket. Use Next/Image so the host
          // is whitelisted via remotePatterns.
          <ImagePreviewByPath storagePath={storagePath} alt={label} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[12px] text-g400">
            No image
          </div>
        )}
      </div>

      {helpText && (
        <p className="mt-2 text-[11px] text-g600">{helpText}</p>
      )}
      <p className="mt-1 truncate font-mono text-[10px] text-g400">
        {storagePath ? `marketing-assets/${storagePath}` : "(using bundled default)"}
      </p>
      {error && (
        <p className="mt-2 text-[12px] font-semibold text-coral">{error}</p>
      )}
    </div>
  );
}

function ImagePreviewByPath({
  storagePath,
  alt,
}: {
  storagePath: string;
  alt: string;
}) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const url = base
    ? `${base}/storage/v1/object/public/marketing-assets/${storagePath.replace(/^\//, "")}`
    : "";
  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[12px] text-g400">
        Configure NEXT_PUBLIC_SUPABASE_URL to preview
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes="400px"
      className="object-contain"
      unoptimized
    />
  );
}
