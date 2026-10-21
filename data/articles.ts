export type Category =
  | "All"
  | "Fiction"
  | "Poetry"
  | "Memoir"
  | "Articles"
  | "Essays"
  | "Blogs"
  | "Features"
  | "Biographies"
  | "Reviews";

export interface Article {
  id: string;
  title: string;
  author: string;
  /** Only present for real student submissions — absent for static seed articles, which predate this field and can't be linked to an author page. */
  studentCode?: string;
  grade: string;
  category: Exclude<Category, "All">;
  excerpt: string;
  content: string;
  votes: number;
  month: string;
  /** ISO 8601 date string (YYYY-MM-DD) — used for sorting and display */
  date: string;
  isEditorChoice?: boolean;
}

export interface PastAwardee {
  month: string;
  year: number;
  name: string;
  studentCode?: string;
  grade: string;
  title: string;
  category: Exclude<Category, "All">;
  votes: number;
}

export interface StaffMember {
  id?: string;
  name: string;
  role: string;
  period: string;
  type: "teacher" | "student" | "class_rep" | "media";
  isTeacher?: boolean;
  grade?: string;
}

export const defaultThemeOptions: string[] = [
  "Dreams",
  "Change",
  "Identity",
  "Courage",
  "Open Theme",
];

export const currentTheme = {
  name: "",
  month: "",
  description: "",
};

export const articles: Article[] = [];

export const writerOfMonth = {
  name: "",
  grade: "",
  totalVotes: 0,
  pieces: 0,
  bio: "",
  featuredArticleId: "",
};

export const leaderboard: { rank: number; name: string; grade: string; totalVotes: number; pieces: number }[] = [];

export const categories: Category[] = [
  "All",
  "Fiction",
  "Poetry",
  "Memoir",
  "Articles",
  "Essays",
  "Blogs",
  "Features",
  "Biographies",
  "Reviews",
];

export const pastAwardees: PastAwardee[] = [];

export const pastStaff: StaffMember[] = [];

export const archiveArticles: Article[] = [];
