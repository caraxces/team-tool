'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CalendarIcon, ClockIcon, MapPinIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Meeting } from '@/types/meeting.type';
import { getMyMeetings } from '@/services/meeting.service';
import CreateMeetingModal from './CreateMeetingModal';
import MeetingDetailModal from './MeetingDetailModal';
import DayView from './DayView'; // Import DayView
import { hexToRgba } from '@/lib/utils';

const statusColors: { [key: string]: string } = {
  scheduled: '#3b82f6', // blue-500
  ongoing: '#22c55e',   // green-500
  completed: '#6b7280', // gray-500
  cancelled: '#ef4444', // red-500
};

const CalendarView = () => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [dayToView, setDayToView] = useState<Date | null>(null); // State for DayView
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const { data: meetings = [], isLoading: isLoadingMeetings } = useQuery<Meeting[], Error>({
    queryKey: ['meetings', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      return getMyMeetings({ start_date: startDateStr, end_date: endDateStr });
    },
    // Keep data from previous month while new one is loading
    placeholderData: (previousData) => previousData,
  });

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => 
      isSameDay(parseISO(meeting.start_time), date)
    );
  };

  const generateCalendarDays = () => {
    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleCreateMeeting = (date?: Date) => {
    setSelectedDate(date || new Date());
    setIsCreateModalOpen(true);
  };

  const handleMeetingCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['meetings', format(monthStart, 'yyyy-MM')] });
    setIsCreateModalOpen(false);
  };

  const handleOpenDayView = (date: Date) => {
    setDayToView(date);
  };

  const handleCreateMeetingFromDayView = (startTime: Date) => {
    setDayToView(null); // Close DayView
    handleCreateMeeting(startTime);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/95 to-blue-900/95 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-8 w-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Lịch Họp</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={handleToday}
                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-colors"
              >
                Hôm nay
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">
              {format(currentDate, 'MMMM yyyy', { locale: vi })}
            </h2>
            <button
              onClick={() => handleCreateMeeting()}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Tạo cuộc họp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-gradient-to-br from-slate-900/90 via-blue-900/20 to-purple-900/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 min-h-0">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="text-center py-3 text-gray-300 font-medium text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-4 auto-rows-fr" style={{ height: 'calc(100% - 4rem)' }}>
          {calendarDays.map((day, index) => {
            const dayMeetings = getMeetingsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={index}
                className={`
                  relative border border-white/10 rounded-lg p-3 cursor-pointer transition-all
                  min-h-[120px] max-h-[140px] flex flex-col
                  ${isCurrentMonth ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-800/30 text-gray-500'}
                  ${isToday ? 'ring-2 ring-cyan-400 bg-cyan-500/10' : ''}
                  ${isSelected ? 'ring-2 ring-yellow-400 bg-yellow-500/10' : ''}
                  hover:transform hover:scale-[1.02] hover:shadow-lg
                `}
                onClick={() => setSelectedDate(day)}
                onDoubleClick={() => handleOpenDayView(day)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`
                    text-sm font-medium
                    ${isCurrentMonth ? 'text-white' : 'text-gray-500'}
                    ${isToday ? 'text-cyan-300 font-bold' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayMeetings.length > 0 && (
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full font-medium">
                      {dayMeetings.length}
                    </span>
                  )}
                </div>

                {/* Meeting indicators */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayMeetings.slice(0, 2).map((meeting) => {
                    const color = statusColors[meeting.status] || statusColors.scheduled;
                    return (
                      <div
                        key={meeting.id}
                        className={`
                          text-xs p-2 rounded truncate cursor-pointer
                          backdrop-blur-sm
                          hover:opacity-100 transition-all
                          text-white shadow-sm border
                        `}
                        style={{
                          backgroundColor: hexToRgba(color, 0.3),
                          borderColor: hexToRgba(color, 0.5),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMeeting(meeting);
                        }}
                        title={meeting.title}
                      >
                        <div className="flex items-center space-x-1">
                          {meeting.meeting_type === 'online' && <VideoCameraIcon className="h-3 w-3 flex-shrink-0" />}
                          {meeting.meeting_type === 'offline' && <MapPinIcon className="h-3 w-3 flex-shrink-0" />}
                          <ClockIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate text-xs">{meeting.title}</span>
                        </div>
                      </div>
                    );
                  })}
                  {dayMeetings.length > 2 && (
                    <div className="text-xs text-gray-400 text-center py-1 bg-gray-700/30 rounded">
                      +{dayMeetings.length - 2} cuộc họp khác
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleMeetingCreated}
        selectedDate={selectedDate || undefined}
      />

      <MeetingDetailModal
        meeting={selectedMeeting}
        isOpen={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['meetings', format(monthStart, 'yyyy-MM')] })}
      />

      {dayToView && (
        <DayView
          date={dayToView}
          meetings={getMeetingsForDate(dayToView)}
          onClose={() => setDayToView(null)}
          onSelectMeeting={(meeting) => {
            setDayToView(null);
            setSelectedMeeting(meeting);
          }}
          onCreateMeeting={handleCreateMeetingFromDayView}
        />
      )}
    </div>
  );
};

export default CalendarView; 