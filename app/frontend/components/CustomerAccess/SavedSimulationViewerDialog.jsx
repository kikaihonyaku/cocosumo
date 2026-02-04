import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageSimulationResult from './ImageSimulation/ImageSimulationResult';

export default function SavedSimulationViewerDialog({
  open,
  onClose,
  simulation,
  onDelete,
  isMobile
}) {
  if (!simulation) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        <Typography variant="h6" component="span" noWrap sx={{ flex: 1, mr: 1 }}>
          {simulation.title || 'AIシミュレーション'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(simulation.id)}
          >
            削除
          </Button>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <ImageSimulationResult
          originalImageUrl={simulation.source_photo_url}
          resultImageUrl={simulation.result_image_data_url}
          prompt={simulation.prompt}
          loading={false}
          error={null}
          isMobile={isMobile}
        />
      </DialogContent>
    </Dialog>
  );
}
