// frontend/src/components/MissionMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  LayersControl,
  LayerGroup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Route } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/**
 * MissionMap.jsx
 *
 * - React-Leaflet based mission overview map.
 * - Starts EMPTY until user uploads a KML.
 * - After upload:
 *    - parses KML (points, LineString routes, Polygon areas),
 *    - draws waypoints / routes / areas,
 *    - fits map bounds to only KML features (safely),
 *    - shows Scout, Delivery and Base markers (droneData prop drives their positions).
 * - Satellite base layer is included (Esri World Imagery by default) and user can toggle to street tiles.
 * - Defensively checks bounds validity before calling fitBounds to avoid "Bounds are not valid" errors.
 *
 * Notes:
 * - This file does NOT require leaflet-omnivore or @mapbox/togeojson. It uses an in-browser parser
 *   (parseKML) that extracts common KML geometries. This reduces dependency issues.
 * - Replace or wire real-time drone coordinates by passing `droneData` prop from parent.
 *
 * Props:
 * - droneData: {
 *     base: { lat, lng },
 *     scout: { location: { lat, lng }, battery, altitude, speed },
 *     delivery: { location: { lat, lng }, battery, payload, altitude },
 *     victim: { lat, lng } (optional)
 *   }
 * - missionActive: boolean (for A* visualization)
 * - isMainMap: boolean (controls layout/overlays)
 *
 * Drop this file into frontend/src/components and import where used.
 */

