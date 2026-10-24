import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './DatabaseViews.css';

const CalendarView = ({ rows = [], headers = [], onRowClick, dateColumnIndex }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getRowsForDate = (day) => {
    if (dateColumnIndex === undefined || !rows.length) return [];
    const targetDate = new Date(year, month, day);
    return rows.map((r, originalIdx) => ({ row: r, originalIdx })).filter(({ row }) => {
      const dateVal = row[dateColumnIndex];
      if (!dateVal) return false;
      const rowDate = new Date(dateVal);
      return !isNaN(rowDate.getTime()) &&
             rowDate.getDate() === day &&
             rowDate.getMonth() === month &&
             rowDate.getFullYear() === year;
    });
  };

  const today = new Date();

  return (
    <div className="db-calendar-view">
      {/* Header */}
      <div className="db-calendar-header">
        <div className="db-calendar-month-title">
          {monthNames[month]} {year}
        </div>
        <div className="db-timeline-nav-group">
          <button
            type="button"
            className="db-timeline-btn"
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            title="Previous month"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="db-timeline-btn"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
          <button
            type="button"
            className="db-timeline-btn"
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            title="Next month"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="db-calendar-weekdays-row">
        {weekdayNames.map((w, i) => (
          <div key={i} className="db-calendar-weekday-cell">
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="db-calendar-grid">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="db-calendar-day-cell other-month" />;
          }

          const isToday =
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year;

          const dayItems = getRowsForDate(day);

          return (
            <div
              key={`day-${day}`}
              className={`db-calendar-day-cell ${isToday ? 'is-today' : ''}`}
            >
              <div className="db-calendar-day-num">{day}</div>
              {dayItems.map(({ row, originalIdx }) => {
                const title = row[0] || 'Untitled';
                return (
                  <div
                    key={originalIdx}
                    className="db-calendar-card-pill"
                    onClick={() => onRowClick && onRowClick(originalIdx)}
                    title={title}
                  >
                    {title}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
