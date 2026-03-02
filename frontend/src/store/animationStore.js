import { create } from 'zustand'

export const useAnimationStore = create((set) => ({
  // User Character State
  currentAnimation: 'idle',
  setAnimation: (animation) => set({ currentAnimation: animation }),

  // Receptionist State
  receptionistState: 'phone', // phone, idle, listening, talking
  setReceptionistState: (state) => set({ receptionistState: state }),

  // Boss State
  bossState: 'typing', // typing, looking_up, talking, listening
  setBossState: (state) => set({ bossState: state }),

  // HR State
  hrState: 'checking_tablet',
  setHrState: (state) => set({ hrState: state }),

  // Assistant State
  assistantState: 'arranging_files',
  setAssistantState: (state) => set({ assistantState: state }),

  // Security State
  securityState: 'standing_guard',
  setSecurityState: (state) => set({ securityState: state }),

  // Interactions
  isInteracting: false,
  interactionTarget: null, // 'receptionist', 'boss'
  setInteraction: (isInteracting, target = null) => set({ isInteracting, interactionTarget: target }),

  // Actions
  startReceptionistInteraction: () => set({
    receptionistState: 'idle',
    isInteracting: true,
    interactionTarget: 'receptionist'
  }),

  endInteraction: () => set({
    isInteracting: false,
    interactionTarget: null,
    receptionistState: 'idle', // Return to professional idle, not phone immediately
    bossState: 'typing'
  }),

  // AI Response Simulation
  startTalking: () => {
    set((state) => {
      if (state.interactionTarget === 'receptionist') return { receptionistState: 'talking' }
      if (state.interactionTarget === 'boss') return { bossState: 'talking' }
      return {}
    })
  },

  stopTalking: () => {
    set((state) => {
      if (state.interactionTarget === 'receptionist') return { receptionistState: 'listening' }
      if (state.interactionTarget === 'boss') return { bossState: 'listening' }
      return {}
    })
  }
}))
