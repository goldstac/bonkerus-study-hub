import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { DumpCard, type Dump } from "@/components/dump-card";
import { useSaves } from "@/hooks/use-saves";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Your shelf — BrainDump" },
      {
        name: "description",
        content: "Every study note and resource you saved on BrainDump, kept in one place.",
      },
      { property: "og:title", content: "Your shelf — BrainDump" },
      {
        property: "og:description",
        content: "The study notes and resources you bookmarked on BrainDump.",
      },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { savedIds, toggleSave } = useSaves();

  const savedQuery = useQuery({
    queryKey: ["saved-dumps", savedIds.join(",")],
    enabled: savedIds.length >= 0,
    queryFn: async () => {
      if (savedIds.length === 0) return [] as Dump[];
      const { data, error } = await supabase
        .from("dumps")
        .select("*")
        .in("id", savedIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Dump[];
    },
  });

  const dumps = savedQuery.data ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-4xl font-black sm:text-5xl">Your shelf</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dumps.length} saved {dumps.length === 1 ? "dump" : "dumps"}.
        </p>

        {dumps.length === 0 ? (
          <div className="paper mt-10 rounded-2xl bg-card p-10 text-center">
            <h2 className="font-display text-2xl font-black">Shelf's empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tap the bookmark on any dump to keep it here.
            </p>
            <Link
              to="/"
              className="paper-sm mt-5 inline-block rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground"
            >
              Browse the board
            </Link>
          </div>
        ) : (
          <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
            {dumps.map((dump) => (
              <div key={dump.id} className="mb-5 break-inside-avoid">
                <DumpCard
                  dump={dump}
                  saved
                  onToggleSave={() => toggleSave(dump.id)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
