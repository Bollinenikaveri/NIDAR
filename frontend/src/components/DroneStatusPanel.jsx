// import React, { useState, useEffect } from 'react';
// import { Navigation, Battery, Gauge, MapPin, Target, Zap, Signal, Compass } from 'lucide-react';

// const DroneStatusPanel = ({ droneData, missionActive }) => {
//   const [currentStatus, setCurrentStatus] = useState('Standby');

//   useEffect(() => {
//     if (missionActive && droneData) {
//       const statuses = [
//         'Moving to target location...',
//         'Scanning search area...',
//         'Victim detected - confirming...',
//         'Deploying medical kit...',
//         'Returning to base...',
//         'Adjusting flight path...',
//         'Weather analysis in progress...',
//         'Signal strength optimal...'
//       ];
      
//       const interval = setInterval(() => {
//         setCurrentStatus(statuses[Math.floor(Math.random() * statuses.length)]);
//       }, 4000);
      
//       return () => clearInterval(interval);
//     } else {
//       setCurrentStatus('Standby - Awaiting mission start');
//     }
//   }, [missionActive, droneData]);

//   if (!droneData) return null;

//   return (
//     <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full flex flex-col">
//       <h3 className="text-sm font-semibold mb-4 text-blue-400">Drone Operations Status</h3>
      
//       {/* Current Mission Status */}
//       <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
//         <div className="flex items-center mb-2">
//           <div className={`w-2 h-2 rounded-full mr-2 ${missionActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
//           <span className="text-xs font-semibold text-gray-300">Mission Status</span>
//         </div>
//         <p className="text-sm text-white font-medium">{currentStatus}</p>
//       </div>

//       {/* Scout Drone Details */}
//       <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
//         <div className="flex items-center justify-between mb-2">
//           <h4 className="text-sm font-semibold text-green-400">Scout Drone</h4>
//           <div className={`w-2 h-2 rounded-full ${droneData.scout.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
//         </div>
        
//         <div className="space-y-2 text-xs">
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <Battery className="w-3 h-3 mr-1" />
//               Battery
//             </span>
//             <span className={`font-semibold ${droneData.scout.battery > 50 ? 'text-green-400' : 'text-orange-400'}`}>
//               {droneData.scout.battery}%
//             </span>
//           </div>
          
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <Gauge className="w-3 h-3 mr-1" />
//               Altitude
//             </span>
//             <span className="text-white font-semibold">{droneData.scout.altitude}m</span>
//           </div>
          
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <Zap className="w-3 h-3 mr-1" />
//               Speed
//             </span>
//             <span className="text-white font-semibold">{droneData.scout.speed} km/h</span>
//           </div>
          
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <Compass className="w-3 h-3 mr-1" />
//               Heading
//             </span>
//             <span className="text-cyan-300 font-semibold">{droneData.scout.heading}°</span>
//           </div>
          
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <MapPin className="w-3 h-3 mr-1" />
//               Location
//             </span>
//             <span className="text-cyan-300 font-mono text-xs">
//               {droneData.scout.location.lat.toFixed(4)}, {droneData.scout.location.lng.toFixed(4)}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Delivery Drone Details */}
//       <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
//         <div className="flex items-center justify-between mb-2">
//           <h4 className="text-sm font-semibold text-orange-400">Delivery Drone</h4>
//           <div className={`w-2 h-2 rounded-full ${droneData.delivery.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
//         </div>
        
//         <div className="space-y-2 text-xs">
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <Battery className="w-3 h-3 mr-1" />
//               Battery
//             </span>
//             <span className={`font-semibold ${droneData.delivery.battery > 50 ? 'text-green-400' : 'text-orange-400'}`}>
//               {droneData.delivery.battery}%
//             </span>
//           </div>
          
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <Gauge className="w-3 h-3 mr-1" />
//               Altitude
//             </span>
//             <span className="text-white font-semibold">{droneData.delivery.altitude}m</span>
//           </div>
          
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <Zap className="w-3 h-3 mr-1" />
//               Speed
//             </span>
//             <span className="text-white font-semibold">{droneData.delivery.speed} km/h</span>
//           </div>
          
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <Compass className="w-3 h-3 mr-1" />
//               Heading
//             </span>
//             <span className="text-cyan-300 font-semibold">{droneData.delivery.heading}°</span>
//           </div>
          
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <Target className="w-3 h-3 mr-1" />
//               Payload
//             </span>
//             <span className={`font-semibold ${droneData.delivery.payload === 'Empty' ? 'text-gray-400' : 'text-green-400'}`}>
//               {droneData.delivery.payload}
//             </span>
//           </div>
          
//           <div className="flex items-center justify-between">
//             <span className="text-gray-400 flex items-center">
//               <MapPin className="w-3 h-3 mr-1" />
//               Location
//             </span>
//             <span className="text-cyan-300 font-mono text-xs">
//               {droneData.delivery.location.lat.toFixed(4)}, {droneData.delivery.location.lng.toFixed(4)}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Network Status */}
//       <div className="mt-auto">
//         <div className="bg-gray-800/50 rounded-lg p-2">
//           <div className="flex items-center justify-between text-xs">
//             <span className="text-gray-400 flex items-center">
//               <Signal className="w-3 h-3 mr-1" />
//               Network
//             </span>
//             <div className="flex space-x-2">
//               <div className={`w-2 h-2 rounded-full ${droneData.scout.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
//               <div className={`w-2 h-2 rounded-full ${droneData.delivery.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
//               <div className="w-2 h-2 rounded-full bg-green-500"></div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DroneStatusPanel;
import React, { useState, useEffect } from 'react';
import { Navigation, Battery, Gauge, MapPin, Target, Zap, Signal, Compass } from 'lucide-react';

