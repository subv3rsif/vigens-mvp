'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '../../types/database.types';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: string, newPosition: number) => void;
  reorderTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      selectedTask: null,
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, task],
        })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          selectedTask:
            state.selectedTask?.id === id
              ? { ...state.selectedTask, ...updates }
              : state.selectedTask,
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          selectedTask:
            state.selectedTask?.id === id ? null : state.selectedTask,
        })),
      moveTask: (taskId, newStatus, newPosition) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: newStatus, position: newPosition }
              : t
          ),
        })),
      reorderTasks: (tasks) => set({ tasks }),
      setSelectedTask: (task) => set({ selectedTask: task }),
    }),
    {
      name: 'vigens-tasks',
    }
  )
);
