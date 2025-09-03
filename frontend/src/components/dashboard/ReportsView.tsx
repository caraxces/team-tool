'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar as CalendarIcon, AlertTriangle, LineChart as LineChartIcon, TrendingUp, TrendingDown, Users2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subDays } from 'date-fns';

import { getGA4Report } from '@/services/reports.service';
import { getMyTeams } from '@/services/team.service';
import { Team } from '@/types/team.type';
import toast from 'react-hot-toast';
import { ViewMode } from '@/types';
import { Button } from '../ui/Button';

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-slate-800/80 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg text-white">
        <p className="font-bold mb-2">{`Date: ${label}`}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ReportsViewProps {
    onNavigate: (view: ViewMode) => void;
}

const ReportsView = ({ onNavigate }: ReportsViewProps) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
    const [reportData, setReportData] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([subDays(new Date(), 30), new Date()]);
    const [startDate, endDate] = dateRange;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

     useEffect(() => {
        getMyTeams().then(fetchedTeams => {
            setTeams(fetchedTeams);
            if (fetchedTeams.length > 0) {
                setSelectedTeam(fetchedTeams[0].id);
            } else {
                 setError("You are not part of any team. Please create or join a team first.");
            }
        }).catch(() => setError("Failed to load teams."));
    }, []);

    useEffect(() => {
        if (selectedTeam && startDate && endDate) {
            const fetchReport = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
                    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
                    const data = await getGA4Report(selectedTeam, formattedStartDate, formattedEndDate);
                    
                    // Format date for display on chart
                    const formattedData = data.map((item: any) => ({
                        ...item,
                        date: format(new Date(item.date.slice(0, 4), parseInt(item.date.slice(4, 6)) - 1, item.date.slice(6, 8)), 'MMM dd')
                    }));

                    setReportData(formattedData);
                    if (data.length === 0) {
                         toast.success("Successfully connected to GA4, but no data was returned for this period.");
                    }
                } catch (err: any) {
                    setError(err?.response?.data?.message || "Failed to fetch GA4 report. Please check your settings.");
                    setReportData([]);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchReport();
        }
    }, [selectedTeam, dateRange]);


    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Report</h1>
                    <p className="text-gray-500 mt-1">Insights from your Google Analytics 4 property.</p>
                </div>
                {/* Toolbar */}
                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <select
                        value={selectedTeam || ''}
                        onChange={e => setSelectedTeam(Number(e.target.value))}
                        className="bg-white/10 dark:bg-gray-700/50 border border-white/20 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 w-full"
                        disabled={teams.length === 0}
                    >
                        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select>
                    <div className="relative w-full">
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => setDateRange(update)}
                            isClearable={true}
                            className="bg-white/10 dark:bg-gray-700/50 border border-white/20 rounded-lg p-2.5 pl-10 text-white w-full"
                            wrapperClassName="w-full"
                        />
                         <CalendarIcon className="w-5 h-5 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"/>
                    </div>
                </div>
            </div>
            
             {/* Content Area */}
            <div className="bg-white/5 dark:bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 min-h-[400px] flex items-center justify-center">
                {isLoading && <p>Loading report...</p>}
                {error && (
                    <div className="text-center text-red-400">
                        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">
                            {error.includes('not configured') ? 'Configuration Required' : 'An Error Occurred'}
                        </h3>
                        <p className="text-sm mb-4">{error}</p>
                        {error.includes('not configured') && (
                            <Button
                                onClick={() => onNavigate('settings')}
                                className="mt-4"
                            >
                                Go to Settings
                            </Button>
                        )}
                    </div>
                )}
                 {!isLoading && !error && reportData.length > 0 && (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={reportData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.7)" />
                            <YAxis stroke="rgba(255, 255, 255, 0.7)" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke="#8884d8" strokeWidth={2} />
                            <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#82ca9d" strokeWidth={2} />
                            <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#ffc658" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
                {!isLoading && !error && reportData.length === 0 && (
                     <div className="text-center text-gray-400">
                        <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">No Data Available</h3>
                        <p className="text-sm">There is no report data for the selected team and date range.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportsView; 