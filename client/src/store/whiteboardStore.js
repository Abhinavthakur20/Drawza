import { create } from "zustand";

function pushHistory(state) {
  return {
    history: [...state.history, state.elements],
    future: [],
  };
}

const useWhiteboardStore = create((set, get) => ({
  elements: [],
  selectedIds: [],
  tool: "select",
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  strokeColor: "#111111",
  fillColor: "transparent",
  strokeWidth: 2,
  opacity: 100,
  history: [],
  future: [],
  cursors: {},

  setElements: (elements) => set({ elements }),

  createElement: (element) =>
    set((state) => ({
      ...pushHistory(state),
      elements: [...state.elements, element],
    })),

  addRemoteElement: (element) =>
    set((state) => ({
      elements: [...state.elements, element],
    })),

  updateElement: (updatedElement) =>
    set((state) => ({
      ...pushHistory(state),
      elements: state.elements.map((el) => (el.id === updatedElement.id ? updatedElement : el)),
    })),

  patchElement: (updatedElement) =>
    set((state) => ({
      elements: state.elements.map((el) => (el.id === updatedElement.id ? updatedElement : el)),
    })),

  deleteElement: (elementId) =>
    set((state) => ({
      ...pushHistory(state),
      elements: state.elements.filter((el) => el.id !== elementId),
      selectedIds: state.selectedIds.filter((id) => id !== elementId),
    })),

  removeRemoteElement: (elementId) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== elementId),
      selectedIds: state.selectedIds.filter((id) => id !== elementId),
    })),

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setTool: (tool) => set({ tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(4, zoom)) }),
  setPanOffset: (panOffset) => set({ panOffset }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setOpacity: (opacity) => set({ opacity }),

  setCursor: (userId, cursor) =>
    set((state) => ({
      cursors: {
        ...state.cursors,
        [userId]: cursor,
      },
    })),

  undo: () => {
    const { history, elements, future } = get();
    if (!history.length) {
      return;
    }
    const previous = history[history.length - 1];
    set({
      elements: previous,
      history: history.slice(0, -1),
      future: [elements, ...future],
    });
  },

  redo: () => {
    const { history, elements, future } = get();
    if (!future.length) {
      return;
    }
    const next = future[0];
    set({
      elements: next,
      history: [...history, elements],
      future: future.slice(1),
    });
  },
}));

export default useWhiteboardStore;
