"use client";

import { useEffect, useState, type ReactNode } from "react";
import MobileShell from "./mobile/MobileShell";

export default function MobileLayoutWrapper({
  children,
  session,
}: {
  children: ReactNode;
  session?: any;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return <MobileShell session={session}>{children}</MobileShell>;
  }

  return <>{children}</>;
}
