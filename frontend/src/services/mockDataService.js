import ROSLIB, { Ros} from "roslib";



class MockDataService {
  constructor() {
    this.url = 'ws://100.107.6.16:8765'; // Default to localhost if not set
        // Initialize ROS connection
    this.ros = new Ros({
      url: this.url
    });
    this.ros.on('connection', () => {
      console.log('Connected to ROS');
    });
    this.ros.on('error', (error) => {
      console.error('Error connecting to ROS:', error);
    });
    this.ros.on('close', () => {
      console.log('Connection to ROS closed');
    });


    // Intialize Base Station and Drone Locations
    this.baseStationLocation = new ROSLIB.Service({
      ros: this.ros,
      name: '/base_station/location',
      serviceType: 'geographic_msgs/GeoPoint'
    }).callService();

    // Initialize Scout and Delivery Drone Home Locations
    this.scoutHomeLocation = new ROSLIB.Service({
      ros: this.ros,
      name: '/scout/home_location',
      serviceType: 'geographic_msgs/GeoPoint'
    }).callService();

    this.deliveryHomeLocation = new ROSLIB.Service({
      ros: this.ros,
      name: '/delivery/home_location',  
      serviceType: 'geographic_msgs/GeoPoint'
    }).callService();

    // Initialize Victim and Current Drone Locations
    this.victimLocation = new ROSLIB.Service({
      ros: this.ros,  
      name: '/victim/location',
      serviceType: 'geographic_msgs/GeoPoint'
    }).callService();

    this.currentScoutDroneLocation = new ROSLIB.Service({
      ros: this.ros,
      name: '/scout/location',
      serviceType: 'geographic_msgs/GeoPoint'
    }).callService();

    this.currentDeliveryDroneLocation = new ROSLIB.Service({
      ros: this.ros,
      name: '/current_delivery_drone/location',
      serviceType: 'geographic_msgs/GeoPoint'
    }).callService();
    
    this.baseLocation = { lat: 37.7749, lng: -122.4194 }; // San Francisco
    this.victimLocation = { lat: 37.7849, lng: -122.4094 };
    this.currentDroneLocation = { lat: 37.7749, lng: -122.4194 };

  
    this.baseLocation = { lat: 37.7749, lng: -122.4194 }; // San Francisco
    this.victimLocation = { lat: 37.7849, lng: -122.4094 };
    this.currentDroneLocation = { lat: 37.7749, lng: -122.4194 };
    this.alertTypes = [
      'Victim Detected',
      'Kit Delivered',
      'Low Battery Warning',
      'Communication Lost',
      'Weather Alert',
      'Obstacle Detected',
      'Mission Complete',
      'GPS Signal Weak'
    ];
  }

  getMissionData() {
    const startTime = new Date() - (Math.random() * 3600000); // Random start time within last hour
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    return {
      id: 'MSN-2025-001',
      status: 'Active',
      elapsedTime: elapsed,
      progress: Math.min(Math.floor(elapsed / 36), 100), // Progress based on elapsed time
      victimsDetected: Math.floor(Math.random() * 3) + 1,
      kitsDelivered: Math.floor(Math.random() * 2),
      startTime: new Date(startTime)
    };
  }

  getDroneData() {
    // Simulate drone movement towards victim
    const noise = () => (Math.random() - 0.5) * 0.001; // Small random movement
    
    return {
      scout: {
        id: 'SCOUT-01',
        location: {
          lat: this.currentDroneLocation.lat + noise(),
          lng: this.currentDroneLocation.lng + noise()
        },
        battery: Math.floor(Math.random() * 30) + 70,
        altitude: Math.floor(Math.random() * 50) + 100,
        speed: Math.floor(Math.random() * 20) + 15,
        connected: Math.random() > 0.1,
        heading: Math.floor(Math.random() * 360)
      },
      delivery: {
        id: 'DELIVERY-01',
        location: {
          lat: this.baseLocation.lat + noise(),
          lng: this.baseLocation.lng + noise()
        },
        battery: Math.floor(Math.random() * 40) + 60,
        altitude: Math.floor(Math.random() * 30) + 80,
        speed: Math.floor(Math.random() * 15) + 10,
        connected: Math.random() > 0.05,
        heading: Math.floor(Math.random() * 360),
        payload: Math.random() > 0.5 ? 'Medical Kit' : 'Empty'
      },
      victim: this.victimLocation,
      base: this.baseLocation,
      activeDrones: 2,
      avgBattery: Math.floor(Math.random() * 20) + 70,
      totalDistance: Math.floor(Math.random() * 5) + 12,
      eta: Math.floor(Math.random() * 10) + 5
    };
  }

  getAlerts() {
    const alerts = [];
    for (let i = 0; i < 3; i++) {
      alerts.push(this.generateAlert());
    }
    return alerts;
  }

  generateAlert(customMessage = null, customSeverity = null) {
    const severities = ['HIGH', 'MEDIUM', 'LOW'];
    const severity = customSeverity || severities[Math.floor(Math.random() * severities.length)];
    const message = customMessage || this.alertTypes[Math.floor(Math.random() * this.alertTypes.length)];
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      message,
      severity,
      timestamp: new Date(),
      coordinates: {
        lat: this.baseLocation.lat + (Math.random() - 0.5) * 0.02,
        lng: this.baseLocation.lng + (Math.random() - 0.5) * 0.02
      },
      read: false
    };
  }

  // A* pathfinding simulation
  calculatePath(start, end) {
    const path = [];
    const steps = 10;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const lat = start.lat + (end.lat - start.lat) * progress;
      const lng = start.lng + (end.lng - start.lng) * progress;
      
      // Add some curve to make it look more realistic
      const offset = Math.sin(progress * Math.PI) * 0.005;
      path.push({
        lat: lat + offset,
        lng: lng + offset
      });
    }
    
    return path;
  }

  getKMLData() {
    return {
      name: 'Search Area Alpha',
      coordinates: [
        [this.baseLocation.lng - 0.01, this.baseLocation.lat - 0.01],
        [this.baseLocation.lng + 0.01, this.baseLocation.lat - 0.01],
        [this.baseLocation.lng + 0.01, this.baseLocation.lat + 0.01],
        [this.baseLocation.lng - 0.01, this.baseLocation.lat + 0.01],
        [this.baseLocation.lng - 0.01, this.baseLocation.lat - 0.01]
      ]
    };
  }
}

export const mockDataService = new MockDataService();