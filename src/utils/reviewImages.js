import { supabase } from '../lib/supabase';

export const MAX_REVIEW_PHOTOS = 3;
const MAX_SIDE = 1200;

/** Shrinks a photo to a JPEG (so phone photos upload quickly), uploads it, and returns its public URL. */
export async function uploadReviewPhoto(file) {
  const blob = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process that photo.'))), 'image/jpeg', 0.8);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as a photo.'));
    };
    img.src = url;
  });
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('review-images').upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
  });
  if (error) throw new Error('The photo could not be uploaded. Please try again.');
  return supabase.storage.from('review-images').getPublicUrl(path).data.publicUrl;
}
