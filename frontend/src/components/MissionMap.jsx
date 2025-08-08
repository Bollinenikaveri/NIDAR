// frontend/src/components/MissionMap.jsx
import React, { useEffect, useState } from 'react';
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

/* ---------- Leaflet default marker fix ---------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ---------- Custom div icons ---------- */
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

/* ---------- Map bounds updater ---------- */
const MapBoundsUpdater = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !bounds) return;
    try {
      if (typeof bounds.isValid === 'function') {
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [24, 24] });
        }
      } else {
        const b = L.latLngBounds(bounds);
        if (b.isValid()) map.fitBounds(b, { padding: [24, 24] });
      }
    } catch (err) {
      // ignore invalid bounds errors
    }
  }, [bounds, map]);
  return null;
};

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

/* ---------- A* path simulator ---------- */
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
const MissionMap = ({ droneData, missionActive, isMainMap = false, kmlData }) => {
  const [kmlBounds, setKmlBounds] = useState(null);
  const [pathPoints, setPathPoints] = useState([]);

  useEffect(() => {
    if (missionActive && droneData?.scout?.location && droneData?.victim) {
      const start = droneData.scout.location;
      const end = droneData.victim;
      setPathPoints(calculateAStarPath(start, end));
    } else {
      setPathPoints([]);
    }
  }, [missionActive, droneData]);

  useEffect(() => {
    const b = computeBoundsFromKml(kmlData);
    setKmlBounds(b);
  }, [kmlData]);

  // Choose center: first waypoint -> base -> fallback to India center
  const center =
    (kmlData?.waypoints?.[0] && [kmlData.waypoints[0].lat, kmlData.waypoints[0].lng]) ||
    (droneData?.base && [droneData.base.lat, droneData.base.lng]) ||
    [20.5937, 78.9629];

  // If no KML data, show empty placeholder UI
  if (!kmlData) {
    return (
      <div
        className={`relative rounded-lg overflow-hidden ${
          isMainMap ? 'h-full' : 'h-[calc(100%-2rem)] bg-gray-900/50 p-3 rounded-xl'
        }`}
      >
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="mb-2 text-sm font-medium">Mission map is empty</div>
            <div className="text-xs">
              Upload a KML to display waypoints, areas and routes — drone markers will appear after upload.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden ${
        isMainMap ? 'h-full' : 'h-[calc(100%-2rem)] bg-gray-900/50 p-3 rounded-xl'
      }`}
    >
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satellite">
            <TileLayer
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

          <LayersControl.Overlay checked name="Mission KML">
            <LayerGroup>
              {kmlBounds && <MapBoundsUpdater bounds={kmlBounds} />}

              {/* Waypoints */}
              {kmlData.waypoints?.map((w, i) => (
                <Marker key={`kml-wp-${i}`} position={[w.lat, w.lng]} icon={waypointIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>{w.name || `Waypoint ${i + 1}`}</strong>
                      <br />
                      <span className="text-xs text-gray-600">
                        {w.lat.toFixed(6)}, {w.lng.toFixed(6)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Areas and routes */}
              {kmlData.coordinates?.map((item, idx) => {
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

          <LayersControl.Overlay checked name="Drone Markers">
            <LayerGroup>
              {droneData?.base && (
                <Marker position={[droneData.base.lat, droneData.base.lng]} icon={baseIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Base Station</strong>
                      <br />
                      <span className="text-xs text-gray-600">
                        {droneData.base.lat.toFixed(6)}, {droneData.base.lng.toFixed(6)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {droneData?.scout?.location && (
                <Marker position={[droneData.scout.location.lat, droneData.scout.location.lng]} icon={scoutIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Scout Drone</strong>
                      <br />
                      <span className="text-sm">Battery: {droneData.scout.battery ?? 'N/A'}%</span>
                      <br />
                      <span className="text-xs text-gray-600">
                        {droneData.scout.location.lat.toFixed(6)}, {droneData.scout.location.lng.toFixed(6)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {droneData?.delivery?.location && (
                <Marker position={[droneData.delivery.location.lat, droneData.delivery.location.lng]} icon={deliveryIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Delivery Drone</strong>
                      <br />
                      <span className="text-sm">Battery: {droneData.delivery.battery ?? 'N/A'}%</span>
                      <br />
                      <span className="text-xs text-gray-600">
                        {droneData.delivery.location.lat.toFixed(6)}, {droneData.delivery.location.lng.toFixed(6)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {droneData?.victim && (
                <Marker position={[droneData.victim.lat, droneData.victim.lng]} icon={victimIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Victim</strong>
                      <br />
                      <span className="text-xs text-gray-600">
                        {droneData.victim.lat.toFixed(6)}, {droneData.victim.lng.toFixed(6)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              )}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>

        {missionActive && pathPoints.length > 1 && (
          <Polyline positions={pathPoints} color="#60a5fa" weight={3} opacity={0.85} dashArray="10,10" />
        )}
      </MapContainer>

      {isMainMap && kmlData && (
        <div className="absolute top-4 right-4 bg-cyan-900/90 backdrop-blur-sm rounded-lg p-3 z-10">
          <div className="flex items-center text-cyan-400">
            <Route className="w-4 h-4 mr-2" />
            <div>
              <div className="text-sm font-semibold">{kmlData.fileName || 'KML File'}</div>
              <div className="text-xs text-cyan-300">
                {kmlData.waypoints?.length || 0} waypoints • {kmlData.coordinates?.length || 0} features
              </div>
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
