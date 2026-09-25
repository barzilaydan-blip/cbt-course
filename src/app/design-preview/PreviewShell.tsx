import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { adminProfile, studentProfile } from "./mock";

/** Mirrors the authenticated layouts (Navbar + main) for local visual checks. */
export default function PreviewShell({
  children,
  admin = false,
  width = "max-w-7xl",
}: {
  children: React.ReactNode;
  admin?: boolean;
  width?: string;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={admin ? adminProfile : studentProfile} />
      <main className={`${width} mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8`}>{children}</main>
    </div>
  );
}
