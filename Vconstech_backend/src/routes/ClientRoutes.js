import express from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient
} from '../controllers/clientController.js';
import { authenticateToken } from '../middlewares/authMiddlewares.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new client
router.post('/', createClient);

// Get all clients for the company
router.get('/', getAllClients);

// Get a specific client by ID
router.get('/:id', getClientById);

// Update a client
router.put('/:id', updateClient);

// Delete a client
router.delete('/:id', deleteClient);

export default router;