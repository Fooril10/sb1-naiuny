import React from 'react';

interface CalendarToolbarProps {
  view: 'month' | 'week';
  onViewChange: (view: 'month' | 'week') => void;
  onToday: () => void;
}

export function CalendarToolbar({ view, onViewChange, onToday }: CalendarToolbarProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onToday}
        className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
      >
        Today
      </button>
      {['month', 'week'].map((v) => (
        <button
          key={v}
          onClick={() => onViewChange(v as 'month' | 'week')}
          className={`px-3 py-1 rounded ${
            view === v
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  );
}