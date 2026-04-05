# Device Config Page — Test Suite

This test file requires additional dev dependencies not included in the base package.
To run these tests, add to `src/frontend/package.json` devDependencies:

```json
"vitest": "^2.0.0",
"@vitest/ui": "^2.0.0",
"@testing-library/react": "^16.0.0",
"@testing-library/jest-dom": "^6.0.0",
"@testing-library/user-event": "^14.0.0",
"jsdom": "^25.0.0"
```

And update `vite.config.js` to add:
```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test-setup.ts'],
}
```

Create `src/frontend/src/test-setup.ts`:
```ts
import '@testing-library/jest-dom';
```

Then run: `pnpm test`

## Test File: `src/frontend/src/__tests__/DeviceConfigPage.test.tsx`

Once deps are installed, place this file at `src/frontend/src/__tests__/DeviceConfigPage.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeviceConfigPage } from "../components/dashboard/DeviceConfigPage";
import type { DeviceConfig } from "../backend.d";

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
  thresholds: [["temp_max", "85"], ["humidity_min", "20"]],
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
  beforeEach(() => { vi.clearAllMocks(); });

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
    fireEvent.change(screen.getByLabelText(/Configured By/i), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/Endpoint URL/i), { target: { value: "" } });
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
    fireEvent.change(screen.getByLabelText(/Configured By/i), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/Endpoint URL/i), { target: { value: "https://test.com" } });
    fireEvent.click(screen.getByText("Save Config"));
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it("shows success message after save", async () => {
    render(<DeviceConfigPage actor={createMockActor()} />);
    fireEvent.change(screen.getByLabelText(/Configured By/i), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/Endpoint URL/i), { target: { value: "https://api.example.com" } });
    fireEvent.click(screen.getByText("Save Config"));
    await waitFor(() => {
      expect(screen.getByText("Config saved successfully")).toBeInTheDocument();
    });
  });

  it("populates form on successful fetch", async () => {
    render(<DeviceConfigPage actor={createMockActor()} />);
    fireEvent.change(screen.getByLabelText(/Device ID/i), { target: { value: "42" } });
    fireEvent.click(screen.getByText("Fetch Latest"));
    await waitFor(() => {
      expect(screen.getByText("Config loaded")).toBeInTheDocument();
    });
    const input = screen.getByLabelText(/Configured By/i) as HTMLInputElement;
    expect(input.value).toBe("TestEngineer");
  });

  it("shows 404 message when no config found", async () => {
    const actor = createMockActor({
      getLatestDeviceConfig: vi.fn().mockResolvedValue(null),
    });
    render(<DeviceConfigPage actor={actor} />);
    fireEvent.click(screen.getByText("Fetch Latest"));
    await waitFor(() => {
      expect(screen.getByText(/No configuration found for this device ID/i)).toBeInTheDocument();
    });
  });

  it("shows loading indicator during save", async () => {
    let resolve: (val: DeviceConfig) => void;
    const savePromise = new Promise<DeviceConfig>((res) => { resolve = res; });
    const actor = createMockActor({ setDeviceConfig: vi.fn().mockReturnValue(savePromise) });
    render(<DeviceConfigPage actor={actor} />);
    fireEvent.change(screen.getByLabelText(/Configured By/i), { target: { value: "Bob" } });
    fireEvent.change(screen.getByLabelText(/Endpoint URL/i), { target: { value: "https://api.test.com" } });
    fireEvent.click(screen.getByText("Save Config"));
    await waitFor(() => { expect(screen.getByText("Saving...")).toBeInTheDocument(); });
    await act(async () => { resolve!(mockDeviceConfig); });
    await waitFor(() => { expect(screen.queryByText("Saving...")).not.toBeInTheDocument(); });
  });

  it("can add and remove threshold rows", () => {
    render(<DeviceConfigPage actor={createMockActor()} />);
    expect(screen.getByText(/No thresholds configured/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add Threshold"));
    const keys = screen.getAllByPlaceholderText("Key");
    expect(keys).toHaveLength(1);
    fireEvent.change(keys[0], { target: { value: "temp_max" } });
    const deleteBtn = screen.getAllByRole("button").find(
      (btn) => btn.getAttribute("data-ocid")?.includes("delete_button")
    )!;
    fireEvent.click(deleteBtn);
    expect(screen.getByText(/No thresholds configured/i)).toBeInTheDocument();
  });
});
```
