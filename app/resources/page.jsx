"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HiOutlineHeart, HiOutlineArrowRight, HiOutlineClock, HiOutlineUser, HiOutlineCalendarDays, HiOutlineAcademicCap, HiOutlineEnvelope } from "react-icons/hi2";

const skillData = {
  entrepreneurial: {
    title: "Entrepreneurial Skills",
    instructor: "Tafadzwa M.",
    duration: "8 Weeks",
    schedule: "Saturdays & Sundays, 10:00 AM - 12:00 PM",
    outline: [
      "Introduction to Entrepreneurship — Identifying opportunities in your community",
      "Business Planning — Creating a simple, actionable business plan",
      "Financial Literacy — Budgeting, saving, pricing, and profit tracking",
      "Marketing Basics — How to promote your product or service",
      "Customer Relations — Building trust and growing your client base",
      "Managing Resources — Working with limited capital and scaling up",
      "Legal & Ethical Foundations — Permits, taxes, and running an honest business",
      "Graduation & Business Pitch — Present your business idea and receive feedback",
    ],
  },
  baking: {
    title: "Baking",
    instructor: "Esther W.",
    duration: "6 Weeks",
    schedule: "Saturdays & Sundays, 10:00 AM - 12:00 PM",
    outline: [
      "Baking Basics — Ingredients, tools, and kitchen safety",
      "Bread Making — Yeast doughs, kneading, and proofing",
      "Cakes & Cupcakes — Mixing, baking, and simple decorating",
      "Pastries & Cookies — Shortcrust, choux, and cookie techniques",
      "Savory Bakes — Pies, quiches, and bread rolls",
      "Starting a Home Bakery — Pricing, packaging, and selling your products",
    ],
  },
  sewing: {
    title: "Sewing & Tailoring",
    instructor: "Grace N.",
    duration: "8 Weeks",
    schedule: "Saturdays & Sundays, 10:00 AM - 12:00 PM",
    outline: [
      "Getting Started — Sewing machine basics, tools, and fabric knowledge",
      "Hand Stitching & Mending — Essential stitches and simple repairs",
      "Taking Measurements — How to measure accurately for garments",
      "Reading Patterns — Understanding and following sewing patterns",
      "Making a Skirt — Cut, sew, and finish a simple garment",
      "Shirts & Blouses — Collars, sleeves, and buttonholes",
      "Alterations & Adjustments — Hemming, taking in, and letting out",
      "Building a Tailoring Business — Finding clients and setting prices",
    ],
  },
  programming: {
    title: "Programming & Technology",
    instructor: "Tanaka C.",
    duration: "10 Weeks",
    schedule: "Saturdays & Sundays, 10:00 AM - 12:00 PM",
    outline: [
      "Computer Basics — Navigating files, typing, and internet safety",
      "Introduction to HTML — Structuring web pages",
      "CSS Fundamentals — Styling and layout",
      "JavaScript Basics — Making pages interactive",
      "Building a Simple Website — Project-based learning",
      "Introduction to Python — Variables, loops, and functions",
      "Working with Data — Spreadsheets and basic databases",
      "Problem Solving with Code — Real-world projects",
      "Portfolio Development — Showcasing your work",
      "Next Steps — Career paths in technology",
    ],
  },
  plumbing: {
    title: "Plumbing & Home Maintenance",
    instructor: "Peter K.",
    duration: "8 Weeks",
    schedule: "Saturdays & Sundays, 10:00 AM - 12:00 PM",
    outline: [
      "Introduction to Plumbing — Tools, safety, and pipe types",
      "Fixing Leaks — Taps, pipes, and joints",
      "Drainage Systems — Unblocking drains and maintaining flow",
      "Fixture Installation — Sinks, toilets, and shower fittings",
      "Water Pressure & Supply — Understanding your home system",
      "Basic Home Maintenance — Painting, tiling, and carpentry basics",
      "Electrical Safety — What every homeowner should know",
      "Building a Plumbing Trade — Finding work and serving your community",
    ],
  },
  "life-skills": {
    title: "Basic Life Skills",
    instructor: "Ruth M.",
    duration: "6 Weeks",
    schedule: "Saturdays & Sundays, 10:00 AM - 12:00 PM",
    outline: [
      "Personal Organisation — Time management and goal setting",
      "Cooking Basics — Nutritious meals on a budget",
      "Home Care — Cleaning, laundry, and maintaining a healthy home",
      "Financial Management — Budgeting, saving, and avoiding debt",
      "Communication Skills — Speaking, listening, and resolving conflict",
      "Health & Wellbeing — Hygiene, nutrition, and building healthy habits",
    ],
  },
};

