import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Collapse
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import axios from 'axios';

import SimulationQuotaIndicator from './SimulationQuotaIndicator';
import ImageSimulationPhotoSelector from './ImageSimulationPhotoSelector';
import ImageSimulationPromptPanel from './ImageSimulationPromptPanel';
import ImageSimulationResult from './ImageSimulationResult';

export default function ImageSimulationSection({
  accessToken,
  photos = [],
  buildingPhotos = [],
  isMobile
}) {
  const [expanded, setExpanded] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [quota, setQuota] = useState({ remaining: 10, daily_limit: 10, used_today: 0 });
  const [quotaLoading, setQuotaLoading] = useState(true);

  const steps = ['画像を選択', 'シミュレーション内容を選択', '結果を確認'];

  // 残り回数を取得
  const fetchQuota = useCallback(async () => {
    try {
      setQuotaLoading(true);
      const response = await axios.get(`/api/v1/customer/${accessToken}/image_simulations/quota`);
      setQuota(response.data);
    } catch (err) {
      console.error('Failed to fetch quota:', err);
    } finally {
      setQuotaLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // 画像選択ハンドラー
  const handlePhotoSelect = (photo) => {
    setSelectedPhoto(photo);
    setActiveStep(1);
    setResult(null);
    setError(null);
  };

  // プロンプト選択ハンドラー
  const handlePromptChange = (prompt) => {
    setSelectedPrompt(prompt);
  };

  // シミュレーション実行
  const handleSimulate = async () => {
    if (!selectedPhoto || !selectedPrompt) return;

    if (quota.remaining <= 0) {
      setError('本日の利用回数上限に達しました（1日10回まで）');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStep(2);

    try {
      const response = await axios.post(`/api/v1/customer/${accessToken}/image_simulations`, {
        source_photo_type: selectedPhoto.type,
        source_photo_id: selectedPhoto.id,
        prompt: selectedPrompt.prompt
      });

      if (response.data.success) {
        setResult({
          imageUrl: response.data.simulation.result_image_data_url,
          prompt: selectedPrompt.label
        });
        setQuota(prev => ({
          ...prev,
          remaining: response.data.remaining,
          used_today: prev.daily_limit - response.data.remaining
        }));
      } else {
        setError(response.data.error || 'シミュレーションに失敗しました');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || 'シミュレーション実行中にエラーが発生しました';
      setError(errorMessage);

      // 残り回数を更新
      if (err.response?.data?.remaining !== undefined) {
        setQuota(prev => ({
          ...prev,
          remaining: err.response.data.remaining
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  // リセット
  const handleReset = () => {
    setActiveStep(0);
    setSelectedPhoto(null);
    setSelectedPrompt(null);
    setCustomPrompt('');
    setResult(null);
    setError(null);
  };

  // 別の画像でやり直し
  const handleChangePhoto = () => {
    setActiveStep(0);
    setSelectedPhoto(null);
    setResult(null);
    setError(null);
  };

  // 別のシミュレーションを試す
  const handleChangePrompt = () => {
    setActiveStep(1);
    setSelectedPrompt(null);
    setCustomPrompt('');
    setResult(null);
    setError(null);
  };

  const canSimulate = selectedPhoto && selectedPrompt && quota.remaining > 0 && !loading;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, #fce4ec 0%, #e8eaf6 100%)'
      }}
    >
      {/* ヘッダー */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44,
            height: 44,
            bgcolor: 'secondary.100',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AutoFixHighIcon sx={{ color: 'secondary.main', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.35rem' }}>
              AIイメージシミュレーション
            </Typography>
            <Typography variant="caption" color="text.secondary">
              AIで物件画像の様々なシチュエーションを体験
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!quotaLoading && (
            <SimulationQuotaIndicator
              remaining={quota.remaining}
              dailyLimit={quota.daily_limit}
              size="small"
            />
          )}
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 3 }}>
          {/* 残り回数インジケーター（詳細版） */}
          {!quotaLoading && (
            <Box sx={{ mb: 3 }}>
              <SimulationQuotaIndicator
                remaining={quota.remaining}
                dailyLimit={quota.daily_limit}
                size="medium"
              />
            </Box>
          )}

          {/* 残り回数が0の場合の警告 */}
          {quota.remaining === 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              本日の利用回数上限に達しました。明日0時以降に再度お試しください。
            </Alert>
          )}

          {/* ステッパー */}
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {steps.map((label, index) => (
              <Step key={label} completed={index < activeStep}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Divider sx={{ mb: 3 }} />

          {/* Step 0: 画像選択 */}
          {activeStep === 0 && (
            <ImageSimulationPhotoSelector
              propertyPhotos={photos}
              buildingPhotos={buildingPhotos}
              selectedPhoto={selectedPhoto}
              onSelect={handlePhotoSelect}
              isMobile={isMobile}
            />
          )}

          {/* Step 1: プロンプト選択 */}
          {activeStep === 1 && (
            <Box>
              {/* 選択された画像のプレビュー */}
              {selectedPhoto && (
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="img"
                    src={selectedPhoto.url}
                    alt="選択した画像"
                    sx={{
                      width: 100,
                      height: 75,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '2px solid',
                      borderColor: 'primary.main'
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      選択中の画像
                    </Typography>
                    <Button
                      size="small"
                      onClick={handleChangePhoto}
                      sx={{ textTransform: 'none', p: 0 }}
                    >
                      変更する
                    </Button>
                  </Box>
                </Box>
              )}

              <ImageSimulationPromptPanel
                selectedPrompt={selectedPrompt}
                onPromptChange={handlePromptChange}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
                disabled={quota.remaining === 0}
                isMobile={isMobile}
              />

              {/* シミュレーション実行ボタン */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleSimulate}
                  disabled={!canSimulate}
                  startIcon={<AutoFixHighIcon />}
                  sx={{ flex: 1, py: 1.5 }}
                >
                  シミュレーション実行
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: 結果表示 */}
          {activeStep === 2 && (
            <Box>
              <ImageSimulationResult
                originalImageUrl={selectedPhoto?.url}
                resultImageUrl={result?.imageUrl}
                prompt={result?.prompt}
                loading={loading}
                error={error}
                isMobile={isMobile}
              />

              {/* アクションボタン */}
              {!loading && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {result && (
                    <Button
                      variant="outlined"
                      onClick={handleChangePrompt}
                      disabled={quota.remaining === 0}
                    >
                      別のシミュレーションを試す
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    onClick={handleChangePhoto}
                  >
                    別の画像を選ぶ
                  </Button>
                  <Button
                    variant="text"
                    onClick={handleReset}
                  >
                    最初からやり直す
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
