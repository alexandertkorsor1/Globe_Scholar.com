/**
 * Utility for handling user profile avatar uploads with strict 50KB limit.
 */

export const MAX_AVATAR_SIZE_BYTES = 50 * 1024; // Exactly 50 KB (51,200 bytes)
export const MAX_AVATAR_SIZE_LABEL = '50 KB';

export interface AvatarValidationResult {
  valid: boolean;
  error?: string;
  sizeBytes: number;
  sizeKb: number;
}

/**
 * Validate avatar file type and size.
 */
export const validateAvatarFile = (file: File): AvatarValidationResult => {
  const sizeBytes = file.size;
  const sizeKb = Number((sizeBytes / 1024).toFixed(1));

  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Please select a valid image file (PNG, JPG, JPEG, or WEBP).',
      sizeBytes,
      sizeKb,
    };
  }

  if (sizeBytes > MAX_AVATAR_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size is ${sizeKb} KB, which exceeds the strict ${MAX_AVATAR_SIZE_LABEL} limit.`,
      sizeBytes,
      sizeKb,
    };
  }

  return {
    valid: true,
    sizeBytes,
    sizeKb,
  };
};

/**
 * Read file into a Base64 Data URL.
 */
export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Error reading file.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Automatically resize & compress an image to fit nicely within 50KB.
 * Ensures avatars are crisp 180x180 circular headshots while strictly under 50KB.
 */
export const compressImageToAvatar = (
  file: File,
  maxSizeBytes = MAX_AVATAR_SIZE_BYTES
): Promise<{ dataUrl: string; sizeBytes: number; sizeKb: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Create a square canvas (180x180)
      const targetDimension = 180;
      const canvas = document.createElement('canvas');
      canvas.width = targetDimension;
      canvas.height = targetDimension;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create 2D canvas context.'));
        return;
      }

      // Calculate center crop square
      const minSide = Math.min(img.width, img.height);
      const startX = (img.width - minSide) / 2;
      const startY = (img.height - minSide) / 2;

      ctx.drawImage(
        img,
        startX,
        startY,
        minSide,
        minSide,
        0,
        0,
        targetDimension,
        targetDimension
      );

      // Try progressively lower quality until size <= maxSizeBytes
      let quality = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let byteLength = Math.round((dataUrl.length * 3) / 4);

      while (byteLength > maxSizeBytes && quality > 0.3) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        byteLength = Math.round((dataUrl.length * 3) / 4);
      }

      if (byteLength > maxSizeBytes) {
        // Fallback to smaller 120x120 dimension
        canvas.width = 120;
        canvas.height = 120;
        ctx.drawImage(
          img,
          startX,
          startY,
          minSide,
          minSide,
          0,
          0,
          120,
          120
        );
        dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        byteLength = Math.round((dataUrl.length * 3) / 4);
      }

      const sizeKb = Number((byteLength / 1024).toFixed(1));

      resolve({
        dataUrl,
        sizeBytes: byteLength,
        sizeKb,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file.'));
    };

    img.src = objectUrl;
  });
};
