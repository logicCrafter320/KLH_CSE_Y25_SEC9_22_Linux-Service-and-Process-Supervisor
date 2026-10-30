import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Cpu,
  Terminal,
  Settings,
} from 'lucide-react';

const TABS = [
  { id: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: '/services', label: 'Services', icon: <Server size={20} /> },
  { id: '/processes', label: 'Processes', icon: <Cpu size={20} /> },
  { id: '/logs', label: 'Logs', icon: <Terminal size={20} /> },
  { id: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export const FluidTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  return (
    <div className="bg-linux-darker border-linux-border relative flex items-center gap-1 rounded-2xl border px-1.5 py-1.5 shadow-xl transition-colors">
      {TABS.map((tab) => {
        const isActive = currentPath === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className="group relative rounded-xl px-4 py-2.5 outline-none transition-all focus:outline-none"
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 26,
                  mass: 0.8,
                }}
                className="bg-white absolute inset-0 rounded-xl shadow-lg"
              />
            )}

            <motion.div
              transition={{ duration: 0.25, ease: 'easeOut' }}
              animate={{
                filter: isActive
                  ? ['blur(0px)', 'blur(2px)', 'blur(0px)']
                  : 'blur(0px)',
              }}
              className={`relative z-10 flex items-center gap-2.5 font-medium transition-colors duration-200 ${
                isActive
                  ? 'text-black font-bold'
                  : 'text-linux-text-secondary hover:text-linux-text'
              }`}
            >
              <motion.div
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{
                  scale: { type: 'spring', stiffness: 350, damping: 18 },
                }}
                className="flex shrink-0 items-center justify-center"
              >
                {tab.icon}
              </motion.div>

              <span className="text-sm tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
            </motion.div>
          </button>
        );
      })}
    </div>
  );
};

export default FluidTabs;