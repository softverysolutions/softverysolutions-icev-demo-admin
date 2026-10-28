import catalog from "demo/seed/catalog.json";
import community from "demo/seed/community.json";
import curricula from "demo/seed/curricula.json";
import { domainSeeds } from "./domains";

// Builds the whole demo database. Each domain module turns the shared seed (the same JSON the
// Softvery Demo app uses) into the API-shaped records its screens expect.
export function buildSeed() {
  const ctx = { catalog, community, curricula };
  return domainSeeds.reduce((state, seed) => ({ ...state, ...seed(ctx) }), {});
}
