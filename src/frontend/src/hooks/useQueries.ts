import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Alert,
  Asset,
  CustodyEvent,
  ETA,
  Telemetry,
  TelemetryHistory,
} from "../backend.d";
import { useActor } from "./useActor";

export function useSeedAndListAssets() {
  const { actor, isFetching } = useActor();
  return useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      if (!actor) return [];
      await actor.seedSampleData();
      return actor.listAssets();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useListAssets() {
  const { actor, isFetching } = useActor();
  return useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAssets();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUnresolvedAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery<Alert[]>({
    queryKey: ["alerts", "unresolved"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUnresolvedAlerts();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useLatestTelemetry(assetId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Telemetry | null>({
    queryKey: ["telemetry", "latest", assetId],
    queryFn: async () => {
      if (!actor || !assetId) return null;
      return actor.getLatestTelemetry(assetId);
    },
    enabled: !!actor && !isFetching && !!assetId,
    refetchInterval: 15_000,
  });
}

export function useTelemetryHistory(assetId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<TelemetryHistory>({
    queryKey: ["telemetry", "history", assetId],
    queryFn: async () => {
      if (!actor || !assetId) return { assetId: assetId ?? "", readings: [] };
      return actor.getTelemetryHistory(assetId, 10n);
    },
    enabled: !!actor && !isFetching && !!assetId,
    refetchInterval: 15_000,
  });
}

export function useCustodyChain(assetId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<CustodyEvent[]>({
    queryKey: ["custody", assetId],
    queryFn: async () => {
      if (!actor || !assetId) return [];
      return actor.getCustodyChain(assetId);
    },
    enabled: !!actor && !isFetching && !!assetId,
  });
}

export function useETA(assetId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ETA | null>({
    queryKey: ["eta", assetId],
    queryFn: async () => {
      if (!actor || !assetId) return null;
      return actor.getETA(assetId);
    },
    enabled: !!actor && !isFetching && !!assetId,
  });
}

export function useResolveAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.resolveAlert(alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
