"use client";

import { useEffect, useState } from "react";
import { HiOutlineHeart, HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineShieldCheck, HiOutlineLightBulb, HiOutlineArrowRight, HiOutlineMapPin, HiOutlineBookOpen, HiOutlineStar, HiOutlineGlobeAlt, HiOutlineCalendarDays, HiOutlineCurrencyDollar, HiOutlineClock } from "react-icons/hi2";
import { IoShieldOutline } from "react-icons/io5";
import { MdOutlinePsychology, MdOutlineFamilyRestroom } from "react-icons/md";

const topics = [
  {
    icon: <HiOutlineAcademicCap />,
    title: "Career Guidance",
    slug: "career-guidance",
    desc: "Discover your strengths, explore career paths, and get practical advice on education, job applications, and building a future you can be proud of.",
  },
  {
    icon: <IoShieldOutline />,
    title: "Drugs & Alcohol",
    slug: "drugs-alcohol",
    desc: "Understanding the risks, building resilience against peer pressure, and finding healthier ways to cope with life's challenges.",
  },
  {
    icon: <MdOutlineFamilyRestroom />,
    title: "Teenage Pregnancy",
    slug: "teen-pregnancy",
    desc: "Support, guidance, and non-judgmental care for young people navigating pregnancy, parenthood, and the choices ahead.",
  },
  {
    icon: <MdOutlinePsychology />,
    title: "Mental Health",
    slug: "mental-health",
    desc: "Anxiety, depression, stress, and self-esteem — learn to recognise the signs and find support that helps you thrive.",
  },
  {
    icon: <HiOutlineUserGroup />,
    title: "Peer Pressure",
    slug: "peer-pressure",
    desc: "Build the confidence to make your own choices, stand firm in your values, and surround yourself with positive influences.",
  },
  {
    icon: <HiOutlineLightBulb />,
    title: "Identity & Purpose",
    slug: "identity-purpose",
    desc: "Who are you? What are you here for? Explore your identity, your gifts, and the unique purpose God has for your life.",
  },
];

function HeroSection() {
  return (
    <section className="relative min-h-[70vh] overflow-hidden flex flex-col items-center justify-evenly px-4 py-16">
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1920&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(29,42,77,0.9) 0%, rgba(19,197,221,0.3) 100%)" }} />
      </div>
      <div className="absolute inset-0 -z-10 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 30% 70%, #13c5dd 2px, transparent 2px), radial-gradient(circle at 80% 20%, #13c5dd 1px, transparent 1px)", backgroundSize: "50px 50px, 30px 30px" }} />

      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs mb-6" style={{ backgroundColor: "rgba(239,245,249,0.9)", color: "#13c5dd" }}>
          <HiOutlineHeart className="text-sm" />
          <span>Relate Youth — You Belong Here</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-medium leading-tight text-white">
          You Are Seen.
          <br />
          <span style={{ color: "#13c5dd" }}>
            You Are Loved. You Matter.
          </span>
        </h1>
        <p className="text-sm md:text-base max-w-xl mx-auto mt-6 leading-relaxed" style={{ color: "#eff5f9" }}>
          Real community, real growth, real fun. We walk with you through every season.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-xs">
          <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: "rgba(19,197,221,0.25)", color: "#13c5dd" }}>Activities</span>
          <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>Real Talk</span>
          <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>Bible</span>
          <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>Support</span>
        </div>
      </div>
    </section>
  );
}

