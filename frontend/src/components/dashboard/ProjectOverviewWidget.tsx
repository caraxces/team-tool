import React, { useState, useEffect } from 'react';
import { BriefcaseIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getMyProjects } from '@/services/project.service';
import { Project } from '@/types/project.type';

const ProjectOverviewWidget = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const fetchedProjects = await getMyProjects();
        setProjects(fetchedProjects);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusClass = (status: Project['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/30 text-green-300';
      case 'On Track':
        return 'bg-sky-500/30 text-sky-300';
      case 'At Risk':
        return 'bg-red-500/30 text-red-300';
      case 'Planning':
        return 'bg-yellow-500/30 text-yellow-300';
      default:
        return 'bg-gray-500/30 text-gray-300';
    }
  };

  return (
    <div className="bg-dark-blue/30 backdrop-blur-md border border-neon-blue/20 rounded-2xl p-6 shadow-lg shadow-neon-blue/10 text-white">
      <div className="flex items-center mb-4">
        <BriefcaseIcon className="h-7 w-7 text-neon-blue mr-3" />
        <h2 className="text-xl font-bold">Project Overview</h2>
      </div>
      <div className="space-y-4">
        {loading && <p>Loading projects...</p>}
        {error && <p className="text-red-400">Error: {error}</p>}
        {!loading && !error && projects.map((project) => (
          <div key={project.id} className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors duration-300">
            <div className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-center mb-2">
              <span className="font-semibold mb-2 sm:mb-0">{project.name}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusClass(project.status)}`}>
                {project.status}
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2.5">
              <div
                className="bg-sky-gradient h-2.5 rounded-full"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              <span>Progress: {project.progress}%</span>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>{new Date(project.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectOverviewWidget; 