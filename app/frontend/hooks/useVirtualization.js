/**
 * Virtualization Hooks
 * Efficient rendering for large lists and grids
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Virtual list hook for rendering only visible items
 * @param {object} options - Configuration options
 * @returns {object} Virtualization state and utilities
 */
export function useVirtualList({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
  getItemKey = (index) => index
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const { startIndex, endIndex, visibleItems, totalHeight, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(itemCount - 1, start + visibleCount + overscan * 2);

    const items = [];
    for (let i = start; i <= end; i++) {
      items.push({
        index: i,
        key: getItemKey(i),
        style: {
          position: 'absolute',
          top: i * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0
        }
      });
    }

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items,
      totalHeight: itemCount * itemHeight,
      offsetY: start * itemHeight
    };
  }, [scrollTop, itemCount, itemHeight, containerHeight, overscan, getItemKey]);

  // Scroll handler
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback((index, align = 'start') => {
    if (!containerRef.current) return;

    let targetScroll;
    switch (align) {
      case 'center':
        targetScroll = index * itemHeight - containerHeight / 2 + itemHeight / 2;
        break;
      case 'end':
        targetScroll = (index + 1) * itemHeight - containerHeight;
        break;
      case 'start':
      default:
        targetScroll = index * itemHeight;
    }

    containerRef.current.scrollTop = Math.max(0, Math.min(targetScroll, totalHeight - containerHeight));
  }, [itemHeight, containerHeight, totalHeight]);

  return {
    containerRef,
    containerProps: {
      ref: containerRef,
      onScroll: handleScroll,
      style: {
        overflow: 'auto',
        height: containerHeight,
        position: 'relative'
      }
    },
    innerProps: {
      style: {
        height: totalHeight,
        position: 'relative'
      }
    },
    visibleItems,
    startIndex,
    endIndex,
    scrollToIndex,
    scrollTop
  };
}

/**
 * Virtual grid hook for 2D virtualization
 * @param {object} options - Configuration options
 * @returns {object} Grid virtualization state
 */
export function useVirtualGrid({
  rowCount,
  columnCount,
  rowHeight,
  columnWidth,
  containerHeight,
  containerWidth,
  overscan = 2
}) {
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);

  const { visibleCells, totalHeight, totalWidth } = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scroll.top / rowHeight) - overscan);
    const startCol = Math.max(0, Math.floor(scroll.left / columnWidth) - overscan);
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const visibleCols = Math.ceil(containerWidth / columnWidth);
    const endRow = Math.min(rowCount - 1, startRow + visibleRows + overscan * 2);
    const endCol = Math.min(columnCount - 1, startCol + visibleCols + overscan * 2);

    const cells = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        cells.push({
          rowIndex: row,
          columnIndex: col,
          key: `${row}-${col}`,
          style: {
            position: 'absolute',
            top: row * rowHeight,
            left: col * columnWidth,
            height: rowHeight,
            width: columnWidth
          }
        });
      }
    }

    return {
      visibleCells: cells,
      totalHeight: rowCount * rowHeight,
      totalWidth: columnCount * columnWidth
    };
  }, [scroll, rowCount, columnCount, rowHeight, columnWidth, containerHeight, containerWidth, overscan]);

  const handleScroll = useCallback((e) => {
    setScroll({
      top: e.target.scrollTop,
      left: e.target.scrollLeft
    });
  }, []);

  const scrollToCell = useCallback((rowIndex, columnIndex) => {
    if (!containerRef.current) return;

    containerRef.current.scrollTop = rowIndex * rowHeight;
    containerRef.current.scrollLeft = columnIndex * columnWidth;
  }, [rowHeight, columnWidth]);

  return {
    containerRef,
    containerProps: {
      ref: containerRef,
      onScroll: handleScroll,
      style: {
        overflow: 'auto',
        height: containerHeight,
        width: containerWidth,
        position: 'relative'
      }
    },
    innerProps: {
      style: {
        height: totalHeight,
        width: totalWidth,
        position: 'relative'
      }
    },
    visibleCells,
    scrollToCell
  };
}

