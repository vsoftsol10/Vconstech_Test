// src/api/contractAPI.js
import axios from 'axios';
import { getToken } from '../utils/tabToken'; // ← ADD THIS

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get auth token
const getAuthHeaders = () => {
  const token = getToken(); 
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// GET - Fetch all contracts
export const getAllContracts = async () => {
  try {
    const response = await axios.get(`${API_URL}/contracts`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error.response?.data || error;
  }
};

// GET - Fetch single contract by ID
export const getContractById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/contracts/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching contract:', error);
    throw error.response?.data || error;
  }
};

// GET - Fetch contracts by project ID
export const getContractsByProject = async (projectId) => {
  try {
    const response = await axios.get(`${API_URL}/contracts/project/${projectId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching project contracts:', error);
    throw error.response?.data || error;
  }
};

// POST - Create new contract
export const createContract = async (contractData) => {
  try {
    const response = await axios.post(
      `${API_URL}/contracts`,
      contractData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error.response?.data || error;
  }
};

// PUT - Update contract
export const updateContract = async (id, contractData) => {
  try {
    const response = await axios.put(
      `${API_URL}/contracts/${id}`,
      contractData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error updating contract:', error);
    throw error.response?.data || error;
  }
};

// DELETE - Delete contract
export const deleteContract = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/contracts/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error deleting contract:', error);
    throw error.response?.data || error;
  }
};

// GET - Fetch all projects (for dropdown)
export const getAllProjects = async () => {
  try {
    const response = await axios.get(`${API_URL}/projects`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error.response?.data || error;
  }
};
