"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ==========================================
// BUTTON
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/10 btn-premium",
    secondary: "bg-sky-50/80 hover:bg-sky-100 text-sky-600 font-semibold",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 font-semibold",
    ghost: "bg-transparent hover:bg-slate-50 text-slate-600",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-xs rounded-xl",
    md: "px-5 py-2.5 text-sm rounded-xl",
    lg: "px-7 py-3.5 text-base rounded-2xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ==========================================
// INPUT
// ==========================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 hover:border-slate-300",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500/10",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

// ==========================================
// SELECT
// ==========================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 hover:border-slate-300 cursor-pointer",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";

// ==========================================
// TEXTAREA
// ==========================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 hover:border-slate-300 min-h-[80px]",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500/10",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

// ==========================================
// CARD
// ==========================================
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "card-modern",
        hover && "card-modern-hover cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ==========================================
// BADGE
// ==========================================
interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  // Mapper les variants classiques de couleur
  // Ex: "bg-sky-500 text-white" -> plus moderne
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-sm/5",
        variant,
        className
      )}
    >
      {children}
    </span>
  );
}

// ==========================================
// MODAL / DIALOG
// ==========================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      {/* Modal content */}
      <div
        className={cn(
          "relative bg-white rounded-3xl shadow-2xl w-full border border-slate-100 animate-scale-in overflow-hidden max-h-[90vh] flex flex-col",
          sizes[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 flex-shrink-0">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TOAST / NOTIFICATION
// ==========================================
interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, type = "success", isVisible, onClose }: ToastProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: "bg-white border-emerald-100 text-emerald-800 shadow-emerald-500/5",
    error: "bg-white border-rose-100 text-rose-800 shadow-rose-500/5",
    info: "bg-white border-sky-100 text-sky-800 shadow-sky-500/5",
  };

  const icons = {
    success: (
      <div className="p-1 rounded-lg bg-emerald-50 text-emerald-500">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="p-1 rounded-lg bg-rose-50 text-rose-50">
        <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    info: (
      <div className="p-1 rounded-lg bg-sky-50 text-sky-500">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-in">
      <div
        className={cn(
          "flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl border shadow-xl max-w-sm",
          typeStyles[type]
        )}
      >
        {icons[type]}
        <span className="text-sm font-semibold tracking-tight">{message}</span>
        <button onClick={onClose} className="ml-3 opacity-60 hover:opacity-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ==========================================
// STAT CARD
// ==========================================
interface StatCardProps {
  title: string;
  value: string;
  fullValue?: string;
  icon: React.ReactNode;
  change?: { value: number; isPositive: boolean };
  subtitle?: string;
}

export function StatCard({ title, value, fullValue, icon, change, subtitle }: StatCardProps) {
  return (
    <Card className="flex flex-col justify-between hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 stagger-1 overflow-hidden relative group h-full min-h-[140px] p-5">
      {/* Background soft hover glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-50/0 to-sky-50/0 group-hover:from-sky-50/5 group-hover:to-indigo-50/10 transition-all duration-500 pointer-events-none" />
      
      <div className="flex justify-between items-start w-full relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
            {fullValue && (
              <div className="group/tooltip relative">
                <div className="w-4 h-4 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold cursor-help hover:bg-slate-200 transition-colors">
                  i
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-xl">
                  {fullValue}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            )}
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-sky-50 text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 relative z-10 shadow-sm shadow-sky-500/5 flex-shrink-0">
          {icon}
        </div>
      </div>

      {(change || subtitle) && (
        <div className="flex items-center gap-2 pt-4 mt-auto relative z-10">
          {change && (
            <span className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-bold", 
              change.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {change.isPositive ? "+" : "-"}
              {Math.abs(change.value)}%
            </span>
          )}
          {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>
      )}
    </Card>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-gray-50 text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

// ==========================================
// LOADING SKELETON
// ==========================================
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-100 rounded-lg", className)} />
  );
}

// ==========================================
// TABLE
// ==========================================
interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "Aucune donnée disponible",
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((item, index) => (
            <tr
              key={index}
              className={cn(
                "transition-colors duration-150",
                index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                onRowClick && "cursor-pointer hover:bg-sky-50/50"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3 text-sm text-gray-700", col.className)}>
                  {col.render ? col.render(item) : String(item[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
