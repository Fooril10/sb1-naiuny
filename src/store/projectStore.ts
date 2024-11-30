import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Task, ColumnConfig } from '../types/project';
import { addDays, isValid, parseISO } from 'date-fns';

interface ProjectStore {
  projects: Project[];
  showCompleted: boolean;
  addProject: (project: Omit<Project, 'id' | 'tasks' | 'columns' | 'statusLabels'>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  addTask: (projectId: string, task: Omit<Task, 'id' | 'projectId' | 'completed'>) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  toggleProjectVisibility: (projectId: string) => void;
  toggleTaskCompletion: (projectId: string, taskId: string) => void;
  toggleCompletedVisibility: () => void;
}

const defaultColumns: ColumnConfig[] = [
  { id: 'title', type: 'text', label: 'Title' },
  { id: 'status', type: 'dropdown', label: 'Status' },
  { id: 'dueDate', type: 'date', label: 'Due Date' },
  { id: 'tags', type: 'tags', label: 'Tags' }
];

const defaultStatusLabels = ['todo', 'in-progress', 'completed'];

const serializeDate = (value: unknown): string | undefined => {
  if (value instanceof Date && isValid(value)) {
    return value.toISOString();
  }
  return undefined;
};

const deserializeDate = (value: unknown): Date | undefined => {
  if (value instanceof Date && isValid(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const date = parseISO(value);
    return isValid(date) ? date : undefined;
  }
  return undefined;
};

const ensureValidDate = (value: unknown): Date => {
  const date = deserializeDate(value);
  return date || new Date();
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      showCompleted: true,
      addProject: (project) => 
        set((state) => ({
          projects: [...state.projects, {
            ...project,
            id: crypto.randomUUID(),
            tasks: [],
            columns: defaultColumns,
            statusLabels: defaultStatusLabels
          }]
        })),
      updateProject: (projectId, updates) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, ...updates }
              : project
          )
        })),
      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId)
        })),
      addTask: (projectId, task) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  tasks: [...project.tasks, { 
                    ...task, 
                    id: crypto.randomUUID(), 
                    projectId,
                    completed: false,
                    dueDate: ensureValidDate(task.dueDate)
                  }]
                }
              : project
          )
        })),
      deleteTask: (projectId, taskId) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  tasks: project.tasks.filter((task) => task.id !== taskId)
                }
              : project
          )
        })),
      updateTask: (projectId, taskId, updates) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  tasks: project.tasks.map((task) =>
                    task.id === taskId
                      ? {
                          ...task,
                          ...updates,
                          dueDate: updates.dueDate ? ensureValidDate(updates.dueDate) : task.dueDate
                        }
                      : task
                  )
                }
              : project
          )
        })),
      toggleProjectVisibility: (projectId) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, isVisible: !project.isVisible }
              : project
          )
        })),
      toggleTaskCompletion: (projectId, taskId) =>
        set((state) => {
          const projects = state.projects.map((project) => {
            if (project.id !== projectId) return project;

            const tasks = project.tasks.map((task) => {
              if (task.id !== taskId) return task;

              const completed = !task.completed;

              if (completed && task.recurring) {
                const nextDueDate = addDays(task.dueDate, task.recurring.frequency);
                
                if (!task.recurring.endDate || nextDueDate <= task.recurring.endDate) {
                  const newTask: Task = {
                    ...task,
                    id: crypto.randomUUID(),
                    dueDate: nextDueDate,
                    completed: false
                  };
                  return [{ ...task, completed }, newTask];
                }
              }

              return { ...task, completed };
            });

            return {
              ...project,
              tasks: tasks.flat()
            };
          });

          return { projects };
        }),
      toggleCompletedVisibility: () =>
        set((state) => ({ showCompleted: !state.showCompleted }))
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        projects: state.projects.map(project => ({
          ...project,
          tasks: project.tasks.map(task => ({
            ...task,
            dueDate: serializeDate(task.dueDate),
            dateRange: task.dateRange ? {
              start: serializeDate(task.dateRange.start),
              end: serializeDate(task.dateRange.end)
            } : undefined,
            recurring: task.recurring ? {
              ...task.recurring,
              endDate: serializeDate(task.recurring.endDate)
            } : undefined
          }))
        })),
        showCompleted: state.showCompleted
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.projects = state.projects.map(project => ({
            ...project,
            tasks: project.tasks.map(task => ({
              ...task,
              dueDate: ensureValidDate(task.dueDate),
              dateRange: task.dateRange ? {
                start: ensureValidDate(task.dateRange.start),
                end: ensureValidDate(task.dateRange.end)
              } : undefined,
              recurring: task.recurring ? {
                ...task.recurring,
                endDate: deserializeDate(task.recurring.endDate)
              } : undefined
            }))
          }));
        }
      }
    }
  )
);