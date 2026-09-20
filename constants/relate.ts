export type RelateProgram = {
  name: string;
  blurb: string;
  detail: string;
};

export type RelateClub = {
  slug: string;
  name: string;
  group: string;
  ageRange: string;
  tagline: string;
  description: string;
  heroImage: string;
  color: string;
  colorDark: string;
  whatsappGroupLink: string;
  programs: RelateProgram[];
  parentSlug?: string;
};

export const CLUBS: RelateClub[] = [
  {
    slug: "sprout",
    name: "Sprout",
    group: "Children",
    ageRange: "6–15 yrs",
    tagline: "Growing strong, reaching high.",
    description:
      "Children in their formative years — needing nurturing, guidance, education support and a safe environment to grow.",
    heroImage: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=80",
    color: "#4CAF50",
    colorDark: "#2E7D32",
    whatsappGroupLink: "https://chat.whatsapp.com/DdZ3vBcZtfLCuoS9BqEL6n",
    programs: [
      {
        name: "Sprout Club",
        blurb: "Weekly children's activities: games, crafts and stories.",
        detail:
          "Every Saturday morning children gather for games, crafts, music and stories that build character and confidence. Volunteers lead small groups by age so every child is known and celebrated.",
      },
      {
        name: "Reading Circle",
        blurb: "Literacy development and reading encouragement.",
        detail:
          "Children read aloud in small circles, earn reading badges and take home books each week to build a lifelong love of reading.",
      },
      {
        name: "Sprout Sports",
        blurb: "Weekend sports and recreation.",
        detail:
          "Fun weekend sport sessions — soccer, netball and movement games — where children learn teamwork and stay active.",
      },
      {
        name: "Creative Arts",
        blurb: "Art, music and drama workshops.",
        detail:
          "Rotating workshops in drawing, singing and drama, ending each term with a showcase for parents.",
      },
      {
        name: "School Support",
        blurb: "Uniforms, stationery and school fees.",
        detail:
          "We help with uniforms, stationery and school fees so no child misses school. Requests are reviewed by the club facilitator and matched with sponsors.",
      },
      {
        name: "Nutrition Program",
        blurb: "Healthy meals and snacks during programs.",
        detail:
          "Every program serves a healthy meal or snack, and families can join the monthly food parcel list.",
      },
      {
        name: "Holiday Club",
        blurb: "School holiday activities and outings.",
        detail:
          "Full-day holiday programs with themed activities, outings and guest speakers — safe, fun and free.",
      },
      {
        name: "Sprout Camp",
        blurb: "Weekend or holiday camps — low-cost.",
        detail:
          "An overnight camp experience with hikes, campfires and team challenges, subsidised so every child can attend.",
      },
      {
        name: "Character Building",
        blurb: "Life skills, values and confidence workshops.",
        detail:
          "Short workshops on honesty, courage, kindness and confidence — the soft skills school doesn't teach.",
      },
    ],
  },
  {
    slug: "surge",
    name: "Surge",
    group: "Young Youth",
    ageRange: "16–21 yrs",
    tagline: "Rise. Build. Become.",
    description:
      "Young people stepping into adulthood — needing guidance, skills and purpose.",
    heroImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80",
    color: "#FF6B00",
    colorDark: "#C2410C",
    whatsappGroupLink: "https://chat.whatsapp.com/Fkq2vBcZtfLCuoS9CqGM7o",
    programs: [
      {
        name: "Surge Connect",
        blurb: "Weekly youth meetups.",
        detail:
          "Weekly hangouts with real conversations about life, faith and the future — a safe place to belong.",
      },
      {
        name: "Rise Mentorship",
        blurb: "One-on-one career and life coaching.",
        detail:
          "Get matched with a mentor who walks with you for six months — goal setting, accountability and honest guidance.",
      },
      {
        name: "The Launch Pad",
        blurb: "Career exposure, internships and job placements.",
        detail:
          "Work-shadow days, internship placements and CV clinics that open doors into the working world.",
      },
      {
        name: "Tuition Support",
        blurb: "School and university fees.",
        detail:
          "Registration and tuition support for students who qualify, based on need and school reports.",
      },
      {
        name: "School Supply Drive",
        blurb: "Stationery, uniforms and books.",
        detail:
          "Annual drive collecting packs of stationery, uniforms and set-work books before each school year starts.",
      },
      {
        name: "Life Skills Workshops",
        blurb: "Finance, CV writing and interview prep.",
        detail:
          "Hands-on workshops — open your first bank account, write a CV that gets read, and nail the interview.",
      },
      {
        name: "Surge Outings",
        blurb: "Park visits and beach days.",
        detail:
          "Regular outings to parks, the beach and local attractions — friendship and fresh air.",
      },
      {
        name: "Surge Fire",
        blurb: "Youth worship nights.",
        detail:
          "Monthly worship nights with music, testimony and prayer — optional and open to everyone.",
      },
      {
        name: "Purpose Quest",
        blurb: "Identity and calling workshops.",
        detail:
          "A guided journey through identity, gifts and calling to help you find your purpose.",
      },
    ],
  },
  {
    slug: "pulse",
    name: "Pulse",
    group: "Youth",
    ageRange: "21–33 yrs",
    tagline: "Live loud. Move forward.",
    description:
      "Young adults building careers, finances and identity — needing network and direction.",
    heroImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80",
    color: "#00B4D8",
    colorDark: "#0284C7",
    whatsappGroupLink: "https://chat.whatsapp.com/Glr3wCdZugMDvpT9DrHN8p",
    programs: [
      {
        name: "Pulse Network",
        blurb: "Monthly networking at free venues.",
        detail:
          "Monthly meetups at free venues to grow your network — bring a friend, leave with contacts.",
      },
      {
        name: "Pulse Wallet",
        blurb: "Financial literacy: budgeting, investing, credit.",
        detail:
          "A practical money course: budgeting that works, debt and credit scores, and first steps into investing.",
      },
      {
        name: "The Hustle Hub",
        blurb: "Co-working and entrepreneurship incubator.",
        detail:
          "Free co-working days plus a 12-week incubator for young businesses — mentorship, templates and pitch practice.",
      },
      {
        name: "Pulse Check",
        blurb: "Mental health and wellness circles.",
        detail:
          "Confidential peer circles facilitated by trained volunteers — because your mind matters as much as your money.",
      },
      {
        name: "Career Workshops",
        blurb: "CV writing, interviews and career planning.",
        detail:
          "Bring your CV, leave with a plan — writing labs, mock interviews and career mapping sessions.",
      },
      {
        name: "Tuition & Study Grants",
        blurb: "Support for further education.",
        detail:
          "Short-course and further-study grants awarded each term based on need and a simple application.",
      },
      {
        name: "Social Mixers",
        blurb: "Potlucks and park braais.",
        detail:
          "Relaxed potlucks, park braais and game evenings — community without the pressure.",
      },
      {
        name: "Pulse Faith",
        blurb: "Prayer groups and Bible study.",
        detail:
          "Optional weekly prayer groups and Bible studies for those who want to grow spiritually.",
      },
      {
        name: "Kingdom Calling",
        blurb: "Career and ministry integration.",
        detail:
          "For those exploring how faith and work weave together — quarterly dinners with guest speakers.",
      },
    ],
  },
  {
    slug: "prime",
    name: "Prime",
    group: "Singles (No Kids)",
    ageRange: "33+ yrs",
    tagline: "Own your stage. Flourish.",
    description:
      "Mature singles thriving independently — needing community and purpose.",
    heroImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1200&q=80",
    color: "#6C2BD9",
    colorDark: "#4A148C",
    whatsappGroupLink: "https://chat.whatsapp.com/Hms4xDeZvhNEwqU9EsIO9q",
    programs: [
      {
        name: "Prime Circle",
        blurb: "Monthly peer support groups.",
        detail:
          "Monthly circles where mature singles talk honestly about life, purpose and the season they're in.",
      },
      {
        name: "Prime Pursuit",
        blurb: "Career reinvention and skill-building.",
        detail:
          "Structured programmes for career pivots — new skills, new industries, new confidence.",
      },
      {
        name: "Legacy Lab",
        blurb: "Mentorship training to give back to younger groups.",
        detail:
          "Become a trained mentor to Surge and Pulse members — turn your experience into someone else's shortcut.",
      },
      {
        name: "Prime Living",
        blurb: "Health, fitness and lifestyle retreats.",
        detail:
          "Weekend retreats focused on health, rest and living well in your prime.",
      },
      {
        name: "Career Transition Help",
        blurb: "Job search, side hustle and retirement planning.",
        detail:
          "Practical help with job searches, starting a side hustle or planning a dignified retirement.",
      },
      {
        name: "Crisis Support",
        blurb: "Emergency help per case.",
        detail:
          "When life happens — emergency financial, food or counselling support assessed case by case.",
      },
      {
        name: "Prime Reflection",
        blurb: "Life review and spiritual retreats.",
        detail:
          "Optional guided retreats to review the story so far and set direction for what's next.",
      },
      {
        name: "Prayer Shield",
        blurb: "Intercessory prayer teams.",
        detail:
          "Optional teams that pray weekly for members' needs and celebrate answered prayer.",
      },
      {
        name: "Elders' Table",
        blurb: "Wisdom-sharing sessions.",
        detail:
          "Quarterly dinners where stories and wisdom are passed between generations.",
      },
    ],
  },
  {
    slug: "anchor",
    name: "Anchor",
    group: "Single Parents",
    ageRange: "Parenting but single",
    tagline: "Holding it all together.",
    description:
      "Single parents raising children alone — needing support, community and practical help.",
    heroImage: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1200&q=80",
    color: "#2E7D32",
    colorDark: "#14532D",
    whatsappGroupLink: "https://chat.whatsapp.com/Int5yEfZwiOFxrV9FtJP0r",
    programs: [
      {
        name: "Anchor Connect",
        blurb: "Weekly single-parent support groups.",
        detail:
          "Weekly groups where single parents find real friends, practical tips and a safe place to be honest.",
      },
      {
        name: "Parenting Workshops",
        blurb: "Practical parenting skills and coaching.",
        detail:
          "Practical workshops on discipline, routines and raising kids well on one income.",
      },
      {
        name: "Childcare Support",
        blurb: "Subsidised or free childcare during programs.",
        detail:
          "Free childcare during every Anchor program, plus subsidised daycare placements for working parents.",
      },
      {
        name: "Food Relief",
        blurb: "Monthly food parcels.",
        detail:
          "Monthly food parcels with staples and fresh produce for families who need a hand to stay standing.",
      },
      {
        name: "Tuition Support",
        blurb: "School fees, uniforms and stationery for kids.",
        detail:
          "School fee contributions, uniforms and stationery so your kids never fall behind because of money.",
      },
      {
        name: "Financial Coaching",
        blurb: "Budgeting on a single income.",
        detail:
          "One-on-one coaching to build a budget that works on one income and a plan to get ahead.",
      },
      {
        name: "Co-Parenting Support",
        blurb: "Mediation and communication help.",
        detail:
          "Trained mediators help you build a calm, workable co-parenting arrangement that puts kids first.",
      },
      {
        name: "Anchor Outings",
        blurb: "Parent-child bonding outings.",
        detail:
          "Subsidised outings where you can simply enjoy your kids — memory-making without the cost.",
      },
      {
        name: "Respite Care",
        blurb: "Occasional childcare relief.",
        detail:
          "Vetted volunteers give you a few hours to rest, shop or just breathe when you need it most.",
      },
      {
        name: "Prayer & Encouragement",
        blurb: "Pastoral support and prayer groups.",
        detail:
          "Optional pastoral care and prayer groups — someone to stand with you in the hard seasons.",
      },
    ],
  },
  {
    slug: "base",
    name: "Base",
    group: "Couples",
    ageRange: "Couples of any age",
    tagline: "Stronger together.",
    description:
      "Couples building life together — needing support, connection and growth.",
    heroImage: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&q=80",
    color: "#E8A2B6",
    colorDark: "#9D174D",
    whatsappGroupLink: "https://chat.whatsapp.com/Jot6zFgZxkPGysW9GuKQ1s",
    programs: [
      {
        name: "Base Connect",
        blurb: "Couples socials: park, church and potlucks.",
        detail:
          "Monthly socials where couples make couple-friends — park picnics, potlucks and game nights.",
      },
      {
        name: "The Blueprint",
        blurb: "Financial and goal-setting sessions.",
        detail:
          "Couples workshops to build a shared money plan and life goals you actually keep.",
      },
      {
        name: "Base Camp",
        blurb: "Relationship enrichment retreats.",
        detail:
          "Weekend retreats that give couples time away to reconnect and grow.",
      },
      {
        name: "Anchor Sessions",
        blurb: "Communication and conflict resolution.",
        detail:
          "Facilitated sessions teaching the tools for fair fighting, real listening and repair.",
      },
      {
        name: "Date Night",
        blurb: "Low-cost potluck dinners and movie nights.",
        detail:
          "Monthly date nights that don't break the budget — childcare provided.",
      },
      {
        name: "Crisis Support",
        blurb: "Food, counselling and prayer for couples.",
        detail:
          "When a season is hard — practical help, counselling and someone to walk with you through it.",
      },
      {
        name: "Couples Mentorship",
        blurb: "Older couples mentoring younger couples.",
        detail:
          "Get matched with a couple a few steps ahead who will walk with you through the early years.",
      },
      {
        name: "Covenant Space",
        blurb: "Faith-based marriage enrichment.",
        detail:
          "Optional faith-based marriage enrichment courses run a few times a year.",
      },
      {
        name: "Family Altar",
        blurb: "Devotional guides and prayer resources.",
        detail:
          "Simple devotional guides and prayer rhythms for couples who want to grow spiritually together.",
      },
    ],
  },
  {
    slug: "nexus",
    name: "Nexus",
    group: "Families",
    ageRange: "Families",
    tagline: "Where every age connects.",
    description:
      "Families raising children — needing community, resources and stability.",
    heroImage: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80",
    color: "#8A9A5B",
    colorDark: "#4D7C0F",
    whatsappGroupLink: "https://chat.whatsapp.com/Kpu7AGhZylQHztX9HvLR2t",
    programs: [
      {
        name: "Nexus Table",
        blurb: "Monthly family dinners — potluck.",
        detail:
          "Monthly potluck dinners where families eat together, kids play and nobody eats alone.",
      },
      {
        name: "Food Relief",
        blurb: "Monthly food parcels.",
        detail:
          "Monthly food parcels for families in a tight season — dignity first, no questions asked.",
      },
      {
        name: "Roots & Wings",
        blurb: "Parenting support groups.",
        detail:
          "Parenting groups that give both roots (values) and wings (confidence) for every stage of raising kids.",
      },
      {
        name: "The Village",
        blurb: "Intergenerational activities.",
        detail:
          "Grandparents, parents and kids together — storytelling days, shared meals and skills passed down.",
      },
      {
        name: "Nexus Cares",
        blurb: "Emergency relief: food, clothing and resource bank.",
        detail:
          "A rapid-response resource bank for family emergencies — food, clothing, furniture and school needs.",
      },
      {
        name: "School Support",
        blurb: "Uniforms, stationery and fees.",
        detail:
          "Uniforms, stationery and school-fee support so the whole family can thrive at school.",
      },
      {
        name: "Family Events",
        blurb: "Park days, games and fun activities.",
        detail:
          "Family park days, games afternoons and seasonal celebrations the whole family can enjoy.",
      },
      {
        name: "Family Devotions",
        blurb: "Resources for home worship.",
        detail:
          "Simple, short family devotional guides — faith at home made practical.",
      },
      {
        name: "Healing Rooms",
        blurb: "Prayer ministry for families in crisis.",
        detail:
          "Optional prayer ministry for families walking through crisis — confidential, gentle and free.",
      },
    ],
  },
];

