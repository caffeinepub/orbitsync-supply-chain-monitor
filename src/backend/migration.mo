import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type UserProfile = {
    name : Text;
  };
  type Asset = {
    id : Text;
    name : Text;
    assetType : {
      #vessel;
      #truck;
      #aircraft;
      #container;
    };
    cargoType : { #medical; #pharmaceutical; #equipment };
    origin : Text;
    destination : Text;
    status : { #inTransit; #onHold; #delivered; #alert };
    createdAt : Int;
  };
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
  type CustodyEvent = {
    id : Text;
    assetId : Text;
    timestamp : Int;
    location : Text;
    custodian : Text;
    eventType : { #pickup; #transfer; #checkpoint; #delivery };
    notes : Text;
  };
  type Alert = {
    id : Text;
    assetId : Text;
    severity : {
      #high;
      #medium;
      #low;
    };
    alertType : {
      #tempExceeded;
      #humidityAlert;
      #shockDetected;
      #geofenceBreach;
      #signalLost;
    };
    message : Text;
    timestamp : Int;
    resolved : Bool;
  };
  type ETA = {
    assetId : Text;
    originPort : Text;
    destinationPort : Text;
    departedAt : Int;
    estimatedArrival : Int;
    distanceKm : Float;
    currentSpeedKnots : Float;
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

  type OldActor = {
    assets : Map.Map<Text, Asset>;
    telemetries : Map.Map<Text, Telemetry>;
    custodyEvents : Map.Map<Text, CustodyEvent>;
    alerts : Map.Map<Text, Alert>;
    etas : Map.Map<Text, ETA>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
  };

  type NewActor = {
    assets : Map.Map<Text, Asset>;
    telemetries : Map.Map<Text, Telemetry>;
    custodyEvents : Map.Map<Text, CustodyEvent>;
    alerts : Map.Map<Text, Alert>;
    etas : Map.Map<Text, ETA>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    deviceConfigs : Map.Map<Nat, DeviceConfig>;
    nextConfigId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      assets = old.assets;
      telemetries = old.telemetries;
      custodyEvents = old.custodyEvents;
      alerts = old.alerts;
      etas = old.etas;
      userProfiles = old.userProfiles;
      deviceConfigs = Map.empty<Nat, DeviceConfig>();
      nextConfigId = 1;
    };
  };
};
