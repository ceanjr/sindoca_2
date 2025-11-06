/**
 * Image compression utilities
 * FIXED: Ensures proper JPEG magic bytes
 */

/**
 * Compress image file to JPEG format with quality optimization
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum width (default 1920)
 * @param {number} maxHeight - Maximum height (default 1920)
 * @param {number} quality - JPEG quality 0-1 (default 0.85)
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImage(
  file,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false });

        // Fill with white background (important for JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG blob
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // ✅ CRITICAL: Verify it's a valid JPEG
            const arrayBuffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);

            // Check JPEG magic bytes (FF D8 FF)
            if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
              console.error('❌ Invalid JPEG magic bytes:', bytes.slice(0, 4));
              reject(new Error('Generated file is not a valid JPEG'));
              return;
            }

            console.log('✅ Valid JPEG magic bytes detected:', [
              bytes[0].toString(16),
              bytes[1].toString(16),
              bytes[2].toString(16),
            ]);

            // Create new file with .jpg extension
            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const newFileName = `${fileNameWithoutExt}.jpg`;

            const compressedFile = new File([blob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log('📦 Compressed file:', {
              name: compressedFile.name,
              type: compressedFile.type,
              size: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
              originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate if file is an image
 */
export function isImageFile(file) {
  return file && file.type.startsWith('image/');
}

/**
 * Get image dimensions without loading full image
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
