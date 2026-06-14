"use client";

import { forwardRef, useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: string;
  iconPosition?: "left" | "right";
  clearable?: boolean;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = "left",
      clearable = false,
      fullWidth = false,
      className = "",
      id,
      value,
      onChange,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    const handleClear = () => {
      if (onChange) {
        const synthetic = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(synthetic);
      }
    };

    const wrapperClasses = [
      "relative flex items-center gap-2",
      "min-h-[48px] px-3.5",
      "bg-[var(--color-surface-container-lowest)]",
      "border rounded-xl",
      "transition-all duration-200",
      fullWidth ? "w-full" : "w-full",
      error
        ? "border-[var(--color-status-error)]"
        : focused
          ? "border-[var(--color-primary)] shadow-[0_0_0_3px_var(--color-primary)_at_10%]"
          : "border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold text-[var(--color-on-surface)] mb-1.5"
          >
            {label}
          </label>
        )}

        <div className={wrapperClasses}>
          {icon && iconPosition === "left" && (
            <span
              className={`material-symbols-outlined text-[var(--color-on-surface-variant)] text-xl ${
                focused ? "text-[var(--color-primary)]" : ""
              }`}
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            value={value}
            onChange={onChange}
            onFocus={(e) => {
              setFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              rest.onBlur?.(e);
            }}
            className="flex-1 bg-transparent text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] text-base outline-none border-none py-2 min-h-[48px] [font-size:16px]"
            {...rest}
          />

          {icon && iconPosition === "right" && (
            <span
              className={`material-symbols-outlined text-[var(--color-on-surface-variant)] text-xl ${
                focused ? "text-[var(--color-primary)]" : ""
              }`}
            >
              {icon}
            </span>
          )}

          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-[var(--color-surface-variant)] transition-colors"
              aria-label="Clear input"
            >
              <span className="material-symbols-outlined text-lg text-[var(--color-on-surface-variant)]">
                close
              </span>
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-[var(--color-status-error)] mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
