import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ClipboardDocumentListIcon, PlusIcon, ChevronDownIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import react-query hooks
import { getMyProjects } from '@/services/project.service';
import { Project } from '@/types/project.type';
import { getTasksByProjectId, updateTaskStatus } from '@/services/task.service';
import { 
    DragDropContext, 
    Droppable, 
    Draggable, 
    DropResult, 
    DraggableProvided, 
    DraggableStateSnapshot,
    DroppableProvided,
} from '@hello-pangea/dnd';
import { useGesture } from '@use-gesture/react';
import { CreateTaskModal } from './CreateTaskModal';
import { EditTaskModal } from './EditTaskModal'; 
import { getUsers } from '@/services/user.service';
import { Task } from '@/types/task.type';
import { User } from '@/types/user.type';


type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

const columnTitles: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'in_progress': 'In Progress',
  'in_review': 'In Review',
  'done': 'Done',
};

const priorityColors: Record<string, string> = {
    'high': 'bg-red-500',
    'urgent': 'bg-red-700',
    'medium': 'bg-yellow-500',
    'low': 'bg-green-500',
}

const TaskCard = ({ task, index, onEdit, onStatusChange }: { task: Task, index: number, onEdit: (task: Task) => void, onStatusChange: (taskId: number, status: TaskStatus) => void }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Disable dragging on mobile for the whole card
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <Draggable draggableId={task.uuid} index={index} isDragDisabled={isMobile}>
            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onEdit(task)}
                    className={`bg-white/10 p-4 rounded-lg mb-2 shadow-lg hover:bg-white/20 cursor-pointer ${snapshot.isDragging ? 'ring-2 ring-neon-pink' : ''}`}
                >
                    <div className="flex justify-between items-start">
                        <p className="font-semibold text-gray-100 pr-2">{task.title}</p>
                         {/* Mobile Status-Change Menu */}
                        <div className="md:hidden relative flex-shrink-0" ref={menuRef}>
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!isMenuOpen); }} className="p-1 text-gray-400 hover:text-white">
                                <EllipsisHorizontalIcon className="h-6 w-6" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 z-20 mt-1 w-48 bg-slate-900/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl">
                                    {Object.keys(columnTitles).map(status => (
                                        <button
                                            key={status}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStatusChange(task.id, status as TaskStatus);
                                                setMenuOpen(false);
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-100/10"
                                        >
                                            Move to "{columnTitles[status as TaskStatus]}"
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className={`hidden md:block w-3 h-3 rounded-full flex-shrink-0 mt-1 ${priorityColors[task.priority]}`} title={`Priority: ${task.priority}`}></div>
                    </div>
                    {task.description && <p className="text-sm text-gray-400 mt-1 truncate">{task.description}</p>}
                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                        {task.assignee ? (
                            <img src={task.assignee.avatarUrl || `https://i.pravatar.cc/150?u=${task.assignee.id}`} alt={task.assignee.fullName} className="w-8 h-8 rounded-full border-2 border-neon-blue/50" title={task.assignee.fullName} />
                        ) : <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-neon-blue/50"></div>}
                    </div>
                </div>
            )}
        </Draggable>
    )
}

