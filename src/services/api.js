import axios from 'axios';

const API_BASE = '/api';

export const generateDesign = async (description) => {
  const response = await axios.post(`${API_BASE}/generate`, { description });
  return response.data;
};

export const runSimulation = async (design) => {
  const response = await axios.post(`${API_BASE}/simulate`, { design });
  return response.data;
};

export const refineDesign = async (designId, refinement) => {
  const response = await axios.post(`${API_BASE}/refine`, { designId, refinement });
  return response.data;
};
