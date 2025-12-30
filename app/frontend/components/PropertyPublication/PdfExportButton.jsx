import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { PictureAsPdf as PdfIcon, Download as DownloadIcon } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PropertyAnalytics } from '../../services/analytics';

// PDF出力設定
const PDF_FORMATS = {
  a4: { name: 'A4（標準）', width: 210, height: 297 },
  a3: { name: 'A3（大判）', width: 297, height: 420 },
  letter: { name: 'レター', width: 216, height: 279 }
};

export default function PdfExportButton({
  title = '物件情報',
  targetElementId = 'top',
  publicationId,
  variant = 'outlined',
  size = 'medium',
  fullWidth = false
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('a4');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleOpen = () => {
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    if (!generating) {
      setOpen(false);
    }
  };

  const generatePdf = async () => {
    setGenerating(true);
    setProgress(10);
    setError(null);

    try {
      // 対象要素を取得
      const element = document.getElementById(targetElementId);
      if (!element) {
        throw new Error('PDF生成対象の要素が見つかりません');
      }

      setProgress(20);

      // 印刷用のスタイルを一時的に適用
      const originalStyle = element.style.cssText;
      element.style.backgroundColor = 'white';

      // html2canvasでキャプチャ
      const canvas = await html2canvas(element, {
        scale: 2, // 高解像度
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // クローンされたドキュメントから不要な要素を非表示
          const noPrintElements = clonedDoc.querySelectorAll('.no-print');
          noPrintElements.forEach(el => {
            el.style.display = 'none';
          });
        }
      });

      setProgress(60);

      // スタイルを元に戻す
      element.style.cssText = originalStyle;

      // PDF設定
      const formatConfig = PDF_FORMATS[format];
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [formatConfig.width, formatConfig.height]
      });

      setProgress(70);

      // 画像をPDFに追加
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // アスペクト比を維持しながらサイズを計算
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const width = imgWidth * ratio;
      const height = imgHeight * ratio;

      // 中央揃え
      const x = (pdfWidth - width) / 2;
      const y = 0;

      // 複数ページに分割（必要な場合）
      const pageHeight = pdfHeight;
      let currentY = 0;
      let pageCount = 0;

      while (currentY < height) {
        if (pageCount > 0) {
          pdf.addPage();
        }

        // クリッピングして描画
        pdf.addImage(
          imgData,
          'JPEG',
          x,
          -currentY,
          width,
          height
        );

        currentY += pageHeight;
        pageCount++;

        // 最大20ページまで
        if (pageCount >= 20) break;
      }

      setProgress(90);

      // ファイル名を生成
      const fileName = `${title.replace(/[\\/:*?"<>|]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      // PDFをダウンロード
      pdf.save(fileName);

      setProgress(100);

      // トラッキング（PDF出力イベント）
      if (publicationId) {
        // GA4トラッキング
        PropertyAnalytics.exportPdf(publicationId, format, pageCount);

        // サーバーサイドトラッキング（API経由）
        try {
          await fetch(`/api/v1/property_publications/${publicationId}/track_analytics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_type: 'pdf_export', format, page_count: pageCount })
          });
        } catch (e) {
          // トラッキングエラーは無視
        }
      }

      // 成功後に閉じる
      setTimeout(() => {
        setOpen(false);
        setGenerating(false);
        setProgress(0);
      }, 500);

    } catch (err) {
      console.error('PDF generation error:', err);
      setError(err.message || 'PDF生成中にエラーが発生しました');
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        startIcon={<PdfIcon />}
        onClick={handleOpen}
        className="no-print"
        aria-label="物件情報をPDFとして保存"
        aria-haspopup="dialog"
      >
        PDF保存
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        aria-labelledby="pdf-export-dialog-title"
        aria-describedby="pdf-export-dialog-description"
      >
        <DialogTitle id="pdf-export-dialog-title">PDF出力</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl component="fieldset" disabled={generating}>
            <FormLabel component="legend" id="pdf-export-dialog-description">
              用紙サイズを選択してください
            </FormLabel>
            <RadioGroup
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {Object.entries(PDF_FORMATS).map(([key, config]) => (
                <FormControlLabel
                  key={key}
                  value={key}
                  control={<Radio />}
                  label={config.name}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {generating && (
            <Box sx={{ mt: 2 }} role="status" aria-live="polite">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                PDF生成中...
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                aria-label={`PDF生成進捗: ${progress}%`}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={generating}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={generatePdf}
            disabled={generating}
          >
            {generating ? '生成中...' : 'ダウンロード'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
