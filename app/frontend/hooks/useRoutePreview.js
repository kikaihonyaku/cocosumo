import { useState, useCallback } from 'react';

/**
 * 経路プレビュー（候補選択）を管理するカスタムフック
 * @param {number|string} buildingId - 建物ID
 */
export function useRoutePreview(buildingId) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routeParams, setRouteParams] = useState(null);

  // 経路候補をプレビュー取得
  const fetchPreview = useCallback(
    async (routeData) => {
      if (!buildingId) return null;

      setLoading(true);
      setError(null);
      setCandidates([]);

      try {
        const response = await fetch(`/api/v1/buildings/${buildingId}/routes/preview`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ route: routeData }),
        });

        if (response.status === 401) {
          window.location.href = '/login';
          return null;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '経路プレビューの取得に失敗しました');
        }

        const data = await response.json();
        setCandidates(data.candidates);
        setRouteParams(data.route_params);
        return data;
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch route preview:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [buildingId]
  );

  // 選択した経路を確定・保存
  const confirmRoute = useCallback(
    async (routeData, selectedIndex) => {
      if (!buildingId) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/buildings/${buildingId}/routes/confirm`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: routeData,
            selected_index: selectedIndex,
          }),
        });

        if (response.status === 401) {
          window.location.href = '/login';
          return null;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || errorData.errors?.join(', ') || '経路の作成に失敗しました'
          );
        }

        const newRoute = await response.json();
        return newRoute;
      } catch (err) {
        setError(err.message);
        console.error('Failed to confirm route:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [buildingId]
  );

  // プレビュー状態をクリア
  const clearPreview = useCallback(() => {
    setCandidates([]);
    setRouteParams(null);
    setError(null);
  }, []);

  return {
    candidates,
    loading,
    error,
    routeParams,
    fetchPreview,
    confirmRoute,
    clearPreview,
  };
}

export default useRoutePreview;
