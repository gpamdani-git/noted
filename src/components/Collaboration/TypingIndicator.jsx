import React from 'react';

/**
 * Real-time Typing Indicator (PRD-03 T-SYNC-006)
 * Notion-style typing status banner with animated dots
 */
export const TypingIndicator = ({ typingUsers = [] }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers
    .map(t => t.user?.name)
    .filter(Boolean);

  if (names.length === 0) return null;

  let text = '';
  if (names.length === 1) {
    text = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing...`;
  }

  return (
    <div
      className="typing-indicator-bar"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 12,
        background: 'var(--bg-hover, rgba(55,53,47,0.06))',
        border: '1px solid var(--border-color, rgba(55,53,47,0.08))',
        fontSize: 11.5,
        color: 'var(--text-secondary, #787774)',
        animation: 'dbFadeIn 0.15s ease-out'
      }}
    >
      <div
        className="typing-indicator-dots"
        style={{ display: 'inline-flex', gap: 3 }}
      >
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'var(--accent, #2383e2)',
            display: 'inline-block'
          }}
        />
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'var(--accent, #2383e2)',
            display: 'inline-block'
          }}
        />
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'var(--accent, #2383e2)',
            display: 'inline-block'
          }}
        />
      </div>
      <span>{text}</span>
    </div>
  );
};

export default TypingIndicator;

