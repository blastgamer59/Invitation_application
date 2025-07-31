import React from 'react';
import { motion } from 'framer-motion';


const LoadingSpinner = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center z-50"
    >
      <div className="text-center">

        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Processing Your RSVP
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your details...
          </p>
        </motion.div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          className="mt-6 h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mx-auto max-w-xs"
        />
      </div>
    </motion.div>
  );
};

export default LoadingSpinner;
