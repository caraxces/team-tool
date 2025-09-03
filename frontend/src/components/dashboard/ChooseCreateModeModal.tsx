import React from 'react';
import { XMarkIcon, PlusIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

interface ChooseCreateModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'manual' | 'csv') => void;
  itemType: string; // e.g., "task" or "project"
}

export const ChooseCreateModeModal: React.FC<ChooseCreateModeModalProps> = ({ isOpen, onClose, onSelectMode, itemType }) => {
  if (!isOpen) return null;

  const handleSelect = (mode: 'manual' | 'csv') => {
    onSelectMode(mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-dark-blue border border-white/20 rounded-2xl shadow-lg w-full max-w-lg p-6 m-4 text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">How do you want to add new {itemType}s?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Create Button */}
            <button
                onClick={() => handleSelect('manual')}
                className="group p-8 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-neon-blue flex flex-col items-center justify-center text-center"
            >
                <PlusIcon className="h-12 w-12 mb-4 text-gray-300 group-hover:text-neon-blue transition-colors" />
                <h3 className="text-lg font-bold">Create a Single {itemType}</h3>
                <p className="text-sm text-gray-400 mt-1">Fill out a form to add one {itemType}.</p>
            </button>
            
            {/* CSV Import Button */}
            <button
                onClick={() => handleSelect('csv')}
                className="group p-8 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-neon-pink flex flex-col items-center justify-center text-center"
            >
                <DocumentArrowUpIcon className="h-12 w-12 mb-4 text-gray-300 group-hover:text-neon-pink transition-colors" />
                <h3 className="text-lg font-bold">Import from CSV</h3>
                <p className="text-sm text-gray-400 mt-1">Upload a file to add multiple {itemType}s at once.</p>
            </button>
        </div>
      </div>
    </div>
  );
}; 