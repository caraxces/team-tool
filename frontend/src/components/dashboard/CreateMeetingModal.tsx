'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Calendar, Clock, MapPin, Users, Type, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/styles/datepicker.css'; // Import custom styles
import { createMeeting } from '@/services/meeting.service';
import { getUsers } from '@/services/user.service';
import { CreateMeetingDto } from '@/types/meeting.type';
import { User } from '@/types/user.type';
import CustomSelect from '../ui/CustomSelect'; // Import CustomSelect

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: Date;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedDate
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateMeetingDto>({
    defaultValues: {
      title: '',
      description: '',
      start_time: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
      end_time: '',
      location: '',
      meeting_type: 'online',
      participant_ids: [],
      color: '#3B82F6'
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (selectedDate) {
        const endTime = new Date(selectedDate);
        endTime.setHours(endTime.getHours() + 1);
        reset({
          title: '',
          description: '',
          start_time: selectedDate.toISOString().slice(0, 16),
          end_time: endTime.toISOString().slice(0, 16),
          location: '',
          meeting_type: 'online',
          participant_ids: [],
          color: '#3B82F6'
        });
      }
    }
  }, [isOpen, selectedDate, reset]);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const onSubmit = async (data: CreateMeetingDto) => {
    setIsLoading(true);
    try {
      // Ensure participant_ids is always an array
      const payload = {
        ...data,
        participant_ids: data.participant_ids || [],
      };
      await createMeeting(payload);
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      console.error('Error creating meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const meetingTypeOptions = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const userOptions = users.map(user => ({
    value: user.id,
    label: `${user.fullName} (${user.email})`
  }));

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-white/10 dark:border-gray-700/30 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Meeting
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Type className="w-4 h-4 inline mr-2" />
              Meeting Title *
            </label>
            <Controller
              name="title"
              control={control}
              rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="Enter meeting title"
                />
              )}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm resize-none"
                  placeholder="Enter meeting description"
                />
              )}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Start Time *
              </label>
              <Controller
                name="start_time"
                control={control}
                rules={{ required: 'Start time is required' }}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value ? new Date(field.value) : null}
                    onChange={(date: Date | null) => {
                      if (date) {
                        field.onChange(date.toISOString());
                      }
                    }}
                    showTimeSelect
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                    placeholderText="Select start date and time"
                  />
                )}
              />
              {errors.start_time && (
                <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                End Time *
              </label>
              <Controller
                name="end_time"
                control={control}
                rules={{ required: 'End time is required' }}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value ? new Date(field.value) : null}
                    onChange={(date: Date | null) => {
                      if (date) {
                        field.onChange(date.toISOString());
                      }
                    }}
                    showTimeSelect
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                    placeholderText="Select end date and time"
                  />
                )}
              />
              {errors.end_time && (
                <p className="text-red-500 text-sm mt-1">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          {/* Location and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Location
              </label>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                    placeholder="Meeting location or link"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Type
              </label>
              <Controller
                name="meeting_type"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    {...field}
                    options={meetingTypeOptions}
                    placeholder="Select meeting type"
                  />
                )}
              />
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Participants
            </label>
            <Controller
              name="participant_ids"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  multiple
                  {...field}
                  options={userOptions}
                  placeholder="Select participants"
                />
              )}
            />
            <p className="text-xs text-gray-500 mt-1">Click to select one or more participants.</p>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting Color
            </label>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        field.value === color 
                          ? 'border-gray-800 dark:border-white scale-110' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-all backdrop-blur-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal; 