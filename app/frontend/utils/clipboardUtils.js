/**
 * Clipboard Utilities
 * Helper functions for clipboard operations
 */

/**
 * Check if clipboard API is available
 */
export function isClipboardAvailable() {
  return !!(navigator.clipboard && window.isSecureContext);
}

/**
 * Check if clipboard read is permitted
 */
export async function hasClipboardReadPermission() {
  try {
    const permission = await navigator.permissions.query({ name: 'clipboard-read' });
    return permission.state === 'granted' || permission.state === 'prompt';
  } catch {
    return false;
  }
}

/**
 * Check if clipboard write is permitted
 */
export async function hasClipboardWritePermission() {
  try {
    const permission = await navigator.permissions.query({ name: 'clipboard-write' });
    return permission.state === 'granted' || permission.state === 'prompt';
  } catch {
    return true; // Most browsers allow write without permission
  }
}

/**
 * Copy text to clipboard (standalone function)
 */
export async function copyToClipboard(text) {
  if (!text) {
    throw new Error('コピーするテキストがありません');
  }

  // Modern API
  if (isClipboardAvailable()) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  // Fallback
  return execCommandCopy(text);
}

/**
 * Fallback copy using execCommand
 */
export function execCommandCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
  textarea.setAttribute('readonly', '');
  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('execCommand copy failed');
    }
    return true;
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Read text from clipboard (standalone function)
 */
export async function readFromClipboard() {
  if (!isClipboardAvailable()) {
    throw new Error('クリップボードAPIがサポートされていません');
  }

  return navigator.clipboard.readText();
}

/**
 * Copy image to clipboard
 */
export async function copyImageToClipboard(imageSource) {
  if (!isClipboardAvailable() || !navigator.clipboard.write) {
    throw new Error('画像のコピーがサポートされていません');
  }

  let blob;

  // If imageSource is a URL, fetch it
  if (typeof imageSource === 'string') {
    const response = await fetch(imageSource);
    blob = await response.blob();
  } else if (imageSource instanceof Blob) {
    blob = imageSource;
  } else if (imageSource instanceof HTMLCanvasElement) {
    blob = await new Promise((resolve) => {
      imageSource.toBlob(resolve, 'image/png');
    });
  } else if (imageSource instanceof HTMLImageElement) {
    // Draw image to canvas and get blob
    const canvas = document.createElement('canvas');
    canvas.width = imageSource.naturalWidth;
    canvas.height = imageSource.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageSource, 0, 0);
    blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
  } else {
    throw new Error('サポートされていない画像形式です');
  }

  const clipboardItem = new ClipboardItem({
    [blob.type]: blob
  });

  await navigator.clipboard.write([clipboardItem]);
  return true;
}

/**
 * Copy HTML to clipboard with plain text fallback
 */
export async function copyHtmlToClipboard(html, plainText) {
  if (!isClipboardAvailable() || !navigator.clipboard.write) {
    // Fallback to plain text
    return copyToClipboard(plainText || stripHtml(html));
  }

  const htmlBlob = new Blob([html], { type: 'text/html' });
  const textBlob = new Blob([plainText || stripHtml(html)], { type: 'text/plain' });

  const clipboardItem = new ClipboardItem({
    'text/html': htmlBlob,
    'text/plain': textBlob
  });

  await navigator.clipboard.write([clipboardItem]);
  return true;
}

/**
 * Strip HTML tags from string
 */
export function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Format text for clipboard (with line breaks)
 */
export function formatForClipboard(items, options = {}) {
  const {
    separator = '\n',
    prefix = '',
    suffix = '',
    transform = (item) => String(item)
  } = options;

  return prefix + items.map(transform).join(separator) + suffix;
}

/**
 * Format table data for clipboard (TSV format for Excel)
 */
export function formatTableForClipboard(headers, rows) {
  const headerRow = headers.join('\t');
  const dataRows = rows.map((row) =>
    row.map((cell) => {
      // Escape tabs and newlines
      const str = String(cell ?? '');
      return str.includes('\t') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join('\t')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Parse clipboard table data (TSV format)
 */
export function parseClipboardTable(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  return lines.map((line) => {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === '\t' && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current);
    return cells;
  });
}

/**
 * Format URL for clipboard with optional title
 */
export function formatUrlForClipboard(url, title) {
  if (title) {
    return `${title}\n${url}`;
  }
  return url;
}

/**
 * Format as markdown link
 */
export function formatAsMarkdownLink(url, title) {
  const safeTitle = (title || url).replace(/[[\]]/g, '\\$&');
  return `[${safeTitle}](${url})`;
}

/**
 * Extract URLs from clipboard text
 */
export function extractUrlsFromText(text) {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  return text.match(urlRegex) || [];
}

/**
 * Check if clipboard contains image
 */
export async function clipboardHasImage() {
  try {
    if (!isClipboardAvailable() || !navigator.clipboard.read) {
      return false;
    }

    const items = await navigator.clipboard.read();
    return items.some((item) =>
      item.types.some((type) => type.startsWith('image/'))
    );
  } catch {
    return false;
  }
}

/**
 * Read image from clipboard
 */
export async function readImageFromClipboard() {
  if (!isClipboardAvailable() || !navigator.clipboard.read) {
    throw new Error('クリップボードからの画像読み取りがサポートされていません');
  }

  const items = await navigator.clipboard.read();

  for (const item of items) {
    for (const type of item.types) {
      if (type.startsWith('image/')) {
        const blob = await item.getType(type);
        return {
          blob,
          type,
          url: URL.createObjectURL(blob)
        };
      }
    }
  }

  throw new Error('クリップボードに画像がありません');
}

/**
 * Create share data for Web Share API
 */
export function createShareData(options = {}) {
  const { title, text, url, files } = options;

  const shareData = {};

  if (title) shareData.title = title;
  if (text) shareData.text = text;
  if (url) shareData.url = url;
  if (files && navigator.canShare?.({ files })) {
    shareData.files = files;
  }

  return shareData;
}

/**
 * Check if sharing is supported
 */
export function canShare(data) {
  return !!(navigator.share && (!data || navigator.canShare?.(data)));
}

/**
 * Share content using Web Share API
 */
export async function shareContent(options) {
  const shareData = createShareData(options);

  if (!navigator.share) {
    throw new Error('共有機能がサポートされていません');
  }

  await navigator.share(shareData);
  return true;
}

export default {
  isClipboardAvailable,
  hasClipboardReadPermission,
  hasClipboardWritePermission,
  copyToClipboard,
  execCommandCopy,
  readFromClipboard,
  copyImageToClipboard,
  copyHtmlToClipboard,
  stripHtml,
  formatForClipboard,
  formatTableForClipboard,
  parseClipboardTable,
  formatUrlForClipboard,
  formatAsMarkdownLink,
  extractUrlsFromText,
  clipboardHasImage,
  readImageFromClipboard,
  createShareData,
  canShare,
  shareContent
};
