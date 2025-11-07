/**
 * Legacy hook file - re-exports from PageConfigContext
 *
 * This file is kept for backward compatibility.
 * The actual implementation is now in contexts/PageConfigContext.jsx
 * which uses React Context to share state across all pages.
 *
 * This fixes the bug where each page created its own instance of the hook,
 * causing loading to get stuck after navigation.
 */
export { usePageConfig } from '@/contexts/PageConfigContext';
