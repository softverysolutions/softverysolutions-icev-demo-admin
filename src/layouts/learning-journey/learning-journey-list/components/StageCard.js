import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Collapse from "@mui/material/Collapse";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SortableListRow from "layouts/learning-journey/components/SortableListRow";
import LessonRow from "./LessonRow";

function sortByOrder(items) {
  return [...items].sort((a, b) => a.order - b.order);
}

function StageCard({
  stage,
  weekNumber,
  sortableId,
  expanded,
  onToggleExpand,
  onRenameStage,
  onDeleteStage,
  onAddLesson,
  onSaveLesson,
  onDeleteLesson,
  onReorderLessons,
  deletingStage,
  deletingLessonId,
}) {
  const lessons = useMemo(() => sortByOrder(stage.lessons || []), [stage.lessons]);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(stage.name);
  const [draft, setDraft] = useState(false);

  useEffect(() => {
    if (!renaming) setName(stage.name);
  }, [stage.name, renaming]);

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === stage.name) {
      setRenaming(false);
      setName(stage.name);
      return;
    }
    try {
      await onRenameStage(stage, trimmed);
      setRenaming(false);
    } catch (err) {
      alert(err.message || "Failed to rename the week.");
    }
  };

  const startDraft = () => {
    if (!expanded) onToggleExpand();
    setDraft(true);
  };
  const lessonSortableIds = lessons.map((l) => `lesson-${l.id}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleLessonDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = lessonSortableIds.indexOf(active.id);
    const newIndex = lessonSortableIds.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(lessons, oldIndex, newIndex);
    onReorderLessons(stage.id, reordered.map((l) => l.id));
  };

  return (
    <SortableListRow id={sortableId}>
      {({ setNodeRef, attributes, listeners, style, isDragging }) => (
        <SoftBox
          ref={setNodeRef}
          style={style}
          mb={2}
          sx={{
            border: "1px solid #ECEAF4",
            borderRadius: "12px",
            backgroundColor: "#fff",
            overflow: "hidden",
            boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.12)" : "none",
            opacity: isDragging ? 0.98 : 1,
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        >
          <SoftBox
            display="flex"
            alignItems="center"
            gap={1}
            p={2}
            sx={{ backgroundColor: "#fafbfc" }}
          >
            <Icon
              sx={{ cursor: "grab", color: "text.secondary" }}
              fontSize="small"
              {...attributes}
              {...listeners}
            >
              drag_indicator
            </Icon>

            <SoftBox
              px={1}
              py={0.25}
              borderRadius="md"
              flexShrink={0}
              sx={{ backgroundColor: "#F1EDFF", color: "#4B2FD6" }}
            >
              <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "inherit" }}>
                Week {weekNumber}
              </SoftTypography>
            </SoftBox>

            <SoftBox flex={1} minWidth={0}>
              {renaming ? (
                <SoftInput
                  size="small"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") {
                      setRenaming(false);
                      setName(stage.name);
                    }
                  }}
                />
              ) : (
                <SoftTypography
                  variant="h6"
                  fontWeight="medium"
                  sx={{ cursor: "text" }}
                  onDoubleClick={() => setRenaming(true)}
                >
                  {stage.name}
                </SoftTypography>
              )}
            </SoftBox>

            <SoftTypography variant="caption" color="text" fontWeight="medium">
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
            </SoftTypography>

            <Tooltip title={expanded ? "Collapse" : "Expand"}>
              <IconButton size="small" onClick={onToggleExpand}>
                <Icon fontSize="small">{expanded ? "expand_less" : "expand_more"}</Icon>
              </IconButton>
            </Tooltip>

            <Tooltip title="Rename week">
              <IconButton size="small" color="info" onClick={() => setRenaming(true)}>
                <Icon fontSize="small">edit</Icon>
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete week">
              <IconButton
                size="small"
                color="error"
                disabled={deletingStage}
                onClick={() => onDeleteStage(stage)}
              >
                <Icon fontSize="small">delete</Icon>
              </IconButton>
            </Tooltip>
          </SoftBox>

          <Collapse in={expanded}>
            <SoftBox px={2} pt={1.5} pb={2}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <SoftTypography variant="caption" fontWeight="bold" color="text">
                  Lesson topics
                </SoftTypography>
                <SoftButton
                  variant="outlined"
                  color="info"
                  size="small"
                  disabled={draft}
                  onClick={startDraft}
                  startIcon={<Icon fontSize="small">add</Icon>}
                >
                  Add lesson
                </SoftButton>
              </SoftBox>

              {lessons.length === 0 && !draft && (
                <SoftTypography variant="caption" color="text">
                  No lessons this week yet.
                </SoftTypography>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleLessonDragEnd}
              >
                <SortableContext items={lessonSortableIds} strategy={verticalListSortingStrategy}>
                  {lessons.map((lesson, index) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      number={index + 1}
                      sortableId={`lesson-${lesson.id}`}
                      onSave={(l, data) => onSaveLesson(stage, l, data)}
                      onDelete={(l) => onDeleteLesson(l)}
                      deleting={deletingLessonId === lesson.id}
                    />
                  ))}
                </SortableContext>
                {draft && (
                  <LessonRow
                    lesson={{ id: `new-${stage.id}`, name: "", goal: "", homework: "" }}
                    number={lessons.length + 1}
                    sortableId={`draft-${stage.id}`}
                    startEditing
                    onSave={async (_l, data) => {
                      await onAddLesson(stage, data);
                      setDraft(false);
                    }}
                    onCancelNew={() => setDraft(false)}
                    onDelete={() => setDraft(false)}
                  />
                )}
              </DndContext>
            </SoftBox>
          </Collapse>
        </SoftBox>
      )}
    </SortableListRow>
  );
}

StageCard.propTypes = {
  stage: PropTypes.object.isRequired,
  weekNumber: PropTypes.number.isRequired,
  sortableId: PropTypes.string.isRequired,
  expanded: PropTypes.bool,
  onToggleExpand: PropTypes.func.isRequired,
  onRenameStage: PropTypes.func.isRequired,
  onDeleteStage: PropTypes.func.isRequired,
  onAddLesson: PropTypes.func.isRequired,
  onSaveLesson: PropTypes.func.isRequired,
  onDeleteLesson: PropTypes.func.isRequired,
  onReorderLessons: PropTypes.func.isRequired,
  deletingStage: PropTypes.bool,
  deletingLessonId: PropTypes.string,
};

StageCard.defaultProps = {
  expanded: false,
  deletingStage: false,
  deletingLessonId: "",
};

export default StageCard;
