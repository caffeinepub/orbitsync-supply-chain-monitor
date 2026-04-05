import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeviceConfig } from "../backend.d";
import { DeviceConfigPage } from "../components/dashboard/DeviceConfigPage";

const mockDeviceConfig: DeviceConfig = {
  id: 1n,
  device_id: 42n,
  configured_by: "TestEngineer",
  config_timestamp: 1700000000n,
  client_id: 7n,
  status: true,
  frequency: 868100000n,
  sf: 9n,
  txp: 20n,
  endpoint_URL: "https://api.example.com/telemetry",
  CAN_id: 5n,
  mode: 1n,
  debug_enable: false,
  SD_enable: true,
  RFID_enable: false,
  thresholds: [
    ["temp_max", "85"],
    ["humidity_min", "20"],
  ],
  created_at: 1700000001n,
};

function createMockActor(overrides = {}) {
  return {
    setDeviceConfig: vi.fn().mockResolvedValue(mockDeviceConfig),
    getLatestDeviceConfig: vi.fn().mockResolvedValue(mockDeviceConfig),
    ...overrides,
  };
}

describe("DeviceConfigPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields and sections", () => {
    render(<DeviceConfigPage actor={createMockActor()} />);
    expect(screen.getByText("Device Identity")).toBeInTheDocument();
    expect(screen.getByText("Radio Parameters")).toBeInTheDocument();
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
    expect(screen.getByText("Thresholds")).toBeInTheDocument();
    expect(screen.getByLabelText(/Device ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Configured By/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Endpoint URL/i)).toBeInTheDocument();
    expect(screen.getByText("Fetch Latest")).toBeInTheDocument();
    expect(screen.getByText("Save Config")).toBeInTheDocument();
  });

  it("shows validation error when configured_by is empty", async () => {
    render(<DeviceConfigPage actor={createMockActor()} />);
    // Clear configured_by
    const configuredByInput = screen.getByLabelText(/Configured By/i);
    fireEvent.change(configuredByInput, { target: { value: "" } });
    // Clear endpoint_URL too to trigger multiple errors (already empty by default)
    fireEvent.click(screen.getByText("Save Config"));
    await waitFor(() => {
      expect(screen.getByText(/Validation Errors/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/configured_by is required/i)).toBeInTheDocument();
  });

  it("shows generic error on actor rejection", async () => {
    const actor = createMockActor({
      setDeviceConfig: vi.fn().mockRejectedValue(new Error("Network error")),
    });
    render(<DeviceConfigPage actor={actor} />);
    fireEvent.change(screen.getByLabelText(/Configured By/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByLabelText(/Endpoint URL/i), {
      target: { value: "https://test.com" },
    });
    fireEvent.click(screen.getByText("Save Config"));
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it("shows success message after save", async () => {
    render(<DeviceConfigPage actor={createMockActor()} />);
    fireEvent.change(screen.getByLabelText(/Configured By/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByLabelText(/Endpoint URL/i), {
      target: { value: "https://api.example.com" },
    });
    fireEvent.click(screen.getByText("Save Config"));
    await waitFor(() => {
      expect(screen.getByText("Config saved successfully")).toBeInTheDocument();
    });
  });

  it("populates form on successful fetch", async () => {
    render(<DeviceConfigPage actor={createMockActor()} />);
    // Set device_id input
    const deviceIdInput = screen.getByLabelText(/Device ID/i);
    fireEvent.change(deviceIdInput, { target: { value: "42" } });
    fireEvent.click(screen.getByText("Fetch Latest"));
    await waitFor(() => {
      expect(screen.getByText("Config loaded")).toBeInTheDocument();
    });
    const configuredByInput = screen.getByLabelText(
      /Configured By/i,
    ) as HTMLInputElement;
    expect(configuredByInput.value).toBe("TestEngineer");
  });

  it("shows 404 message when no config found", async () => {
    const actor = createMockActor({
      getLatestDeviceConfig: vi.fn().mockResolvedValue(null),
    });
    render(<DeviceConfigPage actor={actor} />);
    fireEvent.click(screen.getByText("Fetch Latest"));
    await waitFor(() => {
      expect(
        screen.getByText(/No configuration found for this device ID/i),
      ).toBeInTheDocument();
    });
  });

  it("shows loading indicator during save", async () => {
    let resolveCall!: (val: DeviceConfig) => void;
    const savePromise = new Promise<DeviceConfig>((res) => {
      resolveCall = res;
    });
    const actor = createMockActor({
      setDeviceConfig: vi.fn().mockReturnValue(savePromise),
    });
    render(<DeviceConfigPage actor={actor} />);
    fireEvent.change(screen.getByLabelText(/Configured By/i), {
      target: { value: "Bob" },
    });
    fireEvent.change(screen.getByLabelText(/Endpoint URL/i), {
      target: { value: "https://api.test.com" },
    });
    fireEvent.click(screen.getByText("Save Config"));
    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
    await act(async () => {
      resolveCall(mockDeviceConfig);
    });
    await waitFor(() => {
      expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
    });
  });

  it("can add and remove threshold rows", () => {
    render(<DeviceConfigPage actor={createMockActor()} />);
    expect(screen.getByText(/No thresholds configured/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add Threshold"));
    const keyInputs = screen.getAllByPlaceholderText("Key");
    expect(keyInputs).toHaveLength(1);
    fireEvent.change(keyInputs[0], { target: { value: "temp_max" } });
    const deleteBtn = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("data-ocid")?.includes("delete_button"));
    expect(deleteBtn).toBeDefined();
    fireEvent.click(deleteBtn!);
    expect(screen.getByText(/No thresholds configured/i)).toBeInTheDocument();
  });
});
