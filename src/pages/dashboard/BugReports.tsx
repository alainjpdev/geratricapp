import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../config/supabaseClient';
import { Bug, CheckCircle, Clock, Trash2 } from 'lucide-react';

interface BugReport {
    id: string;
    description: string;
    user_id: string;
    status: string;
    type: string;
    error_hash: string | null;
    created_at: string;
    user?: {
        email: string;
        first_name: string;
        last_name: string;
    };
}

const BugReports = () => {
    const [reports, setReports] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            // Fetch reports with user details
            const { data, error } = await supabase
                .from('bug_reports')
                .select(`
          *,
          user:users (
            email,
            first_name,
            last_name
          )
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('bug_reports')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const deleteReport = async (id: string) => {
        if (!confirm('Are you sure you want to delete this report?')) return;

        try {
            const { error } = await supabase
                .from('bug_reports')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setReports(reports.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Error deleting report');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 uppercase">
                    <Bug className="w-8 h-8 text-red-600" />
                    Bug Reports
                </h1>
                <p className="text-gray-500 mt-2 uppercase">
                    Manage system errors and user-reported bugs.
                </p>
            </div>

            <div className="grid gap-6">
                {reports.map((report) => (
                    <Card key={report.id} className="p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${report.type === 'auto' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {report.type || 'Manual'}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${report.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {report.status}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1 uppercase">
                                        <Clock className="w-3 h-3" />
                                        {new Date(report.created_at).toLocaleString('es-MX', { timeZone: 'America/Cancun' })}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase">
                                    {report.user ? `${report.user.first_name} ${report.user.last_name} (${report.user.email})` : 'Anonymous / System'}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2">
                                {report.status === 'open' && (
                                    <button
                                        onClick={() => updateStatus(report.id, 'resolved')}
                                        className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors uppercase"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark Resolved
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteReport(report.id)}
                                    className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded hover:bg-red-200 transition-colors uppercase"
                                    title="Delete Report"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto border border-gray-200">
                            {report.description}
                        </div>

                        {report.error_hash && (
                            <div className="mt-2 text-xs text-gray-400 font-mono uppercase">
                                Hash: {report.error_hash}
                            </div>
                        )}
                    </Card>
                ))}

                {reports.length === 0 && (
                    <div className="text-center py-12 text-gray-500 uppercase">
                        No bug reports found. Good job!
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugReports;
