import { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Box, ToggleButtonGroup, ToggleButton, IconButton } from "@mui/material";
import FormatBold from "@mui/icons-material/FormatBold";
import FormatItalic from "@mui/icons-material/FormatItalic";
import FormatStrikethrough from "@mui/icons-material/FormatStrikethrough";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import FormatListNumbered from "@mui/icons-material/FormatListNumbered";
import Title from "@mui/icons-material/Title";
import Code from "@mui/icons-material/Code";
import Undo from "@mui/icons-material/Undo";
import Redo from "@mui/icons-material/Redo";
import FormatQuote from "@mui/icons-material/FormatQuote";

function RichTextEditor({
  value = "",
  onChange,
  placeholder = "",
  disabled = false,
  minHeight = 120,
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const normalizedValue = (value || "").trim();
  const content =
    !normalizedValue || normalizedValue.startsWith("<")
      ? normalizedValue
      : `<p>${normalizedValue.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: !disabled,
    editorProps: {
      attributes: {
        "data-placeholder": placeholder,
        style: "min-height: 100%; outline: none;",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChangeRef.current) onChangeRef.current(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content, false);
    }
  }, [editor, content]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]);
  const toggleBulletList = useCallback(
    () => editor?.chain().focus().toggleBulletList().run(),
    [editor]
  );
  const toggleOrderedList = useCallback(
    () => editor?.chain().focus().toggleOrderedList().run(),
    [editor]
  );
  const setHeading2 = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    [editor]
  );
  const setParagraph = useCallback(() => editor?.chain().focus().setParagraph().run(), [editor]);
  const toggleCode = useCallback(() => editor?.chain().focus().toggleCode().run(), [editor]);
  const toggleBlockquote = useCallback(
    () => editor?.chain().focus().toggleBlockquote().run(),
    [editor]
  );
  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor]);
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor]);

  if (!editor) return null;

  const toolbarButtonSx = {
    py: 0.75,
    px: 1,
    minWidth: 36,
    "&.Mui-selected": { bgcolor: "action.selected" },
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: disabled ? "action.hover" : "background.paper",
        boxShadow: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.50",
          px: 1,
          py: 0.5,
        }}
      >
        <IconButton size="small" onClick={undo} disabled={!editor.can().undo()} aria-label="Undo">
          <Undo fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={redo} disabled={!editor.can().redo()} aria-label="Redo">
          <Redo fontSize="small" />
        </IconButton>
        <Box sx={{ width: 0, borderLeft: "1px solid", borderColor: "divider", mx: 0.5, alignSelf: "stretch", minHeight: 24 }} />
        <ToggleButtonGroup size="small" sx={{ "& .MuiToggleButton-root": toolbarButtonSx }} disabled={disabled}>
          <ToggleButton value="bold" selected={editor.isActive("bold")} onClick={toggleBold} aria-label="Bold">
            <FormatBold fontSize="small" />
          </ToggleButton>
          <ToggleButton value="italic" selected={editor.isActive("italic")} onClick={toggleItalic} aria-label="Italic">
            <FormatItalic fontSize="small" />
          </ToggleButton>
          <ToggleButton value="strike" selected={editor.isActive("strike")} onClick={toggleStrike} aria-label="Strikethrough">
            <FormatStrikethrough fontSize="small" />
          </ToggleButton>
          <ToggleButton value="code" selected={editor.isActive("code")} onClick={toggleCode} aria-label="Code">
            <Code fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ width: 0, borderLeft: "1px solid", borderColor: "divider", mx: 0.5, alignSelf: "stretch", minHeight: 24 }} />
        <ToggleButtonGroup size="small" sx={{ "& .MuiToggleButton-root": toolbarButtonSx }} disabled={disabled}>
          <ToggleButton value="h2" selected={editor.isActive("heading", { level: 2 })} onClick={setHeading2} aria-label="Heading 2">
            <Title fontSize="small" />
          </ToggleButton>
          <ToggleButton value="p" selected={editor.isActive("paragraph")} onClick={setParagraph} aria-label="Paragraph">
            P
          </ToggleButton>
          <ToggleButton value="blockquote" selected={editor.isActive("blockquote")} onClick={toggleBlockquote} aria-label="Quote">
            <FormatQuote fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ width: 0, borderLeft: "1px solid", borderColor: "divider", mx: 0.5, alignSelf: "stretch", minHeight: 24 }} />
        <ToggleButtonGroup size="small" sx={{ "& .MuiToggleButton-root": toolbarButtonSx }} disabled={disabled}>
          <ToggleButton value="bullet" selected={editor.isActive("bulletList")} onClick={toggleBulletList} aria-label="Bullet list">
            <FormatListBulleted fontSize="small" />
          </ToggleButton>
          <ToggleButton value="ordered" selected={editor.isActive("orderedList")} onClick={toggleOrderedList} aria-label="Numbered list">
            <FormatListNumbered fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box
        sx={{
          minHeight: minHeight,
          maxHeight: 320,
          overflow: "auto",
          px: 2,
          py: 1.5,
          "& .ProseMirror": {
            minHeight: minHeight - 24,
            outline: "none",
            fontSize: "0.9375rem",
            lineHeight: 1.6,
            "& p": { margin: "0 0 0.5em" },
            "& h2": { fontSize: "1.25rem", fontWeight: 600, margin: "0.75em 0 0.25em" },
            "& blockquote": {
              borderLeft: "4px solid",
              borderColor: "divider",
              pl: 2,
              ml: 0,
              color: "text.secondary",
              fontStyle: "italic",
            },
            "& code": {
              bgcolor: "grey.200",
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: "0.875em",
            },
            "& ul, & ol": { paddingLeft: 24, margin: "0.5em 0" },
          },
          "& .ProseMirror p:first-child:empty::before": {
            color: "text.disabled",
            content: placeholder ? `'"${placeholder.replace(/"/g, '\\"')}"'` : "none",
            pointerEvents: "none",
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  minHeight: PropTypes.number,
};

export default RichTextEditor;
