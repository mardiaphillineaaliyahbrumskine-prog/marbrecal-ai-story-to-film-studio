import type {ProjectReferenceImage, ReferenceImageCategory} from '../types/film';

export const ALLOWED_IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const MAX_RAW_FILE_BYTES = 15 * 1024 * 1024; // 15 MB raw phone photo limit
const MAX_DIMENSION = 1280;

export const REFERENCE_CATEGORIES: ReferenceImageCategory[] = [
  'Character Reference',
  'Location Reference',
  'Costume Reference',
  'Props Reference',
  'Scene Inspiration',
  'Cinematic Style Reference',
];

export function validateImageFile(file: File): string | null {
  const mime = (file.type || '').toLowerCase();
  const validMime = ALLOWED_MIME_TYPES.has(mime);
  const validExt = ALLOWED_EXTENSIONS.test(file.name);

  if (!validMime && !validExt) {
    return `"${file.name}" is not a supported format. Please choose JPG, JPEG, PNG, or WEBP images.`;
  }
  if (file.size === 0) {
    return `"${file.name}" appears to be empty.`;
  }
  if (file.size > MAX_RAW_FILE_BYTES) {
    return `"${file.name}" exceeds the 15 MB upload limit. Please select a smaller image.`;
  }
  return null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error(`Unable to read "${file.name}".`));
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}" from device.`));
    reader.readAsDataURL(file);
  });
}

function optimizeImageDataUrl(
  rawDataUrl: string,
  originalMime: string,
): Promise<{dataUrl: string; mimeType: string; sizeBytes: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const {naturalWidth: w, naturalHeight: h} = img;
      if (!w || !h) {
        reject(new Error('Image dimensions could not be decoded.'));
        return;
      }

      const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
      const targetW = Math.max(1, Math.round(w * scale));
      const targetH = Math.max(1, Math.round(h * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          dataUrl: rawDataUrl,
          mimeType: originalMime === 'image/jpg' ? 'image/jpeg' : originalMime || 'image/jpeg',
          sizeBytes: Math.round((rawDataUrl.length * 3) / 4),
        });
        return;
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);

      const outputMime =
        originalMime === 'image/png'
          ? 'image/png'
          : originalMime === 'image/webp'
            ? 'image/webp'
            : 'image/jpeg';

      // Use JPEG for oversized PNGs if needed to protect localStorage & API payload limits
      let dataUrl = canvas.toDataURL(outputMime, 0.84);
      let finalMime = outputMime;
      if (dataUrl.length > 900_000 && outputMime === 'image/png') {
        dataUrl = canvas.toDataURL('image/jpeg', 0.84);
        finalMime = 'image/jpeg';
      }

      const approxBytes = Math.round((dataUrl.length * 3) / 4);
      resolve({dataUrl, mimeType: finalMime, sizeBytes: approxBytes});
    };
    img.onerror = () => reject(new Error('Unable to process the selected image file.'));
    img.src = rawDataUrl;
  });
}

export async function processSelectedImageFiles(
  fileList: FileList | File[],
  defaultCategory: ReferenceImageCategory,
): Promise<{
  images: ProjectReferenceImage[];
  errors: string[];
}> {
  const files = Array.from(fileList);
  const images: ProjectReferenceImage[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const validationErr = validateImageFile(file);
    if (validationErr) {
      errors.push(validationErr);
      continue;
    }

    try {
      const rawDataUrl = await readFileAsDataUrl(file);
      const mimeGuess =
        file.type ||
        (file.name.toLowerCase().endsWith('.png')
          ? 'image/png'
          : file.name.toLowerCase().endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg');
      const optimized = await optimizeImageDataUrl(rawDataUrl, mimeGuess);

      const cleanName = file.name.replace(/\.[^.]+$/, '') || 'Visual Reference';
      images.push({
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        category: defaultCategory,
        mimeType: optimized.mimeType,
        dataUrl: optimized.dataUrl,
        sizeBytes: optimized.sizeBytes,
        notes: '',
        analysisStatus: 'idle',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Failed to process "${file.name}".`);
    }
  }

  return {images, errors};
}
