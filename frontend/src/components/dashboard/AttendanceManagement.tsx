'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BookUser, FileDown } from 'lucide-react';
import { getAllAttendance, updateAttendance, exportAttendanceCsv, AttendanceRecord } from '@/services/attendance.service';

// Helper to format 'YYYY-MM-DD HH:MM:SS' or ISO string to 'HH:MM'
const formatTimestampToHHMM = (timestamp: string | null): string => {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        console.error("Invalid timestamp:", timestamp, e);
        return '';
    }
};

const AttendanceManagement = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const fetchedRecords = await getAllAttendance();
            setRecords(fetchedRecords);
        } catch (error) {
            toast.error("Failed to load attendance data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleFieldChange = async (recordId: number, field: keyof AttendanceRecord, value: string) => {
        const originalRecords = records;
        const recordToUpdate = originalRecords.find(rec => rec.id === recordId);
        if (!recordToUpdate) return;
        
        let payloadValue: string | null = value;
        let optimisticValue: string | null = value;

        // For time fields, we receive HH:MM and need to construct a full timestamp for the backend
        if (field === 'clock_in_time' || field === 'clock_out_time') {
            if (value) {
                const datePart = new Date(recordToUpdate.date).toISOString().split('T')[0];
                payloadValue = `${datePart} ${value}:00`;
                optimisticValue = payloadValue;
            } else {
                payloadValue = null;
                optimisticValue = null;
            }
        }
        
        // Optimistic UI Update
        setRecords(records.map(rec =>
            rec.id === recordId ? { ...rec, [field]: optimisticValue } : rec
        ));

        try {
            await updateAttendance(recordId, { [field]: payloadValue });
            toast.success("Record updated successfully.");
        } catch (error) {
            toast.error("Failed to update record.");
            // Revert UI on failure
            setRecords(originalRecords);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await exportAttendanceCsv();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'attendance_export.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Attendance exported successfully!");
        } catch (error) {
            toast.error("Failed to export attendance data.");
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading attendance records...</div>;
    }

    return (
        <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                    <BookUser className="h-6 w-6 mr-3 text-cyan-500" />
                    Attendance Management
                </h2>
                <button 
                    onClick={handleExport} 
                    className="bg-green-600/30 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 border border-green-500/50 backdrop-blur-xl hover:bg-green-600/50 shadow-lg transition-all duration-300"
                >
                    <FileDown size={18} />
                    Export CSV
                </button>
            </div>
            
            <div className="overflow-x-auto bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Clock In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Clock Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {records.map((rec) => (
                            <tr key={rec.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{rec.full_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(rec.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <input type="time" value={formatTimestampToHHMM(rec.clock_in_time)} onChange={(e) => handleFieldChange(rec.id, 'clock_in_time', e.target.value)} className="input-style w-full" />
                                </td>
                                <td className="px-6 py-4">
                                    <input type="time" value={formatTimestampToHHMM(rec.clock_out_time)} onChange={(e) => handleFieldChange(rec.id, 'clock_out_time', e.target.value)} className="input-style w-full" />
                                </td>
                                <td className="px-6 py-4">
                                    <select value={rec.status} onChange={(e) => handleFieldChange(rec.id, 'status', e.target.value)} className="input-style w-full">
                                        <option value="ON_TIME">On Time</option>
                                        <option value="LATE">Late</option>
                                        <option value="OUT_OF_RANGE">Out of Range</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceManagement; 