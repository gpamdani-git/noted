import React from 'react';

/**
 * Notion-grade Remote Cursor Overlay (PRD-03 T-SYNC-003)
 * Renders smooth real-time collaborator cursors with colored badges
 */
export const RemoteCursor = ({ cursors = [] }) => {
  if (!cursors || cursors.length === 0) return null;

  return (
    <div
      className="remote-cursors-layer"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {cursors.map((cursor, idx) => {
        if (!cursor || typeof cursor.x !== 'number' || typeof cursor.y !== 'number') {
          return null;
        }

        const color = cursor.user?.color || '#2383e2';
        const name = cursor.user?.name || 'Collaborator';

        return (
          <div
            key={idx}
            className="remote-cursor-item"
            style={{
              position: 'absolute',
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-2px, -2px)',
              transition: 'all 0.08s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2
            }}
          >
            {/* SVG Cursor Pointer */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            >
              <path
                d="M1 1L6 14.5L8.5 9L14 6.5L1 1Z"
                fill={color}
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>

            {/* Collaborator Name Pill */}
            <div
              className="remote-cursor-badge"
              style={{
                background: color,
                color: '#ffffff',
                fontSize: 10.5,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                marginLeft: 10,
                marginTop: -4
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RemoteCursor;