const topicData = {
  "career-guidance": {
    title: "Career Guidance",
    articles: [
      {
        heading: "Discovering Your Strengths",
        body: "Choosing a career path can feel overwhelming, but you don't have to have it all figured out at once. Start by identifying your strengths, interests, and the things that give you a sense of purpose. Think about what comes naturally to you — the skills people compliment you on, the tasks that energise rather than drain you. These are clues pointing toward the kind of work you were made for.",
      },
      {
        heading: "Exploring Your Options",
        body: "Explore different options through mentorship, volunteering, and talking to people in fields that interest you. Every experience — even the ones that don't work out — teaches you something valuable. Shadow someone in a trade you are curious about. Ask questions. Try new things. The more you expose yourself to, the clearer your path will become.",
      },
      {
        heading: "Every Path Has Dignity",
        body: "There is dignity in all honest work. Whether you pursue a trade, a business, or further education, what matters most is that you give it your best and keep growing. Some of the most successful people started with very little. Your beginning does not determine your end. Stay focused, stay humble, and keep taking the next right step.",
      },
    ],
  },
  "drugs-alcohol": {
    title: "Drugs & Alcohol Awareness",
    articles: [
      {
        heading: "Understanding the Risks",
        body: "Drugs and alcohol can seem like an escape, but they often lead to deeper problems — affecting your health, relationships, and future. You are stronger than the pressures you face. Substance use can start as curiosity or peer pressure, but it can quickly take control. Understanding the real risks — addiction, health damage, financial loss — helps you make informed decisions.",
      },
      {
        heading: "Building Resilience",
        body: "Build resilience by surrounding yourself with people who encourage and support you. Find healthy outlets for stress — sports, music, prayer, or talking to someone you trust. When you have positive activities and people in your life, the urge to escape through substances loses its power. You are not alone in this fight.",
      },
      {
        heading: "You Can Reach Out",
        body: "If you or someone you know is struggling, reach out for help. You don't have to face it alone. There is always a way forward, and there are people ready to walk with you. Recovery is possible, and it starts with a single honest conversation. Do not let shame or fear keep you from getting the support you deserve.",
      },
    ],
  },
  "teen-pregnancy": {
    title: "Teenage Pregnancy Support",
    articles: [
      {
        heading: "You Are Not Alone",
        body: "Finding out you are pregnant as a teenager can be frightening, but you are not alone. There are people who will support you with compassion and without judgment. You may feel scared, confused, or unsure of what to do next. All of these feelings are normal. What matters is that you know there is a community ready to stand with you.",
      },
      {
        heading: "Know Your Options",
        body: "You have choices, and you deserve accurate information and caring guidance to make the decision that is right for you. Talk to a trusted adult, a counsellor, or reach out to us privately. We can help you understand your options, connect you with healthcare, and support you in planning your next steps.",
      },
      {
        heading: "We Walk With You",
        body: "Whatever you decide, we are here to walk with you — offering practical support, prayer, and a community that believes in you and your future. You can still finish school, pursue your dreams, and build a good life. This moment does not define your entire story.",
      },
    ],
  },
  "mental-health": {
    title: "Mental Health",
    articles: [
      {
        heading: "It Is Okay to Not Be Okay",
        body: "Mental health is just as important as physical health. Anxiety, depression, and stress are real and common — but they don't define who you are. There is help and there is hope. You are not broken because you struggle. You are human. And every human being deserves care, understanding, and the chance to heal.",
      },
      {
        heading: "Speak Up, Reach Out",
        body: "Talk to someone you trust about how you are feeling. Prayer, rest, healthy routines, and professional support can all play a part in healing. You don't have to struggle in silence. Naming what you are going through is the first step toward getting better. There is no shame in asking for help.",
      },
      {
        heading: "You Are Worth the Effort",
        body: "Taking care of your mind is a sign of strength, not weakness. Reach out, speak up, and give yourself grace. You are worth the effort it takes to heal. Small steps — getting fresh air, talking to a friend, writing down your thoughts — can make a real difference. You don't have to fix everything at once.",
      },
    ],
  },
  "peer-pressure": {
    title: "Peer Pressure",
    articles: [
      {
        heading: "You Have the Right to Choose",
        body: "Everyone faces pressure to fit in. But true belonging doesn't require you to change who you are. The right friends will respect your values and choices. You get to decide what you are comfortable with. No one else can make that decision for you. Your voice matters, and your boundaries deserve to be respected.",
      },
      {
        heading: "How to Say No",
        body: "Learn to say no with confidence. You can be firm and still be kind. Practice what you will say in difficult situations — having a plan makes it easier to stand your ground. Role-play with a trusted friend or adult. The more you practice, the more natural it becomes. Your no is enough — you don't need to explain or justify it.",
      },
      {
        heading: "Choose Your Circle Wisely",
        body: "Surround yourself with people who lift you up, not pull you down. You have the right to choose your path, and you have the strength to walk it. The people closest to you should make you feel safe, valued, and accepted for who you truly are. If a friendship consistently pressures you to compromise your values, it may be time to rethink that relationship.",
      },
    ],
  },
  "identity-purpose": {
    title: "Identity & Purpose",
    articles: [
      {
        heading: "Who Are You?",
        body: "Who are you? This is one of the most important questions you will ever ask. Your identity is not defined by your mistakes, your circumstances, or what others say about you. You are more than your grades, your popularity, or your family background. Your true identity is something deeper — it is who God created you to be.",
      },
      {
        heading: "Created with Purpose",
        body: "You are created with unique gifts, talents, and a purpose that only you can fulfil. Discovering who you are is a journey — one that involves faith, self-reflection, and the courage to be yourself. Ask yourself: What makes me come alive? What problems do I want to solve? What kind of person do I want to become? The answers will guide you.",
      },
      {
        heading: "Trust the Journey",
        body: "Your purpose is not something you need to find all at once. It unfolds over time. Trust the process, stay true to your values, and know that you matter more than you can imagine. Every step you take — even the uncertain ones — is part of the story you are writing with your life. Keep going. You are exactly where you need to be.",
      },
    ],
  },
};

