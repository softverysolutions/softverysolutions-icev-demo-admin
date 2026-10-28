// Demo session: replaces the hosted auth provider. The signed-in operator lives in
// localStorage, so a page reload keeps the session and "Sign out" clears it.

const SESSION_KEY = "softvery-demo-admin:session";

export const DEMO_ROLES = [
  { value: "super_admin", label: "Super admin", description: "Everything, including team and roles" },
  { value: "admin", label: "Admin", description: "Catalogue, sales and community; no team management" },
  { value: "consultant", label: "Consultant", description: "Read-only catalogue, orders and moderation" },
];

export const DEMO_OPERATORS = {
  super_admin: { uid: "team-mara", email: "mara.keller@softvery.example", name: "Mara Keller" },
  admin: { uid: "team-jonas", email: "jonas.weber@softvery.example", name: "Jonas Weber" },
  consultant: { uid: "team-sofia", email: "sofia.lindqvist@softvery.example", name: "Sofia Lindqvist" },
};

const listeners = new Set();

function readSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function toUser(session) {
  if (!session) return null;
  return {
    uid: session.uid,
    email: session.email,
    displayName: session.name,
    role: session.role,
    getIdToken: async () => `demo-token.${session.uid}`,
  };
}

export const auth = {
  get currentUser() {
    return toUser(readSession());
  },
};

// Same call shape the services used with the hosted auth SDK.
export const getAuth = () => auth;

export function getSession() {
  return readSession();
}

function notify() {
  const user = auth.currentUser;
  listeners.forEach((cb) => cb(user));
}

export function startSession({ role, email }) {
  const operator = DEMO_OPERATORS[role] || DEMO_OPERATORS.consultant;
  const session = {
    uid: operator.uid,
    email: email || operator.email,
    name: operator.name,
    role: DEMO_OPERATORS[role] ? role : "consultant",
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notify();
  return toUser(session);
}

export function endSession() {
  window.localStorage.removeItem(SESSION_KEY);
  notify();
}

export function onSessionChange(callback) {
  listeners.add(callback);
  Promise.resolve().then(() => callback(auth.currentUser));
  return () => listeners.delete(callback);
}
