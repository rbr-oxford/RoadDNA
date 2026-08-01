// src/pages/Alerts.jsx
import React, { useState } from 'react';

const Alerts = () => {
  const [filter, setFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const alerts = [
    {
      id: 1,
      type: "Accident Alert",
      location: "Ring Road, Kathmandu",
      status: "High Risk",
      icon: "🚨",
      severity: "High",
      time: "2 minutes ago",
      description: "Multiple vehicle collision reported. Emergency services dispatched.",
      region: "Bagmati"
    },
    {
      id: 2,
      type: "Road Damage",
      location: "Prithvi Highway",
      status: "Moderate",
      icon: "⚠️",
      severity: "Medium",
      time: "15 minutes ago",
      description: "Sinkhole detected near km 45. Traffic diverted to alternative route.",
      region: "Gandaki"
    },
    {
      id: 3,
      type: "Weather Warning",
      location: "Pokhara Highway",
      status: "Heavy Rain",
      icon: "🌧️",
      severity: "Medium",
      time: "32 minutes ago",
      description: "Heavy rainfall causing reduced visibility. Drive with caution.",
      region: "Gandaki"
    },
    {
      id: 4,
      type: "Traffic Congestion",
      location: "New Baneshwor",
      status: "Slow Traffic",
      icon: "🚦",
      severity: "Low",
      time: "1 hour ago",
      description: "Heavy traffic due to ongoing construction. Expect delays of 30+ minutes.",
      region: "Bagmati"
    },
    {
      id: 5,
      type: "Landslide Warning",
      location: "Sindhupalchok",
      status: "High Risk",
      icon: "🏔️",
      severity: "High",
      time: "2 hours ago",
      description: "Potential landslide risk due to continuous rainfall. Road closure advised.",
      region: "Bagmati"
    },
  ];

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity.toLowerCase() === filter);

  const stats = [
    { label: 'Active Alerts', value: alerts.length, color: 'text-blue-400' },
    { label: 'High Risk', value: alerts.filter(a => a.severity === 'High').length, color: 'text-red-400' },
    { label: 'Medium Risk', value: alerts.filter(a => a.severity === 'Medium').length, color: 'text-yellow-400' },
    { label: 'Low Risk', value: alerts.filter(a => a.severity === 'Low').length, color: 'text-green-400' },
  ];

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <span>🔔</span> Smart Alerts
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI-powered road safety notifications</p>
        </div>
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <span className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Real-time monitoring
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="p-3 md:p-4 bg-white/5 rounded-xl border border-white/10 text-center hover:border-white/20 transition-all duration-300">
            <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          All Alerts
        </button>
        {['High', 'Medium', 'Low'].map(level => (
          <button
            key={level}
            onClick={() => setFilter(level.toLowerCase())}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              filter === level.toLowerCase() 
                ? level === 'High' ? 'bg-red-600 text-white' :
                  level === 'Medium' ? 'bg-yellow-600 text-white' :
                  'bg-green-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {level} Risk
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`group relative bg-white/5 backdrop-blur-xl border rounded-2xl p-5 md:p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl cursor-pointer overflow-hidden ${
              alert.severity === 'High' ? 'border-red-500/30 hover:border-red-500/50' :
              alert.severity === 'Medium' ? 'border-yellow-500/30 hover:border-yellow-500/50' :
              'border-green-500/30 hover:border-green-500/50'
            }`}
            onClick={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)}
          >
            <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-500 blur-2xl ${
              alert.severity === 'High' ? 'from-red-500 to-orange-500' :
              alert.severity === 'Medium' ? 'from-yellow-500 to-orange-500' :
              'from-green-500 to-emerald-500'
            }`}></div>
            
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">
                  {alert.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-white">{alert.type}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      alert.severity === 'High' ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
                      alert.severity === 'Medium' ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400' :
                      'bg-green-500/20 border border-green-500/30 text-green-400'
                    }`}>
                      {alert.severity} Risk
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                      {alert.region}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">📍 {alert.location}</p>
                  <p className="text-gray-400 text-sm mt-1 hidden sm:block">{alert.description}</p>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 text-xs text-gray-400">
                    <span>🕐 {alert.time}</span>
                    <span>•</span>
                    <span>⚡ AI Detected</span>
                    <span>•</span>
                    <span className="text-blue-400 group-hover:text-blue-300 transition-colors">View Details →</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-2xl ${
                    alert.severity === 'High' ? 'text-red-400 animate-pulse' :
                    alert.severity === 'Medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {alert.severity === 'High' ? '🔴' : alert.severity === 'Medium' ? '🟡' : '🟢'}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedAlert === alert.id && (
                <div className="mt-4 p-4 bg-[#0d1117] rounded-xl border border-white/5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-gray-400">Time Detected</div>
                      <div className="text-white text-sm">{alert.time}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Region</div>
                      <div className="text-white text-sm">{alert.region}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Status</div>
                      <div className="text-white text-sm">{alert.status}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Action Required</div>
                      <div className="text-yellow-400 text-sm">Immediate</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-600/30 transition-all duration-300 text-sm">
                      🗺️ View on Map
                    </button>
                    <button className="px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-600/30 transition-all duration-300 text-sm">
                      ✅ Acknowledge
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;