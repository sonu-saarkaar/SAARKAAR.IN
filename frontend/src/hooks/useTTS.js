/**
 * useTTS.js — SAARKAAR Text-to-Speech Hook
 *
 * Features:
 * - Speaks AI responses using Browser Web Speech API
 * - Hindi / Hinglish / English phonetic correction
 * - "SAARKAAR" → spoken as "Sarkaar"
 * - Auto-selects Hindi voice when Hindi/Hinglish detected
 * - Fallback to English voice with Hinglish phonetics
 */

import { useEffect, useRef, useCallback } from 'react'

// ─── Phonetic substitution table ────────────────────────────────────────────
// These replacements run BEFORE speech synthesis so English TTS engine
// pronounces Hinglish / Roman Hindi words correctly.
const PHONETIC_MAP = [
    // Brand name
    [/saarkaar/gi, 'Sarkaar'],
    [/SAARKAAR/g, 'Sarkaar'],

    // Common Hinglish words → closest English phonetic
    [/\bkya\b/gi, 'kya'],
    [/\bhai\b/gi, 'hay'],
    [/\bhain\b/gi, 'hain'],
    [/\bkaise\b/gi, 'kai-say'],
    [/\bkaisa\b/gi, 'kai-sa'],
    [/\bkaun\b/gi, 'kaun'],
    [/\bkaro\b/gi, 'karo'],
    [/\bkarta\b/gi, 'karta'],
    [/\bkarein\b/gi, 'kar-ain'],
    [/\btheek\b/gi, 'theek'],
    [/\bacha\b/gi, 'acha'],
    [/\bachha\b/gi, 'ac-cha'],
    [/\bji\b/gi, 'jee'],
    [/\bji haan\b/gi, 'jee haan'],
    [/\bnahi\b/gi, 'nahin'],
    [/\bnhin\b/gi, 'nahin'],
    [/\bhaan\b/gi, 'haan'],
    [/\bsuno\b/gi, 'suno'],
    [/\bdekho\b/gi, 'dekho'],
    [/\bbatao\b/gi, 'bataao'],
    [/\bbolo\b/gi, 'bolo'],
    [/\baap\b/gi, 'aap'],
    [/\btum\b/gi, 'tum'],
    [/\bhum\b/gi, 'hum'],
    [/\bmujhe\b/gi, 'mujhay'],
    [/\bmera\b/gi, 'mera'],
    [/\bmeri\b/gi, 'meri'],
    [/\bapna\b/gi, 'apna'],
    [/\bapni\b/gi, 'apni'],
    [/\byaar\b/gi, 'yaar'],
    [/\bbhai\b/gi, 'bhai'],
    [/\bsir\b/gi, 'sir'],
    [/\bjee\b/gi, 'jee'],
    [/\bnamaste\b/gi, 'namas-tay'],
    [/\bshukriya\b/gi, 'shuk-ree-ya'],
    [/\bdhanyavaad\b/gi, 'dhan-ya-vaad'],
    [/\bbilkul\b/gi, 'bil-kul'],
    [/\bzaroor\b/gi, 'zaroor'],
    [/\bsamjhe\b/gi, 'samjhay'],
    [/\bsamajh\b/gi, 'samajh'],
    [/\bjaniye\b/gi, 'jaa-ni-yay'],
    [/\bbataye\b/gi, 'bataayay'],
    [/\bkijiye\b/gi, 'kee-ji-yay'],
    [/\bchahiye\b/gi, 'chaa-hi-yay'],
    [/\bkaam\b/gi, 'kaam'],
    [/\bprogram\b/gi, 'program'],
    [/\btechnology\b/gi, 'technology'],
    [/\bproject\b/gi, 'project'],
    [/\bportfolio\b/gi, 'portfolio'],

    // Fix ALL-CAPS acronyms → spelt out
    [/\bAI\b/g, 'A I'],
    [/\bAPI\b/g, 'A P I'],
    [/\bUI\b/g, 'U I'],
    [/\bCEO\b/g, 'C E O'],
    [/\bCSC\b/g, 'C S C'],
]

// ─── Language detection ──────────────────────────────────────────────────────
function detectLang(text) {
    if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'      // Devanagari
    const hindiWords = ['hai', 'hain', 'kya', 'kaise', 'karo', 'nahi', 'haan', 'aap', 'mujhe', 'mera', 'yaar', 'bilkul', 'shukriya', 'namaste', 'batao']
    const lower = text.toLowerCase()
    const count = hindiWords.filter(w => lower.includes(w)).length
    return count >= 2 ? 'hi-IN' : 'en-IN'
}

// ─── Phonetic clean for TTS ──────────────────────────────────────────────────
function prepareForSpeech(text, lang) {
    let cleaned = text

    // Strip markdown bold/italic
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
    // Strip emoji
    cleaned = cleaned.replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d]+/gu, '')
    // Strip URLs
    cleaned = cleaned.replace(/https?:\/\/\S+/g, 'link')

    // Apply phonetic map (for Hinglish / English TTS)
    if (lang !== 'hi-IN') {
        for (const [pattern, replacement] of PHONETIC_MAP) {
            cleaned = cleaned.replace(pattern, replacement)
        }
    } else {
        // For native Hindi voice, still fix SAARKAAR brand name
        cleaned = cleaned.replace(/saarkaar/gi, 'Sarkaar')
    }

    // Trim extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    return cleaned
}

// ─── Voice selector ──────────────────────────────────────────────────────────
function getBestVoice(lang, voices) {
    // Priority: exact match lang → name contains 'India' → name contains 'Google'
    const exact = voices.filter(v => v.lang === lang)
    const india = voices.filter(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('india'))
    const google = voices.filter(v => v.name.toLowerCase().includes('google'))
    const enIN = voices.filter(v => v.lang === 'en-IN')

    if (lang === 'hi-IN') {
        return exact[0] || india[0] || enIN[0] || google[0] || voices[0] || null
    }
    // For Hinglish: prefer en-IN Google voice (sounds more Indian)
    return (
        enIN.find(v => v.name.toLowerCase().includes('google')) ||
        enIN[0] ||
        google[0] ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0] ||
        null
    )
}

// ─── Main Hook ───────────────────────────────────────────────────────────────
export function useTTS() {
    const utteranceRef = useRef(null)
    const voicesRef = useRef([])

    useEffect(() => {
        const loadVoices = () => {
            voicesRef.current = window.speechSynthesis.getVoices()
        }
        loadVoices()
        window.speechSynthesis.onvoiceschanged = loadVoices
        return () => { window.speechSynthesis.onvoiceschanged = null }
    }, [])

    const speak = useCallback((text) => {
        if (!text || !window.speechSynthesis) return

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const lang = detectLang(text)
        const cleaned = prepareForSpeech(text, lang)
        if (!cleaned) return

        const utterance = new SpeechSynthesisUtterance(cleaned)
        utterance.lang = lang

        const voice = getBestVoice(lang, voicesRef.current)
        if (voice) utterance.voice = voice

        // Natural speech parameters
        utterance.rate = lang === 'hi-IN' ? 0.92 : 0.95   // slightly slow for clarity
        utterance.pitch = 1.0
        utterance.volume = 1.0

        utteranceRef.current = utterance
        window.speechSynthesis.speak(utterance)
    }, [])

    const stop = useCallback(() => {
        window.speechSynthesis?.cancel()
    }, [])

    const isSpeaking = () => window.speechSynthesis?.speaking ?? false

    return { speak, stop, isSpeaking }
}
