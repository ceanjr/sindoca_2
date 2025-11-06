'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon, ...props }, ref) => {
    return (
      <div className="mb-4 relative">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>

        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`w-full px-4 py-3 ${
              icon ? 'pl-12' : ''
            } bg-gray-50 rounded-xl border-2 transition-all duration-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:shadow-soft-md ${
              error ? 'border-red-500' : 'border-gray-200'
            }`}
            {...props}
          />

          {/* Tooltip de erro */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 0.9, y: 0 }}
              className="absolute left-0 top-full mt-2 bg-primary/10 border border-primary/20 text-gray-700 text-sm px-3 py-1 rounded-lg shadow-md"
            >
              {error}
              <div
                className="absolute top-0 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4"
                style={{
                  borderColor: 'transparent transparent #ffd7e4 transparent',
                  transform: 'translateY(-100%)',
                }}
              ></div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
export default FormInput;
