import React, { useState } from 'react';
import {
  Box, ToggleButton, ToggleButtonGroup, Tooltip, Divider,
  IconButton, Menu, MenuItem, Typography
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as OrderedListIcon,
  FormatQuote as QuoteIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Image as ImageIcon,
  ViewModule as CardIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Title as HeadingIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  Description as TemplateIcon,
  FormatColorText as ColorIcon
} from '@mui/icons-material';

const COLORS = [
  { label: '黒', value: '#000000' },
  { label: '赤', value: '#e53e3e' },
  { label: '青', value: '#3182ce' },
  { label: '緑', value: '#38a169' },
  { label: 'オレンジ', value: '#dd6b20' },
  { label: '紫', value: '#805ad5' },
  { label: 'グレー', value: '#718096' },
];

export default function EmailComposerToolbar({
  editor,
  templates,
  onApplyTemplate,
  onToggleImagePicker,
  isMobile
}) {
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState(null);
  const [colorMenuAnchor, setColorMenuAnchor] = useState(null);

  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('リンクURLを入力してください', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
        alignItems: 'center',
      }}
    >
      {/* Templates */}
      {templates.length > 0 && (
        <>
          <Tooltip title="テンプレート">
            <IconButton
              size="small"
              onClick={(e) => setTemplateMenuAnchor(e.currentTarget)}
            >
              <TemplateIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={templateMenuAnchor}
            open={Boolean(templateMenuAnchor)}
            onClose={() => setTemplateMenuAnchor(null)}
          >
            <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', display: 'block' }}>
              テンプレートを選択
            </Typography>
            {templates.map(t => (
              <MenuItem key={t.id} onClick={() => { onApplyTemplate(t); setTemplateMenuAnchor(null); }}>
                {t.name}
              </MenuItem>
            ))}
          </Menu>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        </>
      )}

      {/* Text formatting */}
      <ToggleButtonGroup size="small">
        <ToggleButton
          value="bold"
          selected={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          sx={{ px: 0.75 }}
        >
          <Tooltip title="太字"><BoldIcon fontSize="small" /></Tooltip>
        </ToggleButton>
        <ToggleButton
          value="italic"
          selected={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          sx={{ px: 0.75 }}
        >
          <Tooltip title="斜体"><ItalicIcon fontSize="small" /></Tooltip>
        </ToggleButton>
        <ToggleButton
          value="underline"
          selected={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          sx={{ px: 0.75 }}
        >
          <Tooltip title="下線"><UnderlineIcon fontSize="small" /></Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Color */}
      <Tooltip title="文字色">
        <IconButton size="small" onClick={(e) => setColorMenuAnchor(e.currentTarget)}>
          <ColorIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={colorMenuAnchor}
        open={Boolean(colorMenuAnchor)}
        onClose={() => setColorMenuAnchor(null)}
      >
        {COLORS.map(c => (
          <MenuItem
            key={c.value}
            onClick={() => { editor.chain().focus().setColor(c.value).run(); setColorMenuAnchor(null); }}
            sx={{ gap: 1 }}
          >
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: c.value, border: '1px solid #ddd' }} />
            {c.label}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => { editor.chain().focus().unsetColor().run(); setColorMenuAnchor(null); }}
        >
          色をリセット
        </MenuItem>
      </Menu>

      {!isMobile && <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />}

      {/* Headings */}
      <ToggleButtonGroup size="small">
        <ToggleButton
          value="h2"
          selected={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          sx={{ px: 0.75, fontSize: '0.7rem', fontWeight: 700 }}
        >
          <Tooltip title="見出し2">
            <span>H2</span>
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="h3"
          selected={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          sx={{ px: 0.75, fontSize: '0.7rem', fontWeight: 700 }}
        >
          <Tooltip title="見出し3">
            <span>H3</span>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Lists & Quote */}
      <ToggleButtonGroup size="small">
        <ToggleButton
          value="bulletList"
          selected={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          sx={{ px: 0.75 }}
        >
          <Tooltip title="箇条書き"><BulletListIcon fontSize="small" /></Tooltip>
        </ToggleButton>
        <ToggleButton
          value="orderedList"
          selected={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          sx={{ px: 0.75 }}
        >
          <Tooltip title="番号付きリスト"><OrderedListIcon fontSize="small" /></Tooltip>
        </ToggleButton>
        <ToggleButton
          value="blockquote"
          selected={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          sx={{ px: 0.75 }}
        >
          <Tooltip title="引用"><QuoteIcon fontSize="small" /></Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      {!isMobile && <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />}

      {/* Alignment */}
      {!isMobile && (
        <ToggleButtonGroup size="small">
          <ToggleButton
            value="left"
            selected={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            sx={{ px: 0.75 }}
          >
            <Tooltip title="左揃え"><AlignLeftIcon fontSize="small" /></Tooltip>
          </ToggleButton>
          <ToggleButton
            value="center"
            selected={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            sx={{ px: 0.75 }}
          >
            <Tooltip title="中央揃え"><AlignCenterIcon fontSize="small" /></Tooltip>
          </ToggleButton>
          <ToggleButton
            value="right"
            selected={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            sx={{ px: 0.75 }}
          >
            <Tooltip title="右揃え"><AlignRightIcon fontSize="small" /></Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      {/* Link */}
      <ToggleButtonGroup size="small">
        <ToggleButton
          value="link"
          selected={editor.isActive('link')}
          onClick={addLink}
          sx={{ px: 0.75 }}
        >
          <Tooltip title="リンク"><LinkIcon fontSize="small" /></Tooltip>
        </ToggleButton>
        {editor.isActive('link') && (
          <ToggleButton
            value="unlink"
            onClick={() => editor.chain().focus().unsetLink().run()}
            sx={{ px: 0.75 }}
          >
            <Tooltip title="リンク解除"><LinkOffIcon fontSize="small" /></Tooltip>
          </ToggleButton>
        )}
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Image & Card */}
      <Tooltip title="画像・物件カード挿入">
        <IconButton size="small" onClick={onToggleImagePicker} color="primary">
          <ImageIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Box sx={{ flex: 1 }} />

      {/* Undo/Redo */}
      <ToggleButtonGroup size="small">
        <ToggleButton
          value="undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          sx={{ px: 0.75 }}
        >
          <Tooltip title="元に戻す"><UndoIcon fontSize="small" /></Tooltip>
        </ToggleButton>
        <ToggleButton
          value="redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          sx={{ px: 0.75 }}
        >
          <Tooltip title="やり直し"><RedoIcon fontSize="small" /></Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
