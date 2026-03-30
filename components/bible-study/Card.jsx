import Link from "next/link";

export default function Card({ item }) {
  return (
    <div className=" bg-white border border-gray-200 hover:-translate-y-1 transition duration-300 rounded-lg shadow shadow-black/10 max-w-100 h-fit">
      <img
        className=" max-h-60 w-full object-cover"
        src={item.image}
        alt="officeImage"
      />
      <div className="px-2">
        {/* <p className="text-zinc-900 text-lg h-12 font-medium ml-2 mt-4 line-clamp-2 wrap-anywhere">
          {item.subtitle || item.title}
        </p> */}
        <p className="text-zinc-500 text-sm/6 mt-2 ml-2 mb-2 line-clamp-4">
          {item.excerpt}
        </p>
        <button
          type="button"
          className="bg-zinc-950 hover:bg-zinc-900 transition cursor-pointer mt-2 mb-3 ml-2 px-6 py-2 rounded-full text-white text-[13px]"
        >
          <Link href={`https://bibletalk.tv/${item.slug}`}>Learn More</Link>
        </button>
      </div>
    </div>
  );
}
