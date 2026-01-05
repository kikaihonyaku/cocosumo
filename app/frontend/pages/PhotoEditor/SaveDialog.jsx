import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';

export default function SaveDialog({
  open,
  saveOption,
  onSaveOptionChange,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>保存オプション</DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" sx={{ mt: 1 }}>
          <RadioGroup
            value={saveOption}
            onChange={(e) => onSaveOptionChange(e.target.value)}
          >
            <FormControlLabel
              value="overwrite"
              control={<Radio />}
              label="元の画像を上書き"
            />
            <FormControlLabel
              value="new"
              control={<Radio />}
              label="新しい画像として保存"
            />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>
          キャンセル
        </Button>
        <Button onClick={onConfirm} variant="contained" color="success">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
