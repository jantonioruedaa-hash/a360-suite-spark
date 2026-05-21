import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo, Mic, MicOff, Heading2, Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px"];
const FONT_FAMILIES = [
  { label: "Sans", value: "Inter, sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Mono", value: "monospace" },
];
const COLORS = ["#0f172a", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#2563eb", "#7c3aed"];

export function RichTextEditor({ value, onChange, placeholder, minHeight = 140 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "Escribe aquí…" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none px-3 py-2",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        ),
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes (e.g. importJSON)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-md bg-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [fontSize, setFontSize] = useState("");
  const [fontFamily, setFontFamily] = useState("");
  const { listening, toggle, supported } = useSpeechToEditor(editor);

  const btn = (active: boolean) =>
    cn(
      "p-1.5 rounded hover:bg-muted transition-colors",
      active && "bg-navy text-white hover:bg-navy/90",
    );

  // Font size via inline style on TextStyle mark
  const applyFontSize = (size: string) => {
    setFontSize(size);
    if (!size) {
      editor.chain().focus().setMark("textStyle", { fontSize: null }).run();
      return;
    }
    // Use TextStyle with custom fontSize attribute via setMark
    editor.chain().focus().setMark("textStyle", { fontSize: size } as Record<string, unknown>).run();
    // Apply via DOM style
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.view.dom.querySelectorAll("span[data-font-size]").forEach((el) => {
        (el as HTMLElement).style.fontSize = (el as HTMLElement).dataset.fontSize ?? "";
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30 text-xs">
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().undo().run()} title="Deshacer (Ctrl+Z)">
        <Undo className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().redo().run()} title="Rehacer (Ctrl+Y)">
        <Redo className="w-3.5 h-3.5" />
      </button>
      <Sep />

      <select
        value={fontFamily}
        onChange={(e) => {
          setFontFamily(e.target.value);
          if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
        className="text-[11px] border rounded px-1 py-0.5 bg-white"
        title="Tipo de letra"
      >
        <option value="">Fuente</option>
        {FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      <select
        value={fontSize}
        onChange={(e) => applyFontSize(e.target.value)}
        className="text-[11px] border rounded px-1 py-0.5 bg-white"
        title="Tamaño"
      >
        <option value="">Tamaño</option>
        {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <Sep />
      <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita">
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado">
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Encabezado">
        <Heading2 className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita">
        <Quote className="w-3.5 h-3.5" />
      </button>

      <Sep />
      <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Viñetas">
        <List className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <Sep />
      <button type="button" className={btn(editor.isActive({ textAlign: "left" }))} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Izquierda">
        <AlignLeft className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btn(editor.isActive({ textAlign: "center" }))} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centro">
        <AlignCenter className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btn(editor.isActive({ textAlign: "right" }))} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Derecha">
        <AlignRight className="w-3.5 h-3.5" />
      </button>
      <button type="button" className={btn(editor.isActive({ textAlign: "justify" }))} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justificar">
        <AlignJustify className="w-3.5 h-3.5" />
      </button>

      <Sep />
      <div className="flex items-center gap-0.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => editor.chain().focus().setColor(c).run()}
            className="w-4 h-4 rounded-full border border-muted-foreground/30 hover:scale-110 transition-transform"
            style={{ backgroundColor: c }}
            title={`Color ${c}`}
          />
        ))}
      </div>

      {supported && (
        <>
          <Sep />
          <button
            type="button"
            onClick={toggle}
            className={btn(listening)}
            title={listening ? "Detener dictado" : "Dictado por voz"}
          >
            {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </>
      )}
    </div>
  );
}

function Sep() { return <span className="mx-1 h-4 w-px bg-border" />; }

// Web Speech API hook (gratis, sin créditos)
type SR = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> & { length: number } }) => void;
  onerror: () => void;
  onend: () => void;
};
type SRCtor = new () => SR;

function useSpeechToEditor(editor: Editor) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);
  const w = typeof window !== "undefined" ? (window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor }) : undefined;
  const Ctor: SRCtor | undefined = w?.SpeechRecognition ?? w?.webkitSpeechRecognition;
  const supported = !!Ctor;

  const toggle = () => {
    if (!Ctor) return;
    if (listening) { recRef.current?.stop(); return; }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "es-ES";
    rec.onresult = (e) => {
      const idx = e.results.length - 1;
      const text = e.results[idx][0].transcript;
      editor.chain().focus().insertContent(text + " ").run();
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  useEffect(() => () => { recRef.current?.stop(); }, []);
  return { listening, toggle, supported };
}
