// Browser helper: fetch a same-origin file as a blob and trigger a download.
// Routing the request through fetch lets the preview environment work (direct
// <a download> links require auth that the preview can't supply).
export async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
