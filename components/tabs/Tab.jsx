"use client";

export default function Tab({
  studyMaterial,
  handleTabSelection,
  selectedTab,
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center text-sm">
      {studyMaterial.map((study) => {
        return (
          <div key={study.id} className="">
            <button
              className={`${selectedTab === study.id ? "bg-zinc-950 text-white border border-zinc-950" : "text-zinc-950 bg-white"} cursor-pointer  rounded-full py-2 px-9  transition-colors duration-200 bg-white border border-zinc-300 hover:bg-zinc-50 `}
              onClick={() => handleTabSelection(study.id)}
            >
              {study.title}
            </button>
          </div>
        );
      })}
    </div>
  );
}
