import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Chat as ChatIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const MESSAGE_TYPE_LABELS = {
  text: 'テキスト',
  image: '画像',
  flex: 'Flex Message',
};

const MESSAGE_TYPE_COLORS = {
  text: 'default',
  image: 'info',
  flex: 'secondary',
};

// プレースホルダーのサンプル値
const sampleValues = {
  '{{お客様名}}': '鈴木 花子',
  '{{会社名}}': 'サンプル不動産株式会社',
  '{{担当者名}}': '山田 太郎',
  '{{物件名}}': 'サンプルマンション 301号室',
};

export default function LineTemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitting, setSubmitting] = useState(false);

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    message_type: 'text',
    content: '',
    image_url: '',
    flex_alt_text: '',
    position: 0,
  });

  const replacePlaceholders = (text) => {
    if (!text) return '';
    let result = text;
    for (const [placeholder, value] of Object.entries(sampleValues)) {
      result = result.replaceAll(placeholder, value);
    }
    return result;
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/line_templates', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else if (response.status === 401) {
        window.location.href = '/login';
      } else {
        showSnackbar('LINEテンプレート一覧の取得に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error fetching LINE templates:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      message_type: 'text',
      content: '',
      image_url: '',
      flex_alt_text: '',
      position: 0,
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      showSnackbar('テンプレート名を入力してください', 'error');
      return;
    }
    if (!formData.content.trim()) {
      showSnackbar('内容を入力してください', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/v1/line_templates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_template: formData }),
      });

      if (response.ok) {
        showSnackbar('LINEテンプレートを作成しました', 'success');
        setCreateDialogOpen(false);
        resetForm();
        fetchTemplates();
      } else {
        const error = await response.json();
        showSnackbar(error.errors?.join(', ') || 'LINEテンプレートの作成に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error creating LINE template:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      message_type: template.message_type,
      content: template.content,
      image_url: template.image_url || '',
      flex_alt_text: template.flex_alt_text || '',
      position: template.position || 0,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      showSnackbar('テンプレート名を入力してください', 'error');
      return;
    }
    if (!formData.content.trim()) {
      showSnackbar('内容を入力してください', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/v1/line_templates/${selectedTemplate.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_template: formData }),
      });

      if (response.ok) {
        showSnackbar('LINEテンプレートを更新しました', 'success');
        setEditDialogOpen(false);
        resetForm();
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        const error = await response.json();
        showSnackbar(error.errors?.join(', ') || 'LINEテンプレートの更新に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error updating LINE template:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (template) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/v1/line_templates/${selectedTemplate.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        showSnackbar('LINEテンプレートを削除しました', 'success');
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        showSnackbar('LINEテンプレートの削除に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error deleting LINE template:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const renderFormFields = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      <TextField
        label="テンプレート名"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        fullWidth
        required
        autoFocus
      />
      <FormControl fullWidth>
        <InputLabel>メッセージタイプ</InputLabel>
        <Select
          value={formData.message_type}
          label="メッセージタイプ"
          onChange={(e) => setFormData({ ...formData, message_type: e.target.value })}
        >
          <MenuItem value="text">テキスト</MenuItem>
          <MenuItem value="image">画像</MenuItem>
          <MenuItem value="flex">Flex Message</MenuItem>
        </Select>
      </FormControl>

      {formData.message_type === 'text' && (
        <TextField
          label="メッセージ内容"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          fullWidth
          required
          multiline
          rows={8}
          placeholder="LINEで送信するメッセージを入力...&#10;&#10;プレースホルダー: {{お客様名}}, {{会社名}}, {{担当者名}}, {{物件名}}"
          helperText="プレースホルダー: {{お客様名}}, {{会社名}}, {{担当者名}}, {{物件名}}"
        />
      )}

      {formData.message_type === 'image' && (
        <>
          <TextField
            label="画像URL"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value, content: e.target.value || '画像' })}
            fullWidth
            required
            placeholder="https://example.com/image.jpg"
            helperText="HTTPS URLのみ対応"
          />
          <TextField
            label="説明テキスト"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            fullWidth
            required
          />
        </>
      )}

      {formData.message_type === 'flex' && (
        <>
          <TextField
            label="Flex Message JSON"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            fullWidth
            required
            multiline
            rows={12}
            placeholder='{"type": "bubble", "body": {"type": "box", ...}}'
            helperText="LINE Flex Message Simulator で作成したJSONを貼り付けてください"
            sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
          />
          <TextField
            label="代替テキスト"
            value={formData.flex_alt_text}
            onChange={(e) => setFormData({ ...formData, flex_alt_text: e.target.value })}
            fullWidth
            placeholder="通知に表示されるテキスト"
            helperText="Flex Messageを表示できない端末で表示されます"
          />
        </>
      )}

      <TextField
        label="並び順"
        value={formData.position}
        onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value, 10) || 0 })}
        fullWidth
        type="number"
        helperText="数値が小さいほど先に表示されます"
      />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatIcon fontSize="large" sx={{ color: '#06C755' }} />
          <Typography variant="h4" component="h1">
            LINEテンプレート管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { resetForm(); setCreateDialogOpen(true); }}
          sx={{ bgcolor: '#06C755', '&:hover': { bgcolor: '#05b04c' } }}
        >
          新規テンプレート作成
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>テンプレート名</TableCell>
                <TableCell>タイプ</TableCell>
                <TableCell>内容</TableCell>
                <TableCell align="center">並び順</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                    LINEテンプレートがありません。新規作成ボタンからテンプレートを作成してください。
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {template.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={MESSAGE_TYPE_LABELS[template.message_type] || template.message_type}
                        color={MESSAGE_TYPE_COLORS[template.message_type] || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }} noWrap>
                        {template.content?.length > 50 ? `${template.content.substring(0, 50)}...` : template.content}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{template.position}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handlePreview(template)}
                        title="プレビュー"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(template)}
                        title="編集"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(template)}
                        title="削除"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 新規作成ダイアログ */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !submitting && setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>新規LINEテンプレート作成</DialogTitle>
        <DialogContent>
          {renderFormFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
            キャンセル
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={submitting || !formData.name.trim() || !formData.content.trim()}
            startIcon={submitting && <CircularProgress size={20} />}
            sx={{ bgcolor: '#06C755', '&:hover': { bgcolor: '#05b04c' } }}
          >
            {submitting ? '作成中...' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !submitting && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>LINEテンプレートの編集</DialogTitle>
        <DialogContent>
          {renderFormFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>
            キャンセル
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={submitting || !formData.name.trim() || !formData.content.trim()}
            startIcon={submitting && <CircularProgress size={20} />}
            sx={{ bgcolor: '#06C755', '&:hover': { bgcolor: '#05b04c' } }}
          >
            {submitting ? '更新中...' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !submitting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>LINEテンプレートの削除</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            「{selectedTemplate?.name}」を削除しますか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
            キャンセル
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={20} />}
          >
            {submitting ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* プレビューダイアログ */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          テンプレートプレビュー：{previewTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Alert severity="info" sx={{ mb: 1 }}>
                プレースホルダーをサンプル値で置換して表示しています
              </Alert>
              <Box>
                <Typography variant="caption" color="text.secondary">タイプ</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={MESSAGE_TYPE_LABELS[previewTemplate.message_type] || previewTemplate.message_type}
                    color={MESSAGE_TYPE_COLORS[previewTemplate.message_type] || 'default'}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">内容</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: 'grey.50' }}>
                  {previewTemplate.message_type === 'flex' ? (
                    <Box sx={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(previewTemplate.content), null, 2);
                        } catch {
                          return previewTemplate.content;
                        }
                      })()}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                      {replacePlaceholders(previewTemplate.content)}
                    </Typography>
                  )}
                </Paper>
              </Box>
              {previewTemplate.message_type === 'flex' && previewTemplate.flex_alt_text && (
                <Box>
                  <Typography variant="caption" color="text.secondary">代替テキスト</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {replacePlaceholders(previewTemplate.flex_alt_text)}
                    </Typography>
                  </Paper>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">使用中のプレースホルダー</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {Object.keys(sampleValues).map((placeholder) => {
                    const text = previewTemplate.content + (previewTemplate.flex_alt_text || '');
                    const used = text.includes(placeholder);
                    return used ? (
                      <Typography
                        key={placeholder}
                        variant="caption"
                        sx={{
                          px: 1, py: 0.25, borderRadius: 1,
                          bgcolor: '#e8f5e9', color: '#06C755',
                          border: '1px solid', borderColor: '#a5d6a7',
                        }}
                      >
                        {placeholder}
                      </Typography>
                    ) : null;
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            閉じる
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setPreviewDialogOpen(false);
              handleEdit(previewTemplate);
            }}
            sx={{ bgcolor: '#06C755', '&:hover': { bgcolor: '#05b04c' } }}
          >
            編集する
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
