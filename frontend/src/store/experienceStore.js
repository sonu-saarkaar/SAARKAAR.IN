import { create } from 'zustand'

export const useExperienceStore = create((set) => ({
  // Current scene state
  currentScene: 'lobby', // 'lobby', 'office'
  
  // User position and rotation
  userPosition: [0, 0, 0],
  userRotation: [0, 0, 0],
  cameraRotation: [0, 0, 0],
  
  // Interaction states
  isWalking: false,
  walkTarget: null,
  isNearReception: false,
  isNearOffice: false,
  isInOffice: false,
  isNearSeating: false,
  isSitting: false,
  isMeetingActive: false,
  
  // Conversation state
  conversationHistory: [],
  isListening: false,
  
  // Experience completion
  hasMetFounder: false,
  hasExitedOffice: false,
  showSlidePanel: false,
  
  // Actions
  setCurrentScene: (scene) => set({ currentScene: scene }),
  setUserPosition: (position) => set({ userPosition: position }),
  setUserRotation: (rotation) => set({ userRotation: rotation }),
  setCameraRotation: (rotation) => set({ cameraRotation: rotation }),
  setWalking: (isWalking, target = null) => set({ isWalking, walkTarget: target }),
  setNearReception: (near) => set({ isNearReception: near }),
  setNearOffice: (near) => set({ isNearOffice: near }),
  setInOffice: (inOffice) => set({ isInOffice: inOffice }),
  setNearSeating: (near) => set({ isNearSeating: near }),
  setSitting: (sitting) => set({ isSitting: sitting }),
  setMeetingActive: (active) => set({ isMeetingActive: active }),
  addConversation: (message) => set((state) => ({
    conversationHistory: [...state.conversationHistory, message]
  })),
  setListening: (listening) => set({ isListening: listening }),
  setHasMetFounder: (met) => set({ hasMetFounder: met }),
  setHasExitedOffice: (exited) => set({ hasExitedOffice: exited }),
  setShowSlidePanel: (show) => set({ showSlidePanel: show }),
}))
