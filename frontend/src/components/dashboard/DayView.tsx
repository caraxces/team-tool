'use client';

import React from 'react';
import { format, setHours, setMinutes, startOfDay, endOfDay, differenceInMinutes, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Meeting } from '@/types/meeting.type';
import { ClockIcon, VideoCameraIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DayViewProps {
  date: Date;
  meetings: Meeting[];
  onClose: () => void;
  onSelectMeeting: (meeting: Meeting) => void;
  onCreateMeeting: (startTime: Date) => void;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(8, 145, 178, ${alpha})`; // Default to cyan if invalid
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Define the range of hours to display
const START_HOUR = 7;
const END_HOUR = 22;

const DayView: React.FC<DayViewProps> = ({ date, meetings, onClose, onSelectMeeting, onCreateMeeting }) => {
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
  const hourHeight = 80; // height in pixels for one hour, e.g., 4rem * 2 for two 30-min slots

  const getMeetingPosition = (meeting: Meeting) => {
    const startTime = parseISO(meeting.start_time);
    const endTime = parseISO(meeting.end_time);
    
    const viewStart = setHours(startOfDay(date), START_HOUR);
    
    const top = differenceInMinutes(startTime, viewStart) * (hourHeight / 60);
    const height = differenceInMinutes(endTime, startTime) * (hourHeight / 60);

    return { top, height };
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-900/95 border border-white/20 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col p-6 text-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-cyan-300">{format(date, 'eeee, dd MMMM yyyy', { locale: vi })}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-white" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar relative">
          {/* Time slots and grid lines */}
          <div className="relative">
            {hours.map(hour => (
              <div key={hour} style={{ height: `${hourHeight}px` }} className="grid grid-cols-[auto_1fr] gap-x-4">
                <div className="text-right pr-4 -mt-2.5">
                  <span className="text-sm text-gray-400">{format(setHours(date, hour), 'HH:mm')}</span>
                </div>
                <div 
                  className="border-t border-white/10 cursor-pointer"
                  onClick={() => onCreateMeeting(setMinutes(setHours(startOfDay(date), hour), 0))}
                ></div>
              </div>
            ))}
            
            {/* Render Meetings */}
            {meetings.map(meeting => {
              const { top, height } = getMeetingPosition(meeting);
              const meetingColor = meeting.color || '#0891B2';
              return (
                <div
                  key={meeting.id}
                  className="absolute left-[70px] right-0 z-10 p-2 rounded-lg cursor-pointer flex flex-col justify-between border backdrop-blur-sm"
                  style={{ 
                    top: `${top}px`, 
                    height: `${height}px`,
                    backgroundColor: hexToRgba(meetingColor, 0.2),
                    borderColor: hexToRgba(meetingColor, 0.4),
                    boxShadow: `0 5px 20px ${hexToRgba(meetingColor, 0.15)}`,
                  }}
                  onClick={() => onSelectMeeting(meeting)}
                  title={meeting.title}
                >
                  <div>
                    <p className="font-bold truncate text-sm">{meeting.title}</p>
                    <div className="flex items-center space-x-1 mt-1 opacity-80 text-xs">
                        {meeting.meeting_type === 'online' && <VideoCameraIcon className="h-3 w-3 flex-shrink-0" />}
                        {meeting.meeting_type === 'offline' && <MapPinIcon className="h-3 w-3 flex-shrink-0" />}
                        <span>{format(parseISO(meeting.start_time), 'HH:mm')} - {format(parseISO(meeting.end_time), 'HH:mm')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView; 