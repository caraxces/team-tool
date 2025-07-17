import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import toast from 'react-hot-toast';
import { User } from '@/types/user.type';
import { getAllUsers, updateUserRole } from '@/services/user.service';
import { Button } from '../ui/Button';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES = [
  { id: 2, name: 'Manager' },
  { id: 4, name: 'HRM (Human Resource Manager)' },
  { id: 5, name: 'HR (Human Resources)' },
];

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const fetchedUsers = await getAllUsers();
          setUsers(fetchedUsers);
        } catch (error) {
          toast.error('Failed to fetch users.');
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedRole) {
      toast.error('Please select a user and a role.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserRole(parseInt(selectedUser), parseInt(selectedRole));
      toast.success('User role updated successfully!');
      onClose(); // Close modal on success
    } catch (error) {
      toast.error('Failed to update user role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-dark-blue border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white"
                >
                  Assign User Role
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      User
                    </label>
                    <Menu as="div" className="relative w-full">
                      <Menu.Button className="w-full flex justify-between items-center bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue">
                        <span className="truncate">
                          {selectedUser ? users.find(u => u.id === parseInt(selectedUser))?.fullName : 'Select a user'}
                        </span>
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      </Menu.Button>
                      <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute z-20 mt-2 w-full origin-top-right rounded-md bg-dark-blue/80 backdrop-blur-md shadow-lg ring-1 ring-white/20 focus:outline-none max-h-60 overflow-y-auto custom-scrollbar">
                            <div className="p-1">
                                {users.map((user) => (
                                    <Menu.Item key={user.id}>
                                        {({ active }) => (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedUser(user.id.toString())}
                                                className={`${
                                                    active ? 'bg-neon-blue text-dark-blue' : 'text-white'
                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm text-left`}
                                            >
                                                <div className="flex flex-col">
                                                    <span>{user.fullName} ({user.email})</span>
                                                    <span className="text-xs opacity-70">Current Role ID: {user.role_id}</span>
                                                </div>
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      New Role
                    </label>
                    <Menu as="div" className="relative w-full">
                      <Menu.Button className="w-full flex justify-between items-center bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue">
                        <span className="truncate">
                          {selectedRole ? ROLES.find(r => r.id === parseInt(selectedRole))?.name : 'Select a role'}
                        </span>
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      </Menu.Button>
                      <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute z-20 mt-2 w-full origin-top-right rounded-md bg-dark-blue/80 backdrop-blur-md shadow-lg ring-1 ring-white/20 focus:outline-none">
                            <div className="p-1">
                                {ROLES.map((role) => (
                                    <Menu.Item key={role.id}>
                                        {({ active }) => (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRole(role.id.toString())}
                                                className={`${
                                                    active ? 'bg-neon-blue text-dark-blue' : 'text-white'
                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm text-left`}
                                            >
                                                {role.name}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Assigning...' : 'Assign Role'}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 