import React, { useState, useEffect, use } from 'react';
import {
  Wifi,
  Settings as SettingsIcon,
  X,
  Radio,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import useStore from '@/store/store';
import {mockDataService} from '@/services/mockDataService';

const Header = ({ onMaxFlightTimeChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('ros');
  const [unsavedChanges, setUnsavedChanges] = useState({
    ros: false,
    video: false,
    time: false,
    reset: false,
  });

  const [rosSettings, setRosSettings] = useState(
    useStore.getState().rosSettings ?? {
      host: useStore.getState().rosUrl.host,
      port: useStore.getState().rosUrl.port,
      connected: false,
      drones: [
        { id: 'scout', name: 'Scout Drone', connected: false, topics: [] },
        { id: 'delivery', name: 'Delivery Drone', connected: false, topics: [] }
      ],
      globalTopics: []
    }
  );

  const [timeSettings, setTimeSettings] = useState(
    useStore.getState().timeSettings ?? { maxFlightTime: 30, currentFlightTime: 0, isActive: false }
  );

  const [videoSettings, setVideoSettings] = useState(
    useStore.getState().videoSettings ?? {
      scoutDrone: {
        host: useStore.getState().videoScoutStreamUrl.host,
        port: useStore.getState().videoScoutStreamUrl.port,
        streamUrl: useStore.getState().videoScoutStreamUrl.path,
        connected: false
      },
      deliveryDrone: {
        host: useStore.getState().videoDeliveryStreamUrl.host,
        port: useStore.getState().videoDeliveryStreamUrl.port,
        streamUrl: useStore.getState().videoDeliveryStreamUrl.path,
        connected: false
      }
    }
  );

  const [globalConnectionStatus, setGlobalConnectionStatus] = useState(
    useStore.getState().globalConnectionStatus ?? false
  );

  const sidebarItems = [
    { id: 'ros', label: 'ROS2 Communications', icon: Radio },
    { id: 'video', label: 'Video Configuration', icon: Radio },
    { id: 'time', label: 'Flight Time Limits', icon: Clock },
    { id: 'reset', label: 'Reset', icon: RotateCcw },
  ];

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load saved settings from zustand store (migrated from localStorage)
  useEffect(() => {
    const storeState = useStore.getState();
    if (storeState.rosSettings) setRosSettings(storeState.rosSettings);
    if (storeState.timeSettings) setTimeSettings(storeState.timeSettings);
    if (storeState.videoSettings) setVideoSettings(storeState.videoSettings);
    if (typeof storeState.globalConnectionStatus !== 'undefined') setGlobalConnectionStatus(storeState.globalConnectionStatus);

    // Emit max flight time on load
    if (storeState.timeSettings && onMaxFlightTimeChange) {
      onMaxFlightTimeChange(storeState.timeSettings.maxFlightTime);
    }
  }, [onMaxFlightTimeChange]);

  // Helper: persist current store-backed settings to localStorage for backward compatibility
  const persistSettingsToLocal = () => {
    try {
      const s = useStore.getState();
      const payload = {
        rosSettings: s.rosSettings,
        timeSettings: s.timeSettings,
        videoSettings: s.videoSettings,
        globalConnectionStatus: s.globalConnectionStatus,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('nidarSettings', JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to persist settings to localStorage', e);
    }
  };

  // Flight timer logic—increment every second when active
  useEffect(() => {
    let interval;
    if (timeSettings.isActive) {
      interval = setInterval(() => {
        setTimeSettings(prev => {
          const next = prev.currentFlightTime + 1;
          const maxSec = prev.maxFlightTime * 60;
          if (next >= maxSec && prev.maxFlightTime > 0) {
            toast.warning('Max flight time reached. Stopping timer.');
            return { ...prev, currentFlightTime: maxSec, isActive: false };
          }
          return { ...prev, currentFlightTime: next };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeSettings.isActive, timeSettings.maxFlightTime]);

  const handleSettingsChange = (newSettings, type, tab) => {
    if (type === 'ros') setRosSettings(newSettings);
    else if (type === 'time') setTimeSettings(newSettings);
    else if (type === 'video') setVideoSettings(newSettings);
    setUnsavedChanges(prev => ({ ...prev, [tab]: true }));
  };

  const handleSaveSettings = tab => {
    try {
      // Persist to zustand store instead of localStorage
      useStore.getState().setRosSettings(rosSettings);
      useStore.getState().setTimeSettings(timeSettings);
      useStore.getState().setVideoSettings(videoSettings);
      useStore.getState().setGlobalConnectionStatus(globalConnectionStatus);
  // Also write to localStorage for backward compatibility
  persistSettingsToLocal();
      setUnsavedChanges(prev => ({ ...prev, [tab]: false }));
      toast.success(`${tab.charAt(0).toUpperCase() + tab.slice(1)} settings saved!`);

      // Emit updated max flight time to parent
      if (tab === 'time' && onMaxFlightTimeChange) {
        onMaxFlightTimeChange(timeSettings.maxFlightTime);
      }
    } catch {
      toast.error('Failed to save settings.');
    }
  };

  // ROS logic
  const handleRosConnect = () => {
    const newConnectedState = !rosSettings.connected;
    const newRosSettings = { ...rosSettings, connected: newConnectedState };
    setRosSettings(newRosSettings);
    setUnsavedChanges({...unsavedChanges, ros:true})
    
    
    // Persist connection state to zustand store
    useStore.getState().setRosSettings(newRosSettings);
  // Also persist to localStorage
  persistSettingsToLocal();
    
    toast.success(newConnectedState ? 'Connected to ROS2!' : 'Disconnected from ROS2!');
  };

  const handleDroneConnect = id => {
    const newRosSettings = {
      ...rosSettings,
      drones: rosSettings.drones.map(d =>
        d.id === id ? { ...d, connected: !d.connected } : d)
    };
    setRosSettings(newRosSettings);
    setUnsavedChanges({...unsavedChanges, ros:true})
    
    // Persist updated drone connection state to zustand store
    useStore.getState().setRosSettings(newRosSettings);
  // Also persist to localStorage
  persistSettingsToLocal();
    
    const drone = rosSettings.drones.find(d => d.id === id);
    toast.success(`${drone.name} ${!drone.connected ? 'Connected' : 'Disconnected'}!`);
  };

  const handleRosInputChange = (field, val) => {
    const newRosSettings = { ...rosSettings, [field]: val };
    setRosSettings(newRosSettings);
    setUnsavedChanges({...unsavedChanges, ros:true})
    
    // Persist ros input changes to zustand store
    useStore.getState().setRosSettings(newRosSettings);
  // Also persist to localStorage
  persistSettingsToLocal();
  };

  // Time inputs
  const handleTimeInputChange = (field, val) => {
    const newTimeSettings = { ...timeSettings, [field]: val };
    setTimeSettings(newTimeSettings);
    setUnsavedChanges({...unsavedChanges, time:true})
    
    // Persist updated time settings to zustand store
    useStore.getState().setTimeSettings(newTimeSettings);
  // Also persist to localStorage
  persistSettingsToLocal();
    
    // Emit updated max flight time to parent if needed
    if (field === 'maxFlightTime' && onMaxFlightTimeChange) {
      onMaxFlightTimeChange(val);
    }
  };

  // Video configuration handlers
  const handleVideoInputChange = (drone, field, value) => {
    const newVideoSettings = {
      ...videoSettings,
      [drone]: {
        ...videoSettings[drone],
        [field]: value
      }
    };
    setVideoSettings(newVideoSettings);
    setUnsavedChanges({...unsavedChanges, video:true})
    
    // Persist updated video settings to zustand store
    useStore.getState().setVideoSettings(newVideoSettings);
  // Also persist to localStorage
  persistSettingsToLocal();
  };

  const handleGlobalConnect = () => {

    if (globalConnectionStatus) {
      // Disconnect logic
      mockDataService.disconnectRos();
      setGlobalConnectionStatus(!globalConnectionStatus);
    } else {
      mockDataService.connectRos(rosSettings.host, rosSettings.port);
      setGlobalConnectionStatus(!globalConnectionStatus);
    }
    const newStatus = !globalConnectionStatus;
  
    
    // Update connection status for ROS and saved video drones
    const updatedRosSettings = { ...rosSettings, connected: newStatus };
    const updatedVideoSettings = {
      ...videoSettings,
      scoutDrone: { ...videoSettings.scoutDrone, connected: newStatus },
      deliveryDrone: { ...videoSettings.deliveryDrone, connected: newStatus }
    };
    
    setRosSettings(updatedRosSettings);
    setVideoSettings(updatedVideoSettings);
    
    // Persist global connection status + derived settings to zustand store
    useStore.getState().setRosSettings(updatedRosSettings);
    useStore.getState().setVideoSettings(updatedVideoSettings);
    useStore.getState().setGlobalConnectionStatus(newStatus);
  // Also persist to localStorage
  persistSettingsToLocal();
    
    toast.success(newStatus ? 'Connected to ROS server and drones!' : 'Disconnected from ROS server and drones!');
  };

  // Reset
  const handleResetStats = () => {
    const resetTime = { maxFlightTime: 30, currentFlightTime: 0, isActive: false };
    setTimeSettings(resetTime);
    
    // Persist reset time settings to zustand store
    useStore.getState().setTimeSettings(resetTime);
  // Also persist to localStorage
  persistSettingsToLocal();
    
    // Emit updated max flight time to parent
    if (onMaxFlightTimeChange) {
      onMaxFlightTimeChange(resetTime.maxFlightTime);
    }
    
    setUnsavedChanges(prev => ({ ...prev, reset: false }));
    toast.success('Statistics reset to default.');
  };

  // Sidebar content
  const renderSettingsContent = () => {
    switch (activeTab) {
      case 'ros':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-blue-400">ROS2 Communications</h3>
            <div className="bg-gray-800/50 rounded p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400">ROS2 Host</label>
                  <input
                    type="text"
                    value={rosSettings.host}
                    onChange={e => handleRosInputChange('host', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Port</label>
                  <input
                    type="text"
                    value={rosSettings.port}
                    onChange={e => handleRosInputChange('port', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <Button onClick={handleRosConnect} className={`w-full ${rosSettings.connected ? 'bg-red-600' : 'bg-green-600'}`}>
                <Wifi className="w-4 h-4 mr-2" />
                {rosSettings.connected ? 'Disconnect' : 'Connect'} to ROS2
              </Button>
              {rosSettings.connected && (
                <div className="mt-2 text-green-400 text-sm flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                  Connected to {rosSettings.host}:{rosSettings.port}
                </div>
              )}
            </div>
            {rosSettings.drones.map(drone => (
              <div key={drone.id} className="bg-gray-800/50 rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-gray-300 text-sm">{drone.name}</h4>
                  <button
                    onClick={() => handleDroneConnect(drone.id)}
                    className={`px-3 py-1 rounded text-xs ${drone.connected ? 'bg-red-600' : 'bg-green-600'}`}
                  >
                    {drone.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-6 border-t pt-4">
              <Button
                onClick={() => handleSaveSettings('ros')}
                className={`w-full ${unsavedChanges.ros ? 'bg-blue-600 animate-pulse' : 'bg-green-600'}`}
                disabled={!unsavedChanges.ros}
              >
                {unsavedChanges.ros ? 'Save ROS Settings' : 'ROS Settings Saved'}
              </Button>
            </div>
          </div>
        );

      case 'time':
        const { maxFlightTime, currentFlightTime, isActive } = timeSettings;
        const pct = Math.min((currentFlightTime / (maxFlightTime * 60)) * 100, 100);
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-blue-400">Flight Time Management</h3>
            <div className="bg-gray-800/50 rounded p-4">
              <label className="text-xs text-gray-400">Maximum Flight Time (minutes)</label>
              <input
                type="number"
                
                min="0"
                step="0.1"
                max="120"
                value={maxFlightTime}
                onChange={e => handleTimeInputChange('maxFlightTime', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
              />
            </div>
            <div className="mt-6 border-t pt-4">
              <Button
                onClick={() => handleSaveSettings('time')}
                className={`w-full ${unsavedChanges.time ? 'bg-blue-600 animate-pulse' : 'bg-green-600'}`}
                disabled={!unsavedChanges.time}
              >
                {unsavedChanges.time ? 'Save Time Settings' : 'Time Settings Saved'}
              </Button>
              {unsavedChanges.time && <p className="text-xs text-yellow-400 mt-2">Unsaved time changes</p>}
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-blue-400">Video Configuration</h3>
            
            {/* Scout Drone Configuration */}
            <div className="bg-gray-800/50 rounded p-4">
              <h4 className="text-md font-semibold text-green-400 mb-3">Scout Drone</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400">Video Host</label>
                  <input
                    type="text"
                    value={videoSettings.scoutDrone.host}
                    onChange={e => handleVideoInputChange('scoutDrone', 'host', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Port</label>
                  <input
                    type="text"
                    value={videoSettings.scoutDrone.port}
                    onChange={e => handleVideoInputChange('scoutDrone', 'port', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400">Stream URL</label>
                <input
                  type="text"
                  value={videoSettings.scoutDrone.streamUrl}
                  onChange={e => handleVideoInputChange('scoutDrone', 'streamUrl', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                />
              </div>
              {videoSettings.scoutDrone.connected && (
                <div className="text-green-400 text-sm flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                  Connected to {videoSettings.scoutDrone.host}:{videoSettings.scoutDrone.port}
                </div>
              )}
            </div>

            {/* Delivery Drone Configuration */}
            <div className="bg-gray-800/50 rounded p-4">
              <h4 className="text-md font-semibold text-blue-400 mb-3">Delivery Drone</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400">Video Host</label>
                  <input
                    type="text"
                    value={videoSettings.deliveryDrone.host}
                    onChange={e => handleVideoInputChange('deliveryDrone', 'host', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Port</label>
                  <input
                    type="text"
                    value={videoSettings.deliveryDrone.port}
                    onChange={e => handleVideoInputChange('deliveryDrone', 'port', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400">Stream URL</label>
                <input
                  type="text"
                  value={videoSettings.deliveryDrone.streamUrl}
                  onChange={e => handleVideoInputChange('deliveryDrone', 'streamUrl', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                />
              </div>
              {videoSettings.deliveryDrone.connected && (
                <div className="text-green-400 text-sm flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                  Connected to {videoSettings.deliveryDrone.host}:{videoSettings.deliveryDrone.port}
                </div>
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <Button
                onClick={() => handleSaveSettings('video')}
                className={`w-full ${unsavedChanges.video ? 'bg-blue-600 animate-pulse' : 'bg-green-600'}`}
                disabled={!unsavedChanges.video}
              >
                {unsavedChanges.video ? 'Save Video Configuration' : 'Video Configuration Saved'}
              </Button>
            </div>
          </div>
        );

      case 'reset':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-blue-400">Reset Statistics</h3>
            <div className="bg-gray-800/50 rounded p-4 text-gray-400">
              <p>This will reset flight statistics and mission data to default.</p>
              <div className="bg-red-900/20 border border-red-800 rounded p-3 my-4">
                ⚠️ Warning: This action cannot be undone.
              </div>
              <Button onClick={handleResetStats} variant="destructive" className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" /> Reset All Statistics
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button onClick={() => setShowSettings(!showSettings)} className="p-3 border border-gray-600 rounded-lg">
              <SettingsIcon className="w-5 h-5 text-gray-300 hover:text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Yantramanav Mission Control
              </h1>
              <p className="text-gray-400 text-sm">Search and Rescue Operations</p>
            </div>
            <Button 
              onClick={handleGlobalConnect}
              className={`${globalConnectionStatus ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
            >
              <Wifi className="w-4 h-4 mr-2" />
              {globalConnectionStatus ? 'Connected' : 'Connect'}
            </Button>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-cyan-300">
              {currentTime.toLocaleTimeString('en-US', { hour12: false, timeZoneName: 'short' })}
            </div>
            <div className="text-gray-400 text-sm">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-96 bg-gray-900 border-r border-gray-700 z-50 transition-transform duration-300 ${
          showSettings ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full">
          <div className="w-24 bg-gray-800/50 border-r p-4">
            <button onClick={() => setShowSettings(false)} className="p-2 mb-2 hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
            <nav className="space-y-2">
              {sidebarItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex flex-col items-center p-2 rounded-lg transition ${
                    activeTab === item.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">{renderSettingsContent()}</div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default Header;
