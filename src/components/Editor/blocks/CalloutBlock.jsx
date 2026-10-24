import React from 'react';
import { Lightbulb } from 'lucide-react';

const CalloutBlock = ({ content, onChange, icon = '💡' }) => {
  return (
    <div className="flex gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg my-2">
      <div className="flex-shrink-0 text-xl">
        {icon}
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange && onChange(e.currentTarget.textContent)}
        className="flex-1 outline-none text-sm"
      >
        {content}
      </div>
    </div>
  );
};

export default CalloutBlock;
