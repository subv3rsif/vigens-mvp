'use client';

import { create } from 'zustand';

type ViewType = 'dashboard' | 'kanban' | 'list';

interface UIState {
  sidebarOpen: boolean;
  taskDialogOpen: boolean;
  projectDialogOpen: boolean;
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
  sidebarOpen: true,
  taskDialogOpen: false,
  projectDialogOpen: false,
  activeView: 'dashboard',
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openTaskDialog: () => set({ taskDialogOpen: true }),
  closeTaskDialog: () => set({ taskDialogOpen: false }),
  setTaskDialogOpen: (open) => set({ taskDialogOpen: open }),
  openProjectDialog: () => set({ projectDialogOpen: true }),
  closeProjectDialog: () => set({ projectDialogOpen: false }),
  setProjectDialogOpen: (open) => set({ projectDialogOpen: open }),
  setActiveView: (view) => set({ activeView: view }),
}));
