import { useState, useEffect, useCallback } from 'react';

/**
 * 路線・駅マスタデータを取得するフック
 */
export default function useRailwayLines() {
  const [railwayData, setRailwayData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRailwayLines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/railway_lines', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setRailwayData(data);
      } else {
        setError('路線データの取得に失敗しました');
      }
    } catch (err) {
      console.error('路線データ取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRailwayLines();
  }, [fetchRailwayLines]);

  // 全路線をフラットなリストで返す
  const allLines = railwayData.flatMap(company => company.lines);

  // 全駅をフラットなリストで返す（路線情報付き）
  const allStations = allLines.flatMap(line =>
    line.stations.map(station => ({
      ...station,
      railway_line_id: line.id,
      railway_line_name: line.name,
      railway_line_color: line.color,
    }))
  );

  // 指定路線の駅を返す
  const getStationsForLines = useCallback((lineIds) => {
    if (!lineIds || lineIds.length === 0) return allStations;
    return allStations.filter(s => lineIds.includes(s.railway_line_id));
  }, [allStations]);

  // 駅名で検索
  const searchStations = useCallback(async (query) => {
    if (!query || query.trim().length === 0) return [];
    try {
      const response = await fetch(`/api/v1/railway_lines/stations_search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return data.stations;
      }
    } catch (err) {
      console.error('駅検索エラー:', err);
    }
    return [];
  }, []);

  return {
    railwayData,
    allLines,
    allStations,
    loading,
    error,
    getStationsForLines,
    searchStations,
    refetch: fetchRailwayLines,
  };
}
