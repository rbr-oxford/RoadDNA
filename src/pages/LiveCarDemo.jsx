// src/pages/LiveCarDemo.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from "react-leaflet";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { 
  sendESP32Command, 
  startESP32Stream, 
  stopESP32Stream, 
  checkESP32Connection,
  getESP32IP 
} from '../services/esp32Service';
import { askAI } from '../services/aiService';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const carIcon = L.divIcon({
  className: 'custom-car-icon',
  html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 30px rgba(59, 130, 246, 0.8); display: flex; align-items: center; justify-content: center; font-size: 14px;">🚗</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const potholeIcon = L.divIcon({
  className: 'custom-pothole-icon',
  html: `<div style="background: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 30px rgba(239, 68, 68, 0.9); animation: pulse 1.5s ease-in-out infinite;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const LiveCarDemo = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [potholes, setPotholes] = useState([]);
  const [path, setPath] = useState([]);
  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]);
  const [stats, setStats] = useState({
    totalPotholes: 0,
    smoothCount: 0,
    roughCount: 0,
    criticalAlerts: 0
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const streamRef = useRef(null);
  const lastPotholeRef = useRef(0);
  const pathCounterRef = useRef(0);
  const lastAlertTimeRef = useRef(0);
  const speechSynthRef = useRef(null);
  const utteranceQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);

  // Check if speech synthesis is supported
  useEffect(() => {
    const checkVoiceSupport = () => {
      if ('speechSynthesis' in window) {
        setIsVoiceSupported(true);
        speechSynthRef.current = window.speechSynthesis;
        // Pre-load voices
        window.speechSynthesis.getVoices();
        // Some browsers need this to load voices
        setTimeout(() => {
          window.speechSynthesis.getVoices();
        }, 100);
      } else {
        setIsVoiceSupported(false);
        console.warn('Speech synthesis not supported in this browser');
      }
    };
    checkVoiceSupport();
  }, []);

  // Speak text using speech synthesis
  const speakAlert = (text, priority = 'normal') => {
    if (!voiceEnabled || !isVoiceSupported || !speechSynthRef.current) {
      console.log('Voice disabled or not supported:', text);
      return;
    }
    
    // Cancel any ongoing speech
    if (speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = priority === 'critical' ? 0.85 : 1.0;
    utterance.pitch = priority === 'critical' ? 1.1 : 1.0;
    utterance.volume = 1;
    
    // Try to get a voice
    const voices = speechSynthRef.current.getVoices();
    if (voices.length > 0) {
      // Try to find a female voice or use first available
      const femaleVoice = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('female'));
      utterance.voice = femaleVoice || voices[0];
    }
    
    utterance.onend = () => {
      isSpeakingRef.current = false;
    };
    
    utterance.onerror = (e) => {
      console.warn('Speech error:', e);
      isSpeakingRef.current = false;
    };
    
    // Small delay to ensure browser is ready
    setTimeout(() => {
      try {
        speechSynthRef.current.speak(utterance);
        isSpeakingRef.current = true;
      } catch (e) {
        console.warn('Speak error:', e);
      }
    }, 50);
  };

  // Enable voice (must be triggered by user interaction)
  const enableVoice = () => {
    if (!isVoiceSupported) {
      alert('Voice alerts are not supported in this browser. Please use Safari on iOS or Chrome on Android.');
      return;
    }
    
    setVoiceEnabled(true);
    
    // Trigger a silent speech to enable audio on iOS
    const dummyUtterance = new SpeechSynthesisUtterance(' ');
    dummyUtterance.volume = 0;
    dummyUtterance.onend = () => {
      console.log('🔊 Voice enabled successfully');
    };
    speechSynthRef.current.speak(dummyUtterance);
    
    // Also speak a confirmation
    setTimeout(() => {
      speakAlert('Voice alerts activated', 'normal');
    }, 500);
  };

  // Disable voice
  const disableVoice = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setVoiceEnabled(false);
    isSpeakingRef.current = false;
  };

  // AI Route Suggestion
  const getAIRouteSuggestion = async (problem, location) => {
    setIsAiThinking(true);
    const question = `I'm driving in Nepal at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}. ${problem}. Suggest an alternate route and safety advice. Keep it short (2-3 sentences).`;
    
    try {
      const response = await askAI(question);
      setAiSuggestion(response);
      
      // Speak the suggestion if voice is enabled
      if (voiceEnabled) {
        speakAlert(response, 'normal');
      }
      
      // Add to alert history
      setAlertHistory(prev => [{
        id: Date.now(),
        type: 'ai_suggestion',
        message: response,
        location: location,
        time: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 20));
      
    } catch (error) {
      console.error('AI Error:', error);
    }
    setIsAiThinking(false);
  };

  // Critical Alert Handler
  const handleCriticalAlert = (message, location) => {
    const now = Date.now();
    if (now - lastAlertTimeRef.current < 10000) return; // 10 second cooldown
    lastAlertTimeRef.current = now;
    
    // Speak critical alert if voice enabled
    if (voiceEnabled) {
      speakAlert(`⚠️ ${message}`, 'critical');
    }
    
    // Update stats
    setStats(prev => ({
      ...prev,
      criticalAlerts: prev.criticalAlerts + 1
    }));
    
    // Add to alert history
    setAlertHistory(prev => [{
      id: Date.now(),
      type: 'critical',
      message: message,
      location: location,
      time: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 20));
    
    // Get AI route suggestion
    getAIRouteSuggestion(message, location);
  };

  // Pothole detection with AI
  const handlePotholeDetection = (data) => {
    if (data.road === 'POTHOLE') {
      const now = Date.now();
      if (now - lastPotholeRef.current > 2000) {
        lastPotholeRef.current = now;
        
        const location = { lat: data.latitude, lng: data.longitude };
        setPotholes(prev => [...prev, {
          lat: data.latitude,
          lng: data.longitude,
          time: new Date().toLocaleTimeString(),
          vibration: data.vibration || 0
        }]);
        
        setStats(prev => ({
          ...prev,
          totalPotholes: prev.totalPotholes + 1
        }));
        
        // Check if pothole is severe (high vibration)
        if (data.vibration > 12) {
          handleCriticalAlert(
            `Severe pothole detected with ${data.vibration.toFixed(1)} vibration. Road damage significant.`,
            location
          );
        } else if (data.vibration > 8 && voiceEnabled) {
          speakAlert(`Pothole detected ahead, please drive carefully.`, 'normal');
        }
      }
    }
  };

  // Monitor for continuous rough road
  useEffect(() => {
    if (currentData?.road === 'ROUGH' && currentData?.vehicle !== 'STOP') {
      const roughCount = stats.roughCount;
      if (roughCount > 0 && roughCount % 10 === 0) {
        handleCriticalAlert(
          `Persistent rough road detected. Consider alternate route for better driving conditions.`,
          { lat: currentData.latitude, lng: currentData.longitude }
        );
      }
    }
  }, [currentData?.road, stats.roughCount]);

  // Monitor for motor lock
  useEffect(() => {
    if (currentData?.motor_locked) {
      handleCriticalAlert(
        `Emergency stop activated. Motors are locked. Please check vehicle immediately.`,
        { lat: currentData.latitude, lng: currentData.longitude }
      );
    }
  }, [currentData?.motor_locked]);

  const connectESP32 = async () => {
    setConnectionError(null);
    setIsConnecting(true);
    
    const connected = await checkESP32Connection();
    
    if (connected) {
      setIsConnected(true);
      setIsStreaming(true);
      
      streamRef.current = startESP32Stream(
        (data) => {
          setCurrentData(data);
          setMapCenter([data.latitude, data.longitude]);
          
          pathCounterRef.current++;
          if (pathCounterRef.current % 3 === 0) {
            setPath(prev => [...prev, [data.latitude, data.longitude]].slice(-200));
          }
          
          handlePotholeDetection(data);
          
          setStats(prev => {
            const newStats = { ...prev };
            if (data.road === 'SMOOTH') newStats.smoothCount++;
            if (data.road === 'ROUGH') newStats.roughCount++;
            return newStats;
          });
        },
        (error) => {
          setConnectionError(error);
          setIsConnected(false);
          setIsStreaming(false);
        }
      );
    } else {
      setConnectionError(`❌ ESP32 not found at ${getESP32IP()}`);
      setIsConnected(false);
      setIsStreaming(false);
    }
    setIsConnecting(false);
  };

  const disconnectESP32 = () => {
    if (streamRef.current) {
      stopESP32Stream(streamRef.current);
      streamRef.current = null;
    }
    sendESP32Command('emergencystop');
    setIsStreaming(false);
    setIsConnected(false);
    setCurrentData(null);
    setConnectionError(null);
    pathCounterRef.current = 0;
  };

  const sendCommand = async (command) => {
    if (!isConnected) {
      setConnectionError('❌ Not connected to ESP32');
      return;
    }
    await sendESP32Command(command);
  };

  const clearData = () => {
    setPotholes([]);
    setPath([]);
    setStats({
      totalPotholes: 0,
      smoothCount: 0,
      roughCount: 0,
      criticalAlerts: 0
    });
    setAlertHistory([]);
    setAiSuggestion(null);
    lastPotholeRef.current = 0;
    pathCounterRef.current = 0;
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <span>🚗</span> Vehicle Monitor
          </h1>
          <p className="text-gray-400 text-sm">AI-powered monitoring • Voice alerts • Route suggestions</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
            isConnected 
              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
          
          {!isStreaming ? (
            <button
              onClick={connectESP32}
              disabled={isConnecting}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-80 transition-all disabled:opacity-50"
            >
              {isConnecting ? '⏳ Connecting...' : '🔗 Connect'}
            </button>
          ) : (
            <button
              onClick={disconnectESP32}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:opacity-80 transition-all"
            >
              ⏹️ Disconnect
            </button>
          )}
          
          <button
            onClick={clearData}
            className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-xl text-sm font-medium hover:text-white hover:bg-white/10 transition-all"
          >
            🗑️ Clear
          </button>

          {/* Voice Toggle Button */}
          <button
            onClick={voiceEnabled ? disableVoice : enableVoice}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              voiceEnabled 
                ? 'bg-green-600/30 border border-green-500/30 text-green-400'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {voiceEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
          </button>
        </div>
      </div>

      {/* Voice Status Banner */}
      {!voiceEnabled && isVoiceSupported && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔇</span>
            <div>
              <div className="text-yellow-400 text-sm font-semibold">Voice Alerts Disabled</div>
              <div className="text-gray-400 text-xs">Tap "Voice ON" to enable audio alerts for iPhone</div>
            </div>
          </div>
          <button
            onClick={enableVoice}
            className="px-4 py-1.5 bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm hover:bg-yellow-600/50 transition-all"
          >
            Enable Voice
          </button>
        </div>
      )}

      {!isVoiceSupported && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="text-red-400 text-sm font-semibold">Voice Not Supported</div>
              <div className="text-gray-400 text-xs">Your browser doesn't support voice alerts. Please use Safari on iOS or Chrome.</div>
            </div>
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="mb-4 flex items-center gap-3 text-xs flex-wrap">
        <span className="text-gray-400">ESP32:</span>
        <span className="text-blue-400 font-mono">{getESP32IP()}</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-400">Status:</span>
        <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
        {currentData?.calibrated && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-green-400">✅ Calibrated</span>
          </>
        )}
        {currentData?.motor_locked && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-red-400 animate-pulse">🔒 LOCKED</span>
          </>
        )}
        {isAiThinking && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-purple-400 animate-pulse">🧠 AI Thinking...</span>
          </>
        )}
        {voiceEnabled && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-green-400 animate-pulse">🔊 Voice Active</span>
          </>
        )}
      </div>

      {/* AI Suggestion Banner */}
      {aiSuggestion && (
        <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <div className="text-purple-400 text-sm font-semibold">AI Route Suggestion</div>
              <div className="text-gray-300 text-sm">{aiSuggestion}</div>
            </div>
            <button 
              onClick={() => setAiSuggestion(null)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {connectionError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {connectionError}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Status', value: currentData?.vehicle || '—', icon: '🚦', color: 'text-blue-400' },
          { label: 'Road', value: currentData?.road || '—', icon: '🛣️', 
            color: currentData?.road === 'POTHOLE' ? 'text-red-400' : 
                   currentData?.road === 'ROUGH' ? 'text-yellow-400' : 'text-green-400' },
          { label: 'Potholes', value: stats.totalPotholes, icon: '⚠️', color: 'text-red-400' },
          { label: 'Critical', value: stats.criticalAlerts, icon: '🚨', color: 'text-red-400 animate-pulse' },
          { label: 'Vibration', value: currentData?.vibration?.toFixed(2) || '0.00', icon: '📊', color: 'text-purple-400' },
          { label: 'Path', value: path.length, icon: '📍', color: 'text-cyan-400' },
        ].map((stat, index) => (
          <div key={index} className="p-3 md:p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-center hover:border-white/20 transition-all">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className={`text-lg md:text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden" style={{ height: '500px' }}>
          <MapContainer
            center={mapCenter}
            zoom={17}
            style={{ height: '100%', width: '100%' }}
            className="bg-[#05080f]"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {currentData && (
              <>
                <Marker position={[currentData.latitude, currentData.longitude]} icon={carIcon}>
                  <Popup>
                    <div className="text-black min-w-[200px]">
                      <h3 className="font-bold">🚗 Vehicle</h3>
                      <p className="text-sm">Status: <span className="font-medium">{currentData.vehicle}</span></p>
                      <p className="text-sm">Road: <span className={`font-medium ${
                        currentData.road === 'POTHOLE' ? 'text-red-500' :
                        currentData.road === 'ROUGH' ? 'text-yellow-500' : 'text-green-500'
                      }`}>{currentData.road}</span></p>
                      <p className="text-xs text-gray-400">Vibration: {currentData.vibration?.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">📍 {currentData.latitude.toFixed(6)}, {currentData.longitude.toFixed(6)}</p>
                    </div>
                  </Popup>
                </Marker>

                <Circle
                  center={[currentData.latitude, currentData.longitude]}
                  radius={20}
                  pathOptions={{ color: '#3b82f6', fillOpacity: 0.2 }}
                />
              </>
            )}

            {path.length > 1 && (
              <Polyline 
                positions={path} 
                color="#3b82f6" 
                weight={3}
                opacity={0.6}
              />
            )}

            {potholes.map((pothole, index) => (
              <Marker 
                key={index} 
                position={[pothole.lat, pothole.lng]} 
                icon={potholeIcon}
              >
                <Popup>
                  <div className="text-black min-w-[180px]">
                    <h3 className="font-bold text-red-500">🚨 Pothole</h3>
                    <p className="text-sm">Time: {pothole.time}</p>
                    <p className="text-sm">Vibration: {pothole.vibration?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">📍 {pothole.lat.toFixed(6)}, {pothole.lng.toFixed(6)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Control Panel + AI */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            🎮 Controls
            {isConnected && <span className="text-xs text-green-400 animate-pulse">● LIVE</span>}
          </h2>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div></div>
            <button 
              onClick={() => sendCommand('forward')}
              className="p-4 bg-blue-600/30 hover:bg-blue-600/50 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConnected}
            >
              ⬆️
            </button>
            <div></div>
            
            <button 
              onClick={() => sendCommand('left')}
              className="p-4 bg-cyan-600/30 hover:bg-cyan-600/50 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConnected}
            >
              ⬅️
            </button>
            <button 
              onClick={() => sendCommand('stop')}
              className="p-4 bg-red-600/30 hover:bg-red-600/50 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConnected}
            >
              ⏹️
            </button>
            <button 
              onClick={() => sendCommand('right')}
              className="p-4 bg-cyan-600/30 hover:bg-cyan-600/50 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConnected}
            >
              ➡️
            </button>
            
            <div></div>
            <button 
              onClick={() => sendCommand('backward')}
              className="p-4 bg-orange-600/30 hover:bg-orange-600/50 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConnected}
            >
              ⬇️
            </button>
            <div></div>
          </div>

          {/* Emergency Controls */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button 
              onClick={() => sendCommand('emergencystop')}
              className="p-3 bg-red-600/40 hover:bg-red-600/60 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConnected}
            >
              🛑 Emergency Stop
            </button>
            <button 
              onClick={() => sendCommand('unlock')}
              className="p-3 bg-green-600/40 hover:bg-green-600/60 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConnected}
            >
              🔓 Unlock
            </button>
          </div>

          {/* AI Status */}
          <div className={`p-3 rounded-xl mb-3 ${
            voiceEnabled ? 'bg-green-500/10 border border-green-500/20' : 'bg-purple-500/10 border border-purple-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{voiceEnabled ? '🔊' : '🔇'}</span>
              <div>
                <div className={`text-sm font-semibold ${voiceEnabled ? 'text-green-400' : 'text-purple-400'}`}>
                  {voiceEnabled ? 'Voice Alerts Active' : 'AI Assistant'}
                </div>
                <div className="text-xs text-gray-400">
                  {voiceEnabled 
                    ? 'Listening for critical alerts' 
                    : isAiThinking ? 'Analyzing...' : 'Monitoring for emergencies'}
                </div>
              </div>
              {isAiThinking && (
                <div className="ml-auto">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse inline-block"></span>
                </div>
              )}
              {voiceEnabled && (
                <div className="ml-auto">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                </div>
              )}
            </div>
          </div>

          {/* Live Data */}
          {currentData ? (
            <div className="space-y-2">
              <div className="p-2 bg-[#0d1117] rounded-lg border border-white/5">
                <div className="text-xs text-gray-400">Vehicle</div>
                <div className="text-white font-bold">{currentData.vehicle}</div>
              </div>
              <div className="p-2 bg-[#0d1117] rounded-lg border border-white/5">
                <div className="text-xs text-gray-400">Road</div>
                <div className={`font-bold ${
                  currentData.road === 'POTHOLE' ? 'text-red-400 animate-pulse' :
                  currentData.road === 'ROUGH' ? 'text-yellow-400' : 'text-green-400'
                }`}>{currentData.road}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-[#0d1117] rounded-lg border border-white/5">
                  <div className="text-xs text-gray-400">Vibration</div>
                  <div className="text-white font-bold">{currentData.vibration?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="p-2 bg-[#0d1117] rounded-lg border border-white/5">
                  <div className="text-xs text-gray-400">Path</div>
                  <div className="text-cyan-400 font-bold">{path.length}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-6">
              <div className="text-4xl mb-2">🔌</div>
              <p>Connect to vehicle</p>
            </div>
          )}

          {/* Pothole Alert */}
          {stats.totalPotholes > 0 && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="text-red-400 text-sm font-bold flex items-center gap-2">
                <span>⚠️</span> {stats.totalPotholes} Pothole{stats.totalPotholes > 1 ? 's' : ''} Detected
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert History */}
      {alertHistory.length > 0 && (
        <div className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            📋 Alert History ({alertHistory.length})
            <span className="text-xs text-gray-400">AI-powered notifications</span>
          </h2>
          <div className="max-h-[120px] overflow-y-auto space-y-1.5">
            {alertHistory.map((alert) => (
              <div key={alert.id} className={`flex items-center justify-between p-2 rounded-lg border ${
                alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                alert.type === 'ai_suggestion' ? 'bg-purple-500/10 border-purple-500/30' :
                'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <div className="flex-1">
                  <div className="text-white text-sm">{alert.message}</div>
                  <div className="text-xs text-gray-400">
                    {alert.location ? `📍 ${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}` : ''}
                  </div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <div className={`text-xs font-bold ${
                    alert.type === 'critical' ? 'text-red-400' :
                    alert.type === 'ai_suggestion' ? 'text-purple-400' :
                    'text-yellow-400'
                  }`}>
                    {alert.type === 'critical' ? '🚨 CRITICAL' :
                     alert.type === 'ai_suggestion' ? '🧠 AI' :
                     '⚠️ ALERT'}
                  </div>
                  <div className="text-xs text-gray-500">{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pothole Log */}
      {potholes.length > 0 && (
        <div className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            📋 Pothole Log ({potholes.length})
          </h2>
          <div className="max-h-[120px] overflow-y-auto space-y-1.5">
            {potholes.slice().reverse().map((pothole, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-[#0d1117] rounded-lg border border-white/5">
                <div>
                  <div className="text-white text-sm">📍 {pothole.lat.toFixed(6)}, {pothole.lng.toFixed(6)}</div>
                  <div className="text-xs text-gray-400">Vibration: {pothole.vibration?.toFixed(1)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-red-400">🚨 Pothole</div>
                  <div className="text-xs text-gray-400">{pothole.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .custom-car-icon, .custom-pothole-icon {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content {
          min-width: 200px !important;
        }
        button {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -webkit-touch-callout: none;
        }
        .alert-history-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .alert-history-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .alert-history-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default LiveCarDemo;