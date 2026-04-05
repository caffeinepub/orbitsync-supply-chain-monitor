import { useMutation } from "@tanstack/react-query";
import type { DeviceConfig, DeviceConfigInput } from "../backend.d";
import { useActor } from "./useActor";

export function useSetDeviceConfig() {
  const { actor } = useActor();
  return useMutation<DeviceConfig, Error, DeviceConfigInput>({
    mutationFn: async (input: DeviceConfigInput) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setDeviceConfig(input);
    },
  });
}

export function useGetLatestDeviceConfig() {
  const { actor } = useActor();
  return useMutation<DeviceConfig | null, Error, bigint>({
    mutationFn: async (deviceId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getLatestDeviceConfig(deviceId);
    },
  });
}
