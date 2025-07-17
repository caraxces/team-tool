import React, { useState, useEffect } from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import { getMyTasks, updateTaskStatus } from '@/services/task.service';
import { Task } from '@/types/task.type';
import toast from 'react-hot-toast';

interface TasksWidgetProps {
    onNavigateToTasks: () => void;
}

const TasksWidget: React.FC<TasksWidgetProps> = ({ onNavigateToTasks }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await getMyTasks();
        setTasks(fetchedTasks);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);


  const handleToggle = (taskToToggle: Task) => {
    const newStatus = taskToToggle.status === 'done' ? 'todo' : 'done';

    const originalTasks = tasks;

    // Optimistic UI update
    setTasks(tasks.map(task => 
      task.id === taskToToggle.id 
        ? { ...task, status: newStatus } 
        : task
    ));
    
    // API call to persist change
    updateTaskStatus(taskToToggle.id, newStatus).catch(() => {
      toast.error("Failed to update task.");
      // Revert on failure
      setTasks(originalTasks);
    });
  };

  return (
    <div className="bg-dark-blue/30 backdrop-blur-md border border-neon-blue/20 rounded-2xl p-6 shadow-lg shadow-neon-blue/10 text-white h-full flex flex-col">
      <div className="flex items-center mb-6">
        <CheckBadgeIcon className="h-7 w-7 text-neon-blue mr-3" />
        <h2 className="text-xl font-bold">My Tasks</h2>
      </div>
      <div className="space-y-3 flex-grow overflow-y-auto pr-2">
        {loading && <p>Loading tasks...</p>}
        {error && <p className="text-red-400">Error: {error}</p>}
        {!loading && !error && tasks.map((task) => (
          <div key={task.id} className="flex items-center" onClick={() => handleToggle(task)}>
            <div className={`w-5 h-5 rounded-md flex-shrink-0 mr-3 cursor-pointer flex items-center justify-center ${task.status === 'done' ? 'bg-neon-blue' : 'border-2 border-neon-blue/50'}`}>
              {task.status === 'done' && <svg className="w-3 h-3 text-dark-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={`flex-grow cursor-pointer text-base ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
              {task.title}
            </span>
          </div>
        ))}
        {!loading && !error && tasks.length === 0 && <p className="text-gray-400">You have no tasks assigned.</p>}
      </div>
      <button 
        onClick={onNavigateToTasks} 
        className="mt-6 w-full bg-white/5 text-neon-blue font-semibold py-2 rounded-lg hover:bg-white/10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-neon-blue">
          View All Tasks
      </button>
    </div>
  );
};

export default TasksWidget; 