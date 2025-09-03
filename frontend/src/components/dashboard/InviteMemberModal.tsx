import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useDropzone } from 'react-dropzone';
import { DocumentArrowDownIcon, DocumentArrowUpIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { getUsers } from '@/services/user.service';
import { User } from '@/types/user.type';
import { Team } from '@/types/team.type';
import { inviteMember, downloadMemberCsvTemplate, importMembersFromCsv } from '@/services/team.service';

// --- Manual Invite Component ---
const ManualInviteForm = ({ team, onMemberInvited, onClose, isOpen }: any) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<{ value: number; label: string; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUsersLoading, setIsUsersLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsUsersLoading(true);
            getUsers()
                .then(fetchedUsers => {
                    setUsers(fetchedUsers);
                })
                .catch(() => {
                    toast.error("Failed to fetch users.");
                })
                .finally(() => {
                    setIsUsersLoading(false);
                });
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!team || !selectedUser) {
            toast.error('Please select a team and a user.');
            return;
        }
        setIsLoading(true);
        try {
            await inviteMember(team.id, selectedUser.value);
            toast.success(`${selectedUser.label} has been invited to ${team.name}.`);
            onMemberInvited();
            onClose();
        } catch (error) {
            toast.error('Failed to invite member.');
        } finally {
            setIsLoading(false);
        }
    };

    const userOptions = users.map(u => ({ value: u.id, label: `${u.fullName} (${u.email})` }));
    
    // Custom styles for React-Select to match the app's theme
    const customStyles = {
        control: (provided: any) => ({
            ...provided,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '0.375rem',
            color: 'white',
            minHeight: '42px',
        }),
        singleValue: (provided: any) => ({ ...provided, color: 'white' }),
        input: (provided: any) => ({ ...provided, color: 'white' }),
        menu: (provided: any) => ({
            ...provided,
            backgroundColor: '#1a202c', // A dark color
            border: '1px solid rgba(255, 255, 255, 0.2)',
        }),
        option: (provided: any, state: { isFocused: any; }) => ({
            ...provided,
            backgroundColor: state.isFocused ? '#E11D48' : 'transparent', // Neon pink on hover
            color: state.isFocused ? '#0D1117' : 'white',
        }),
        placeholder: (provided: any) => ({ ...provided, color: 'rgba(255, 255, 255, 0.5)' }),
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <Select
                    options={userOptions}
                    value={selectedUser}
                    onChange={setSelectedUser}
                    isLoading={isUsersLoading}
                    placeholder="Search by name or email..."
                    styles={customStyles}
                />
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="bg-white/10 px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-white/20">
                    Cancel
                </button>
                <button type="submit" disabled={isLoading || !selectedUser} className="bg-neon-pink px-4 py-2 text-sm font-medium text-dark-blue rounded-md hover:bg-pink-500 disabled:opacity-50">
                    {isLoading ? 'Inviting...' : 'Send Invite'}
                </button>
            </div>
        </form>
    );
};

// --- CSV Import Component ---
const CsvImportView = ({ team, onImportFinished, onClose, file, setFile }: any) => {
    const [isImporting, setIsImporting] = useState(false);
    
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            toast.success(`File "${acceptedFiles[0].name}" selected.`);
        }
    }, [setFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        multiple: false
    });
    
    const handleDownloadTemplate = async () => {
        if (!team) return;
        try {
            const blob = await downloadMemberCsvTemplate(team.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'members-template.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) { toast.error("Failed to download template."); }
    };

    const handleImport = async () => {
        if (!file || !team) return;
        setIsImporting(true);
        try {
            const result = await importMembersFromCsv(team.id, file);
            toast.success(result.message);
            if (result.data.errors && result.data.errors.length > 0) {
                 const errorList = result.data.errors.map((e: any) => `Row ${e.row}: ${e.reason}`).join('\n');
                 toast.custom(
                    (t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-dark-blue shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-white/20`}>
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <ExclamationCircleIcon className="h-10 w-10 text-yellow-400"/>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-medium text-white">Import Issues</p>
                                        <pre className="mt-1 text-sm text-gray-400 whitespace-pre-wrap">{errorList}</pre>
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-l border-white/20">
                                <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-neon-pink hover:text-pink-500 focus:outline-none focus:ring-2 focus:ring-neon-pink">
                                    Close
                                </button>
                            </div>
                        </div>
                    ), { duration: 10000 }
                 );
            }
            onImportFinished();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Import failed.');
        } finally {
            setIsImporting(false);
        }
    };
    
     return (
        <div className="pt-4 text-white">
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-white/10 px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-white/20">
                <DocumentArrowDownIcon className="h-5 w-5" /> Download CSV Template
            </button>
            <div {...getRootProps()} className={`border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer ${isDragActive ? 'border-neon-pink bg-white/5' : ''}`}>
                <input {...getInputProps()} />
                <DocumentArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-2"/>
                <p className="text-gray-400">Drag & drop a CSV file here, or click to select a file</p>
            </div>
             {file && (
                 <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm flex items-center justify-between">
                    <p className="truncate">Selected: <span className="font-semibold">{file.name}</span></p>
                    <button onClick={() => setFile(null)} className="text-gray-400 hover:text-white"><XMarkIcon className="h-5 w-5"/></button>
                </div>
            )}
            <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={onClose} className="py-2 px-4 bg-white/10 rounded-lg">Cancel</button>
                <button onClick={handleImport} disabled={!file || isImporting} className="bg-neon-pink px-4 py-2 text-sm font-medium text-dark-blue rounded-md hover:bg-pink-500 disabled:opacity-50">
                    {isImporting ? 'Importing...' : 'Start Import'}
                </button>
            </div>
        </div>
    );
}

// --- Main Modal Component ---
interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onMemberInvited: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, team, onMemberInvited }) => {
    const [activeTab, setActiveTab] = useState('manual');
    
    const handleClose = () => {
        setActiveTab('manual');
        setFile(null); // Reset file on close
        onClose();
    };

    const handleSuccess = () => {
        onMemberInvited();
        handleClose();
    };

    // States for CsvImportView now moved to the parent so they can be reset
    const [file, setFile] = useState<File | null>(null);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-dark-blue p-6 shadow-xl border border-white/20">
                            <Dialog.Title className="text-lg font-medium text-white mb-4">
                                Invite Members to {team?.name}
                            </Dialog.Title>
                            
                            {/* Tabs */}
                             <div className="border-b border-white/20 mb-4">
                                <nav className="flex space-x-4" aria-label="Tabs">
                                     <button onClick={() => setActiveTab('manual')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'manual' ? 'border-b-2 border-neon-pink text-neon-pink' : 'text-gray-400'}`}>
                                        Invite Manually
                                    </button>
                                    <button onClick={() => setActiveTab('csv')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'csv' ? 'border-b-2 border-neon-pink text-neon-pink' : 'text-gray-400'}`}>
                                        Import from CSV
                                    </button>
                                </nav>
                            </div>

                            {/* Content */}
                            {activeTab === 'manual' && <ManualInviteForm team={team} onMemberInvited={handleSuccess} onClose={handleClose} isOpen={isOpen} />}
                            {activeTab === 'csv' && <CsvImportView team={team} onImportFinished={handleSuccess} onClose={handleClose} file={file} setFile={setFile} />}
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}; 