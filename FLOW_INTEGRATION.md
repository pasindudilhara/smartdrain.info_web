# SmartDrain flow integration

This frontend is aligned with the SmartDrain backend flow-calculation update.

## Device configuration

For `SMART_DRAIN` devices the Add/Edit Device form now sends:

- `drainHeightCm` — drain/sensor mounting height from the drain bottom, in centimetres.
- `drainWidthCm` — internal drain width, in centimetres.

The backend requires both values to be greater than zero for Smart Drain devices.

## Sensor telemetry

The field device posts its raw payload to `POST /api/ingest/sensor` with the `X-Device-Key` header. The frontend does not calculate hydraulic values itself; it displays the values calculated and returned by the backend.

The UI supports these latest/history fields:

- `externalReadingId`
- `distanceCm`
- `waterDepthCm`
- `waterLevelMm`
- `crossSectionAreaM2`
- `wettedPerimeterM`
- `hydraulicRadiusM`
- `velocityMps`
- `flowRateLps`
- `batteryVoltage`
- `batteryPercent` (legacy telemetry)
- `signalRssi`

Battery display prefers `batteryPercent` when supplied by legacy telemetry and otherwise displays the raw `batteryVoltage` sent by the new field device.
