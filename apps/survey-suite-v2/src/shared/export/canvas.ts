import { downloadContent } from './files';

export function cloneCanvasScaled(canvas: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const safeScale = Math.max(1, Math.min(4, scale));
  if (safeScale === 1) return canvas;
  const scaled = document.createElement('canvas');
  scaled.width = Math.max(1, Math.round(canvas.width * safeScale));
  scaled.height = Math.max(1, Math.round(canvas.height * safeScale));
  const ctx = scaled.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
  return scaled;
}

export function exportCanvasPNG(canvas: HTMLCanvasElement, filename: string, scale: number): void {
  const target = cloneCanvasScaled(canvas, scale);
  const url = target.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function exportCanvasSVG(canvas: HTMLCanvasElement, filename: string, scale: number): void {
  const target = cloneCanvasScaled(canvas, scale);
  const pngDataUrl = target.toDataURL('image/png');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${target.width}" height="${target.height}" viewBox="0 0 ${target.width} ${target.height}">
      <image href="${pngDataUrl}" width="${target.width}" height="${target.height}" />
    </svg>
  `.trim();
  downloadContent(svg, filename, 'image/svg+xml;charset=utf-8');
}

export function exportCanvasPDF(canvas: HTMLCanvasElement, filename: string, scale: number): void {
  const target = cloneCanvasScaled(canvas, scale);
  const pngDataUrl = target.toDataURL('image/png');
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
  if (!printWindow) return;
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          html, body { margin: 0; padding: 0; background: #ffffff; }
          body { display: grid; place-items: center; min-height: 100vh; }
          img { max-width: 100vw; max-height: 100vh; display: block; }
          @page { size: auto; margin: 12mm; }
        </style>
      </head>
      <body>
        <img src="${pngDataUrl}" alt="${filename}">
        <script>
          window.onload = () => {
            setTimeout(() => window.print(), 60);
          };
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
