/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
import React from "react";

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// draft-js
import { EditorState, convertToRaw, ContentState } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import { convertToHTML } from "draft-convert";
import { convertFromHTML } from "draft-convert";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

// Custom styles for the MDEditor
import SoftEditorRoot from "components/SoftEditor/SoftEditorRoot";

// Material Dashboard 2 PRO React context
import { useSoftUIController } from "context";

function SoftEditor({ value = "", defaultValue = "", onChange, disabled = false, inModal = false }) {
  const [controller] = useSoftUIController();
  const { darkMode } = controller;
  const lastOutputHtmlRef = React.useRef("");

  const [editorState, setEditorState] = React.useState(() => {
    const initialValue = value || defaultValue;

    if (initialValue) {
      try {
        const contentState = convertFromHTML(initialValue);
        return EditorState.createWithContent(contentState);
      } catch (error) {
        return EditorState.createEmpty();
      }
    }
    return EditorState.createEmpty();
  });

  React.useEffect(() => {
    if (value && value === lastOutputHtmlRef.current) {
      return;
    }
    lastOutputHtmlRef.current = "";
    if (value) {
      try {
        const contentState = convertFromHTML(value);
        const newEditorState = EditorState.createWithContent(contentState);
        setEditorState(newEditorState);
      } catch (error) {}
    } else if (!value && defaultValue) {
      try {
        const contentState = convertFromHTML(defaultValue);
        const newEditorState = EditorState.createWithContent(contentState);
        setEditorState(newEditorState);
      } catch (error) {}
    } else {
      setEditorState(EditorState.createEmpty());
    }
  }, [value, defaultValue]);

  const handleEditorStateChange = (newEditorState) => {
    setEditorState(newEditorState);

    if (onChange) {
      try {
        const content = newEditorState.getCurrentContent();
        const html = convertToHTML(content);
        lastOutputHtmlRef.current = html;
        onChange(html);
      } catch (error) {
        onChange("");
      }
    }
  };

  return (
    <SoftEditorRoot ownerState={{ darkMode, inModal }} style={{ direction: "ltr" }}>
      <Editor
        editorState={editorState}
        onEditorStateChange={handleEditorStateChange}
        readOnly={disabled}
        wrapperStyle={{ direction: "ltr" }}
        editorStyle={{ direction: "ltr", textAlign: "left" }}
        toolbar={{
          options: [
            "inline",
            "blockType",
            "list",
            "textAlign",
            "link",
            "emoji",
            "image",
            "remove",
            "history",
          ],
          inline: {
            options: ["bold", "italic", "underline", "strikethrough"],
          },
          blockType: {
            options: ["Normal", "H1", "H2", "H3", "H4", "H5", "H6", "Blockquote"],
          },
          list: {
            options: ["unordered", "ordered"],
          },
          textAlign: {
            options: ["left", "center", "right", "justify"],
          },
        }}
      />
    </SoftEditorRoot>
  );
}

SoftEditor.propTypes = {
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  inModal: PropTypes.bool,
};

export default SoftEditor;
