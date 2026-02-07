import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

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

export const getUserSessions = async () => {
  const response = await api.get('/api/chat/sessions');
  return response.data;
};

export const deleteSession = async (sessionId) => {
  const response = await api.delete(`/api/chat/session/${sessionId}`);
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

// Phase 4: Simulation Control Endpoints
export const runMassPropertiesSimulation = async (design, material = 'Structural Steel', densityOverride = null) => {
  // Normalize design payload to ensure numeric fields (volume, surface area, COM, inertia)
  const parseNumber = (v) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'number') return v;
    const s = String(v).replace(/[^0-9.+-eE]/g, '');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const normalized = { ...design };
  // volume may be at several paths
  normalized.volume = parseNumber(design.volume)
    || parseNumber(design.properties?.volume)
    || parseNumber(design.properties?.volume_mm3)
    || parseNumber(design.analysis?.mass_properties?.volume_mm3)
    || 0;

  normalized.surfaceArea = parseNumber(design.surfaceArea)
    || parseNumber(design.properties?.surfaceArea)
    || parseNumber(design.analysis?.mass_properties?.surface_area)
    || 0;

  // center of mass
  const comSrc = design.centerOfMass || design.properties?.centerOfMass || design.analysis?.mass_properties?.center_of_mass;
  normalized.centerOfMass = {
    x: parseNumber(comSrc?.x || comSrc?.x_mm) || 0,
    y: parseNumber(comSrc?.y || comSrc?.y_mm) || 0,
    z: parseNumber(comSrc?.z || comSrc?.z_mm) || 0
  };

  // inertia
  const inertiaSrc = design.inertia || design.properties?.inertia || design.analysis?.mass_properties?.moments_of_inertia;
  normalized.inertia = {
    Ixx: parseNumber(inertiaSrc?.Ixx || inertiaSrc?.Ixx_kg_mm2) || 0,
    Iyy: parseNumber(inertiaSrc?.Iyy || inertiaSrc?.Iyy_kg_mm2) || 0,
    Izz: parseNumber(inertiaSrc?.Izz || inertiaSrc?.Izz_kg_mm2) || 0
  };

  const response = await api.post('/api/simulate', {
    design: normalized,
    simulationType: 'mass_properties',
    material,
    densityOverride
  });
  return response.data;
};

export const runStructuralSimulation = async (design) => {
  const response = await api.post('/api/simulate', {
    design,
    simulationType: 'structural'
  });
  return response.data;
};

export const runDeflectionSimulation = async (design) => {
  const response = await api.post('/api/simulate', {
    design,
    simulationType: 'deflection'
  });
  return response.data;
};

export const runStressSimulation = async (design) => {
  const response = await api.post('/api/simulate', {
    design,
    simulationType: 'stress'
  });
  return response.data;
};

export const getSimulationStatus = async (designId) => {
  try {
    const response = await api.get(`/api/simulate/status/${designId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get simulation status:', error);
    return null;
  }
};

export default api;
