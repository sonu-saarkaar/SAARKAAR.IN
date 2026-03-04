import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const fetchProjects = async () => {
    const response = await api.get('/projects/');
    return response.data;
};

export const fetchProjectById = async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
};

export const getAdminToken = () => localStorage.getItem('saarkaar_admin_token') || '';

const adminHeaders = () => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminListProjects = async () => {
    const res = await api.get('/admin/portfolio', { headers: adminHeaders() });
    return res.data;
};

export const adminCreateProject = async (payload) => {
    const res = await api.post('/projects/', payload, { headers: adminHeaders() });
    return res.data;
};

export const adminUpdateProject = async (id, payload) => {
    const res = await api.put(`/projects/${id}`, payload, { headers: adminHeaders() });
    return res.data;
};

export const adminDeleteProject = async (id) => {
    const res = await api.delete(`/projects/${id}`, { headers: adminHeaders() });
    return res.data;
};

export const adminUploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload', formData, {
        headers: {
            ...adminHeaders(),
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const adminGetSystemConfig = async () => {
    const res = await api.get('/admin/system-config', { headers: adminHeaders() });
    return res.data;
};

export const adminUpdateSystemConfig = async (payload) => {
    const res = await api.put('/admin/system-config', payload, { headers: adminHeaders() });
    return res.data;
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
    if (/photo|pic|picture|image|profile\s*photo|boss\s*photo|founder\s*photo/.test(msg)) {
        return "Yeh hai hamare boss Sonu Saarkaar: /profile/sonu-boss.png";
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
