import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind and conditional CSS classes safely.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in Indian Rupees format matching Figma specs (e.g. ₹4.82L or ₹48,000)
 */
export function formatINR(amount) {
  if (typeof amount !== 'number') return amount || ''
  if (amount >= 10000000) {
    return '₹' + (amount / 10000000).toFixed(2).replace(/\.?0+$/, '') + 'Cr'
  }
  if (amount >= 100000) {
    return '₹' + (amount / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L'
  }
  return '₹' + amount.toLocaleString('en-IN')
}

/**
 * Format standard numbers with locale commas (e.g. 142,000)
 */
export function formatNumber(n) {
  if (typeof n !== 'number') return n || ''
  return n.toLocaleString('en-IN')
}
