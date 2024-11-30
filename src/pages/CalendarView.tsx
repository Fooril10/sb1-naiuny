import React, { useState, useCallback } from 'react';
import { View } from 'react-big-calendar';
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useProjectStore } from '../store/projectStore';
import { CalendarToolbar } from '../components/calendar/CalendarToolbar';
import { AddTaskModal } from '../components/calendar/AddTaskModal';
import { ProjectSidebar } from '../components/calendar/ProjectSidebar';
import { DraggableCalendar } from '../components/calendar/DraggableCalendar';
import { CalendarEvent } from '../types/calendar';
import { TaskVisibilityToggle } from '../components/shared/TaskVisibilityToggle';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

export function CalendarView() {
  const [view, setView] = useState<View>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const projects = useProjectStore((state) => state.projects);
  const showCompleted = useProjectStore((state) => state.showCompleted);
  const toggleCompletedVisibility = useProjectStore((state) => state.toggleCompletedVisibility);

  const events: CalendarEvent[] = projects
    .filter((project) => project.isVisible)
    .flatMap((project) =>
      project.tasks
        .filter(task => showCompleted || !task.completed)
        .map((task) => ({
          id: task.id,
          title: `${task.title} • ${project.name}`,
          start: task.dateRange ? task.dateRange.start : task.dueDate,
          end: task.dateRange ? task.dateRange.end : task.dueDate,
          allDay: true,
          resource: {
            projectId: project.id,
            taskId: task.id,
            color: project.color,
            isRange: !!task.dateRange,
          },
        }))
    );

  const handleAddTask = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <div className="flex items-center gap-4">
            <TaskVisibilityToggle
              showCompleted={showCompleted}
              onToggleCompleted={toggleCompletedVisibility}
            />
            <CalendarToolbar 
              view={view} 
              onViewChange={(v) => setView(v as View)}
              onToday={handleToday}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
          <DraggableCalendar
            localizer={localizer}
            events={events}
            view={view}
            onView={setView}
            hoveredDate={hoveredDate}
            onHoveredDateChange={setHoveredDate}
            onAddTask={handleAddTask}
            date={currentDate}
            onNavigate={handleNavigate}
          />
        </div>
        <div className="w-64">
          <ProjectSidebar />
        </div>
      </div>
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}