function ResourcesContent() {
  const searchParams = useSearchParams();
  const skill = searchParams.get("skill");
  const topic = searchParams.get("topic");

  const skillInfo = skill ? skillData[skill] : null;
  const topicInfo = topic ? topicData[topic] : null;

  if (!skillInfo && !topicInfo) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-medium mb-4" style={{ color: "#1d2a4d" }}>Resource Not Found</h1>
          <p className="text-sm mb-6" style={{ color: "#1d2a4d" }}>
            Please select a topic or skill from the Skills Exchange or Youth pages to view resources.
          </p>
          <a
            href="/skills"
            className="inline-block text-white text-sm px-6 py-3 rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "#13c5dd" }}
          >
            Go to Skills Exchange
          </a>
        </div>
      </section>
    );
  }

  if (skillInfo) {
    return (
      <>
        <section className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(180deg, #eff5f9 0%, white 50%, #f0f6fa 100%)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-medium mb-3" style={{ color: "#1d2a4d" }}>
                {skillInfo.title}
              </h1>
              <p className="text-sm" style={{ color: "#1d2a4d" }}>
                Learn a practical skill and build a better future
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-12">
              <div className="rounded-lg p-5 text-center" style={{ backgroundColor: "white" }}>
                <HiOutlineUser className="text-xl mx-auto mb-2" style={{ color: "#13c5dd" }} />
                <p className="text-xs mb-1" style={{ color: "#1d2a4d" }}>Instructor</p>
                <p className="text-sm font-medium" style={{ color: "#1d2a4d" }}>{skillInfo.instructor}</p>
              </div>
              <div className="rounded-lg p-5 text-center" style={{ backgroundColor: "white" }}>
                <HiOutlineClock className="text-xl mx-auto mb-2" style={{ color: "#13c5dd" }} />
                <p className="text-xs mb-1" style={{ color: "#1d2a4d" }}>Duration</p>
                <p className="text-sm font-medium" style={{ color: "#1d2a4d" }}>{skillInfo.duration}</p>
              </div>
              <div className="rounded-lg p-5 text-center" style={{ backgroundColor: "white" }}>
                <HiOutlineCalendarDays className="text-xl mx-auto mb-2" style={{ color: "#13c5dd" }} />
                <p className="text-xs mb-1" style={{ color: "#1d2a4d" }}>Schedule</p>
                <p className="text-sm font-medium" style={{ color: "#1d2a4d" }}>{skillInfo.schedule}</p>
              </div>
            </div>

            <div className="rounded-lg p-6 md:p-8 mb-12" style={{ backgroundColor: "white" }}>
              <h2 className="text-xl font-medium mb-6 flex items-center gap-2" style={{ color: "#1d2a4d" }}>
                <HiOutlineAcademicCap style={{ color: "#13c5dd" }} />
                Course Outline
              </h2>
              <div className="space-y-0">
                {skillInfo.outline.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 py-3 border-b last:border-b-0"
                    style={{ borderColor: "#eff5f9" }}
                  >
                    <div
                      className="size-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                      style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm mb-6" style={{ color: "#1d2a4d" }}>
                Spaces are limited. Register now to secure your place.
              </p>
              <a
                href="mailto:ajaxmilton@hotmail.com"
                className="inline-flex items-center gap-2 text-white text-sm px-8 py-3.5 rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: "#13c5dd" }}
              >
                <HiOutlineEnvelope className="text-base" />
                <span>Register for This Course</span>
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4" style={{ backgroundColor: "#1d2a4d" }}>
          <div className="max-w-2xl mx-auto text-center">
            <div className="size-14 rounded-lg flex items-center justify-center text-2xl mx-auto mb-4" style={{ backgroundColor: "#13c5dd", color: "white" }}>
              <HiOutlineHeart />
            </div>
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
              Have Questions?
            </h2>
            <p className="text-sm mb-8" style={{ color: "#13c5dd" }}>
              Not sure which course is right for you? We are happy to help.
            </p>
            <a
              href="mailto:ajaxmilton@hotmail.com"
              className="inline-flex items-center gap-2 text-white text-sm px-8 py-3.5 rounded-lg transition-all hover:opacity-90"
              style={{ backgroundColor: "#13c5dd" }}
            >
              <span>Contact Us</span>
              <HiOutlineArrowRight className="text-base" />
            </a>
          </div>
        </section>
      </>
    );
  }

  if (topicInfo) {
    return (
      <>
        <section className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(180deg, #eff5f9 0%, white 50%, #f0f6fa 100%)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
                {topicInfo.title}
              </h1>
            </div>

            <div className="space-y-8 max-w-3xl mx-auto mb-16">
              {topicInfo.articles.map((article, i) => (
                <div key={i} className="rounded-lg p-6 md:p-8" style={{ backgroundColor: "white" }}>
                  <h2 className="text-lg font-medium mb-3" style={{ color: "#1d2a4d" }}>
                    {article.heading}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                    {article.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4" style={{ backgroundColor: "#1d2a4d" }}>
          <div className="max-w-2xl mx-auto text-center">
            <div className="size-14 rounded-lg flex items-center justify-center text-2xl mx-auto mb-4" style={{ backgroundColor: "#13c5dd", color: "white" }}>
              <HiOutlineHeart />
            </div>
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
              Need Someone to Talk To?
            </h2>
            <p className="text-sm mb-8" style={{ color: "#13c5dd" }}>
              Whatever you are going through, we are here to listen without judgment.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:ajaxmilton@hotmail.com"
                className="inline-flex items-center gap-2 text-white text-sm px-8 py-3.5 rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: "#13c5dd" }}
              >
                <span>Reach Out for Help</span>
                <HiOutlineArrowRight className="text-base" />
              </a>
            </div>
            <p className="text-xs mt-4" style={{ color: "#eff5f9" }}>
              Or email us directly at{" "}
              <a href="mailto:ajaxmilton@hotmail.com" className="underline" style={{ color: "#13c5dd" }}>
                ajaxmilton@hotmail.com
              </a>
            </p>
          </div>
        </section>
      </>
    );
  }
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-sm" style={{ color: "#1d2a4d" }}>Loading...</div>
      </section>
    }>
      <ResourcesContent />
    </Suspense>
  );
}
