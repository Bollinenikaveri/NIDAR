import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Target, Home, Flag, Route } from 'lucide-react';

// Simple map component (we'll replace with Leaflet later)
const MissionMap = ({ droneData, missionActive, isMainMap = false, kmlData }) => {
  const [pathPoints, setPathPoints] = useState([]);
  const mapRef = useRef(null);

  const getRelativePosition = (location, baseLocation) => {
    if (!location || !baseLocation) return { x: 50, y: 50 };
    
    // Use a much larger scaling factor to make the positions more visible
    const scale = 100000; // Increased from 10000 to 100000
    const deltaLng = (location.lng - baseLocation.lng) * scale;
    const deltaLat = (location.lat - baseLocation.lat) * scale;
    
    return {
      x: Math.max(5, Math.min(95, 50 + deltaLng)), // Constrain to 5-95% to keep within bounds
      y: Math.max(5, Math.min(95, 50 + deltaLat))
    };
  };

  const calculateAStarPath = (start, end, baseLocation) => {
    const path = [];
    const steps = 8;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const lat = start.lat + (end.lat - start.lat) * progress;
      const lng = start.lng + (end.lng - start.lng) * progress;
      
      // Add some realistic curve
      const offset = Math.sin(progress * Math.PI) * 0.002;
      const pathPoint = {
        lat: lat + offset,
        lng: lng + offset
      };
      
      // Use the same coordinate system as other elements
      const pos = getRelativePosition(pathPoint, baseLocation);
      path.push(pos);
    }
    return path;
  };

  useEffect(() => {
    if (missionActive && droneData) {
      // Simulate A* pathfinding
      const path = calculateAStarPath(droneData.scout.location, droneData.victim, droneData.base);
      setPathPoints(path);
    }
  }, [missionActive, droneData]);

  if (!droneData) return null;

  const scoutPos = getRelativePosition(droneData.scout.location, droneData.base);
  const deliveryPos = getRelativePosition(droneData.delivery.location, droneData.base);
  const victimPos = getRelativePosition(droneData.victim, droneData.base);
  const basePos = { x: 50, y: 50 };

  return (
    <div className={`${isMainMap ? 'h-full' : 'bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 h-full'}`}>
      {!isMainMap && <h3 className="text-sm font-semibold mb-2 text-blue-400">Tactical Map</h3>}
      
      <div 
        ref={mapRef}
        className={`relative bg-gray-800 rounded-lg overflow-hidden ${isMainMap ? 'h-full' : 'h-[calc(100%-2rem)]'}`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #1f2937 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, #374151 0%, transparent 50%),
            linear-gradient(45deg, #111827 25%, transparent 25%, transparent 75%, #111827 75%),
            linear-gradient(-45deg, #111827 25%, transparent 25%, transparent 75%, #111827 75%)
          `,
          backgroundSize: '40px 40px, 40px 40px, 20px 20px, 20px 20px'
        }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* A* Path */}
        {missionActive && pathPoints.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path
              d={`M ${pathPoints.map(p => `${p.x}% ${p.y}%`).join(' L ')}`}
              stroke="#60a5fa"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
          </svg>
        )}

        {/* KML Waypoints */}
        {kmlData && kmlData.waypoints && kmlData.waypoints.map((waypoint, index) => {
          const waypointPos = getRelativePosition(waypoint, droneData.base);
          return (
            <div 
              key={`waypoint-${index}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-15"
              style={{ left: `${waypointPos.x}%`, top: `${waypointPos.y}%` }}
            >
              <div className="relative">
                <Flag className="w-5 h-5 text-cyan-400" />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-cyan-400 whitespace-nowrap">
                  {waypoint.name}
                </div>
                <div className="absolute inset-0 bg-cyan-400/30 rounded-full animate-ping scale-150"></div>
              </div>
            </div>
          );
        })}

        {/* KML Areas */}
        {kmlData && kmlData.coordinates && kmlData.coordinates.map((item, index) => {
          if (item.type === 'area' && item.area) {
            const areaPoints = item.area.map(point => getRelativePosition(point, droneData.base));
            const pathString = areaPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
            
            return (
              <svg key={`area-${index}`} className="absolute inset-0 w-full h-full pointer-events-none">
                <path
                  d={pathString}
                  stroke="#06b6d4"
                  strokeWidth="3"
                  fill="rgba(6, 182, 212, 0.2)"
                  strokeDasharray="5,5"
                />
              </svg>
            );
          }

          if (item.type === 'route' && item.path) {
            const routePoints = item.path.map(point => getRelativePosition(point, droneData.base));
            const pathString = routePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            
            return (
              <svg key={`route-${index}`} className="absolute inset-0 w-full h-full pointer-events-none">
                <path
                  d={pathString}
                  stroke="#06b6d4"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="8,8"
                />
              </svg>
            );
          }

          return null;
        })}

        {/* Base Station */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${basePos.x}%`, top: `${basePos.y}%` }}
        >
          <div className="relative">
            <Home className="w-6 h-6 text-blue-400" />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-blue-400 whitespace-nowrap">
              Base
            </div>
            <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping scale-150"></div>
          </div>
        </div>

        {/* Scout Drone */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: `${scoutPos.x}%`, top: `${scoutPos.y}%` }}
        >
          <div className="relative">
            <div 
              className={`w-4 h-4 rounded-full ${droneData.scout.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
              style={{ transform: `rotate(${droneData.scout.heading}deg)` }}
            >
              <Navigation className="w-3 h-3 text-white absolute inset-0.5" />
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-green-400 whitespace-nowrap">
              Scout {droneData.scout.battery}%
            </div>
            {droneData.scout.connected && (
              <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping scale-200"></div>
            )}
          </div>
        </div>

        {/* Delivery Drone */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: `${deliveryPos.x}%`, top: `${deliveryPos.y}%` }}
        >
          <div className="relative">
            <div 
              className={`w-4 h-4 rounded-full ${droneData.delivery.connected ? 'bg-orange-500' : 'bg-red-500'} animate-pulse`}
              style={{ transform: `rotate(${droneData.delivery.heading}deg)` }}
            >
              <Navigation className="w-3 h-3 text-white absolute inset-0.5" />
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-orange-400 whitespace-nowrap">
              Delivery {droneData.delivery.battery}%
            </div>
            {droneData.delivery.connected && (
              <div className="absolute inset-0 bg-orange-400/20 rounded-full animate-ping scale-200"></div>
            )}
          </div>
        </div>

        {/* Victim Location */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-15"
          style={{ left: `${victimPos.x}%`, top: `${victimPos.y}%` }}
        >
          <div className="relative">
            <Target className="w-6 h-6 text-red-500 animate-pulse" />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-red-400 whitespace-nowrap">
              Victim
            </div>
            <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping scale-150"></div>
          </div>
        </div>

        {/* Coordinates Display */}
        {isMainMap && (
          <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 text-xs">
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

        {/* Mission Status */}
        {isMainMap && missionActive && (
          <div className="absolute top-4 left-4 bg-green-900/90 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-semibold">A* PATH ACTIVE</span>
            </div>
          </div>
        )}

        {/* KML Status */}
        {isMainMap && kmlData && (
          <div className="absolute top-4 right-4 bg-cyan-900/90 backdrop-blur-sm rounded-lg p-3">
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
      </div>
    </div>
  );
};

export default MissionMap;