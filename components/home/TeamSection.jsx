export default function TeamSection() {
  const team = [
    {
      img: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=400&h=500&auto=format&fit=crop",
      name: "Community Outreach",
      role: "Serving families in need",
    },
    {
      img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=400&h=500&auto=format&fit=crop",
      name: "Youth Mentorship",
      role: "Guiding the next generation",
    },
    {
      img: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=400&h=500&auto=format&fit=crop",
      name: "Skill Workshops",
      role: "Learning and growing together",
    },
    {
      img: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=400&h=500&auto=format&fit=crop",
      name: "Volunteer Teams",
      role: "Hands-on community support",
    },
  ];

  return (
    <section className="relative py-16 md:py-20 px-4 overflow-hidden" style={{ backgroundColor: "#1d2a4d" }}>
      <div className="absolute inset-0 opacity-[0.05]" style={{ background: "radial-gradient(ellipse at 20% 50%, #13c5dd 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, #eff5f9 0%, transparent 60%)" }} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-medium text-white">
            Making a Difference Together
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#13c5dd" }}>
            Our team walks alongside individuals and families, offering prayer, mentorship,
            and practical support to build stronger communities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {team.map((member, i) => (
            <div
              key={i}
              className="group rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "#eff5f9" }}
            >
              <div className="overflow-hidden">
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-medium" style={{ color: "#1d2a4d" }}>
                  {member.name}
                </h3>
                <p className="text-sm mt-1" style={{ color: "#1d2a4d" }}>
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#13c5dd" }}>
            Together, we are reaching the less privileged, offering Spirit-led mentorship,
            and addressing the needs of the whole person — body, mind, and soul.
          </p>
        </div>
      </div>
    </section>
  );
}
