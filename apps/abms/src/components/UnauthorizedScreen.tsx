// components/UnauthorizedScreen.tsx
import { motion } from 'framer-motion';
import { Button } from '@repo/ui/components/button';
import { Lock, ArrowLeft, HelpCircle } from 'lucide-react';

export default function UnauthorizedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020817] bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(153,27,27,0.15),rgba(2,8,23,1))] text-slate-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-slate-900/60 backdrop-blur-2xl border border-red-900/30 p-8 md:p-12 rounded-3xl shadow-[0_0_40px_-10px_rgba(220,38,38,0.2)] text-center max-w-md w-full relative overflow-hidden"
      >
        {/* Subtle top glow line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/20"
        >
          <Lock className="w-10 h-10 text-red-400" strokeWidth={1.5} />
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
            Access Denied
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            You don't have the necessary permissions to view this resource. Please contact your system administrator if you believe this is an error.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              className="bg-white text-slate-900 hover:bg-slate-200 transition-colors flex items-center gap-2 font-medium px-6 py-2.5 rounded-xl"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 px-6 py-2.5 rounded-xl"
            >
              <HelpCircle className="w-4 h-4" />
              Support
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}