import React from 'react';

const QuoteBlock = ({ content, onChange }) => {
  return (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-2 text-gray-700 dark:text-gray-300">
      <div
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange && onChange(e.currentTarget.textContent)}
        className="outline-none"
      >
        {content || 'Quote'}
      </div>
    </blockquote>
  );
};

export default QuoteBlock;
