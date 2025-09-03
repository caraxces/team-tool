'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';

import * as locationService from '@/services/location.service';
import { WorkLocation } from '@/services/location.service';

interface LocationFormData {
    id?: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius: number;
}

const LocationManagement = () => {
    const [locations, setLocations] = useState<WorkLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<WorkLocation | null>(null);

    const { register, handleSubmit, reset, setValue } = useForm<LocationFormData>({
        defaultValues: {
            radius: 50 // Default radius
        }
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const locationsData = await locationService.getLocations();
            setLocations(locationsData);
        } catch (error) {
            toast.error('Failed to fetch locations.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFormSubmit = async (data: LocationFormData) => {
        const promise = isEditing
            ? locationService.updateLocation(isEditing.id, data)
            : locationService.createLocation(data);

        toast.promise(promise, {
            loading: isEditing ? 'Updating location...' : 'Creating location...',
            success: () => {
                fetchData();
                reset();
                setIsEditing(null);
                return `Location ${isEditing ? 'updated' : 'created'} successfully!`;
            },
            error: `Failed to ${isEditing ? 'update' : 'create'} location.`,
        });
    };
    
    const handleEditClick = (location: WorkLocation) => {
        setIsEditing(location);
        setValue('name', location.name);
        setValue('address', location.address);
        setValue('latitude', location.latitude);
        setValue('longitude', location.longitude);
        setValue('radius', location.radius);
    };

    const handleDeleteClick = async (id: number) => {
        if (confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
            toast.promise(locationService.deleteLocation(id), {
                loading: 'Deleting location...',
                success: () => {
                    fetchData();
                    return 'Location deleted successfully!';
                },
                error: (err) => err?.response?.data?.message || 'Failed to delete location.',
            });
        }
    };
    
    if (isLoading) {
        return <div className="text-center p-8">Loading location settings...</div>;
    }

    return (
        <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-6 flex items-center"><MapPin className="mr-3 text-neon-blue" /> Work Location Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="md:col-span-1">
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-4 bg-white/5 rounded-lg">
                        <h3 className="text-lg font-medium mb-2">{isEditing ? 'Edit Location' : 'Add New Location'}</h3>
                        
                        <input {...register('name')} placeholder="Location Name (e.g., Office)" className="w-full input-style" required />
                        <input {...register('address')} placeholder="Address" className="w-full input-style" required />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="number" step="any" {...register('latitude', { valueAsNumber: true })} placeholder="Latitude" className="w-full input-style" required />
                            <input type="number" step="any" {...register('longitude', { valueAsNumber: true })} placeholder="Longitude" className="w-full input-style" required />
                        </div>
                        <div>
                            <label className="text-sm">Radius (meters)</label>
                            <input type="number" {...register('radius', { valueAsNumber: true })} placeholder="Radius in meters" className="w-full input-style" required />
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2">
                            {isEditing && <button type="button" onClick={() => { setIsEditing(null); reset(); }} className="btn-secondary">Cancel</button>}
                            <button type="submit" className="btn-primary flex items-center gap-2">{isEditing ? 'Update' : <><Plus size={16}/> Add</>}</button>
                        </div>
                    </form>
                </div>

                {/* List Section */}
                <div className="md:col-span-2">
                    <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {locations.length === 0 && <p className="text-gray-400">No locations found. Add one to get started.</p>}
                        {locations.map(location => (
                            <div key={location.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10">
                                <div>
                                    <p className="font-bold">{location.name}</p>
                                    <p className="text-sm text-gray-400 truncate">{location.address}</p>
                                    <p className="text-xs text-neon-blue/80">Lat: {location.latitude}, Lon: {location.longitude}, Radius: {location.radius}m</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEditClick(location)} className="p-2 rounded-full hover:bg-blue-500/20"><Edit size={16}/></button>
                                    <button onClick={() => handleDeleteClick(location.id)} className="p-2 rounded-full hover:bg-red-500/20"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationManagement; 