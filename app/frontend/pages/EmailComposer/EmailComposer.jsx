import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Paper, TextField, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Typography, useMediaQuery, useTheme,
  Drawer, Button
} from '@mui/material';
import {
  Home as HomeIcon,
  Restore as RestoreIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

import useEmailComposer from './useEmailComposer';
import EmailComposerHeader from './EmailComposerHeader';
import EmailComposerToolbar from './EmailComposerToolbar';
import EmailEditorArea from './EmailEditorArea';
import EmailSidebar from './EmailSidebar';
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
    <EmailSidebar
      propertyPhotos={composer.propertyPhotos}
      photosLoading={composer.photosLoading}
      editor={editorInstance}
      roomContent={composer.roomContent}
      roomContentLoading={composer.roomContentLoading}
      onLoadRoomContent={composer.loadRoomContent}
      customerAccesses={composer.customerAccesses}
      customerAccessesLoading={composer.customerAccessesLoading}
      isMobile={isMobile}
    />
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
            mr: isLargeScreen ? 0.5 : 0,
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

        {/* Edge rail for small/medium screens - full height sidebar toggle */}
        {!isLargeScreen && !sidebarOpen && (
          <Box
            onClick={toggleSidebar}
            sx={{
              width: 40,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              my: 1,
              bgcolor: 'grey.600',
              color: 'white',
              borderRadius: '0 8px 8px 0',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'grey.700',
              },
              transition: 'all 0.15s',
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 20 }} />
            <Typography
              variant="caption"
              sx={{
                writingMode: 'vertical-rl',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: 'inherit',
              }}
            >
              挿入
            </Typography>
          </Box>
        )}

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
              '& .MuiAccordion-root': { bgcolor: 'transparent', color: 'text.primary' },
              '& .MuiAccordionSummary-root': { bgcolor: 'transparent' },
              '& .MuiAccordionSummary-expandIconWrapper': { color: 'text.secondary' },
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
            PaperProps={{
              sx: {
                width: 300,
                bgcolor: 'white',
                color: 'text.primary',
                '& .MuiAccordion-root': { bgcolor: 'transparent', color: 'text.primary' },
                '& .MuiAccordionSummary-root': { bgcolor: 'transparent' },
                '& .MuiAccordionSummary-expandIconWrapper': { color: 'text.secondary' },
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Button size="small" onClick={() => setSidebarOpen(false)} startIcon={<CloseIcon />} sx={{ color: 'grey.700' }}>
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
