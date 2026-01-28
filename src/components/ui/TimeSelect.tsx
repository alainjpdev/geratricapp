
import React, { SelectHTMLAttributes, useMemo } from 'react';

interface TimeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    intervalMinutes?: number;
    placeholder?: string;
}

export const TimeSelect: React.FC<TimeSelectProps> = ({
    value,
    onChange,
    className = "",
    intervalMinutes = 30,
    placeholder = "Hora",
    ...props
}) => {
    const timeOptions = useMemo(() => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += intervalMinutes) {
                const hour = h.toString().padStart(2, '0');
                const minute = m.toString().padStart(2, '0');
                options.push(`${hour}:${minute}`);
            }
        }
        return options;
    }, [intervalMinutes]);

    return (
        <select
            value={value || ""}
            onChange={onChange}
            className={`w-full bg-transparent focus:outline-none focus:ring-0 cursor-pointer appearance-none text-center ${!value ? 'text-gray-500' : 'text-gray-900'
                } ${className}`}
            {...props}
        >
            <option value="" disabled>{placeholder}</option>
            {timeOptions.map(time => (
                <option key={time} value={time}>
                    {time}
                </option>
            ))}
        </select>
    );
};
