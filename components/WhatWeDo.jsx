export default function WhatWeDo() {
  return (
    <>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
            
                * {
                    font-family: 'Poppins', sans-serif;
                }
            `}</style>
      <section className=" h-screen flex flex-col md:flex-row items-center justify-center gap-10 max-md:px-4">
        <div className="relative shadow-2xl shadow-zinc-600/40 rounded-2xl overflow-hidden shrink-0">
          <img
            className="max-w-md w-full object-cover rounded-2xl"
            src="https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?q=80&w=451&h=451&auto=format&fit=crop"
            alt=""
          />
          <div className="flex items-center gap-1 max-w-72 absolute bottom-8 left-8 bg-white p-4 rounded-xl">
            <div className="flex -space-x-4 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200"
                alt="image"
                className="size-9 rounded-full border-[3px] border-white hover:-translate-y-1 transition z-1"
              />
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"
                alt="image"
                className="size-9 rounded-full border-[3px] border-white hover:-translate-y-1 transition z-[2]"
              />
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop"
                alt="image"
                className="size-9 rounded-full border-[3px] border-white hover:-translate-y-1 transition z-[3]"
              />
              <div className="flex items-center justify-center text-xs  text-white size-9 rounded-full border-[3px] border-white bg-zinc-600 hover:-translate-y-1 transition z-4">
                50+
              </div>
            </div>
            <p className="text-sm font-medium text-slate-800">
              Join our developer community
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-600 max-w-lg">
          <h1 className="text-2xl uppercase font-semibold text-slate-700">
            What we do?
          </h1>
          <div className="w-24 h-0.75 rounded-full bg-linear-to-r from-zinc-600 to-[#DDD9FF]"></div>
          <p className="mt-8">
            PrebuiltUI helps you build faster by transforming your design vision
            into fully functional, production-ready UI components.{" "}
          </p>
          <p className="mt-4">
            Whether you're launching a SaaS app, landing page, or dashboard, our
            collection of Tailwind CSS components is crafted to boost your
            development speed and improve user experience.
          </p>
          <p className="mt-4">
            From UI design systems to automation-ready layouts, PrebuiltUI
            empowers you to build beautifully and scale effortlessly.
          </p>
          <a
            href="#"
            className="flex items-center justify-center gap-2.5 bg-linear-to-r from-zinc-950 to-zinc-500 text-zinc-50 text-sm font-medium px-5 py-2.5 rounded-full cursor-pointer border-0 mt-3 w-fit"
          >
            <span>Read more</span>
            <svg
              width="13"
              height="12"
              viewBox="0 0 13 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.53 6.53a.75.75 0 0 0 0-1.06L7.757.697a.75.75 0 1 0-1.06 1.06L10.939 6l-4.242 4.243a.75.75 0 0 0 1.06 1.06zM0 6v.75h12v-1.5H0z"
                fill="#fff"
              />
            </svg>
          </a>
        </div>
      </section>
    </>
  );
}
