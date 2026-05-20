import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DeletedAccountModal() {
  const { deletedAccount, clearDeletedAccount } = useAuth();

  if (!deletedAccount) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#1a2b3c]/70 backdrop-blur-md"
        />

        {/* Card */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-red-400 via-rose-500 to-red-600" />

          <div className="px-8 pt-8 pb-10 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
              <span className="material-icons-outlined text-3xl text-red-500">
                person_off
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-xl font-bold text-[#1a2b3c] font-serif mb-2">
              Account No Longer Available
            </h2>

            {/* Body */}
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              This account has been removed and is no longer accessible.
              Please sign in to an existing account or create a new one to continue.
            </p>

            {/* Actions */}
            <div className="w-full flex flex-col gap-3">
              <Link
                to="/login"
                onClick={clearDeletedAccount}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1a2b3c] hover:bg-[#0f172a] text-white text-sm font-bold transition-colors shadow-md"
              >
                <span className="material-icons-outlined text-base">login</span>
                Sign In to Existing Account
              </Link>

              <Link
                to="/register"
                onClick={clearDeletedAccount}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-200 hover:border-[#7AC142] hover:bg-[#7AC142]/5 text-[#1a2b3c] text-sm font-bold transition-colors"
              >
                <span className="material-icons-outlined text-base">person_add</span>
                Create a New Account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
