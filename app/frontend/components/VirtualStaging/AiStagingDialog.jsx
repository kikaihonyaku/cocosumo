import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Chair as FurnishedIcon,
  Weekend as ModernIcon,
  Spa as TraditionalIcon,
  CleaningServices as UnfurnishedIcon,
  CheckCircle as CheckIcon,
  Edit as CustomIcon,
} from '@mui/icons-material';

// スタイルプリセット定義
const STAGING_STYLES = [
  {
    id: 'custom',
    label: 'カスタム',
    icon: CustomIcon,
    prompt: '',
    color: '#9C27B0',
    isCustom: true,
  },
  {
    id: 'modern',
    label: 'モダン',
    icon: ModernIcon,
    prompt: 'モダンでスタイリッシュな家具を配置してください。シンプルでクリーンなデザイン、中間色を基調とした現代的なインテリアにしてください。',
    color: '#2196F3',
  },
  {
    id: 'traditional',
    label: 'トラディショナル',
    icon: TraditionalIcon,
    prompt: '伝統的で温かみのある家具を配置してください。木目調の家具、暖色系の装飾、クラシックなデザインのインテリアにしてください。',
    color: '#8D6E63',
  },
  {
    id: 'furnished',
    label: 'ナチュラル',
    icon: FurnishedIcon,
    prompt: 'ナチュラルで居心地の良い家具を配置してください。観葉植物、自然素材の家具、明るく開放的なインテリアにしてください。',
    color: '#4CAF50',
  },
  {
    id: 'unfurnished',
    label: '空室クリーン',
    icon: UnfurnishedIcon,
    prompt: '既存の家具やゴミを全て削除し、清潔で明るい空室の状態にしてください。壁や床を綺麗に見せてください。',
    color: '#9E9E9E',
  },
];

