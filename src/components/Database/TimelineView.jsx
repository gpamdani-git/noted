import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import './DatabaseViews.css';

const TimelineView = ({ rows = [], headers = [], onRowClick, startDateIndex, endDateIndex }) => {
  const [currentOffset, setCurrentOffset] = useState(0);

  if (startDateIndex === undefined) {
    return (
      <div className="relation-empty-state" style={{ minHeight: 200 }}>
        <CalendarIcon size={32} style={{ opacity: 0.4 }} />
        <span className="relation-empty-title">Timeline view requires a Date property</span>
        <span className="relation-empty-desc">
          Add a Date column to your table to plot deadlines, schedules, and Gantt milestones.
        </span>
      </div>
    );
  }

  // Generate 14 visible day buckets around the current anchor
  const today = new Date();
  const days = [];
  for (let i = -2; i < 12; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i + currentOffset * 7);
    days.push(d);
  }

  return (
    <div className="db-timeline-view">
      {/* Toolbar */}
      <div className="db-timeline-toolbar">
        <div className="db-timeline-nav-group">
          <button
            type="button"
            className="db-timeline-btn"
            onClick={() => setCurrentOffset(prev => prev - 1)}
            title="Previous week"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="db-timeline-btn"
            onClick={() => setCurrentOffset(0)}
          >
            Today
          </button>
          <button
            type="button"
            className="db-timeline-btn"
            onClick={() => setCurrentOffset(prev => prev + 1)}
            title="Next week"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ color: 'var(--text-secondary, #787774)', fontSize: 12 }}>
          {days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {days[days.length - 1].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Timeline Body: Sidebar + Canvas */}
      <div className="db-timeline-body">
        {/* Left Column: Row Names */}
        <div className="db-timeline-sidebar-col">
          <div className="db-timeline-sidebar-header">
            {headers[0] || 'Items'}
          </div>
          {rows.map((item, idx) => {
            const row = Array.isArray(item) ? item : (item?.row || []);
            const title = row[0] || 'Untitled';
            return (
              <div
                key={idx}
                onClick={() => onRowClick && onRowClick(idx)}
                className="db-timeline-sidebar-item"
                title={title}
              >
                {title}
              </div>
            );
          })}
        </div>

        {/* Right Canvas: Day grid & Bars */}
        <div className="db-timeline-canvas">
          <div className="db-timeline-days-header">
            {days.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div
                  key={i}
                  className="db-timeline-day-header-cell"
                  style={{
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--accent, #2383e2)' : 'inherit'
                  }}
                >
                  {d.toLocaleDateString(undefined, { weekday: 'narrow' })} {d.getDate()}
                </div>
              );
            })}
          </div>

          {/* Rows Tracks */}
          {rows.map((item, idx) => {
            const row = Array.isArray(item) ? item : (item?.row || []);
            const title = row[0] || 'Untitled';
            const rawStart = row[startDateIndex];
            const startDate = rawStart ? new Date(rawStart) : null;
            
            // Calculate horizontal offset
            let leftPercent = 10;
            let widthPercent = 25;
            if (startDate && !isNaN(startDate.getTime())) {
              const firstDayTime = days[0].getTime();
              const lastDayTime = days[days.length - 1].getTime();
              const totalSpan = lastDayTime - firstDayTime;
              const itemOffset = startDate.getTime() - firstDayTime;
              if (totalSpan > 0) {
                leftPercent = Math.max(0, Math.min(85, (itemOffset / totalSpan) * 100));
              }
            }

            return (
              <div key={idx} className="db-timeline-row-track">
                <div
                  className="db-timeline-bar-pill"
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  onClick={() => onRowClick && onRowClick(idx)}
                  title={`${title} (${startDate ? startDate.toLocaleDateString() : 'No date'})`}
                >
                  {title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
