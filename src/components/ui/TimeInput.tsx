
import React, { useState, InputHTMLAttributes } from 'react';

interface TimeInputProps extends InputHTMLAttributes<HTMLInputElement> {
    value?: string;
}

/**
 * A robust Time Input that shows a placeholder when empty, 
 * avoiding the flaky "type toggle" strategy.
 * Keeps type="time" always active but hides the text when empty.
 */
export const TimeInput: React.FC<TimeInputProps> = ({
    value,
    className = "",
    placeholder = "Hora",
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = !!value;

    return (
        <div className="relative w-full h-full">
            <input
                type="time"
                value={value}
                onFocus={(e) => {
                    setIsFocused(true);
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    onBlur?.(e);
                }}
                className={`w-full h-full bg-transparent focus:outline-none focus:ring-0 ${!hasValue && !isFocused ? 'opacity-0' : ''
                    } ${className}`}
                {...props}
            />
            {!hasValue && !isFocused && (
                <span className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none text-sm whitespace-nowrap overflow-hidden">
                    {placeholder}
                </span>
            )}
        </div>
    );
};
