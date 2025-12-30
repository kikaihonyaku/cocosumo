/**
 * File Upload Hook
 * Manages file upload state, progress, and queue
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { api } from '../services/api';
import { validateFile, createFilePreview, formatFileSize } from '../utils/fileUploadUtils';

// Upload states
export const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

/**
 * Single file upload hook
 */
export function useFileUpload(options = {}) {
  const {
    url,
    accept = '*/*',
    maxSize = 10 * 1024 * 1024, // 10MB
    onSuccess,
    onError,
    onProgress,
    headers = {},
    fieldName = 'file'
  } = options;

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(UPLOAD_STATUS.PENDING);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const abortControllerRef = useRef(null);

  // Validate and set file
  const selectFile = useCallback((selectedFile) => {
    const validation = validateFile(selectedFile, { accept, maxSize });

    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setFile(selectedFile);
    setStatus(UPLOAD_STATUS.PENDING);
    setProgress(0);
    setError(null);
    setResponse(null);

    return true;
  }, [accept, maxSize]);

  // Upload file
  const upload = useCallback(async (overrideFile = null) => {
    const fileToUpload = overrideFile || file;

    if (!fileToUpload) {
      setError('ファイルが選択されていません');
      return { success: false, error: 'No file selected' };
    }

    if (!url) {
      setError('アップロードURLが設定されていません');
      return { success: false, error: 'No upload URL' };
    }

    // Cancel previous upload
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setStatus(UPLOAD_STATUS.UPLOADING);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append(fieldName, fileToUpload);

    try {
      const result = await api.upload(url, formData, (percent) => {
        setProgress(percent);
        onProgress?.(percent);
      });

      setStatus(UPLOAD_STATUS.SUCCESS);
      setResponse(result.data);
      onSuccess?.(result.data, fileToUpload);

      return { success: true, data: result.data };
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        setStatus(UPLOAD_STATUS.CANCELLED);
        return { success: false, cancelled: true };
      }

      const errorMessage = err.response?.data?.error || err.message || 'アップロードに失敗しました';
      setStatus(UPLOAD_STATUS.ERROR);
      setError(errorMessage);
      onError?.(err, errorMessage);

      return { success: false, error: errorMessage };
    }
  }, [file, url, fieldName, onSuccess, onError, onProgress]);

  // Cancel upload
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus(UPLOAD_STATUS.CANCELLED);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setFile(null);
    setStatus(UPLOAD_STATUS.PENDING);
    setProgress(0);
    setError(null);
    setResponse(null);
  }, []);

  // Retry upload
  const retry = useCallback(() => {
    if (file) {
      return upload(file);
    }
    return Promise.resolve({ success: false, error: 'No file to retry' });
  }, [file, upload]);

  return {
    file,
    status,
    progress,
    error,
    response,
    selectFile,
    upload,
    cancel,
    reset,
    retry,
    isUploading: status === UPLOAD_STATUS.UPLOADING,
    isSuccess: status === UPLOAD_STATUS.SUCCESS,
    isError: status === UPLOAD_STATUS.ERROR
  };
}

/**
 * Multiple file upload hook with queue
 */
