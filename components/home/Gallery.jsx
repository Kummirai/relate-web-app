export default function Gallery() {
  const images = [
    {
      src: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600&h=400&auto=format&fit=crop",
      alt: "Community gathering",
      span: "col-span-1",
    },
    {
      src: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&h=400&auto=format&fit=crop",
      alt: "Volunteers helping",
      span: "col-span-1",
    },
    {
      src: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=600&h=400&auto=format&fit=crop",
      alt: "Team working together",
      span: "col-span-1",
    },
    {
      src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&h=400&auto=format&fit=crop",
      alt: "Youth group activity",
      span: "col-span-1",
    },
    {
      src: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=600&h=400&auto=format&fit=crop",
      alt: "Outreach event",
      span: "col-span-1",
    },
    {
      src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=600&h=400&auto=format&fit=crop",
      alt: "Mentorship session",
      span: "col-span-1",
    },
  ];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: "white" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-semibold" style={{ color: "#1d2a4d" }}>
            Moments That Matter
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            A glimpse into the life of our community — serving, learning, and growing together.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              className={`${img.span} overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full aspect-[3/2] object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
