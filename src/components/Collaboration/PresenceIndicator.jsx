import React from 'react';

const PresenceIndicator = ({ users = [] }) => {
  if (users.length === 0) return null;
  
  return (
    <div className="flex items-center -space-x-2">
      {users.slice(0, 5).map((user, idx) => (
        <div
          key={user.id || idx}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name?.[0]?.toUpperCase() || '?'}
        </div>
      ))}
      {users.length > 5 && (
        <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs border-2 border-white dark:border-gray-800">
          +{users.length - 5}
        </div>
      )}
    </div>
  );
};

export default PresenceIndicator;
