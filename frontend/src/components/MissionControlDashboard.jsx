import React, { useState, useEffect } from 'react';
import Header from './Header';
import MissionMap from './MissionMap';
import LiveFeed from './LiveFeed';
import MissionControlCard from './MissionControlCard';
import AlertsSection from './AlertsSection';
import DroneStatusPanel from './DroneStatusPanel';
import { mockDataService } from '../services/mockDataService';

const MissionControlDashboard = () => {
  const [missionData, setMissionData] = useState(mockDataService.getMissionData());
  const [droneData, setDroneData] = useState(mockDataService.getDroneData());
  const [alerts, setAlerts] = useState(mockDataService.getAlerts());
  const [selectedFeed, setSelectedFeed] = useState('scout');
  const [missionActive, setMissionActive] = useState(false);
  const [kmlFile, setKmlFile] = useState(null);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setDroneData(mockDataService.getDroneData());
      setMissionData(mockDataService.getMissionData());
      
      // Occasionally add new alerts
      if (Math.random() > 0.8) {
        setAlerts(prev => [mockDataService.generateAlert(), ...prev.slice(0, 4)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleStartMission = () => {
    setMissionActive(true);
    // Add mission started alert
    setAlerts(prev => [mockDataService.generateAlert('Mission Started', 'HIGH'), ...prev.slice(0, 4)]);
  };

  const handleAbortMission = () => {
    setMissionActive(false);
    // Add mission aborted alert
    setAlerts(prev => [mockDataService.generateAlert('Mission Aborted', 'HIGH'), ...prev.slice(0, 4)]);
  };

  const handleClearAlerts = () => {
    setAlerts([]);
  };

  const handleMarkAllRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const handleKMLUpload = (file) => {
    setKmlFile(file);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Main Dashboard Grid */}
        <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
          {/* Left Panel */}
          <div className="col-span-3 flex flex-col gap-4 min-h-0">
            {/* Live Feed */}
            <div className="h-64">
              <LiveFeed 
                selectedFeed={selectedFeed}
                setSelectedFeed={setSelectedFeed}
                droneData={droneData}
              />
            </div>
            
            {/* Drone Status Panel */}
            <div className="flex-1 min-h-0">
              <DroneStatusPanel 
                droneData={droneData}
                missionActive={missionActive}
              />
            </div>
          </div>
          
          {/* Center - Main Map */}
          <div className="col-span-6 min-h-0">
            <div className="h-full bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Mission Area Overview</h3>
              <div className="h-[calc(100%-2rem)] bg-gray-800 rounded-lg relative overflow-hidden">
                <MissionMap 
                  droneData={droneData}
                  missionActive={missionActive}
                  isMainMap={true}
                />
              </div>
            </div>
          </div>
          
          {/* Right Panel */}
          <div className="col-span-3 flex flex-col gap-4 min-h-0">
            {/* Mission Control with KML Upload */}
            <div className="flex-1">
              <MissionControlCard 
                missionData={missionData}
                droneData={droneData}
                missionActive={missionActive}
                onStartMission={handleStartMission}
                onAbortMission={handleAbortMission}
                kmlFile={kmlFile}
                onKMLUpload={handleKMLUpload}
              />
            </div>
            
            {/* Alerts */}
            <div className="flex-1">
              <AlertsSection 
                alerts={alerts}
                onClearAlerts={handleClearAlerts}
                onMarkAllRead={handleMarkAllRead}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionControlDashboard;