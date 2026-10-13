// src/services/labourService.js
import { prisma } from '../config/database.js';

// Get all labourers for a company
export const getEngineerAssignedProjectIds = async (companyId, engineerId) => {
  const projects = await prisma.project.findMany({
    where: { companyId, assignedEngineerId: Number.parseInt(engineerId, 10) },
    select: { id: true }
  })
  return projects.map(({ id }) => id)
}

export const isLabourAssignedToEngineer = async (labourId, companyId, engineerId) => {
  const projectIds = await getEngineerAssignedProjectIds(companyId, engineerId)
  if (!projectIds.length) return false
  const labour = await prisma.labour.findFirst({
    where: { id: labourId, companyId, projectId: { in: projectIds } },
    select: { id: true }
  })
  return Boolean(labour)
}

export const isProjectAssignedToEngineer = async (projectId, companyId, engineerId) => {
  const projectIds = await getEngineerAssignedProjectIds(companyId, engineerId)
  return projectIds.includes(Number.parseInt(projectId, 10))
}

export const getAllLabourers = async (companyId, projectId = null, engineerId = null) => {
  const where = { companyId };

  if (engineerId != null) {
    const assignedProjectIds = await getEngineerAssignedProjectIds(companyId, engineerId)
    if (!assignedProjectIds.length) return []
    where.projectId = { in: assignedProjectIds }
  } else if (projectId) {
    where.projectId = parseInt(projectId);
  }

  const labourers = await prisma.labour.findMany({
    where,
    include: {
      payments: {
        orderBy: { date: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          date: true,
          remarks: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Transform data to include totalPaid
  return labourers.map(labourer => {
    const totalPaid = labourer.payments.reduce((sum, payment) => 
      sum + Number(payment.amount), 0
    );
    
    return {
      ...labourer,
      project: labourer.projectName,
      totalPaid
    };
  });
};

// Get single labourer by ID
export const getLabourerById = async (id, companyId) => {
  const labourer = await prisma.labour.findFirst({
    where: {
      id,
      companyId
    },
    include: {
      payments: {
        orderBy: { date: 'desc' },
        select: {
          id: true,
          amount: true,
          date: true,
          remarks: true
        }
      }
    }
  });

  if (!labourer) return null;

  const totalPaid = labourer.payments.reduce((sum, payment) => 
    sum + Number(payment.amount), 0
  );

  return {
    ...labourer,
    totalPaid
  };
};

// Create new labourer
export const createLabourer = async (data) => {
  console.log('🔧 Service: Creating labourer with data:', data);
  
  const labourer = await prisma.labour.create({
  data: {
    name: data.name,
    phone: data.phone,
    address: data.address,
    designation: data.designation,  // ← ADD
    projectName: data.project,          // ← ADD
    companyId: data.companyId,
    projectId: data.projectId
  },
    include: {
      payments: {
        select: {
          id: true,
          amount: true,
          date: true,
          remarks: true
        }
      }
    }
  });

  console.log('✅ Service: Labourer created:', labourer);

  return {
    ...labourer,
    project: labourer.projectName,
    totalPaid: 0
  };
};

// Update labourer
export const updateLabourer = async (id, companyId, data) => {
  const existing = await prisma.labour.findFirst({
    where: { id, companyId }
  });

  if (!existing) return null;

  const labourer = await prisma.labour.update({
  where: { id },
  data: {
    name: data.name,
    phone: data.phone,
    address: data.address,
    designation: data.designation,  // ← ADD
    projectName: data.project,          // ← ADD
    projectId: data.projectId
  },
    include: {
      payments: {
        orderBy: { date: 'desc' },
        select: {
          id: true,
          amount: true,
          date: true,
          remarks: true
        }
      }
    }
  });

  const totalPaid = labourer.payments.reduce((sum, payment) => 
    sum + Number(payment.amount), 0
  );

  return {
    ...labourer,
      project: labourer.projectName,
    totalPaid
  };
};

// Delete labourer
export const deleteLabourer = async (id, companyId) => {
  const existing = await prisma.labour.findFirst({
    where: { id, companyId }
  });

  if (!existing) return null;

  await prisma.labour.delete({
    where: { id }
  });

  return true;
};

// Add payment to labourer
export const addPayment = async (labourId, companyId, paymentData) => {
  const labourer = await prisma.labour.findFirst({
    where: {
      id: labourId,
      companyId
    }
  });

  if (!labourer) return null;

  const payment = await prisma.labourPayment.create({
    data: {
      labourId,
      amount: paymentData.amount,
      date: paymentData.date,
      remarks: paymentData.remarks
    }
  });

  return payment;
};

export const saveAttendance = async (labourId, companyId, attendanceData) => {
  const labourer = await prisma.labour.findFirst({ where: { id: labourId, companyId } });
  if (!labourer) return null;
  const attendanceDate = new Date(`${attendanceData.attendanceDate}T00:00:00.000Z`);
  const headWage = Number(attendanceData.headWage);
  const helperRate = Number(attendanceData.helperRate);
  const fullHelpers = Math.max(0, parseInt(attendanceData.fullHelpers, 10) || 0);
  const halfHelpers = Math.max(0, parseInt(attendanceData.halfHelpers, 10) || 0);
  const headCost = attendanceData.headDayType === 'HALF_DAY' ? headWage * 0.5 : headWage;
  const totalAmount = headCost + (fullHelpers * helperRate) + (halfHelpers * helperRate * 0.5);
  return prisma.labourAttendance.create({
    data: { labourId, companyId, projectId: parseInt(attendanceData.projectId, 10), attendanceDate, headWage, headDayType: attendanceData.headDayType || 'FULL_DAY', fullHelpers, halfHelpers, helperRate, totalAmount, entryStatus: attendanceData.entryStatus || 'DRAFT', notes: attendanceData.notes?.trim() || null }
  });
};

export const getLabourAttendance = async (labourId, companyId) => {
  const labourer = await prisma.labour.findFirst({ where: { id: labourId, companyId } });
  if (!labourer) throw new Error('Labourer not found or access denied');
  return prisma.labourAttendance.findMany({ where: { labourId, companyId }, orderBy: { attendanceDate: 'desc' } });
};

// Get all payments for a labourer
export const getLabourerPayments = async (labourId, companyId) => {
  const labourer = await prisma.labour.findFirst({
    where: {
      id: labourId,
      companyId
    }
  });

  if (!labourer) {
    throw new Error('Labourer not found or access denied');
  }

  const payments = await prisma.labourPayment.findMany({
    where: { labourId },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      amount: true,
      date: true,
      remarks: true,
      createdAt: true
    }
  });

  return payments;
};

// Delete payment
export const deletePayment = async (paymentId, labourId, companyId) => {
  const labourer = await prisma.labour.findFirst({
    where: {
      id: labourId,
      companyId
    }
  });

  if (!labourer) return null;

  const payment = await prisma.labourPayment.findFirst({
    where: {
      id: paymentId,
      labourId
    }
  });

  if (!payment) return null;

  await prisma.labourPayment.delete({
    where: { id: paymentId }
  });

  return true;
};

// Get labourers by project
export const getLabourersByProject = async (projectId, companyId) => {
  const labourers = await prisma.labour.findMany({
    where: {
      projectId,
      companyId
    },
    include: {
      payments: {
        orderBy: { date: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          date: true,
          remarks: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return labourers.map(labourer => {
    const totalPaid = labourer.payments.reduce((sum, payment) => 
      sum + Number(payment.amount), 0
    );
    
    return {
      ...labourer,
      totalPaid
    };
  });
};

// Get labour statistics
export const getLabourStatistics = async (companyId, projectId = null) => {
  const where = { companyId };
  
  if (projectId) {
    where.projectId = projectId;
  }

  const totalLabourers = await prisma.labour.count({ where });

  const payments = await prisma.labourPayment.findMany({
    where: {
      labour: where
    },
    select: {
      amount: true,
      date: true
    }
  });

  const totalPaid = payments.reduce((sum, payment) => 
    sum + Number(payment.amount), 0
  );

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const paymentsThisMonth = payments.filter(
    payment => new Date(payment.date) >= firstDayOfMonth
  );
  
  const totalPaidThisMonth = paymentsThisMonth.reduce(
    (sum, payment) => sum + Number(payment.amount), 0
  );

  const labourersByProject = await prisma.labour.groupBy({
    by: ['projectId'],
    where: { companyId },
    _count: true
  });

  return {
    totalLabourers,
    totalPaid,
    totalPaidThisMonth,
    totalPayments: payments.length,
    paymentsThisMonth: paymentsThisMonth.length,
    labourersByProject: labourersByProject.map(item => ({
      projectId: item.projectId,
      count: item._count
    })),
    averagePaymentPerLabourer: totalLabourers > 0 
      ? (totalPaid / totalLabourers).toFixed(2) 
      : 0
  };
};
