import React, { useCallback, useState } from 'react';
import { Calendar, View, Localizer } from 'react-big-calendar';
import { format } from 'date-fns';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { CalendarEvent } from '../../types/calendar';
import { useProjectStore } from '../../store/projectStore';
import { QuickTaskModal } from './QuickTaskModal';

const DnDCalendar = withDragAndDrop(Calendar);

interface DraggableCalendarProps {
  events: CalendarEvent[];
  view: View;
  onView: (view: View) => void;
  hoveredDate: Date | null;
  onHoveredDateChange: (date: Date | null) => void;
  onAddTask: (date: Date) => void;
  localizer: Localizer;
  date: Date;
  onNavigate: (date: Date) => void;
}

export function DraggableCalendar({
  events,
  view,
  onView,
  hoveredDate,
  onHoveredDateChange,
  onAddTask,
  localizer,
  date,
  onNavigate,
}: DraggableCalendarProps) {
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const updateTask = useProjectStore((state) => state.updateTask);

  const moveEvent = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      const { projectId, taskId, isRange } = event.resource;
      if (isRange) {
        const duration = event.end.getTime() - event.start.getTime();
        const newEnd = new Date(start.getTime() + duration);
        updateTask(projectId, taskId, {
          dateRange: { start, end: newEnd },
          dueDate: start,
        });
      } else {
        updateTask(projectId, taskId, { dueDate: start });
      }
    },
    [updateTask]
  );

  const resizeEvent = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      const { projectId, taskId } = event.resource;
      updateTask(projectId, taskId, {
        dateRange: { start, end },
        dueDate: start,
      });
    },
    [updateTask]
  );

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsQuickTaskModalOpen(true);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view={view}
        onView={(newView) => onView(newView as View)}
        views={['month', 'week']}
        draggableAccessor={() => true}
        resizable
        selectable
        onEventDrop={moveEvent}
        onEventResize={resizeEvent}
        date={date}
        onNavigate={onNavigate}
        eventPropGetter={(event: CalendarEvent) => ({
          style: {
            backgroundColor: event.resource.color,
            fontSize: '0.75rem',
            padding: '2px 4px',
            borderRadius: event.resource.isRange ? '4px' : '12px',
            border: 'none',
            cursor: 'move',
            opacity: event.resource.isRange ? '0.9' : '1',
          },
          className: event.resource.isRange ? 'date-range-event' : '',
        })}
        formats={{
          eventTimeRangeFormat: () => '',
          timeGutterFormat: (date: Date) => format(date, 'HH:mm'),
        }}
        dayPropGetter={(date) => ({
          style: {
            backgroundColor: 'white',
            minHeight: view === 'month' ? '120px' : '40px',
            position: 'relative',
          },
        })}
        components={{
          event: ({ event }) => {
            const [taskTitle, projectName] = event.title.split(' • ');
            return (
              <div className="overflow-hidden">
                <div className="font-medium truncate">{taskTitle}</div>
                <div className="text-xs opacity-75 truncate">{projectName}</div>
              </div>
            );
          },
          dateCellWrapper: (props) => (
            <div
              className="relative h-full"
              onMouseEnter={() => onHoveredDateChange(props.value)}
              onMouseLeave={() => onHoveredDateChange(null)}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDateClick(props.value);
                }}
                className="absolute top-2 right-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-200 cursor-pointer p-1"
              >
                {props.value.getDate()}
              </button>
              <div className="h-full pt-10">
                {props.children}
              </div>
            </div>
          ),
        }}
        popup={false}
        showAllEvents={true}
      />
      <QuickTaskModal
        isOpen={isQuickTaskModalOpen}
        onClose={() => setIsQuickTaskModalOpen(false)}
        selectedDate={selectedDate}
      />
    </DndProvider>
  );
}