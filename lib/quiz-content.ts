export type QuizQuestionContent = {
  book: string;
  text: string;
  options: string[];
  correctIndex: number;
  level: 1 | 2 | 3;
};

export type QuizWeekSeed = {
  ordinal: number;
  name: string;
  book: string;
  kind: "book" | "finale" | "bonus";
  openFrom: string;
  openUntil: string;
};

export type SeasonSeed = {
  key: string;
  label: string;
  clubSlug: string;
  readStart: string;
  readEnd: string;
  quizStart: string;
  endDate: string;
  books: { book: string; chapters: string; focus: string; readPlan: string }[];
  quizWeeks: QuizWeekSeed[];
  perQuestionSeconds: { kids: number; tweens: number; teens: number; finale: number; bonus: number };
  awards: { rank: number; prize: string }[];
};

/** Genesis 1–11: creation, the fall, Noah and Babel. */
export const GENESIS_BEGINNINGS_QUESTIONS: QuizQuestionContent[] = [
  { book: "Genesis: Beginnings", level: 1, text: "In the beginning, God created…", options: ["the heavens and the earth", "only the stars", "only the animals", "only the sea"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 1, text: "Who was the first man God formed from the dust?", options: ["Adam", "Enoch", "Cain", "Seth"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 1, text: "God made humans in his own…", options: ["image", "house", "garden", "voice"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 1, text: "God rested on which day after creating the world?", options: ["The seventh day", "The second day", "The fifth day", "The eighth day"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 1, text: "What did Noah build to save his family and the animals?", options: ["An ark", "A tower", "A wall", "A net"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 2, text: "On which day did God say, \"Let there be light\"?", options: ["The first day", "The third day", "The sixth day", "The ninth day"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 2, text: "What garden did God plant for the man and woman?", options: ["Eden", "Jericho", "Goshen", "Ur"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 2, text: "The serpent tricked the woman to eat fruit from which tree?", options: ["The tree of the knowledge of good and evil", "The tree of life only", "The fig tree", "The olive tree"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 2, text: "After the flood, God showed His covenant sign — the…", options: ["rainbow", "dove", "stars", "morning cloud"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 2, text: "Why did people start building the tower of Babel?", options: ["To make a name for themselves", "To store grain", "To see the ocean", "To light a beacon"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 3, text: "Cain was angry because God accepted his brother Abel's offering and not his. What did Abel offer?", options: ["The firstborn of his flock", "Grain only", "Fruit of the vine", "Gold from the hills"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 3, text: "How long did rain fall during the flood?", options: ["Forty days and forty nights", "Seven days", "One month", "One hundred nights"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 3, text: "When the ark rested, Noah sent a dove and it came back with…", options: ["an olive leaf", "a white feather", "a sprig of cedar", "a small stone"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 3, text: "Enoch \"walked with God\", and God…", options: ["took him away", "made him king", "gave him the ark", "tested him with thorns"], correctIndex: 0 },
  { book: "Genesis: Beginnings", level: 3, text: "After the tower of Babel, the Lord scattered the people by confusing their…", options: ["language", "roads", "crops", "names"], correctIndex: 0 },
];

/** Genesis 12–25: God's promise to Abraham, the father of many nations. */
export const GENESIS_ABRAHAM_QUESTIONS: QuizQuestionContent[] = [
  { book: "Genesis: Abraham", level: 1, text: "God told Abram, \"Leave your country and go to the land I will show…\"", options: ["you", "the priests", "your brother", "the king"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 1, text: "God promised Abram that he would make him a great…", options: ["nation", "army", "city", "tower"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 1, text: "Who traveled with Abram as his nephew?", options: ["Lot", "Ishmael", "Esau", "Haran"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 1, text: "In their old age, God promised Sarah she would give birth to a son named…", options: ["Isaac", "Ishmael", "Jacob", "Joseph"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 1, text: "God told Abram His promise again by changing his name to…", options: ["Abraham", "Israel", "Nahor", "Abimelek"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 2, text: "Abraham and Sarah doubted God's promise, so Sarah gave Hagar to Abraham, and Hagar bore…", options: ["Ishmael", "Isaac", "Jacob", "Esau"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 2, text: "God appeared to Abraham at Mamre with how many visitors who announced the promise?", options: ["Three", "Two", "Seven", "Twelve"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 2, text: "Abraham bargained with God to spare Sodom; God said He would spare it even for…", options: ["ten righteous", "one king", "a great gift", "the temple"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 2, text: "Sarah laughed at the promise, and God asked, \"Is anything too…\" for the Lord?", options: ["hard", "far", "small", "long"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 2, text: "Abraham's name means \"father of…\"", options: ["many nations", "many camels", "my people", "the faithful"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 3, text: "God tested Abraham by telling him to offer whom as a sacrifice?", options: ["Isaac, his promised son", "Ishmael, his servant's son", "Lot's son", "Eliezer"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 3, text: "On the mountain, God provided a… to take Isaac's place.", options: ["ram", "lamb", "calf", "goat"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 3, text: "Abraham's servant found Rebekah as a wife for Isaac near…", options: ["a well", "a market", "a gate", "a feast"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 3, text: "God promised Abraham descendants as many as the…", options: ["stars of the sky and sand of the seashore", "leaves of the forest", "drops of the rain", "bricks of the city"], correctIndex: 0 },
  { book: "Genesis: Abraham", level: 3, text: "Abraham was 100 years old when… was born.", options: ["Isaac", "Jacob", "Esau", "Joseph"], correctIndex: 0 },
];

/** Genesis 25–36: Esau and Jacob, the dream at Bethel, and the name Israel. */
export const GENESIS_ISAAC_JACOB_QUESTIONS: QuizQuestionContent[] = [
  { book: "Genesis: Isaac & Jacob", level: 1, text: "Isaac and Rebekah's twin sons were…", options: ["Esau and Jacob", "Cain and Abel", "Joseph and Benjamin", "Aaron and Moses"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 1, text: "Esau was a skillful hunter; Jacob preferred staying near the…", options: ["tents", "river", "desert", "wells"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 1, text: "Esau sold his birthright to Jacob for a bowl of…", options: ["stew", "gold", "wheat", "wine"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 1, text: "Jacob saw a ladder in a dream reaching up to…", options: ["heaven", "a high tower", "the sun", "the river"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 1, text: "God changed Jacob's name to…, which means he struggled with God and overcame.", options: ["Israel", "Isaac", "Judah", "Edom"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 2, text: "Rebekah helped Jacob trick Isaac into giving him Esau's…", options: ["blessing", "flock", "lands", "cups"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 2, text: "Jacob worked for his uncle Laban for… to marry Rachel.", options: ["seven years", "two seasons", "one month", "twelve days"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 2, text: "On the night before meeting Esau, Jacob wrestled with a man until…", options: ["daybreak", "dusk", "noon", "the Sabbath"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 2, text: "In a dream God told Jacob, \"I am the Lord, the God of Abraham and of your father…\"", options: ["Isaac", "Esau", "Laban", "Leah"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 2, text: "God spoke to Jacob at Bethel and promised him the land and descendants like…", options: ["dust on the ground", "grain in a barn", "rain in a storm", "waves of the sea"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 3, text: "Esau was also called…, after the red stew he sold his birthright for.", options: ["Edom", "Eden", "Amram", "Omar"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 3, text: "During the wrestling, the man touched Jacob's… and it was put out of joint.", options: ["hip", "shoulder", "eyes", "hands"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 3, text: "Jacob wrestled all that night at a place by a river and called it…, saying \"surely the Lord is in this place\".", options: ["Peniel", "Bethel", "Beersheba", "Mahanaim"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 3, text: "Whose name did God change to be \"the man who struggled with God and overcame\"?", options: ["Jacob's", "Isaac's", "Esau's", "Laban's"], correctIndex: 0 },
  { book: "Genesis: Isaac & Jacob", level: 3, text: "Which son of Jacob was left as a hostage in Egypt — a descendant later called the father of Judah's line?", options: ["Simeon", "Reuben", "Joseph", "Levi"], correctIndex: 0 },
];

/** Genesis 37–50: Joseph — from the pit to the palace, God's plan to save his family. */
export const GENESIS_JOSEPH_QUESTIONS: QuizQuestionContent[] = [
  { book: "Genesis: Joseph", level: 1, text: "Who was Jacob's favorite son, given a robe of many colors?", options: ["Joseph", "Simeon", "Reuben", "Dan"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 1, text: "Joseph's brothers were… of him because their father favored him.", options: ["jealous", "proud", "afraid", "ashamed"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 1, text: "Joseph dreamed that bundles of grain in the field…", options: ["bowed down to his bundle", "scattered in the wind", "burned to ashes", "were eaten by birds"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 1, text: "What did Joseph's brothers do to him after planning to be rid of him?", options: ["Threw him into a pit and sold him", "Gave him to the king", "Set him free", "Made him chief"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 1, text: "Joseph was taken to… and sold as a slave.", options: ["Egypt", "Babylon", "Nineveh", "Ur"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 2, text: "Joseph was put into prison after Potiphar's wife…", options: ["falsely accused him", "blessed him", "gave him gold", "set him free"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 2, text: "In prison Joseph interpreted the dreams of…", options: ["Pharaoh's cupbearer and baker", "two soldiers", "the chief guard", "a young servant"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 2, text: "Joseph told Pharaoh his dreams meant… years of plenty followed by famine.", options: ["Seven", "Twelve", "Forty", "Three"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 2, text: "Pharaoh made Joseph governor of…", options: ["Egypt", "Canaan", "Goshen only", "the north"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 2, text: "During the famine, Joseph's brothers came to Egypt to buy…", options: ["grain", "gold", "sheep", "spices"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 3, text: "To test his brothers, Joseph had his silver cup hidden in…'s sack.", options: ["Benjamin", "Judah", "Simeon", "Reuben"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 3, text: "Judah offered to become Joseph's servant in place of…", options: ["Benjamin", "Rachel", "Jacob", "Isaac"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 3, text: "Joseph told his brothers, \"You meant it for evil, but God meant it for…\"", options: ["good", "great riches", "your rulers", "the king"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 3, text: "Jacob and his whole family settled in the land of…", options: ["Goshen", "Canaan", "Midian", "Philistia"], correctIndex: 0 },
  { book: "Genesis: Joseph", level: 3, text: "Joseph asked that his bones be carried up when God led the people to…", options: ["the promised land", "Egypt again", "the temple", "a new city"], correctIndex: 0 },
];

/**
 * Every club that runs the Bible Quiz. Each content club gets its own season
 * and leaderboard — Sprout classes plus Surge, Pulse, Prime, Anchor, Base and
 * Nexus now all play.
 */
export const QUIZ_CLUB_SLUGS = [
  "sprout-kids",
  "sprout-tweens",
  "sprout-teens",
  "surge",
  "pulse",
  "prime",
  "anchor",
  "base",
  "nexus",
] as const;

/** Sprout classes get faster timers for younger players; the rest share one pace. */
const SPROUT_TIMERS = { kids: 40, tweens: 30, teens: 25, finale: 20, bonus: 15 };
const GENERAL_TIMERS = { kids: 30, tweens: 30, teens: 30, finale: 20, bonus: 15 };

const SPROUT_AWARDS = [
  { rank: 1, prize: "School bag + stationery hamper" },
  { rank: 2, prize: "Stationery hamper" },
  { rank: 3, prize: "Book bundle + Relate tote + badge set" },
];

const GENERAL_AWARDS = [
  { rank: 1, prize: "Relate study bundle + tote" },
  { rank: 2, prize: "Book bundle + Relate tote" },
  { rank: 3, prize: "Badge set + stickers" },
];

/**
 * Shared Summer 2026/27 season shape. The same Genesis reading plan runs for
 * every club this season (content is shared for now); each club plays its own
 * leaderboard with its own timers and prizes.
 */
function buildSeason(clubSlug: string): SeasonSeed {
  const sprout = clubSlug.startsWith("sprout-");
  return {
    key: "SUMMER-2026",
    label: "Summer 2026/27",
    clubSlug,
    readStart: "2026-12-01",
    readEnd: "2027-01-03",
    quizStart: "2027-01-04",
    endDate: "2027-02-28",
    books: [
      { book: "Genesis: Beginnings", chapters: "Ch. 1–11", focus: "Creation, the flood, and God's plan for a new start.", readPlan: "Week 1: Genesis 1–11 — read a chapter a day" },
      { book: "Genesis: Abraham", chapters: "Ch. 12–25", focus: "God's promise to Abraham — a family to bless the world.", readPlan: "Week 2: Genesis 12–25 — read a chapter a day" },
      { book: "Genesis: Isaac & Jacob", chapters: "Ch. 25–36", focus: "Twin brothers, a ladder of dreams, and the new name Israel.", readPlan: "Week 3: Genesis 25–36 — read a chapter a day" },
      { book: "Genesis: Joseph", chapters: "Ch. 37–50", focus: "From the pit to the palace — God's plan to save His family.", readPlan: "Weeks 4–5: Genesis 37–50 — read a chapter a day" },
    ],
    quizWeeks: [
      { ordinal: 6, name: "Beginnings Quiz", book: "Genesis: Beginnings", kind: "book", openFrom: "2027-01-04", openUntil: "2027-02-28" },
      { ordinal: 7, name: "Abraham Quiz", book: "Genesis: Abraham", kind: "book", openFrom: "2027-01-11", openUntil: "2027-02-28" },
      { ordinal: 8, name: "Isaac & Jacob Quiz", book: "Genesis: Isaac & Jacob", kind: "book", openFrom: "2027-01-18", openUntil: "2027-02-28" },
      { ordinal: 9, name: "Joseph Finale", book: "Genesis: Joseph", kind: "finale", openFrom: "2027-01-25", openUntil: "2027-02-28" },
      { ordinal: 10, name: "Beat the Clock", book: "All of Genesis", kind: "bonus", openFrom: "2027-02-01", openUntil: "2027-02-21" },
      { ordinal: 11, name: "Beat the Clock", book: "All of Genesis", kind: "bonus", openFrom: "2027-02-08", openUntil: "2027-02-21" },
      { ordinal: 12, name: "Beat the Clock", book: "All of Genesis", kind: "bonus", openFrom: "2027-02-15", openUntil: "2027-02-21" },
    ],
    perQuestionSeconds: sprout ? SPROUT_TIMERS : GENERAL_TIMERS,
    awards: sprout ? SPROUT_AWARDS : GENERAL_AWARDS,
  };
}

export const SEASONS_SEED: SeasonSeed[] = QUIZ_CLUB_SLUGS.map((clubSlug) =>
  buildSeason(clubSlug),
);