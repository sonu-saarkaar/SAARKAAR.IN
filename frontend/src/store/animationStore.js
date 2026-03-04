import { create } from 'zustand'

export const useAnimationStore = create((set) => ({
  // User Character State
  currentAnimation: 'idle',
  setAnimation: (animation) => set({ currentAnimation: animation }),

  // Assistant State
  assistantState: 'idle', // idle, listening, talking
  setAssistantState: (state) => set({ assistantState: state }),

  // Boss State
  bossState: 'typing', // typing, looking_up, talking, listening
  setBossState: (state) => set({ bossState: state }),

  // HR State
  hrState: 'checking_tablet',
  setHrState: (state) => set({ hrState: state }),

  // Security State
  securityState: 'standing_guard',
  setSecurityState: (state) => set({ securityState: state }),

  // Interactions
  isInteracting: false,
  interactionTarget: null, // 'assistant', 'boss'
  setInteraction: (isInteracting, target = null) => set({ isInteracting, interactionTarget: target }),

  // Actions
  startAssistantInteraction: () => set({
    assistantState: 'idle',
    isInteracting: true,
    interactionTarget: 'assistant'
  }),

  endInteraction: () => set({
    isInteracting: false,
    interactionTarget: null,
    assistantState: 'idle', // Return to professional idle, not phone immediately
    bossState: 'typing'
  }),

  // AI Response Simulation
  startTalking: () => {
    set((state) => {
      if (state.interactionTarget === 'assistant') return { assistantState: 'talking' }
      if (state.interactionTarget === 'boss') return { bossState: 'talking' }
      return {}
    })
  },

  stopTalking: () => {
    set((state) => {
      if (state.interactionTarget === 'assistant') return { assistantState: 'listening' }
      if (state.interactionTarget === 'boss') return { bossState: 'listening' }
      return {}
    })
  }
}))
