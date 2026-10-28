import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SortableListRow from "layouts/learning-journey/components/SortableListRow";

function Field({ label, children }) {
  return (
    <SoftBox mb={1}>
      <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.25}>
        {label}
      </SoftTypography>
      {children}
    </SoftBox>
  );
}

Field.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

function LessonRow({ lesson, number, sortableId, startEditing, onSave, onDelete, onCancelNew, deleting }) {
  const [editing, setEditing] = useState(startEditing);
  const [form, setForm] = useState(lesson);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) setForm(lesson);
  }, [lesson, editing]);

  const patch = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const cancel = () => {
    setEditing(false);
    setForm(lesson);
    setError("");
    onCancelNew?.(lesson);
  };

  const save = async () => {
    if (!String(form.name || "").trim()) {
      setError("Lesson topic is required.");
      return;
    }
    setSaving(true);
    try {
      await onSave(lesson, {
        name: form.name.trim(),
        goal: (form.goal || "").trim(),
        homework: (form.homework || "").trim(),
      });
      setEditing(false);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to save the lesson.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SortableListRow id={sortableId} disabled={editing}>
      {({ setNodeRef, attributes, listeners, style, isDragging }) => (
        <SoftBox
          ref={setNodeRef}
          style={style}
          data-testid={`lesson-${lesson.id}`}
          display="flex"
          alignItems="flex-start"
          gap={1}
          px={1.5}
          py={1.25}
          mb={0.75}
          sx={{
            border: `1px solid ${editing ? "#D9D0FF" : "#ECEAF4"}`,
            borderRadius: "10px",
            backgroundColor: editing ? "#F7F6FB" : isDragging ? "#F7F6FB" : "#fff",
            boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.10)" : "none",
          }}
        >
          <Icon
            sx={{ cursor: editing ? "default" : "grab", color: "text.secondary", flexShrink: 0, mt: 0.25 }}
            fontSize="small"
            {...attributes}
            {...listeners}
          >
            drag_indicator
          </Icon>
          <SoftBox
            width="1.75rem"
            height="1.75rem"
            borderRadius="50%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            sx={{ backgroundColor: "#F1EDFF" }}
          >
            <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#6D4AFF" }}>
              {number}
            </SoftTypography>
          </SoftBox>

          {editing ? (
            <SoftBox flex={1} minWidth={0}>
              <Field label="Lesson topic *">
                <SoftInput value={form.name} onChange={patch("name")} placeholder="e.g. Components & JSX" />
              </Field>
              <Field label="Goal">
                <SoftInput
                  value={form.goal}
                  onChange={patch("goal")}
                  placeholder="What participants can do after this lesson"
                />
              </Field>
              <Field label="Homework">
                <SoftInput
                  multiline
                  rows={2}
                  value={form.homework}
                  onChange={patch("homework")}
                  placeholder="Practice to do before the next session"
                />
              </Field>
              {error && (
                <SoftTypography variant="caption" color="error" display="block" mb={1}>
                  {error}
                </SoftTypography>
              )}
              <SoftBox display="flex" gap={1} justifyContent="flex-end">
                <SoftButton size="small" variant="outlined" color="dark" disabled={saving} onClick={cancel}>
                  Cancel
                </SoftButton>
                <SoftButton
                  size="small"
                  variant="gradient"
                  color="info"
                  disabled={saving}
                  onClick={save}
                  data-testid="lesson-save"
                >
                  {saving ? <CircularProgress size={14} color="inherit" /> : "Save lesson"}
                </SoftButton>
              </SoftBox>
            </SoftBox>
          ) : (
            <>
              <SoftBox flex={1} minWidth={0}>
                <SoftTypography variant="button" fontWeight="bold" display="block">
                  {lesson.name}
                </SoftTypography>
                {lesson.goal && (
                  <SoftTypography variant="caption" color="text" display="block">
                    <strong>Goal:</strong> {lesson.goal}
                  </SoftTypography>
                )}
                {lesson.homework && (
                  <SoftTypography variant="caption" color="text" display="block">
                    <strong>Homework:</strong> {lesson.homework}
                  </SoftTypography>
                )}
              </SoftBox>
              <Tooltip title="Edit lesson">
                <IconButton
                  size="small"
                  color="info"
                  data-testid={`edit-lesson-${lesson.id}`}
                  onClick={() => setEditing(true)}
                >
                  <Icon fontSize="small">edit</Icon>
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete lesson">
                <IconButton size="small" color="error" disabled={deleting} onClick={() => onDelete(lesson)}>
                  <Icon fontSize="small">delete</Icon>
                </IconButton>
              </Tooltip>
            </>
          )}
        </SoftBox>
      )}
    </SortableListRow>
  );
}

LessonRow.propTypes = {
  lesson: PropTypes.object.isRequired,
  number: PropTypes.number.isRequired,
  sortableId: PropTypes.string.isRequired,
  startEditing: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancelNew: PropTypes.func,
  deleting: PropTypes.bool,
};

LessonRow.defaultProps = {
  startEditing: false,
  onCancelNew: null,
  deleting: false,
};

export default LessonRow;