export function getClub(slug: string): RelateClub | undefined {
  return CLUBS.find((c) => c.slug === slug);
}

export function getStoreItem(id: string): StoreItem | undefined {
  return STORE_ITEMS.find((s) => s.id === id);
}

const SPROUT_CLASS_PROGRAMS: RelateProgram[] = [
  {
    name: "Bible Quiz",
    blurb: "Read the books, then battle it out in the quiz.",
    detail:
      "Each season we read a few books of the Bible together. Learn the stories and characters, then join the quiz to test your knowledge — build up points on the leaderboard and win the season.",
  },
  {
    name: "Reading Circle",
    blurb: "Literacy development and reading encouragement.",
    detail:
      "Children read aloud in small circles, earn reading badges and take home books each week to build a lifelong love of reading.",
  },
  {
    name: "Memory Verse Club",
    blurb: "Learn a verse each month, recite it, and grow.",
    detail:
      "Each month we learn one Bible verse together. Practice it during the week and share it at club — earn a sticker for every verse you recite.",
  },
  {
    name: "Character Building",
    blurb: "Life skills, values and confidence workshops.",
    detail:
      "Short workshops on honesty, courage, kindness and confidence — the soft skills school doesn't teach.",
  },
  {
    name: "Creative Arts",
    blurb: "Art, music and drama workshops.",
    detail:
      "Rotating workshops in drawing, singing and drama, ending each term with a showcase for parents.",
  },
  {
    name: "Bible Adventurers",
    blurb: "Story-themed games that bring the Bible alive.",
    detail:
      "An adventure through Bible stories with games, crafts and role-play — a fun way to learn the big stories that the quiz is based on.",
  },
  {
    name: "Football Club",
    blurb: "Weekly training and friendly matches.",
    detail:
      "Learn the basics, train with friends and play friendly matches. Bring trainers, a water bottle and lots of energy — everyone gets a game.",
  },
  {
    name: "Netball Club",
    blurb: "Weekly training and friendly matches.",
    detail:
      "Learn passing, shooting and teamwork on the netball court. Bring gym shoes and a water bottle — beginners are very welcome.",
  },
];

