"use client";

import { forwardRef, useId, useState } from "react";

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
    const generatedId = useId();
    const inputId = id || generatedId;

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
            className="mb-1.5 block text-sm font-bold text-[var(--color-on-surface)]"
          >
            {label}
          </label>
        )}

        <div className={wrapperClasses}>
          {icon && iconPosition === "left" && (
            <span
              className={`material-symbols-outlined text-xl text-[var(--color-on-surface-variant)] ${
                focused ? "text-[var(--color-accent)]" : ""
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
            className="min-h-[48px] flex-1 border-none bg-transparent py-2 text-base [font-size:16px] text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-on-surface-variant)]"
            {...rest}
          />

          {icon && iconPosition === "right" && (
            <span
              className={`material-symbols-outlined text-xl text-[var(--color-on-surface-variant)] ${
                focused ? "text-[var(--color-accent)]" : ""
              }`}
            >
              {icon}
            </span>
          )}

          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-0.5 transition-colors hover:bg-[var(--color-surface-variant)]"
              aria-label="Clear input"
            >
              <span className="material-symbols-outlined text-lg text-[var(--color-on-surface-variant)]">
                close
              </span>
            </button>
          )}
        </div>

        {error && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--color-status-error)]">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
