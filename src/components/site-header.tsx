import { Link } from "@tanstack/react-router";
import { BookMarked, LogOut, NotebookPen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader({ onDump }: { onDump?: () => void }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-parchment/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="group flex items-center gap-2">
          <span className="paper-sm grid size-9 place-items-center rounded-xl bg-marigold text-marigold-foreground transition-transform group-hover:-rotate-6">
            <NotebookPen className="size-5" />
          </span>
          <span className="font-display text-xl font-black tracking-tight">
            Brain<span className="text-primary">Dump</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-2">
          <Link
            to="/saved"
            className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold hover:bg-accent sm:flex"
          >
            <BookMarked className="size-4" /> Shelf
          </Link>
          {onDump ? (
            <Button onClick={onDump} className="paper-sm rounded-full font-bold">
              <Sparkles className="size-4" /> Dump it
            </Button>
          ) : null}
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="size-4" />
            </Button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold hover:bg-accent"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
