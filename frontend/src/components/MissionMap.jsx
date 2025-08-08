import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Target, Home, Flag, Route } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different markers
const createCustomIcon = (color, iconComponent) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
        ${iconComponent}
      </svg>
    </div>`,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const scoutIcon = createCustomIcon('#10b981', '<circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>');
const deliveryIcon = createCustomIcon('#f59e0b', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 9h6v6H9z"/>');
const victimIcon = createCustomIcon('#ef4444', '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6m0-6l6 6"/>');
const baseIcon = createCustomIcon('#3b82f6', '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>');
const waypointIcon = createCustomIcon('#06b6d4', '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>');

// Component to fit map bounds when KML data changes
const MapBoundsUpdater = ({ kmlData, droneData }) => {
  const map = useMap();

  useEffect(() => {
    if (kmlData || droneData) {
      const bounds = L.latLngBounds([]);
      
      // Add drone locations to bounds
      if (droneData) {
        bounds.extend([droneData.scout.location.lat, droneData.scout.location.lng]);
        bounds.extend([droneData.delivery.location.lat, droneData.delivery.location.lng]);
        bounds.extend([droneData.victim.lat, droneData.victim.lng]);
        bounds.extend([droneData.base.lat, droneData.base.lng]);
      }

      // Add KML data to bounds
      if (kmlData) {
        if (kmlData.waypoints) {
          kmlData.waypoints.forEach(waypoint => {
            bounds.extend([waypoint.lat, waypoint.lng]);
          });
        }
        if (kmlData.coordinates) {
          kmlData.coordinates.forEach(item => {
            if (item.type === 'area' && item.area) {
              item.area.forEach(point => {
                bounds.extend([point.lat, point.lng]);
              });
            }
            if (item.type === 'route' && item.path) {
              item.path.forEach(point => {
                bounds.extend([point.lat, point.lng]);
              });
            }
          });
        }
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [kmlData, droneData, map]);

  return null;
};

const MissionMap = ({ droneData, missionActive, isMainMap = false, kmlData }) => {
  const [pathPoints, setPathPoints] = useState([]);

  const calculateAStarPath = (start, end) => {
    const path = [];
    const steps = 8;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const lat = start.lat + (end.lat - start.lat) * progress;
      const lng = start.lng + (end.lng - start.lng) * progress;
      
      // Add some realistic curve
      const offset = Math.sin(progress * Math.PI) * 0.002;
      const pathPoint = [lat + offset, lng + offset];
      path.push(pathPoint);
    }
    return path;
  };

  useEffect(() => {
    if (missionActive && droneData) {
      // Simulate A* pathfinding
      const path = calculateAStarPath(droneData.scout.location, droneData.victim);
      setPathPoints(path);
    }
  }, [missionActive, droneData]);

  if (!droneData) return null;

  // Default center point (San Francisco)
  const defaultCenter = [37.7749, -122.4194];
  const mapCenter = droneData.base ? [droneData.base.lat, droneData.base.lng] : defaultCenter;

  return (
    <div className={`${isMainMap ? 'h-full' : 'bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 h-full'}`}>
      {!isMainMap && <h3 className="text-sm font-semibold mb-2 text-blue-400">Tactical Map</h3>}
      
      <div className={`relative rounded-lg overflow-hidden ${isMainMap ? 'h-full' : 'h-[calc(100%-2rem)]'}`}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          {/* Base tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Satellite tile layer (optional - you can switch between them) */}
          {/* <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          /> */}

          {/* Update map bounds when data changes */}
          <MapBoundsUpdater kmlData={kmlData} droneData={droneData} />

          {/* Base Station Marker */}
          <Marker position={[droneData.base.lat, droneData.base.lng]} icon={baseIcon}>
            <Popup>
              <div className="text-center">
                <strong>Base Station</strong><br />
                <span className="text-sm text-gray-600">
                  {droneData.base.lat.toFixed(6)}, {droneData.base.lng.toFixed(6)}
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Scout Drone Marker */}
          <Marker position={[droneData.scout.location.lat, droneData.scout.location.lng]} icon={scoutIcon}>
            <Popup>
              <div className="text-center">
                <strong>Scout Drone</strong><br />
                <span className="text-sm">Battery: {droneData.scout.battery}%</span><br />
                <span className="text-sm">Altitude: {droneData.scout.altitude}m</span><br />
                <span className="text-sm">Speed: {droneData.scout.speed} km/h</span><br />
                <span className="text-xs text-gray-600">
                  {droneData.scout.location.lat.toFixed(6)}, {droneData.scout.location.lng.toFixed(6)}
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Delivery Drone Marker */}
          <Marker position={[droneData.delivery.location.lat, droneData.delivery.location.lng]} icon={deliveryIcon}>
            <Popup>
              <div className="text-center">
                <strong>Delivery Drone</strong><br />
                <span className="text-sm">Battery: {droneData.delivery.battery}%</span><br />
                <span className="text-sm">Payload: {droneData.delivery.payload}</span><br />
                <span className="text-sm">Altitude: {droneData.delivery.altitude}m</span><br />
                <span className="text-xs text-gray-600">
                  {droneData.delivery.location.lat.toFixed(6)}, {droneData.delivery.location.lng.toFixed(6)}
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Victim Location Marker */}
          <Marker position={[droneData.victim.lat, droneData.victim.lng]} icon={victimIcon}>
            <Popup>
              <div className="text-center">
                <strong>Victim Location</strong><br />
                <span className="text-xs text-gray-600">
                  {droneData.victim.lat.toFixed(6)}, {droneData.victim.lng.toFixed(6)}
                </span>
              </div>
            </Popup>
          </Marker>

          {/* A* Path */}
          {missionActive && pathPoints.length > 1 && (
            <Polyline
              positions={pathPoints}
              color="#60a5fa"
              weight={3}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}

          {/* KML Waypoints */}
          {kmlData && kmlData.waypoints && kmlData.waypoints.map((waypoint, index) => (
            <Marker key={`waypoint-${index}`} position={[waypoint.lat, waypoint.lng]} icon={waypointIcon}>
              <Popup>
                <div className="text-center">
                  <strong>{waypoint.name}</strong><br />
                  <span className="text-xs text-gray-600">
                    {waypoint.lat.toFixed(6)}, {waypoint.lng.toFixed(6)}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* KML Areas and Routes */}
          {kmlData && kmlData.coordinates && kmlData.coordinates.map((item, index) => {
            if (item.type === 'area' && item.area) {
              const positions = item.area.map(point => [point.lat, point.lng]);
              return (
                <Polygon
                  key={`area-${index}`}
                  positions={positions}
                  color="#06b6d4"
                  weight={3}
                  opacity={0.8}
                  fillColor="#06b6d4"
                  fillOpacity={0.2}
                  dashArray="8, 8"
                />
              );
            }

            if (item.type === 'route' && item.path) {
              const positions = item.path.map(point => [point.lat, point.lng]);
              return (
                <Polyline
                  key={`route-${index}`}
                  positions={positions}
                  color="#06b6d4"
                  weight={4}
                  opacity={0.8}
                  dashArray="12, 12"
                />
              );
            }

            return null;
          })}
        </MapContainer>

        {/* Mission Status Overlay */}
        {isMainMap && missionActive && (
          <div className="absolute top-4 left-4 bg-green-900/90 backdrop-blur-sm rounded-lg p-3 z-10">
            <div className="flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-semibold">MISSION ACTIVE</span>
            </div>
          </div>
        )}

        {/* KML Status Overlay */}
        {isMainMap && kmlData && (
          <div className="absolute top-4 right-4 bg-cyan-900/90 backdrop-blur-sm rounded-lg p-3 z-10">
            <div className="flex items-center text-cyan-400">
              <Route className="w-4 h-4 mr-2" />
              <div>
                <div className="text-sm font-semibold">{kmlData.fileName}</div>
                <div className="text-xs text-cyan-300">
                  {kmlData.waypoints?.length || 0} waypoints • {kmlData.coordinates?.length || 0} features
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coordinates Display */}
        {isMainMap && (
          <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 text-xs z-10 max-w-sm">
            <div className="text-gray-400 mb-1">Live Coordinates</div>
            <div className="text-green-400">Scout: {droneData.scout.location.lat.toFixed(6)}, {droneData.scout.location.lng.toFixed(6)}</div>
            <div className="text-orange-400">Delivery: {droneData.delivery.location.lat.toFixed(6)}, {droneData.delivery.location.lng.toFixed(6)}</div>
            <div className="text-red-400">Victim: {droneData.victim.lat.toFixed(6)}, {droneData.victim.lng.toFixed(6)}</div>
            
            {kmlData && kmlData.waypoints && kmlData.waypoints.length > 0 && (
              <>
                <div className="text-gray-400 mt-2 mb-1">KML Waypoints</div>
                {kmlData.waypoints.slice(0, 3).map((waypoint, index) => (
                  <div key={index} className="text-cyan-400">
                    {waypoint.name}: {waypoint.lat.toFixed(6)}, {waypoint.lng.toFixed(6)}
                  </div>
                ))}
                {kmlData.waypoints.length > 3 && (
                  <div className="text-gray-400">... and {kmlData.waypoints.length - 3} more</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Map Controls Info */}
        {isMainMap && (
          <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-2 text-xs z-10">
            <div className="text-gray-400">Map Controls</div>
            <div className="text-white">Zoom: Mouse wheel</div>
            <div className="text-white">Pan: Click & drag</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionMap;