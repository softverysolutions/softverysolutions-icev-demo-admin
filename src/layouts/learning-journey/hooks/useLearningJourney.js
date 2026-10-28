import { useCallback, useEffect, useMemo, useState } from "react";
import { LearningJourneyService } from "services/learningJourneyService";

function sortByOrder(items) {
  return [...items].sort((a, b) => a.order - b.order);
}

function reorderInState(items, orderedIds) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return orderedIds
    .map((id, index) => {
      const item = byId.get(id);
      return item ? { ...item, order: index } : null;
    })
    .filter(Boolean);
}

export function useLearningJourney(programType) {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        if (!programType) return;
        const data = await LearningJourneyService.getStages(programType);
        setStages(sortByOrder(Array.isArray(data) ? data : []));
      } catch (err) {
        setError(err.message || "Failed to load the course plan.");
        if (!silent) setStages([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [programType]
  );

  useEffect(() => {
    load();
  }, [load]);

  const sortedStages = useMemo(() => sortByOrder(stages), [stages]);

  const reorderStages = useCallback(async (orderedIds) => {
    let snapshot;
    setStages((prev) => {
      snapshot = prev;
      return reorderInState(prev, orderedIds);
    });
    try {
      await LearningJourneyService.reorderStages(orderedIds);
    } catch (err) {
      setStages(snapshot);
      throw err;
    }
  }, []);

  const reorderLessons = useCallback(async (stageId, orderedIds) => {
    let snapshot;
    setStages((prev) => {
      snapshot = prev;
      return prev.map((stage) => {
        if (stage.id !== stageId) return stage;
        return { ...stage, lessons: reorderInState(stage.lessons || [], orderedIds) };
      });
    });
    try {
      await LearningJourneyService.reorderLessons(stageId, orderedIds);
    } catch (err) {
      setStages(snapshot);
      throw err;
    }
  }, []);

  const deleteStage = useCallback(
    async (stageId) => {
      await LearningJourneyService.deleteStage(stageId);
      await load({ silent: true });
    },
    [load]
  );

  const deleteLesson = useCallback(
    async (lessonId) => {
      await LearningJourneyService.deleteLesson(lessonId);
      await load({ silent: true });
    },
    [load]
  );

  const addStage = useCallback(
    async (name) => {
      const stage = await LearningJourneyService.createStage({
        programType,
        name,
        order: stages.length,
      });
      await load({ silent: true });
      return stage;
    },
    [programType, stages.length, load]
  );

  const renameStage = useCallback(
    async (stageId, name) => {
      await LearningJourneyService.updateStage(stageId, { name });
      await load({ silent: true });
    },
    [load]
  );

  const addLesson = useCallback(
    async (stageId, lesson) => {
      const created = await LearningJourneyService.createLesson(stageId, lesson);
      await load({ silent: true });
      return created;
    },
    [load]
  );

  const updateLesson = useCallback(
    async (lessonId, patch) => {
      await LearningJourneyService.updateLesson(lessonId, patch);
      await load({ silent: true });
    },
    [load]
  );

  return {
    stages: sortedStages,
    addStage,
    renameStage,
    addLesson,
    updateLesson,
    loading,
    error,
    reload: load,
    reorderStages,
    reorderLessons,
    deleteStage,
    deleteLesson,
  };
}
