// src/pages/Analytical.jsx
import React, { useState } from 'react';
import { nepalDistricts } from '../data/nepalDistricts';

const Analytical = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('traffic');

  const metrics = [
    { title: 'Traffic Prediction', value: 'Peak at 5 PM', icon: '🚦', color: 'from-blue-500 to-cyan-500', change: '+12%' },
    { title: 'Accident Probability', value: '8% Risk', icon: '⚠️', color: 'from-red-500 to-orange-500', change: '-2%' },
    { title: 'Road Condition', value: 'Good', icon: '🛣️', color: 'from-green-500 to-emerald-500', change: 'Stable' },
    { title: 'AI Confidence', value: '94%', icon: '🧠', color: 'from-purple-500 to-pink-500', change: '+1.2%' },
  ];

  const predictions = [
    { time: 'Now', traffic: 65, accidents: 2, confidence: 92 },
    { time: '1h', traffic: 78, accidents: 4, confidence: 88 },
    { time: '2h', traffic: 82, accidents: 5, confidence: 85 },
    { time: '3h', traffic: 90, accidents: 8, confidence: 82 },
    { time: '4h', traffic: 85, accidents: 6, confidence: 84 },
    { time: '5h', traffic: 75, accidents: 3, confidence: 86 },
  ];

  const topRisks = [
    { district: 'Kathmandu', risk: 'High', score: 85, incidents: 12 },
    { district: 'Biratnagar', risk: 'High', score: 78, incidents: 8 },
    { district: 'Pokhara', risk: 'Medium', score: 65, incidents: 5 },
    { district: 'Butwal', risk: 'Medium', score: 58, incidents: 4 },
    { district: 'Lalitpur', risk: 'Low', score: 42, incidents: 2 },
  ];

  return (
    <div className="p-6 min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <span>📊</span> Road Analytics
          </h1>
          <p className="text-gray-400 mt-2 text-lg">AI-driven analysis and prediction system</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {['24h', '7d', '30d'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                timeframe === tf 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:bg-white/10 cursor-pointer overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${metric.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`}></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{metric.icon}</span>
                <span className={`text-xs font-medium ${
                  metric.change.includes('+') ? 'text-green-400' : 
                  metric.change.includes('-') ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {metric.change}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mt-3">{metric.title}</h3>
              <p className="text-2xl font-bold text-white mt-1">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Prediction Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">📈 Traffic Prediction</h2>
          <div className="space-y-3">
            {predictions.map((pred, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{pred.time}</span>
                  <span className="text-white">{pred.traffic}%</span>
                </div>
                <div className="mt-1 w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pred.traffic}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">⚠️ High Risk Districts</h2>
          <div className="space-y-3">
            {topRisks.map((risk, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#0d1117] rounded-xl border border-white/5">
                <div>
                  <div className="text-white font-medium">{risk.district}</div>
                  <div className="text-gray-400 text-xs">{risk.incidents} incidents</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    risk.risk === 'High' ? 'bg-red-500/20 text-red-400' :
                    risk.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {risk.risk}
                  </span>
                  <span className="text-white font-bold">{risk.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Report */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🤖</div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Analysis Report</h2>
            <p className="text-gray-300 mt-2 leading-relaxed">
              Based on traffic patterns, weather data, and historical road conditions, 
              the system predicts normal traffic flow with minor congestion in urban areas. 
              AI confidence is at 94% with real-time data processing from {nepalDistricts.length} districts.
            </p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-[#0d1117] rounded-lg border border-white/5">
                <div className="text-xs text-gray-400">Data Points</div>
                <div className="text-white font-bold">12,847</div>
              </div>
              <div className="p-3 bg-[#0d1117] rounded-lg border border-white/5">
                <div className="text-xs text-gray-400">Accuracy</div>
                <div className="text-green-400 font-bold">94.2%</div>
              </div>
              <div className="p-3 bg-[#0d1117] rounded-lg border border-white/5">
                <div className="text-xs text-gray-400">Model</div>
                <div className="text-blue-400 font-bold">v3.0</div>
              </div>
              <div className="p-3 bg-[#0d1117] rounded-lg border border-white/5">
                <div className="text-xs text-gray-400">Districts</div>
                <div className="text-white font-bold">{nepalDistricts.length}</div>
              </div>
              <div className="p-3 bg-[#0d1117] rounded-lg border border-white/5">
                <div className="text-xs text-gray-400">Updated</div>
                <div className="text-white font-bold text-sm">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytical;