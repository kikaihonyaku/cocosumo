import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Divider,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  AutoFixHigh as AutoFixHighIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  Close as CloseIcon,
  CropFree as CropFreeIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

export default function AIEditingPanel({
  isMobile,
  editMode,
  aiPrompt,
  aiProcessing,
  referenceImages,
  clickPoints,
  onEditModeChange,
  onAiPromptChange,
  onAddReferenceImage,
  onRemoveReferenceImage,
  onClearClickPoints,
  onAiProcess,
}) {
  return (
    <Paper elevation={2} sx={{ p: 1.5 }}>
      <Typography variant="h6" gutterBottom>
        AI画像編集 (Nano Banana)
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* 編集モード切り替え */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
          編集モード
        </Typography>
        <ToggleButtonGroup
          value={editMode}
          exclusive
          onChange={(e, newMode) => {
            if (newMode !== null) {
              onEditModeChange(newMode);
            }
          }}
          fullWidth
          size="small"
          disabled={aiProcessing}
        >
          <ToggleButton value="full" sx={{ py: 1, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0.5 : 1 }}>
            <ImageIcon sx={{ mr: isMobile ? 0 : 1 }} />
            {isMobile ? (
              <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>全体</Typography>
            ) : (
              '全体編集'
            )}
          </ToggleButton>
          <ToggleButton value="point" sx={{ py: 1, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0.5 : 1 }}>
            <CropFreeIcon sx={{ mr: isMobile ? 0 : 1 }} />
            {isMobile ? (
              <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>座標指定</Typography>
            ) : (
              '座標指定編集'
            )}
          </ToggleButton>
        </ToggleButtonGroup>

        {/* 座標指定モード時のヘルプテキストとクリアボタン */}
        {editMode === 'point' && (
          <Box sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ mb: 1, fontSize: isMobile ? '0.7rem' : '0.75rem', py: isMobile ? 0.5 : 1 }}>
              {isMobile ? '画像をタップして編集位置を指定（最大3点）' : '画像上をクリックして編集したい位置を指定してください（最大3点）'}
            </Alert>
            {clickPoints.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                  {clickPoints.length}点指定済み
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={onClearClickPoints}
                  disabled={aiProcessing}
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem', px: isMobile ? 1 : 2 }}
                >
                  {isMobile ? 'クリア' : '座標をクリア'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder="編集したい内容を具体的に入力してください&#10;例:&#10;・ソファを完全に削除&#10;・壁の色を白に変更&#10;・床のキズを修正"
        value={aiPrompt}
        onChange={(e) => onAiPromptChange(e.target.value)}
        sx={{ mb: 2 }}
        disabled={aiProcessing}
        helperText="短い指示でOK！AIが自動的に詳細な編集指示に変換します"
      />

      {/* 参照画像セクション */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
          参照画像（オプション）
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          照明やオブジェクトなどの画像を追加できます（最大3枚）
        </Typography>

        {/* 参照画像プレビュー */}
        {referenceImages.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {referenceImages.map((file, index) => (
              <Box
                key={index}
                sx={{
                  position: 'relative',
                  width: 80,
                  height: 80,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: 'divider',
                }}
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`参照画像${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => onRemoveReferenceImage(index)}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                    },
                    padding: '2px',
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {/* 参照画像追加ボタン */}
        {referenceImages.length < 3 && (
          <Button
            component="label"
            variant="outlined"
            startIcon={<AddPhotoAlternateIcon />}
            size="small"
            disabled={aiProcessing}
            fullWidth
          >
            参照画像を追加 ({referenceImages.length}/3)
            <input
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={onAddReferenceImage}
            />
          </Button>
        )}
      </Box>

      <Button
        fullWidth
        variant="contained"
        color="secondary"
        startIcon={<AutoFixHighIcon />}
        onClick={onAiProcess}
        disabled={aiProcessing || !aiPrompt.trim()}
      >
        {aiProcessing ? 'AI編集中...' : 'AI編集を実行'}
      </Button>

      <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem' }}>
        <strong>効果的なプロンプトのコツ：</strong>
        <br />
        ✓ 「〇〇を削除」「〇〇を変更」など動作を明確に
        <br />
        ✓ 一度に1つの編集を指示すると成功率が高い
        <br />
        ✓ 失敗した場合は自動的に再試行されます
        <br />
        <br />
        <strong>よく使われる例：</strong>
        <br />
        • 家具系：「ソファを完全に削除」「テーブルを完全に取り除く」
        <br />
        • 修正系：「壁の汚れを完全に消す」「床のキズを完全に修正」
        <br />
        • 変更系：「壁を白に塗る」「カーテンを追加」
        <br />
        <br />
        <strong>参照画像の使い方：</strong>
        <br />
        • 照明器具の画像を追加して「この照明を追加」
        <br />
        • 家具の画像を追加して「この家具を配置」
        <br />
        • スタイル参考画像を追加して雰囲気を指定
      </Alert>
    </Paper>
  );
}
