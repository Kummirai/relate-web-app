import { HiOutlineHeart, HiOutlineUserGroup, HiOutlineEye, HiOutlineSparkles } from "react-icons/hi2";

export default function AboutPage() {
  return (
    <>
      <section className="py-20 md:py-28 px-4" style={{ backgroundColor: "#eff5f9" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-medium mb-6" style={{ color: "#1d2a4d" }}>
            About Relate
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "#1d2a4d" }}>
            We are a community-driven organization dedicated to strengthening families, equipping youth, and transforming lives through faith, skills, and genuine relationships.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: "#eff5f9" }}>
              <div className="size-12 rounded-lg flex items-center justify-center text-xl mx-auto mb-4" style={{ backgroundColor: "#13c5dd", color: "white" }}>
                <HiOutlineHeart />
              </div>
              <h3 className="text-base font-medium mb-2" style={{ color: "#1d2a4d" }}>Our Mission</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                To walk alongside families and young people, providing spiritual guidance, practical skills, and a supportive community that helps them thrive.
              </p>
            </div>
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: "#eff5f9" }}>
              <div className="size-12 rounded-lg flex items-center justify-center text-xl mx-auto mb-4" style={{ backgroundColor: "#13c5dd", color: "white" }}>
                <HiOutlineEye />
              </div>
              <h3 className="text-base font-medium mb-2" style={{ color: "#1d2a4d" }}>Our Vision</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                A world where every individual knows their worth, discovers their purpose, and has the support they need to build a meaningful future.
              </p>
            </div>
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: "#eff5f9" }}>
              <div className="size-12 rounded-lg flex items-center justify-center text-xl mx-auto mb-4" style={{ backgroundColor: "#13c5dd", color: "white" }}>
                <HiOutlineUserGroup />
              </div>
              <h3 className="text-base font-medium mb-2" style={{ color: "#1d2a4d" }}>Our Community</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                A growing network of families, youth, mentors, and volunteers united by faith and a shared commitment to lifting each other up.
              </p>
            </div>
          </div>

          <div className="rounded-lg p-8 md:p-12" style={{ backgroundColor: "#eff5f9" }}>
            <h2 className="text-2xl font-medium mb-6" style={{ color: "#1d2a4d" }}>Our Story</h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
              <p>
                Relate was born from a simple belief: that we are stronger together. What started as a small community initiative has grown into a ministry that touches lives through Bible study, youth programs, skills training, and family support.
              </p>
              <p>
                We believe every person has God-given potential waiting to be discovered. Whether through studying Scripture, learning a trade, or finding mentorship, we create spaces where people can grow in faith and ability.
              </p>
              <p>
                Our programs are designed to meet people where they are — offering practical help for today and hope for tomorrow. From skills exchange courses to youth discipleship, from Bible reading plans to one-on-one support, everything we do is rooted in relationship.
              </p>
              <p>
                We are not just an organization. We are a family. And there is always room for one more.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-4" style={{ backgroundColor: "#1d2a4d" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="size-14 rounded-lg flex items-center justify-center text-2xl mx-auto mb-4" style={{ backgroundColor: "#13c5dd", color: "white" }}>
            <HiOutlineSparkles />
          </div>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
            What We Believe
          </h2>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: "#eff5f9" }}>
            We believe in the transforming power of God&apos;s Word. We believe every person has value, every story matters, and every step taken in faith leads to something greater. We believe in walking alongside one another — not fixing, but supporting; not judging, but loving.
          </p>
        </div>
      </section>
    </>
  );
}
