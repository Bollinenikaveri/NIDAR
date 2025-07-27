import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MissionControlDashboard from "./components/MissionControlDashboard";

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MissionControlDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;