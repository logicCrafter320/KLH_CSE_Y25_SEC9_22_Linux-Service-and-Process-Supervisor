import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import useMeasure from 'react-use-measure';

const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 200,
  damping: 22,
  mass: 1.2,
};

export default function ExpandDetails({ title = 'System Details', data }) {
  const [isOpen, setIsOpen] = useState(false); // Start collapsed by default
  const [ref, bounds] = useMeasure({ offsetSize: true });

  const details = data || [
    { label: 'Kernel', value: 'Linux 6.8.0-generic', fullWidth: true },
    { label: 'OS Distro', value: 'Ubuntu 24.04 LTS' },
    { label: 'Active Tasks', value: '184' },
    { label: 'Load Avg', value: '1.42 / 2.10' },
    { label: 'System Uptime', value: '14h 22m' },
  ];

  return (
    <div className="flex justify-end z-20">
      <motion.div
        initial={{ borderRadius: 16 }}
        animate={{
          width: isOpen ? 320 : 135,
          height: bounds.height > 0 ? bounds.height : 'auto',
          borderRadius: isOpen ? 16 : 20,
        }}
        transition={{
          height: {
            ...SPRING_CONFIG,
            delay: isOpen ? 0.25 : 0,
          },
          width: {
            ...SPRING_CONFIG,
            delay: isOpen ? 0 : 0.3,
          },
          borderRadius: SPRING_CONFIG,
        }}
        className="border-linux-border bg-linux-card text-linux-text overflow-hidden border shadow-xl select-none"
      >
        <div ref={ref} className="relative px-3 py-2">
          <motion.button
            layout="position"
            onClick={() => setIsOpen((prev) => !prev)}
            className="text-linux-text-secondary hover:text-linux-text flex w-full items-center justify-between gap-1.5 transition-colors focus:outline-none"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <motion.div
                animate={{ rotate: isOpen ? 0 : -90 }}
                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.3 }}
                className="flex items-center justify-center flex-shrink-0"
              >
                <ChevronDown className="w-4 h-4 stroke-[2]" />
              </motion.div>

              <span className="text-linux-text text-xs font-semibold tracking-tight whitespace-nowrap">
                {title}
              </span>
            </div>
          </motion.button>

          <AnimatePresence initial={false} mode="popLayout">
            {isOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  filter: 'blur(8px)',
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  filter: 'blur(0px)',
                  y: 0,
                  transition: {
                    type: 'spring',
                    duration: 0.4,
                    bounce: 0,
                    delay: 0.3,
                  },
                }}
                exit={{
                  opacity: 0,
                  filter: 'blur(8px)',
                  y: 12,
                }}
                transition={{
                  type: 'spring',
                  duration: 0.4,
                  bounce: 0,
                }}
                className="min-w-[280px] overflow-hidden pt-2"
              >
                <div className="mt-2 pl-2 grid grid-cols-2 gap-x-4 gap-y-3 pb-1">
                  {details.map((item, idx) => (
                    <div key={idx} className={item.fullWidth ? 'col-span-2' : ''}>
                      <div className="text-linux-text-secondary text-[11px] font-medium">
                        {item.label}
                      </div>
                      <div className="text-linux-text mt-0.5 text-xs font-semibold tracking-tight font-mono">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}