export type Role = "SUPER_ADMIN" | "URBAN_COUNCIL_ADMIN"
export type ModelCategory = "DEVELOPED_COUNTRY_MODEL" | "DEVELOPING_COUNTRY_MODEL" | "UNDERGROUND_DRAINS" | "OPEN_DRAINS"
export type DeviceType = "SMART_DRAIN" | "SMART_DRAIN_BIN" | "INLET_FILTER" | "OPEN_DRAIN_FILTER"
export type DeviceStatus = "ONLINE" | "WARNING" | "CRITICAL" | "OFFLINE" | "MAINTENANCE"
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "ADDRESSED"
export type SiteCondition =
  | "NONE"
  | "BACKWATER_AFFECTED"
  | "CLOGGING_HOTSPOT"
  | "LITTER_HOTSPOT"
  | "UNDULATING_TERRAIN"
  | "LOW_LYING_AREA"
  | "NEAR_A_MARSH"
export type AlertSeverity = "WARNING" | "CRITICAL"
export type AlertType =
  | "WATER_LEVEL"
  | "VELOCITY"
  | "FLOW_RATE"
  | "TEMPERATURE"
  | "BATTERY"
  | "BIN_FILL"
  | "DEVICE_OFFLINE"

export type FacilityType = "SORTING_FACILITY" | "RECYCLING_FACILITY" | "WASTE_TRANSFER_STATION" | "COUNCIL_FACILITY"
export type FacilityStatus = "ACTIVE" | "INACTIVE"
export type SortingStatus = "PENDING" | "RECEIVED" | "SORTED" | "RECYCLED" | "DISPOSED"
export type DeliveryStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED"

export interface AuthUser {
  id: number
  username: string
  displayName: string
  role: Role
  councilId: number | null
  councilName: string | null
}

export interface LoginResponse {
  token: string
  expiresAt: string
  user: AuthUser
}

export interface Council {
  id: number
  code: string
  name: string
  city: string | null
  country: string
  contactEmail: string | null
  contactPhone: string | null
  whatsappNumber: string | null
  active: boolean
  deviceCount: number
}

export interface CouncilUser {
  id: number
  username: string
  displayName: string
  role: Role
  councilId: number
  active: boolean
}

/** Matches backend ApiDtos.LatestTelemetry. */
export interface LatestTelemetry {
  recordedAt: string
  externalReadingId: number | null
  distanceCm: number | null
  waterDepthCm: number | null
  waterLevelMm: number | null
  crossSectionAreaM2: number | null
  wettedPerimeterM: number | null
  hydraulicRadiusM: number | null
  velocityMps: number | null
  flowRateLps: number | null
  temperatureC: number | null
  batteryPercent: number | null
  batteryVoltage: number | null
  binFillPercent: number | null
  signalRssi: number | null
}

/** Matches backend ApiDtos.DeviceView. */
export interface Device {
  id: number
  deviceCode: string
  name: string
  councilId: number
  councilName: string
  modelCategory: ModelCategory
  deviceType: DeviceType
  status: DeviceStatus
  latitude: number
  longitude: number
  address: string | null
  serialNumber: string | null
  firmwareVersion: string | null
  drainHeightCm: number | null
  drainWidthCm: number | null
  drainLengthCm: number | null
  siteCondition: SiteCondition | null
  installedAt: string | null
  lastSeenAt: string | null
  active: boolean
  latest: LatestTelemetry | null
  ingestKey: string | null
}

/** Matches backend ApiDtos.TelemetryPoint. */
export interface TelemetryPoint extends LatestTelemetry {
  id: number
}

export interface Thresholds {
  councilId: number
  councilName: string
  waterLevelWarningMm: number
  waterLevelCriticalMm: number
  velocityWarningMps: number
  velocityCriticalMps: number
  flowRateWarningLps: number
  flowRateCriticalLps: number
  temperatureLowC: number
  temperatureHighC: number
  batteryWarningPercent: number
  batteryCriticalPercent: number
  binFillWarningPercent: number
  binFillCriticalPercent: number
  whatsappEnabled: boolean
  whatsappRecipients: string
  updatedAt: string
}