const DroneStatusPanel = ({ droneData, missionActive }) => {
  const [currentStatus, setCurrentStatus] = useState('Standby');

  useEffect(() => {
    if (missionActive && droneData) {
      const statuses = [
        'Moving to target location...',
        'Scanning search area...',
        'Victim detected - confirming...',
        'Deploying medical kit...',
        'Returning to base...',
        'Adjusting flight path...',
        'Weather analysis in progress...',
        'Signal strength optimal...'
      ];
      
      const interval = setInterval(() => {
        setCurrentStatus(statuses[Math.floor(Math.random() * statuses.length)]);
      }, 4000);
      
      return () => clearInterval(interval);
    } else {
      setCurrentStatus('Standby - Awaiting mission start');
    }
  }, [missionActive, droneData]);

  if (!droneData) return null;

  // --- Helper constants for "nil" state ---
  const NIL_NUM = 0;
  const NIL_LOC = '---';
  const NIL_PAYLOAD = 'Empty';

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold mb-4 text-blue-400">Drone Operations Status</h3>
      
      {/* Current Mission Status */}
      <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
        <div className="flex items-center mb-2">
          <div className={`w-2 h-2 rounded-full mr-2 ${missionActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className="text-xs font-semibold text-gray-300">Mission Status</span>
        </div>
        <p className="text-sm text-white font-medium">{currentStatus}</p>
      </div>

      {/* Scout Drone Details */}
      <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-green-400">Scout Drone</h4>
          <div className={`w-2 h-2 rounded-full ${droneData.scout.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Battery className="w-3 h-3 mr-1" />
              Battery
            </span>
            <span className={`font-semibold ${
              missionActive 
                ? (droneData.scout.battery > 50 ? 'text-green-400' : 'text-orange-400') 
                : 'text-gray-400'
            }`}>
              {missionActive ? droneData.scout.battery : NIL_NUM}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Gauge className="w-3 h-3 mr-1" />
              Altitude
            </span>
            <span className="text-white font-semibold">
              {missionActive ? droneData.scout.altitude : NIL_NUM}m
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              Speed
            </span>
            <span className="text-white font-semibold">
              {missionActive ? droneData.scout.speed : NIL_NUM} km/h
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Compass className="w-3 h-3 mr-1" />
              Heading
            </span>
            <span className="text-cyan-300 font-semibold">
              {missionActive ? droneData.scout.heading : NIL_NUM}°
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              Location
            </span>
            <span className="text-cyan-300 font-mono text-xs">
              {missionActive 
                ? `${droneData.scout.location.lat.toFixed(4)}, ${droneData.scout.location.lng.toFixed(4)}`
                : NIL_LOC
              }
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Drone Details */}
      <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-orange-400">Delivery Drone</h4>
          <div className={`w-2 h-2 rounded-full ${droneData.delivery.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Battery className="w-3 h-3 mr-1" />
              Battery
            </span>
            <span className={`font-semibold ${
              missionActive 
                ? (droneData.delivery.battery > 50 ? 'text-green-400' : 'text-orange-400') 
                : 'text-gray-400'
            }`}>
              {missionActive ? droneData.delivery.battery : NIL_NUM}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Gauge className="w-3 h-3 mr-1" />
              Altitude
            </span>
            <span className="text-white font-semibold">
              {missionActive ? droneData.delivery.altitude : NIL_NUM}m
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              Speed
            </span>
            <span className="text-white font-semibold">
              {missionActive ? droneData.delivery.speed : NIL_NUM} km/h
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Compass className="w-3 h-3 mr-1" />
              Heading
            </span>
            <span className="text-cyan-300 font-semibold">
              {missionActive ? droneData.delivery.heading : NIL_NUM}°
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Target className="w-3 h-3 mr-1" />
              Payload
            </span>
            <span className={`font-semibold ${
              missionActive && droneData.delivery.payload !== 'Empty'
                ? 'text-green-400'
                : 'text-gray-400'
            }`}>
              {missionActive ? droneData.delivery.payload : NIL_PAYLOAD}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              Location
            </span>
            <span className="text-cyan-300 font-mono text-xs">
              {missionActive 
                ? `${droneData.delivery.location.lat.toFixed(4)}, ${droneData.delivery.location.lng.toFixed(4)}`
                : NIL_LOC
              }
            </span>
          </div>
        </div>
      </div>

      {/* Network Status */}
      <div className="mt-auto">
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center">
              <Signal className="w-3 h-3 mr-1" />
              Network
            </span>
            {/* Connection status dots are independent of mission status, so they remain unchanged */}
            <div className="flex space-x-2">
              <div className={`w-2 h-2 rounded-full ${droneData.scout.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className={`w-2 h-2 rounded-full ${droneData.delivery.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneStatusPanel;