import React, { useState, useRef } from 'react';
import { Play, Square, Clock, Target, Package, Activity, Battery, Navigation, Gauge, Upload, File, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

const MissionControlCard = ({ 
  missionData, 
  droneData, 
  missionActive, 
  onStartMission, 
  onAbortMission,
  kmlFile,
  onKMLUpload 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const fileInputRef = useRef(null);

  const formatElapsedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.name.toLowerCase().endsWith('.kml')) {
      setUploadStatus('uploading');
      
      setTimeout(() => {
        setUploadStatus('success');
        onKMLUpload(file);
      }, 1500);
    } else {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    onKMLUpload(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full">
      <h3 className="text-lg font-semibold mb-4 text-blue-400">Mission Control</h3>
      
      <div className="space-y-4">
        {/* KML Upload Section */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">Mission Area (KML)</h4>
          <div
            className={`
              relative border border-dashed rounded-lg p-3 text-center cursor-pointer
              transition-all duration-300 h-16
              ${dragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : uploadStatus === 'success' 
                  ? 'border-green-500 bg-green-500/10'
                  : uploadStatus === 'error'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".kml"
              onChange={handleFileInput}
              className="hidden"
            />
            
            <div className="flex items-center justify-center h-full">
              {uploadStatus === 'uploading' ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  <span className="text-xs text-blue-400">Uploading...</span>
                </div>
              ) : uploadStatus === 'success' ? (
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-xs text-green-400 truncate max-w-[120px]">
                    {kmlFile?.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="ml-2 text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : uploadStatus === 'error' ? (
                <div className="flex items-center">
                  <X className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-xs text-red-400">Invalid file</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Upload className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-xs text-gray-300">Drop KML or browse</span>
                </div>
              )}
            </div>
          </div>
        </div>

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

        {/* Quick Stats Summary */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-400 mb-3">Mission Summary</h4>
          
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
        </div>
      </div>
    </div>
  );
};

export default MissionControlCard;