/**
 * Infinite scroll hook with virtualization
 * @param {object} options - Configuration options
 * @returns {object} Infinite scroll state
 */
export function useInfiniteScroll({
  loadMore,
  hasMore,
  threshold = 200,
  isLoading = false
}) {
  const [page, setPage] = useState(1);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore(page + 1);
          setPage((p) => p + 1);
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, isLoading, page, loadMore, threshold]);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  return {
    loadMoreRef,
    page,
    reset,
    sentinelProps: {
      ref: loadMoreRef,
      style: { height: 1 }
    }
  };
}

/**
 * Window virtualization for full-page lists
 * @param {object} options - Configuration options
 * @returns {object} Window virtualization state
 */
export function useWindowVirtualization({
  itemCount,
  itemHeight,
  overscan = 5
}) {
  const [scrollY, setScrollY] = useState(0);
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleResize = () => setWindowHeight(window.innerHeight);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { visibleItems, totalHeight } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollY / itemHeight) - overscan);
    const visibleCount = Math.ceil(windowHeight / itemHeight);
    const end = Math.min(itemCount - 1, start + visibleCount + overscan * 2);

    const items = [];
    for (let i = start; i <= end; i++) {
      items.push({
        index: i,
        style: {
          position: 'absolute',
          top: i * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0
        }
      });
    }

    return {
      visibleItems: items,
      totalHeight: itemCount * itemHeight
    };
  }, [scrollY, windowHeight, itemCount, itemHeight, overscan]);

  return {
    visibleItems,
    totalHeight,
    containerStyle: {
      height: totalHeight,
      position: 'relative'
    }
  };
}

/**
 * Dynamic height virtualization (variable item heights)
 * @param {object} options - Configuration options
 * @returns {object} Dynamic virtualization state
 */
export function useDynamicVirtualList({
  itemCount,
  estimatedItemHeight,
  containerHeight,
  overscan = 3,
  measureItem
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState({});
  const containerRef = useRef(null);

  // Get item height (measured or estimated)
  const getItemHeight = useCallback((index) => {
    return measuredHeights[index] || estimatedItemHeight;
  }, [measuredHeights, estimatedItemHeight]);

  // Calculate positions
  const { visibleItems, totalHeight, itemPositions } = useMemo(() => {
    const positions = [];
    let currentTop = 0;

    for (let i = 0; i < itemCount; i++) {
      const height = getItemHeight(i);
      positions.push({ top: currentTop, height });
      currentTop += height;
    }

    // Find visible range
    let startIndex = 0;
    let endIndex = 0;

    for (let i = 0; i < positions.length; i++) {
      if (positions[i].top + positions[i].height > scrollTop - overscan * estimatedItemHeight) {
        startIndex = i;
        break;
      }
    }

    for (let i = startIndex; i < positions.length; i++) {
      if (positions[i].top > scrollTop + containerHeight + overscan * estimatedItemHeight) {
        endIndex = i;
        break;
      }
      endIndex = i + 1;
    }

    const items = [];
    for (let i = startIndex; i < endIndex && i < itemCount; i++) {
      items.push({
        index: i,
        style: {
          position: 'absolute',
          top: positions[i].top,
          height: positions[i].height,
          left: 0,
          right: 0
        }
      });
    }

    return {
      visibleItems: items,
      totalHeight: currentTop,
      itemPositions: positions
    };
  }, [itemCount, getItemHeight, scrollTop, containerHeight, overscan, estimatedItemHeight]);

  // Measure item callback
  const onItemMeasured = useCallback((index, height) => {
    setMeasuredHeights((prev) => {
      if (prev[index] === height) return prev;
      return { ...prev, [index]: height };
    });
  }, []);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    containerRef,
    containerProps: {
      ref: containerRef,
      onScroll: handleScroll,
      style: {
        overflow: 'auto',
        height: containerHeight,
        position: 'relative'
      }
    },
    innerProps: {
      style: {
        height: totalHeight,
        position: 'relative'
      }
    },
    visibleItems,
    onItemMeasured
  };
}

export default {
  useVirtualList,
  useVirtualGrid,
  useInfiniteScroll,
  useWindowVirtualization,
  useDynamicVirtualList
};
