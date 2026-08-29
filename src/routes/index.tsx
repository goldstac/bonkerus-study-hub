import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { DumpCard, type Dump } from "@/components/dump-card";
import { DumpComposer } from "@/components/dump-composer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subjectColor } from "@/lib/study";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSaves } from "@/hooks/use-saves";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BrainDump — the study board where notes get shared" },
      {
        name: "description",
        content:
          "Dump what you learn, drop resource links, and browse study notes from other learners across math, science, history, languages and code.",
      },
      { property: "og:title", content: "BrainDump — the study board where notes get shared" },
      {
        property: "og:description",
        content:
          "A messy, joyful board of study notes and resources. Post what you learned, save what helps.",
      },
    ],
  }),
  component: Index,
});

const TICKER = [
  "learn out loud",
  "steal these notes",
  "one dump a day",
  "resources > vibes",
  "share the click moment",
  "your future self says thanks",
];

function Index() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { savedIds, toggleSave } = useSaves();
  const [composerOpen, setComposerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState<string | null>(null);

  const dumpsQuery = useQuery({
    queryKey: ["dumps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dumps")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Dump[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dumps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dump removed");
      queryClient.invalidateQueries({ queryKey: ["dumps"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const dumps = dumpsQuery.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return dumps.filter((dump) => {
      if (subject && dump.subject !== subject) return false;
      if (!term) return true;
      return (
        dump.title.toLowerCase().includes(term) ||
        dump.body.toLowerCase().includes(term) ||
        dump.tags.some((tag) => tag.includes(term)) ||
        dump.author_name.toLowerCase().includes(term)
      );
    });
  }, [dumps, search, subject]);

  const subjectCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const dump of dumps) map.set(dump.subject, (map.get(dump.subject) ?? 0) + 1);
    return map;
  }, [dumps]);

  return (
    <div className="min-h-screen">
      <SiteHeader onDump={() => setComposerOpen(true)} />

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-8 text-center">
          <span className="paper-sm inline-flex items-center gap-1.5 rounded-full bg-marigold px-3 py-1 text-xs font-black tracking-wide text-marigold-foreground uppercase">
            <Sparkles className="size-3.5" /> {dumps.length} brains dumped
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-5xl leading-[0.95] font-black tracking-tight sm:text-7xl">
            Dump what you learned.
            <span className="mt-2 block text-primary">Somebody needs it today.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            Notes, tricks, links, that one explanation that finally made it click — pinned to a
            board that never gets tidied.
          </p>

          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <div className="paper-sm flex flex-1 items-center gap-2 rounded-full bg-card px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes, tags, people..."
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                aria-label="Search dumps"
              />
              {search ? (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <Button
              onClick={() => setComposerOpen(true)}
              className="paper-sm h-11 rounded-full px-6 font-bold"
            >
              Dump it
            </Button>
          </div>
        </section>

        <div className="overflow-hidden border-y-2 border-ink bg-primary py-2.5 text-primary-foreground">
          <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
            {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((item, index) => (
              <span key={index} className="font-mono text-sm font-bold tracking-wide uppercase">
                ✦ {item}
              </span>
            ))}
          </div>
        </div>

        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setSubject(null)}
              className={cn(
                "rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold transition-transform hover:-translate-y-0.5",
                subject === null ? "bg-ink text-background" : "bg-card",
              )}
            >
              Everything ({dumps.length})
            </button>
            {[...subjectCounts.keys()].sort().map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSubject(subject === option ? null : option)}
                className={cn(
                  "rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold transition-transform hover:-translate-y-0.5",
                  subject === option ? subjectColor(option) : "bg-card",
                )}
              >
                {option} ({subjectCounts.get(option)})
              </button>
            ))}
          </div>

          <div className="mt-8">
            {dumpsQuery.isLoading ? (
              <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="paper mb-5 h-44 animate-pulse break-inside-avoid rounded-2xl bg-muted"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="paper mx-auto max-w-md rounded-2xl bg-card p-10 text-center">
                <h2 className="font-display text-2xl font-black">Nothing here yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Be the first to dump something on this pile.
                </p>
                <Button
                  className="paper-sm mt-5 rounded-full font-bold"
                  onClick={() => setComposerOpen(true)}
                >
                  Dump it
                </Button>
              </div>
            ) : (
              <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                {filtered.map((dump) => (
                  <div key={dump.id} className="mb-5 break-inside-avoid">
                    <DumpCard
                      dump={dump}
                      saved={savedIds.includes(dump.id)}
                      onToggleSave={() => toggleSave(dump.id)}
                      canDelete={!!user && dump.user_id === user.id}
                      onDelete={() => remove.mutate(dump.id)}
                      onTag={(tag) => setSearch(tag)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="paper rounded-3xl bg-accent p-10 text-center text-accent-foreground">
            <h2 className="font-display text-3xl font-black sm:text-4xl">
              Learning sticks when you say it out loud.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm">
              Write the note, drop the link, tag it. Your pile becomes somebody else's shortcut.
            </p>
            <Button
              className="paper-sm mt-6 rounded-full px-6 font-bold"
              onClick={() => setComposerOpen(true)}
            >
              Add your first dump
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-ink bg-parchment py-8 text-center text-sm font-medium">
        BrainDump — a messy board for curious people.
      </footer>

      <DumpComposer open={composerOpen} onOpenChange={setComposerOpen} />
    </div>
  );
}
