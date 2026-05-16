import { HiOutlineBuildingOffice } from "react-icons/hi2";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import { HiOutlineHeart } from "react-icons/hi2";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { HiOutlineUsers } from "react-icons/hi2";

export default function Partners() {
  const partners = [
    { icon: <HiOutlineBuildingOffice />, name: "Local Churches" },
    { icon: <HiOutlineGlobeAlt />, name: "Community Orgs" },
    { icon: <HiOutlineHeart />, name: "Faith Networks" },
    { icon: <HiOutlineBookOpen />, name: "Bible Ministries" },
    { icon: <HiOutlineAcademicCap />, name: "Skill Partners" },
    { icon: <HiOutlineUsers />, name: "Volunteer Groups" },
  ];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: "#eff5f9" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-semibold" style={{ color: "#1d2a4d" }}>
            Our Partners
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            We are grateful for the organizations and networks that make our work possible.
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {partners.map((partner, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "white" }}
            >
              <div
                className="size-12 rounded-xl flex items-center justify-center text-xl mx-auto mb-3"
                style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}
              >
                {partner.icon}
              </div>
              <p className="text-sm font-medium" style={{ color: "#1d2a4d" }}>
                {partner.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
