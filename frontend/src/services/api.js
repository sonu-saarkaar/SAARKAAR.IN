import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const fetchProjects = async () => {
    try {
        const response = await api.get('/projects/');
        return response.data;
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
    }
};

export const fetchProjectById = async (id) => {
    try {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching project ${id}:`, error);
        return null;
    }
};

export const submitFeedback = async (data) => {
    return await api.post('/interaction/feedback', data);
};

export const joinTeam = async (formData) => {
    return await api.post('/interaction/join', formData);
};

export const bookAppointment = async (data) => {
    return await api.post('/interaction/appointments', data);
};

const buildFounderFallback = (message) => {
    const msg = (message || '').toLowerCase();

    if (/hello|hi|hey|hlo|helo|namaste/.test(msg)) {
        return "Hello. I am SAARKAAR Founder AI. Ask me anything about the tech stack, product vision, architecture, or project decisions.";
    }
    if (/stack|tech|architecture|system|backend|frontend|api/.test(msg)) {
        return "Core stack: React + Three.js frontend, FastAPI backend, OpenAI intelligence layer, and MongoDB data layer. Ask your next question and I’ll go deeper module by module.";
    }
    if (/vision|goal|mission|future/.test(msg)) {
        return "The vision is to solve complexity with immersive, intelligent systems that feel natural to use. SAARKAAR focuses on real-world impact through AI + product architecture.";
    }

    return "I’m reconnecting, but I can still help. Ask about SAARKAAR’s projects, tech stack, architecture choices, hiring, or founder vision and I’ll answer directly.";
};

export const askFounderAI = async ({ message, history = [], language = 'auto' }) => {
    const safeMessage = (message || '').trim();
    if (!safeMessage) {
        return { response: 'Please enter a message.' };
    }

    const normalizedHistory = history
        .filter((item) => item && typeof item.role === 'string' && typeof item.content === 'string')
        .map((item) => ({ role: item.role, content: item.content }));

    const payload = {
        messages: [...normalizedHistory, { role: 'user', content: safeMessage }],
        language,
    };

    const tryRequest = async () => api.post('/chat', payload);

    try {
        const response = await tryRequest();
        return response.data;
    } catch (firstError) {
        try {
            const response = await tryRequest();
            return response.data;
        } catch (secondError) {
            console.error('Founder AI request failed:', secondError);
            return { response: buildFounderFallback(safeMessage), fallback: true };
        }
    }
};

export default api;
