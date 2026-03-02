import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceInput(onSpeechEnd, onSpeechStart) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);

    // Use a ref for the callback so it's always up to date inside event listeners
    const onSpeechEndRef = useRef(onSpeechEnd);
    const onSpeechStartRef = useRef(onSpeechStart);

    useEffect(() => {
        onSpeechEndRef.current = onSpeechEnd;
        onSpeechStartRef.current = onSpeechStart;
    }, [onSpeechEnd, onSpeechStart]);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = false; // Auto detect silence
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setTranscript('');
                if (onSpeechStartRef.current) onSpeechStartRef.current();
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // When using interim results, just show what we have so far
                const currentTranscript = finalTranscript || interimTranscript;
                setTranscript(currentTranscript);
            };

            recognition.onend = () => {
                setIsListening(false);
                // Call the callback using a functional state approach to get the latest transcript
                setTranscript(prev => {
                    if (prev.trim() !== '' && onSpeechEndRef.current) {
                        onSpeechEndRef.current(prev.trim());
                    }
                    return prev;
                });
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech API not supported in this browser.");
        }

        return () => {
            if (recognitionRef.current) {
                // cleanup
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.onstart = null;
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                setTranscript('');
                recognitionRef.current.start();
            } catch (e) {
                console.warn('Speech recognition start error:', e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.warn('Speech recognition stop error:', e);
            }
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        isSupported: !!recognitionRef.current
    };
}