const AiStagingDialog = ({
  open,
  onClose,
  beforePhoto,
  onGenerated,
  roomId,
}) => {
  const [selectedStyle, setSelectedStyle] = useState('custom');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef(null);

  const handleStyleChange = (event, newStyle) => {
    if (newStyle !== null) {
      setSelectedStyle(newStyle);
      setError(null);
    }
  };

  const getSelectedStyleInfo = () => {
    return STAGING_STYLES.find((s) => s.id === selectedStyle);
  };

  const handleGenerate = async () => {
    if (!beforePhoto) {
      setError('Before画像を先に選択してください');
      return;
    }

    const styleInfo = getSelectedStyleInfo();

    // カスタムスタイルの場合はプロンプト必須
    if (styleInfo.isCustom && !customPrompt.trim()) {
      setError('カスタムスタイルの場合はプロンプトを入力してください');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setGeneratedImage(null);

    // プログレス表示用のインターバル
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      abortControllerRef.current = new AbortController();

      // Before画像を取得してBase64に変換
      // CORS回避のため、プロキシエンドポイントを使用
      const proxyUrl = `/api/v1/rooms/${roomId}/room_photos/${beforePhoto.id}/proxy`;
      const imageResponse = await fetch(proxyUrl, {
        credentials: 'include',
        signal: abortControllerRef.current.signal,
      });
      if (!imageResponse.ok) {
        throw new Error('画像の取得に失敗しました');
      }
      const imageBlob = await imageResponse.blob();

      // プロンプトを構築
      let finalPrompt;
      if (styleInfo.isCustom) {
        // カスタムスタイル: ユーザーのプロンプトのみ使用
        finalPrompt = customPrompt;
      } else {
        // プリセットスタイル: ベースプロンプト + オプションのカスタム指示
        finalPrompt = customPrompt
          ? `${styleInfo.prompt}\n\n追加の指示: ${customPrompt}`
          : styleInfo.prompt;
      }

      // FormDataを作成
      const formData = new FormData();
      formData.append('image', imageBlob, 'before.jpg');
      formData.append('prompt', finalPrompt);

      // Imagen APIを呼び出し
      const response = await fetch('/api/v1/imagen/edit_image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        signal: abortControllerRef.current.signal,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI生成に失敗しました');
      }

      const data = await response.json();

      if (data.success && data.image) {
        // Base64画像をデータURLに変換
        const generatedImageUrl = `data:image/jpeg;base64,${data.image}`;
        setGeneratedImage(generatedImageUrl);
      } else {
        throw new Error(data.error || 'AI生成に失敗しました');
      }
    } catch (err) {
      clearInterval(progressInterval);
      if (err.name === 'AbortError') {
        setError('生成がキャンセルされました');
      } else {
        setError(err.message || 'AI生成中にエラーが発生しました');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  const handleSaveAndUse = async () => {
    if (!generatedImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Base64をBlobに変換
      const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      // FormDataを作成してRoomPhotoとして保存
      const formData = new FormData();
      formData.append('room_photo[photo]', blob, `ai_staging_${Date.now()}.jpg`);
      formData.append('room_photo[photo_type]', 'interior');
      formData.append('room_photo[caption]', `AI生成 (${getSelectedStyleInfo().label})`);

      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('画像の保存に失敗しました');
      }

      const savedPhoto = await response.json();

      // 親コンポーネントに通知
      onGenerated(savedPhoto);
      handleClose();
    } catch (err) {
      setError(err.message || '保存中にエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setGeneratedImage(null);
    setError(null);
    setCustomPrompt('');
    setProgress(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={isGenerating ? undefined : handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AiIcon color="primary" />
        <Typography variant="h6">AIバーチャルステージング</Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* 左側: Before画像 */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Before画像
            </Typography>
            {beforePhoto ? (
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={beforePhoto.photo_url}
                  alt="Before"
                  sx={{ objectFit: 'contain', bgcolor: 'grey.100' }}
                />
              </Card>
            ) : (
              <Alert severity="warning">
                Before画像を先に選択してください
              </Alert>
            )}
          </Grid>

          {/* 右側: 生成結果 or プレースホルダー */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              After画像（AI生成）
            </Typography>
            {generatedImage ? (
              <Card sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={generatedImage}
                  alt="Generated"
                  sx={{ objectFit: 'contain', bgcolor: 'grey.100' }}
                />
                <Chip
                  icon={<CheckIcon />}
                  label="生成完了"
                  color="success"
                  size="small"
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                />
              </Card>
            ) : (
              <Box
                sx={{
                  height: 200,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: 'grey.300',
                }}
              >
                {isGenerating ? (
                  <Box sx={{ textAlign: 'center', px: 3 }}>
                    <CircularProgress size={40} sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      AI生成中...
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ mt: 1, width: '100%' }}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    スタイルを選択して生成してください
                  </Typography>
                )}
              </Box>
            )}
          </Grid>
        </Grid>

        {/* スタイル選択 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            スタイル選択
          </Typography>
          <ToggleButtonGroup
            value={selectedStyle}
            exclusive
            onChange={handleStyleChange}
            sx={{ flexWrap: 'wrap', gap: 1 }}
          >
            {STAGING_STYLES.map((style) => {
              const StyleIcon = style.icon;
              return (
                <ToggleButton
                  key={style.id}
                  value={style.id}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: '8px !important',
                    border: '1px solid !important',
                    borderColor: selectedStyle === style.id ? `${style.color} !important` : 'divider',
                    bgcolor: selectedStyle === style.id ? `${style.color}15` : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: `${style.color}20`,
                      color: style.color,
                    },
                  }}
                >
                  <StyleIcon sx={{ mr: 1, fontSize: 20 }} />
                  {style.label}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>

          {/* 選択中のスタイルの説明 */}
          {!getSelectedStyleInfo()?.isCustom && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, fontStyle: 'italic' }}
            >
              {getSelectedStyleInfo()?.prompt}
            </Typography>
          )}
        </Box>

        {/* カスタムプロンプト */}
        <Box sx={{ mt: 2 }}>
          <TextField
            label={getSelectedStyleInfo()?.isCustom ? 'プロンプト（必須）' : '追加の指示（オプション）'}
            placeholder={
              getSelectedStyleInfo()?.isCustom
                ? '例: リビングにモダンなソファとテーブルを配置し、観葉植物を追加してください'
                : '例: ソファは青色にしてください'
            }
            fullWidth
            multiline
            rows={getSelectedStyleInfo()?.isCustom ? 3 : 2}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={isGenerating}
            required={getSelectedStyleInfo()?.isCustom}
            error={getSelectedStyleInfo()?.isCustom && !customPrompt.trim()}
            helperText={
              getSelectedStyleInfo()?.isCustom
                ? '画像に対して行いたい変更を自由に記述してください'
                : ''
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {isGenerating ? (
          <Button onClick={handleCancel} color="error">
            キャンセル
          </Button>
        ) : (
          <>
            <Button onClick={handleClose}>閉じる</Button>
            {generatedImage ? (
              <>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setGeneratedImage(null);
                    setProgress(0);
                  }}
                >
                  再生成
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveAndUse}
                  startIcon={<CheckIcon />}
                >
                  この画像を使用
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={!beforePhoto || (getSelectedStyleInfo()?.isCustom && !customPrompt.trim())}
                startIcon={<AiIcon />}
              >
                生成する
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AiStagingDialog;
