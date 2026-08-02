// src/pages/LiveMap.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { nepalDistricts, getRandomCondition } from '../data/nepalDistricts';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Nepal bounds - strict focus
const NEPAL_BOUNDS = {
  southwest: [26.3, 80.0],
  northeast: [30.5, 88.2]
};

// Get marker color based on condition
const getMarkerColor = (condition) => {
  if (condition === 'Good') return '#22c55e';
  if (condition === 'Moderate') return '#eab308';
  if (condition === 'High Risk') return '#ef4444';
  return '#3b82f6';
};

// Get risk level emoji
const getRiskEmoji = (condition) => {
  if (condition === 'Good') return '🟢';
  if (condition === 'Moderate') return '🟡';
  if (condition === 'High Risk') return '🔴';
  return '⚪';
};

// Map Controller
function MapController({ selectedDistrict, setMapReady }) {
  const map = useMap();

  useEffect(() => {
    setMapReady(true);
    
    map.fitBounds([
      NEPAL_BOUNDS.southwest,
      NEPAL_BOUNDS.northeast
    ], {
      padding: [20, 20],
      maxZoom: 8
    });

    map.setMaxBounds([
      [25.5, 79.0],
      [31.5, 89.0]
    ]);
    
  }, [map, setMapReady]);

  useEffect(() => {
    if (selectedDistrict && selectedDistrict.position) {
      map.flyTo(selectedDistrict.position, 13, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [selectedDistrict, map]);

  return null;
}

// Component to handle zoom controls and events
function ZoomControl({ onZoomChange }) {
  const map = useMap();
  
  useEffect(() => {
    // Allow zooming to level 19 for detailed satellite view
    map.setMinZoom(7);
    map.setMaxZoom(19);
  }, [map]);

  useEffect(() => {
    const handleZoom = () => {
      const zoom = map.getZoom();
      if (onZoomChange) onZoomChange(zoom);
    };
    
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

const LiveMap = () => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mapStyle, setMapStyle] = useState('road');
  const [filterRegion, setFilterRegion] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(7.5);
  
  const searchInputRef = useRef(null);
  const timeoutRef = useRef(null);

  const regions = ['all', ...new Set(nepalDistricts.map(d => d.region))];

  const searchPlace = (value) => {
    setSearch(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (value.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const result = nepalDistricts.filter(place =>
      place.name.toLowerCase().includes(value.toLowerCase()) ||
      place.region.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(result);
    setShowSuggestions(result.length > 0);
  };

  const choosePlace = (place) => {
    if (!place || !place.position) {
      console.warn("⚠️ Selected place has no position data:", place);
      return;
    }
    setSelected(place);
    setSearch(place.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setMapError(null);
  };

  const handleInputBlur = () => {
    timeoutRef.current = setTimeout(() => setShowSuggestions(false), 300);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const filteredDistricts = filterRegion === 'all' 
    ? nepalDistricts 
    : nepalDistricts.filter(d => d.region === filterRegion);

  const validDistricts = filteredDistricts.filter(d => 
    d.position && 
    Array.isArray(d.position) && 
    d.position.length === 2
  );

  if (validDistricts.length !== filteredDistricts.length) {
    console.warn(`⚠️ Some districts have invalid coordinates. Valid: ${validDistricts.length}, Total: ${filteredDistricts.length}`);
  }

  const selectedDistrict = selected || nepalDistricts[0];

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <span>🗺️</span> Nepal Road Intelligence
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            {mapReady ? `✅ ${validDistricts.length} districts • Zoom: ${currentZoom.toFixed(1)}x` : '🔄 Loading map...'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
          {/* Map Style Toggle */}
          <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setMapStyle('road')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 ${
                mapStyle === 'road' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              🛣️ Road
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 ${
                mapStyle === 'satellite' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              🛰️ Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Map Style Indicator */}
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="text-gray-400">Current View:</span>
        <span className={`px-2 py-0.5 rounded-full ${
          mapStyle === 'road' 
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
        }`}>
          {mapStyle === 'road' ? '🛣️ Road Map' : '🛰️ Satellite Imagery'}
        </span>
        <span className="text-gray-500">|</span>
        <span className="text-gray-400">Zoom: {currentZoom.toFixed(1)}x</span>
        <span className="text-gray-500">|</span>
        <span className="text-gray-400">Click district to zoom in</span>
      </div>

      {/* Error Display */}
      {mapError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          ❌ {mapError}
        </div>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="relative z-[9999]">
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => searchPlace(e.target.value)}
            onBlur={handleInputBlur}
            placeholder="🔍 Search district or region..."
            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-all duration-300 text-sm"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1f2e] backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto z-[9999]">
              {suggestions.map((place, index) => (
                <div
                  key={index}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choosePlace(place)}
                  className="px-4 py-2.5 hover:bg-white/10 cursor-pointer transition-colors text-white flex items-center justify-between text-sm"
                >
                  <span>📍 {place.name}</span>
                  <span className="text-xs text-gray-400">{place.region}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-[100]">
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all duration-300 appearance-none cursor-pointer text-sm"
          >
            {regions.map(region => (
              <option key={region} value={region} className="bg-[#1a1f2e]">
                {region === 'all' ? '📍 All Regions' : region}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Container */}
      <div className="rounded-2xl overflow-hidden border border-white/10 relative z-[1] w-full" style={{ height: 'calc(100vh - 360px)', minHeight: '500px' }}>
        <MapContainer
          center={[28.3949, 84.1240]}
          zoom={7.5}
          minZoom={7}
          maxZoom={19}
          zoomControl={true}
          style={{ height: "100%", width: "100%" }}
          className="bg-[#05080f]"
        >
          <MapController 
            selectedDistrict={selected} 
            setMapReady={setMapReady}
          />
          <ZoomControl onZoomChange={setCurrentZoom} />

          {/* Tile Layers - Enhanced Satellite View */}
          {mapStyle === 'road' ? (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              maxZoom={19}
            />
          ) : (
            // High-resolution satellite imagery with full zoom
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              maxZoom={19}
              minZoom={7}
            />
          )}

          {/* District Markers */}
          {validDistricts.map((place, index) => {
            const condition = getRandomCondition();
            const color = getMarkerColor(condition);
            const riskEmoji = getRiskEmoji(condition);
            const isSelected = selected && selected.name === place.name;
            
            return (
              <div key={index}>
                <Marker 
                  position={place.position}
                  icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color:${isSelected ? '#3b82f6' : color}; width:${isSelected ? '18px' : '12px'}; height:${isSelected ? '18px' : '12px'}; border-radius:50%; border:2px solid white; box-shadow: ${isSelected ? '0 0 20px #3b82f680' : '0 0 10px ' + color + '40'}; ${isSelected ? 'animation: pulse 1.5s ease-in-out infinite;' : ''}"></div>`,
                    iconSize: [isSelected ? 18 : 12, isSelected ? 18 : 12],
                    iconAnchor: [isSelected ? 9 : 6, isSelected ? 9 : 6],
                  })}
                  eventHandlers={{
                    click: () => {
                      choosePlace(place);
                    }
                  }}
                >
                  <Popup>
                    <div className="text-black min-w-[200px]">
                      <h3 className="font-bold text-lg">{place.name}</h3>
                      <p className="text-sm text-gray-600">🏛️ {place.region}</p>
                      <div className="mt-2 space-y-1 text-sm border-t border-gray-100 pt-2">
                        <p>{riskEmoji} Condition: <span className="font-medium">{condition}</span></p>
                        <p>📊 Risk: <span className={`font-medium ${condition === 'High Risk' ? 'text-red-500' : condition === 'Moderate' ? 'text-yellow-500' : 'text-green-500'}`}>
                          {condition === 'High Risk' ? '⚠️ High' : condition === 'Moderate' ? '⚡ Moderate' : '✅ Low'}
                        </span></p>
                        <p className="text-xs text-gray-400">🕐 Updated: {new Date().toLocaleString()}</p>
                        <p className="text-xs text-blue-500 mt-1">🔍 Click to zoom in</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}

          {/* Selected District Highlight Circle */}
          {selected && selected.position && (
            <Circle
              center={selected.position}
              radius={2000}
              pathOptions={{ color: "#3b82f6", fillOpacity: 0.1 }}
            />
          )}
        </MapContainer>

        {/* Loading Overlay */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#05080f]/80 z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading Nepal map...</p>
            </div>
          </div>
        )}

        {/* Zoom Level Indicator on Map */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 z-[1000]">
          🔍 {currentZoom.toFixed(1)}x
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-4 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📍 {selectedDistrict.name}
            </h2>
            <span className="px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium text-sm">
              🏛️ {selectedDistrict.region}
            </span>
            <span className="px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 font-medium text-sm">
              ✅ Active
            </span>
            <span className="px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 font-medium text-sm">
              📊 {validDistricts.length} districts
            </span>
            <span className="px-3 py-1.5 rounded-full border border-gray-500/30 bg-gray-500/10 text-gray-400 font-medium text-sm">
              🔍 Zoom: {currentZoom.toFixed(1)}x
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              Live
            </span>
            <span className="text-xs text-gray-400">
              🕐 {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400"></span> Good
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Moderate
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400"></span> High Risk
        </span>
        <span className="text-gray-600">|</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span> Selected
        </span>
        <span className="text-gray-600">|</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> Click to zoom
        </span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-500">{validDistricts.length} districts • Nepal only</span>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .custom-div-icon {
          background: transparent;
          border: none;
        }
        .leaflet-control-container {
          z-index: 10 !important;
        }
        .leaflet-top, .leaflet-bottom {
          z-index: 10 !important;
        }
        .leaflet-popup-content {
          min-width: 200px !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
        }
        /* Enhanced zoom controls */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        .leaflet-control-zoom a {
          background: rgba(20, 30, 50, 0.9) !important;
          color: white !important;
          border-color: rgba(255,255,255,0.1) !important;
          backdrop-filter: blur(10px) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(59, 130, 246, 0.8) !important;
        }
      `}</style>
    </div>
  );
};

export default LiveMap;