import Link from "next/link";

export default function Card({ item }) {
  return (
    <div className="bg-white border hover:-translate-y-1 transition duration-300 shadow shadow-black/10 max-w-100 h-fit" style={{ borderColor: "#1d2a4d1a" }}>
      <img
        className=" max-h-60 w-full object-cover object-top"
        src={item.image}
        alt="officeImage"
      />
      <div className="px-2">
        <p className="text-sm/6 my-3 ml-2 line-clamp-3 h-18" style={{ color: "#1d2a4d" }}>
          {item.excerpt}
        </p>
        <button
          type="button"
          className="transition cursor-pointer mt-2 mb-4 ml-2 px-6 py-2 rounded-full text-white text-[13px]"
          style={{ backgroundColor: "#1d2a4d" }}
        >
          <Link href={`https://bibletalk.tv/${item.slug}`} target="_blank">
            Start Study
          </Link>
        </button>
      </div>
    </div>
  );
}
