import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

export default function MaintenanceScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020817] text-slate-100">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <Construction className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h1 className="text-4xl font-extrabold text-white mb-3">
                    Under Maintenance
                </h1>
                <p className="text-slate-400">
                    We're improving the system. Please check back shortly.
                </p>
            </motion.div>
        </div>
    );
}