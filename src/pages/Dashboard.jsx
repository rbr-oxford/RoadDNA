// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { nepalDistricts } from '../data/nepalDistricts';
import AIAssistant from '../components/AIAssistant';

const Dashboard = () => {
  const [time, setTime] = useState('');
  const [activeAlerts, setActiveAlerts] = useState(4);
  const [totalRoads] = useState(128);
  const [aiStatus] = useState('Online');
  const [sensors] = useState(342);
  const [trafficPrediction, setTrafficPrediction] = useState('Peak at 5 PM');
  const [accidentRisk, setAccidentRisk] = useState('Low (8%)');
  const [aiConfidence, setAiConfidence] = useState('94%');
  const [recentAlerts, setRecentAlerts] = useState([
    { type: '🚨 Accident', location: 'Ring Road, Kathmandu', time: '2 min ago', severity: 'High' },
    { type: '⚠️ Road Damage', location: 'Prithvi Highway', time: '15 min ago', severity: 'Medium' },
    { type: '🌧️ Weather Warning', location: 'Pokhara Highway', time: '32 min ago', severity: 'Medium' },
    { type: '🚦 Traffic Congestion', location: 'New Baneshwor', time: '1 hour ago', severity: 'Low' },
  ]);
  const [systemHealth, setSystemHealth] = useState([
    { name: 'GPS Network', status: 'Operational', uptime: '99.9%' },
    { name: 'AI Models', status: 'Active', uptime: '100%' },
    { name: 'Data Pipeline', status: 'Running', uptime: '99.8%' },
    { name: 'Weather API', status: 'Connected', uptime: '98.5%' },
  ]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time updates
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const hours = new Date().getHours();
      if (hours >= 17 && hours <= 19) {
        setTrafficPrediction('🔴 Peak Traffic (5-7 PM)');
      } else if (hours >= 8 && hours <= 10) {
        setTrafficPrediction('🟡 Morning Rush (8-10 AM)');
      } else {
        setTrafficPrediction('🟢 Normal Traffic');
      }

      const risk = Math.floor(Math.random() * 15 + 5);
      setAccidentRisk(`${risk}% Risk`);

      const confidence = Math.floor(Math.random() * 10 + 90);
      setAiConfidence(`${confidence}%`);

      const alertTypes = ['🚨 Accident', '⚠️ Road Damage', '🌧️ Weather Warning', '🚦 Traffic Congestion'];
      const locations = ['Ring Road, Kathmandu', 'Prithvi Highway', 'Pokhara Highway', 'New Baneshwor', 'Koteshwor'];
      const severities = ['High', 'Medium', 'Low'];
      
      setRecentAlerts(prev => {
        const newAlert = {
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          time: 'Just now',
          severity: severities[Math.floor(Math.random() * severities.length)]
        };
        return [newAlert, ...prev.slice(0, 3)];
      });

      setSystemHealth(prev => prev.map(item => ({
        ...item,
        uptime: `${(Math.random() * 0.5 + 99.5).toFixed(1)}%`,
        status: Math.random() > 0.9 ? 'Degraded' : item.status
      })));

      setActiveAlerts(Math.floor(Math.random() * 6 + 2));

    }, 10000);
    return () => clearInterval(updateInterval);
  }, []);

  const stats = [
    { title: 'Active Alerts', value: activeAlerts, icon: '🚨', color: 'from-red-500 to-orange-500', change: '+2', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
    { title: 'Roads Monitored', value: totalRoads, icon: '🛣️', color: 'from-blue-500 to-cyan-500', change: '+5', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    { title: 'AI Status', value: aiStatus, icon: '🧠', color: 'from-green-500 to-emerald-500', change: '● Online', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
    { title: 'Active Sensors', value: sensors, icon: '📡', color: 'from-purple-500 to-pink-500', change: '+12', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <span>🎯</span> Command Center
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Nepal's AI-Powered Road Intelligence System</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-green-400 text-xs font-mono">SYSTEM ONLINE</span>
          </div>
          <div className="text-gray-400 font-mono text-xs bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            🕐 {time}
          </div>
        </div>
      </div>

      {/* Stats Grid - 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`group relative ${stat.bgColor} backdrop-blur-xl border ${stat.borderColor} rounded-2xl p-5 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`}></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-3xl md:text-4xl">{stat.icon}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  stat.change.includes('+') ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-2">{stat.title}</h3>
              <p className="text-2xl md:text-3xl font-bold text-white mt-0.5">{stat.value}</p>
              <div className="mt-2 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-1000`} style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">🗺️ Live Map</h2>
            <Link to="/livemap" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View Full <span className="text-sm">→</span>
            </Link>
          </div>
          <div className="h-[170px] bg-[#0d1117] rounded-xl overflow-hidden border border-white/5 relative flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-2">🇳🇵</div>
              <div className="text-white font-semibold text-sm">Nepal Road Network</div>
              <div className="text-gray-400 text-xs mt-1">{nepalDistricts.length} Districts</div>
              <div className="mt-3 flex items-center justify-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span> Good
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Moderate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span> Risk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-300">
          <h2 className="text-lg font-semibold text-white mb-3">🤖 AI Analysis</h2>
          <div className="space-y-3">
            <div className="p-3 bg-[#0d1117] rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Traffic</span>
                <span className={`text-xs ${trafficPrediction.includes('Peak') ? 'text-red-400' : trafficPrediction.includes('Normal') ? 'text-green-400' : 'text-yellow-400'}`}>
                  {trafficPrediction}
                </span>
              </div>
              <div className="mt-1.5 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full ${trafficPrediction.includes('Peak') ? 'bg-gradient-to-r from-red-400 to-orange-400' : trafficPrediction.includes('Normal') ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-yellow-400 to-orange-400'}`} 
                     style={{ width: trafficPrediction.includes('Peak') ? '90%' : trafficPrediction.includes('Rush') ? '70%' : '40%' }}></div>
              </div>
            </div>
            <div className="p-3 bg-[#0d1117] rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Risk</span>
                <span className={`text-xs ${parseInt(accidentRisk) > 15 ? 'text-red-400' : parseInt(accidentRisk) > 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {accidentRisk}
                </span>
              </div>
              <div className="mt-1.5 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full ${parseInt(accidentRisk) > 15 ? 'bg-gradient-to-r from-red-400 to-orange-400' : parseInt(accidentRisk) > 10 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-green-400 to-emerald-400'}`} 
                     style={{ width: parseInt(accidentRisk) }}></div>
              </div>
            </div>
            <div className="p-3 bg-[#0d1117] rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">AI Confidence</span>
                <span className="text-blue-400 text-xs">{aiConfidence}</span>
              </div>
              <div className="mt-1.5 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-1.5 rounded-full" style={{ width: aiConfidence.replace('%', '') }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div>
          <AIAssistant />
        </div>
      </div>

      {/* Recent Alerts & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-red-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">🔔 Recent Alerts</h2>
            <Link to="/alerts" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View All <span className="text-sm">→</span>
            </Link>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {recentAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-2.5 bg-[#0d1117] rounded-xl border border-white/5 hover:bg-white/5 transition-all duration-300">
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{alert.type}</div>
                  <div className="text-gray-400 text-xs truncate">📍 {alert.location}</div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    alert.severity === 'High' ? 'bg-red-500/20 text-red-400' :
                    alert.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {alert.severity}
                  </span>
                  <div className="text-xs text-gray-500 mt-0.5">{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-green-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">🛡️ System Health</h2>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              Live
            </span>
          </div>
          <div className="space-y-2">
            {systemHealth.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2.5 bg-[#0d1117] rounded-xl border border-white/5">
                <div>
                  <div className="text-white text-sm font-medium">{item.name}</div>
                  <div className="text-gray-400 text-xs">{item.uptime} uptime</div>
                </div>
                <span className={`text-xs px-3 py-0.5 rounded-full ${
                  item.status === 'Operational' || item.status === 'Active' || item.status === 'Running' || item.status === 'Connected'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
        {[
          { label: 'Districts', value: '77', color: 'text-white' },
          { label: 'Active Users', value: '1,284', color: 'text-blue-400' },
          { label: 'Uptime', value: '99.9%', color: 'text-green-400' },
          { label: 'Latency', value: '12ms', color: 'text-purple-400' },
        ].map((item, index) => (
          <div key={index} className="p-3 md:p-4 bg-white/5 rounded-xl border border-white/5 text-center hover:border-white/10 transition-all duration-300">
            <div className={`text-xl md:text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;