import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Typography,
  IconButton,
  Toolbar,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid';
import {
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getRoomTypeLabel } from '../../../utils/formatters';

export default function PropertyTable({ properties = [], onPropertySelect, searchConditions = {} }) {
  const [pageSize, setPageSize] = useState(25);
  const [filterModel, setFilterModel] = useState({ items: [] });

  // 検索条件が変更されたらフィルタをクリア
  useEffect(() => {
    setFilterModel({ items: [] });
  }, [searchConditions]);

  const getBuildingTypeLabel = (type) => {
    const typeMap = {
      mansion: 'マンション',
      apartment: 'アパート',
      house: '一戸建て',
      office: 'オフィス',
      store: '店舗',
      other: 'その他'
    };
    return typeMap[type] || '不明';
  };

  // DataGrid用の列定義
  const columns = [
    {
      field: 'name',
      headerName: '物件名',
      width: 200,
      flex: 1,
      minWidth: 150,
      filterable: true,
      sortable: true,
    },
    {
      field: 'address',
      headerName: '住所',
      width: 250,
      flex: 1,
      minWidth: 200,
      filterable: true,
      sortable: true,
    },
    {
      field: 'building_type',
      headerName: '建物種別',
      width: 120,
      filterable: true,
      sortable: true,
      type: 'singleSelect',
      valueOptions: ['mansion', 'apartment', 'house', 'office', 'store', 'other'],
      valueFormatter: (value) => getBuildingTypeLabel(value),
      renderCell: (params) => (
        <Chip
          label={getBuildingTypeLabel(params.value)}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'room_cnt',
      headerName: '総戸数',
      width: 100,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      filterable: true,
      sortable: true,
      renderCell: (params) => `${params.value || 0}戸`,
    },
    {
      field: 'buildingAge',
      headerName: '築年数',
      width: 100,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      filterable: true,
      sortable: true,
      valueGetter: (value, row) => {
        if (!row.built_date) return null;
        const builtYear = new Date(row.built_date).getFullYear();
        const currentYear = new Date().getFullYear();
        return currentYear - builtYear;
      },
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) return '-';
        return `${params.value}年`;
      },
    },
    {
      field: 'avgRent',
      headerName: '平均賃料',
      width: 120,
      type: 'number',
      align: 'right',
      headerAlign: 'center',
      filterable: true,
      sortable: true,
      valueGetter: (value, row) => {
        if (!row.rooms || !Array.isArray(row.rooms) || row.rooms.length === 0) return null;
        // 明示的に数値変換し、有効な値のみフィルタ
        const rentsWithValue = row.rooms
          .map(r => parseFloat(r.rent))
          .filter(r => !isNaN(r) && r > 0);
        if (rentsWithValue.length === 0) return null;
        return rentsWithValue.reduce((sum, r) => sum + r, 0) / rentsWithValue.length;
      },
      renderCell: (params) => {
        if (params.value === null || params.value === undefined || isNaN(params.value)) return '-';
        const rentInMan = (params.value / 10000).toFixed(1);
        return `${rentInMan}万円`;
      },
    },
    {
      field: 'floorPlans',
      headerName: '間取り',
      width: 180,
      filterable: true,
      sortable: false,
      valueGetter: (value, row) => {
        if (!row.rooms || !Array.isArray(row.rooms) || row.rooms.length === 0) return '';
        // room_typeを日本語ラベルに変換してからユニーク化
        const labels = row.rooms.map(r => getRoomTypeLabel(r.room_type)).filter(Boolean);
        const uniqueLabels = [...new Set(labels)];
        if (uniqueLabels.length === 0) return '';
        if (uniqueLabels.length <= 3) return uniqueLabels.join('、');
        return uniqueLabels.slice(0, 3).join('、') + '、他…';
      },
      renderCell: (params) => {
        if (!params.value) return '-';
        return (
          <Typography variant="body2" noWrap title={params.value}>
            {params.value}
          </Typography>
        );
      },
    },
  ];

  // データにidフィールドを追加（DataGridで必要）
  const rowsWithId = useMemo(() => {
    const uniqueMap = new Map();
    const processedData = [];

    properties.forEach((property, index) => {
      // 基本IDを決定
      const baseId = property.id || `temp-${index}`;

      // 重複チェック
      let uniqueId = baseId;
      let counter = 1;
      while (uniqueMap.has(uniqueId)) {
        uniqueId = `${baseId}-duplicate-${counter}`;
        counter++;
      }

      uniqueMap.set(uniqueId, true);
      processedData.push({
        ...property,
        id: uniqueId,
      });
    });

    return processedData;
  }, [properties]);

  // カスタムツールバー
  const CustomToolbar = () => {
    return (
      <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport
          printOptions={{ disableToolbarButton: true }}
          csvOptions={{
            fileName: '物件一覧',
            utf8WithBom: true,
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          size="small"
          onClick={() => {
            // リフレッシュ処理（必要に応じて実装）
            console.log('データを更新');
          }}
          sx={{ mr: 1 }}
        >
          <RefreshIcon />
        </IconButton>
      </GridToolbarContainer>
    );
  };

  // 行クリック処理
  const handleRowClick = (params) => {
    if (onPropertySelect) {
      onPropertySelect(params.row);
    }
  };

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <DataGrid
        rows={rowsWithId}
        columns={columns}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[10, 25, 50, 100]}
        pagination
        disableSelectionOnClick
        onRowClick={handleRowClick}
        filterModel={filterModel}
        onFilterModelChange={(newFilterModel) => setFilterModel(newFilterModel)}
        components={{
          Toolbar: CustomToolbar,
        }}
        density="compact"
        rowHeight={45}
        columnHeaderHeight={45}
        sx={{
          flex: 1,
          border: 'none',
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
          '& .MuiDataGrid-footerContainer': {
            minHeight: '36px',
            maxHeight: '36px',
          },
          '& .MuiTablePagination-root': {
            overflow: 'hidden',
          },
          '& .MuiTablePagination-toolbar': {
            minHeight: '36px',
            paddingLeft: 1,
            paddingRight: 1,
          },
        }}
        localeText={{
          // 日本語ローカライゼーション
          noRowsLabel: 'データがありません',
          noResultsOverlayLabel: '検索結果がありません',
          errorOverlayDefaultLabel: 'エラーが発生しました',
          toolbarColumns: '列',
          toolbarFilters: 'フィルター',
          toolbarDensity: '密度',
          toolbarExport: 'エクスポート',
          toolbarExportLabel: 'エクスポート',
          toolbarExportCSV: 'CSVダウンロード',
          toolbarExportPrint: '印刷',
          columnsPanelTextFieldLabel: '列を検索',
          columnsPanelTextFieldPlaceholder: '列名',
          columnsPanelDragIconLabel: '列の順序を変更',
          columnsPanelShowAllButton: '全て表示',
          columnsPanelHideAllButton: '全て隠す',
          filterPanelAddFilter: 'フィルターを追加',
          filterPanelDeleteIconLabel: '削除',
          filterPanelLinkOperator: '論理演算子',
          filterPanelOperator: '演算子',
          filterPanelOperatorAnd: 'かつ',
          filterPanelOperatorOr: 'または',
          filterPanelColumns: '列',
          filterPanelInputLabel: '値',
          filterPanelInputPlaceholder: 'フィルター値',
          filterOperatorContains: '含む',
          filterOperatorEquals: '等しい',
          filterOperatorStartsWith: '始まる',
          filterOperatorEndsWith: '終わる',
          filterOperatorIs: 'である',
          filterOperatorNot: '以外',
          filterOperatorAfter: 'より後',
          filterOperatorOnOrAfter: '以降',
          filterOperatorBefore: 'より前',
          filterOperatorOnOrBefore: '以前',
          filterOperatorIsEmpty: '空である',
          filterOperatorIsNotEmpty: '空でない',
          filterOperatorIsAnyOf: 'のいずれか',
          columnMenuLabel: 'メニュー',
          columnMenuShowColumns: '列を表示',
          columnMenuFilter: 'フィルター',
          columnMenuHideColumn: '列を隠す',
          columnMenuUnsort: 'ソート解除',
          columnMenuSortAsc: '昇順ソート',
          columnMenuSortDesc: '降順ソート',
          columnHeaderFiltersTooltipActive: (count) =>
            count !== 1 ? `${count} active filters` : `${count} active filter`,
          columnHeaderFiltersLabel: 'フィルターを表示',
          columnHeaderSortIconLabel: 'ソート',
          footerRowSelected: (count) =>
            count !== 1
              ? `${count.toLocaleString()} 行を選択中`
              : `${count.toLocaleString()} 行を選択中`,
          footerTotalRows: '総行数:',
          footerTotalVisibleRows: (visibleCount, totalCount) =>
            `${visibleCount.toLocaleString()} / ${totalCount.toLocaleString()}`,
          checkboxSelectionHeaderName: '選択',
          booleanCellTrueLabel: 'はい',
          booleanCellFalseLabel: 'いいえ',
        }}
      />
    </Box>
  );
}
