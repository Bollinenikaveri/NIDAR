import React, { useEffect, useRef } from "react";
import io from "socket.io-client";

export default function LiveFeed() {
  const videoRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:5000"); // signaling server
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.ontrack = (e) => {
      console.log("Remote track received", e.streams[0]);
      videoRef.current.srcObject = e.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    socket.on("connect", () => {
      console.log("Connected to signaling server", socket.id);
      socket.emit("viewer-joined");
    });

    socket.on("offer", async (offer) => {
      console.log("Offer received from broadcaster", offer);
      try {
        await pc.setRemoteDescription({ type: offer.type, sdp: offer.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", answer);
        console.log("Answer sent");
      } catch (err) {
        console.error("WebRTC error", err);
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      if (!candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding ICE candidate", e);
      }
    });

    return () => {
      pc.close();
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ textAlign: "center", background: "#111", padding: 10, borderRadius: 8 }}>
      <h3 style={{ color: "#fff" }}>Drone Live Feed</h3>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "block", margin: "0 auto", width: 480, height: 320, background: "#000", borderRadius: 6 }}
      />
    </div>
  );
}

// import React, { useState } from 'react';
// import { Camera, Wifi, WifiOff, Monitor, Video } from 'lucide-react';

// const LiveFeed = ({ selectedFeed, setSelectedFeed, droneData }) => {
//   const [feedQuality, setFeedQuality] = useState('HD');

//   const feeds = [
//     {
//       id: 'scout',
//       name: 'Scout Drone',
//       connected: droneData?.scout?.connected || false,
//       signal: Math.floor(Math.random() * 30) + 70,
//       resolution: '1920x1080',
//       fps: 30
//     },
//     {
//       id: 'delivery',
//       name: 'Delivery Drone',
//       connected: droneData?.delivery?.connected || false,
//       signal: Math.floor(Math.random() * 25) + 75,
//       resolution: '1280x720',
//       fps: 24
//     }
//   ];

//   const currentFeed = feeds.find(f => f.id === selectedFeed);

//   return (
//     <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full">
//       <div className="flex items-center justify-between mb-3">
//         <h3 className="text-sm font-semibold text-blue-400">Live Video Feed</h3>
//         <div className="flex items-center space-x-2">
//           {feeds.map(feed => (
//             <button
//               key={feed.id}
//               onClick={() => setSelectedFeed(feed.id)}
//               className={`
//                 px-2 py-1 text-xs rounded-md transition-all duration-200
//                 ${selectedFeed === feed.id 
//                   ? 'bg-blue-500 text-white' 
//                   : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
//                 }
//               `}
//             >
//               {feed.name}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Video Feed Area */}
//       <div className="relative bg-gray-800 rounded-lg h-[calc(100%-3rem)] overflow-hidden">
//         {currentFeed?.connected ? (
//           <>
//             {/* Simulated Video Feed */}
//             <div className="w-full h-full flex items-center justify-center relative">
//               <div 
//                 className="w-full h-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 relative"
//                 style={{
//                   backgroundImage: `
//                     radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
//                     radial-gradient(circle at 70% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)
//                   `
//                 }}
//               >
//                 {/* Crosshair overlay */}
//                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                   <div className="relative">
//                     <div className="w-8 h-8 border-2 border-green-400 rounded-full opacity-70"></div>
//                     <div className="absolute inset-0 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-full animate-spin opacity-50"></div>
//                   </div>
//                 </div>

//                 {/* Simulated terrain features */}
//                 <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-brown-600 rounded opacity-60"></div>
//                 <div className="absolute bottom-1/3 right-1/4 w-6 h-6 bg-green-700 rounded-full opacity-40"></div>
//                 <div className="absolute top-1/2 left-1/4 w-2 h-8 bg-gray-600 opacity-50"></div>

//                 {/* Scanning line animation */}
//                 <div className="absolute inset-0 overflow-hidden">
//                   <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse absolute top-1/2 opacity-30"></div>
//                 </div>
//               </div>

//               {/* Video Controls Overlay */}
//               <div className="absolute top-2 left-2 flex items-center space-x-2">
//                 <div className="bg-red-500 w-2 h-2 rounded-full animate-pulse"></div>
//                 <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">REC</span>
//               </div>

//               {/* Feed Info */}
//               <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
//                 <div>{currentFeed.resolution} @ {currentFeed.fps}fps</div>
//                 <div className="flex items-center mt-1">
//                   <Wifi className="w-3 h-3 mr-1" />
//                   <span>{currentFeed.signal}%</span>
//                 </div>
//               </div>

//               {/* Timestamp */}
//               <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white font-mono">
//                 {new Date().toLocaleTimeString()}
//               </div>

//               {/* GPS Coordinates */}
//               <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white font-mono">
//                 {droneData?.[selectedFeed]?.location?.lat.toFixed(4)}, {droneData?.[selectedFeed]?.location?.lng.toFixed(4)}
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
//             <WifiOff className="w-8 h-8 mb-2" />
//             <span className="text-sm">Connection Lost</span>
//             <span className="text-xs">Attempting to reconnect...</span>
//             <div className="mt-2 w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
//               <div className="w-full h-full bg-orange-500 rounded-full animate-pulse"></div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Connection Status Indicators */}
//       <div className="flex items-center justify-between mt-2 px-1">
//         <div className="flex items-center space-x-4 text-xs">
//           <div className="flex items-center space-x-1">
//             <div className={`w-2 h-2 rounded-full ${droneData?.scout?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
//             <span className="text-gray-400">Scout</span>
//           </div>
//           <div className="flex items-center space-x-1">
//             <div className={`w-2 h-2 rounded-full ${droneData?.delivery?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
//             <span className="text-gray-400">Delivery</span>
//           </div>
//           <div className="flex items-center space-x-1">
//             <div className="w-2 h-2 rounded-full bg-green-500"></div>
//             <span className="text-gray-400">Ground Station</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LiveFeed;