import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MissionControlDashboard from "./components/MissionControlDashboard";
import { Toaster } from 'sonner';

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MissionControlDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        theme="dark"
        richColors
        closeButton
      />
    </div>
  );
}

export default App;