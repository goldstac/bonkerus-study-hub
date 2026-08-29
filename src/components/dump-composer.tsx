import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SUBJECTS, parseTags } from "@/lib/study";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function DumpComposer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [subject, setSubject] = useState<string>("General");
  const [tags, setTags] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You need an account to dump.");
      const { error } = await supabase.from("dumps").insert({
        user_id: user.id,
        title: title.trim(),
        body: body.trim(),
        link: link.trim() ? link.trim() : null,
        subject,
        tags: parseTags(tags),
        author_name:
          (user.user_metadata?.["display_name"] as string | undefined) ??
          user.email?.split("@")[0] ??
          "Anonymous scholar",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dumped! Your brain is lighter.");
      setTitle("");
      setBody("");
      setLink("");
      setTags("");
      queryClient.invalidateQueries({ queryKey: ["dumps"] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="paper max-h-[90vh] overflow-y-auto rounded-2xl bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black">
            Dump what you learned
          </DialogTitle>
          <DialogDescription>
            A fact, a trick, a link — anything that helped it click.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Sign in first so your dumps carry your name.
            </p>
            <Button
              className="paper-sm w-full rounded-full font-bold"
              onClick={() => {
                onOpenChange(false);
                navigate({ to: "/auth" });
              }}
            >
              Sign in to dump
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!title.trim()) {
                toast.error("Give it a title.");
                return;
              }

              mutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Integration by parts, finally explained"
                maxLength={140}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="body">Notes</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the version of it you'd want to read in six months..."
                rows={5}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="link">Resource link (optional)</Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Subject</Label>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSubject(option)}
                    className={cn(
                      "rounded-full border-2 border-ink px-2.5 py-1 text-xs font-bold transition-transform hover:-translate-y-0.5",
                      subject === option
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="calculus, exam-prep"
              />
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="paper-sm w-full rounded-full font-bold"
            >
              {mutation.isPending ? "Dumping..." : "Dump it"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
