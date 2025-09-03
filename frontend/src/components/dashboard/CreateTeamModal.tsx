import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import { createTeam } from '@/services/team.service';
import { Team } from '@/types/team.type';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (newTeam: Team) => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onTeamCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Team name is required.');
      return;
    }
    setIsLoading(true);
    try {
      const newTeam = await createTeam({ name, description });
      toast.success(`Team "${newTeam.name}" created successfully!`);
      onTeamCreated(newTeam);
      onClose();
      setName('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-dark-blue p-6 text-left align-middle shadow-xl transition-all border border-white/20">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white mb-4">
                  Create a New Team
                </Dialog.Title>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="team-name" className="block text-sm font-medium text-gray-400">
                        Team Name
                      </label>
                      <input
                        id="team-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full bg-white/5 border border-white/20 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-neon-pink focus:border-neon-pink"
                        placeholder="e.g., Frontend Avengers"
                      />
                    </div>
                    <div>
                      <label htmlFor="team-description" className="block text-sm font-medium text-gray-400">
                        Description (Optional)
                      </label>
                      <textarea
                        id="team-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full bg-white/5 border border-white/20 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-neon-pink focus:border-neon-pink"
                        placeholder="What is this team about?"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-transparent bg-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/20 focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex justify-center rounded-md border border-transparent bg-neon-pink px-4 py-2 text-sm font-medium text-dark-blue hover:bg-pink-500 focus:outline-none disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Create Team'}
                    </button>
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