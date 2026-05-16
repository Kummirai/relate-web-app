import { HiOutlineCalendarDays } from "react-icons/hi2";
import { HiOutlineMapPin } from "react-icons/hi2";
import { HiOutlineClock } from "react-icons/hi2";

export default function UpcomingEvents() {
  const events = [
    {
      title: "Community Skills Workshop",
      date: "June 15, 2026",
      time: "10:00 AM - 2:00 PM",
      location: "Relate Community Center",
      desc: "A hands-on workshop where community members teach and learn practical skills.",
    },
    {
      title: "Bible Study Gathering",
      date: "Every Wednesday",
      time: "6:30 PM - 8:00 PM",
      location: "Online & In-Person",
      desc: "Join us for scripture reading, prayer, and discussion in a welcoming atmosphere.",
    },
    {
      title: "Youth Mentorship Day",
      date: "June 22, 2026",
      time: "9:00 AM - 3:00 PM",
      location: "Relate Community Center",
      desc: "A day dedicated to mentoring young people in leadership, faith, and life skills.",
    },
  ];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: "white" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-semibold" style={{ color: "#1d2a4d" }}>
            Upcoming Events
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            Join us for our next gathering. There&apos;s always something happening at Relate.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "#eff5f9" }}
            >
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "#13c5dd" }}>
                  <HiOutlineCalendarDays />
                  <span>{event.date}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#1d2a4d" }}>
                  {event.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: "#1d2a4d" }}>
                  {event.desc}
                </p>
                <div className="space-y-2 text-xs" style={{ color: "#1d2a4d" }}>
                  <div className="flex items-center gap-2">
                    <HiOutlineClock style={{ color: "#13c5dd" }} />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineMapPin style={{ color: "#13c5dd" }} />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#13c5dd" }}
                >
                  Attend Event
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
