"use client";

import React from "react";
import { cn } from "@/lib/utils";

let openOverlayCount = 0;
let lockedScrollY = 0;

function lockPageScroll() {
  if (typeof window === "undefined") return;

  if (openOverlayCount === 0) {
    lockedScrollY = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.width = "100%";
  }

  openOverlayCount += 1;
}

function unlockPageScroll() {
  if (typeof window === "undefined" || openOverlayCount === 0) return;

  openOverlayCount -= 1;

  if (openOverlayCount === 0) {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, lockedScrollY);
  }
}

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
    primary: "bg-fleet-blue hover:bg-fleet-blue-dark text-white shadow-premium btn-premium",
    secondary: "bg-fleet-blue/10 hover:bg-fleet-blue/20 text-fleet-blue font-bold dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 font-bold dark:bg-red-950/50 dark:hover:bg-red-950/70 dark:text-red-300",
    ghost: "bg-transparent hover:bg-slate-50 text-slate-500 font-bold border border-slate-200 dark:hover:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  };

  const sizes = {
    sm: "h-9 px-6 text-[11px] uppercase tracking-wide rounded-xl",
    md: "h-9 px-10 text-[11px] uppercase tracking-wide rounded-xl",
    lg: "h-11 px-12 text-xs uppercase tracking-wide rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-fleet-blue/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
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
        <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-fleet-blue/20 focus:border-fleet-blue hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-fleet-blue dark:hover:border-slate-600",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500/10 dark:border-red-700 dark:focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium dark:text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

// ==========================================
// SELECT (SEARCHABLE)
// ==========================================
interface SelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ label, error, options, placeholder, value, defaultValue, onChange, disabled, required, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [internalValue, setInternalValue] = React.useState(value ?? defaultValue ?? "");

    // If value prop changes, update internalValue
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    // Filter options based on search term
    const filteredOptions = options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Find the selected option
    const currentValue = value ?? internalValue;
    const selectedOption = options.find(opt => opt.value === currentValue);

    // Close dropdown when clicking outside
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm("");
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optValue: string) => {
      if (value === undefined) {
        setInternalValue(optValue);
      }
      onChange?.(optValue);
      setIsOpen(false);
      setSearchTerm("");
    };

    return (
      <div className="space-y-1.5 w-full" ref={ref}>
        {label && (
          <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1">
            {label}
          </label>
        )}
        <div className="relative" ref={dropdownRef}>
          {/* Trigger */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              "w-full h-9 px-4 pr-10 rounded-xl border text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-fleet-blue/20 focus:border-fleet-blue hover:border-slate-300 cursor-pointer",
              disabled ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500" : "bg-white border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200",
              error && "border-red-300 focus:border-red-500 focus:ring-red-500/10 dark:border-red-700 dark:focus:border-red-500",
              className
            )}
          >
            <span className="text-xs font-bold truncate">
              {selectedOption?.label || placeholder || "Sélectionner..."}
            </span>
          </button>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 dark:text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Dropdown */}
          {isOpen && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Search Input */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  autoFocus
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-fleet-blue/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
              
              {/* Options List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                    Aucune option trouvée
                  </div>
                ) : (
                  filteredOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-xs font-medium transition-colors",
                        opt.value === value
                          ? "bg-fleet-blue/10 text-fleet-blue dark:bg-fleet-blue/20 dark:text-fleet-blue-light"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-medium dark:text-red-400">{error}</p>}
      </div>
    );
  }
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
        <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all duration-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-fleet-blue/20 focus:border-fleet-blue hover:border-slate-300 min-h-[80px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-fleet-blue dark:hover:border-slate-600",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500/10 dark:border-red-700 dark:focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium dark:text-red-400">{error}</p>}
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
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  noScroll?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = "md", noScroll = false }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      lockPageScroll();
      return () => {
        unlockPageScroll();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-5xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pl-[270px]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Modal content */}
      <div
        className={cn(
          "relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full border-none animate-scale-in max-h-[95vh] flex flex-col overflow-hidden",
          sizes[size]
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-fleet-blue text-white flex items-center justify-between sticky top-0 z-50 flex-shrink-0">
          <h3 className="text-xl font-black tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className={cn(
          "p-6 md:p-8 bg-white dark:bg-slate-900 flex flex-col flex-1",
          noScroll ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CONFIRM MODAL
// ==========================================
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "danger" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmer l'action",
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  variant = "danger",
}: ConfirmModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      lockPageScroll();
      return () => {
        unlockPageScroll();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const iconBg = variant === "danger" ? "bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-300" : "bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-300";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pl-[270px]">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border-none animate-scale-in overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-xl flex-shrink-0", iconBg)}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={onConfirm}
              loading={loading}
              className={variant === "danger" ? "bg-red-600 hover:bg-red-700 text-white border-0 dark:bg-red-600 dark:hover:bg-red-700" : undefined}
            >
              {confirmLabel}
            </Button>
          </div>
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
    success: "bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 shadow-emerald-500/5",
    error: "bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300 shadow-rose-500/5",
    info: "bg-white dark:bg-slate-900 border-fleet-blue/10 dark:border-fleet-blue/30 text-fleet-blue-dark dark:text-fleet-blue-light shadow-fleet-blue/5",
  };

  const icons = {
    success: (
      <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-300">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-50 dark:text-rose-300">
        <svg className="w-5 h-5 text-rose-500 dark:text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    info: (
      <div className="p-1 rounded-lg bg-fleet-blue/10 dark:bg-fleet-blue/20 text-fleet-blue dark:text-fleet-blue-light">
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
        <button onClick={onClose} className="ml-3 opacity-60 hover:opacity-100 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
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
  const borderColor = change ? (change.isPositive ? "border-emerald-500" : "border-rose-500") : "border-fleet-blue";

  return (
    <div className={cn("p-4 rounded-2xl border-l-4 bg-white dark:bg-slate-900 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-center min-h-[100px] relative overflow-hidden group", borderColor)}>
      {/* Fond bleu très léger */}
      <div className="absolute inset-0 bg-fleet-blue/5 dark:bg-fleet-blue/10 pointer-events-none" />
      
      {/* Icône géante en fond */}
      <div className="absolute -right-2 -bottom-4 w-20 h-20 opacity-5 text-fleet-blue pointer-events-none group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>

      <div className="relative z-10 w-full">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{title}</p>
          {fullValue && (
            <div className="group/tooltip relative inline-flex">
              <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center text-[8px] font-bold cursor-help hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                i
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max px-2.5 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-xl">
                {fullValue}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-end gap-3">
          <p className="text-2xl font-black leading-none text-fleet-blue tracking-tight">{value}</p>
          {change && (
            <span className={cn(
              "rounded-full text-[9px] font-bold px-1.5 py-0.5 inline-flex items-center gap-0.5", 
              change.isPositive ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
            )}>
              {change.isPositive ? "+" : "-"}
              {Math.abs(change.value)}%
            </span>
          )}
        </div>
        
        {subtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1.5">{subtitle}</p>}
      </div>
    </div>
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
      <div className="p-4 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

// ==========================================
// LOADING SKELETON
// ==========================================
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-100 dark:bg-slate-800 rounded-lg", className)} />
  );
}

// ==========================================
// TABLE & PAGINATION (New Design System)
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
  rowClassName?: (item: T) => string;
  emptyMessage?: string;
}

export function TableCard({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden p-2", className)}>
      {children}
    </div>
  );
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  rowClassName,
  emptyMessage = "Aucune donnée disponible",
}: TableProps<T>) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="min-h-[220px] flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white py-12 text-center text-slate-500 text-sm font-medium dark:border-slate-800 dark:bg-slate-950">
        <div>{emptyMessage}</div>
        <div className="text-xs text-slate-400">Ajustez la recherche ou les filtres pour trouver des tickets.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <table className="min-w-full text-left border-separate border-spacing-0">
        <thead className="bg-slate-50 dark:bg-slate-950">
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-5 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200 align-middle",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              className={cn(
                "border-b border-slate-200 dark:border-slate-700 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900",
                onRowClick && "cursor-pointer",
                rowClassName && rowClassName(item)
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-5 py-3 align-middle text-sm text-slate-600 dark:text-slate-300", col.className)}>
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// PAGINATION
// ==========================================
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }: PaginationProps) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-b-2xl border-t border-slate-200 bg-white px-4 py-4 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-500 dark:text-slate-400">
        <span className="font-bold uppercase tracking-[0.16em]">Éléments par page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-fleet-blue focus:ring-2 focus:ring-fleet-blue/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="text-[13px] text-slate-500 dark:text-slate-400">
        {firstItem} - {lastItem} de {totalItems} éléments
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition duration-150 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="text-sm font-bold">«</span>
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition duration-150 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="text-sm font-bold">‹</span>
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition duration-150 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="text-sm font-bold">›</span>
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition duration-150 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="text-sm font-bold">»</span>
        </button>
      </div>
    </div>
  );
}