/* ---------- Leaflet default marker fix (retain earlier behavior) ---------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ---------- Custom div icons (keeps the visual language from your repo) ---------- */
const createCustomIcon = (color, svgContent) =>
  L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
        ${svgContent}
      </svg>
    </div>`,
    className: 'custom-div-icon',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const scoutIcon = createCustomIcon(
  '#10b981',
  '<circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>'
);
const deliveryIcon = createCustomIcon(
  '#f59e0b',
  '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 9h6v6H9z"/>'
);
const baseIcon = createCustomIcon(
  '#3b82f6',
  '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>'
);
const victimIcon = createCustomIcon(
  '#ef4444',
  '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6m0-6l6 6"/>'
);
const waypointIcon = createCustomIcon(
  '#06b6d4',
  '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>'
);

/* ---------- Map bounds updater (safe fitBounds call) ---------- */
const MapBoundsUpdater = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !bounds) return;
    try {
      // If bounds is a LatLngBounds object with isValid()
      if (typeof bounds.isValid === 'function') {
        if (bounds.isValid()) {
          // call fitBounds only when valid
          map.fitBounds(bounds, { padding: [24, 24] });
        }
      } else {
        // If bounds provided as Array of coords, convert and fit
        const b = L.latLngBounds(bounds);
        if (b.isValid()) map.fitBounds(b, { padding: [24, 24] });
      }
    } catch (err) {
      // Defensive: ignore invalid bounds errors
      // console.warn('MapBoundsUpdater: fitBounds skipped due to error', err);
    }
  }, [bounds, map]);
  return null;
};

/* ---------- Lightweight in-browser KML parser ----------
   - Extracts Placemark points -> waypoints
   - Extracts LineString -> route paths
   - Extracts Polygon -> area coordinates
   - Returns an object shaped for this component
*/
function parseKML(kmlText) {
  const out = { fileName: '', waypoints: [], coordinates: [] };
  if (!kmlText || typeof kmlText !== 'string') return out;
  const dom = new DOMParser().parseFromString(kmlText, 'text/xml');

  // Some KMLs use namespaces; using localName checks keeps this robust
  const placemarks = Array.from(dom.getElementsByTagName('Placemark'));

  placemarks.forEach((pm) => {
    const nameNode = pm.getElementsByTagName('name')[0];
    const name = nameNode && nameNode.textContent ? nameNode.textContent.trim() : '';

    // Point -> waypoint
    const point = pm.getElementsByTagName('Point')[0];
    if (point) {
      const coordsNode = point.getElementsByTagName('coordinates')[0];
      if (coordsNode && coordsNode.textContent) {
        const tokens = coordsNode.textContent.trim().split(/\s+/).filter(Boolean);
        if (tokens.length > 0) {
          const first = tokens[0].trim();
          const [lngStr, latStr] = first.split(',').map((s) => s.trim());
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            out.waypoints.push({ name, lat, lng });
          }
        }
      }
      return;
    }

    // LineString -> route
    const line = pm.getElementsByTagName('LineString')[0];
    if (line) {
      const coordsNode = line.getElementsByTagName('coordinates')[0];
      if (coordsNode && coordsNode.textContent) {
        const tokens = coordsNode.textContent.trim().split(/\s+/).filter(Boolean);
        const path = tokens
          .map((tok) => {
            const [lngStr, latStr] = tok.split(',').map((s) => s.trim());
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            return !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : null;
          })
          .filter(Boolean);
        if (path.length) out.coordinates.push({ type: 'route', path });
      }
      return;
    }

    // Polygon -> area
    const polygon = pm.getElementsByTagName('Polygon')[0];
    if (polygon) {
      // prefer outerBoundaryIs -> LinearRing -> coordinates
      let coordsNode = polygon.getElementsByTagName('outerBoundaryIs')[0];
      if (coordsNode) coordsNode = coordsNode.getElementsByTagName('coordinates')[0];
      if (!coordsNode) coordsNode = polygon.getElementsByTagName('coordinates')[0];

      if (coordsNode && coordsNode.textContent) {
        const tokens = coordsNode.textContent.trim().split(/\s+/).filter(Boolean);
        const area = tokens
          .map((tok) => {
            const [lngStr, latStr] = tok.split(',').map((s) => s.trim());
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            return !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : null;
          })
          .filter(Boolean);
        if (area.length) out.coordinates.push({ type: 'area', area });
      }
      return;
    }

    // fallback: if placemark contains LineString deeper
    const innerLine = pm.getElementsByTagName('LineString')[0];
    if (innerLine) {
      const coordsNode = innerLine.getElementsByTagName('coordinates')[0];
      if (coordsNode && coordsNode.textContent) {
        const tokens = coordsNode.textContent.trim().split(/\s+/).filter(Boolean);
        const path = tokens
          .map((tok) => {
            const [lngStr, latStr] = tok.split(',').map((s) => s.trim());
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            return !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : null;
          })
          .filter(Boolean);
        if (path.length) out.coordinates.push({ type: 'route', path });
      }
    }
  });

  return out;
}

/* ---------- Utility: compute bounds from parsed KML ---------- */
function computeBoundsFromKml(parsed) {
  const bounds = L.latLngBounds([]);
  if (!parsed) return null;

  if (Array.isArray(parsed.waypoints)) {
    parsed.waypoints.forEach((w) => {
      if (w && typeof w.lat === 'number' && typeof w.lng === 'number') {
        bounds.extend([w.lat, w.lng]);
      }
    });
  }

  if (Array.isArray(parsed.coordinates)) {
    parsed.coordinates.forEach((item) => {
      if (item.type === 'area' && Array.isArray(item.area)) {
        item.area.forEach((pt) => {
          if (pt && typeof pt.lat === 'number' && typeof pt.lng === 'number') {
            bounds.extend([pt.lat, pt.lng]);
          }
        });
      }
      if (item.type === 'route' && Array.isArray(item.path)) {
        item.path.forEach((pt) => {
          if (pt && typeof pt.lat === 'number' && typeof pt.lng === 'number') {
            bounds.extend([pt.lat, pt.lng]);
          }
        });
      }
    });
  }

  return bounds.isValid() ? bounds : null;
}

/* ---------- A* path simulator (keeps previous behavior) ---------- */
const calculateAStarPath = (start, end) => {
  const path = [];
  if (!start || !end) return path;
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const lat = start.lat + (end.lat - start.lat) * progress;
    const lng = start.lng + (end.lng - start.lng) * progress;
    const offset = Math.sin(progress * Math.PI) * 0.002;
    path.push([lat + offset, lng + offset]);
  }
  return path;
};

/* ---------- Main component ---------- */
const MissionMap = ({ droneData, missionActive, isMainMap = false }) => {
  // KML parsed object: { fileName, waypoints: [...], coordinates: [...] }
  const [kmlData, setKmlData] = useState(null);
  const [kmlBounds, setKmlBounds] = useState(null);
  const [kmlUploaded, setKmlUploaded] = useState(false);
  const [pathPoints, setPathPoints] = useState([]);
  const fileInputRef = useRef(null);

  // When missionActive toggles or droneData updates, recalc A* path
  useEffect(() => {
    if (missionActive && droneData && droneData.scout && droneData.victim) {
      const start = droneData.scout.location;
      const end = droneData.victim;
      setPathPoints(calculateAStarPath(start, end));
    } else {
      setPathPoints([]);
    }
  }, [missionActive, droneData]);

  // KML file upload handler (reads as text and parses in-browser)
  const handleKmlUpload = (ev) => {
    const file = ev?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseKML(text);
        parsed.fileName = file.name || parsed.fileName;
        setKmlData(parsed);

        // compute bounds defensively
        const b = computeBoundsFromKml(parsed);
        setKmlBounds(b);
        setKmlUploaded(true);
      } catch (err) {
        console.error('Failed to parse KML:', err);
        alert('Failed to parse KML file. Ensure it is a valid KML with coordinates.');
      }
    };
    reader.onerror = (err) => {
      console.error('FileReader error', err);
      alert('Unable to read file.');
    };
    reader.readAsText(file);
  };

  // If no KML uploaded yet -> show a nice empty placeholder + upload control
  if (!kmlUploaded) {
    return (
      <div
        className={`relative rounded-lg overflow-hidden ${
          isMainMap ? 'h-full' : 'h-[calc(100%-2rem)] bg-gray-900/50 p-3 rounded-xl'
        }`}
      >
        {isMainMap && (
          <div className="absolute top-4 left-4 z-10">
            <input
              type="file"
              accept=".kml"
              ref={fileInputRef}
              onChange={handleKmlUpload}
              className="p-2 bg-white/90 rounded-md text-sm"
            />
          </div>
        )}

        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="mb-2 text-sm font-medium">Mission map is empty</div>
            <div className="text-xs">Upload a KML to display waypoints, areas and routes — drone markers will appear after upload.</div>
            <div className="mt-4">
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="px-3 py-1 bg-cyan-600 text-white rounded-md text-sm"
              >
                Upload KML
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Satellite view available after upload — try an area KML or route KML.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- KML uploaded: build the map ---------- */
  // Choose center: first waypoint -> base -> fallback to India center
  const center =
    (kmlData?.waypoints?.[0] && [kmlData.waypoints[0].lat, kmlData.waypoints[0].lng]) ||
    (droneData?.base && [droneData.base.lat, droneData.base.lng]) ||
    [20.5937, 78.9629];

  return (
    <div
      className={`relative rounded-lg overflow-hidden ${
        isMainMap ? 'h-full' : 'h-[calc(100%-2rem)] bg-gray-900/50 p-3 rounded-xl'
      }`}
    >
      {/* file input remains available so user can replace KML */}
      {isMainMap && (
        <input
          type="file"
          accept=".kml"
          ref={fileInputRef}
          onChange={handleKmlUpload}
          className="absolute top-4 left-4 z-10 bg-white bg-opacity-80 p-2 rounded-md text-sm"
        />
      )}

      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        {/* LayersControl with Satellite & Streets - Satellite is DEFAULT (checked) */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satellite">
            <TileLayer
              // Esri World Imagery (satellite) — good quality and free for many use cases
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping"
              maxZoom={20}
              zIndex={1}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Streets">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
              maxZoom={19}
              zIndex={0}
            />
          </LayersControl.BaseLayer>

          {/* Group for KML-derived geometry so user can toggle it */}
          <LayersControl.Overlay checked name="Mission KML">
            <LayerGroup>
              {/* Fit map to KML bounds ONLY (MapBoundsUpdater checks validity) */}
              {kmlBounds && <MapBoundsUpdater bounds={kmlBounds} />}

              {/* KML Waypoints */}
              {kmlData?.waypoints?.map((w, i) => (
                <Marker key={`kml-wp-${i}`} position={[w.lat, w.lng]} icon={waypointIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>{w.name || `Waypoint ${i + 1}`}</strong>
                      <br />
                      <span className="text-xs text-gray-600">{w.lat.toFixed(6)}, {w.lng.toFixed(6)}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* KML areas & routes */}
              {kmlData?.coordinates?.map((item, idx) => {
                if (item.type === 'area' && item.area) {
                  const positions = item.area.map((p) => [p.lat, p.lng]);
                  return (
                    <Polygon
                      key={`kml-area-${idx}`}
                      positions={positions}
                      color="#06b6d4"
                      weight={3}
                      opacity={0.9}
                      fillColor="#06b6d4"
                      fillOpacity={0.12}
                      dashArray="8,8"
                    />
                  );
                }

                if (item.type === 'route' && item.path) {
                  const positions = item.path.map((p) => [p.lat, p.lng]);
                  return (
                    <Polyline
                      key={`kml-route-${idx}`}
                      positions={positions}
                      color="#06b6d4"
                      weight={4}
                      opacity={0.95}
                      dashArray="12,12"
                    />
                  );
                }

                return null;
              })}
            </LayerGroup>
          </LayersControl.Overlay>

          {/* Drone markers overlay so user can toggle them */}
          <LayersControl.Overlay checked name="Drone Markers">
            <LayerGroup>
              {/* Base station */}
              {droneData?.base && (
                <Marker position={[droneData.base.lat, droneData.base.lng]} icon={baseIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Base Station</strong>
                      <br />
                      <span className="text-xs text-gray-600">{droneData.base.lat.toFixed(6)}, {droneData.base.lng.toFixed(6)}</span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Scout */}
              {droneData?.scout?.location && (
                <Marker position={[droneData.scout.location.lat, droneData.scout.location.lng]} icon={scoutIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Scout Drone</strong><br />
                      <span className="text-sm">Battery: {droneData.scout.battery ?? 'N/A'}%</span><br />
                      <span className="text-xs text-gray-600">{droneData.scout.location.lat.toFixed(6)}, {droneData.scout.location.lng.toFixed(6)}</span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Delivery */}
              {droneData?.delivery?.location && (
                <Marker position={[droneData.delivery.location.lat, droneData.delivery.location.lng]} icon={deliveryIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Delivery Drone</strong><br />
                      <span className="text-sm">Battery: {droneData.delivery.battery ?? 'N/A'}%</span><br />
                      <span className="text-xs text-gray-600">{droneData.delivery.location.lat.toFixed(6)}, {droneData.delivery.location.lng.toFixed(6)}</span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Victim (if exists) */}
              {droneData?.victim && (
                <Marker position={[droneData.victim.lat, droneData.victim.lng]} icon={victimIcon}>
                  <Popup>
                    <div className="text-center"><strong>Victim</strong><br />
                      <span className="text-xs text-gray-600">{droneData.victim.lat.toFixed(6)}, {droneData.victim.lng.toFixed(6)}</span>
                    </div>
                  </Popup>
                </Marker>
              )}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>

        {/* A* simulated path line */}
        {missionActive && pathPoints.length > 1 && (
          <Polyline positions={pathPoints} color="#60a5fa" weight={3} opacity={0.85} dashArray="10,10" />
        )}
      </MapContainer>

      {/* Overlays on top of the map (UI elements) */}
      {isMainMap && kmlData && (
        <div className="absolute top-4 right-4 bg-cyan-900/90 backdrop-blur-sm rounded-lg p-3 z-10">
          <div className="flex items-center text-cyan-400">
            <Route className="w-4 h-4 mr-2" />
            <div>
              <div className="text-sm font-semibold">{kmlData.fileName || 'KML File'}</div>
              <div className="text-xs text-cyan-300">{kmlData.waypoints?.length || 0} waypoints • {kmlData.coordinates?.length || 0} features</div>
            </div>
          </div>
        </div>
      )}

      {isMainMap && missionActive && (
        <div className="absolute top-4 left-4 bg-green-900/90 backdrop-blur-sm rounded-lg p-3 z-10">
          <div className="flex items-center text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-semibold">MISSION ACTIVE</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionMap;
