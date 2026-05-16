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
              className={`${selectedTab === study.id ? "text-white" : "bg-white"} cursor-pointer rounded-full py-2 px-9 transition-colors duration-200`}
              style={{
                backgroundColor: selectedTab === study.id ? "#1d2a4d" : "white",
                border: selectedTab === study.id ? "1px solid #1d2a4d" : "1px solid #13c5dd",
                color: selectedTab === study.id ? "white" : "#1d2a4d",
              }}
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
