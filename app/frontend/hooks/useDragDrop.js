/**
 * Drag & Drop Hook
 * Provides drag and drop functionality for files and elements
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * File drop zone hook
 * @param {object} options - Drop zone options
 * @returns {object} Drop zone state and handlers
 */
export function useDropZone(options = {}) {
  const {
    accept = '*/*',
    multiple = true,
    maxFiles = 10,
    maxSize = 10 * 1024 * 1024, // 10MB default
    onDrop,
    onDropAccepted,
    onDropRejected,
    onDragEnter,
    onDragLeave,
    disabled = false
  } = options;

  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const dropZoneRef = useRef(null);

  // Parse accept string to array of MIME types
  const acceptedTypes = accept.split(',').map((type) => type.trim().toLowerCase());

  // Check if file type is accepted
  const isAcceptedType = useCallback((file) => {
    if (accept === '*/*') return true;

    const fileType = file.type.toLowerCase();
    const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;

    return acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return fileExtension === type;
      }
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', '/'));
      }
      return fileType === type;
    });
  }, [accept, acceptedTypes]);

  // Validate file
  const validateFile = useCallback((file) => {
    const errors = [];

    if (!isAcceptedType(file)) {
      errors.push({
        code: 'file-invalid-type',
        message: `ファイル形式が許可されていません: ${file.type || file.name}`
      });
    }

    if (file.size > maxSize) {
      errors.push({
        code: 'file-too-large',
        message: `ファイルサイズが大きすぎます: ${(file.size / 1024 / 1024).toFixed(2)}MB (最大: ${maxSize / 1024 / 1024}MB)`
      });
    }

    return errors;
  }, [isAcceptedType, maxSize]);

  // Process dropped files
  const processFiles = useCallback((fileList) => {
    const files = Array.from(fileList);
    const acceptedFiles = [];
    const rejectedFiles = [];

    // Limit number of files
    const filesToProcess = multiple ? files.slice(0, maxFiles) : [files[0]].filter(Boolean);

    filesToProcess.forEach((file) => {
      const errors = validateFile(file);
      if (errors.length === 0) {
        acceptedFiles.push(file);
      } else {
        rejectedFiles.push({ file, errors });
      }
    });

    // Notify rejected files over limit
    if (files.length > maxFiles) {
      const overLimit = files.slice(maxFiles);
      overLimit.forEach((file) => {
        rejectedFiles.push({
          file,
          errors: [{ code: 'too-many-files', message: `最大${maxFiles}ファイルまでです` }]
        });
      });
    }

    return { acceptedFiles, rejectedFiles };
  }, [multiple, maxFiles, validateFile]);

  // Handle drag enter
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setDragCounter((prev) => prev + 1);
    setIsDragOver(true);
    onDragEnter?.(e);
  }, [disabled, onDragEnter]);

  // Handle drag leave
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
        onDragLeave?.(e);
      }
      return newCounter;
    });
  }, [disabled, onDragLeave]);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    e.dataTransfer.dropEffect = 'copy';
  }, [disabled]);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragOver(false);
    setDragCounter(0);

    if (disabled) return;

    const { files } = e.dataTransfer;
    if (!files || files.length === 0) return;

    const { acceptedFiles, rejectedFiles } = processFiles(files);

    onDrop?.(acceptedFiles, rejectedFiles, e);

    if (acceptedFiles.length > 0) {
      onDropAccepted?.(acceptedFiles, e);
    }

    if (rejectedFiles.length > 0) {
      onDropRejected?.(rejectedFiles, e);
    }
  }, [disabled, processFiles, onDrop, onDropAccepted, onDropRejected]);

  // Open file dialog
  const openFileDialog = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.accept = accept;

    input.onchange = (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const { acceptedFiles, rejectedFiles } = processFiles(files);

        onDrop?.(acceptedFiles, rejectedFiles);

        if (acceptedFiles.length > 0) {
          onDropAccepted?.(acceptedFiles);
        }

        if (rejectedFiles.length > 0) {
          onDropRejected?.(rejectedFiles);
        }
      }
    };

    input.click();
  }, [multiple, accept, processFiles, onDrop, onDropAccepted, onDropRejected]);

  // Get root props
  const getRootProps = useCallback(() => ({
    ref: dropZoneRef,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onClick: openFileDialog,
    role: 'button',
    tabIndex: 0,
    'aria-label': 'ファイルをドロップまたはクリックして選択'
  }), [handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog]);

  // Get input props (for hidden file input)
  const getInputProps = useCallback(() => ({
    type: 'file',
    multiple,
    accept,
    style: { display: 'none' },
    onChange: (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const { acceptedFiles, rejectedFiles } = processFiles(files);
        onDrop?.(acceptedFiles, rejectedFiles);
      }
    }
  }), [multiple, accept, processFiles, onDrop]);

  return {
    isDragOver,
    getRootProps,
    getInputProps,
    openFileDialog,
    dropZoneRef
  };
}

