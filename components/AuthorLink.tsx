"use client";

import Link from "next/link";

interface AuthorLinkProps {
  name: string;
  studentCode?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function AuthorLink({ name, studentCode, className, style }: AuthorLinkProps) {
  if (!studentCode) {
    return (
      <span className={className} style={style}>
        {name}
      </span>
    );
  }

  return (
    <Link
      href={`/author/${studentCode}`}
      onClick={(e) => e.stopPropagation()}
      className={className}
      style={{ color: "inherit", textDecoration: "none", ...style }}
    >
      <span className="hover:underline">{name}</span>
    </Link>
  );
}
