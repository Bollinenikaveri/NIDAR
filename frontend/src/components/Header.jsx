
import React, { useState, useEffect } from 'react';
import { Shield, Lock, Wifi, Settings, X, ArrowLeft, Radio, Clock, RotateCcw, Power, Settings as SettingsIcon } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('ros');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [rosSettings, setRosSettings] = useState({
    host: 'localhost',
    port: '9090',
    connected: false,
    drones: [
      {
        id: 'scout',
        name: 'Scout Drone',
        connected: false,
        topics: []
      },
      {
        id: 'delivery',
        name: 'Delivery Drone',
        connected: false,
        topics: []
      }
    ],
    globalTopics: [
      { name: '/', enabled: false, type: '/' },
      { name: '/', enabled: false, type: '/' },
      { name: '/', enabled: true, type: '/' },
      { name: '/', enabled: true, type: '/' },
    ]
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
    { id: 'power', label: 'Power Management', icon: Power },
    { id: 'general', label: 'General Settings', icon: SettingsIcon }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('nidarSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.rosSettings) {
          setRosSettings(parsed.rosSettings);
        }
        if (parsed.timeSettings) {
          setTimeSettings(parsed.timeSettings);
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  // Track changes to mark as unsaved
  const handleSettingsChange = (newSettings, settingsType) => {
    if (settingsType === 'ros') {
      setRosSettings(newSettings);
    } else if (settingsType === 'time') {
      setTimeSettings(newSettings);
    }
    setHasUnsavedChanges(true);
  };

  // Save settings to localStorage
  const handleSaveSettings = () => {
    try {
      const settingsToSave = {
        rosSettings,
        timeSettings,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('nidarSettings', JSON.stringify(settingsToSave));
      setHasUnsavedChanges(false);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  };

  const handleRosConnect = () => {
    const newSettings = { ...rosSettings, connected: !rosSettings.connected };
    handleSettingsChange(newSettings, 'ros');
  };

  const handleDroneConnect = (droneId) => {
    const newSettings = {
      ...rosSettings,
      drones: prev.drones.map(drone =>
        drone.id === droneId ? { ...drone, connected: !drone.connected } : drone
      )
    };
    handleSettingsChange(newSettings, 'ros');
  };

  const handleTopicToggle = (topicName, droneId = null) => {
    let newSettings;
    if (droneId) {
      newSettings = {
        ...rosSettings,
        drones: rosSettings.drones.map(drone =>
          drone.id === droneId ? {
            ...drone,
            topics: drone.topics.map(topic =>
              topic.name === topicName ? { ...topic, enabled: !topic.enabled } : topic
            )
          } : drone
        )
      };
    } else {
      newSettings = {
        ...rosSettings,
        globalTopics: rosSettings.globalTopics.map(topic =>
          topic.name === topicName ? { ...topic, enabled: !topic.enabled } : topic
        )
      };
    }
    handleSettingsChange(newSettings, 'ros');
  };

  const handleResetStats = () => {
    const newTimeSettings = {
      maxFlightTime: 30,
      currentFlightTime: 0,
      isActive: false
    };
    handleSettingsChange(newTimeSettings, 'time');
    toast.success('Statistics have been reset to default values');
  };

  // Handle input changes for ROS settings
  const handleRosInputChange = (field, value) => {
    const newSettings = { ...rosSettings, [field]: value };
    handleSettingsChange(newSettings, 'ros');
  };

  // Handle input changes for time settings
  const handleTimeInputChange = (field, value) => {
    const newSettings = { ...timeSettings, [field]: value };
    handleSettingsChange(newSettings, 'time');
  };

      if (droneId) {
        return {
          ...prev,
          drones: prev.drones.map(drone =>
            drone.id === droneId ? {
              ...drone,
              topics: drone.topics.map(topic =>
                topic.name === topicName ? { ...topic, enabled: !topic.enabled } : topic
              )
            } : drone
          )
        };
      } else {
        return {
          ...prev,
          globalTopics: prev.globalTopics.map(topic =>
            topic.name === topicName ? { ...topic, enabled: !topic.enabled } : topic
          )
        };
      }
    });
  };

  const renderSettingsContent = () => {
    switch (activeTab) {
      case 'ros':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-4">ROS2 Communications</h3>
              
              {/* Connection Settings */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Connection Configuration</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ROS2 Host</label>
                    <input
                      type="text"
                      value={rosSettings.host}
                      onChange={(e) => handleRosInputChange('host', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Port</label>
                    <input
                      type="text"
                      value={rosSettings.port}
                      onChange={(e) => handleRosInputChange('port', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      placeholder="9090"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleRosConnect}
                  className={`w-full ${rosSettings.connected 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  {rosSettings.connected ? 'Disconnect' : 'Connect'} to ROS2
                </Button>
                
                {rosSettings.connected && (
                  <div className="mt-2 flex items-center text-green-400 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    Connected to {rosSettings.host}:{rosSettings.port}
                  </div>
                )}
              </div>

              {/* Drone Management */}
              <div className="space-y-4">
                {rosSettings.drones.map((drone) => (
                  <div key={drone.id} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-300">{drone.name}</h4>
                      <button
                        onClick={() => handleDroneConnect(drone.id)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          drone.connected
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {drone.connected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                    
                    {drone.connected && (
                      <div className="mb-2 flex items-center text-green-400 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        {drone.name} Connected
                      </div>
                    )}
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {drone.topics.map((topic, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                          <div className="flex-1">
                            <div className="text-xs text-white">{topic.name}</div>
                            <div className="text-xs text-gray-400">{topic.type}</div>
                          </div>
                          <button
                            onClick={() => handleTopicToggle(topic.name, drone.id)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              topic.enabled
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            {topic.enabled ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Global Topics */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">ROS Topics</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {rosSettings.globalTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                      <div className="flex-1">
                        <div className="text-xs text-white">{topic.name}</div>
                        <div className="text-xs text-gray-400">{topic.type}</div>
                      </div>
                      <button
                        onClick={() => handleTopicToggle(topic.name)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          topic.enabled
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        {topic.enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'time':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-4">Flight Time Management</h3>
              
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Time Limits</h4>
                
                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">Maximum Flight Time (minutes)</label>
                  <input
                    type="number"
                    value={timeSettings.maxFlightTime}
                    onChange={(e) => handleTimeInputChange('maxFlightTime', parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    min="1"
                    max="120"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">Current Flight Time</label>
                  <div className="text-2xl font-mono text-cyan-300 mb-2">
                    {Math.floor(timeSettings.currentFlightTime / 60).toString().padStart(2, '0')}:
                    {(timeSettings.currentFlightTime % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((timeSettings.currentFlightTime / (timeSettings.maxFlightTime * 60)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleTimeInputChange('isActive', !timeSettings.isActive)}
                    className={timeSettings.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {timeSettings.isActive ? 'Stop Timer' : 'Start Timer'}
                  </Button>
                  
                  <Button
                    onClick={() => handleTimeInputChange('currentFlightTime', 0)}
                    variant="outline"
                  >
                    Reset Timer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reset':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-4">Reset Statistics</h3>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">System Reset Options</h4>
                <p className="text-gray-400 text-sm mb-4">
                  This will reset all statistics, flight times, and mission data to their default values.
                </p>
                
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">
                    ⚠️ Warning: This action cannot be undone. All current mission data and statistics will be lost.
                  </p>
                </div>

                <Button
                  onClick={handleResetStats}
                  variant="destructive"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All Statistics
                </Button>
              </div>
            </div>
          </div>
        );

      case 'power':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-4">Power Management</h3>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">System Power Options</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Manage system power settings and drone battery monitoring.
                </p>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    Low Battery Alert Threshold: 20%
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Auto-Return on Low Battery: Enabled
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Emergency Landing: Armed
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-4">General Settings</h3>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Application Settings</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Dark Mode</span>
                    <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all"></div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Sound Alerts</span>
                    <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all"></div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Auto-Save Mission Data</span>
                    <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 border border-gray-600 rounded-lg transition-all duration-200 hover:border-gray-500 ${
                  showSettings ? 'bg-blue-600/20 border-blue-600/30' : 'bg-gray-800/50 hover:bg-gray-700/50'
                }`}
              >
                <Settings className={`w-5 h-5 transition-colors ${
                  showSettings ? 'text-blue-400' : 'text-gray-300 hover:text-white'
                }`} />
              </button>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                 Yantramanav Mission Control 
                </h1>
                <p className="text-gray-400 text-sm font-medium">Search and Rescue Operations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-medium">OPERATIONAL</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">CONNECTED</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-cyan-300">
              {currentTime.toLocaleTimeString('en-US', { 
                hour12: false,
                timeZoneName: 'short'
              })}
            </div>
            <div className="text-gray-400 text-sm">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Settings Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-96 bg-gray-900 border-r border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        showSettings ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full">
          {/* Settings Sidebar Navigation */}
          <div className="w-24 bg-gray-800/50 border-r border-gray-700 p-4">
            <div className="flex flex-col items-center mb-6">
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors mb-2"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
              <span className="text-xs text-gray-500 text-center">Settings</span>
            </div>
            
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex flex-col items-center space-y-1 p-2 rounded-lg text-center transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs leading-tight">{item.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderSettingsContent()}
            
            {/* Save Button */}
            <div className="sticky bottom-0 bg-gray-900 pt-4 mt-6 border-t border-gray-700">
              <Button
                onClick={handleSaveSettings}
                className={`w-full transition-all duration-300 ${
                  hasUnsavedChanges 
                    ? 'bg-blue-600 hover:bg-blue-700 animate-pulse' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={!hasUnsavedChanges}
              >
                {hasUnsavedChanges ? 'Save Changes' : 'All Changes Saved'}
              </Button>
              
              {hasUnsavedChanges && (
                <p className="text-xs text-yellow-400 mt-2 text-center">
                  You have unsaved changes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Header;
