import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Persist selected settings to localStorage under key 'nidarSettings'
const useStore = create(
    persist(
        (set) => ({
            // ROS connection URL
            rosUrl: { port: 9090, host: 'localhost' },
            setRosUrl: (url) => set({ rosUrl: url }),

            boundary: { boundary: [] },
            setBoundary: (boundary) => set({ boundary }),

            baseStationLocation: { latitude: 0, longitude: 0, altitude: 0 },
            setBaseStationLocation: (location) => set({ baseStationLocation: location }),

            scoutHomeLocation: { latitude: 0, longitude: 0, altitude: 0 },
            setScoutHomeLocation: (location) => set({ scoutHomeLocation: location }),

            deliveryHomeLocation: { latitude: 0, longitude: 0, altitude: 0 },
            setDeliveryHomeLocation: (location) => set({ deliveryHomeLocation: location }),

            videoScoutStreamUrl: { host: 'localhost', port: 9000, path: '/scout' },
            setVideoScoutStreamUrl: (url) => set({ videoScoutStreamUrl: url }),

            videoDeliveryStreamUrl: { host: 'localhost', port: 9000, path: '/delivery' },
            setVideoDeliveryStreamUrl: (url) => set({ videoDeliveryStreamUrl: url }),

            // High-level persisted settings used by Header
            rosSettings: {
                host: 'localhost',
                port: 9090,
                connected: false,
                drones: [
                    { id: 'scout', name: 'Scout Drone', connected: false, topics: [] },
                    { id: 'delivery', name: 'Delivery Drone', connected: false, topics: [] }
                ],
                globalTopics: []
            },
            setRosSettings: (rs) => set({ rosSettings: rs }),

            videoSettings: {
                scoutDrone: { host: 'localhost', port: 9000, streamUrl: '/scout', connected: false },
                deliveryDrone: { host: 'localhost', port: 9000, streamUrl: '/delivery', connected: false }
            },
            setVideoSettings: (vs) => set({ videoSettings: vs }),

            timeSettings: { maxFlightTime: 30, currentFlightTime: 0, isActive: false },
            setTimeSettings: (ts) => set({ timeSettings: ts }),

            globalConnectionStatus: false,
            setGlobalConnectionStatus: (val) => set({ globalConnectionStatus: val })
        }),
        {
            name: 'nidarSettings', // localStorage key
            // only persist serializable parts (omit functions)
            partialize: (state) => ({
                rosSettings: state.rosSettings,
                videoSettings: state.videoSettings,
                timeSettings: state.timeSettings,
                globalConnectionStatus: state.globalConnectionStatus,
                // keep basic urls persisted as well
                rosUrl: state.rosUrl,
                videoScoutStreamUrl: state.videoScoutStreamUrl,
                videoDeliveryStreamUrl: state.videoDeliveryStreamUrl
            })
        }
    )
);

export default useStore;