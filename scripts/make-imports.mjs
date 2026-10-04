/**
 * Generates the seed/import JSON files for clubs, store, sports and Sprout
 * honors from the app-side TypeScript constants (the current source of truth
 * until admin CRUD exists).
 *
 * Reads (transpiles to CJS via the TypeScript compiler API, no ts-node needed):
 *   ../../mobile_app/src/constants/clubs.ts      -> CLUBS (superset: icon + registrationFields)
 *   ../../web_app/constants/relate.ts            -> SPORTS_TEAMS, STORE_ITEMS, SPORTS
 *   ../../web_app/constants/squads.ts            -> POSITION_SLOTS, SQUADS, MAX_PER_POSITION, SQUAD_SIZE
 *   ../../web_app/constants/sproutHonors.ts      -> HONOR_TRACKS, HONOR_LEVELS
 *   ../../mobile_app/src/constants/merch.ts      -> MERCH_ITEMS
 *
 * Writes (all committed, seed scripts read these — they never import TS):
 *   scripts/clubs-import.json
 *   scripts/store-import.json
 *   scripts/sports-import.json
 *   scripts/honors-import.json
 *
 * Run from the backend directory:
 *
 *   node scripts/make-imports.mjs
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const TMP = path.join(HERE, ".tmp-ts");

/** Transpile a TS file to CJS on disk and require() it. */
function loadTsModule(absPath) {
  const source = readFileSync(absPath, "utf8");
  const out = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: absPath,
  });
  mkdirSync(TMP, { recursive: true });
  // CommonJS resolution so require("./relate") inside squads.ts resolves.
  writeFileSync(path.join(TMP, "package.json"), '{"type":"commonjs"}');
  const target = path.join(TMP, path.basename(absPath).replace(/\.ts$/, ".js"));
  writeFileSync(target, out.outputText);
  return require(target);
}

const RELATE = loadTsModule(path.join(ROOT, "web_app/constants/relate.ts"));
const SQUADS = loadTsModule(path.join(ROOT, "web_app/constants/squads.ts"));
const HONORS = loadTsModule(path.join(ROOT, "web_app/constants/sproutHonors.ts"));
const MERCH = loadTsModule(path.join(ROOT, "mobile_app/src/constants/merch.ts"));
// Mobile's registry is the superset (adds icon + registrationFields + program
// helpFields/image that the web type doesn't carry), so it seeds the collection.
const CLUBS_SRC = loadTsModule(path.join(ROOT, "mobile_app/src/constants/clubs.ts"));

/** StoreItem (web) field -> backend store_items document shape. */
function storeDoc(item) {
  return {
    id: item.id,
    category: item.category,
    name: item.name,
    price: item.price,
    blurb: item.blurb ?? "",
    image: item.image ?? "",
    images: Array.isArray(item.images) ? item.images : [],
    sizes: Array.isArray(item.sizes) ? item.sizes : [],
    details: Array.isArray(item.details) ? item.details : [],
    rating: item.rating ?? null,
    active: true,
  };
}

/** MerchItem (mobile) -> store_items shape. Categories are lowercase there. */
const MERCH_CATEGORY_MAP = { apparel: "Apparel", accessory: "Accessories", kit: "Accessories" };
function merchDoc(item) {
  const details = [];
  if (item.clubSlug) details.push(`Club: ${item.clubSlug}`);
  if (item.description) details.push(item.description);
  return {
    id: item.id,
    category: MERCH_CATEGORY_MAP[item.category] ?? "Accessories",
    name: item.name,
    price: item.priceValue ?? 0,
    blurb: item.description ?? "",
    image: item.image ?? "",
    images: item.image ? [item.image] : [],
    sizes: [],
    details,
    rating: null,
    active: true,
  };
}

const clubs = CLUBS_SRC.CLUBS.map((c) => ({
  slug: c.slug,
  name: c.name,
  group: c.group,
  ageRange: c.ageRange,
  tagline: c.tagline,
  description: c.description,
  ...(c.parentSlug ? { parentSlug: c.parentSlug } : {}),
  ...(c.mission ? { mission: c.mission } : {}),
  ...(c.vision ? { vision: c.vision } : {}),
  ...(c.pillarLabels ? { pillarLabels: c.pillarLabels } : {}),
  color: c.color,
  colorDark: c.colorDark,
  icon: c.icon,
  heroImage: c.heroImage ?? "",
  whatsappGroupLink: c.whatsappGroupLink,
  registrationFields: c.registrationFields ?? [],
  programs: (c.programs ?? []).map((p) => ({
    name: p.name,
    ...(p.pillar ? { pillar: p.pillar } : {}),
    blurb: p.blurb ?? "",
    detail: p.detail ?? "",
    ...(p.helpFields ? { helpFields: p.helpFields } : {}),
    ...(p.image ? { image: p.image } : {}),
  })),
}));

const storeItems = RELATE.STORE_ITEMS.map(storeDoc);
const seen = new Set(storeItems.map((s) => s.id));
let added = 0;
for (const m of MERCH.MERCH_ITEMS ?? []) {
  if (seen.has(m.id)) continue;
  seen.add(m.id);
  storeItems.push(merchDoc(m));
  added += 1;
}

const sports = {
  director: SQUADS.SPORTS_DIRECTOR,
  sports: RELATE.SPORTS,
  teams: RELATE.SPORTS_TEAMS,
  positionSlots: SQUADS.POSITION_SLOTS,
  squadSize: SQUADS.SQUAD_SIZE,
  maxPerPosition: SQUADS.MAX_PER_POSITION,
  squads: SQUADS.SQUADS,
};

const honors = {
  tracks: HONORS.HONOR_TRACKS,
  levels: HONORS.HONOR_LEVELS,
  shapeLabels: HONORS.SHAPE_LABEL,
  honorCount: HONORS.HONOR_COUNT,
};

function write(name, value) {
  const p = path.join(HERE, name);
  writeFileSync(p, JSON.stringify(value, null, 2) + "\n", "utf8");
  console.log(`${name}: ${Array.isArray(value) ? value.length : Object.keys(value).join(", ")}`);
}

write("clubs-import.json", clubs);
write("store-import.json", storeItems);
write("sports-import.json", sports);
write("honors-import.json", honors);
console.log(`store: ${RELATE.STORE_ITEMS.length} web items + ${added} mobile-only = ${storeItems.length}`);

rmSync(TMP, { recursive: true, force: true });
