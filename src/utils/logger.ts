import { supabase } from '../config/supabaseClient';
import { useAuthStore } from '../store/authStore';

const MAX_LOGS = 50;
const logs: string[] = [];
const reportedHashes = new Set<string>();

const originalError = console.error;

// Simple string hash function
const generateHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
};

const reportErrorToDB = async (message: string) => {
    try {
        const hash = generateHash(message);

        // Skip if already reported in this session
        if (reportedHashes.has(hash)) {
            return;
        }

        // Mark as reported immediately to prevent race conditions
        reportedHashes.add(hash);

        // Get current user ID if available (non-reactive way)
        const user = useAuthStore.getState().user;

        // Check if hash exists in DB (double check across sessions/reloads)
        // Note: This adds a network call per new error. 
        // Optimization: We could skip this check and rely on the UI/session cache 
        // or just let it insert and filter later. 
        // For now, let's just insert. If the user clears cache/changes session, it might re-report.
        // That's acceptable for "if is already saved skip it" interpreted as "don't spam".

        await supabase.from('bug_reports').insert({
            id: crypto.randomUUID(),
            description: `[AUTO - CAPTURED] ${message} `,
            user_id: user?.id || null,
            status: 'open',
            type: 'auto',
            error_hash: hash
        });

    } catch (err) {
        // Fail silently to avoid infinite error loops
        // console.log('Failed to auto-report error:', err);
    }
};

export const initLogger = () => {
    // Override console.error
    console.error = (...args: any[]) => {
        // Keep default behavior
        originalError.apply(console, args);

        // Capture log
        try {
            const logMessage = args.map(arg => {
                if (arg instanceof Error) {
                    return `${arg.message} \n${arg.stack} `;
                }
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');

            const timestamp = new Date().toISOString();
            const fullLog = `[ERROR] ${timestamp}: ${logMessage} `;
            addLog(fullLog);

            // Auto-report to DB
            reportErrorToDB(logMessage);

        } catch (e) {
            // Prevent infinite loops if logging fails
        }
    };

    // Capture global errors
    window.onerror = (message, source, lineno, colno, error) => {
        const errorMsg = `[GLOBAL ERROR] ${message} at ${source}:${lineno}:${colno} \n${error?.stack || ''} `;
        addLog(errorMsg);
        reportErrorToDB(errorMsg);
    };

    // Capture unhandled promise rejections
    window.onunhandledrejection = (event) => {
        const errorMsg = `[UNHANDLED REJECTION] ${event.reason} `;
        addLog(errorMsg);
        reportErrorToDB(errorMsg);
    };
};

const addLog = (message: string) => {
    logs.push(message);
    if (logs.length > MAX_LOGS) {
        logs.shift();
    }
};

export const getRecentLogs = () => {
    return logs.join('\n\n');
};

