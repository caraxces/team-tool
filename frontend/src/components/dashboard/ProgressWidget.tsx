import React, { useState, useEffect } from 'react';
import { ChartPieIcon, CheckCircleIcon, ExclamationTriangleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { getTaskStats } from '@/services/task.service';

const CircularProgressBar = ({ progress, size, strokeWidth }: { progress: number, size: number, strokeWidth: number }) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-white/10"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        <circle
          className="text-neon-pink"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-bold text-white">{progress}%</span>
      </div>
    </div>
  );
};

interface TaskStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overallProgress: number;
}

const ProgressWidget = () => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await getTaskStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load progress data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
        <div className="bg-dark-blue/30 backdrop-blur-md border border-neon-pink/20 rounded-2xl p-6 shadow-lg shadow-neon-pink/10 text-white flex flex-col items-center justify-center h-full">
            <p>Loading Progress...</p>
        </div>
    );
  }

  if (error || !stats) {
    return (
        <div className="bg-dark-blue/30 backdrop-blur-md border border-neon-pink/20 rounded-2xl p-6 shadow-lg shadow-neon-pink/10 text-white flex flex-col items-center justify-center h-full">
             <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-red-400">{error || 'Could not fetch data.'}</p>
        </div>
    );
  }

  const displayStats = [
    { name: 'Completed', value: stats.completedTasks, icon: CheckCircleIcon, color: 'text-green-400' },
    { name: 'Pending', value: stats.pendingTasks, icon: ExclamationTriangleIcon, color: 'text-yellow-400' },
    { name: 'Total Tasks', value: stats.totalTasks, icon: Bars3Icon, color: 'text-sky-400' },
  ]

  return (
    <div className="bg-dark-blue/30 backdrop-blur-md border border-neon-pink/20 rounded-2xl p-6 shadow-lg shadow-neon-pink/10 text-white flex flex-col items-center h-full">
      <div className="flex items-center mb-6 self-start">
        <ChartPieIcon className="h-7 w-7 text-neon-pink mr-3" />
        <h2 className="text-xl font-bold">Overall Progress</h2>
      </div>
      <div className="flex-grow flex items-center justify-center">
        <CircularProgressBar progress={stats.overallProgress} size={180} strokeWidth={14} />
      </div>
      <div className="w-full flex flex-col sm:grid sm:grid-cols-3 gap-4 mt-6">
        {displayStats.map(stat => (
            <div key={stat.name} className="bg-white/5 p-3 rounded-lg flex flex-row items-center sm:flex-col sm:justify-center sm:text-center">
                <stat.icon className={`h-7 w-7 sm:h-6 sm:w-6 sm:mx-auto mb-0 sm:mb-1 mr-4 sm:mr-0 ${stat.color}`} />
                <div className="flex-grow text-left sm:text-center">
                  <p className="text-sm text-gray-400">{stat.name}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressWidget; 