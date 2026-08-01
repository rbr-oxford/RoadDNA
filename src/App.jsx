// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import LiveMap from "./pages/LiveMap";
import Analytical from "./pages/Analytical";
import Alerts from "./pages/Alerts";
import LiveCarDemo from "./pages/LiveCarDemo";

import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/livemap" element={<LiveMap />} />
        <Route path="/analytical" element={<Analytical />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/livecar" element={<LiveCarDemo />} />
      </Route>
    </Routes>
  );
}

export default App;