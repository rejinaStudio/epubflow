"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

interface Props {
  initialHtml: string;
  onSave: (html: string) => void;
  saving: boolean;
}

type Level = 1 | 2 | 3;

const ToolbarBtn = ({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`px-2 py-1 rounded text-sm transition-colors ${
      active ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
    }`}
  >
    {children}
  </button>
);

export default function RichEditor({ initialHtml, onSave, saving }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "내용을 입력하세요..." }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class:
          "prose prose-gray max-w-none min-h-96 focus:outline-none text-gray-800 leading-relaxed",
      },
    },
  });

  if (!editor) return null;

  const handleSave = () => {
    onSave(editor.getHTML());
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* 툴바 */}
      <div className="border-b border-gray-200 px-3 py-2 flex flex-wrap items-center gap-0.5">
        <ToolbarBtn
          title="굵게"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          title="기울임"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          title="취소선"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </ToolbarBtn>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        {([1, 2, 3] as Level[]).map((level) => (
          <ToolbarBtn
            key={level}
            title={`제목 ${level}`}
            active={editor.isActive("heading", { level })}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          >
            H{level}
          </ToolbarBtn>
        ))}
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarBtn
          title="글머리 목록"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          ≡
        </ToolbarBtn>
        <ToolbarBtn
          title="번호 목록"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarBtn>
        <ToolbarBtn
          title="인용"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          "
        </ToolbarBtn>
        <ToolbarBtn
          title="구분선"
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          —
        </ToolbarBtn>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarBtn
          title="실행 취소"
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↩
        </ToolbarBtn>
        <ToolbarBtn
          title="다시 실행"
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↪
        </ToolbarBtn>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "저장 중..." : "저장 & 내보내기"}
        </button>
      </div>

      {/* 편집 영역 */}
      <div className="p-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
