import ROSLIB, { Ros } from "roslib";
import useStore from "../store/store.js";
import { use } from "react";
import  {parseKmlPolygon}  from  "@/lib/parse-utils.js";

class MockDataService {

  constructor() {

    this.getStore = () => useStore.getState();
    this.isConnected = useStore.getState().globalConnectionStatus ?? false;
    this.scoutName = useStore.getState().rosSettings?.drones?.find(d => d.id === 'scout')?.name || "scout";
    this.deliveryName = useStore.getState().rosSettings?.drones?.find(d => d.id === 'delivery')?.name || "delivery";

    // ================= TELEMETRY =================
    this.scoutTelemetry = {
      state: 'Standby',
      battery: 0,
      altitude: 0,
      speed: 0,
      heading: 0,
      location: { lat: 0, lng: 0 }
    };

    this.deliveryTelemetry = {
      location: { lat: 0, lng: 0 },
      battery: 0,
      altitude: 0,
      speed: 0,
      heading: 0
    };

    // ================= MISSION STATE =================
    this.missionStartTime = null;
    this.missionStatus = "Standby";
    this.victimsDetected = 0;
    this.kitsDelivered = 0;

    this.alerts = [];

    this.baseLocation = { lat: 37.7749, lng: -122.4194 };
  }

  // ==========================================================
  // ALERT SYSTEM
  // ==========================================================



generateAlert(message = "Mission Update", severity = "LOW") {
    return {
      id: crypto.randomUUID(),
      message,  
      severity,
      timestamp: new Date(),
      coordinates: {
        lat: this.scoutTelemetry.location?.lat ?? this.baseLocation.lat,
        lng: this.scoutTelemetry.location?.lng ?? this.baseLocation.lng
      },
      read: false
    };
  }


  generateRosAltert(rosAlert) {

    try {

      const parsed = typeof rosAlert === "string"
        ? JSON.parse(rosAlert)
        : rosAlert;

    
         switch (parsed.type) {

        case "MISSION_STARTED":
          this.missionStartTime = new Date();
          this.missionStatus = "Active";
          this.victimsDetected = 0;
          this.kitsDelivered = 0;
          break;

        case "MISSION_REJECTED":
          this.missionStatus = "Rejected";
          
          break;

        case "MISSION_COMPLETE":
          this.missionStatus = "Completed";
          break;

        case "MISSION_RTL":
          this.missionStatus = "Returning";
          break;

        case "OBSTACLE_DETECTED":
          this.victimsDetected++;
          break;

        case "DELIVERY_COMPLETE":
          this.kitsDelivered++;
          break;

        default:
          break;
      }
       return {
        id: crypto.randomUUID(),
        message: parsed.message || "Mission Update",
        severity: parsed.severity || "LOW",
        timestamp: new Date(),
        coordinates: {
          lat: parsed.latitude ?? this.baseLocation.lat,
          lng: parsed.longitude ?? this.baseLocation.lng
        },
        read: false
      };
      

    } catch (e) {
      console.error("Invalid ROS alert:", e);
      return null;
    }
  }

  addAlert(alert) {
    if (!alert) return;
    this.alerts.unshift(alert);
  }

  getAlerts() {
    const alerts = [...this.alerts];
    this.alerts = [];
    return alerts;
  }

  // ==========================================================
  // ROS CONNECTION
  // ==========================================================

  connectRos() {

    const st = this.getStore();
    const url = st.rosUrl?.host && st.rosUrl?.port
      ? `ws://${st.rosUrl.host}:${st.rosUrl.port}`
      : 'ws://localhost:9090';

    this.ros = new Ros({ url });

    this.ros.on('connection', () => {
      setInterval(() => {
        useStore.getState().setGlobalConnectionStatus(true);
      }, 3000);
      console.log("Connected to ROS");
      this.setupSubscribers();
      this.setupAlertSubscriber();
    });

    this.ros.on('error', () => {
      useStore.getState().setGlobalConnectionStatus(false);
    });

    this.ros.on('close', () => {
      useStore.getState().setGlobalConnectionStatus(false);
    });

    return true;
  }

