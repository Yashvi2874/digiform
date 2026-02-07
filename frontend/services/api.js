import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const generateDesign = async (description) => {
  const response = await api.post('/api/generate', { description });
  return response.data;
};

export const runSimulation = async (design) => {
  const response = await api.post('/api/simulate', { design });
  return response.data;
};

export const refineDesign = async (designId, refinement) => {
  const response = await api.post('/api/refine', { designId, refinement });
  return response.data;
};

export const exportCAD = async (design, format) => {
  const response = await api.post('/api/export', 
    { design, format },
    { responseType: 'blob' }
  );
  return response.data;
};

// Chat API
export const createSession = async () => {
  const response = await api.post('/api/chat/session');
  return response.data;
};

export const sendMessage = async (sessionId, message) => {
  const response = await api.post('/api/chat/message', {
    sessionId,
    message
  });
  return response.data;
};

export const getChatHistory = async (sessionId) => {
  const response = await api.get(`/api/chat/history/${sessionId}`);
  return response.data;
};

export const approveDesign = async (designId) => {
  const response = await api.post('/api/design/approve', { designId });
  return response.data;
};

export const rejectDesign = async (designId) => {
  const response = await api.post('/api/design/reject', { designId });
  return response.data;
};

export default api;
