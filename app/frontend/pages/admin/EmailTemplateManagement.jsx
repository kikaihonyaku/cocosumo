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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import RichTextEditor from '../../components/shared/RichTextEditor';

export default function EmailTemplateManagement() {
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
    subject: '',
    body: '',
    position: 0,
  });

  // プレースホルダーのサンプル値
  const sampleValues = {
    '{{会社名}}': 'サンプル不動産株式会社',
    '{{担当者名}}': '山田 太郎',
    '{{お客様名}}': '鈴木 花子',
    '{{LINE友だち追加URL}}': 'https://line.me/R/ti/p/@example',
    '{{署名}}': '━━━━━━━━━━━━━━━━━━\nサンプル不動産株式会社\n山田 太郎\nTEL: 03-1234-5678\nEmail: yamada@example.com\n━━━━━━━━━━━━━━━━━━',
  };

  const replacePlaceholders = (text) => {
    if (!text) return '';
    let result = text;
    for (const [placeholder, value] of Object.entries(sampleValues)) {
      result = result.replaceAll(placeholder, value);
    }
    return result;
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/email_templates', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else if (response.status === 401) {
        window.location.href = '/login';
      } else {
        showSnackbar('メールテンプレート一覧の取得に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error fetching email templates:', error);
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
      subject: '',
      body: '',
      position: 0,
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      showSnackbar('テンプレート名を入力してください', 'error');
      return;
    }
    if (!formData.subject.trim()) {
      showSnackbar('件名を入力してください', 'error');
      return;
    }
    if (!formData.body.trim()) {
      showSnackbar('本文を入力してください', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/v1/email_templates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_template: { ...formData, body_format: 'html' } }),
      });

      if (response.ok) {
        showSnackbar('メールテンプレートを作成しました', 'success');
        setCreateDialogOpen(false);
        resetForm();
        fetchTemplates();
      } else {
        const error = await response.json();
        showSnackbar(error.errors?.join(', ') || 'メールテンプレートの作成に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error creating email template:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    // テキスト形式の場合、改行をHTMLに変換してエディタで表示
    const bodyHtml = template.body_format === 'html'
      ? template.body
      : (template.body || '').split('\n').map(line => `<p>${line || '<br>'}</p>`).join('');
    setFormData({
      name: template.name,
      subject: template.subject,
      body: bodyHtml,
      position: template.position || 0,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      showSnackbar('テンプレート名を入力してください', 'error');
      return;
    }
    if (!formData.subject.trim()) {
      showSnackbar('件名を入力してください', 'error');
      return;
    }
    if (!formData.body.trim()) {
      showSnackbar('本文を入力してください', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/v1/email_templates/${selectedTemplate.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_template: { ...formData, body_format: 'html' } }),
      });

      if (response.ok) {
        showSnackbar('メールテンプレートを更新しました', 'success');
        setEditDialogOpen(false);
        resetForm();
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        const error = await response.json();
        showSnackbar(error.errors?.join(', ') || 'メールテンプレートの更新に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error updating email template:', error);
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
      const response = await fetch(`/api/v1/email_templates/${selectedTemplate.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        showSnackbar('メールテンプレートを削除しました', 'success');
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        showSnackbar('メールテンプレートの削除に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error deleting email template:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setSubmitting(false);
    }
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
      <TextField
        label="件名"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        fullWidth
        required
      />
      <RichTextEditor
        label="本文 *"
        value={formData.body}
        onChange={(val) => setFormData({ ...formData, body: val })}
        placeholder="メールテンプレートの本文を入力してください..."
        minHeight={200}
      />
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
          <DescriptionIcon fontSize="large" color="primary" />
          <Typography variant="h4" component="h1">
            メールテンプレート管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
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
                <TableCell>件名</TableCell>
                <TableCell>本文</TableCell>
                <TableCell align="center">並び順</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                    メールテンプレートがありません。新規作成ボタンからテンプレートを作成してください。
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
                      <Typography variant="body2">
                        {template.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }} noWrap>
                        {(() => {
                          const text = template.body_format === 'html'
                            ? template.body?.replace(/<[^>]*>/g, '') || ''
                            : template.body || '';
                          return text.length > 50 ? `${text.substring(0, 50)}...` : text;
                        })()}
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
        <DialogTitle>新規メールテンプレート作成</DialogTitle>
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
            disabled={submitting || !formData.name.trim() || !formData.subject.trim() || !formData.body.trim()}
            startIcon={submitting && <CircularProgress size={20} />}
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
        <DialogTitle>メールテンプレートの編集</DialogTitle>
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
            disabled={submitting || !formData.name.trim() || !formData.subject.trim() || !formData.body.trim()}
            startIcon={submitting && <CircularProgress size={20} />}
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
        <DialogTitle>メールテンプレートの削除</DialogTitle>
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
                <Typography variant="caption" color="text.secondary">件名</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">
                    {replacePlaceholders(previewTemplate.subject)}
                  </Typography>
                </Paper>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">本文</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: 'grey.50' }}>
                  {previewTemplate.body_format === 'html' ? (
                    <Box
                      sx={{
                        fontSize: '0.875rem', lineHeight: 1.8,
                        '& p': { margin: '0 0 0.5em 0' },
                        '& h2': { fontSize: '1.25rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
                        '& h3': { fontSize: '1.1rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
                        '& ul, & ol': { paddingLeft: '1.5em', margin: '0.5em 0' },
                        '& blockquote': { borderLeft: '3px solid #ccc', paddingLeft: '1em', margin: '0.5em 0', fontStyle: 'italic' },
                        '& a': { color: 'primary.main', textDecoration: 'underline' },
                      }}
                      dangerouslySetInnerHTML={{ __html: replacePlaceholders(previewTemplate.body) }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.8 }}>
                      {replacePlaceholders(previewTemplate.body)}
                    </Typography>
                  )}
                </Paper>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">使用中のプレースホルダー</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {Object.keys(sampleValues).map((placeholder) => {
                    const used = (previewTemplate.subject + previewTemplate.body).includes(placeholder);
                    return used ? (
                      <Typography
                        key={placeholder}
                        variant="caption"
                        sx={{
                          px: 1, py: 0.25, borderRadius: 1,
                          bgcolor: 'primary.50', color: 'primary.main',
                          border: '1px solid', borderColor: 'primary.200',
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
