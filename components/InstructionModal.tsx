
import React from 'react';
import Modal from './Modal';
import { CheckCircleIcon } from './icons';

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  instructions: string[];
}

const InstructionModal: React.FC<InstructionModalProps> = ({ isOpen, onClose, onConfirm, title, instructions }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-400">Please review the following instructions before you begin:</p>
        <ul className="space-y-3">
          {instructions.map((instruction, index) => (
            <li key={index} className="flex items-start">
              <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700 dark:text-slate-300">{instruction}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
          >
            Start Interview
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InstructionModal;