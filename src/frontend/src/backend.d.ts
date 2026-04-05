import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TelemetryHistory {
    assetId: string;
    readings: Array<Telemetry>;
}
export interface DeviceConfigInput {
    sf: bigint;
    txp: bigint;
    configured_by: string;
    status: boolean;
    mode: bigint;
    device_id: bigint;
    CAN_id: bigint;
    endpoint_URL: string;
    RFID_enable: boolean;
    frequency: bigint;
    client_id: bigint;
    thresholds: Array<[string, string]>;
    config_timestamp: bigint;
    debug_enable: boolean;
    SD_enable: boolean;
}
export interface ETA {
    originPort: string;
    assetId: string;
    destinationPort: string;
    distanceKm: number;
    departedAt: bigint;
    estimatedArrival: bigint;
    currentSpeedKnots: number;
}
export interface CustodyEvent {
    id: string;
    assetId: string;
    notes: string;
    timestamp: bigint;
    location: string;
    custodian: string;
    eventType: EventType;
}
export interface Asset {
    id: string;
    status: AssetStatus;
    destination: string;
    cargoType: CargoType;
    name: string;
    createdAt: bigint;
    origin: string;
    assetType: AssetType;
}
export interface Telemetry {
    id: string;
    latitude: number;
    shockG: number;
    assetId: string;
    temperature: number;
    satelliteSignal: number;
    humidity: number;
    longitude: number;
    timestamp: bigint;
}
export interface DeviceConfig {
    id: bigint;
    sf: bigint;
    txp: bigint;
    configured_by: string;
    status: boolean;
    mode: bigint;
    device_id: bigint;
    created_at: bigint;
    CAN_id: bigint;
    endpoint_URL: string;
    RFID_enable: boolean;
    frequency: bigint;
    client_id: bigint;
    thresholds: Array<[string, string]>;
    config_timestamp: bigint;
    debug_enable: boolean;
    SD_enable: boolean;
}
export interface Alert {
    id: string;
    resolved: boolean;
    alertType: AlertType;
    assetId: string;
    message: string;
    timestamp: bigint;
    severity: AlertSeverity;
}
export interface UserProfile {
    name: string;
}
export enum AlertSeverity {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum AlertType {
    geofenceBreach = "geofenceBreach",
    tempExceeded = "tempExceeded",
    shockDetected = "shockDetected",
    humidityAlert = "humidityAlert",
    signalLost = "signalLost"
}
export enum AssetStatus {
    alert = "alert",
    inTransit = "inTransit",
    delivered = "delivered",
    onHold = "onHold"
}
export enum AssetType {
    truck = "truck",
    aircraft = "aircraft",
    vessel = "vessel",
    container = "container"
}
export enum CargoType {
    equipment = "equipment",
    medical = "medical",
    pharmaceutical = "pharmaceutical"
}
export enum EventType {
    checkpoint = "checkpoint",
    pickup = "pickup",
    delivery = "delivery",
    transfer = "transfer"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAsset(asset: Asset): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAlert(alert: Alert): Promise<void>;
    getAsset(id: string): Promise<Asset | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustodyChain(assetId: string): Promise<Array<CustodyEvent>>;
    getETA(assetId: string): Promise<ETA | null>;
    getLatestDeviceConfig(deviceId: bigint): Promise<DeviceConfig | null>;
    getLatestTelemetry(assetId: string): Promise<Telemetry | null>;
    getTelemetryHistory(assetId: string, limit: bigint): Promise<TelemetryHistory>;
    getUnresolvedAlerts(): Promise<Array<Alert>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAssets(): Promise<Array<Asset>>;
    recordCustodyEvent(event: CustodyEvent): Promise<void>;
    recordTelemetry(t: Telemetry): Promise<void>;
    resolveAlert(alertId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedSampleData(): Promise<void>;
    setDeviceConfig(input: DeviceConfigInput): Promise<DeviceConfig>;
    updateETA(eta: ETA): Promise<void>;
}
