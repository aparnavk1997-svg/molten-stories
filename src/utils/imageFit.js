// Every product photo is shown at one ratio. Keep PHOTO_RATIO in sync with --photo-ratio in index.css.
export const PHOTO_RATIO = { w: 4, h: 5 };
export const PHOTO_OUT = { w: 720, h: 900 };
export const DEFAULT_FIT = { mode: 'fill', zoom: 1, x: 0.5, y: 0.5, bg: '#ffffff' };

const MAX_SOURCE_SIDE = 1600;

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Remote photos (Supabase Storage) must be CORS-clean or the canvas can't export them.
    if (/^https?:/.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file could not be read as an image.'));
    img.src = src;
  });
}

/** Read an uploaded file as a (downscaled) JPEG data URL, used as the source for fitting. */
export async function fileToSource(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_SOURCE_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Draw `img` into a W x H frame.
 * mode "fill": the photo covers the frame (edges are cropped).
 * mode "fit":  the whole photo is visible on a `bg` coloured frame.
 * zoom >= 1 scales further in; x / y (0..1) slide the photo within the frame.
 */
export function drawFit(ctx, img, W, H, { mode, zoom, x, y, bg }) {
  const base = (mode === 'fit' ? Math.min : Math.max)(W / img.width, H / img.height);
  const dw = img.width * base * zoom;
  const dh = img.height * base * zoom;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, (W - dw) * x, (H - dh) * y, dw, dh);
}

/** Render the fitted photo at storage size as a JPEG data URL. */
export function renderFit(img, opts = DEFAULT_FIT) {
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_OUT.w;
  canvas.height = PHOTO_OUT.h;
  drawFit(canvas.getContext('2d'), img, PHOTO_OUT.w, PHOTO_OUT.h, opts);
  return canvas.toDataURL('image/jpeg', 0.85);
}
