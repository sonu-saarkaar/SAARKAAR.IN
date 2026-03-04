import { create } from 'zustand'
import { getGPUTier } from 'detect-gpu'

export const usePerformanceStore = create((set, get) => ({
    isInitialized: false,
    gpuTier: 'high', // 'high' | 'medium' | 'low'
    isMobile: false,
    deviceMemory: 4,
    isSafeMode: false,
    settings: {
        shadows: true,
        reflections: true,
        highResTextures: true,
        antialiasing: true,
        particlesEnabled: true,
        dpr: Math.min(window?.devicePixelRatio || 1, 1.5),
        postProcessing: false
    },

    initDevice: async () => {
        try {
            const gpuData = await getGPUTier()
            const isMobile = gpuData.isMobile || /Mobi|Android/i.test(navigator.userAgent)
            const deviceMemory = navigator?.deviceMemory || 4

            let tier = 'high'
            if (gpuData.tier === 1 || isMobile || deviceMemory < 4) {
                tier = 'low'
            } else if (gpuData.tier === 2) {
                tier = 'medium'
            } else {
                tier = 'high'
            }

            set({
                isInitialized: true,
                gpuTier: tier,
                isMobile: isMobile,
                deviceMemory: deviceMemory,
                settings: {
                    shadows: tier !== 'low' && !isMobile,
                    reflections: tier !== 'low' && !isMobile,
                    highResTextures: tier === 'high',
                    antialiasing: tier === 'high',
                    particlesEnabled: tier !== 'low',
                    dpr: Math.min(window.devicePixelRatio || 1, tier === 'high' ? 1.5 : (tier === 'medium' ? 1.2 : 1)),
                    postProcessing: tier === 'high' && !isMobile
                }
            })
        } catch (e) {
            console.warn("Could not detect GPU:", e)
            set({
                isInitialized: true,
                gpuTier: 'medium',
                settings: {
                    shadows: true, reflections: true, highResTextures: false,
                    antialiasing: true, particlesEnabled: true, dpr: 1.5, postProcessing: false
                }
            })
        }
    },

    setSafeMode: (val) => {
        set({ isSafeMode: val })
        if (!val) {
            localStorage.removeItem('saarkaar_safe_mode')
        } else {
            localStorage.setItem('saarkaar_safe_mode', '1')
        }
    },

    adjustForLowFPS: () => {
        const state = get()
        if (state.gpuTier !== 'low') {
            console.warn("FPS dropped significantly. Downgrading graphics settings...")
            set({
                gpuTier: 'low',
                settings: {
                    ...state.settings,
                    shadows: false,
                    reflections: false,
                    particlesEnabled: false,
                    dpr: 1
                }
            })
        }
    }
}))
