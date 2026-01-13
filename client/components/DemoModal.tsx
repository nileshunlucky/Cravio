'use client';

import React, { useState } from 'react';
import { PlayCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DemoModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Button to open modal — styled like your existing button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-auto inline-flex px-8 py-4 border-2 border-[#47FFE7] text-[#47FFE7] font-semibold rounded-full text-base items-center gap-3 flex-shrink-0 max-w-max"
        style={{ boxShadow: '0 4px 20px rgba(71, 255, 231, 0.2)' }}
      >
        <PlayCircle className="w-5 h-5" />
        Watch Demo
      </motion.button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Modal Content */}
            <motion.div
              className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden border border-[#47FFE7]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-60 p-2 rounded-full hover:bg-opacity-80 transition"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Responsive 16:9 Video */}
              <div className="w-full aspect-video bg-black">
                <video
                  src="https://res.cloudinary.com/db17zxsjc/video/upload/v1751453394/lv_0_20250702161725_y38cit.mp4"
                  controls
                  autoPlay
                  className="w-full h-full object-cover rounded-b-xl"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DemoModal;