  disconnectRos() {
    if (this.ros) this.ros.close();
  }

  // ==========================================================
  // ALERT SUBSCRIBER
  // ==========================================================

  setupAlertSubscriber() {

    new ROSLIB.Topic({
      ros: this.ros,
      name: '/mission/alerts',
      messageType: 'std_msgs/String'
    }).subscribe((msg) => {

      const alert = this.generateRosAltert(msg.data);
      this.addAlert(alert);
    });
  }

  // ==========================================================
  // TELEMETRY SUBSCRIBERS
  // ==========================================================

  setupSubscribers() {

    new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.scoutName}_drone/state`,
      messageType: 'std_msgs/String'
    }).subscribe((msg) => {
      this.scoutTelemetry.state = msg.data;
    });

    new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.scoutName}_drone/battery`,
      messageType: 'std_msgs/Float32'
    }).subscribe((msg) => {
      this.scoutTelemetry.battery = Math.round(msg.data);
    });

    new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.scoutName}_drone/altitude`,
      messageType: 'std_msgs/Float32'
    }).subscribe((msg) => {
      this.scoutTelemetry.altitude = msg.data;
    });

    new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.scoutName}_drone/speed`  ,
      messageType: 'std_msgs/Float32'
    }).subscribe((msg) => {
      this.scoutTelemetry.speed = msg.data;
    });

    new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.scoutName}_drone/heading`,
      messageType: 'std_msgs/Float32'
    }).subscribe((msg) => {
      this.scoutTelemetry.heading = msg.data;
    });

  

    new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.scoutName}_drone/location`,
      messageType: 'sensor_msgs/NavSatFix'
    }).subscribe((msg) => {
      this.scoutTelemetry.location = {
        lat: msg.latitude,
        lng: msg.longitude
      };
    });
  
  new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.deliveryName}_drone/battery`,
      messageType: 'std_msgs/Float32'
    }).subscribe((msg) => {
      this.deliveryTelemetry.battery = Math.round(msg.data);
    });

      new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.deliveryName}_drone/altitude`,
      messageType: 'std_msgs/Float32'
    }).subscribe((msg) => {
      this.deliveryTelemetry.altitude = msg.data;
    });

    new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.deliveryName}_drone/speed`  ,
      messageType: 'std_msgs/Float32'
    }).subscribe((msg) => {
      this.deliveryTelemetry.speed = msg.data;
    });

    new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.deliveryName}_drone/heading`,
      messageType: 'std_msgs/Float32'
    }).subscribe((msg) => {
      this.deliveryTelemetry.heading = msg.data;
    });
    
    
    
    new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.deliveryName}_drone/payload_status`,
      messageType: 'std_msgs/String'
    }).subscribe((msg) => {
      this.deliveryTelemetry.payloadStatus = msg.data;
    });


    new ROSLIB.Topic({
      ros: this.ros,
      name: `/${this.deliveryName}_drone/location`,
      messageType: 'sensor_msgs/NavSatFix'
    }).subscribe((msg) => {
      this.deliveryTelemetry.location = {
        lat: msg.latitude,
        lng: msg.longitude
      };
    });
  }
  // ==========================================================
  // DRONE DATA (STABLE STRUCTURE — NEVER UNDEFINED)
  // ==========================================================

  getDroneData() {

    const isConnected = this.getStore().globalConnectionStatus ?? false;

    return {
      scout: {
        id: 'SCOUT-01',
        location: this.scoutTelemetry.location ?? this.baseLocation,
        battery: this.scoutTelemetry.battery ?? 0,
        altitude: Number(this.scoutTelemetry.altitude ?? 0).toFixed(1),
        speed: Number(this.scoutTelemetry.speed ?? 0).toFixed(1),
        connected: isConnected,
        heading: Math.floor(this.scoutTelemetry.heading ?? 0)
      },

      delivery: {
        id: 'DELIVERY-01',
        location: this.deliveryTelemetry.location ?? this.baseLocation,
        battery: this.deliveryTelemetry.battery ?? 0,
        altitude: Number(this.deliveryTelemetry.altitude ?? 0).toFixed(1),
        speed: Number(this.deliveryTelemetry.speed ?? 0).toFixed(1),
        connected: isConnected,
        heading: Math.floor(this.deliveryTelemetry.heading ?? 0),
        payload: "Medical Kit"
      }
    };
  }

  // ==========================================================
  // MISSION DATA
  // ==========================================================

  getMissionData() {

    const now = new Date();

    const elapsed = this.missionStartTime
      ? Math.floor((now - this.missionStartTime) / 1000)
      : 0;

    let progress = 0;

    if (this.missionStatus === "Active") progress = 40;
    if (this.missionStatus === "Returning") progress = 85;
    if (this.missionStatus === "Completed") progress = 100;

    return {
      id: "MSN-REAL-001",
      status: this.missionStatus,
      elapsedTime: elapsed,
      progress,
      victimsDetected: this.victimsDetected,
      kitsDelivered: this.kitsDelivered,
      startTime: this.missionStartTime
    };
  }

 async getKMLData(file) { 
   
   
    if (!file) {
      return Promise.resolve(this.generateAlert("No KML file provided", "HIGH"));
    }
    try {      // Parse KML file and extract coordinates
      const kmlData = await parseKmlPolygon(file);
      console.log('Parsed KML Data:', kmlData);

      if (!kmlData || kmlData.length === 0) {
        console.error("No valid coordinates found in KML file.");
        return this.getDefaultKMLData();
      }

      // Convert parsed coordinates to the expected format
      const processedData = {
        fileName: file.name,
        waypoints: kmlData.map((coord, index) => ({
          name: `Waypoint ${index + 1}`,
          lat: coord.lat,
          lng: coord.lng
        })),
        coordinates: [{
          type: 'area',
          area: kmlData
        }]
      };

      // Construct the request object based on the srv definition
      const request = {
        polygon_x: kmlData.map(coord => coord.lng),
        polygon_y: kmlData.map(coord => coord.lat),
        safe_margin: 3.0,
        spacing: 6.0,
        angle: 0.0
      };
      console.log("Request to ROS service:", request);
      
      // Create the ROS service client
      const pathService = new ROSLIB.Service({
        ros: this.ros,
        name: '/get_scout_path',
        serviceType: 'mission_interfaces/srv/GetLawnmowerPath'
      });

      // Call the service
      pathService.callService(new ROSLIB.ServiceRequest(request), (result) => {
        if (!result || !result.waypoint_x || !result.waypoint_y) {
          console.error("Invalid response from service:", result);
          return;
        }

        console.log("Waypoints X:", result.waypoint_x);
        console.log("Waypoints Y:", result.waypoint_y);

        // Optional: Combine them if needed
        const waypoints = result.waypoint_x.map((x, i) => ({
          lng: x,
          lat: result.waypoint_y[i]
        }));

        console.log("Waypoints (lat, lng):", waypoints);
        useStore.getState().setMissionPlan({
          waypoints,
          noFlyZones: [],
          flightPaths: []
        });
      });

      return processedData;

    } catch (error) {
      console.error("Error processing KML or calling service:", error);
      this.generateAlert("KML Processing Error", "HIGH");
    }
  }


  // ==========================================================
  // START MISSION
  // ==========================================================

  startMission() {

    const waypoints = useStore.getState().missionPlan?.waypoints;

    if (!waypoints || waypoints.length === 0) {
      alert("No waypoints defined!");  
      return;
    }

    const missionService = new ROSLIB.Service({
      ros: this.ros,
      name: '/start_mission',
      serviceType: 'mission_interfaces/StartMission'
    });
  
    const request = new ROSLIB.ServiceRequest({
      waypoints: waypoints.map(wp => ({
        latitude: parseFloat(wp.lat),
        longitude: parseFloat(wp.lng),
        altitude: parseFloat(wp.alt || 20.0)
      }))
    });

    missionService.callService(
      request,
      (result) => {
        if (!result.accepted) {
          console.warn("Mission Rejected by backend");
        }
      },
      (error) => {
        console.error("Mission Service Error:", error);
      }
    );
  }
}

export const mockDataService = new MockDataService();