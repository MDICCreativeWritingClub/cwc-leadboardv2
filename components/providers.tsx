"use client";

import { AuthProvider } from "@/context/AuthContext";
import { VoteProvider } from "@/context/VoteContext";
import { SubmissionsProvider } from "@/context/SubmissionsContext";
import { CommentsProvider } from "@/context/CommentsContext";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import { ThemeModeProvider } from "@/context/ThemeModeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <VoteProvider>
          <SubmissionsProvider>
            <CommentsProvider>
              <SiteConfigProvider>{children}</SiteConfigProvider>
            </CommentsProvider>
          </SubmissionsProvider>
        </VoteProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
