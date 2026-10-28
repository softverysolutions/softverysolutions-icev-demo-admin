import { auth, startSession, endSession, onSessionChange, getSession } from "../demo/session";
import { API_BASE_URL } from "../config/api";

export class AuthService {
  static async signInUser(email, role) {
    return startSession({ email, role });
  }

  static async signOutUser() {
    endSession();
  }

  static getCurrentUser() {
    return auth.currentUser;
  }

  static onAuthStateChange(callback) {
    return onSessionChange(callback);
  }

  static async getIdToken() {
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
  }

  static async getCurrentUserProfile() {
    const session = getSession();
    if (!session) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/users/${session.uid}`, {
      headers: { Authorization: `Bearer ${await this.getIdToken()}` },
    });
    if (!response.ok) throw new Error(`Failed to fetch user profile: ${response.status}`);
    const profile = await response.json();
    // The role picked on the sign-in screen wins, so the booth can switch views quickly.
    return { ...profile, role: session.role };
  }

  static async testAPI() {
    return true;
  }
}
