"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  sidebarCollapsed: boolean;
  search: string;
  readActivityIds: string[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearch: (search: string) => void;
  markActivityRead: (id: string) => void;
  clearActivityReads: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: true,
      search: "",
      readActivityIds: [],
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSearch: (search) => set({ search }),
      markActivityRead: (id) =>
        set((state) => ({
          readActivityIds: state.readActivityIds.includes(id)
            ? state.readActivityIds
            : [...state.readActivityIds, id],
        })),
      clearActivityReads: () => set({ readActivityIds: [] }),
    }),
    {
      name: "salespro-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        readActivityIds: state.readActivityIds,
      }),
    },
  ),
);