/**
 * Sortable list hook (drag to reorder)
 * @param {array} items - Array of items to sort
 * @param {object} options - Sort options
 * @returns {object} Sort state and handlers
 */
export function useSortable(items, options = {}) {
  const {
    onReorder,
    idKey = 'id'
  } = options;

  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const draggedItemRef = useRef(null);

  // Get item index by id
  const getIndex = useCallback((id) => {
    return items.findIndex((item) =>
      typeof item === 'object' ? item[idKey] === id : item === id
    );
  }, [items, idKey]);

  // Handle drag start
  const handleDragStart = useCallback((id) => (e) => {
    setActiveId(id);
    draggedItemRef.current = e.target;

    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);

    // Add dragging class
    e.target.classList.add('dragging');
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (activeId && overId && activeId !== overId) {
      const oldIndex = getIndex(activeId);
      const newIndex = getIndex(overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);

        onReorder?.(newItems, { activeId, overId, oldIndex, newIndex });
      }
    }

    // Remove dragging class
    draggedItemRef.current?.classList.remove('dragging');

    setActiveId(null);
    setOverId(null);
    draggedItemRef.current = null;
  }, [activeId, overId, items, getIndex, onReorder]);

  // Handle drag over
  const handleDragOver = useCallback((id) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverId(id);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setOverId(null);
  }, []);

  // Get item props
  const getItemProps = useCallback((id) => ({
    draggable: true,
    onDragStart: handleDragStart(id),
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver(id),
    onDragLeave: handleDragLeave,
    'data-dragging': activeId === id,
    'data-over': overId === id
  }), [handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, activeId, overId]);

  return {
    activeId,
    overId,
    getItemProps,
    isDragging: activeId !== null
  };
}

/**
 * Draggable element hook
 * @param {object} options - Drag options
 * @returns {object} Drag state and handlers
 */
export function useDraggable(options = {}) {
  const {
    data,
    onDragStart,
    onDragEnd,
    disabled = false
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef(null);

  const handleDragStart = useCallback((e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);

    // Set drag data
    if (data) {
      e.dataTransfer.setData('application/json', JSON.stringify(data));
    }

    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(e, data);
  }, [disabled, data, onDragStart]);

  const handleDragEnd = useCallback((e) => {
    setIsDragging(false);
    onDragEnd?.(e, data);
  }, [data, onDragEnd]);

  const getDragProps = useCallback(() => ({
    ref: elementRef,
    draggable: !disabled,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    'aria-grabbed': isDragging
  }), [disabled, handleDragStart, handleDragEnd, isDragging]);

  return {
    isDragging,
    getDragProps,
    elementRef
  };
}

/**
 * Droppable area hook
 * @param {object} options - Drop options
 * @returns {object} Drop state and handlers
 */
export function useDroppable(options = {}) {
  const {
    accept,
    onDrop,
    disabled = false
  } = options;

  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);
  const elementRef = useRef(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    if (disabled) return;

    setIsOver(true);

    // Check if can accept
    if (accept) {
      const types = e.dataTransfer.types;
      setCanDrop(types.includes(accept));
    } else {
      setCanDrop(true);
    }
  }, [disabled, accept]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (disabled) return;

    e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
  }, [disabled, canDrop]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsOver(false);
    setCanDrop(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsOver(false);
    setCanDrop(false);

    if (disabled) return;

    // Try to parse JSON data
    let data;
    try {
      const jsonData = e.dataTransfer.getData('application/json');
      data = jsonData ? JSON.parse(jsonData) : null;
    } catch {
      data = e.dataTransfer.getData('text/plain');
    }

    onDrop?.(data, e);
  }, [disabled, onDrop]);

  const getDropProps = useCallback(() => ({
    ref: elementRef,
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    'aria-dropeffect': canDrop ? 'move' : 'none'
  }), [handleDragEnter, handleDragOver, handleDragLeave, handleDrop, canDrop]);

  return {
    isOver,
    canDrop,
    getDropProps,
    elementRef
  };
}

export default {
  useDropZone,
  useSortable,
  useDraggable,
  useDroppable
};
