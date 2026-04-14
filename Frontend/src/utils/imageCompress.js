const MAX_SIZE_KB = 200;
// Data URL length (chars) to stay under 200KB when stored/sent
const MAX_DATA_URL_LENGTH = MAX_SIZE_KB * 1024;

/**
 * Compress image file to under 200KB, return as data URL (base64).
 * @param {File} file
 * @returns {Promise<string>} data URL
 */
export function compressImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 800;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      const tryLower = () => {
        if (dataUrl.length <= MAX_DATA_URL_LENGTH || quality <= 0.1) {
          resolve(dataUrl);
          return;
        }
        quality -= 0.15;
        if (quality < 0.1) quality = 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        tryLower();
      };
      tryLower();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}
