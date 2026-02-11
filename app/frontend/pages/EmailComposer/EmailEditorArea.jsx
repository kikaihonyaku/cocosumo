import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Box } from '@mui/material';

export default function EmailEditorArea({ value, onChange, signature, onEditorReady }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({
        placeholder: 'メール本文を入力してください...',
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto;',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const isEmpty = editor.isEmpty;
      onChange?.(isEmpty ? '' : html);
    },
  });

  // Notify parent of editor instance
  useEffect(() => {
    if (editor) {
      onEditorReady?.(editor);
    }
  }, [editor, onEditorReady]);

  // Insert signature on mount (if editor empty and signature exists)
  useEffect(() => {
    if (editor && signature && !value) {
      const sigHtml = `<p></p><p></p><hr><div>${signature}</div>`;
      editor.commands.setContent(sigHtml);
      // Place cursor at the beginning
      editor.commands.focus('start');
    }
  }, [editor, signature]);

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      if (!value) {
        editor.commands.setContent('');
      } else {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        '& .ProseMirror': {
          outline: 'none',
          minHeight: 300,
          padding: '16px 20px',
          fontFamily: "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif",
          fontSize: '0.95rem',
          lineHeight: 1.7,
          '& p': { margin: '0 0 0.5em 0' },
          '& h2': { fontSize: '1.25rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
          '& h3': { fontSize: '1.1rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
          '& ul, & ol': { paddingLeft: '1.5em', margin: '0.5em 0' },
          '& li': { margin: '0.25em 0' },
          '& blockquote': {
            borderLeft: '3px solid',
            borderColor: 'grey.300',
            paddingLeft: '1em',
            margin: '0.5em 0',
            color: 'text.secondary',
            fontStyle: 'italic',
          },
          '& a': { color: 'primary.main', textDecoration: 'underline' },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '4px',
            margin: '8px 0',
            cursor: 'pointer',
          },
          '& hr': {
            border: 'none',
            borderTop: '1px solid',
            borderColor: 'divider',
            margin: '1em 0',
          },
          '& p.is-editor-empty:first-child::before': {
            content: 'attr(data-placeholder)',
            float: 'left',
            color: '#adb5bd',
            pointerEvents: 'none',
            height: 0,
          },
        },
      }}
    >
      <EditorContent editor={editor} />
    </Box>
  );
}
