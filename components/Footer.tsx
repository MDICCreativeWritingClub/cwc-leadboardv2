"use client";

import { colors } from "@/lib/theme";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";

const exploreLinks = [
  { label: "Literary Hub", to: "/hub" },
  { label: "Leaderboard", to: "/leaderboard" },
  { label: "Archive", to: "/archive" },
  { label: "Our Team", to: "/team" },
];

const participateLinks = [
  { label: "Submit Work", to: "/submit" },
  { label: "Info", to: "/info" },
];

export function Footer() {
  return (
    <footer style={{ backgroundColor: colors.black }} className="mt-14">
      {/* Top band: link columns + a line about the club instead of social icons */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-10 flex flex-wrap gap-x-56 gap-y-8">
        <div className="max-w-xs">
          <p
            style={{ color: colors.green400, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}
            className="mb-4"
          >
            About the Club
          </p>
          <p style={{ color: colors.white, fontSize: "0.85rem", lineHeight: "1.7" }}>
            The Creative Writing Club of Manarat International School &amp; College — a home for student
            poetry, prose and criticism.
          </p>
          <div className="flex items-start gap-2 mt-3">
            <MapPin size={16} style={{ color: colors.green400, flexShrink: 0, marginTop: "2px" }} />
            <p style={{ color: colors.white, fontSize: "0.85rem", lineHeight: "1.5" }}>
              Manarat Dhaka International School &amp; College, Gulshan, Dhaka-1212
            </p>
          </div>
        </div>

        <div>
          <p
            style={{ color: colors.green400, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}
            className="mb-4" 
          >
            Explore
          </p>
          <div className="flex flex-col gap-3">
            {exploreLinks.map((link) => (
              <Link
                key={link.to}
                href={link.to}
                style={{ color: colors.white, fontSize: "0.85rem" }}
                className="hover:opacity-80 transition-opacity w-fit"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p
            style={{ color: colors.green400, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}
            className="mb-4"
          >
            Participate
          </p>
          <div className="flex flex-col gap-3">
            {participateLinks.map((link) => (
              <Link
                key={link.to}
                href={link.to}
                style={{ color: colors.white, fontSize: "0.85rem" }}
                className="hover:opacity-80 transition-opacity w-fit"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom band: logo/wordmark + copyright, mirroring the reference layout */}
      <div style={{ borderTop: `1px solid ${colors.gray700}` }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image src="/mdic-logo.png" alt="MDIC Logo" width={26} height={26} />
            <span
              style={{ fontFamily: "var(--font-display)", color: colors.white, fontWeight: 600, fontSize: "0.95rem" }}
            >
              Manarat Dhaka International School and College
            </span>
          </div>
          <p style={{ color: colors.white, fontSize: "0.75rem" }}>
            ©{new Date().getFullYear()} Manarat Creative Writing Club | All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