export interface AlertNotificationView {
  id: number
  recipientName: string
  recipientEmail: string | null
  recipientPhone: string | null
  channel: string
  deliveryStatus: DeliveryStatus
  sentAt: string | null
}

export interface Alert {
  id: number
  councilId: number
  councilName: string
  deviceId: number
  deviceCode: string
  deviceName: string
  deviceLatitude: number
  deviceLongitude: number
  deviceAddress: string | null
  alertType: AlertType
  severity: AlertSeverity
  title: string
  message: string
  metricValue: number | null
  thresholdValue: number | null
  status: AlertStatus
  createdAt: string
  acknowledgedAt: string | null
  resolvedAt: string | null
  /** Present when backend supports addressed workflow */
  addressedAt: string | null
  /** Display name of the council worker who addressed the alert */
  addressedBy: string | null
  notifications: AlertNotificationView[]
}

export interface Dashboard {
  councils: number
  devices: number
  online: number
  warning: number
  critical: number
  offline: number
  openAlerts: number
  avgBattery: number
  avgWaterLevel: number
  litterPreventedGrams: number
  eligibleHotSpots: number
  /** Count of alerts marked addressed in the last 24 h — may be absent in older backends */
  alertsAddressed24h?: number
  modelCounts: { model: ModelCategory; count: number }[]
  statusCounts: { status: DeviceStatus; count: number }[]
  recentAlerts: Alert[]
}

export interface Analytics {
  timeline: {
    time: string
    waterLevel: number | null
    velocity: number | null
    flowRate: number | null
    temperature: number | null
    battery: number | null
    binFill: number | null
  }[]
  modelDistribution: { model: ModelCategory; count: number }[]
  statusDistribution: { status: DeviceStatus; count: number }[]
  councils: { councilId: number; councilName: string; devices: number; openAlerts: number; avgBattery: number }[]
  alertsByType: { type: AlertType; count: number }[]
}

// ── Hardware Specification types ──
export interface HardwareSpec {
  id: number
  material: string
  customMaterial: string | null
  grade: string | null
  sheetThickness: string | null
  gauge: string | null
  meshHoleSize: string | null
  meshOpenArea: string | null
  customMeshSize: string | null
  customOpenArea: string | null
  deviceId: number | null
  deviceName: string | null
  createdAt: string
  updatedAt: string
}

// ── Alert Recipient types ──
export interface AlertRecipient {
  id: number
  councilId: number
  councilName: string
  recipientName: string
  recipientEmail: string | null
  recipientPhone: string | null
  active: boolean
  createdAt: string
}

// ── Handover Facility types ──
export interface HandoverFacility {
  id: number
  facilityName: string
  facilityType: FacilityType
  councilId: number
  councilName: string
  latitude: number | null
  longitude: number | null
  personInCharge: string | null
  contactNumber: string | null
  contactEmail: string | null
  acceptedWasteTypes: string | null
  facilityStatus: FacilityStatus
  createdAt: string
  updatedAt: string
}

// ── Litter Handover Record types ──
export interface HandoverRecord {
  id: number
  handoverDate: string
  handoverTime: string | null
  deviceId: number
  deviceCode: string
  deviceName: string
  councilId: number
  councilName: string
  collectionLocation: string | null
  lastCleanedDate: string | null
  wasteCollected: string | null
  wasteWeightKg: number | null
  wasteVolume: string | null
  wasteCompositions: string[]
  facilityId: number | null
  facilityName: string | null
  receivedBy: string | null
  transportedBy: string | null
  vehicleDetails: string | null
  handoverReference: string | null
  sortingStatus: SortingStatus
  recyclableWasteKg: number | null
  residualWasteKg: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

// ── Litter Statistics types ──
export interface LitterStats {
  totalWasteCollectedKg: number
  totalRecyclableWasteKg: number
  totalResidualWasteKg: number
  lastCleanedDate: string | null
  lastHandoverFacility: string | null
  /** Most recent collection partner name (if backend provides it) */
  lastCollectionPartner?: string | null
}

// ── Collection Partner types ──
export interface CollectionPartner {
  id: number
  partnerName: string
  contactPerson: string | null
  phoneNumber: string | null
  email: string | null
  councilId: number
  councilName: string
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}
