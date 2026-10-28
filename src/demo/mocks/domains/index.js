import * as catalogue from "./catalogue";
import * as stays from "./stays";
import * as extras from "./extras";
import * as packages from "./packages";
import * as destinations from "./destinations";
import * as orders from "./orders";
import * as promotions from "./promotions";
import * as people from "./people";
import * as analytics from "./analytics";
import * as reviews from "./reviews";
import * as community from "./community";
import * as learning from "./learning";

const modules = [
  catalogue,
  stays,
  extras,
  packages,
  destinations,
  orders,
  promotions,
  people,
  analytics,
  reviews,
  community,
  learning,
];

export const domainSeeds = modules.map((m) => m.seed);
export const domainHandlers = modules.flatMap((m) => m.handlers);
