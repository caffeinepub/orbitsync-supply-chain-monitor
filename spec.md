# OrbitSync Supply Chain Monitor — Device Configuration Feature

## Current State
The project is a Motoko (ICP) + React/TypeScript dashboard for supply chain monitoring. It has:
- Backend: Asset, Telemetry, CustodyEvent, Alert, ETA types and CRUD operations in `src/backend/main.mo`
- Frontend: Dashboard with WorldMap, AssetList, KPICards, AlertsTable, AssetDetails, Globe3D components
- No device configuration feature exists yet

## Requested Changes (Diff)

### Add
- `DeviceConfig` type in Motoko backend with all fields from the API contract
- `setDeviceConfig` canister call — append-only, stores new row per call; latest = highest config_timestamp, tie-broken by auto-increment id
- `getLatestDeviceConfig` canister call — returns latest config for device_id or null (404)
- Frontend `DeviceConfigPage` component with full form (all 14 fields + thresholds key-value editor)
- "Fetch Latest" button: calls GET equivalent (getLatestDeviceConfig), populates form
- "Save Config" button: calls POST equivalent (setDeviceConfig)
- Client-side validation mirroring backend types
- 422-style error display (per-field detail items)
- Loading, success, 404 states
- Sidebar navigation entry for "Device Config" page
- Frontend tests: form rendering, validation, error rendering, submit/fetch flows
- `api/deviceConfig.ts` — typed API client with interfaces matching exact contract

### Modify
- `src/backend/main.mo` — add DeviceConfig type, storage map, setDeviceConfig, getLatestDeviceConfig
- `src/frontend/src/App.tsx` — add route/view for DeviceConfigPage
- `src/frontend/src/components/dashboard/Sidebar.tsx` — add "Device Config" nav item

### Remove
- Nothing removed

## Implementation Plan

**Stack choice (stated explicitly):**
- Backend: Motoko on ICP (existing stack — no FastAPI/Node option since we are on ICP)
- Frontend: React + TypeScript (existing stack)
- POST behavior: Append-only history. Each `setDeviceConfig` call inserts a new record with an auto-increment `id`. "Latest" = highest `config_timestamp`; ties broken by highest `id`.
- `thresholds` stored as `[(Text, Text)]` (key-value pairs, JSON-like, no enforced schema)
- Authentication: out of scope (calls are open)

**Backend work items:**
1. Add `DeviceConfig` type with all 14 contract fields + server fields (`id: Nat`, `created_at: Int`)
2. Add `deviceConfigs` map `Nat -> DeviceConfig` + `nextConfigId` counter
3. Implement `setDeviceConfig(config: DeviceConfigInput) : async DeviceConfig` — appends row, returns stored record
4. Implement `getLatestDeviceConfig(deviceId: Nat) : async ?DeviceConfig` — filters by device_id, sorts by config_timestamp desc then id desc, returns head or null
5. Update `backend.d.ts` types

**Frontend work items:**
1. Create `src/frontend/src/types/deviceConfig.ts` — TypeScript interfaces matching contract
2. Create `src/frontend/src/api/deviceConfig.ts` — typed fetch client for set/get calls via actor
3. Create `src/frontend/src/components/dashboard/DeviceConfigPage.tsx` — full form with all fields, thresholds editor, Fetch/Save buttons, validation, error/loading/success/404 states
4. Update `App.tsx` to support a `view` state toggling between dashboard and device config page
5. Update `Sidebar.tsx` to add "Device Config" nav item
6. Create `src/frontend/src/__tests__/DeviceConfigPage.test.tsx` — component tests covering render, validation, 422 errors, submit flow, fetch flow, 404 state
