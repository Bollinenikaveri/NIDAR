import React, { useState, useEffect } from 'react';
import { Shield, Lock, Wifi } from 'lucide-react';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
             Yantramanav Mission Control 
            </h1>
            <p className="text-gray-400 text-sm font-medium">Search and Rescue Operations</p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">OPERATIONAL</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-medium">SECURED</span>
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
              //timeZoneName: 'short'
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
  );
};

export default Header;