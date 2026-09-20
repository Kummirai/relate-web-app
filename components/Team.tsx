"use client"

import {FaFacebook, FaTwitter, FaInstagramSquare} from "react-icons/fa";
import {LuShield, LuUsers} from "react-icons/lu";
import {useState} from "react";

type TeamMember = {
    name: string
    role: string
    src: string
}

type TeamGroup = {
    title: string
    subtitle: string
    members: TeamMember[]
    featured?: TeamMember
}

const photo = (id: string) => `https://images.unsplash.com/${id}?w=200&h=200&fit=crop&crop=face`

const groups: TeamGroup[] = [
    {
        title: "Executive Director",
        subtitle: "Leading the Relate family day to day",
        featured: {name: "Milton Kumirai", role: "Executive Director & Chairman", src: photo("photo-1506794778202-cad84cf45f1d")},
        members: []
    },
    {
        title: "Secretary & Treasurer",
        subtitle: "Governance, records and fiduciary integrity",
        members: [
            {name: "Talayiwa Ngwenya", role: "Secretary", src: photo("photo-1494790108377-be9c29b29330")},
            {name: "Anacleta Ncube", role: "Treasurer", src: photo("photo-1573497019940-1c28c88b4f3e")},
        ]
    },
    {
        title: "Directors",
        subtitle: "Leading each club and its weekly programs",
        members: [
            {name: "Moses Fusi", role: "Nexus Director · Families", src: photo("photo-1500648767791-00dcc994a43e")},
            {name: "Constance Lowani", role: "Nexus Director · Families", src: photo("photo-1531123897727-8f129e1688ce")},
            {name: "Sprout Director", role: "Children 6–15 · weekly clubs", src: photo("photo-1544716278-ca5e3f4abd8c")},
            {name: "Surge Director", role: "Young youth 16–21 · meetups", src: photo("photo-1521737604893-d14cc237f11d")},
            {name: "Pulse Director", role: "Youth 21–33 · networking", src: photo("photo-1576091160550-2173dba999ef")},
            {name: "Prime Director", role: "Singles 33+ · peer circles", src: photo("photo-1560250097-0b93528c311a")},
            {name: "Anchor Director", role: "Single parents · support groups", src: photo("photo-1508214751196-bcfd4ca60f91")},
            {name: "Base Director", role: "Couples · socials & retreats", src: photo("photo-1516589178581-6cd7833ae3b2")},
        ]
    },
]

function MemberCard({member, featured = false}: {member: TeamMember; featured?: boolean}) {
    return (
        <div className={`text-center group bg-white rounded-xl border p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full
            ${featured ? "border-cyan shadow-md" : "border-gray-200"}`}>
            <div
                className={"size-36 sm:size-40 mx-auto rounded-full overflow-hidden mb-5 ring-4 ring-white shadow-lg group-hover:scale-105 transition-transform duration-300"}>
                <img src={member.src} alt={member.name}
                     className={"size-full object-cover"}/>
            </div>
            <h4 className={"text-xl font-semibold text-gray-800"}>{member.name}</h4>
            <p className={"text-cyan text-sm mb-3 flex-1"}>{member.role}</p>
            <div className={"flex items-center justify-center gap-3 text-gray-400"}>
                <FaFacebook
                    className={"hover:text-cyan cursor-pointer transition-colors"}/>
                <FaTwitter
                    className={"hover:text-cyan cursor-pointer transition-colors"}/>
                <FaInstagramSquare
                    className={"hover:text-cyan cursor-pointer transition-colors"}/>
            </div>
        </div>
    )
}

export default function Team() {
    const [showAll, setShowAll] = useState(false)

    return (
        <section className={"py-16 md:py-24 bg-white px-4"}>
            <div className={"max-w-5xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-cyan font-medium mb-3"}>OUR TEAM</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        Meet the Relate <br className={"hidden sm:block"}/>
                        Family
                    </h2>
                </div>
                {groups.map(group => {
                    const icon = group.title === "Executive Director" ? <LuShield className={"text-cyan text-3xl"}/>
                        : <LuUsers className={"text-cyan text-3xl"}/>
                    const hasShowMore = group.members.length > 6
                    const visible = hasShowMore && !showAll ? group.members.slice(0, 6) : group.members
                    return (
                    <div key={group.title} className={"py-12 md:py-16 px-6 md:px-12 rounded-2xl mb-10 last:mb-0"}>
                        <div className={"text-center mb-10"}>
                            <h3 className={"text-2xl md:text-3xl font-bold text-gray-800 flex items-center justify-center gap-3"}>
                                {icon} {group.title}
                            </h3>
                            <p className={"text-gray-500 mt-2"}>{group.subtitle}</p>
                        </div>

                        {/* Featured member on its own row — original w-72 width, centered */}
                        {group.featured && (
                            <div className={"flex justify-center mb-8"}>
                                <div className={"w-72 max-w-full flex"}>
                                    <MemberCard member={group.featured} featured/>
                                </div>
                            </div>
                        )}

                        {/* All cards at the Executive Director's width (w-72 / 288px) — horizontal-only 16px gap so 3 fit per row on desktop */}
                        <div className={"flex flex-wrap justify-center gap-x-4 gap-y-8 items-stretch"}>
                            {visible.map((member, i) => (
                                <div key={i} className={"w-72 max-w-full flex"}>
                                    <MemberCard member={member}/>
                                </div>
                            ))}
                        </div>

                        {hasShowMore && (
                            <div className={"text-center mt-8"}>
                                <button onClick={() => setShowAll(!showAll)}
                                        className={"px-6 py-2.5 rounded-lg bg-navy text-white font-medium text-sm hover:bg-navy-dark transition-colors"}>
                                    {showAll ? "Show Less" : `Show More (${group.members.length - 6} more)`}
                                </button>
                            </div>
                        )}
                    </div>
                    )
                })}
            </div>
        </section>
    )
}