const TaskManagementView = () => {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [isProjectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching with React Query ---

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['myProjects'],
    queryFn: getMyProjects,
  });

  // Effect to set the initial project once projects are loaded
  useEffect(() => {
    if (!selectedProject && projects && projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);


  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<any, Error, Task[]>({
    queryKey: ['tasks', selectedProject?.id],
    queryFn: () => getTasksByProjectId(selectedProject!.id),
    enabled: !!selectedProject, // Only fetch if a project is selected
    select: (data: any) => data.tasks || [], // Adapt to the API response structure
  });

  const tasksByStatus = useMemo<Record<TaskStatus, Task[]>>(() => {
    const groupedTasks: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], in_review: [], done: [] };
    if (Array.isArray(tasks)) {
        tasks.forEach(task => {
            const status = task.status as TaskStatus;
            if (!groupedTasks[status]) {
                groupedTasks[status] = [];
            }
            groupedTasks[status].push(task);
        });
    }
    return groupedTasks;
  }, [tasks]);


  // --- Mutations with React Query ---

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number, status: TaskStatus }) => updateTaskStatus(taskId, status),
    onSuccess: () => {
      toast.success("Task status updated!");
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProject?.id] });
    },
    onError: () => {
      toast.error("Failed to update task status.");
    }
  });


  // Gesture for panning the board (only on desktop)
  useGesture({
    onDrag: ({ scrolling, movement: [mx], memo = boardRef.current?.scrollLeft || 0 }) => {
      if (boardRef.current && !scrolling && !isMobile) {
        boardRef.current.scrollLeft = memo - mx;
        return memo;
      }
    }
  }, {
    target: boardRef,
    eventOptions: { passive: false },
    drag: {
      from: () => [boardRef.current?.scrollLeft || 0, 0],
      filterTaps: true,
      axis: 'x'
    }
  });
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [projectDropdownRef]);


  const handleTaskChange = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', selectedProject?.id] });
  };

  const handleEditClick = (task: Task) => {
      setTaskToEdit(task);
      setEditModalOpen(true);
  }

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
      const taskToMove = tasks.find(t => t.id === taskId);
      if (!taskToMove || taskToMove.status === newStatus) return;

      updateTaskStatusMutation.mutate({ taskId, status: newStatus });
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    const task = tasks.find(t => t.uuid === draggableId);
    if (!task) return;

    updateTaskStatusMutation.mutate({ taskId: task.id, status: destination.droppableId as TaskStatus });
  };

  const isLoading = isLoadingProjects || isLoadingTasks;

  return (
    <>
    <div className="bg-dark-blue/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <ClipboardDocumentListIcon className="h-8 w-8 text-neon-blue" />
          <h1 className="text-2xl font-bold">Task Board</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch w-full md:w-auto gap-4">
            {/* Custom Project Dropdown */}
            <div className="relative flex-grow" ref={projectDropdownRef}>
                <button 
                    onClick={() => setProjectDropdownOpen(!isProjectDropdownOpen)}
                    className="flex items-center justify-between w-full bg-white/10 py-2 pl-4 pr-3 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-neon-pink"
                    >
                    <span className="truncate">{selectedProject ? selectedProject.name : "Select a Project"}</span>
                    <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isProjectDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-dark-blue/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                        {projects && projects.map(p => (
                            <div key={p.id} onClick={() => { setSelectedProject(p); setProjectDropdownOpen(false); }} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1">
                                <span>{p.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

          <button onClick={() => setCreateModalOpen(true)} className="flex items-center justify-center gap-2 bg-neon-pink hover:bg-pink-600 transition-colors text-white font-bold py-2 px-4 rounded-lg shadow-lg" disabled={!selectedProject}>
            <PlusIcon className="h-5 w-5" />
            New Task
          </button>
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="flex-grow overflow-y-auto custom-scrollbar -mr-2">
      <DragDropContext onDragEnd={onDragEnd}>
        <div ref={boardRef} className="flex flex-col md:flex-row md:grid md:grid-cols-4 gap-6 md:overflow-x-auto pb-4 md:cursor-grab md:active:cursor-grabbing h-full">
            {(Object.keys(columnTitles) as TaskStatus[]).map((status) => (
            <div key={status} className="flex flex-col min-w-full md:min-w-[300px]">
                <div className={`md:bg-black/20 md:rounded-xl md:p-4 flex flex-col h-full ${isMobile ? 'mb-4' : ''}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-gray-300">{columnTitles[status]}</h2>
                        <span className="bg-gray-700 text-gray-300 text-sm font-bold px-2 py-1 rounded-full">{tasksByStatus[status]?.length || 0}</span>
                    </div>
                     <Droppable key={status} droppableId={status} isDropDisabled={isMobile}>
                        {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-grow md:overflow-y-auto pr-2 ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
                        >
                            {isLoading ? <p className="text-center text-gray-400">Loading tasks...</p> : (tasksByStatus[status] || []).map((task, index) => (
                                <TaskCard key={task.uuid} task={task} index={index} onEdit={handleEditClick} onStatusChange={handleStatusChange} />
                            ))}
                            {provided.placeholder}
                        </div>
                        )}
                    </Droppable>
                </div>
            </div>
            ))}
        </div>
      </DragDropContext>
      </div>
    </div>
    <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        onTaskCreated={handleTaskChange}
        project={selectedProject}
        users={users}
    />
     <EditTaskModal 
        isOpen={isEditModalOpen} 
        onClose={() => { setEditModalOpen(false); setTaskToEdit(null); }}
        onTaskUpdated={handleTaskChange} // re-fetch tasks on update
        task={taskToEdit}
        users={users}
    />
    </>
  );
};

export default TaskManagementView; 