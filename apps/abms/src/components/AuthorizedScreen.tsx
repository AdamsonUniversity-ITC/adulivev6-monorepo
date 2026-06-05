// components/AuthorizedScreen.tsx
import { motion } from 'framer-motion';
import { Card } from '@repo/ui/components/card';
import { Label } from '@repo/ui/components/label';
import { ShieldCheck, Server, Activity, CheckCircle2 } from 'lucide-react';

export default function AuthorizedScreen({ data }: { data: any }) {
  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#020817] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(29,78,216,0.3),rgba(255,255,255,0))] text-slate-100 p-6 md:p-12 font-sans">
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-12 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl ring-1 ring-blue-500/30">
            <ShieldCheck className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Welcome to ABMS
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              System authenticated successfully.
            </p>
          </div>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Status Card - Spans 1 column */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="h-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-2xl hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-200">System Status</h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Access Level</span>
                    <Label className="bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium">
                      Authorized
                    </Label>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    You have full access to protected resources and administrative panels.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Data Card - Spans 2 columns */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="h-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-2xl hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-200">API Response Payload</h2>
              </div>
              
              <div className="bg-[#0f172a] rounded-xl border border-slate-800/60 overflow-hidden">
                <div className="flex items-center px-4 py-2 border-b border-slate-800/60 bg-slate-900/80">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-4 text-xs font-mono text-slate-500">response.json</span>
                </div>
                <pre className="p-4 text-sm font-mono text-emerald-300 overflow-x-auto custom-scrollbar">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </Card>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}