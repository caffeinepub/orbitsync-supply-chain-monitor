import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  deviceConfigToFormData,
  getLatestDeviceConfig,
  setDeviceConfig,
  validateFormData,
} from "../../api/deviceConfig";
import type { ActorLike } from "../../api/deviceConfig";
import type {
  DeviceConfigFormData,
  DeviceConfigStatus,
  ValidationError,
} from "../../types/deviceConfig";

// ─── Threshold row with stable ID ─────────────
interface ThresholdRow {
  id: string;
  key: string;
  value: string;
}

let _thresholdSeq = 0;
function newThresholdId() {
  _thresholdSeq += 1;
  return `th-${_thresholdSeq}`;
}

// ─── Default form values ───────────────────────
const DEFAULT_FORM: DeviceConfigFormData = {
  device_id: 0,
  configured_by: "",
  config_timestamp: Math.floor(Date.now() / 1000),
  client_id: 0,
  status: true,
  frequency: 868100000,
  sf: 7,
  txp: 14,
  endpoint_URL: "",
  CAN_id: 0,
  mode: 0,
  debug_enable: false,
  SD_enable: false,
  RFID_enable: false,
  thresholds: [],
};

interface DeviceConfigPageProps {
  actor: ActorLike | null;
}

export function DeviceConfigPage({ actor }: DeviceConfigPageProps) {
  const [form, setForm] = useState<DeviceConfigFormData>({ ...DEFAULT_FORM });
  const [thresholdRows, setThresholdRows] = useState<ThresholdRow[]>([]);
  const [status, setStatus] = useState<DeviceConfigStatus>("idle");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Sync thresholdRows → form.thresholds
  const syncThresholds = (rows: ThresholdRow[]) => {
    setThresholdRows(rows);
    setForm((prev) => ({
      ...prev,
      thresholds: rows.map((r) => ({ key: r.key, value: r.value })),
    }));
  };

  // ─── Form field helpers ───────────────────────
  const setField = <K extends keyof DeviceConfigFormData>(
    key: K,
    value: DeviceConfigFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addThreshold = () => {
    syncThresholds([
      ...thresholdRows,
      { id: newThresholdId(), key: "", value: "" },
    ]);
  };

  const updateThreshold = (
    rowId: string,
    field: "key" | "value",
    val: string,
  ) => {
    syncThresholds(
      thresholdRows.map((r) => (r.id === rowId ? { ...r, [field]: val } : r)),
    );
  };

  const removeThreshold = (rowId: string) => {
    syncThresholds(thresholdRows.filter((r) => r.id !== rowId));
  };

  // ─── Fetch Latest ─────────────────────────────
  const handleFetchLatest = async () => {
    if (!actor) {
      setStatus("saveError");
      setErrorMessage("Actor not ready. Please wait.");
      return;
    }
    setStatus("fetchLoading");
    setValidationErrors([]);
    setErrorMessage("");
    try {
      const result = await getLatestDeviceConfig(actor, form.device_id);
      if (result === null) {
        setStatus("fetchNotFound");
      } else {
        const populated = deviceConfigToFormData(result);
        setForm(populated);
        // Rebuild threshold rows with stable IDs
        const rows = populated.thresholds.map((t) => ({
          id: newThresholdId(),
          key: t.key,
          value: t.value,
        }));
        setThresholdRows(rows);
        setStatus("fetchSuccess");
      }
    } catch (err) {
      setStatus("saveError");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to fetch config",
      );
    }
  };

  // ─── Save Config ──────────────────────────────
  const handleSaveConfig = async () => {
    if (!actor) {
      setStatus("saveError");
      setErrorMessage("Actor not ready. Please wait.");
      return;
    }
    // Client-side validation
    const validationResult = validateFormData(form);
    if (validationResult) {
      setValidationErrors(validationResult.detail);
      setStatus("validationError");
      return;
    }

    setStatus("saveLoading");
    setValidationErrors([]);
    setErrorMessage("");
    try {
      await setDeviceConfig(actor, form);
      setStatus("saveSuccess");
    } catch (err) {
      setStatus("saveError");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save config",
      );
    }
  };

  // ─── Number input helper ──────────────────────
  const numInput = (
    id: string,
    label: string,
    key: keyof DeviceConfigFormData,
    description?: string,
  ) => (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[12px] font-medium"
        style={{ color: "#8FA2B8" }}
      >
        {label}
      </Label>
      {description && (
        <p className="text-[11px]" style={{ color: "#5A7A9A" }}>
          {description}
        </p>
      )}
      <Input
        id={id}
        data-ocid={`device_config.${key}.input`}
        type="number"
        value={(form[key] as number).toString()}
        onChange={(e) =>
          setField(
            key,
            (e.target.value === ""
              ? 0
              : Number(e.target.value)) as DeviceConfigFormData[typeof key],
          )
        }
        className="h-9 text-[13px] border-0 focus-visible:ring-1"
        style={{
          backgroundColor: "#0B0F14",
          color: "#E8EEF6",
          borderColor: "#1F2B3A",
          outline: "1px solid #1F2B3A",
        }}
      />
    </div>
  );

  const textInput = (
    id: string,
    label: string,
    key: keyof DeviceConfigFormData,
    placeholder?: string,
  ) => (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[12px] font-medium"
        style={{ color: "#8FA2B8" }}
      >
        {label}
      </Label>
      <Input
        id={id}
        data-ocid={`device_config.${key}.input`}
        type="text"
        value={form[key] as string}
        placeholder={placeholder}
        onChange={(e) =>
          setField(key, e.target.value as DeviceConfigFormData[typeof key])
        }
        className="h-9 text-[13px] border-0 focus-visible:ring-1"
        style={{
          backgroundColor: "#0B0F14",
          color: "#E8EEF6",
          borderColor: "#1F2B3A",
          outline: "1px solid #1F2B3A",
        }}
      />
    </div>
  );

  const boolToggle = (
    id: string,
    label: string,
    key: keyof DeviceConfigFormData,
    description?: string,
  ) => (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2.5"
      style={{ backgroundColor: "#0B0F14", border: "1px solid #1F2B3A" }}
    >
      <div>
        <Label
          htmlFor={id}
          className="text-[13px] font-medium cursor-pointer"
          style={{ color: "#E8EEF6" }}
        >
          {label}
        </Label>
        {description && (
          <p className="text-[11px] mt-0.5" style={{ color: "#5A7A9A" }}>
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        data-ocid={`device_config.${key}.switch`}
        checked={form[key] as boolean}
        onCheckedChange={(checked) =>
          setField(key, checked as DeviceConfigFormData[typeof key])
        }
      />
    </div>
  );

  const isFetchLoading = status === "fetchLoading";
  const isSaveLoading = status === "saveLoading";

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-[20px] font-semibold tracking-tight"
              style={{ color: "#E8EEF6" }}
            >
              Device Configuration
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "#8FA2B8" }}>
              Configure IoT device parameters and LoRaWAN settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status === "fetchSuccess" && (
              <Badge
                data-ocid="device_config.fetch.success_state"
                className="text-[11px] gap-1"
                style={{
                  backgroundColor: "rgba(34,211,197,0.15)",
                  color: "#22D3C5",
                  border: "1px solid rgba(34,211,197,0.3)",
                }}
              >
                <CheckCircle2 size={12} />
                Config loaded
              </Badge>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {status === "saveSuccess" && (
          <div
            data-ocid="device_config.save.success_state"
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{
              backgroundColor: "rgba(34,211,197,0.1)",
              border: "1px solid rgba(34,211,197,0.25)",
            }}
          >
            <CheckCircle2 size={16} style={{ color: "#22D3C5" }} />
            <p className="text-[13px] font-medium" style={{ color: "#22D3C5" }}>
              Config saved successfully
            </p>
          </div>
        )}

        {status === "fetchNotFound" && (
          <div
            data-ocid="device_config.fetch.error_state"
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{
              backgroundColor: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.25)",
            }}
          >
            <Info size={16} style={{ color: "#F59E0B" }} />
            <p className="text-[13px] font-medium" style={{ color: "#F59E0B" }}>
              No configuration found for this device ID
            </p>
          </div>
        )}

        {status === "saveError" && (
          <div
            data-ocid="device_config.generic.error_state"
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <AlertCircle size={16} style={{ color: "#EF4444" }} />
            <p className="text-[13px] font-medium" style={{ color: "#EF4444" }}>
              {errorMessage || "An error occurred"}
            </p>
          </div>
        )}

        {status === "validationError" && validationErrors.length > 0 && (
          <div
            data-ocid="device_config.validation.error_state"
            className="rounded-lg px-4 py-3 space-y-2"
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={14} style={{ color: "#EF4444" }} />
              <p
                className="text-[12px] font-semibold"
                style={{ color: "#EF4444" }}
              >
                Validation Errors ({validationErrors.length})
              </p>
            </div>
            <ul className="space-y-1 ml-5">
              {validationErrors.map((err) => (
                <li
                  key={`${err.loc.join("-")}-${err.msg}`}
                  data-ocid="device_config.validation.error_state"
                  className="text-[12px] list-disc"
                  style={{ color: "#FCA5A5" }}
                >
                  <span className="font-mono" style={{ color: "#F87171" }}>
                    [{err.loc.join(" → ")}]
                  </span>{" "}
                  {err.msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Section: Device Identity ── */}
        <Card
          style={{
            backgroundColor: "#141E2A",
            border: "1px solid #1F2B3A",
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle
              className="text-[14px] font-semibold uppercase tracking-widest"
              style={{ color: "#22D3C5" }}
            >
              Device Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {numInput("device_id", "Device ID", "device_id")}
            {numInput("client_id", "Client ID", "client_id")}
            {textInput(
              "configured_by",
              "Configured By",
              "configured_by",
              "Engineer name or system ID",
            )}
            {numInput(
              "config_timestamp",
              "Config Timestamp",
              "config_timestamp",
              "Unix epoch seconds",
            )}
            {textInput(
              "endpoint_URL",
              "Endpoint URL",
              "endpoint_URL",
              "https://server.example.com/api",
            )}
            {numInput("CAN_id", "CAN Bus ID", "CAN_id")}
            {numInput("mode", "Mode", "mode")}
          </CardContent>
        </Card>

        {/* ── Section: Radio Parameters ── */}
        <Card
          style={{
            backgroundColor: "#141E2A",
            border: "1px solid #1F2B3A",
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle
              className="text-[14px] font-semibold uppercase tracking-widest"
              style={{ color: "#22D3C5" }}
            >
              Radio Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {numInput(
              "frequency",
              "Frequency (Hz)",
              "frequency",
              "e.g. 868100000",
            )}
            {numInput("sf", "Spreading Factor", "sf", "7–12 for LoRaWAN")}
            {numInput("txp", "TX Power (dBm)", "txp", "Transmit power in dBm")}
          </CardContent>
        </Card>

        {/* ── Section: Feature Flags ── */}
        <Card
          style={{
            backgroundColor: "#141E2A",
            border: "1px solid #1F2B3A",
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle
              className="text-[14px] font-semibold uppercase tracking-widest"
              style={{ color: "#22D3C5" }}
            >
              Feature Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {boolToggle(
              "status",
              "Status",
              "status",
              "Enable or disable this device",
            )}
            {boolToggle(
              "debug_enable",
              "Debug Mode",
              "debug_enable",
              "Enable verbose debug logging",
            )}
            {boolToggle(
              "SD_enable",
              "SD Card Logging",
              "SD_enable",
              "Write telemetry logs to SD card",
            )}
            {boolToggle(
              "RFID_enable",
              "RFID Scanner",
              "RFID_enable",
              "Enable RFID tag scanning module",
            )}
          </CardContent>
        </Card>

        {/* ── Section: Thresholds ── */}
        <Card
          style={{
            backgroundColor: "#141E2A",
            border: "1px solid #1F2B3A",
          }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle
                className="text-[14px] font-semibold uppercase tracking-widest"
                style={{ color: "#22D3C5" }}
              >
                Thresholds
              </CardTitle>
              <Button
                type="button"
                data-ocid="device_config.thresholds.add_button"
                variant="outline"
                size="sm"
                onClick={addThreshold}
                className="h-7 text-[12px] gap-1 border"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#22D3C5",
                  color: "#22D3C5",
                }}
              >
                <Plus size={12} />
                Add Threshold
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {thresholdRows.length === 0 ? (
              <div
                data-ocid="device_config.thresholds.empty_state"
                className="text-center py-6"
                style={{ color: "#8FA2B8" }}
              >
                <p className="text-[13px]">
                  No thresholds configured. Click &ldquo;Add Threshold&rdquo; to
                  add key-value pairs.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {thresholdRows.map((row, i) => (
                  <div
                    key={row.id}
                    data-ocid={`device_config.thresholds.item.${i + 1}`}
                    className="flex gap-2 items-center"
                  >
                    <Input
                      data-ocid={`device_config.thresholds.key.input.${i + 1}`}
                      placeholder="Key"
                      value={row.key}
                      onChange={(e) =>
                        updateThreshold(row.id, "key", e.target.value)
                      }
                      className="h-8 text-[13px] border-0 focus-visible:ring-1 flex-1"
                      style={{
                        backgroundColor: "#0B0F14",
                        color: "#E8EEF6",
                        outline: "1px solid #1F2B3A",
                      }}
                    />
                    <Input
                      data-ocid={`device_config.thresholds.value.input.${i + 1}`}
                      placeholder="Value"
                      value={row.value}
                      onChange={(e) =>
                        updateThreshold(row.id, "value", e.target.value)
                      }
                      className="h-8 text-[13px] border-0 focus-visible:ring-1 flex-1"
                      style={{
                        backgroundColor: "#0B0F14",
                        color: "#E8EEF6",
                        outline: "1px solid #1F2B3A",
                      }}
                    />
                    <Button
                      type="button"
                      data-ocid={`device_config.thresholds.delete_button.${i + 1}`}
                      variant="ghost"
                      size="icon"
                      onClick={() => removeThreshold(row.id)}
                      className="h-8 w-8 flex-shrink-0 hover:bg-red-900/30"
                      style={{ color: "#EF4444" }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator style={{ backgroundColor: "#1F2B3A" }} />

        {/* ── Action Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <Button
            type="button"
            data-ocid="device_config.fetch_latest.button"
            onClick={handleFetchLatest}
            disabled={isFetchLoading || isSaveLoading}
            variant="outline"
            className="flex-1 sm:flex-none h-10 gap-2 text-[13px] font-medium border transition-colors"
            style={{
              backgroundColor: "transparent",
              borderColor: "#1F2B3A",
              color: isFetchLoading ? "#8FA2B8" : "#E8EEF6",
            }}
          >
            {isFetchLoading ? (
              <Loader2
                size={15}
                className="animate-spin"
                data-ocid="device_config.fetch.loading_state"
              />
            ) : (
              <Download size={15} />
            )}
            {isFetchLoading ? "Fetching..." : "Fetch Latest"}
          </Button>

          <Button
            type="button"
            data-ocid="device_config.save.primary_button"
            onClick={handleSaveConfig}
            disabled={isFetchLoading || isSaveLoading}
            className="flex-1 sm:flex-none h-10 gap-2 text-[13px] font-semibold transition-colors"
            style={{
              backgroundColor: isSaveLoading ? "#1A8F87" : "#22D3C5",
              color: "#0B0F14",
            }}
          >
            {isSaveLoading ? (
              <Loader2
                size={15}
                className="animate-spin"
                data-ocid="device_config.save.loading_state"
              />
            ) : (
              <Save size={15} />
            )}
            {isSaveLoading ? "Saving..." : "Save Config"}
          </Button>
        </div>
      </div>
    </div>
  );
}
