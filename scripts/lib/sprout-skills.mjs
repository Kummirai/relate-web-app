import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.dirname(HERE);
const HONORS = path.join(SCRIPTS, "honors-import.json");
const CLUBS = path.join(SCRIPTS, "clubs-import.json");

/**
 * The Sprout skills framework: one core skill plus three electives, each
 * carrying a milestone checklist per age band. Honors supplies the bands
 * (ids, colours, ages); the catalog supplies club names and age ranges.
 */
const SPROUT_SKILLS = [
  {
    id: "sprout_01_smart_saver",
    name: "Smart Saver: The Badge Fund",
    icon: "wallet",
    type: "Compulsory",
    description:
      "Learn the value of money, needs vs. wants, and save toward earning your RelateWorld badges.",
    output: "Completed savings log and a 3-minute presentation at the November showcase.",
    appFeatures: [
      "Digital Savings Jar",
      "Needs vs Wants Quiz",
      "Badge Fund Tracker (e.g., R15 / R35)",
    ],
    launchFund: {
      goalName: "Badge Fund",
      autoRouting:
        "Funds earned from Junior/Middle challenge boards are tracked here. Seniors earn real cash for Relate Projects.",
      disbursementRule:
        "Requires a Certificate of Completion from the instructor to purchase a physical badge.",
    },
    requirements: {
      kids: [
        {
          text: "Needs vs wants, clear savings jars, earning stickers for chores.",
          criteria: [
            "Sorts everyday items into needs and wants",
            "Sets up a clear savings jar for a badge goal",
            "Earns stickers for completed chores",
          ],
        },
        {
          text: "Prove your saves with the app's badge tools.",
          criteria: [
            "Logs each save in the Digital Savings Jar",
            "Passes the Needs vs Wants Quiz",
            "Updates the Badge Fund Tracker (R15 / R35)",
          ],
        },
        {
          text: "Completed savings log and a 3-minute presentation at the November showcase.",
          criteria: [
            "Savings log completed for the term",
            "3-minute presentation delivered at the November showcase",
          ],
        },
      ],
      tweens: [
        {
          text: "Full savings log, personal savings goal and the 24-hour pause.",
          criteria: [
            "Keeps a full savings log",
            "Sets a personal savings goal with an amount and a date",
            "Applies the 24-hour pause before any unplanned spend",
          ],
        },
        {
          text: "Prove your saves with the app's badge tools.",
          criteria: [
            "Logs each save in the Digital Savings Jar",
            "Passes the Needs vs Wants Quiz",
            "Updates the Badge Fund Tracker (R15 / R35)",
          ],
        },
        {
          text: "Completed savings log and a 3-minute presentation at the November showcase.",
          criteria: [
            "Savings log completed for the term",
            "3-minute presentation delivered at the November showcase",
          ],
        },
      ],
      teens: [
        {
          text: "Group savings pot (Stokvel), pay yourself first and goal reviews.",
          criteria: [
            "Contributes to the group savings pot (Stokvel)",
            "Pays yourself first from any earnings",
            "Reviews savings goals with the leader monthly",
          ],
        },
        {
          text: "Run the Badge Fund by the rules.",
          criteria: [
            "Keeps the Badge Fund Tracker (R15 / R35) accurate",
            "Withdraws only with a Certificate of Completion from the instructor",
            "Purchases the physical badge after sign-off",
          ],
        },
        {
          text: "Completed savings log and a 3-minute presentation at the November showcase.",
          criteria: [
            "Savings log completed for the term",
            "3-minute presentation delivered at the November showcase",
          ],
        },
      ],
    },
  },
  {
    id: "sprout_02_graphic_design",
    name: "Graphic Design (Canva)",
    icon: "color-palette",
    type: "Elective",
    description: "Visual communication, creativity, and professional design tools.",
    output: "rw badge, posters, certificates, and a digital portfolio.",
    appFeatures: ["Canva/Affinity Curriculum Tracker", "Portfolio Uploader", "Design Challenge Board"],
    learningProvider: "Canva & Affinity design curriculum",
    tools: {
      kids: ["Canva", "Paper/Crayons"],
      tweens: ["Affinity Designer"],
      teens: ["Affinity Designer", "Canva"],
    },
    requirements: {
      kids: [
        {
          text: "Colors, shapes and layout play with Canva and crayons.",
          criteria: [
            "Works with colors, shapes and simple layouts",
            "Draws the club mascot on paper or in Canva",
            "Saves the mascot sketch to the portfolio",
          ],
        },
        {
          text: "Design a poster for the club room wall (Reward: Badge Points).",
          criteria: [
            "Poster uses the club colors and a clear title",
            "Leader approves the design",
            "Badge Points recorded on the project board",
          ],
        },
        {
          text: "rw badge, posters, certificates, and a digital portfolio.",
          criteria: [
            "Poster printed and hung in the club room",
            "Mascot or poster added to the digital portfolio",
            "Badge progress visible in the app",
          ],
        },
      ],
      tweens: [
        {
          text: "Vector basics, typography and the rw badge in Affinity Designer.",
          criteria: [
            "Draws with vector shapes",
            "Applies typography rules (font pairing and spacing)",
            "Designs a version of the rw badge",
          ],
        },
        {
          text: "Design a flyer for the weekend sports match (Reward: Badge Points).",
          criteria: [
            "Flyer shows date, venue and club branding",
            "Leader approves the design",
            "Badge Points recorded on the project board",
          ],
        },
        {
          text: "rw badge, posters, certificates, and a digital portfolio.",
          criteria: [
            "rw badge added to the portfolio",
            "Flyer shared for the weekend match",
            "At least 3 finished pieces in the portfolio",
          ],
        },
      ],
      teens: [
        {
          text: "Full projects, brand systems and print-ready files.",
          criteria: [
            "Builds a small brand system (logo, colors, type)",
            "Prepares print-ready files",
            "Documents the work in a portfolio case study",
          ],
        },
        {
          text: "Design the official certificate for the November showcase (Reward: Paid Relate Project).",
          criteria: [
            "Certificate built to spec and approved",
            "Instructor signs off the design",
            "Paid Relate Project recorded",
          ],
        },
        {
          text: "rw badge, posters, certificates, and a digital portfolio.",
          criteria: [
            "Portfolio holds 5+ finished pieces",
            "Certificate delivered for the showcase",
            "Eligible for paid Relate Project briefs",
          ],
        },
      ],
    },
  },
  {
    id: "sprout_03_programming",
    name: "Programming",
    icon: "code-slash",
    type: "Elective",
    description: "Computational thinking, logic, and coding from blocks to real text-based code.",
    output: "A working game or web page built from scratch.",
    appFeatures: ["Embedded Learning Portal", "Code Snippet Repository", "Project Board"],
    appFeaturesByBand: {
      tweens: [
        "4-Year Evolving Profile portal",
        "Live in-browser code sandbox",
        "Milestone & quiz XP",
        "Master Web Builder Badge",
      ],
    },
    learningProvider: "Scratch to code curriculum (ScratchJr → Scratch → HTML/CSS → Python)",
    learningProviders: {
      tweens:
        "The 4-Year Evolving Profile portal — one personal website grown from HTML/CSS (age 9) through grids, forms and JavaScript (10–11) to a published multi-page hub (12), with a live sandbox, milestones, quizzes and XP.",
    },
    tools: {
      kids: ["ScratchJr"],
      tweens: ["HTML", "CSS", "JavaScript", "Built-in Sandbox"],
      teens: ["HTML/CSS", "JavaScript", "Python (VS Code)"],
    },
    requirements: {
      kids: [
        {
          text: "Sequencing, events and making characters move in ScratchJr.",
          criteria: [
            "Builds a script with sequences and events",
            "Makes characters move and speak",
            "Explains what the program does",
          ],
        },
        {
          text: "Build a simple animation about saving money (Reward: Badge Points).",
          criteria: [
            "Animation has a clear saving-money story",
            "Plays from start to finish",
            "Badge Points recorded on the project board",
          ],
        },
        {
          text: "A working game or web page built from scratch.",
          criteria: [
            "Animation saved and shared with the club",
            "Uses only their own blocks and images",
            "Project listed on the board",
          ],
        },
      ],
      tweens: [
        {
          text: "Year 1 — The Digital Identity: HTML structure and CSS basics on your personal profile website (Reward: Badge Points).",
          criteria: [
            "Navbar, hero with photo, biography and footer built in the live sandbox",
            "Uses headings, paragraphs, images with alt text and core CSS colours/spacing",
            "Year 1 concept check passed in the Learning Portal",
          ],
        },
        {
          text: "Year 2 — The Showcase & Hobby Hub: CSS grids, hover effects and a Fan Feedback form.",
          criteria: [
            "Hobby gallery built as a CSS grid of cards",
            "Likes vs Dislikes comparison cards with lists",
            "Working feedback form with labels, inputs and a submit button",
          ],
        },
        {
          text: "Year 3 — The Interactive Profile: JavaScript theme toggle, click counter, calculator and welcome popup.",
          criteria: [
            "Dark/light toggle and click counter wired with addEventListener",
            "Age-in-days calculator using a function and if/else",
            "Personalised welcome popup using prompt()",
          ],
        },
        {
          text: "Year 4 — The Master Showcase Hub: a published 4-page website (Reward: Master Web Builder Badge).",
          criteria: [
            "index, about, projects and contact pages linked with hyperlinks",
            "Responsive @media layout driven by one shared stylesheet",
            "Master Web Builder Badge claimed in the Learning Portal",
          ],
        },
      ],
      teens: [
        {
          text: "Functions, arrays and real-world coding logic.",
          criteria: [
            "Writes functions that take input and return output",
            "Uses arrays to store records",
            "Reads and debugs a small Python or JavaScript program",
          ],
        },
        {
          text: "Build the digital savings tracker for the Sprout Club app (Reward: Paid Relate Project).",
          criteria: [
            "Tracker logs saves and shows a total",
            "Code reviewed by a leader",
            "Paid Relate Project recorded",
          ],
        },
        {
          text: "A working game or web page built from scratch.",
          criteria: [
            "Tracker works end-to-end",
            "Source code shared with the club",
            "Demo delivered to the club",
          ],
        },
      ],
    },
  },
  {
    id: "sprout_04_data_science",
    name: "Data Science",
    icon: "stats-chart",
    type: "Elective",
    description: "Data collection, analysis, and visualization to solve real problems.",
    output: "A completed survey, chart, or analysis of real club data.",
    appFeatures: ["Survey Builder", "Chart Generator", "Data Portfolio"],
    learningProvider: "Cisco NetAcad · Introduction to Data Science (free)",
    learningUrl: "https://www.netacad.com/courses/introduction-data-science?courseLang=en-US",
    tools: {
      kids: ["Paper", "Blocks"],
      tweens: ["Google Sheets / Excel"],
      teens: ["Python (pandas)", "Google Sheets"],
    },
    requirements: {
      kids: [
        {
          text: "Counting, tallying, picture graphs and sorting.",
          criteria: [
            "Tallies a real list of items",
            "Sorts items into groups",
            "Draws a picture graph from the tally",
          ],
        },
        {
          text: "Survey the club on their favorite snacks and make a chart (Reward: Badge Points).",
          criteria: [
            "Survey covers at least 10 club members",
            "Chart drawn from the survey results",
            "Badge Points recorded on the project board",
          ],
        },
        {
          text: "A completed survey, chart, or analysis of real club data.",
          criteria: [
            "Survey sheet completed",
            "Chart presented to the club",
            "Result saved to the data portfolio",
          ],
        },
      ],
      tweens: [
        {
          text: "Surveys, averages, bar charts and clean data entry.",
          criteria: [
            "Builds a survey with clear questions",
            "Calculates averages in Sheets or Excel",
            "Makes a bar chart from entered data",
          ],
        },
        {
          text: "Track attendance for the Sprout club for one month (Reward: Badge Points).",
          criteria: [
            "Attendance logged weekly for 4 weeks",
            "Bar chart shows weekly totals",
            "Badge Points recorded on the project board",
          ],
        },
        {
          text: "A completed survey, chart, or analysis of real club data.",
          criteria: [
            "One month of attendance recorded",
            "Averages and chart shared with leaders",
            "Sheet saved to the data portfolio",
          ],
        },
      ],
      teens: [
        {
          text: "Data cleaning, visualization and finding trends.",
          criteria: [
            "Cleans a messy dataset (fills or drops bad rows)",
            "Plots a chart with matplotlib or Sheets",
            "States one trend the data shows",
          ],
        },
        {
          text: "Analyze the club's Smart Saver data and present the findings (Reward: Paid Relate Project).",
          criteria: [
            "Analysis run on real Smart Saver records",
            "Findings presented in a short talk",
            "Paid Relate Project recorded",
          ],
        },
        {
          text: "A completed survey, chart, or analysis of real club data.",
          criteria: [
            "Analysis completed on real club data",
            "Presentation delivered to the club",
            "Work saved to the data portfolio",
          ],
        },
      ],
    },
  },
];

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function bandLevel(band, requirements) {
  return {
    id: band.id,
    name: band.name,
    levelNumber: band.levelNumber,
    color: band.color,
    colorDark: band.colorDark,
    description: `${band.ageBand}. ${band.focus}`,
    requirements,
  };
}