const activities = [
  {
    icon: <HiOutlineMapPin />,
    title: "Hiking & Nature Walks",
    desc: "Explore the outdoors, build endurance, and connect with God's creation through guided hikes across scenic trails.",
    img: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=600&h=400&auto=format&fit=crop",
    date: "March 6, 2026",
    time: "7:00 AM - 12:00 PM",
    venue: "Nyanga Mountains Trail",
    fee: "Free",
    age: "Ages 13 - 25",
  },
  {
    icon: <HiOutlineHeart />,
    title: "Sports Day",
    desc: "Friendly competitions in football, netball, athletics, and team games that build discipline, teamwork, and healthy living.",
    img: "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?q=80&w=600&h=400&auto=format&fit=crop",
    date: "December 12, 2026",
    time: "8:00 AM - 4:00 PM",
    venue: "Relate Community Sports Grounds",
    fee: "$2 entry",
    age: "All youth welcome",
  },
  {
    icon: <HiOutlineBookOpen />,
    title: "Bible Quiz & Scripture Competition",
    desc: "A league-style competition for ages 10–15 running two seasons per year. 12 teams of 3 participants each, 6 sessions of scripture-based challenges.",
    img: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=600&h=400&auto=format&fit=crop",
    date: "Season 1: Mar-May | Season 2: Jul-Sep",
    time: "10:00 AM - 1:00 PM",
    venue: "Relate Community Hall",
    fee: "Free (prizes for winners)",
    age: "Ages 10 - 15",
    link: "/youth/quiz",
  },
  {
    icon: <HiOutlineUserGroup />,
    title: "Community Outreach",
    desc: "Serve the community through clean-ups, visiting the elderly, feeding programs, and being the hands and feet of Jesus.",
    img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&h=400&auto=format&fit=crop",
    date: "August 2, 2026",
    time: "8:00 AM - 2:00 PM",
    venue: "Various locations (meet at Relate Centre)",
    fee: "Free",
    age: "All youth welcome",
  },
  {
    icon: <HiOutlineStar />,
    title: "Talent & Music Showcase",
    desc: "Singing, dancing, poetry, drama, and creative arts — a platform for young people to shine and share their gifts.",
    img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&h=400&auto=format&fit=crop",
    date: "September 20, 2026",
    time: "2:00 PM - 6:00 PM",
    venue: "Relate Community Hall",
    fee: "Free entry",
    age: "Ages 10 - 25",
  },
  {
    icon: <HiOutlineGlobeAlt />,
    title: "Youth Camp & Retreat",
    desc: "A weekend away for worship, teaching, team-building, and deepening relationships with God and one another.",
    img: "https://images.unsplash.com/photo-1507537362848-9c7e70b7b5c1?q=80&w=600&h=400&auto=format&fit=crop",
    date: "November 6 - 8, 2026",
    time: "Fri 4:00 PM - Sun 2:00 PM",
    venue: "Relate Retreat Centre, Chimanimani",
    fee: "$25 (includes meals & transport)",
    age: "Ages 14 - 25",
  },
];

