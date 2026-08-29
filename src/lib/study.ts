export const SUBJECTS = [
  "General",
  "Math",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Languages",
  "Computer Science",
  "Design",
  "Business",
] as const;

export type Subject = (typeof SUBJECTS)[number];

const PALETTE = [
  "bg-marigold text-marigold-foreground",
  "bg-ivy text-ivy-foreground",
  "bg-plum text-plum-foreground",
  "bg-primary text-primary-foreground",
  "bg-accent text-accent-foreground",
];

export function subjectColor(subject: string) {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = (hash * 31 + subject.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function tiltFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) >>> 0;
  const options = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2", "rotate-0"];
  return options[hash % options.length];
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function parseTags(input: string) {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}
