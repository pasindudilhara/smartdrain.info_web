# Public Map UI Refresh

The `/public` route is now a full-screen SmartDrain network map.

## Changes

- Full viewport map (`100dvh`) with no page chrome consuming map space.
- Urban Inventors SVG logo in the floating brand header.
- Floating search for device name/code, Urban Council and address.
- Status, country-model and device-type filters.
- Live network counters for devices, online units, attention-required units and councils.
- Custom Smart Drain / Smart Drain Bin map markers with status colors.
- Selected-device telemetry panel with water level, velocity, flow rate, temperature, battery and bin-fill support.
- Responsive mobile bottom sheet so the map remains usable on phones.
- Cleaner Leaflet popups and zoom controls.
- Existing `/public/map` API contract retained.

## Logo

The supplied Urban Inventors logo is stored at:

`public/urban-inventors-logo.svg`
