import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const ToggleBlock = ({ title, children, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-2">
      <div className="flex items-start gap-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded mt-0.5"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        <div
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange && onChange(e.currentTarget.textContent)}
          className="flex-1 outline-none font-medium"
        >
          {title || 'Toggle'}
        </div>
      </div>
      {isOpen && (
        <div className="ml-6 mt-1 pl-2 border-l border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};

export default ToggleBlock;
