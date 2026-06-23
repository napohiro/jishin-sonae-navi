import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import RiskMap from "./pages/RiskMap";
import PrepCheck from "./pages/PrepCheck";
import EmergencyMode from "./components/EmergencyMode";
import "./index.css";

export default function App() {
  const [showEmergency, setShowEmergency] = useState(false);

  return (
    <BrowserRouter>
      <div className="app">
        <Header onEmergency={() => setShowEmergency(true)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/risk-map" element={<RiskMap />} />
            <Route path="/prep-check" element={<PrepCheck />} />
          </Routes>
        </main>
        {showEmergency && (
          <EmergencyMode onClose={() => setShowEmergency(false)} />
        )}
      </div>
    </BrowserRouter>
  );
}
