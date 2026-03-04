import React from 'react';

/**
 * Reusable Button component with consistent styling across the app.
 *
 * Variants:
 * - primary: Main action buttons (blue)
 * - secondary: Secondary actions (purple)
 * - danger: Destructive actions (red)
 * - ghost: Text-only links/toggles
 * - hero: Large call-to-action (gradient rose)
 * - icon: Icon-only circular buttons
 *
 * Sizes: sm, md, lg, xl
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isFullWidth = false,
    isLoading = false,
    disabled = false,
    icon,
    className = '',
    ...rest
}) => {
    const baseStyles = 'font-bold transition-all duration-200 focus:outline-none disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98]',
        secondary: 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98]',
        danger: 'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98]',
        ghost: 'bg-transparent text-blue-600 hover:text-blue-800 disabled:text-gray-400',
        hero: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 rounded-full shadow-xl hover:scale-105 hover:-translate-y-1 border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 tracking-widest',
        icon: 'bg-white text-red-500 hover:scale-110 rounded-full shadow active:scale-95',
    };

    const sizeStyles = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-3 text-lg',
        xl: 'px-12 py-4 text-xl',
    };

    // Icon variant has its own sizing
    const iconSizeStyles = {
        sm: 'p-1.5 text-base',
        md: 'p-2 text-lg',
        lg: 'p-3 text-xl',
        xl: 'p-4 text-2xl',
    };

    const widthStyle = isFullWidth ? 'w-full' : '';

    const currentSizeStyles = variant === 'icon' ? iconSizeStyles[size] : sizeStyles[size];

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${currentSizeStyles} ${widthStyle} ${className}`}
            disabled={disabled || isLoading}
            {...rest}
        >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </span>
            ) : (
                <span className="flex items-center justify-center gap-2">
                    {icon && <span>{icon}</span>}
                    {children}
                </span>
            )}
        </button>
    );
};

export default Button;