/** Detail copy for an age-club copy of a skill: the band's own tools, provider and fund. */
function ageClubDetail(skill, bandId) {
  const detail = {};
  const provider = skill.learningProviders?.[bandId] ?? skill.learningProvider;
  if (provider) detail.learningProvider = provider;
  if (skill.learningUrl) detail.learningUrl = skill.learningUrl;
  if (skill.tools?.[bandId]) detail.tools = skill.tools[bandId];
  const features = skill.appFeaturesByBand?.[bandId] ?? skill.appFeatures;
  if (features) detail.appFeatures = features;
  if (skill.launchFund) detail.launchFund = skill.launchFund;
  return detail;
}

function toSkill(skill, levels, detail) {
  return {
    id: skill.id,
    name: skill.name,
    icon: skill.icon,
    type: skill.type,
    description: skill.description,
    output: skill.output,
    detail,
    levels,
  };
}

/**
 * Sprout club entries for the skills framework.
 *
 * The parent Sprout club carries every skill with all three age bands as
 * levels — a matrix of checklists with no stage widgets. Each sub-club
 * (sprout-kids / sprout-tweens / sprout-teens) carries the same four skills
 * with only its own band's level plus the widget detail (learning provider,
 * band tools, Badge Fund) so the dashboard renders cleanly for one band.
 */
