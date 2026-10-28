import { resetDemoData } from "./mocks/db";
import { clearMedia } from "./mocks/media";

// "Reset demo": drop every change made in this browser and reload from the seed.
// The signed-in session is kept so the booth does not have to sign in again.
export async function resetDemo() {
  resetDemoData();
  await clearMedia();
  window.location.reload();
}
