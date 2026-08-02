// src/components/Layout.jsx
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  ChartLine,
  Bell,
  Car,
  Menu,
  X
} from "lucide-react";

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, text: "Dashboard", link: "/dashboard" },
    { icon: <Map size={20} />, text: "Live Map", link: "/livemap" },
    { icon: <Car size={20} />, text: "Live Car Demo", link: "/livecar" },
    { icon: <ChartLine size={20} />, text: "Analytics", link: "/analytical" },
    { icon: <Bell size={20} />, text: "Alerts", link: "/alerts" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-[#020617]">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-[#020617] border border-white/10 rounded-lg text-white lg:hidden"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed lg:relative z-40 w-[250px] h-full bg-[#020617] border-r border-white/10 p-6 transition-transform duration-300 flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-shrink-0 mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🚗 RoadDNA
          </h2>
          <p className="text-gray-400 text-xs mt-1">AI Road Intelligence</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive(item.link)
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={isActive(item.link) ? 'text-blue-400' : ''}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.text}</span>
              {isActive(item.link) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex-shrink-0 pt-4 border-t border-white/5">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs text-gray-400">System Online</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Nepal • v3.0.1</div>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 p-4 md:p-8 lg:p-10 pt-16 lg:pt-8 bg-[#0f172a] min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;