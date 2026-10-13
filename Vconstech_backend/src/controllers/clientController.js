import { prisma } from '../config/database.js';

// ========== CREATE CLIENT ==========
export const createClient = async (req, res) => {
  try {
    const { clientName, companyName, clientAddress, clientGST, clientPhone, clientEmail } = req.body;
    const companyId = req.user.companyId;

    if (!clientName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Client name is required' 
      });
    }

    const client = await prisma.client.create({
      data: {
        companyId,
        clientName,
        companyName:companyName || "",
        clientAddress: clientAddress || "",
        clientGST: clientGST || "",
        clientPhone: clientPhone || "",
        clientEmail: clientEmail || "",
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Client created successfully',
      client 
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create client', 
      details: error.message 
    });
  }
};

// ========== GET ALL CLIENTS ==========
export const getAllClients = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { search, limit = 50, page = 1 } = req.query;

    const where = { companyId };
    
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { clientName: 'asc' },
        take: parseInt(limit),
        skip,
      }),
      prisma.client.count({ where })
    ]);

    res.json({ 
      success: true, 
      clients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch clients',
      details: error.message 
    });
  }
};

// ========== GET CLIENT BY ID ==========
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const client = await prisma.client.findFirst({
      where: { 
        id: parseInt(id), 
        companyId 
      }
    });

    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: 'Client not found' 
      });
    }

    res.json({ success: true, client });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch client',
      details: error.message 
    });
  }
};

// ========== UPDATE CLIENT ==========
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, clientAddress, clientGST, clientPhone, clientEmail } = req.body;
    const companyId = req.user.companyId;

    const existingClient = await prisma.client.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!existingClient) {
      return res.status(404).json({ 
        success: false, 
        error: 'Client not found' 
      });
    }

    const client = await prisma.client.update({
      where: { id: parseInt(id) },
      data: {
        clientName: clientName || existingClient.clientName,
        clientAddress: clientAddress !== undefined ? clientAddress : existingClient.clientAddress,
        clientGST: clientGST !== undefined ? clientGST : existingClient.clientGST,
        clientPhone: clientPhone !== undefined ? clientPhone : existingClient.clientPhone,
        clientEmail: clientEmail !== undefined ? clientEmail : existingClient.clientEmail,
      }
    });

    res.json({ 
      success: true, 
      message: 'Client updated successfully',
      client 
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update client',
      details: error.message 
    });
  }
};

// ========== DELETE CLIENT ==========
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const client = await prisma.client.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: 'Client not found' 
      });
    }

    await prisma.client.delete({ 
      where: { id: parseInt(id) } 
    });

    res.json({ 
      success: true, 
      message: 'Client deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete client',
      details: error.message 
    });
  }
};
