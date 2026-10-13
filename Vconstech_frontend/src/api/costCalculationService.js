// src/services/costCalculationService.js
import { projectAPI } from '../api/projectAPI.js';
import { getToken } from '../utils/tabToken.js';

const API_BASE_URL = import.meta.env.VITE_API_URL;


const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw {
      status: response.status,
      error: data.error || 'An error occurred',
      details: data.details
    };
  }
  return data;
};

const getBackendSpentData = (project = {}) => {
  const budgetSummary = project.budgetSummary || {};
  const breakdown = budgetSummary.breakdown || project.spentBreakdown || {};
  const totalSpent = Number(
    budgetSummary.totalSpent
    ?? project.totalSpent
    ?? project.spent
    ?? 0
  ) || 0;

  return {
    totalSpent,
    breakdown: {
      financial: Number(budgetSummary.expenseCost ?? project.expenseCost ?? breakdown.financialExpenses ?? breakdown.expenseCost ?? 0) || 0,
      materials: Number(budgetSummary.materialCost ?? project.materialCost ?? breakdown.materialCost ?? 0) || 0,
      labour: Number(budgetSummary.labourCost ?? project.labourCost ?? breakdown.labourCost ?? 0) || 0,
      contracts: Number(budgetSummary.contractCost ?? project.contractCost ?? breakdown.contractAmount ?? breakdown.contractorPayments ?? 0) || 0,
    },
  };
};

/**
 * Unified Cost Calculation Service
 * Aggregates costs from ALL sources: Financial expenses + Material usage + Labour payments + Contract costs
 */
export const costCalculationService = {
  /**
   * Calculate total spent for a single project
   * @param {number} projectId - Project ID
   * @returns {Object} { totalSpent, breakdown: { financial, materials, labour, contracts } }
   */
  calculateProjectSpent: async (projectId) => {
    try {
      const projectData = await projectAPI.getProjectById(projectId);
      return getBackendSpentData(projectData.project || {});
    } catch (error) {
      console.error('Error getting project spent:', error);
      throw error;
    }
  },

  /**
   * Calculate spent for all projects
   * @returns {Object} Map of projectId -> { totalSpent, breakdown }
   */
  calculateAllProjectsSpent: async () => {
    try {
      const projects = await projectAPI.getProjects();
      const spentMap = {};
      (projects.projects || []).forEach((project) => {
        spentMap[project.id] = getBackendSpentData(project);
      });
      
      return spentMap;
    } catch (error) {
      console.error('Error calculating all projects spent:', error);
      throw error;
    }
  },

  /**
   * Update project's spent field in database
   * @param {number} projectId - Project ID
   * @returns {Object} Updated project
   */
  updateProjectSpent: async (projectId) => {
    try {
      const token = getToken();
      
      // Calculate current spent
      const { totalSpent, breakdown } = await costCalculationService.calculateProjectSpent(projectId);
      
      // Update project with new spent value
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/spent`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ spent: totalSpent })
      });
      
      const result = await handleResponse(response);
      
      console.log(`✅ Updated project ${projectId} spent to ₹${totalSpent}`);
      console.log(`   Breakdown:`, breakdown);
      
      return result;
    } catch (error) {
      console.error('Error updating project spent:', error);
      throw error;
    }
  },

  /**
   * Get enriched project data with calculated spent
   * @param {number} projectId - Project ID
   * @returns {Object} Project with spent details
   */
  getProjectWithSpent: async (projectId) => {
    try {
      const projectData = await projectAPI.getProjectById(projectId);
      const project = projectData.project || {};
      const spentData = getBackendSpentData(project);
      
      return {
        ...project,
        spent: spentData.totalSpent,
        spentBreakdown: spentData.breakdown,
        budgetUtilization: project.budget
          ? ((spentData.totalSpent / project.budget) * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      console.error('Error getting project with spent:', error);
      throw error;
    }
  },

  /**
   * Get all projects with calculated spent
   * @returns {Array} Projects with spent data
   */
  getAllProjectsWithSpent: async () => {
    try {
      const projectsData = await projectAPI.getProjects();
      const enrichedProjects = (projectsData.projects || []).map((project) => {
        const spentData = getBackendSpentData(project);
        return {
          ...project,
          spent: spentData.totalSpent,
          spentBreakdown: spentData.breakdown,
          budgetUtilization: project.budget
            ? ((spentData.totalSpent / project.budget) * 100).toFixed(2)
            : 0
        };
      });
      
      return enrichedProjects;
    } catch (error) {
      console.error('Error getting all projects with spent:', error);
      throw error;
    }
  },

  /**
   * Get spending breakdown summary for a project
   * @param {number} projectId - Project ID
   * @returns {Object} Detailed breakdown with percentages
   */
  getSpendingBreakdown: async (projectId) => {
    try {
      const { totalSpent, breakdown } = await costCalculationService.calculateProjectSpent(projectId);
      
      // Calculate percentages
      const percentages = {
        financial: totalSpent > 0 ? ((breakdown.financial / totalSpent) * 100).toFixed(1) : 0,
        materials: totalSpent > 0 ? ((breakdown.materials / totalSpent) * 100).toFixed(1) : 0,
        labour: totalSpent > 0 ? ((breakdown.labour / totalSpent) * 100).toFixed(1) : 0,
        contracts: totalSpent > 0 ? ((breakdown.contracts / totalSpent) * 100).toFixed(1) : 0
      };
      
      return {
        totalSpent,
        breakdown,
        percentages,
        categories: [
          { name: 'Financial', amount: breakdown.financial, percentage: percentages.financial },
          { name: 'Materials', amount: breakdown.materials, percentage: percentages.materials },
          { name: 'Labour', amount: breakdown.labour, percentage: percentages.labour },
          { name: 'Contracts', amount: breakdown.contracts, percentage: percentages.contracts }
        ]
      };
    } catch (error) {
      console.error('Error getting spending breakdown:', error);
      throw error;
    }
  }
};

/**
 * Hook to automatically update spent when expenses/usage changes
 * Call this after:
 * - Adding/updating/deleting financial expenses
 * - Adding/updating/deleting material usage logs
 * - Adding/updating labour payments
 * - Adding/updating contract payments
 */
export const triggerSpentRecalculation = async (projectId) => {
  try {
    console.log(`🔄 Triggering spent recalculation for project ${projectId}...`);
    await costCalculationService.updateProjectSpent(projectId);
    console.log(`✅ Spent recalculation completed for project ${projectId}`);
  } catch (error) {
    console.error('Failed to recalculate spent:', error);
    throw error;
  }
};

export default costCalculationService;
