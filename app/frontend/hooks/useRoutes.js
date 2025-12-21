import { useState, useEffect, useCallback } from 'react';

/**
 * 建物の経路データを管理するカスタムフック
 * @param {number|string} buildingId - 建物ID
 */
export function useRoutes(buildingId) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);

  // 経路一覧を取得
  const fetchRoutes = useCallback(async () => {
    if (!buildingId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/buildings/${buildingId}/routes`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        // 認証エラー時はログインページへリダイレクト
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('経路の取得に失敗しました');
      }

      const data = await response.json();
      setRoutes(data);

      // デフォルト経路があれば選択
      const defaultRoute = data.find((r) => r.is_default);
      if (defaultRoute) {
        setActiveRoute(defaultRoute);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch routes:', err);
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // 経路を作成
  const createRoute = useCallback(
    async (routeData) => {
      try {
        const response = await fetch(`/api/v1/buildings/${buildingId}/routes`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ route: routeData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.errors?.join(', ') || '経路の作成に失敗しました');
        }

        const newRoute = await response.json();
        setRoutes((prev) => [...prev, newRoute]);
        return newRoute;
      } catch (err) {
        console.error('Failed to create route:', err);
        throw err;
      }
    },
    [buildingId]
  );

  // 経路を更新
  const updateRoute = useCallback(
    async (routeId, routeData) => {
      try {
        const response = await fetch(`/api/v1/buildings/${buildingId}/routes/${routeId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ route: routeData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.errors?.join(', ') || '経路の更新に失敗しました');
        }

        const updatedRoute = await response.json();
        setRoutes((prev) => prev.map((r) => (r.id === routeId ? updatedRoute : r)));

        // アクティブな経路が更新された場合は更新
        if (activeRoute?.id === routeId) {
          setActiveRoute(updatedRoute);
        }

        return updatedRoute;
      } catch (err) {
        console.error('Failed to update route:', err);
        throw err;
      }
    },
    [buildingId, activeRoute]
  );

  // 経路を削除
  const deleteRoute = useCallback(
    async (routeId) => {
      try {
        const response = await fetch(`/api/v1/buildings/${buildingId}/routes/${routeId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('経路の削除に失敗しました');
        }

        setRoutes((prev) => prev.filter((r) => r.id !== routeId));

        // アクティブな経路が削除された場合はクリア
        if (activeRoute?.id === routeId) {
          setActiveRoute(null);
        }
      } catch (err) {
        console.error('Failed to delete route:', err);
        throw err;
      }
    },
    [buildingId, activeRoute]
  );

  // 経路を再計算
  const recalculateRoute = useCallback(
    async (routeId) => {
      try {
        const response = await fetch(
          `/api/v1/buildings/${buildingId}/routes/${routeId}/calculate`,
          {
            method: 'POST',
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('経路の再計算に失敗しました');
        }

        const updatedRoute = await response.json();
        setRoutes((prev) => prev.map((r) => (r.id === routeId ? updatedRoute : r)));

        if (activeRoute?.id === routeId) {
          setActiveRoute(updatedRoute);
        }

        return updatedRoute;
      } catch (err) {
        console.error('Failed to recalculate route:', err);
        throw err;
      }
    },
    [buildingId, activeRoute]
  );

  // ストリートビューポイントを取得
  const getStreetviewPoints = useCallback(
    async (routeId, interval = 50) => {
      try {
        const response = await fetch(
          `/api/v1/buildings/${buildingId}/routes/${routeId}/streetview_points?interval=${interval}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('ストリートビューポイントの取得に失敗しました');
        }

        const data = await response.json();
        return data.points;
      } catch (err) {
        console.error('Failed to get streetview points:', err);
        throw err;
      }
    },
    [buildingId]
  );

  // 経路を選択
  const selectRoute = useCallback(
    (route) => {
      setActiveRoute(route);
    },
    []
  );

  // 経路選択を解除
  const clearActiveRoute = useCallback(() => {
    setActiveRoute(null);
  }, []);

  return {
    routes,
    loading,
    error,
    activeRoute,
    createRoute,
    updateRoute,
    deleteRoute,
    recalculateRoute,
    getStreetviewPoints,
    selectRoute,
    clearActiveRoute,
    refetch: fetchRoutes,
  };
}

export default useRoutes;
