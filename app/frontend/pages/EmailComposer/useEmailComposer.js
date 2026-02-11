import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AUTOSAVE_DELAY = 30000; // 30秒

export default function useEmailComposer({ customerId, inquiryId: initialInquiryId }) {
  // Customer & inquiry data
  const [customer, setCustomer] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState(initialInquiryId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Email fields
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [signature, setSignature] = useState('');

  // Templates
  const [templates, setTemplates] = useState([]);

  // Draft
  const [draftId, setDraftId] = useState(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [draftRestorePrompt, setDraftRestorePrompt] = useState(null);

  // Attachments (client-side files before send)
  const [attachments, setAttachments] = useState([]);

  // Property photos for picker
  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Send state
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sent, setSent] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Autosave timer ref
  const autosaveTimerRef = useRef(null);
  const lastSavedContentRef = useRef('');

  // Load customer, inquiries, templates, signature, and check for existing draft
  useEffect(() => {
    if (!customerId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [customerRes, inquiriesRes, templatesRes, profileRes, draftsRes] = await Promise.all([
          axios.get(`/api/v1/customers/${customerId}`),
          axios.get(`/api/v1/customers/${customerId}/inquiries`),
          axios.get('/api/v1/email_templates').catch(() => ({ data: [] })),
          axios.get('/api/v1/auth/profile'),
          axios.get(`/api/v1/customers/${customerId}/email_drafts`).catch(() => ({ data: [] }))
        ]);

        setCustomer(customerRes.data);
        const inqs = Array.isArray(inquiriesRes.data) ? inquiriesRes.data : [];
        setInquiries(inqs);
        setTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);

        // Set signature
        const userSignature = profileRes.data?.user?.email_signature || '';
        setSignature(userSignature);

        // Auto-select inquiry
        if (initialInquiryId) {
          setSelectedInquiryId(initialInquiryId);
        } else if (inqs.length > 0) {
          setSelectedInquiryId(inqs[0].id);
        }

        // Check for existing draft
        const drafts = Array.isArray(draftsRes.data) ? draftsRes.data : [];
        if (drafts.length > 0) {
          setDraftRestorePrompt(drafts[0]);
        }
      } catch (err) {
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [customerId, initialInquiryId]);

  // Load property photos when inquiry changes
  useEffect(() => {
    if (!selectedInquiryId) {
      setPropertyPhotos([]);
      return;
    }

    const loadPhotos = async () => {
      try {
        setPhotosLoading(true);
        const res = await axios.get(`/api/v1/inquiries/${selectedInquiryId}/photos`);
        setPropertyPhotos(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setPropertyPhotos([]);
      } finally {
        setPhotosLoading(false);
      }
    };

    loadPhotos();
  }, [selectedInquiryId]);

  // Restore draft
  const restoreDraft = useCallback((draft) => {
    setSubject(draft.subject || '');
    setBody(draft.body || '');
    setDraftId(draft.id);
    if (draft.inquiry_id) setSelectedInquiryId(draft.inquiry_id);
    setDraftRestorePrompt(null);
    lastSavedContentRef.current = JSON.stringify({ subject: draft.subject, body: draft.body });
  }, []);

  const dismissDraftRestore = useCallback(() => {
    setDraftRestorePrompt(null);
  }, []);

  // Save draft
  const saveDraft = useCallback(async (force = false) => {
    if (!customerId || sending || sent) return;

    const currentContent = JSON.stringify({ subject, body });
    if (!force && currentContent === lastSavedContentRef.current) return;

    try {
      setDraftSaving(true);
      const payload = {
        subject,
        body,
        body_format: 'html',
        inquiry_id: selectedInquiryId || null
      };

      let res;
      if (draftId) {
        res = await axios.patch(`/api/v1/customers/${customerId}/email_drafts/${draftId}`, payload);
      } else {
        res = await axios.post(`/api/v1/customers/${customerId}/email_drafts`, payload);
        setDraftId(res.data.id);
      }
      setDraftSavedAt(new Date());
      lastSavedContentRef.current = currentContent;
    } catch (err) {
      // Silent failure for autosave
    } finally {
      setDraftSaving(false);
    }
  }, [customerId, subject, body, selectedInquiryId, draftId, sending, sent]);

  // Auto-save on content change
  useEffect(() => {
    if (!customerId || sending || sent) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      if (subject.trim() || body.trim()) {
        saveDraft();
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [subject, body, saveDraft, customerId, sending, sent]);

  // Template apply
  const applyTemplate = useCallback((template) => {
    setSubject(template.subject || '');
    setBody(template.body || '');
  }, []);

  // Attachments
  const addAttachments = useCallback((files) => {
    const newFiles = Array.from(files).filter(file => {
      // 10MB per file
      if (file.size > 10 * 1024 * 1024) return false;
      // Check allowed types
      const allowed = [
        'application/pdf', 'image/', 'application/msword',
        'application/vnd.openxmlformats-officedocument', 'text/',
        'application/vnd.ms-excel', 'text/csv'
      ];
      return allowed.some(type => file.type.startsWith(type));
    });

    setAttachments(prev => {
      const combined = [...prev, ...newFiles];
      // Max 10 files, max 25MB total
      const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
      if (combined.length > 10 || totalSize > 25 * 1024 * 1024) {
        return prev; // Don't add if limits exceeded
      }
      return combined;
    });
  }, []);

  const removeAttachment = useCallback((index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Send email
  const sendEmail = useCallback(async () => {
    if (!customer?.email || !subject.trim() || !body.trim() || !selectedInquiryId) return;

    try {
      setSending(true);
      setSendError(null);
      setConfirmOpen(false);

      const formData = new FormData();
      formData.append('subject', subject.trim());
      formData.append('body', body.trim());
      formData.append('body_format', 'html');
      formData.append('inquiry_id', selectedInquiryId);
      if (draftId) formData.append('draft_id', draftId);

      attachments.forEach(file => {
        formData.append('attachments[]', file);
      });

      await axios.post(`/api/v1/customers/${customerId}/send_email`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSent(true);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0] || err.response?.data?.error || 'メール送信に失敗しました';
      setSendError(msg);
    } finally {
      setSending(false);
    }
  }, [customer, subject, body, selectedInquiryId, attachments, customerId, draftId]);

  const handleSendClick = useCallback(() => {
    if (!subject.trim() || !body.trim()) {
      setSendError('件名と本文を入力してください');
      return;
    }
    if (!selectedInquiryId) {
      setSendError('案件を選択してください');
      return;
    }
    setSendError(null);
    setConfirmOpen(true);
  }, [subject, body, selectedInquiryId]);

  // Total attachment size
  const totalAttachmentSize = attachments.reduce((sum, f) => sum + f.size, 0);

  return {
    // Data
    customer,
    inquiries,
    selectedInquiryId,
    setSelectedInquiryId,
    loading,
    error,

    // Email fields
    subject,
    setSubject,
    body,
    setBody,
    signature,

    // Templates
    templates,
    applyTemplate,

    // Draft
    draftId,
    draftSaving,
    draftSavedAt,
    draftRestorePrompt,
    restoreDraft,
    dismissDraftRestore,
    saveDraft,

    // Attachments
    attachments,
    addAttachments,
    removeAttachment,
    totalAttachmentSize,

    // Property photos
    propertyPhotos,
    photosLoading,

    // Send
    sending,
    sendError,
    setSendError,
    sent,
    confirmOpen,
    setConfirmOpen,
    handleSendClick,
    sendEmail,
  };
}