export const SUB_CLUBS: RelateClub[] = [
  {
    slug: "sprout-kids",
    name: "Sprout Kids",
    group: "Children",
    ageRange: "6–8 yrs",
    parentSlug: "sprout",
    tagline: "Little roots, first shoots.",
    description:
      "Our youngest Sprout members — eager, curious and ready to grow. Activities are playful and safe, with gentle guidance from volunteer leaders.",
    heroImage: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200&q=80",
    color: "#66BB6A",
    colorDark: "#388E3C",
    whatsappGroupLink: "https://chat.whatsapp.com/DdZ3vBcZtfLCuoS9BqEL6n",
    programs: SPROUT_CLASS_PROGRAMS,
  },
  {
    slug: "sprout-tweens",
    name: "Sprout Tweens",
    group: "Children",
    ageRange: "9–11 yrs",
    parentSlug: "sprout",
    tagline: "Growing strong, finding their voice.",
    description:
      "Tweens exploring who they are becoming — independence with a safety net. Bigger challenges, real leadership and widening friendships.",
    heroImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
    color: "#4CAF50",
    colorDark: "#2E7D32",
    whatsappGroupLink: "https://chat.whatsapp.com/DdZ3vBcZtfLCuoS9BqEL6n",
    programs: SPROUT_CLASS_PROGRAMS,
  },
  {
    slug: "sprout-teens",
    name: "Sprout Teens",
    group: "Children",
    ageRange: "12–15 yrs",
    parentSlug: "sprout",
    tagline: "Reaching high, ready for more.",
    description:
      "Teens stepping toward adulthood — leadership, mentorship and bigger challenges in a community that knows them by name.",
    heroImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80",
    color: "#43A047",
    colorDark: "#1B5E20",
    whatsappGroupLink: "https://chat.whatsapp.com/DdZ3vBcZtfLCuoS9BqEL6n",
    programs: SPROUT_CLASS_PROGRAMS,
  },
];

