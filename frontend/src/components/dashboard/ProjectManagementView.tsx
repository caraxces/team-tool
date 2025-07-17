import React, { useState, useEffect, useMemo } from 'react';
import { FolderIcon, PlusIcon, MagnifyingGlassIcon, FunnelIcon, PencilIcon, TrashIcon, ChevronDoubleRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { getMyProjects, deleteProject } from '@/services/project.service';
import { getUsers } from '@/services/user.service';
import { Project } from '@/types/project.type';
import { User } from '@/types/user.type';
import { CreateProjectModal } from './CreateProjectModal';
import { EditProjectModal } from './EditProjectModal';
import { ConfirmationModal } from './ConfirmationModal';
import toast from 'react-hot-toast';
import { ProjectDetailsWidget } from './ProjectDetailsWidget';
import { useAuth } from '@/context/AuthContext';

const getStatusClass = (status: Project['status']) => {
    switch (status) {
        case 'Completed': return 'bg-green-500/30 text-green-300';
        case 'On Track': return 'bg-sky-500/30 text-sky-300';
        case 'At Risk': return 'bg-yellow-500/30 text-yellow-300';
        // 'Planning' is a new status from backend
        case 'Planning': return 'bg-purple-500/30 text-purple-300'; 
        default: return 'bg-gray-500/30 text-gray-300';
    }
}

const ProjectManagementView = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  // State for the project currently being edited or deleted
  const [projectForModal, setProjectForModal] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const { state } = useAuth();
  const currentUser = state.user;


  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedProjects, fetchedUsers] = await Promise.all([
        getMyProjects(),
        getUsers() // Use getUsers to fetch all users
      ]);
      setProjects(fetchedProjects);
      setUsers(fetchedUsers);
    } catch (error) {
      toast.error('Could not fetch data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleEditClick = (project: Project) => {
    setProjectForModal(project);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (project: Project) => {
    setProjectForModal(project);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectForModal) return;
    try {
        await deleteProject(projectForModal.id);
        toast.success('Project deleted successfully!');
        setDeleteModalOpen(false);
        setProjectForModal(null);
        if (selectedProjectId === projectForModal.id) {
            setSelectedProjectId(null); // Clear details view if deleted
        }
        fetchData(); // Refetch
    } catch (error) {
        toast.error('Failed to delete project.');
    }
  };

  const handleProjectCreated = () => {
    fetchData(); // Refetch projects when a new one is created
  };

  const filteredProjects = useMemo(() => 
    projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [projects, searchTerm]
  );
  
  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );
  
  const canEditSelectedProjectDetails = useMemo(() => {
    if (!currentUser || !selectedProject) return false;
    // Admins can always edit
    if (currentUser.role_id === 1) return true;
    // Roles 2 and 4 can edit if they are the PIC
    if ((currentUser.role_id === 2 || currentUser.role_id === 4) && selectedProject.pic?.id === currentUser.id) {
        return true;
    }
    return false;
  }, [currentUser, selectedProject]);

  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-yellow-500/50 text-white rounded-md px-1">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <>
      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
        users={users}
      />
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setProjectForModal(null);
        }}
        onProjectUpdated={handleProjectCreated}
        project={projectForModal}
        users={users}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProjectForModal(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${projectForModal?.name}"? This will delete all associated tasks and cannot be undone.`}
      />
      <div className="bg-dark-blue/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white h-[calc(100vh-100px)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center">
              <FolderIcon className="h-8 w-8 text-cyan-400 mr-3" />
              <h1 className="text-3xl font-bold text-white">Projects</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCreateModalOpen(true)} className="btn-primary flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                <span>Create Project</span>
            </button>
          </div>
        </div>
        
        <div className="flex-grow flex gap-6 overflow-hidden">
            {/* Left Column: Project List */}
            <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col h-full">
                 {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 bg-black/10 p-3 rounded-lg gap-4 flex-shrink-0">
                    <div className="relative w-full sm:max-w-xs">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2"/>
                        <input 
                            type="text" 
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-glass w-full pl-10"
                        />
                    </div>
                    <button className="btn-secondary flex items-center justify-center">
                        <FunnelIcon className="h-5 w-5 mr-2"/>
                        Filters
                    </button>
                </div>

                {/* Projects List */}
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                     <table className="w-full text-left">
                        <thead className="sticky top-0 bg-dark-blue/80 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-3">Project Name</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={3} className="text-center p-8">Loading...</td></tr>
                            ) : filteredProjects.length === 0 ? (
                                <tr><td colSpan={3} className="text-center p-8">No projects found.</td></tr>
                            ) : (
                                filteredProjects.map(project => (
                                <tr 
                                    key={project.id} 
                                    className={`border-b border-white/10 transition-colors cursor-pointer ${selectedProjectId === project.id ? 'bg-cyan-500/20' : 'hover:bg-white/5'}`}
                                    onClick={() => setSelectedProjectId(project.id)}
                                >
                                    <td className="p-4 font-semibold">{renderHighlightedText(project.name, searchTerm)}</td>
                                    <td className="p-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(project.status)}`}>{project.status}</span></td>
                                    <td className="p-4">
                                        <div className="flex justify-center space-x-3">
                                            <button onClick={(e) => { e.stopPropagation(); handleEditClick(project); }} className="text-gray-400 hover:text-cyan-400"><PencilIcon className="h-5 w-5"/></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }} className="text-gray-400 hover:text-red-500"><TrashIcon className="h-5 w-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Column: Project Details */}
            <div className="hidden md:block md:w-1/2 lg:w-3/5 h-full overflow-y-auto custom-scrollbar pr-2 rounded-lg bg-black/10 p-6">
                {selectedProjectId ? (
                    <ProjectDetailsWidget projectId={selectedProjectId} isReadOnly={!canEditSelectedProjectDetails} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ChevronDoubleRightIcon className="w-16 h-16 mb-4 text-gray-500"/>
                        <h2 className="text-2xl font-bold mb-2 text-white">Select a Project</h2>
                        <p>Click on a project from the list to view and edit its details.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </>
  );
};

export default ProjectManagementView; 