function RegistrationModal({ activity, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [questions, setQuestions] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = `Registration for: ${activity.title}\nName: ${name}\nPhone: ${phone}\nAge: ${age}\nQuestions: ${questions}`;
    const url = `https://wa.me/27782677436?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    onClose();
  };

  if (!activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(29,42,77,0.6)" }}>
      <div className="rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "white" }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium" style={{ color: "#1d2a4d" }}>
              Register for {activity.title}
            </h3>
            <button onClick={onClose} className="text-lg leading-none cursor-pointer bg-transparent border-0" style={{ color: "#1d2a4d" }}>&times;</button>
          </div>
          <p className="text-xs mb-5" style={{ color: "#1d2a4d" }}>
            Your details will be sent via WhatsApp. We will confirm your registration shortly.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1" style={{ color: "#1d2a4d" }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "#eff5f9", color: "#1d2a4d" }}
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "#1d2a4d" }}>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "#eff5f9", color: "#1d2a4d" }}
                placeholder="+27 XXX XXX XXX"
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "#1d2a4d" }}>Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "#eff5f9", color: "#1d2a4d" }}
                min="1"
                max="120"
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "#1d2a4d" }}>Questions or Comments (optional)</label>
              <textarea
                rows={3}
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                style={{ backgroundColor: "#eff5f9", color: "#1d2a4d" }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg text-sm text-white transition-all hover:opacity-90 cursor-pointer border-0"
              style={{ backgroundColor: "#13c5dd" }}
            >
              Submit via WhatsApp
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ActivitiesSection() {
  const [selectedActivity, setSelectedActivity] = useState(null);

  return (
    <section className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(160deg, white 0%, #f0f6fa 50%, white 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <HiOutlineStar className="text-3xl mx-auto mb-2" style={{ color: "#13c5dd" }} />
          <h2 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
            Activities & Events
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-3" style={{ color: "#1d2a4d" }}>
            Something for everyone — from hiking trails to game days, talent shows to Bible quizzes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity, i) => (
            <div
              key={i}
              className="group rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "white" }}
            >
              <div className="overflow-hidden">
                <img
                  src={activity.img}
                  alt={activity.title}
                  className="w-full aspect-[3/2] object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-5 md:p-6">
                <h3 className="text-lg font-medium mb-2" style={{ color: "#1d2a4d" }}>
                  {activity.title}
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#1d2a4d" }}>
                  {activity.desc}
                </p>
                <div className="space-y-2 text-xs" style={{ color: "#1d2a4d" }}>
                  <div className="flex items-center gap-2">
                    <HiOutlineCalendarDays className="shrink-0" style={{ color: "#13c5dd" }} />
                    <span>{activity.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineClock className="shrink-0" style={{ color: "#13c5dd" }} />
                    <span>{activity.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineMapPin className="shrink-0" style={{ color: "#13c5dd" }} />
                    <span>{activity.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineCurrencyDollar className="shrink-0" style={{ color: "#13c5dd" }} />
                    <span>{activity.fee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineUserGroup className="shrink-0" style={{ color: "#13c5dd" }} />
                    <span>{activity.age}</span>
                  </div>
                </div>
                {activity.link ? (
                  <a
                    href={activity.link}
                    className="mt-4 w-full block text-center text-sm py-2.5 rounded-lg text-white transition-all hover:opacity-90 border-0"
                    style={{ backgroundColor: "#13c5dd" }}
                  >
                    View League Details
                  </a>
                ) : (
                  <button
                    onClick={() => setSelectedActivity(activity)}
                    className="mt-4 w-full text-sm py-2.5 rounded-lg text-white transition-all hover:opacity-90 cursor-pointer border-0"
                    style={{ backgroundColor: "#13c5dd" }}
                  >
                    Register
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <RegistrationModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </section>
  );
}

function TopicsSection() {
  return (
    <section id="topics" className="py-16 md:py-20 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #eff5f9 0%, white 50%, #eff5f9 100%)" }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #13c5dd 1px, transparent 1px)", backgroundSize: "25px 25px" }} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <HiOutlineHeart className="text-3xl mx-auto mb-2" style={{ color: "#13c5dd" }} />
          <h2 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
            Real Talk
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-3" style={{ color: "#1d2a4d" }}>
            Real talk about the things young people face every day. No judgment, just support.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, i) => (
            <div
              key={i}
              className="rounded-lg p-6 md:p-8 transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "white" }}
            >
              <div className="size-12 rounded-xl flex items-center justify-center text-xl mb-4" style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}>
                {topic.icon}
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: "#1d2a4d" }}>
                {topic.title}
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#1d2a4d" }}>
                {topic.desc}
              </p>
              <a
                href={`/resources?topic=${topic.slug}`}
                className="inline-flex items-center gap-1.5 text-sm px-5 py-2 rounded-lg text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#13c5dd" }}
              >
                <span>Get Support</span>
                <span>→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BibleLessonsSection() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch("/api/series");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setLessons(data);
      } catch (error) {
        console.error("Failed to fetch Bible lessons:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const visibleLessons = lessons.slice(0, visibleCount);
  const hasMore = visibleCount < lessons.length;

  return (
    <section id="bible" className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(160deg, white 0%, #f0f6fa 50%, white 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <HiOutlineBookOpen className="text-3xl mx-auto mb-2" style={{ color: "#13c5dd" }} />
          <h2 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
            Word for Today
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-3" style={{ color: "#1d2a4d" }}>
            Practical, relevant Bible lessons that speak to the things young people face today.
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden animate-pulse" style={{ backgroundColor: "#eff5f9" }}>
                <div className="aspect-[16/9]" style={{ backgroundColor: "#e2e8f0" }} />
                <div className="p-5 space-y-3">
                  <div className="h-4 rounded w-3/4" style={{ backgroundColor: "#e2e8f0" }} />
                  <div className="h-3 rounded w-full" style={{ backgroundColor: "#e2e8f0" }} />
                  <div className="h-3 rounded w-2/3" style={{ backgroundColor: "#e2e8f0" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleLessons.map((lesson) => (
                <a
                  key={lesson.tag}
                  href={`https://bibletalk.tv/${lesson.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 block"
                  style={{ backgroundColor: "white" }}
                >
                  <div className="overflow-hidden">
                    <img
                      src={lesson.image}
                      alt={lesson.title}
                      className="w-full aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-medium mb-2 line-clamp-2" style={{ color: "#1d2a4d" }}>
                      {lesson.title}
                    </h3>
                    <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#1d2a4d" }}>
                      {lesson.excerpt}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="inline-flex items-center gap-2 text-white text-sm px-8 py-3 rounded-lg transition-all hover:opacity-90"
                  style={{ backgroundColor: "#13c5dd" }}
                >
                  Load More Lessons
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function SupportSection() {
  return (
    <section className="relative py-16 md:py-20 px-4 overflow-hidden" style={{ backgroundColor: "#1d2a4d" }}>
      <div className="absolute inset-0 opacity-[0.06]" style={{ background: "radial-gradient(ellipse at 50% 0%, #13c5dd 0%, transparent 50%)" }} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <div className="size-16 rounded-lg flex items-center justify-center text-3xl mx-auto mb-4" style={{ backgroundColor: "#13c5dd", color: "white" }}>
            <HiOutlineShieldCheck />
          </div>
          <HiOutlineShieldCheck className="text-3xl mx-auto mb-2" style={{ color: "#13c5dd" }} />
          <h2 className="text-4xl font-medium text-white">
            You Are Not Alone
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-3" style={{ color: "#13c5dd" }}>
            Whatever you are going through, there are people who care and want to help.
          </p>
        </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center rounded-xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "#eff5f9" }}>
              <div className="size-14 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4" style={{ backgroundColor: "#13c5dd", color: "white" }}>
                <HiOutlineHeart />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: "#1d2a4d" }}>
                Talk to Someone
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                Reach out privately. We are here to listen without judgment.
              </p>
            </div>

            <div className="text-center rounded-xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "#eff5f9" }}>
              <div className="size-14 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4" style={{ backgroundColor: "#13c5dd", color: "white" }}>
                <HiOutlineUserGroup />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: "#1d2a4d" }}>
                Find Community
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                Join other young people walking through the same things you are.
              </p>
            </div>

            <div className="text-center rounded-xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "#eff5f9" }}>
              <div className="size-14 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4" style={{ backgroundColor: "#13c5dd", color: "white" }}>
                <HiOutlineAcademicCap />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: "#1d2a4d" }}>
                Get Guidance
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                Mentorship and advice on careers, education, and life decisions.
              </p>
            </div>
          </div>

        <div className="text-center mt-12">
          <a
            href="mailto:ajaxmilton@hotmail.com"
            className="inline-flex items-center gap-2 text-white text-sm px-8 py-3.5 rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "#13c5dd" }}
          >
            <HiOutlineHeart className="text-base" />
            <span>Reach Out for Support</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="py-16 md:py-20 px-4" style={{ background: "radial-gradient(ellipse at 50% 100%, #eff5f9 0%, white 70%)" }}>
      <div className="max-w-4xl mx-auto text-center">
        <HiOutlineStar className="text-4xl mx-auto mb-4" style={{ color: "#13c5dd" }} />
        <h2 className="text-3xl md:text-4xl font-medium mb-3" style={{ color: "#1d2a4d" }}>
          Your Future Starts Now
        </h2>
        <p className="text-sm max-w-lg mx-auto mb-8" style={{ color: "#1d2a4d" }}>
          You don&apos;t have to have it all figured out. Just take the first step.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:ajaxmilton@hotmail.com"
            className="inline-flex items-center gap-2 text-white text-sm px-8 py-3.5 rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "#13c5dd" }}
          >
            <span>Get in Touch</span>
            <HiOutlineArrowRight className="text-base" />
          </a>
          <a
            href="#topics"
            className="text-sm px-8 py-3.5 rounded-lg transition-all hover:opacity-80"
            style={{ border: "1px solid #13c5dd", color: "#1d2a4d" }}
          >
            Explore Topics
          </a>
        </div>
      </div>
    </section>
  );
}

export default function YouthPage() {
  return (
    <>
      <HeroSection />
      <ActivitiesSection />
      <TopicsSection />
      <BibleLessonsSection />
      <SupportSection />
      <ClosingCTA />
    </>
  );
}
