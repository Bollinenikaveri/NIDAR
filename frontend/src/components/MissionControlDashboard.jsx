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
  const [kmlData, setKmlData] = useState(null);
  const [maxFlightTime, setMaxFlightTime] = useState(null);

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
    if (kmlFile) {
      setMissionActive(true);
      setAlerts(prev => [mockDataService.generateAlert('Mission Started', 'HIGH'), ...prev.slice(0, 4)]);
    }
  };

  const handleAbortMission = () => {
    if(kmlFile){
      setMissionActive(false);
      setKmlFile(null);
      setKmlData(null);
      setAlerts(prev => [mockDataService.generateAlert('Mission Aborted', 'HIGH'), ...prev.slice(0, 4)]);
    }
  };

  const handleClearAlerts = () => {
    setAlerts([]);
  };

  const handleMarkAllRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const handleKMLUpload = async (file) => {
    setKmlFile(file);
    if (file) {
      try {
        const parsedKML = await mockDataService.getKMLData(file);
        setKmlData(parsedKML);
        setAlerts(prev => [mockDataService.generateAlert('KML File Loaded Successfully', 'MEDIUM'), ...prev.slice(0, 4)]);
        console.log('Parsed KML data:', parsedKML);
      } catch (error) {
        console.error('Error parsing KML file:', error);
        setAlerts(prev => [mockDataService.generateAlert('KML File Parse Error', 'HIGH'), ...prev.slice(0, 4)]);
      }
    } else {
      setKmlData(null);
    }
  };

  const handleMaxFlightTimeChange = (time) => {
    setMaxFlightTime(time);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <Header onMaxFlightTimeChange={handleMaxFlightTimeChange} />

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
                  kmlData={kmlData}
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
                maxFlightTime={maxFlightTime}
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