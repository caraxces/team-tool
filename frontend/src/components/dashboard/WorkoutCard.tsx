import React from 'react';

interface WorkoutCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ title, description, icon }) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-white flex items-center space-x-4">
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-md">{title}</h4>
        <p className="text-sm text-gray-300">{description}</p>
      </div>
    </div>
  );
};

export default WorkoutCard; 