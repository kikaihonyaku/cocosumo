import { useState, useCallback } from 'react';
import axios from 'axios';

export default function useConfirmAddProperty({
  inquiries,
  selectedInquiryId,
  mediaType,
  onPropertyAdded
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState(null);
  const [pendingRoom, setPendingRoom] = useState(null);

  const checkAndPrompt = useCallback((room) => {
    if (!room || !selectedInquiryId) return;

    const inquiry = inquiries.find(inq => String(inq.id) === String(selectedInquiryId));
    if (!inquiry) return;

    const alreadyExists = (inquiry.property_inquiries || []).some(
      pi => pi.room?.id === room.id
    );

    if (alreadyExists) return;

    setPendingRoom(room);
    setDialogError(null);
    setDialogOpen(true);
  }, [inquiries, selectedInquiryId]);

  const handleConfirm = useCallback(async () => {
    if (!pendingRoom || !selectedInquiryId) return;

    try {
      setDialogLoading(true);
      setDialogError(null);
      await axios.post(`/api/v1/inquiries/${selectedInquiryId}/add_property`, {
        room_id: pendingRoom.id,
        media_type: mediaType,
        origin_type: 'staff_proposal'
      });
      setDialogOpen(false);
      setPendingRoom(null);
      onPropertyAdded?.();
    } catch (err) {
      const msg = err.response?.data?.error || '物件の追加に失敗しました';
      setDialogError(msg);
    } finally {
      setDialogLoading(false);
    }
  }, [pendingRoom, selectedInquiryId, mediaType, onPropertyAdded]);

  const handleDismiss = useCallback(() => {
    setDialogOpen(false);
    setPendingRoom(null);
    setDialogError(null);
  }, []);

  return {
    checkAndPrompt,
    dialogOpen,
    dialogLoading,
    dialogError,
    pendingRoom,
    handleConfirm,
    handleDismiss
  };
}
