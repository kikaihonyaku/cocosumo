/**
 * File Upload Utilities
 * Validation, formatting, and helper functions for file uploads
 */

// Common MIME types by category
export const MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
};

// File extension to MIME type mapping
export const EXTENSION_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.zip': 'application/zip'
};

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Parse file size string to bytes
 */
export function parseFileSize(sizeStr) {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };

  return Math.round(value * multipliers[unit]);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : '';
}

/**
 * Get MIME type from file extension
 */
export function getMimeFromExtension(filename) {
  const ext = getFileExtension(filename);
  return EXTENSION_TO_MIME[ext] || 'application/octet-stream';
}

/**
 * Check if file type matches accept pattern
 */
export function matchesAccept(file, accept) {
  if (!accept || accept === '*/*') return true;

  const acceptPatterns = accept.split(',').map((p) => p.trim().toLowerCase());
  const fileType = file.type.toLowerCase();
  const fileExtension = getFileExtension(file.name);

  return acceptPatterns.some((pattern) => {
    // Extension pattern (e.g., .jpg, .pdf)
    if (pattern.startsWith('.')) {
      return fileExtension === pattern;
    }

    // Wildcard MIME type (e.g., image/*, video/*)
    if (pattern.endsWith('/*')) {
      const category = pattern.replace('/*', '/');
      return fileType.startsWith(category);
    }

    // Exact MIME type match
    return fileType === pattern;
  });
}

/**
 * Validate file against constraints
 */
export function validateFile(file, options = {}) {
  const {
    accept,
    maxSize,
    minSize,
    maxWidth,
    maxHeight,
    minWidth,
    minHeight
  } = options;

  const errors = [];

  // Check file exists
  if (!file) {
    return { valid: false, errors: ['ファイルが選択されていません'] };
  }

  // Check file type
  if (accept && !matchesAccept(file, accept)) {
    errors.push(`許可されていないファイル形式です: ${file.type || file.name}`);
  }

  // Check file size
  if (maxSize && file.size > maxSize) {
    errors.push(`ファイルサイズが大きすぎます (最大: ${formatFileSize(maxSize)})`);
  }

  if (minSize && file.size < minSize) {
    errors.push(`ファイルサイズが小さすぎます (最小: ${formatFileSize(minSize)})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    file: {
      name: file.name,
      size: file.size,
      type: file.type,
      formattedSize: formatFileSize(file.size),
      extension: getFileExtension(file.name)
    }
  };
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(file, options = {}) {
  const { maxWidth, maxHeight, minWidth, minHeight, aspectRatio } = options;

  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ valid: true, errors: [] });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const errors = [];

      if (maxWidth && img.width > maxWidth) {
        errors.push(`画像の幅が大きすぎます (最大: ${maxWidth}px)`);
      }

      if (maxHeight && img.height > maxHeight) {
        errors.push(`画像の高さが大きすぎます (最大: ${maxHeight}px)`);
      }

      if (minWidth && img.width < minWidth) {
        errors.push(`画像の幅が小さすぎます (最小: ${minWidth}px)`);
      }

      if (minHeight && img.height < minHeight) {
        errors.push(`画像の高さが小さすぎます (最小: ${minHeight}px)`);
      }

      if (aspectRatio) {
        const currentRatio = img.width / img.height;
        const targetRatio = aspectRatio;
        const tolerance = 0.01;

        if (Math.abs(currentRatio - targetRatio) > tolerance) {
          errors.push(`アスペクト比が不正です (${aspectRatio}:1 が必要)`);
        }
      }

      resolve({
        valid: errors.length === 0,
        errors,
        dimensions: { width: img.width, height: img.height }
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, errors: ['画像の読み込みに失敗しました'] });
    };

    img.src = objectUrl;
  });
}

/**
 * Create file preview URL
 */
export function createFilePreview(file) {
  if (!file) return null;

  // Image preview
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }

  // Video preview
  if (file.type.startsWith('video/')) {
    return URL.createObjectURL(file);
  }

  // No preview for other types
  return null;
}

/**
 * Get file icon based on type
 */
export function getFileIcon(file) {
  const type = file?.type || '';
  const ext = getFileExtension(file?.name || '');

  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf' || ext === '.pdf') return 'pdf';
  if (type.includes('word') || ['.doc', '.docx'].includes(ext)) return 'word';
  if (type.includes('excel') || type.includes('spreadsheet') || ['.xls', '.xlsx'].includes(ext)) return 'excel';
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'archive';
  if (type.startsWith('text/') || ['.txt', '.csv'].includes(ext)) return 'text';

  return 'file';
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName) {
  const ext = getFileExtension(originalName);
  const baseName = originalName.slice(0, originalName.length - ext.length);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${baseName}_${timestamp}_${random}${ext}`;
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename) {
  // Remove path traversal characters
  let sanitized = filename.replace(/[\/\\]/g, '_');

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, '_');

  // Limit length
  if (sanitized.length > 255) {
    const ext = getFileExtension(sanitized);
    const baseName = sanitized.slice(0, 255 - ext.length - 1);
    sanitized = baseName + ext;
  }

  return sanitized;
}

/**
 * Read file as data URL
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Read file as text
 */
export function readFileAsText(file, encoding = 'utf-8') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file, encoding);
  });
}

/**
 * Read file as ArrayBuffer
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Compress image using canvas
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    type = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type });
            resolve(compressedFile);
          } else {
            reject(new Error('画像の圧縮に失敗しました'));
          }
        },
        type,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('画像の読み込みに失敗しました'));
    };

    img.src = objectUrl;
  });
}

/**
 * Calculate file hash (SHA-256)
 */
export async function calculateFileHash(file) {
  const buffer = await readFileAsArrayBuffer(file);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check for duplicate files by hash
 */
export async function isDuplicateFile(file, existingHashes) {
  const hash = await calculateFileHash(file);
  return existingHashes.includes(hash);
}

export default {
  formatFileSize,
  parseFileSize,
  getFileExtension,
  getMimeFromExtension,
  matchesAccept,
  validateFile,
  validateImageDimensions,
  createFilePreview,
  getFileIcon,
  generateUniqueFilename,
  sanitizeFilename,
  readFileAsDataURL,
  readFileAsText,
  readFileAsArrayBuffer,
  compressImage,
  calculateFileHash,
  isDuplicateFile,
  MIME_TYPES,
  EXTENSION_TO_MIME
};
