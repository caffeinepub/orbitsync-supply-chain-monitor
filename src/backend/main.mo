import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Order "mo:core/Order";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  // TYPES & CONSTANTS

  type Asset = {
    id : Text;
    name : Text;
    assetType : AssetType;
    cargoType : CargoType;
    origin : Text;
    destination : Text;
    status : AssetStatus;
    createdAt : Int;
  };

  module Asset {
    public func compare(a1 : Asset, a2 : Asset) : Order.Order {
      Text.compare(a1.id, a2.id);
    };
  };

  type AssetType = { #vessel; #truck; #aircraft; #container };
  type CargoType = { #medical; #pharmaceutical; #equipment };
  type AssetStatus = { #inTransit; #onHold; #delivered; #alert };

  type Telemetry = {
    id : Text;
    assetId : Text;
    timestamp : Int;
    latitude : Float;
    longitude : Float;
    temperature : Float;
    humidity : Float;
    shockG : Float;
    satelliteSignal : Float;
  };

  module Telemetry {
    public func compare(t1 : Telemetry, t2 : Telemetry) : Order.Order {
      Text.compare(t1.id, t2.id);
    };
    public func compareByTimestamp(t1 : Telemetry, t2 : Telemetry) : Order.Order {
      Int.compare(t1.timestamp, t2.timestamp);
    };
  };

  type CustodyEvent = {
    id : Text;
    assetId : Text;
    timestamp : Int;
    location : Text;
    custodian : Text;
    eventType : EventType;
    notes : Text;
  };

  module CustodyEvent {
    public func compareByTimestamp(a : CustodyEvent, b : CustodyEvent) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  type EventType = { #pickup; #transfer; #checkpoint; #delivery };

  type Alert = {
    id : Text;
    assetId : Text;
    severity : AlertSeverity;
    alertType : AlertType;
    message : Text;
    timestamp : Int;
    resolved : Bool;
  };

  module Alert {
    public func compareByTimestamp(a : Alert, b : Alert) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  type AlertSeverity = { #high; #medium; #low };
  type AlertType = { #tempExceeded; #humidityAlert; #shockDetected; #geofenceBreach; #signalLost };

  type ETA = {
    assetId : Text;
    originPort : Text;
    destinationPort : Text;
    departedAt : Int;
    estimatedArrival : Int;
    distanceKm : Float;
    currentSpeedKnots : Float;
  };

  type TelemetryHistory = {
    assetId : Text;
    readings : [Telemetry];
  };

  public type UserProfile = {
    name : Text;
  };

  type DeviceConfig = {
    id : Nat;
    device_id : Nat;
    configured_by : Text;
    config_timestamp : Int;
    client_id : Nat;
    status : Bool;
    frequency : Nat;
    sf : Nat;
    txp : Nat;
    endpoint_URL : Text;
    CAN_id : Nat;
    mode : Nat;
    debug_enable : Bool;
    SD_enable : Bool;
    RFID_enable : Bool;
    thresholds : [(Text, Text)];
    created_at : Int;
  };

  type DeviceConfigInput = {
    device_id : Nat;
    configured_by : Text;
    config_timestamp : Int;
    client_id : Nat;
    status : Bool;
    frequency : Nat;
    sf : Nat;
    txp : Nat;
    endpoint_URL : Text;
    CAN_id : Nat;
    mode : Nat;
    debug_enable : Bool;
    SD_enable : Bool;
    RFID_enable : Bool;
    thresholds : [(Text, Text)];
  };

  // AUTHORISATION
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // PERFORMANCE OPTIMISATION
  let assets = Map.empty<Text, Asset>();
  let telemetries = Map.empty<Text, Telemetry>();
  let custodyEvents = Map.empty<Text, CustodyEvent>();
  let alerts = Map.empty<Text, Alert>();
  let etas = Map.empty<Text, ETA>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var deviceConfigs = Map.empty<Nat, DeviceConfig>();
  var nextConfigId = 1;

  // USER PROFILE OPERATIONS
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ASSET OPERATIONS
  public shared ({ caller }) func addAsset(asset : Asset) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add assets");
    };
    if (assets.containsKey(asset.id)) { Runtime.trap("Asset with this ID already exists") };
    assets.add(asset.id, asset);
  };

  public query ({ caller }) func getAsset(id : Text) : async ?Asset {
    assets.get(id);
  };

  public query ({ caller }) func listAssets() : async [Asset] {
    assets.values().toArray().sort();
  };

  // TELEMETRY OPERATIONS
  public shared ({ caller }) func recordTelemetry(t : Telemetry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record telemetry");
    };
    if (not assets.containsKey(t.assetId)) { Runtime.trap("Asset not found") };
    telemetries.add(t.id, t);
  };

  public query ({ caller }) func getLatestTelemetry(assetId : Text) : async ?Telemetry {
    let filtered = telemetries.values().toArray().filter(
      func(t) { t.assetId == assetId }
    );
    if (filtered.size() > 0) {
      let sorted = filtered.sort(Telemetry.compareByTimestamp);
      ?sorted[0];
    } else {
      null;
    };
  };

  public query ({ caller }) func getTelemetryHistory(assetId : Text, limit : Nat) : async TelemetryHistory {
    let filtered = telemetries.values().toArray().filter(
      func(t) { t.assetId == assetId }
    );
    let sorted = filtered.sort(Telemetry.compareByTimestamp);
    let limited = if (limit > sorted.size()) {
      sorted;
    } else {
      sorted.sliceToArray(0, limit);
    };
    { assetId; readings = limited };
  };

  // CUSTODY OPERATIONS
  public shared ({ caller }) func recordCustodyEvent(event : CustodyEvent) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record custody events");
    };
    if (not assets.containsKey(event.assetId)) { Runtime.trap("Asset not found") };
    custodyEvents.add(event.id, event);
  };

  public query ({ caller }) func getCustodyChain(assetId : Text) : async [CustodyEvent] {
    custodyEvents.values().toArray().filter(
      func(e) { e.assetId == assetId }
    ).sort(CustodyEvent.compareByTimestamp);
  };

  // ALERT OPERATIONS
  public shared ({ caller }) func createAlert(alert : Alert) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create alerts");
    };
    if (not assets.containsKey(alert.assetId)) { Runtime.trap("Asset not found") };
    alerts.add(alert.id, alert);
  };

  public shared ({ caller }) func resolveAlert(alertId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can resolve alerts");
    };
    switch (alerts.get(alertId)) {
      case (null) { Runtime.trap("Alert not found") };
      case (?alert) {
        let updated = { alert with resolved = true };
        alerts.add(alertId, updated);
      };
    };
  };

  public query ({ caller }) func getUnresolvedAlerts() : async [Alert] {
    alerts.values().toArray().filter(
      func(a) { not a.resolved }
    ).sort(Alert.compareByTimestamp);
  };

  // ETA OPERATIONS
  public shared ({ caller }) func updateETA(eta : ETA) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update ETA");
    };
    if (not assets.containsKey(eta.assetId)) { Runtime.trap("Asset not found") };
    etas.add(eta.assetId, eta);
  };

  public query ({ caller }) func getETA(assetId : Text) : async ?ETA {
    etas.get(assetId);
  };

  // SEED DATA
  public shared ({ caller }) func seedSampleData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can seed sample data");
    };
    if (assets.size() > 0) { Runtime.trap("Data has already been seeded") };
    // Seed assets
    let sampleAssets = [
      ("ASSET001", "Medical Container A", #container, #medical, "Rotterdam", "Lagos"),
      ("ASSET002", "Pharma Vessel X", #vessel, #pharmaceutical, "Singapore", "New York"),
      ("ASSET003", "Equipment Truck 1", #truck, #equipment, "Munich", "Istanbul"),
      ("ASSET004", "Medical Aircraft Z", #aircraft, #medical, "Johannesburg", "Cairo"),
      ("ASSET005", "Pharma Container B", #container, #pharmaceutical, "Hamburg", "Santos"),
    ];

    let currentTime = Time.now();
    sampleAssets.forEach(
      func((id, name, assetType, cargoType, origin, destination)) {
        let asset : Asset = {
          id;
          name;
          assetType = switch (assetType) {
            case (#vessel) { #vessel };
            case (#truck) { #truck };
            case (#aircraft) { #aircraft };
            case (#container) { #container };
          };
          cargoType = switch (cargoType) {
            case (#medical) { #medical };
            case (#pharmaceutical) { #pharmaceutical };
            case (#equipment) { #equipment };
          };
          origin;
          destination;
          status = #inTransit;
          createdAt = currentTime;
        };
        assets.add(id, asset);
      }
    );

    // Seed ETA data
    let sampleETAs = [
      ("ASSET001", "Rotterdam", "Lagos", currentTime, currentTime + 86400000000, 6000.0, 20.0),
      ("ASSET002", "Singapore", "New York", currentTime, currentTime + 172800000000, 15500.0, 30.0),
      ("ASSET003", "Munich", "Istanbul", currentTime, currentTime + 43200000000, 1800.0, 15.0),
      ("ASSET004", "Johannesburg", "Cairo", currentTime, currentTime + 21600000000, 7000.0, 500.0),
      ("ASSET005", "Hamburg", "Santos", currentTime, currentTime + 129600000000, 9700.0, 25.0),
    ];

    sampleETAs.forEach(
      func((assetId, originPort, destinationPort, departedAt, estimatedArrival, distanceKm, currentSpeedKnots)) {
        let eta : ETA = {
          assetId;
          originPort;
          destinationPort;
          departedAt;
          estimatedArrival;
          distanceKm;
          currentSpeedKnots;
        };
        etas.add(assetId, eta);
      }
    );
  };

  // DEVICE CONFIGURATION MANAGEMENT

  public shared ({ caller }) func setDeviceConfig(input : DeviceConfigInput) : async DeviceConfig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can configure devices");
    };
    let id = nextConfigId;
    nextConfigId += 1;
    let created_at = Time.now();
    let config : DeviceConfig = {
      input with
      id;
      created_at;
    };
    deviceConfigs.add(id, config);
    config;
  };

  public query ({ caller }) func getLatestDeviceConfig(deviceId : Nat) : async ?DeviceConfig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view device configurations");
    };
    let configsArray = deviceConfigs.values().toArray().filter(
      func(config) {
        config.device_id == deviceId
      }
    );
    let sortedArray = configsArray.sort(
      func(a, b) {
        if (a.config_timestamp == b.config_timestamp) {
          Nat.compare(b.id, a.id);
        } else {
          Int.compare(b.config_timestamp, a.config_timestamp);
        };
      }
    );
    if (sortedArray.size() == 0) {
      null;
    } else {
      ?sortedArray[0];
    };
  };
};
