import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Collapse
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import CurtainsIcon from '@mui/icons-material/Curtains';
import ChairIcon from '@mui/icons-material/Chair';
import ForestIcon from '@mui/icons-material/Forest';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';

const PRESET_PROMPTS = [
  {
    id: 'night',
    label: '夜の外観',
    icon: NightsStayIcon,
    prompt: '空を夕暮れから夜の色に変更し、建物の窓から室内の照明が漏れている様子を追加してください。建物自体の形状や色は変更せず、空と照明のみを編集してください。',
    category: '時間帯'
  },
  {
    id: 'spring',
    label: '春の風景',
    icon: LocalFloristIcon,
    prompt: '写真に写っている樹木や植栽を桜や春の花に変更してください。建物や構造物は一切変更せず、植物部分のみを編集してください。',
    category: '季節'
  },
  {
    id: 'curtain_white',
    label: 'カーテン（白）',
    icon: CurtainsIcon,
    prompt: '窓に白いレースカーテンを追加してください。窓枠や壁、その他の要素は変更せず、カーテンのみを自然に追加してください。',
    category: 'インテリア'
  },
  {
    id: 'modern_furniture',
    label: 'モダン家具',
    icon: ChairIcon,
    prompt: '空いている床のスペースに、シンプルなソファとローテーブルを配置してください。壁、床、窓などの既存の要素は変更せず、家具のみを追加してください。',
    category: 'インテリア'
  },
  {
    id: 'natural_furniture',
    label: 'ナチュラル家具',
    icon: ForestIcon,
    prompt: '空いている床のスペースに、木製のダイニングテーブルと椅子を配置してください。壁、床、窓などの既存の要素は変更せず、家具のみを追加してください。',
    category: 'インテリア'
  },
  {
    id: 'clean',
    label: '空室クリーン',
    icon: CleaningServicesIcon,
    prompt: '床や壁の汚れを除去し、清掃後の清潔な状態にしてください。部屋の構造や間取りは変更せず、表面の汚れのみを除去してください。',
    category: 'その他'
  }
];

export default function ImageSimulationPromptPanel({
  selectedPrompt,
  onPromptChange,
  customPrompt,
  onCustomPromptChange,
  disabled,
  isMobile
}) {
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetSelect = (preset) => {
    onPromptChange(preset);
    onCustomPromptChange('');
    setShowCustom(false);
  };

  const handleCustomToggle = () => {
    setShowCustom(!showCustom);
    if (!showCustom) {
      onPromptChange(null);
    }
  };

  const handleCustomSubmit = () => {
    if (customPrompt.trim()) {
      onPromptChange({ id: 'custom', label: 'カスタム', prompt: customPrompt.trim() });
    }
  };

  // カテゴリでグループ化
  const categories = [...new Set(PRESET_PROMPTS.map(p => p.category))];

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        シミュレーション内容を選択
      </Typography>

      {/* プリセット選択 */}
      {categories.map(category => (
        <Box key={category} sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {category}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {PRESET_PROMPTS.filter(p => p.category === category).map(preset => {
              const Icon = preset.icon;
              const isSelected = selectedPrompt?.id === preset.id;
              return (
                <Chip
                  key={preset.id}
                  icon={<Icon sx={{ fontSize: 18 }} />}
                  label={preset.label}
                  onClick={() => handlePresetSelect(preset)}
                  disabled={disabled}
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  sx={{
                    cursor: disabled ? 'default' : 'pointer',
                    '&:hover': disabled ? {} : {
                      bgcolor: isSelected ? 'primary.main' : 'primary.50',
                    }
                  }}
                />
              );
            })}
          </Box>
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      {/* カスタムプロンプト */}
      <Box>
        <Button
          size="small"
          onClick={handleCustomToggle}
          endIcon={showCustom ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          disabled={disabled}
          sx={{ textTransform: 'none', mb: 1 }}
        >
          カスタムプロンプトで指定
        </Button>

        <Collapse in={showCustom}>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="例: 窓にブラインドを追加して、午後の日差しが差し込む様子にしてください。"
              value={customPrompt}
              onChange={(e) => onCustomPromptChange(e.target.value)}
              disabled={disabled}
              sx={{ mb: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleCustomSubmit}
              disabled={disabled || !customPrompt.trim()}
            >
              このプロンプトを使用
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              不動産物件のイメージシミュレーションに適した内容を入力してください。
            </Typography>
          </Box>
        </Collapse>
      </Box>

      {/* 選択中のプロンプト表示 */}
      {selectedPrompt && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
          <Typography variant="body2" color="primary.main" fontWeight="bold" gutterBottom>
            選択中: {selectedPrompt.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedPrompt.prompt}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
