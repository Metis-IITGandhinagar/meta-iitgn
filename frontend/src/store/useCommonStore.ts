import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getPageStats } from "../api/page";

interface PageStats {
  totalPages: number;
}

interface CommonState {
  stats: PageStats | null;
  loadingStats: boolean;
  loadStats: (forceRefresh?: boolean) => Promise<void>;

  // Settings State
  theme: string;
  interfaceFontStyle: string;
  zoomLevel: string;
  compactLayout: boolean;
  readingProgress: boolean;
  autoFold: boolean;
  editorAutosave: boolean;
  editorSpellCheck: boolean;
  editorWordCount: boolean;
  editorFontStyle: string;
  editorFontSize: string;
  autoFocusSearch: boolean;
  historyLimit: number;
  openNewTab: boolean;
  animations: boolean;

  // Home Page Cards Order State
  homeCardOrder: string[];

  // Settings Actions
  setTheme: (theme: string) => void;
  setInterfaceFontStyle: (style: string) => void;
  setZoomLevel: (zoom: string) => void;
  setCompactLayout: (compact: boolean) => void;
  setReadingProgress: (progress: boolean) => void;
  setAutoFold: (autoFold: boolean) => void;
  setEditorAutosave: (autosave: boolean) => void;
  setEditorSpellCheck: (spellCheck: boolean) => void;
  setEditorWordCount: (wordCount: boolean) => void;
  setEditorFontStyle: (style: string) => void;
  setEditorFontSize: (size: string) => void;
  setAutoFocusSearch: (autoFocus: boolean) => void;
  setHistoryLimit: (limit: number) => void;
  setOpenNewTab: (openNewTab: boolean) => void;
  setAnimations: (animations: boolean) => void;
  setHomeCardOrder: (order: string[]) => void;
}

export const useCommonStore = create<CommonState>()(
  persist(
    (set, get) => ({
      // Dynamic non-persisted state
      stats: null,
      loadingStats: false,

      // Settings default state values
      theme: "light",
      interfaceFontStyle: "sans",
      zoomLevel: "100%",
      compactLayout: false,
      readingProgress: true,
      autoFold: false,
      editorAutosave: true,
      editorSpellCheck: true,
      editorWordCount: true,
      editorFontStyle: "serif",
      editorFontSize: "normal",
      autoFocusSearch: false,
      historyLimit: 10,
      openNewTab: false,
      animations: true,
      homeCardOrder: [
        "popular-pages",
        "new-pages",
        "in-the-news",
        "events",
        "updated-pages",
        "random-page",
      ],

      loadStats: async (forceRefresh = false) => {
        if (get().stats && !forceRefresh) return;
        if (get().loadingStats) return;

        set({ loadingStats: true });
        try {
          const stats = await getPageStats();
          if (stats && typeof stats.totalPages === "number") {
            set({ stats });
            localStorage.setItem("wiki-total-pages-count", JSON.stringify(stats.totalPages));
          }
        } catch (err) {
          console.error("Failed to load page stats in commonStore:", err);
        } finally {
          set({ loadingStats: false });
        }
      },

      // Setters
      setTheme: (theme) => set({ theme }),
      setInterfaceFontStyle: (interfaceFontStyle) => set({ interfaceFontStyle }),
      setZoomLevel: (zoomLevel) => set({ zoomLevel }),
      setCompactLayout: (compactLayout) => set({ compactLayout }),
      setReadingProgress: (readingProgress) => set({ readingProgress }),
      setAutoFold: (autoFold) => set({ autoFold }),
      setEditorAutosave: (editorAutosave) => set({ editorAutosave }),
      setEditorSpellCheck: (editorSpellCheck) => set({ editorSpellCheck }),
      setEditorWordCount: (editorWordCount) => set({ editorWordCount }),
      setEditorFontStyle: (editorFontStyle) => set({ editorFontStyle }),
      setEditorFontSize: (editorFontSize) => set({ editorFontSize }),
      setAutoFocusSearch: (autoFocusSearch) => set({ autoFocusSearch }),
      setHistoryLimit: (historyLimit) => set({ historyLimit }),
      setOpenNewTab: (openNewTab) => set({ openNewTab }),
      setAnimations: (animations) => set({ animations }),
      setHomeCardOrder: (homeCardOrder) => set({ homeCardOrder }),
    }),
    {
      name: "wiki-settings-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (rehydratedState, error) => {
        if (error || !rehydratedState) return;

        // One-time migration: If there are settings in older keys, import them
        const isDefault =
          rehydratedState.theme === "light" &&
          rehydratedState.compactLayout === false &&
          rehydratedState.zoomLevel === "100%" &&
          localStorage.getItem("wiki-settings-storage") === null;

        if (isDefault) {
          const oldTheme = localStorage.getItem("wiki_theme") || localStorage.getItem("wiki_daisyui_theme");
          const oldFont = localStorage.getItem("wiki_interface_font_style");
          const oldZoom = localStorage.getItem("wiki_zoom_level");
          const oldCompact = localStorage.getItem("wiki_compact_layout");
          const oldProgress = localStorage.getItem("wiki_reading_progress");
          const oldAutoFold = localStorage.getItem("wiki_auto_fold");
          const oldAutosave = localStorage.getItem("wiki_editor_autosave");
          const oldSpellcheck = localStorage.getItem("wiki_editor_spellcheck");
          const oldWordcount = localStorage.getItem("wiki_editor_word_count");
          const oldEditorFont = localStorage.getItem("wiki_editor_font_style");
          const oldEditorSize = localStorage.getItem("wiki_editor_font_size");
          const oldAutofocus = localStorage.getItem("wiki_autofocus_search");
          const oldHistoryLimit = localStorage.getItem("wiki_history_limit");
          const oldNewTab = localStorage.getItem("wiki_open_new_tab");
          const oldAnimations = localStorage.getItem("wiki_animations");

          if (oldTheme) rehydratedState.setTheme(oldTheme);
          if (oldFont) rehydratedState.setInterfaceFontStyle(oldFont);
          if (oldZoom) rehydratedState.setZoomLevel(oldZoom);
          if (oldCompact !== null) rehydratedState.setCompactLayout(oldCompact === "true");
          if (oldProgress !== null) rehydratedState.setReadingProgress(oldProgress !== "false");
          if (oldAutoFold !== null) rehydratedState.setAutoFold(oldAutoFold === "true");
          if (oldAutosave !== null) rehydratedState.setEditorAutosave(oldAutosave !== "false");
          if (oldSpellcheck !== null) rehydratedState.setEditorSpellCheck(oldSpellcheck !== "false");
          if (oldWordcount !== null) rehydratedState.setEditorWordCount(oldWordcount !== "false");
          if (oldEditorFont) rehydratedState.setEditorFontStyle(oldEditorFont);
          if (oldEditorSize) rehydratedState.setEditorFontSize(oldEditorSize);
          if (oldAutofocus !== null) rehydratedState.setAutoFocusSearch(oldAutofocus === "true");
          if (oldHistoryLimit !== null) rehydratedState.setHistoryLimit(Number(oldHistoryLimit));
          if (oldNewTab !== null) rehydratedState.setOpenNewTab(oldNewTab === "true");
          if (oldAnimations !== null) rehydratedState.setAnimations(oldAnimations !== "false");
        }
      },
      partialize: (state) => {
        // Exclude stats and loadingStats from persistence
        const settingsState = { ...state };
        delete (settingsState as any).stats;
        delete (settingsState as any).loadingStats;
        return settingsState;
      },
    }
  )
);
