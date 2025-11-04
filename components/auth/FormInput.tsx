'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon, ...props }, ref) => {
    return (
      <div className="mb-4">
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
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput
