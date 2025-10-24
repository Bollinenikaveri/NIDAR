import React, { useEffect, useRef, useState, useCallback } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function LiveFeed() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const retryRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [message, setMessage] = useState("Connecting...");
  const [now, setNow] = useState(new Date());

  // Update clock overlay every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const feed = {
    id: "scout",
    name: "Scout Drone",
    url: "http://192.168.1.7:8889/mystream/whep",
    resolution: "1920x1080",
    fps: 30,
  };

  // --- Optimized reconnect logic ---
  const reconnect = useCallback(() => {
    clearTimeout(retryRef.current);
    setReconnecting(true);
    setMessage("Reconnecting...");
    retryRef.current = setTimeout(() => connectStream(), 1500); // faster retry
  }, []);

  // --- Main WebRTC connect logic ---
  const connectStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!window.MediaMTXWebRTCReader) {
      setMessage("MediaMTXWebRTCReader not found. Ensure webrtc.js is loaded.");
      return;
    }

    // close any previous session
    readerRef.current?.close();

    setMessage("Negotiating WebRTC session...");
    setIsConnected(false);

    try {
      const reader = new window.MediaMTXWebRTCReader({
        url: feed.url,
        onError: (err) => {
          console.warn("Stream error:", err);
          setIsConnected(false);
          setMessage("Connection lost. Retrying...");
          reconnect();
        },
        onTrack: (evt) => {
          setIsConnected(true);
          setReconnecting(false);
          setMessage("");
          if (video) {
            video.srcObject = evt.streams[0];
            video.play().catch(() => {});
          }
        },
      });

      // Faster internal retry if supported
      reader.retryPause = 1000;
      readerRef.current = reader;
    } catch (err) {
      console.error("Error connecting to stream:", err);
      setIsConnected(false);
      setMessage("Failed to connect. Retrying...");
      reconnect();
    }
  }, [reconnect]);

  // --- Mount/unmount lifecycle ---
  useEffect(() => {
    connectStream();
    return () => {
      readerRef.current?.close();
      clearTimeout(retryRef.current);
    };
  }, [connectStream]);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-blue-400">
          Drone Live Feed
        </h3>
      </div>

      <div className="relative bg-gray-800 rounded-lg h-[calc(100%-3rem)] overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover rounded-lg"
        />

        {/* Overlay: Connected */}
        {isConnected && (
          <>
            <div className="absolute top-2 left-2 flex items-center space-x-2">
              <div className="bg-red-500 w-2 h-2 rounded-full animate-pulse" />
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                LIVE
              </span>
            </div>
            <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-1 text-xs text-white">
              <div>
                {feed.resolution} @ {feed.fps}fps
              </div>
              <div className="flex items-center mt-1">
                <Wifi className="w-3 h-3 mr-1 text-green-400" />
                Connected
              </div>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 text-xs text-white font-mono">
              {now.toLocaleTimeString()}
            </div>
          </>
        )}

        {/* Overlay: Connecting / Reconnecting */}
        {!isConnected && (
          <div className="flex flex-col items-center text-gray-400">
            <WifiOff className="w-8 h-8 mb-2" />
            <span className="text-sm">{reconnecting ? "Reconnecting..." : "Connecting..."}</span>
            <span className="text-xs">{message}</span>
            <div className="mt-2 w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className="w-full h-full bg-orange-500 rounded-full animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
