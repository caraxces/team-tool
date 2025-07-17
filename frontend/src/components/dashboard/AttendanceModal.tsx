'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as attendanceService from '@/services/attendance.service';
import { AttendanceRecord as AttendanceRecordType } from '@/services/attendance.service';
import { X, Loader2, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'LOADING' | 'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'CLOCKED_OUT' | 'ERROR';
type Feedback = { type: 'error' | 'success' | 'info'; message: string } | null;

export const AttendanceModal = ({ isOpen, onClose }: AttendanceModalProps) => {
  const { state: authState } = useAuth();
  const [status, setStatus] = useState<Status>('LOADING');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecordType | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAttendanceStatus();
    }
  }, [isOpen]);

  const fetchAttendanceStatus = async () => {
    setStatus('LOADING');
    setFeedback(null);
    try {
      const response = await attendanceService.getAttendanceStatus();
      const record = response.data;
      setAttendanceRecord(record);
      if (!record) {
        setStatus('NOT_CLOCKED_IN');
      } else if (record.clock_out_time) {
        setStatus('CLOCKED_OUT');
      } else {
        setStatus('CLOCKED_IN');
      }
    } catch (error) {
      console.error("Failed to fetch attendance status:", error);
      setStatus('ERROR');
      setFeedback({ type: 'error', message: 'Không thể tải dữ liệu chấm công.' });
    }
  };

  const handleClockIn = () => {
    setStatus('LOADING');
    setFeedback({ type: 'info', message: 'Đang lấy vị trí của bạn...' });
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setFeedback({ type: 'info', message: 'Vị trí đã được lấy, đang xác thực...' });
        try {
          const { latitude, longitude } = position.coords;
          const response = await attendanceService.clockIn(latitude, longitude);
          const finalRecord = response.data;

          setAttendanceRecord(finalRecord);
          setStatus('CLOCKED_IN');

          if (finalRecord.status === 'OUT_OF_RANGE') {
            setFeedback({ type: 'error', message: 'Vị trí chấm công không hợp lệ.' });
          } else {
            setFeedback({ type: 'success', message: 'Chấm công vào thành công!' });
          }

        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Lỗi không xác định khi chấm công.';
          setFeedback({ type: 'error', message: errorMessage });
          setStatus('NOT_CLOCKED_IN');
          setAttendanceRecord(null);
        }
      },
      (error) => {
        setStatus('NOT_CLOCKED_IN');
        setFeedback({ type: 'error', message: 'Không thể lấy vị trí. Vui lòng cấp quyền và thử lại.' });
      }
    );
  };
  
  const handleClockOut = async () => {
    setStatus('LOADING');
    setFeedback(null);
    try {
      const response = await attendanceService.clockOut();
      setFeedback({ type: 'success', message: 'Chấm công ra thành công!' });
      setStatus('CLOCKED_OUT');
      setAttendanceRecord(response.data);
    } catch (error: any) {
      setStatus('CLOCKED_IN');
      setFeedback({ type: 'error', message: error.response?.data?.message || 'Lỗi khi chấm công ra.' });
    }
  };

  if (!isOpen) return null;

  const renderTimelineItem = (label: string, time: string | null, status: 'LATE' | 'ON_TIME' | 'OUT_OF_RANGE' | null) => (
    <div className="flex items-start">
      <div className="flex flex-col items-center mr-4">
        <div className={`w-3 h-3 rounded-full mt-1 ${time ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
        <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
      </div>
      <div>
        <p className="font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {time ? (
          <div className="flex items-center mt-1">
             <p className="text-gray-500 dark:text-gray-400">{format(new Date(time), 'HH:mm:ss')}</p>
             {status === 'LATE' && <span className="ml-2 text-xs font-semibold text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-800/50 px-2 py-0.5 rounded-full">Trễ</span>}
             {status === 'ON_TIME' && <span className="ml-2 text-xs font-semibold text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-800/50 px-2 py-0.5 rounded-full">Đúng giờ</span>}
             {status === 'OUT_OF_RANGE' && <span className="ml-2 text-xs font-semibold text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-800/50 px-2 py-0.5 rounded-full">Ngoài phạm vi</span>}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">Chưa bắt đầu</p>
        )}
      </div>
    </div>
  );
  
  const renderActionButton = () => {
    const commonClasses = "w-full py-4 rounded-full text-lg font-bold transition-all duration-300 flex items-center justify-center shadow-lg";
    const disabledClasses = "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed";
    
    if (status === 'LOADING') {
      return <button disabled className={`${commonClasses} ${disabledClasses}`}><Loader2 className="animate-spin mr-2" /> Đang xử lý...</button>;
    }
    if (status === 'CLOCKED_OUT') {
      return <button disabled className={`${commonClasses} bg-green-500 text-white`}><CheckCircle className="mr-2" /> Hoàn thành</button>;
    }
    if (status === 'NOT_CLOCKED_IN') {
      return <button onClick={handleClockIn} className={`${commonClasses} bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/30`}>Clock In</button>;
    }
    if (status === 'CLOCKED_IN') {
      return <button onClick={handleClockOut} className={`${commonClasses} bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30`}>Clock Out</button>;
    }
    if (status === 'ERROR') {
      return <button onClick={fetchAttendanceStatus} className={`${commonClasses} bg-red-500 hover:bg-red-600 text-white shadow-red-500/30`}>Thử lại</button>;
    }
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm m-4 p-6 text-center transform transition-all" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={24} />
        </button>
        
        <div className="flex items-center text-left mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl mr-4">
              {authState.user?.fullName?.[0] || 'U'}
            </div>
            <div>
                <p className="font-bold text-lg text-gray-800 dark:text-white">Hi, {authState.user?.fullName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chúc bạn một ngày làm việc hiệu quả!</p>
            </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 my-6">
          <div className="text-5xl font-mono font-bold text-gray-800 dark:text-white mb-4">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          {renderActionButton()}
          {feedback && (
             <div className={`mt-4 flex items-center justify-center text-sm ${
                feedback.type === 'error' ? 'text-red-500' : 
                feedback.type === 'success' ? 'text-green-500' : 'text-blue-500'
             }`}>
                {feedback.type === 'error' && <AlertTriangle size={16} className="mr-2"/>}
                {feedback.message}
             </div>
          )}
        </div>

        <div>
          {renderTimelineItem('Clock in', attendanceRecord?.clock_in_time || null, attendanceRecord?.status || null)}
          {renderTimelineItem('Clock out', attendanceRecord?.clock_out_time || null, null)}
        </div>

      </div>
    </div>
  );
}; 