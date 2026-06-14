'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import type { Tile } from '@/storage/types';

interface TextTileProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

export function TextTile({ tile, isEditing, onUpdate }: TextTileProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: tile.content || '<p>Click to edit...</p>',
    editable: isEditing,
    onUpdate: ({ editor }) => {
      onUpdate({ content: editor.getHTML() });
    },
  });

  useEffect(() => {
    editor?.setEditable(isEditing);
  }, [isEditing, editor]);

  return (
    <div className="p-3 h-full overflow-auto prose prose-sm dark:prose-invert max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
}
