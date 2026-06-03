// components/LoadingScreen.tsx
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="flex flex-col items-center gap-6">
        
        {/* Animated Loader */}
        <div className="relative">
          <motion.div
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-b-transparent rounded-full"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        </div>

        {/* Text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-gray-300"
        >
          Loading your dashboard...
        </motion.p>
      </div>
    </div>
  );
}