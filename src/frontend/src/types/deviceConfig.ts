// The REST API contract shape (used for form state and display)
export interface DeviceConfigFormData {
  device_id: number;
  configured_by: string;
  config_timestamp: number;
  client_id: number;
  status: boolean;
  frequency: number;
  sf: number;
  txp: number;
  endpoint_URL: string;
  CAN_id: number;
  mode: number;
  debug_enable: boolean;
  SD_enable: boolean;
  RFID_enable: boolean;
  thresholds: Array<{ key: string; value: string }>;
}

// 422 validation error shape from contract
export interface ValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

export interface ValidationErrorResponse {
  detail: ValidationError[];
}

export type DeviceConfigStatus =
  | "idle"
  | "fetchLoading"
  | "saveLoading"
  | "fetchSuccess"
  | "saveSuccess"
  | "fetchNotFound"
  | "validationError"
  | "saveError";
