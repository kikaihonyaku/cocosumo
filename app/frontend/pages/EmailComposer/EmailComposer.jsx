import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Paper, TextField, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Typography, useMediaQuery, useTheme,
  Drawer, Snackbar, Button, Chip, Divider
} from '@mui/material';
import {
  Home as HomeIcon,
  Restore as RestoreIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import useEmailComposer from './useEmailComposer';
import EmailComposerHeader from './EmailComposerHeader';
import EmailComposerToolbar from './EmailComposerToolbar';
import EmailEditorArea from './EmailEditorArea';
import PropertyImagePicker from './PropertyImagePicker';
import PropertyCardInserter from './PropertyCardInserter';
import AttachmentPanel from './AttachmentPanel';
import EmailConfirmDialog from './EmailConfirmDialog';

export default function EmailComposer() {
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId');
  const inquiryId = searchParams.get('inquiryId');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const [editorInstance, setEditorInstance] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const composer = useEmailComposer({ customerId, inquiryId });

  const handleBack = useCallback(() => {
    if (customerId) {
      // Try to close tab if opened via window.open
      if (window.opener) {
        window.close();
      } else {
        window.location.href = `/customers/${customerId}`;
      }
    }
  }, [customerId]);

  const handleEditorReady = useCallback((editor) => {
    setEditorInstance(editor);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  if (!customerId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">顧客IDが指定されていません</Alert>
      </Box>
    );
  }

  if (composer.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (composer.error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">{composer.error}</Alert>
      </Box>
    );
  }

  // Build inquiry label
  const getInquiryLabel = (inq) => {
    const piNames = (inq.property_inquiries || [])
      .map(pi => pi.property_title || (pi.room?.building_name ? `${pi.room.building_name} ${pi.room.room_number || ''}`.trim() : null))
      .filter(Boolean);
    return piNames.length > 0
      ? `案件 #${inq.id} - ${piNames.join(', ')}`
      : `案件 #${inq.id}`;
  };

  const sidebarContent = (
    <Box sx={{ width: isMobile ? 300 : '100%', height: '100%', overflow: 'auto' }}>
      <PropertyImagePicker
        propertyPhotos={composer.propertyPhotos}
        photosLoading={composer.photosLoading}
        editor={editorInstance}
      />
      <Divider sx={{ my: 1 }} />
      <PropertyCardInserter
        propertyPhotos={composer.propertyPhotos}
        editor={editorInstance}
      />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'grey.100' }}>
      {/* Header */}
      <EmailComposerHeader
        customer={composer.customer}
        draftSaving={composer.draftSaving}
        draftSavedAt={composer.draftSavedAt}
        sending={composer.sending}
        sent={composer.sent}
        onBack={handleBack}
        onSaveDraft={composer.saveDraft}
        onSendClick={composer.handleSendClick}
        isMobile={isMobile}
      />

      {/* Draft restore banner */}
      {composer.draftRestorePrompt && (
        <Alert
          severity="info"
          sx={{ borderRadius: 0, py: 0.5 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<RestoreIcon />}
                onClick={() => composer.restoreDraft(composer.draftRestorePrompt)}
              >
                復元
              </Button>
              <Button size="small" color="inherit" onClick={composer.dismissDraftRestore}>
                無視
              </Button>
            </Box>
          }
        >
          前回の下書きがあります（{composer.draftRestorePrompt.updated_at}）
        </Alert>
      )}

      {/* Error banner */}
      {composer.sendError && (
        <Alert
          severity="error"
          sx={{ borderRadius: 0, py: 0.5 }}
          onClose={() => composer.setSendError(null)}
        >
          {composer.sendError}
        </Alert>
      )}

      {/* Success banner */}
      {composer.sent && (
        <Alert severity="success" sx={{ borderRadius: 0, py: 0.5 }}>
          メールを送信しました。このタブを閉じて顧客詳細に戻れます。
        </Alert>
      )}

      {/* Inquiry & Subject row */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          px: 2,
          py: 1,
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}
      >
        <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 280 }}>
          <InputLabel>案件</InputLabel>
          <Select
            value={composer.selectedInquiryId}
            label="案件"
            onChange={(e) => composer.setSelectedInquiryId(e.target.value)}
            disabled={composer.sent}
          >
            {composer.inquiries.map(inq => (
              <MenuItem key={inq.id} value={inq.id}>
                {getInquiryLabel(inq)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="件名"
          value={composer.subject}
          onChange={(e) => composer.setSubject(e.target.value)}
          fullWidth
          size="small"
          required
          disabled={composer.sent}
        />
      </Box>

      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor column */}
        <Paper
          elevation={1}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            m: 1,
            mr: isLargeScreen ? 0.5 : 1,
            borderRadius: 2,
          }}
        >
          {/* Toolbar */}
          <EmailComposerToolbar
            editor={editorInstance}
            templates={composer.templates}
            onApplyTemplate={composer.applyTemplate}
            onToggleImagePicker={toggleSidebar}
            isMobile={isMobile}
          />

          {/* Editor */}
          <EmailEditorArea
            value={composer.body}
            onChange={composer.setBody}
            signature={composer.signature}
            onEditorReady={handleEditorReady}
          />

          {/* Attachments */}
          <AttachmentPanel
            attachments={composer.attachments}
            onAddAttachments={composer.addAttachments}
            onRemoveAttachment={composer.removeAttachment}
            totalAttachmentSize={composer.totalAttachmentSize}
            isMobile={isMobile}
          />
        </Paper>

        {/* Sidebar - Desktop large screen: fixed panel */}
        {isLargeScreen && (
          <Paper
            elevation={1}
            sx={{
              width: 300,
              flexShrink: 0,
              overflow: 'auto',
              m: 1,
              ml: 0.5,
              borderRadius: 2,
              display: sidebarOpen || isLargeScreen ? 'block' : 'none',
            }}
          >
            {sidebarContent}
          </Paper>
        )}

        {/* Sidebar - Drawer for mobile & medium screens */}
        {!isLargeScreen && (
          <Drawer
            anchor="right"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            PaperProps={{ sx: { width: 300 } }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
              <Button size="small" onClick={() => setSidebarOpen(false)} startIcon={<CloseIcon />}>
                閉じる
              </Button>
            </Box>
            {sidebarContent}
          </Drawer>
        )}
      </Box>

      {/* Confirm dialog */}
      <EmailConfirmDialog
        open={composer.confirmOpen}
        onClose={() => composer.setConfirmOpen(false)}
        onConfirm={composer.sendEmail}
        customer={composer.customer}
        subject={composer.subject}
        attachmentCount={composer.attachments.length}
      />
    </Box>
  );
}
