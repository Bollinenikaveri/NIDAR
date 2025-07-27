import React from 'react';
import { Play, Square, Clock, Target, Package, Activity, Battery, Navigation, Gauge } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

const MissionControlCard = ({ 
  missionData, 
  droneData, 
  missionActive, 
  onStartMission, 
  onAbortMission 
}) => {
  const formatElapsedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full">
      <h3 className="text-lg font-semibold mb-4 text-blue-400">Mission Control</h3>
      
      <div className="space-y-4">
        {/* Mission Info */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Mission ID</span>
            <span className="text-sm font-mono text-cyan-300">{missionData.id}</span>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Elapsed Time</span>
            <span className="text-sm font-mono text-white">
              {formatElapsedTime(missionData.elapsedTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Status</span>
            <Badge variant={missionActive ? "default" : "secondary"} className={missionActive ? "bg-green-600" : ""}>
              {missionActive ? "Active" : "Standby"}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Mission Progress</span>
              <span className="text-white">{missionData.progress}%</span>
            </div>
            <Progress value={missionData.progress} className="h-2" />
          </div>
        </div>

        {/* Mission Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3 flex items-center">
            <Target className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <div className="text-lg font-bold text-white">{missionData.victimsDetected}</div>
              <div className="text-xs text-gray-400">Victims Detected</div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3 flex items-center">
            <Package className="w-5 h-5 text-green-400 mr-2" />
            <div>
              <div className="text-lg font-bold text-white">{missionData.kitsDelivered}</div>
              <div className="text-xs text-gray-400">Kits Delivered</div>
            </div>
          </div>
        </div>

        {/* Mission Controls */}
        <div className="flex space-x-2">
          <Button 
            onClick={onStartMission}
            disabled={missionActive}
            className={`
              flex-1 transition-all duration-300
              ${missionActive 
                ? 'opacity-40 cursor-not-allowed bg-gray-600' 
                : 'bg-green-600 hover:bg-green-700 hover:scale-105'
              }
            `}
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Mission
          </Button>
          
          <Button 
            onClick={onAbortMission}
            disabled={!missionActive}
            variant="destructive"
            className={`
              flex-1 transition-all duration-300
              ${!missionActive 
                ? 'opacity-40 cursor-not-allowed' 
                : 'hover:scale-105'
              }
            `}
            size="sm"
          >
            <Square className="w-4 h-4 mr-2" />
            Abort Mission
          </Button>
        </div>

        {/* Drone Statistics */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-400 mb-3">Drone Telemetry</h4>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <Activity className="w-3 h-3 mr-1" />
                Active Drones
              </span>
              <span className="text-white font-semibold">{droneData.activeDrones}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <Battery className="w-3 h-3 mr-1" />
                Avg Battery
              </span>
              <span className={`font-semibold ${droneData.avgBattery > 50 ? 'text-green-400' : 'text-orange-400'}`}>
                {droneData.avgBattery}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <Navigation className="w-3 h-3 mr-1" />
                Distance
              </span>
              <span className="text-white font-semibold">{droneData.totalDistance} km</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                ETA
              </span>
              <span className="text-cyan-300 font-semibold">{droneData.eta} min</span>
            </div>
          </div>

          {/* Individual Drone Status */}
          <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-400">Scout Drone</span>
              <div className="flex items-center space-x-2">
                <span className="text-white">{droneData.scout.battery}%</span>
                <span className="text-gray-400">{droneData.scout.altitude}m</span>
                <div className={`w-2 h-2 rounded-full ${droneData.scout.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-400">Delivery Drone</span>
              <div className="flex items-center space-x-2">
                <span className="text-white">{droneData.delivery.battery}%</span>
                <span className="text-gray-400">{droneData.delivery.altitude}m</span>
                <div className={`w-2 h-2 rounded-full ${droneData.delivery.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionControlCard;