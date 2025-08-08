import {create} from 'zustand';

const useStore = create((set) => ({
    // ROS connection URL
    videoConfig:{port:9000, host: 'localhost'},
    setVideoConfig: (config) => set({ videoConfig: config }),
    rosUrl: {port: 9090, host: 'localhost'},
    setRosUrl: (url) => set({ rosUrl: url }),
    boundary: {boundary: []},
    setBoundary: (boundary) => set({ boundary: boundary }),
    baseStationLocation: {latitude: 0, longitude: 0, altitude: 0},
    setBaseStationLocation: (location) => set({ baseStationLocation: location }),
    scoutHomeLocation: {latitude: 0, longitude: 0, altitude: 0},
    setScoutHomeLocation: (location) => set({ scoutHomeLocation: location }),
    deliveryHomeLocation: {latitude: 0, longitude: 0, altitude: 0},
    setDeliveryHomeLocation: (location) => set({ deliveryHomeLocation: location }),

}));

export default useStore;    