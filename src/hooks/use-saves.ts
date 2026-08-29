import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useSaves() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const savesQuery = useQuery({
    queryKey: ["saves", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("saves").select("dump_id");
      if (error) throw error;
      return data.map((row) => row.dump_id);
    },
  });

  const toggle = useMutation({
    mutationFn: async (dumpId: string) => {
      if (!user) throw new Error("Sign in to build your shelf.");
      const isSaved = (savesQuery.data ?? []).includes(dumpId);
      if (isSaved) {
        const { error } = await supabase.from("saves").delete().eq("dump_id", dumpId);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from("saves").insert({ user_id: user.id, dump_id: dumpId });
      if (error) throw error;
      return true;
    },
    onSuccess: (added) => {
      toast.success(added ? "Saved to your shelf" : "Removed from shelf");
      queryClient.invalidateQueries({ queryKey: ["saves"] });
      queryClient.invalidateQueries({ queryKey: ["saved-dumps"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    savedIds: savesQuery.data ?? [],
    toggleSave: (dumpId: string) => toggle.mutate(dumpId),
  };
}