export function buildSproutClubs() {
  const honors = readJson(HONORS);
  const clubCatalog = readJson(CLUBS);
  const bands = honors.levels ?? [];
  const findClub = (slug) => clubCatalog.clubs?.find?.((c) => c.slug === slug)
    ?? clubCatalog.find?.((c) => c.slug === slug);

  const parent = findClub("sprout") ?? {};
  const parentEntry = {
    slug: "sprout",
    name: parent.name ?? "Sprout",
    ageRange: parent.ageRange ?? "6–15 yrs",
    skills: SPROUT_SKILLS.map((skill) =>
      toSkill(
        skill,
        bands.map((band) => bandLevel(band, skill.requirements[band.id])),
        skill.appFeatures ? { appFeatures: skill.appFeatures } : {},
      ),
    ),
  };

  const ageClubs = bands.map((band) => {
    const catalog = findClub(band.clubSlug) ?? {};
    return {
      slug: band.clubSlug,
      name: catalog.name ?? band.name,
      ageRange: catalog.ageRange ?? band.ageBand.replace("Ages ", "").replace(/\s/g, ""),
      skills: SPROUT_SKILLS.map((skill) =>
        toSkill(
          skill,
          [bandLevel(band, skill.requirements[band.id])],
          ageClubDetail(skill, band.id),
        ),
      ),
    };
  });

  return [parentEntry, ...ageClubs];
}
