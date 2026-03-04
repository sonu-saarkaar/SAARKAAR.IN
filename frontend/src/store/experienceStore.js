import { create } from 'zustand'

export const useExperienceStore = create((set) => ({
  // Session handling
  sessionId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),

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
  lastAssistantReply: '',

  // Experience completion
  hasMetFounder: false,
  hasExitedOffice: false,
  // Saved Meetings Logic
  savedMeetings: [],

  saveCurrentMeeting: () => set((state) => {
    if (state.conversationHistory.length === 0) return {}
    const newMeeting = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      history: state.conversationHistory,
      summary: state.conversationHistory.length > 0 ? state.conversationHistory[0].text.substring(0, 30) + "..." : "New Conversation"
    }
    return {
      savedMeetings: [newMeeting, ...state.savedMeetings],
      // Optional: Clear after save? Or allow continue? Let's keep it to allow save & continue.
    }
  }),

  loadMeeting: (meetingId) => set((state) => {
    const meeting = state.savedMeetings.find(m => m.id === meetingId)
    if (meeting) {
      return {
        conversationHistory: meeting.history,
        isMeetingActive: true // Auto open interface 
      }
    }
    return {}
  }),

  clearCurrentMeeting: () => set({ conversationHistory: [] }),

  // Actions
  setCurrentScene: (scene) => set({ currentScene: scene }),
  setUserPosition: (position) => set((state) => {
    const prev = state.userPosition
    if (
      prev[0] === position[0] &&
      prev[1] === position[1] &&
      prev[2] === position[2]
    ) {
      return state
    }
    return { userPosition: position }
  }),
  setUserRotation: (rotation) => set({ userRotation: rotation }),
  setCameraRotation: (rotation) => set({ cameraRotation: rotation }),
  setWalking: (isWalking, target = null) => set({ isWalking, walkTarget: target }),
  setNearReception: (near) => set((state) => state.isNearReception === near ? state : { isNearReception: near }),
  setNearOffice: (near) => set((state) => state.isNearOffice === near ? state : { isNearOffice: near }),
  setInOffice: (inOffice) => set({ isInOffice: inOffice }),
  setNearSeating: (near) => set((state) => state.isNearSeating === near ? state : { isNearSeating: near }),
  setSitting: (sitting) => set({ isSitting: sitting }),
  setMeetingActive: (active) => set({ isMeetingActive: active }),
  addConversation: (message) => set((state) => ({
    conversationHistory: [...state.conversationHistory, message]
  })),
  setLastAssistantReply: (reply) => set({ lastAssistantReply: reply }),
  setListening: (listening) => set({ isListening: listening }),
  setHasMetFounder: (met) => set({ hasMetFounder: met }),
  setHasExitedOffice: (exited) => set({ hasExitedOffice: exited }),

  // Expanded Interaction States
  isHoldingItem: false,
  heldItemName: null,
  appointmentStatus: 'none', // 'none', 'requested', 'approved', 'rejected'
  inCEOOffice: false,
  currentConversationPartner: null, // 'assistant', 'boss', null
  showInteractionUI: false,
  cameraFocus: 'lobby',

  // CEO Office Flow Specific
  ceoDoorOpen: false,
  bossWelcomed: false,

  // New Actions
  setHoldingItem: (holding, itemName = null) => set({ isHoldingItem: holding, heldItemName: itemName }),
  setAppointmentStatus: (status) => set({ appointmentStatus: status }),
  setInCEOOffice: (inOffice) => set({ inCEOOffice: inOffice }),
  setConversationPartner: (partner) => set({ currentConversationPartner: partner }),
  setShowInteractionUI: (show) => set({ showInteractionUI: show }),
  setCameraFocus: (focus) => set({ cameraFocus: focus }),
  setCeoDoorOpen: (open) => set({ ceoDoorOpen: open }),
  setBossWelcomed: (welcomed) => set({ bossWelcomed: welcomed }),

  setShowSlidePanel: (show) => set({ showSlidePanel: show }),

  // Autonomous Behavior specific state
  showPortfolioPanel: false,
  activePortfolioPanel: null,
  activePortfolioHighlight: null,
  setPortfolioState: (show, panel = null, highlight = null) => set({
    showPortfolioPanel: show,
    activePortfolioPanel: panel,
    activePortfolioHighlight: highlight
  }),
}))
