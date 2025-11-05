import React from "react";
import {
  Dialog
} from "@mui/material";
import VrTourViewerContent from "./VrTourViewerContent";

export default function VrTourPreview({ open, onClose, vrTour, scenes }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { bgcolor: '#000', position: 'relative' }
      }}
    >
      <VrTourViewerContent
        vrTour={vrTour}
        scenes={scenes}
        onClose={onClose}
        isPreview={true}
      />
    </Dialog>
  );
}
