import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { medicalService } from '../../services/medicalService';

interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    className?: string;
    placeholder?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
    value,
    onChange,
    onBlur,
    className = "",
    placeholder = ""
}) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                // If clicking suggestion, logic handled there. 
                // But clicking outside entirely should close.
                // We'll rely on timeOut blur for specific suggestion clicks
                // This global click is a backup.
                setShowSuggestions(false);
            }
        };

        const updatePosition = () => {
            if (showSuggestions && inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
            }
        };

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // true for capture to catch table crawls
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSuggestions]);

    const fetchSuggestions = async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const results = await medicalService.searchMedications(query);
            // Filter out exact match 
            const filtered = results.filter(s => s.toLowerCase() !== query.toLowerCase());
            setSuggestions(filtered);

            if (filtered.length > 0 && inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        fetchSuggestions(newValue);
    };

    return (
        <>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => {
                        onBlur?.();
                        setShowSuggestions(false);
                    }, 200);
                }}
                className={className}
                placeholder={placeholder}
            />
            {showSuggestions && suggestions.length > 0 && ReactDOM.createPortal(
                <ul
                    className="fixed z-[9999] bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto"
                    style={{
                        top: position.top - window.scrollY, // Fixed position is relative to viewport
                        left: position.left - window.scrollX,
                        width: position.width
                    }}
                >
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            onClick={() => {
                                onChange(suggestion);
                                setShowSuggestions(false);
                            }}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 font-medium border-b last:border-0 border-gray-100"
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>,
                document.body
            )}
        </>
    );
};