export function getClubClasses(slug: string): RelateClub[] {
  return SUB_CLUBS.filter((c) => c.parentSlug === slug);
}

export function getClubClass(slug: string): RelateClub | undefined {
  return SUB_CLUBS.find((c) => c.slug === slug);
}

export type MagazineEdition = {
  label: string;
  ageRange: string;
  clubSlug: string;
  summary: string;
  weekTitles: string[];
};

export type RelateMagazine = {
  slug: string;
  series: string;
  clubName: string;
  clubSlug: string;
  theme: string;
  seasonLabel: string;
  cover: string;
  coverLines: string[];
  summary: string;
  editions: MagazineEdition[];
};

export const MAGAZINES: RelateMagazine[] = [
  {
    slug: "footsteps",
    series: "Footsteps",
    clubName: "Surge",
    clubSlug: "surge",
    theme: "The Jesus Way",
    seasonLabel: "Spring 2026 · Sep 1 – Nov 30",
    cover: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=1600&q=85",
    coverLines: [
      "Walk with Jesus for thirteen weeks",
      "The way, the truth, the life",
      "Follow the footsteps",
    ],
    summary:
      "Spring 2026 study guide for Surge: thirteen weeks of walking the Jesus way — the call, the beatitudes, the lower love, the cross, the sending. One verse and one daily read for every day of the season.",
    editions: [
      {
        label: "Footsteps",
        ageRange: "16–21 yrs",
        clubSlug: "surge",
        summary:
          "The Surge study guide — a daily read for every day of the Spring 2026 season.",
        weekTitles: [
          "The call",
          "Blessed foundations",
          "Love that goes lower",
          "Truth that sets free",
          "Money and the kingdom",
          "Prayer that persists",
          "The cross-shaped life",
          "Faith for the long road",
          "Forgiveness without limit",
          "The kingdom in you",
          "Communion and joining",
          "Sent ones",
          "Hope that holds",
        ],
      },
    ],
  },
  {
    slug: "rooted",
    series: "Rooted",
    clubName: "Sprout",
    clubSlug: "sprout",
    theme: "Roots & Shoots",
    seasonLabel: "Spring 2026 · Sep 1 – Nov 30",
    cover: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1600&q=85",
    coverLines: [
      "A seed is not in a hurry",
      "Thirteen weeks to a strong tree",
      "Grow where you're planted",
    ],
    summary:
      "The Spring 2026 study guide for Sprout children and teens — three age-graded editions growing from a tiny seed to a tree with deep roots. A verse, a try-it and a prayer for every day of the season.",
    editions: [
      {
        label: "Rooted — Kids",
        ageRange: "6–8 yrs",
        clubSlug: "sprout",
        summary:
          "From a tiny seed to a tree with deep roots — one verse and one try-it for every day of the season.",
        weekTitles: [
          "The tiniest seed",
          "Water and roots",
          "Sunlight",
          "Good soil",
          "Pulling weeds",
          "The strong sprout",
          "The straight stem",
          "Reaching leaves",
          "The patient bud",
          "Opening blossoms",
          "Sweet fruit",
          "Deep roots in storms",
          "The giving garden",
        ],
      },
      {
        label: "Rooted — Tweens",
        ageRange: "9–11 yrs",
        clubSlug: "sprout",
        summary:
          "The hidden root, living water, storms, pruning and fruit — with a verse and a try-it for every day.",
        weekTitles: [
          "The hidden root",
          "Living water",
          "The sun above",
          "The taproot",
          "Storm weather",
          "The pruning year",
          "One trunk",
          "Spreading branches",
          "Scattering seeds",
          "Seasonal fruit",
          "Tree by the water",
          "Rings of the season",
          "The giving grove",
        ],
      },
      {
        label: "Rooted — Teens",
        ageRange: "12–15 yrs",
        clubSlug: "sprout",
        summary:
          "Belonging, doubt, identity, storms and fruit — growing up with a verse and a try-it for every day.",
        weekTitles: [
          "Chosen family",
          "Honest questions",
          "The drought",
          "Image bearers",
          "Bent trunks",
          "Grafted in",
          "Growth rings",
          "The trellis",
          "Humble seeds",
          "Daily fruit",
          "Winter rest",
          "Waiting sap",
          "The grove",
        ],
      },
    ],
  },
];

