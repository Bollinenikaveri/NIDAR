import React, { useState, useEffect } from 'react';
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

const Header = ({ onMaxFlightTimeChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('ros');
  const [unsavedChanges, setUnsavedChanges] = useState({
    ros: false,
    time: false,
    reset: false,
  });

  const [rosSettings, setRosSettings] = useState({
    host: 'localhost',
    port: '9090',
    connected: false,
    drones: [
      { id: 'scout', name: 'Scout Drone', connected: false, topics: [] },
      { id: 'delivery', name: 'Delivery Drone', connected: false, topics: [] }
    ],
    globalTopics: []
  });

  const [timeSettings, setTimeSettings] = useState({
    maxFlightTime: 30, // minutes
    currentFlightTime: 0,
    isActive: false
  });

  const sidebarItems = [
    { id: 'ros', label: 'ROS2 Communications', icon: Radio },
    { id: 'time', label: 'Flight Time Limits', icon: Clock },
    { id: 'reset', label: 'Reset', icon: RotateCcw },
  ];

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem('nidarSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.rosSettings) setRosSettings(parsed.rosSettings);
        if (parsed.timeSettings) setTimeSettings(parsed.timeSettings);

        // Emit max flight time on load
        if (parsed.timeSettings && onMaxFlightTimeChange) {
          onMaxFlightTimeChange(parsed.timeSettings.maxFlightTime);
        }
      } catch (e) {
        console.error('Load settings error', e);
      }
    }
  }, [onMaxFlightTimeChange]);

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
    setUnsavedChanges(prev => ({ ...prev, [tab]: true }));
  };

  const handleSaveSettings = tab => {
    try {
      localStorage.setItem(
        'nidarSettings',
        JSON.stringify({ rosSettings, timeSettings, savedAt: new Date().toISOString() })
      );
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
  const handleRosConnect = () =>
    handleSettingsChange({ ...rosSettings, connected: !rosSettings.connected }, 'ros', 'ros');

  const handleDroneConnect = id =>
    handleSettingsChange({
      ...rosSettings,
      drones: rosSettings.drones.map(d =>
        d.id === id ? { ...d, connected: !d.connected } : d)
    }, 'ros', 'ros');

  const handleRosInputChange = (field, val) =>
    handleSettingsChange({ ...rosSettings, [field]: val }, 'ros', 'ros');

  // Time inputs
  const handleTimeInputChange = (field, val) =>
    handleSettingsChange({ ...timeSettings, [field]: val }, 'time', 'time');

  // Reset
  const handleResetStats = () => {
    const resetTime = { maxFlightTime: 30, currentFlightTime: 0, isActive: false };
    handleSettingsChange(resetTime, 'time', 'reset');
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
              <div className="mt-4 text-2xl font-mono text-cyan-300">
                {String(Math.floor(currentFlightTime / 60)).padStart(2, '0')}:
                {String(currentFlightTime % 60).padStart(2, '0')}
              </div>
              <div className="w-full bg-gray-700 h-2 rounded mt-2">
                <div className="bg-blue-500 h-2 rounded" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={() => handleTimeInputChange('isActive', !isActive)}
                  className={isActive ? 'bg-red-600' : 'bg-green-600'}
                >
                  {isActive ? 'Stop Timer' : 'Start Timer'}
                </Button>
                <Button variant="outline" onClick={() => handleTimeInputChange('currentFlightTime', 0)}>
                  Reset Timer
                </Button>
              </div>
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
