import { Bookmark, BookmarkCheck, ExternalLink, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectColor, tiltFor, timeAgo } from "@/lib/study";
import { Button } from "@/components/ui/button";

export type Dump = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  subject: string;
  tags: string[];
  author_name: string;
  user_id: string | null;
  created_at: string;
};

export function DumpCard({
  dump,
  saved,
  onToggleSave,
  onDelete,
  canDelete,
  onTag,
}: {
  dump: Dump;
  saved?: boolean;
  onToggleSave?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  onTag?: (tag: string) => void;
}) {
  return (
    <article
      className={cn(
        "paper group flex break-inside-avoid flex-col gap-3 rounded-2xl bg-card p-5 transition-all duration-200",
        "hover:-translate-y-1 hover:rotate-0 hover:shadow-[7px_7px_0_0_var(--ink)]",
        tiltFor(dump.id),
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "paper-sm rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide",
            subjectColor(dump.subject),
          )}
        >
          {dump.subject}
        </span>
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {timeAgo(dump.created_at)}
        </span>
      </div>

      <h3 className="font-display text-xl leading-tight font-bold">{dump.title}</h3>

      {dump.body ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {dump.body}
        </p>
      ) : null}

      {dump.link ? (
        <a
          href={dump.link}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold underline-offset-2 hover:underline"
        >
          <ExternalLink className="size-3.5" />
          {new URL(dump.link).hostname.replace("www.", "")}
        </a>
      ) : null}

      {dump.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {dump.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTag?.(tag)}
              className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-medium hover:bg-accent"
            >
              #{tag}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-2 border-t-2 border-dashed border-border pt-3">
        <span className="text-xs font-bold">{dump.author_name}</span>
        <div className="ml-auto flex items-center gap-1">
          {canDelete && onDelete ? (
            <Button variant="ghost" size="icon" aria-label="Delete dump" onClick={onDelete}>
              <Trash2 className="size-4" />
            </Button>
          ) : null}
          {onToggleSave ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={saved ? "Remove from shelf" : "Save to shelf"}
              onClick={onToggleSave}
            >
              {saved ? (
                <BookmarkCheck className="size-4 text-primary" />
              ) : (
                <Bookmark className="size-4" />
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