export function getMagazine(slug: string): RelateMagazine | undefined {
  return MAGAZINES.find((m) => m.slug === slug);
}

export function getMagazinesForClub(clubSlug: string): RelateMagazine[] {
  return MAGAZINES.filter((m) => m.clubSlug === clubSlug);
}

export type StoreCategory = "All" | "Apparel" | "Accessories" | "Home & Study";

export type StoreItem = {
  id: string;
  category: Exclude<StoreCategory, "All">;
  name: string;
  price: number;
  image: string;
  blurb: string;
};

export const STORE_CATEGORIES: StoreCategory[] = [
  "All",
  "Apparel",
  "Accessories",
  "Home & Study",
];

const PHOTO = (id: string) =>
  `https://images.unsplash.com/${id}?w=400&h=400&fit=crop&q=80&auto=format`;

export const STORE_ITEMS: StoreItem[] = [
  {
    id: "relate-tee",
    category: "Apparel",
    name: "Relate Tee",
    price: 220,
    image: PHOTO("photo-1576566588028-4147f3842f27"),
    blurb: "Soft cotton tee with the gold Relate emblem.",
  },
  {
    id: "club-hoodie",
    category: "Apparel",
    name: "Club Hoodie",
    price: 450,
    image: PHOTO("photo-1556821840-3a63f95609a7"),
    blurb: "Cozy pullover hoodie for club days and camps.",
  },
  {
    id: "faith-cap",
    category: "Apparel",
    name: "Faith Cap",
    price: 180,
    image: PHOTO("photo-1521369909029-2afed882baee"),
    blurb: "Gold-embroidered cap for sunny outings.",
  },
  {
    id: "tote-bag",
    category: "Accessories",
    name: "Tote Bag",
    price: 150,
    image: PHOTO("photo-1597484661643-2f5fef640dd1"),
    blurb: "Everyday tote — books, snacks and everything in between.",
  },
  {
    id: "sip-bottle",
    category: "Accessories",
    name: "Sip Bottle",
    price: 190,
    image: PHOTO("photo-1602143407151-7111542de6e8"),
    blurb: "BPA-free bottle to keep your water cold.",
  },
  {
    id: "faith-wristband",
    category: "Accessories",
    name: "Faith Wristband",
    price: 30,
    image: PHOTO("photo-1573408301185-9146fe634ad0"),
    blurb: "Silicone wristband — wear your club colours.",
  },
  {
    id: "sunday-mug",
    category: "Home & Study",
    name: "Sunday Mug",
    price: 160,
    image: PHOTO("photo-1514228742587-6b1558fcca3d"),
    blurb: "Heavy ceramic mug for study breaks.",
  },
  {
    id: "study-notebook",
    category: "Home & Study",
    name: "Notebook",
    price: 90,
    image: PHOTO("photo-1524995997946-a1c2e315a42f"),
    blurb: "A5 notebook for homework and ideas.",
  },
  {
    id: "prayer-journal",
    category: "Home & Study",
    name: "Prayer Journal",
    price: 140,
    image: PHOTO("photo-1544716278-ca5e3f4abd8c"),
    blurb: "Guided journal with weekly reflection pages.",
  },
  {
    id: "sticker-pack",
    category: "Home & Study",
    name: "Sticker Pack",
    price: 40,
    image: PHOTO("photo-1618005182384-a83a8bd57fbe"),
    blurb: "Ten vinyl stickers for books and laptops.",
  },
];