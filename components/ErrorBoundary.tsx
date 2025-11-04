'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Log to error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-surface rounded-3xl p-8 shadow-soft-xl text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full mb-6"
              >
                <AlertTriangle size={40} className="text-red-500" />
              </motion.div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-textPrimary mb-4">
                Ops! Algo deu errado
              </h1>

              {/* Description */}
              <p className="text-textSecondary mb-6 text-lg">
                Encontramos um erro inesperado. Não se preocupe, estamos trabalhando nisso!
              </p>

              {/* Error Details (Development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6 bg-red-50 dark:bg-red-900/10 rounded-xl p-4">
                  <summary className="cursor-pointer font-semibold text-red-600 dark:text-red-400 mb-2">
                    Detalhes do erro (dev only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <p className="font-mono text-sm text-red-700 dark:text-red-300">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-xs overflow-auto max-h-40 bg-white dark:bg-gray-900 p-2 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md hover:shadow-soft-md-lg transition-all duration-300"
                >
                  <RefreshCw size={20} />
                  Tentar Novamente
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-6 py-3 bg-surfaceAlt text-textPrimary font-semibold rounded-xl hover:bg-gray-300 transition-all duration-300"
                >
                  <Home size={20} />
                  Ir para Home
                </motion.button>
              </div>

              {/* Tips */}
              <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Dica:</strong> Tente recarregar a página ou limpar o cache do navegador
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for Next.js pages
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
