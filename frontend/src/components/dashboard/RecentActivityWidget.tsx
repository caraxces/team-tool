import React from 'react';
import { ClockIcon, UserPlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const activities = [
  { id: 1, text: 'Linh đã tạo một task mới: "Thiết kế trang chủ"', time: '5 phút trước', icon: <CheckCircleIcon className="w-5 h-5 text-green-400" /> },
  { id: 2, text: 'An đã tham gia dự án "Website Redesign"', time: '1 giờ trước', icon: <UserPlusIcon className="w-5 h-5 text-blue-400" /> },
  { id: 3, text: 'Huy cập nhật trạng thái task "API Integration" thành "Hoàn thành"', time: '3 giờ trước', icon: <ClockIcon className="w-5 h-5 text-purple-400" /> },
];

const RecentActivityWidget = () => {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-white">
      <h3 className="font-bold text-lg mb-4">Hoạt động gần đây</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 pt-1">
              {activity.icon}
            </div>
            <div>
              <p className="text-sm">{activity.text}</p>
              <p className="text-xs text-gray-400">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityWidget; 