/**
 * XHR-based PUT so we get real upload-progress events (`fetch` can't report
 * upload progress without ReadableStream upload support, which is spotty on
 * mobile browsers).
 *
 * R2 enforces strict Content-Type equality with the value the URL was
 * presigned with — `file.type` is what the server passed to `presignPut`, so
 * we MUST send the same value here.
 */
export function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve({ ok: true });
      else resolve({ ok: false, error: `Upload failed with status ${xhr.status}` });
    };
    xhr.onerror = () =>
      resolve({ ok: false, error: "Network error during upload" });
    xhr.onabort = () => resolve({ ok: false, error: "Upload aborted" });
    xhr.send(file);
  });
}
