import { useQuery } from "@tanstack/react-query";
import { ALGORITHMS } from "@/lib/algorithmRegistry";

/**
 * The algorithm catalogue is static, but is fetched through React Query to
 * mirror the intended architecture: server/library metadata flows through
 * React Query, while execution state (current step, play/pause, speed)
 * lives in local React state via useAlgorithmPlayer.
 */
export function useAlgorithmLibrary() {
  return useQuery({
    queryKey: ["algorithm-library"],
    queryFn: async () => ALGORITHMS,
  });
}
