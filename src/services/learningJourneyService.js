import { API_BASE_URL } from "../config/api";

const BASE = `${API_BASE_URL}/admin/learning-journey`;

async function getAuthToken() {
  const { getAuth } = await import("../demo/session");
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.getIdToken();
}

async function request(path, { method = "GET", body } = {}) {
  const token = await getAuthToken();
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Course plans: one plan per programme type, weeks (stages) → lesson topics.
export class LearningJourneyService {
  static getPlans() {
    return request("/plans");
  }

  static getStages(programType) {
    return request(`/stages?programType=${encodeURIComponent(programType)}`);
  }

  static createStage(payload) {
    return request("/stages", { method: "POST", body: payload });
  }

  static updateStage(stageId, payload) {
    return request(`/stages/${stageId}`, { method: "PATCH", body: payload });
  }

  static deleteStage(stageId) {
    return request(`/stages/${stageId}`, { method: "DELETE" });
  }

  static reorderStages(stageIds) {
    return request("/stages/reorder", { method: "PUT", body: { stageIds } });
  }

  static createLesson(stageId, payload) {
    return request(`/stages/${stageId}/lessons`, { method: "POST", body: payload });
  }

  static updateLesson(lessonId, payload) {
    return request(`/lessons/${lessonId}`, { method: "PATCH", body: payload });
  }

  static deleteLesson(lessonId) {
    return request(`/lessons/${lessonId}`, { method: "DELETE" });
  }

  static reorderLessons(stageId, lessonIds) {
    return request(`/stages/${stageId}/lessons/reorder`, { method: "PUT", body: { lessonIds } });
  }
}
