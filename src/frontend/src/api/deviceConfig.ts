import type { DeviceConfig, DeviceConfigInput } from "../backend.d";
import type {
  DeviceConfigFormData,
  ValidationError,
  ValidationErrorResponse,
} from "../types/deviceConfig";

// ──────────────────────────────────────────────
// Conversion helpers
// ──────────────────────────────────────────────

export function formDataToInput(form: DeviceConfigFormData): DeviceConfigInput {
  return {
    device_id: BigInt(form.device_id),
    configured_by: form.configured_by,
    config_timestamp: BigInt(form.config_timestamp),
    client_id: BigInt(form.client_id),
    status: form.status,
    frequency: BigInt(form.frequency),
    sf: BigInt(form.sf),
    txp: BigInt(form.txp),
    endpoint_URL: form.endpoint_URL,
    CAN_id: BigInt(form.CAN_id),
    mode: BigInt(form.mode),
    debug_enable: form.debug_enable,
    SD_enable: form.SD_enable,
    RFID_enable: form.RFID_enable,
    thresholds: form.thresholds.map(
      (t) => [t.key, t.value] as [string, string],
    ),
  };
}

export function deviceConfigToFormData(
  config: DeviceConfig,
): DeviceConfigFormData {
  return {
    device_id: Number(config.device_id),
    configured_by: config.configured_by,
    config_timestamp: Number(config.config_timestamp),
    client_id: Number(config.client_id),
    status: config.status,
    frequency: Number(config.frequency),
    sf: Number(config.sf),
    txp: Number(config.txp),
    endpoint_URL: config.endpoint_URL,
    CAN_id: Number(config.CAN_id),
    mode: Number(config.mode),
    debug_enable: config.debug_enable,
    SD_enable: config.SD_enable,
    RFID_enable: config.RFID_enable,
    thresholds: config.thresholds.map(([key, value]) => ({ key, value })),
  };
}

// ──────────────────────────────────────────────
// Client-side validation
// ──────────────────────────────────────────────

export function validateFormData(
  form: DeviceConfigFormData,
): ValidationErrorResponse | null {
  const errors: ValidationError[] = [];

  const numericFields: Array<keyof DeviceConfigFormData> = [
    "device_id",
    "config_timestamp",
    "client_id",
    "frequency",
    "sf",
    "txp",
    "CAN_id",
    "mode",
  ];

  for (const field of numericFields) {
    const val = form[field] as number;
    if (val === undefined || val === null || Number.isNaN(val)) {
      errors.push({
        loc: ["body", field],
        msg: `${field} is required and must be a number`,
        type: "missing",
      });
    }
  }

  if (typeof form.device_id === "number" && form.device_id < 0) {
    errors.push({
      loc: ["body", "device_id"],
      msg: "device_id must be >= 0",
      type: "value_error",
    });
  }

  if (typeof form.client_id === "number" && form.client_id < 0) {
    errors.push({
      loc: ["body", "client_id"],
      msg: "client_id must be >= 0",
      type: "value_error",
    });
  }

  if (!form.configured_by || form.configured_by.trim() === "") {
    errors.push({
      loc: ["body", "configured_by"],
      msg: "configured_by is required and must be a non-empty string",
      type: "missing",
    });
  }

  if (!form.endpoint_URL || form.endpoint_URL.trim() === "") {
    errors.push({
      loc: ["body", "endpoint_URL"],
      msg: "endpoint_URL is required and must be a non-empty string",
      type: "missing",
    });
  }

  if (errors.length > 0) {
    return { detail: errors };
  }
  return null;
}

// ──────────────────────────────────────────────
// Actor-based API calls
// ──────────────────────────────────────────────

export type ActorLike = {
  setDeviceConfig(input: DeviceConfigInput): Promise<DeviceConfig>;
  getLatestDeviceConfig(deviceId: bigint): Promise<DeviceConfig | null>;
};

export async function setDeviceConfig(
  actor: ActorLike,
  form: DeviceConfigFormData,
): Promise<DeviceConfig> {
  const input = formDataToInput(form);
  return actor.setDeviceConfig(input);
}

export async function getLatestDeviceConfig(
  actor: ActorLike,
  deviceId: number,
): Promise<DeviceConfig | null> {
  return actor.getLatestDeviceConfig(BigInt(deviceId));
}
