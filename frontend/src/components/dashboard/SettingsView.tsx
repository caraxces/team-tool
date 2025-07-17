'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { Settings, HelpCircle, Key, FileJson, CheckCircle } from 'lucide-react';

import { getMyTeams } from '@/services/team.service';
import { saveGA4Settings, getGA4Settings } from '@/services/settings.service';
import { Team } from '@/types/team.type';
import { useAuth } from '@/context/AuthContext';
import LocationManagement from './LocationManagement';
import RoleManagement from './RoleManagement';
import AttendanceManagement from './AttendanceManagement';

// Zod Schema for validation
const ga4SettingsSchema = z.object({
  team_id: z.coerce.number().min(1, 'Please select a team.'),
  ga4_property_id: z.string().min(1, 'Property ID is required.'),
  measurement_id: z.string().optional(),
  api_secret: z.string().optional(),
  service_account_file: z.any().optional(),
});
type GA4SettingsFormValues = z.infer<typeof ga4SettingsSchema>;

const SettingsView = () => {
    const { state: authState } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [existingSettings, setExistingSettings] = useState<any>(null);
    const [serviceAccountFile, setServiceAccountFile] = useState<File | null>(null);

    const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<GA4SettingsFormValues>({
        resolver: zodResolver(ga4SettingsSchema),
    });

    // Fetch user's teams
    useEffect(() => {
        getMyTeams().then(fetchedTeams => {
            setTeams(fetchedTeams);
            if (fetchedTeams.length > 0) {
                const firstTeamId = fetchedTeams[0].id;
                setSelectedTeam(firstTeamId);
                setValue('team_id', firstTeamId);
            }
        }).catch(() => toast.error("Failed to load teams."));
    }, [setValue]);

    // Fetch existing settings when a team is selected
    useEffect(() => {
        if (selectedTeam) {
            getGA4Settings(selectedTeam).then(response => {
                if (response.success) {
                    setExistingSettings(response.data);
                    reset({ team_id: selectedTeam, ga4_property_id: response.data.ga4_property_id, measurement_id: response.data.measurement_id });
                } else {
                     setExistingSettings(null);
                     reset({ team_id: selectedTeam, ga4_property_id: '', measurement_id: '', api_secret: '' });
                }
            }).catch(() => {
                setExistingSettings(null);
                reset({ team_id: selectedTeam, ga4_property_id: '', measurement_id: '', api_secret: '' });
            });
        }
    }, [selectedTeam, reset]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setValue('service_account_file', file, { shouldValidate: true });
            setServiceAccountFile(file);
        }
    }, [setValue]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/json': ['.json'] }, multiple: false });

    const onSubmit = async (data: GA4SettingsFormValues) => {
        setIsLoading(true);
        try {
            if (!serviceAccountFile && !existingSettings?.has_service_account) {
                 toast.error('Service Account JSON file is required.');
                 setIsLoading(false);
                 return;
            }
            await saveGA4Settings({ ...data, service_account_file: serviceAccountFile || undefined });
            toast.success('GA4 settings saved successfully!');
            if (selectedTeam) { // Re-fetch settings to update status
                 getGA4Settings(selectedTeam).then(res => setExistingSettings(res.data));
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save settings.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center mb-8">
                <Settings className="h-8 w-8 text-gray-500 mr-4" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl p-4 sm:p-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                    <img src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" alt="GA4 Icon" className="h-6 w-6 mr-3" />
                    Google Analytics 4 Integration
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Connect your Google Analytics 4 property to view reports directly in your dashboard.</p>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Team Selection */}
                    <div>
                        <label htmlFor="team_id" className="block text-sm font-medium mb-1">Team</label>
                        <select
                            {...register('team_id')}
                            onChange={e => setSelectedTeam(Number(e.target.value))}
                            className="w-full bg-white/5 dark:bg-gray-700/50 border border-gray-300 dark:border-white/20 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                        >
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                    </div>

                    {/* GA4 Property ID */}
                    <div>
                        <label htmlFor="ga4_property_id" className="block text-sm font-medium mb-1">GA4 Property ID</label>
                        <input {...register('ga4_property_id')} placeholder="123456789" className="w-full input-class" />
                        {errors.ga4_property_id && <p className="text-red-500 text-xs mt-1">{errors.ga4_property_id.message}</p>}
                    </div>

                     {/* Service Account Credentials */}
                    <div>
                         <label className="block text-sm font-medium mb-1">Service Account Credentials (.json)</label>
                         <div {...getRootProps()} className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragActive ? 'border-blue-500' : 'border-gray-300 dark:border-white/20'} border-dashed rounded-md cursor-pointer`}>
                             <div className="space-y-1 text-center">
                                 <FileJson className="mx-auto h-12 w-12 text-gray-400"/>
                                 <p className="text-sm text-gray-600 dark:text-gray-400">{serviceAccountFile ? `Selected: ${serviceAccountFile.name}` : (isDragActive ? 'Drop the file here...' : 'Drag & drop a file here, or click to select')}</p>
                             </div>
                         </div>
                         {existingSettings?.has_service_account && !serviceAccountFile && (
                            <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
                                <CheckCircle className="h-4 w-4 mr-2"/>
                                <span>A service account file is already configured. Upload a new one to replace it.</span>
                            </div>
                         )}
                    </div>
                    
                    {/* Optional Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="measurement_id" className="block text-sm font-medium mb-1">Measurement ID (Optional)</label>
                            <input {...register('measurement_id')} placeholder="G-XXXXXXXXXX" className="w-full bg-white/5 dark:bg-gray-700/50 border border-gray-300 dark:border-white/20 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="api_secret" className="block text-sm font-medium mb-1">API Secret (Optional)</label>
                            <input type="password" {...register('api_secret')} placeholder="••••••••••••••••" className="w-full bg-white/5 dark:bg-gray-700/50 border border-gray-300 dark:border-white/20 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500" />
                             {existingSettings?.has_api_secret && <p className="text-xs text-green-500 mt-1">An API secret is already configured.</p>}
                        </div>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="pt-4 flex justify-end">
                        <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50">
                            {isLoading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Location Management Section - Admin Only */}
            {authState.user?.role_id === 1 && <LocationManagement />}

            {/* Role Management Section - Admin Only */}
            {authState.user?.role_id === 1 && <RoleManagement />}

            {/* Attendance Management Section - HR/HRM Only */}
            {authState.user && [4, 5].includes(authState.user.role_id) && <AttendanceManagement />}
        </div>
    );
}

export default SettingsView; 