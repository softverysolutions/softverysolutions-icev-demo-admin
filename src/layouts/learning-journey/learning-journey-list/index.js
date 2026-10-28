import { useCallback, useEffect, useRef, useState } from "react";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";
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
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SoftSelect from "components/SoftSelect";
import { LearningJourneyService } from "services/learningJourneyService";
import { useLearningJourney } from "../hooks/useLearningJourney";
import { BEFORE_YOU_GO_STEPS } from "../constants";
import StageCard from "./components/StageCard";
import BeforeYouGoCard from "./components/BeforeYouGoCard";

const AUTO_SCROLL_MARGIN = 72;
const AUTO_SCROLL_STEP = 14;

function LearningJourneyList() {
  const [plans, setPlans] = useState([]);
  const [programType, setProgramType] = useState("webDevelopment");
  const {
    stages,
    addStage,
    renameStage,
    addLesson,
    updateLesson,
    loading,
    error,
    reload,
    reorderStages,
    reorderLessons,
    deleteStage,
    deleteLesson,
  } = useLearningJourney(programType);

  const [expandedIds, setExpandedIds] = useState({});
  const [deletingStageId, setDeletingStageId] = useState("");
  const [deletingLessonId, setDeletingLessonId] = useState("");
  const expandedBeforeDragRef = useRef(null);

  const stageSortableIds = stages.map((s) => `stage-${s.id}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadPlans = useCallback(() => {
    LearningJourneyService.getPlans()
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (stages.length === 0) return;
    setExpandedIds((prev) => {
      const next = { ...prev };
      stages.forEach((s) => {
        if (next[s.id] === undefined) next[s.id] = s.order === 0;
      });
      return next;
    });
  }, [stages]);

  const toggleExpand = useCallback((stageId) => {
    setExpandedIds((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds((prev) => {
      const next = { ...prev };
      stages.forEach((s) => {
        next[s.id] = false;
      });
      return next;
    });
  }, [stages]);

  const handleStageDragStart = useCallback(
    ({ active }) => {
      if (!String(active.id).startsWith("stage-")) return;
      expandedBeforeDragRef.current = expandedIds;
      collapseAll();
    },
    [collapseAll, expandedIds]
  );

  const handleStageDragMove = useCallback(({ active }) => {
    if (!String(active.id).startsWith("stage-")) return;
    const rect = active.rect.current.translated;
    if (!rect) return;
    if (rect.top < AUTO_SCROLL_MARGIN) window.scrollBy(0, -AUTO_SCROLL_STEP);
    else if (rect.bottom > window.innerHeight - AUTO_SCROLL_MARGIN) window.scrollBy(0, AUTO_SCROLL_STEP);
  }, []);

  const restoreExpanded = useCallback(() => {
    if (expandedBeforeDragRef.current) {
      setExpandedIds(expandedBeforeDragRef.current);
      expandedBeforeDragRef.current = null;
    }
  }, []);

  const handleStageDragEnd = async ({ active, over }) => {
    restoreExpanded();
    if (!over || active.id === over.id) return;
    const oldIndex = stageSortableIds.indexOf(active.id);
    const newIndex = stageSortableIds.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(stages, oldIndex, newIndex);
    try {
      await reorderStages(reordered.map((s) => s.id));
    } catch (err) {
      alert(err.message || "Failed to reorder weeks.");
    }
  };

  const handleDeleteStage = async (stage) => {
    if (!window.confirm(`Delete week "${stage.name}" and all its lessons?`)) return;
    setDeletingStageId(stage.id);
    try {
      await deleteStage(stage.id);
    } catch (err) {
      alert(err.message || "Failed to delete the week.");
    } finally {
      setDeletingStageId("");
    }
  };

  const handleDeleteLesson = async (lesson) => {
    if (!window.confirm(`Delete lesson "${lesson.name}"?`)) return;
    setDeletingLessonId(lesson.id);
    try {
      await deleteLesson(lesson.id);
    } catch (err) {
      alert(err.message || "Failed to delete lesson.");
    } finally {
      setDeletingLessonId("");
    }
  };

  const handleReorderLessons = async (stageId, orderedIds) => {
    try {
      await reorderLessons(stageId, orderedIds);
    } catch (err) {
      alert(err.message || "Failed to reorder lessons.");
    }
  };

  const handleAddWeek = async () => {
    try {
      const stage = await addStage(`Week ${stages.length + 1} topic`);
      setExpandedIds((prev) => ({ ...prev, [stage.id]: true }));
      loadPlans();
    } catch (err) {
      alert(err.message || "Failed to add a week.");
    }
  };

  const handleAddLesson = async (stage, data) => {
    await addLesson(stage.id, data);
    loadPlans();
  };

  const handleSaveLesson = (stage, lesson, data) => updateLesson(lesson.id, data);

  const plan = plans.find((p) => p.programType === programType);
  const planOptions = ["tech", "sport"].map((category) => ({
    label: category === "tech" ? "Tech" : "Sport",
    options: plans
      .filter((p) => p.category === category)
      .map((p) => ({ value: p.programType, label: p.label })),
  }));
  const selectedOption = plan ? { value: plan.programType, label: plan.label } : null;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} gap={2} flexWrap="wrap">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">
              Course plans
            </SoftTypography>
            <SoftTypography variant="body2" color="text" mt={0.5} maxWidth="44rem">
              The weekly plan participants follow on their trip&apos;s Course plan in the app: each
              week is a stage, each lesson topic a step with a goal and homework.
            </SoftTypography>
          </SoftBox>
          <SoftBox minWidth="16rem">
            <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
              Programme type
            </SoftTypography>
            <SoftSelect
              options={planOptions}
              value={selectedOption}
              onChange={(opt) => opt && setProgramType(opt.value)}
            />
          </SoftBox>
        </SoftBox>

        {plan && (
          <SoftBox display="flex" gap={1} flexWrap="wrap" alignItems="center" mb={2}>
            <SoftTypography variant="caption" color="text">
              {stages.length} {stages.length === 1 ? "week" : "weeks"} ·{" "}
              {stages.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} lesson topics · used by:
            </SoftTypography>
            {plan.programmes.length ? (
              plan.programmes.map((name) => (
                <SoftBox
                  key={name}
                  px={1}
                  py={0.25}
                  borderRadius="md"
                  sx={{ backgroundColor: "#E6FBF4", border: "1px solid #B5F3DE" }}
                >
                  <SoftTypography variant="caption" fontWeight="medium" sx={{ color: "#0B7A5A" }}>
                    {name}
                  </SoftTypography>
                </SoftBox>
              ))
            ) : (
              <SoftTypography variant="caption" color="secondary">
                no programmes yet
              </SoftTypography>
            )}
          </SoftBox>
        )}

        <BeforeYouGoCard steps={BEFORE_YOU_GO_STEPS} />

        <Card>
          <SoftBox p={3}>
            {loading && (
              <SoftBox display="flex" justifyContent="center" py={6}>
                <CircularProgress color="info" />
              </SoftBox>
            )}

            {!loading && error && (
              <SoftBox textAlign="center" py={4}>
                <SoftTypography variant="body2" color="error" mb={2}>
                  {error}
                </SoftTypography>
                <SoftButton variant="outlined" color="info" onClick={() => reload()}>
                  Retry
                </SoftButton>
              </SoftBox>
            )}

            {!loading && !error && stages.length === 0 && (
              <SoftTypography variant="body2" color="text" textAlign="center" py={4}>
                No weeks yet. Add the first week of this course plan.
              </SoftTypography>
            )}

            {!loading && !error && stages.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleStageDragStart}
                onDragMove={handleStageDragMove}
                onDragCancel={restoreExpanded}
                onDragEnd={handleStageDragEnd}
              >
                <SortableContext items={stageSortableIds} strategy={verticalListSortingStrategy}>
                  {stages.map((stage, index) => (
                    <StageCard
                      key={stage.id}
                      stage={stage}
                      weekNumber={index + 1}
                      sortableId={`stage-${stage.id}`}
                      expanded={!!expandedIds[stage.id]}
                      onToggleExpand={() => toggleExpand(stage.id)}
                      onRenameStage={(s, name) => renameStage(s.id, name)}
                      onDeleteStage={handleDeleteStage}
                      onAddLesson={handleAddLesson}
                      onSaveLesson={handleSaveLesson}
                      onDeleteLesson={handleDeleteLesson}
                      onReorderLessons={handleReorderLessons}
                      deletingStage={deletingStageId === stage.id}
                      deletingLessonId={deletingLessonId}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            {!loading && !error && (
              <SoftButton
                variant="outlined"
                color="info"
                fullWidth
                onClick={handleAddWeek}
                startIcon={<Icon>add</Icon>}
              >
                Add week
              </SoftButton>
            )}
          </SoftBox>
        </Card>
      </SoftBox>

    </DashboardLayout>
  );
}

export default LearningJourneyList;
