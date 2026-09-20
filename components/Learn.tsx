import { LuHeart, LuUsers, LuShield, LuSparkles } from "react-icons/lu";

export default function Learn() {
  const features = [
    {
      icon: <LuSparkles className={"text-4xl text-cyan"} />,
      title: "Skills",
      description:
        "Life skills, mentoring and career guidance for every season — from school support and tuition help to CV writing and financial literacy.",
    },
    {
      icon: <LuUsers className={"text-4xl text-cyan"} />,
      title: "Social",
      description:
        "Clubs for every age and stage — children, young youth, singles, single parents, couples and families — so everyone finds their crew and belongs.",
    },
    {
      icon: <LuHeart className={"text-4xl text-cyan"} />,
      title: "Spiritual",
      description:
        "A daily rhythm of six prayer times — dawn to evening — a verse for every day, and Bible reading guides for every age.",
    },
    {
      icon: <LuShield className={"text-4xl text-cyan"} />,
      title: "Support",
      description:
        "Food relief, school fees, uniforms, childcare and counselling — ask for help and someone walks with you.",
    },
  ];

  return (
    <section className={"py-16 md:py-24 bg-white px-4"}>
      <div className={"max-w-6xl mx-auto"}>
        <div className={"text-center mb-12 md:mb-16"}>
          <h4 className={"text-cyan font-medium mb-3"}>WHAT RELATE DOES</h4>
          <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
            <span className={"text-cyan"}>Grow</span> in every{" "}
            <br className={"hidden sm:block"} />
            area of life
          </h2>
        </div>
        <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"}>
          {features.map((feature, i) => (
            <div
              key={i}
              className={
                "bg-gray-50 p-6 rounded-lg text-center hover:shadow-lg transition-shadow duration-300"
              }
            >
              <div className={"mb-4 flex justify-center"}>{feature.icon}</div>
              <h3 className={"text-lg font-semibold text-gray-800 mb-2"}>
                {feature.title}
              </h3>
              <p className={"text-gray-600 text-sm leading-relaxed"}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
