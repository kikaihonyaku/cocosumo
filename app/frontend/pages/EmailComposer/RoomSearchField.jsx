import React, { useState, useCallback, useRef } from 'react';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';

export default function RoomSearchField({ value, onChange, disabled = false, size = 'small' }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const debounceRef = useRef(null);

  const searchRooms = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 1) {
      setOptions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/v1/rooms/search', { params: { q: query } });
        setOptions(res.data.rooms || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  return (
    <Autocomplete
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInput) => {
        setInputValue(newInput);
        searchRooms(newInput);
      }}
      options={options}
      loading={loading}
      disabled={disabled}
      getOptionLabel={(option) => option.full_name || `${option.building_name} ${option.room_number}`}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      noOptionsText={inputValue ? '該当する物件がありません' : '建物名・部屋番号で検索'}
      loadingText="検索中..."
      size={size}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="建物名・部屋番号で検索..."
          InputProps={{
            ...params.InputProps,
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 0.5, fontSize: 18 }} />,
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <li key={key} {...otherProps}>
            <Box>
              <Typography variant="body2">
                {option.building_name} {option.room_number}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {[option.room_type_label, option.area && `${option.area}m²`, option.rent && `${Number(option.rent).toLocaleString()}円`].filter(Boolean).join(' / ')}
              </Typography>
            </Box>
          </li>
        );
      }}
    />
  );
}
