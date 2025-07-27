import React from 'react';
import { AlertTriangle, CheckCircle, Info, X, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

const AlertsSection = ({ alerts, onClearAlerts, onMarkAllRead }) => {
  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'MEDIUM':
        return <Info className="w-4 h-4 text-yellow-400" />;
      case 'LOW':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-600/20 text-red-400 border-red-500/30';
      case 'MEDIUM':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
      case 'LOW':
        return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCoordinates = (coordinates) => {
    return `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-400">Mission Alerts</h3>
        <div className="flex space-x-1">
          <Button
            onClick={onMarkAllRead}
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1 h-auto text-gray-400 hover:text-white"
          >
            <Eye className="w-3 h-3 mr-1" />
            Mark All Read
          </Button>
          <Button
            onClick={onClearAlerts}
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1 h-auto text-gray-400 hover:text-red-400"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm">No active alerts</span>
            <span className="text-xs">System running normally</span>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`
                  relative bg-gray-800/50 rounded-lg p-3 border transition-all duration-300
                  ${alert.read 
                    ? 'opacity-60 border-gray-600/30' 
                    : 'border-gray-600/50 hover:border-gray-500/50'
                  }
                  ${alert.severity === 'HIGH' && !alert.read ? 'animate-pulse' : ''}
                `}
              >
                {/* Unread indicator */}
                {!alert.read && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {alert.message}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs px-1.5 py-0.5 ${getSeverityColor(alert.severity)}`}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono">
                          {formatTime(alert.timestamp)}
                        </span>
                        <span className="font-mono text-cyan-300">
                          {formatCoordinates(alert.coordinates)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Severity indicator bar */}
                <div className={`
                  absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
                  ${alert.severity === 'HIGH' ? 'bg-red-500' : 
                    alert.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'}
                `}></div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Alert Summary */}
      {alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex space-x-4">
              <span className="text-red-400">
                High: {alerts.filter(a => a.severity === 'HIGH').length}
              </span>
              <span className="text-yellow-400">
                Medium: {alerts.filter(a => a.severity === 'MEDIUM').length}
              </span>
              <span className="text-blue-400">
                Low: {alerts.filter(a => a.severity === 'LOW').length}
              </span>
            </div>
            <span className="text-gray-400">
              Unread: {alerts.filter(a => !a.read).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsSection;