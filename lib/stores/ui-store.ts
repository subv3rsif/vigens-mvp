'use client';

import { create } from 'zustand';

type ViewType = 'dashboard' | 'kanban' | 'list';

export interface UIState {
  isSidebarOpen: boolean;
  isTaskDialogOpen: boolean;
  isProjectDialogOpen: boolean;
  activeView: ViewType;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openTaskDialog: () => void;
  closeTaskDialog: () => void;
  setTaskDialogOpen: (open: boolean) => void;
  openProjectDialog: () => void;
  closeProjectDialog: () => void;
  setProjectDialogOpen: (open: boolean) => void;
  setActiveView: (view: ViewType) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isTaskDialogOpen: false,
  isProjectDialogOpen: false,
  activeView: 'dashboard',
  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openTaskDialog: () => set({ isTaskDialogOpen: true }),
  closeTaskDialog: () => set({ isTaskDialogOpen: false }),
  setTaskDialogOpen: (open) => set({ isTaskDialogOpen: open }),
  openProjectDialog: () => set({ isProjectDialogOpen: true }),
  closeProjectDialog: () => set({ isProjectDialogOpen: false }),
  setProjectDialogOpen: (open) => set({ isProjectDialogOpen: open }),
  setActiveView: (view) => set({ activeView: view }),
}));
