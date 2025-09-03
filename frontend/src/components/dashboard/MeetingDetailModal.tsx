'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Calendar, Clock, MapPin, Users, Type, FileText, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { updateMeeting, deleteMeeting, updateParticipantResponse } from '@/services/meeting.service';
import { getUsers } from '@/services/user.service';
import { Meeting, CreateMeetingDto } from '@/types/meeting.type';
import { User } from '@/types/user.type';

interface MeetingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  meeting: Meeting | null;
  currentUserId?: number;
}

const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  meeting,
  currentUserId
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateMeetingDto>({
    defaultValues: {
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      meeting_type: 'online',
      participant_ids: [],
      color: '#3B82F6'
    }
  });

  useEffect(() => {
    if (isOpen && meeting) {
      fetchUsers();
      reset({
        title: meeting.title,
        description: meeting.description || '',
        start_time: new Date(meeting.start_time).toISOString().slice(0, 16),
        end_time: new Date(meeting.end_time).toISOString().slice(0, 16),
        location: meeting.location || '',
        meeting_type: meeting.meeting_type,
        participant_ids: meeting.participants?.map(p => p.user_id) || [],
        color: meeting.color || '#3B82F6'
      });
    }
  }, [isOpen, meeting, reset]);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const onSubmit = async (data: CreateMeetingDto) => {
    if (!meeting) return;
    
    setIsLoading(true);
    try {
      await updateMeeting(meeting.id, data);
      setIsEditing(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!meeting) return;
    
    setIsLoading(true);
    try {
      await deleteMeeting(meeting.id);
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error deleting meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (status: 'pending' | 'accepted' | 'declined' | 'tentative') => {
    if (!meeting || !currentUserId) return;
    
    setIsLoading(true);
    try {
      await updateParticipantResponse(meeting.id, status);
      onSuccess();
    } catch (error) {
      console.error('Error responding to meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const meetingTypes = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  const isOrganizer = meeting && currentUserId && meeting.organizer_id === currentUserId;
  const userParticipant = meeting?.participants?.find(p => p.user_id === currentUserId);

  if (!isOpen || !meeting) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-white/10 dark:border-gray-700/30 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isEditing ? 'Edit Meeting' : 'Meeting Details'}
            </h2>
            <div className="flex items-center gap-2">
              {isOrganizer && (
                <>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 hover:bg-red-100/50 dark:hover:bg-red-700/50 text-red-600 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      <input
                        {...field}
                        type="datetime-local"
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
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
                      <input
                        {...field}
                        type="datetime-local"
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
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
                      <select
                        {...field}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                      >
                        {meetingTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
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
                  render={({ field: { value, onChange, ...field } }) => (
                    <select
                      multiple
                      {...field}
                      value={value?.map(id => id.toString()) || []}
                      onChange={(e) => {
                        const selectedValues = Array.from(e.target.selectedOptions).map(option => parseInt(option.value));
                        onChange(selectedValues);
                      }}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm min-h-[120px]"
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id.toString()}>
                          {user.fullName} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}
                />
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple participants</p>
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

              {/* Edit Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
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
                  {isLoading ? 'Updating...' : 'Update Meeting'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Meeting Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {meeting.title}
                  </h3>
                  {meeting.description && (
                    <p className="text-gray-600 dark:text-gray-300">{meeting.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(meeting.start_time).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(meeting.start_time).toLocaleTimeString()} - {new Date(meeting.end_time).toLocaleTimeString()}
                    </span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>{meeting.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Type className="w-4 h-4" />
                    <span className="capitalize">{meeting.meeting_type}</span>
                  </div>
                </div>

                {/* Participants */}
                {meeting.participants && meeting.participants.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Participants
                    </h4>
                    <div className="space-y-2">
                      {meeting.participants.map((participant) => (
                        <div key={participant.user_id} className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-700/30 rounded-lg backdrop-blur-sm">
                          <span className="text-gray-900 dark:text-white">
                            {participant.user?.fullName}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            participant.response_status === 'accepted' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : participant.response_status === 'declined'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                          }`}>
                            {participant.response_status || 'pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response Buttons */}
                {userParticipant && !isOrganizer && (
                  <div className="flex gap-3 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                      onClick={() => handleResponse('accepted')}
                      disabled={isLoading || userParticipant.response_status === 'accepted'}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleResponse('declined')}
                      disabled={isLoading || userParticipant.response_status === 'declined'}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <UserX className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Meeting
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this meeting? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-all"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetailModal; 