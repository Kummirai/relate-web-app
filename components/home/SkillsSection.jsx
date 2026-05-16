import { HiOutlineMusicalNote } from "react-icons/hi2";
import { MdOutlineDesignServices } from "react-icons/md";
import { LiaLaptopCodeSolid } from "react-icons/lia";
import { IoCameraOutline } from "react-icons/io5";
import { BiPencil } from "react-icons/bi";
import { TbLanguageHiragana } from "react-icons/tb";

export default function SkillsSection() {
  const skills = [
    { icon: <HiOutlineMusicalNote />, title: "Music", desc: "Singing, instruments, production" },
    { icon: <MdOutlineDesignServices />, title: "Art & Design", desc: "Creative visual expression" },
    { icon: <LiaLaptopCodeSolid />, title: "Programming", desc: "Web, mobile & software" },
    { icon: <IoCameraOutline />, title: "Photography", desc: "Photo & video creation" },
    { icon: <BiPencil />, title: "Writing", desc: "Content & storytelling" },
    { icon: <TbLanguageHiragana />, title: "Languages", desc: "Teaching & translation" },
  ];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: "#eff5f9" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-semibold" style={{ color: "#1d2a4d" }}>
            Skills We Exchange
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            Share what you know, learn what you don&apos;t. Our community thrives when we grow together.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {skills.map((skill, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "white" }}
            >
              <div
                className="size-12 rounded-xl flex items-center justify-center mx-auto text-2xl"
                style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}
              >
                {skill.icon}
              </div>
              <h3 className="text-lg font-medium mt-4" style={{ color: "#1d2a4d" }}>
                {skill.title}
              </h3>
              <p className="text-sm mt-1" style={{ color: "#1d2a4d" }}>
                {skill.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
