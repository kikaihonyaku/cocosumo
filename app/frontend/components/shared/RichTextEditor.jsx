import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Box,
  IconButton,
  Divider,
  Tooltip,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as OrderedListIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  FormatQuote as QuoteIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Title as HeadingIcon,
} from '@mui/icons-material';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('リンクURLを入力してください', previousUrl || 'https://');

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5,
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
      }}
    >
      <ToggleButtonGroup size="small" sx={{ mr: 1 }}>
        <ToggleButton
          value="bold"
          selected={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Tooltip title="太字 (Ctrl+B)">
            <BoldIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="italic"
          selected={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Tooltip title="斜体 (Ctrl+I)">
            <ItalicIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup size="small" sx={{ mr: 1 }}>
        <ToggleButton
          value="heading2"
          selected={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Tooltip title="見出し">
            <HeadingIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup size="small" sx={{ mr: 1 }}>
        <ToggleButton
          value="bulletList"
          selected={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <Tooltip title="箇条書き">
            <BulletListIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="orderedList"
          selected={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <Tooltip title="番号付きリスト">
            <OrderedListIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup size="small" sx={{ mr: 1 }}>
        <ToggleButton
          value="blockquote"
          selected={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Tooltip title="引用">
            <QuoteIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup size="small" sx={{ mr: 1 }}>
        <ToggleButton
          value="link"
          selected={editor.isActive('link')}
          onClick={addLink}
        >
          <Tooltip title="リンク">
            <LinkIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        {editor.isActive('link') && (
          <ToggleButton
            value="unlink"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Tooltip title="リンク解除">
              <LinkOffIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        )}
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <ToggleButtonGroup size="small">
        <ToggleButton
          value="undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Tooltip title="元に戻す (Ctrl+Z)">
            <UndoIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Tooltip title="やり直し (Ctrl+Y)">
            <RedoIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'テキストを入力してください...',
  minHeight = 200,
  label,
  error,
  helperText,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // 空の場合は空文字列を返す
      const isEmpty = editor.isEmpty;
      onChange && onChange(isEmpty ? '' : html);
    },
  });

  // 外部から値が変更された場合に反映
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // 空文字列の場合はエディタをクリア
      if (!value) {
        editor.commands.setContent('');
      } else {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  return (
    <Box>
      {label && (
        <Box
          component="label"
          sx={{
            display: 'block',
            mb: 0.5,
            fontSize: '0.875rem',
            color: error ? 'error.main' : 'text.secondary',
          }}
        >
          {label}
        </Box>
      )}
      <Paper
        variant="outlined"
        sx={{
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          '&:focus-within': {
            borderColor: error ? 'error.main' : 'primary.main',
            boxShadow: (theme) =>
              `0 0 0 2px ${error ? theme.palette.error.light : theme.palette.primary.light}25`,
          },
        }}
      >
        <MenuBar editor={editor} />
        <Box
          sx={{
            minHeight,
            p: 2,
            '& .ProseMirror': {
              outline: 'none',
              minHeight: minHeight - 32,
              '& p': {
                margin: '0 0 0.5em 0',
              },
              '& h2': {
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: '1em 0 0.5em 0',
              },
              '& h3': {
                fontSize: '1.1rem',
                fontWeight: 600,
                margin: '1em 0 0.5em 0',
              },
              '& ul, & ol': {
                paddingLeft: '1.5em',
                margin: '0.5em 0',
              },
              '& li': {
                margin: '0.25em 0',
              },
              '& blockquote': {
                borderLeft: '3px solid',
                borderColor: 'grey.300',
                paddingLeft: '1em',
                margin: '0.5em 0',
                color: 'text.secondary',
                fontStyle: 'italic',
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'underline',
              },
              '& p.is-editor-empty:first-child::before': {
                content: 'attr(data-placeholder)',
                float: 'left',
                color: 'text.disabled',
                pointerEvents: 'none',
                height: 0,
              },
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </Paper>
      {helperText && (
        <Box
          sx={{
            mt: 0.5,
            fontSize: '0.75rem',
            color: error ? 'error.main' : 'text.secondary',
          }}
        >
          {helperText}
        </Box>
      )}
    </Box>
  );
};

export default RichTextEditor;