export function useMultiFileUpload(options = {}) {
  const {
    url,
    accept = '*/*',
    maxSize = 10 * 1024 * 1024,
    maxFiles = 10,
    concurrent = 3,
    onFileSuccess,
    onFileError,
    onAllComplete,
    fieldName = 'file'
  } = options;

  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadQueueRef = useRef([]);
  const activeUploadsRef = useRef(0);

  // Add files to queue
  const addFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles);
    const currentCount = files.length;
    const availableSlots = maxFiles - currentCount;

    if (availableSlots <= 0) {
      return { added: 0, rejected: fileArray.length, error: `最大${maxFiles}ファイルまでです` };
    }

    const filesToAdd = fileArray.slice(0, availableSlots);
    const rejected = fileArray.slice(availableSlots);

    const validatedFiles = filesToAdd.map((file, index) => {
      const validation = validateFile(file, { accept, maxSize });
      const id = `${Date.now()}-${currentCount + index}`;

      return {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: validation.valid ? UPLOAD_STATUS.PENDING : UPLOAD_STATUS.ERROR,
        progress: 0,
        error: validation.valid ? null : validation.errors.join(', '),
        response: null,
        preview: createFilePreview(file)
      };
    });

    setFiles((prev) => [...prev, ...validatedFiles]);

    return {
      added: validatedFiles.filter((f) => f.status !== UPLOAD_STATUS.ERROR).length,
      rejected: rejected.length + validatedFiles.filter((f) => f.status === UPLOAD_STATUS.ERROR).length
    };
  }, [files.length, maxFiles, accept, maxSize]);

  // Remove file from queue
  const removeFile = useCallback((fileId) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  // Update file state
  const updateFile = useCallback((fileId, updates) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, ...updates } : f))
    );
  }, []);

  // Upload single file
  const uploadFile = useCallback(async (fileItem) => {
    updateFile(fileItem.id, { status: UPLOAD_STATUS.UPLOADING, progress: 0 });

    const formData = new FormData();
    formData.append(fieldName, fileItem.file);

    try {
      const result = await api.upload(url, formData, (percent) => {
        updateFile(fileItem.id, { progress: percent });
      });

      updateFile(fileItem.id, {
        status: UPLOAD_STATUS.SUCCESS,
        progress: 100,
        response: result.data
      });

      onFileSuccess?.(result.data, fileItem);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'アップロードに失敗しました';

      updateFile(fileItem.id, {
        status: UPLOAD_STATUS.ERROR,
        error: errorMessage
      });

      onFileError?.(err, fileItem);
      return { success: false };
    }
  }, [url, fieldName, updateFile, onFileSuccess, onFileError]);

  // Process upload queue
  const processQueue = useCallback(async () => {
    while (uploadQueueRef.current.length > 0 && activeUploadsRef.current < concurrent) {
      const fileItem = uploadQueueRef.current.shift();
      if (fileItem && fileItem.status === UPLOAD_STATUS.PENDING) {
        activeUploadsRef.current++;
        uploadFile(fileItem).finally(() => {
          activeUploadsRef.current--;
          processQueue();
        });
      }
    }

    // Check if all uploads complete
    if (uploadQueueRef.current.length === 0 && activeUploadsRef.current === 0) {
      setIsUploading(false);
      const results = files.filter((f) => f.status === UPLOAD_STATUS.SUCCESS || f.status === UPLOAD_STATUS.ERROR);
      if (results.length > 0) {
        onAllComplete?.(results);
      }
    }
  }, [concurrent, uploadFile, files, onAllComplete]);

  // Start upload all pending files
  const uploadAll = useCallback(() => {
    const pendingFiles = files.filter((f) => f.status === UPLOAD_STATUS.PENDING);

    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    uploadQueueRef.current = [...pendingFiles];
    processQueue();
  }, [files, processQueue]);

  // Retry failed uploads
  const retryFailed = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === UPLOAD_STATUS.ERROR
          ? { ...f, status: UPLOAD_STATUS.PENDING, error: null, progress: 0 }
          : f
      )
    );

    setTimeout(uploadAll, 0);
  }, [uploadAll]);

  // Clear all files
  const clearAll = useCallback(() => {
    files.forEach((f) => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setFiles([]);
    uploadQueueRef.current = [];
  }, [files]);

  // Clear completed
  const clearCompleted = useCallback(() => {
    setFiles((prev) => {
      prev.filter((f) => f.status === UPLOAD_STATUS.SUCCESS).forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      return prev.filter((f) => f.status !== UPLOAD_STATUS.SUCCESS);
    });
  }, []);

  // Computed values
  const stats = useMemo(() => {
    const total = files.length;
    const pending = files.filter((f) => f.status === UPLOAD_STATUS.PENDING).length;
    const uploading = files.filter((f) => f.status === UPLOAD_STATUS.UPLOADING).length;
    const success = files.filter((f) => f.status === UPLOAD_STATUS.SUCCESS).length;
    const error = files.filter((f) => f.status === UPLOAD_STATUS.ERROR).length;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const uploadedSize = files
      .filter((f) => f.status === UPLOAD_STATUS.SUCCESS)
      .reduce((sum, f) => sum + f.size, 0);

    return {
      total,
      pending,
      uploading,
      success,
      error,
      totalSize,
      uploadedSize,
      formattedTotalSize: formatFileSize(totalSize),
      formattedUploadedSize: formatFileSize(uploadedSize),
      overallProgress: total > 0 ? Math.round((success / total) * 100) : 0
    };
  }, [files]);

  return {
    files,
    stats,
    isUploading,
    addFiles,
    removeFile,
    uploadAll,
    retryFailed,
    clearAll,
    clearCompleted,
    hasFiles: files.length > 0,
    hasPending: stats.pending > 0,
    hasErrors: stats.error > 0
  };
}

/**
 * Image upload with preview hook
 */
export function useImageUpload(options = {}) {
  const {
    accept = 'image/*',
    maxSize = 5 * 1024 * 1024,
    maxWidth,
    maxHeight,
    ...restOptions
  } = options;

  const [preview, setPreview] = useState(null);
  const [dimensions, setDimensions] = useState(null);

  const baseUpload = useFileUpload({
    accept,
    maxSize,
    ...restOptions
  });

  // Override selectFile to add image preview
  const selectFile = useCallback((file) => {
    // Clear previous preview
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const result = baseUpload.selectFile(file);

    if (result && file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height });

        // Validate dimensions if limits specified
        if (maxWidth && img.width > maxWidth) {
          baseUpload.reset();
          setPreview(null);
        }
        if (maxHeight && img.height > maxHeight) {
          baseUpload.reset();
          setPreview(null);
        }
      };
      img.src = objectUrl;
    }

    return result;
  }, [baseUpload, preview, maxWidth, maxHeight]);

  // Override reset to clear preview
  const reset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setDimensions(null);
    baseUpload.reset();
  }, [baseUpload, preview]);

  return {
    ...baseUpload,
    selectFile,
    reset,
    preview,
    dimensions
  };
}

export default {
  useFileUpload,
  useMultiFileUpload,
  useImageUpload,
  UPLOAD_STATUS
};
