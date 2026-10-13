import { lazy, Suspense, useState, useMemo } from 'react';
import DashboardTab from '../../components/MaterialManagement/DashboardTab';
import MaterialForm from '../../components/MaterialManagement/MaterialForm';
import ModalMaterial from '../../components/MaterialManagement/ModalMaterial';
import Navbar from '../../components/common/Navbar';
import SidePannel from '../../components/common/SidePannel';
import { materialAPI } from '../../api/materialService';
import { focusFirstInvalidField, validateFields } from '../../utils/formValidation';

const ProjectsTab = lazy(() => import('../../components/MaterialManagement/ProjectsTab'));
const RequestTab = lazy(() => import('../../components/MaterialManagement/RequestTab'));

const MaterialManagement = () => {
  
  const [materials, setMaterials] = useState([
    { id: 'MAT001', name: 'Asian Paints Premium', category: 'Paint', unit: 'liter', defaultRate: 450, quantity: 200, vendor: 'Asian Paints', description: 'Premium interior paint' },
    { id: 'MAT002', name: 'Teak Wood Plywood', category: 'Wood', unit: 'sheet', defaultRate: 2800, quantity: 75, vendor: 'Century Ply', description: '8mm marine plywood' },
    { id: 'MAT003', name: 'Ceramic Tiles', category: 'Flooring', unit: 'sq.ft', defaultRate: 65, quantity: 1500, vendor: 'Kajaria', description: 'Vitrified tiles 2x2' },
    { id: 'MAT004', name: 'LED Lights', category: 'Electrical', unit: 'piece', defaultRate: 350, quantity: 120, vendor: 'Philips', description: '12W panel lights' },
  ]);
  

  const [projects, setProjects] = useState([
    { id: 'PRJ001', name: 'Residential - Adyar', status: 'Active' },
    { id: 'PRJ002', name: 'Office - OMR', status: 'Active' },
    { id: 'PRJ003', name: 'Villa - ECR', status: 'Completed' },
  ]);

  const [projectMaterials, setProjectMaterials] = useState([
    { projectId: 'PRJ001', materialId: 'MAT001', assigned: 50, used: 20, status: 'Active' },
    { projectId: 'PRJ001', materialId: 'MAT002', assigned: 15, used: 15, status: 'Completed' },
    { projectId: 'PRJ001', materialId: 'MAT003', assigned: 1200, used: 800, status: 'Active' },
    { projectId: 'PRJ002', materialId: 'MAT001', assigned: 30, used: 5, status: 'Active' },
    { projectId: 'PRJ002', materialId: 'MAT004', assigned: 25, used: 0, status: 'Not Used' },
  ]);

  const [usageLogs, setUsageLogs] = useState([
    { date: '2025-10-10', projectId: 'PRJ001', materialId: 'MAT001', quantity: 20, remarks: 'For Living Room wall' },
    { date: '2025-10-12', projectId: 'PRJ001', materialId: 'MAT002', quantity: 5, remarks: 'For kitchen cabinets' },
    { date: '2025-10-13', projectId: 'PRJ001', materialId: 'MAT003', quantity: 400, remarks: 'Master bedroom flooring' },
  ]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState('PRJ001');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddProjectMaterial, setShowAddProjectMaterial] = useState(false);
  const [showUsageLog, setShowUsageLog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialErrors, setMaterialErrors] = useState({});
  const [projectMaterialErrors, setProjectMaterialErrors] = useState({});
  const [usageErrors, setUsageErrors] = useState({});

  const categories = ['All', 'Paint', 'Wood', 'Flooring', 'Electrical', 'Fabric', 'Hardware', 'Plumbing'];


  const [newMaterial, setNewMaterial] = useState({
    name: '', category: '', unit: 'piece', defaultRate: '', quantity: '', vendor: '', description: ''
  });

  const [newProjectMaterial, setNewProjectMaterial] = useState({
    materialId: '', assigned: '', used: 0, status: 'Active'
  });

  const [newUsageLog, setNewUsageLog] = useState({
    date: new Date().toISOString().split('T')[0], materialId: '', quantity: '', remarks: ''
  });

  const dashboardMetrics = useMemo(() => {
    const totalMaterials = materials.length;
    const activeMaterials = projectMaterials.filter(pm => pm.status === 'Active').length;
    const totalCost = projectMaterials.reduce((sum, pm) => {
      const material = materials.find(m => m.id === pm.materialId);
      return sum + (material?.defaultRate || 0) * pm.used;
    }, 0);
    const overusedMaterials = projectMaterials.filter(pm => pm.used > pm.assigned);
    return { totalMaterials, activeMaterials, totalCost, overusedMaterials: overusedMaterials.length };
  }, [materials, projectMaterials]);

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || m.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getProjectMaterialsWithDetails = (projectId) => {
    return projectMaterials
      .filter(pm => pm.projectId === projectId)
      .map(pm => ({
        ...pm,
        material: materials.find(m => m.id === pm.materialId),
        remaining: pm.assigned - pm.used
      }));
  };

  const getProjectUsageLogs = (projectId) => {
    return usageLogs
      .filter(log => log.projectId === projectId)
      .map(log => ({
        ...log,
        material: materials.find(m => m.id === log.materialId)
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

const handleAddMaterial = async () => {
  const errors = validateFields([
    { name: 'materialName', value: newMaterial.name, label: 'Material name', rules: ['name'] },
    { name: 'materialCategory', value: newMaterial.category, label: 'Category', rules: ['dropdown'] },
    { name: 'materialDefaultRate', value: newMaterial.defaultRate, label: 'Default rate', rules: ['amount'] },
    { name: 'materialQuantity', value: newMaterial.quantity, label: 'Quantity', rules: ['quantity'] },
    { name: 'materialVendor', value: newMaterial.vendor, label: 'Vendor', rules: newMaterial.vendor ? ['name'] : [] },
    { name: 'materialDescription', value: newMaterial.description, label: 'Description', rules: newMaterial.description ? ['textarea'] : [] },
  ]);
  setMaterialErrors(errors);
  if (Object.keys(errors).length) {
    focusFirstInvalidField(errors);
    return;
  }
  const formData = new FormData();
  formData.append('name', newMaterial.name);
  formData.append('category', newMaterial.category);
  formData.append('unit', newMaterial.unit);
  formData.append('defaultRate', newMaterial.defaultRate);
  formData.append('quantity', newMaterial.quantity);
  formData.append('vendor', newMaterial.vendor || '');
  formData.append('description', newMaterial.description || '');
  if (newMaterial.quotationFile) {
    formData.append('files', newMaterial.quotationFile);
  }
  // call your API with formData instead of plain object
  await materialAPI.create(formData);
  setNewMaterial({ name: '', category: '', unit: 'piece', defaultRate: '', quantity: '', vendor: '', description: '', quotationFile: null });
  setShowAddMaterial(false);
};

  const handleUpdateMaterial = () => {
    const errors = validateFields([
      { name: 'materialName', value: editingMaterial.name, label: 'Material name', rules: ['name'] },
      { name: 'materialCategory', value: editingMaterial.category, label: 'Category', rules: ['dropdown'] },
      { name: 'materialDefaultRate', value: editingMaterial.defaultRate, label: 'Default rate', rules: ['amount'] },
      { name: 'materialQuantity', value: editingMaterial.quantity, label: 'Quantity', rules: ['quantity'] },
      { name: 'materialVendor', value: editingMaterial.vendor, label: 'Vendor', rules: editingMaterial.vendor ? ['name'] : [] },
      { name: 'materialDescription', value: editingMaterial.description, label: 'Description', rules: editingMaterial.description ? ['textarea'] : [] },
    ]);
    setMaterialErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors);
      return;
    }
    setMaterials(materials.map(m => m.id === editingMaterial.id ? editingMaterial : m));
    setEditingMaterial(null);
  };

  const handleDeleteMaterial = (id) => {
    if (confirm('Are you sure you want to delete this material?')) {
      setMaterials(materials.filter(m => m.id !== id));
      setProjectMaterials(projectMaterials.filter(pm => pm.materialId !== id));
    }
  };

  const handleAddProjectMaterial = () => {
    const errors = validateFields([
      { name: 'projectMaterialId', value: newProjectMaterial.materialId, label: 'Material', rules: ['dropdown'] },
      { name: 'projectAssigned', value: newProjectMaterial.assigned, label: 'Assigned quantity', rules: ['quantity'] },
      { name: 'projectUsed', value: newProjectMaterial.used, label: 'Used quantity', rules: newProjectMaterial.used ? ['optionalQuantity'] : [] },
    ]);
    setProjectMaterialErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors);
      return;
    }
    setProjectMaterials([...projectMaterials, {
      projectId: selectedProject,
      ...newProjectMaterial,
      used: parseInt(newProjectMaterial.used)
    }]);
    setNewProjectMaterial({ materialId: '', assigned: '', used: 0, status: 'Active' });
    setShowAddProjectMaterial(false);
  };

  const handleUpdateUsage = (projectId, materialId, newUsed) => {
    setProjectMaterials(projectMaterials.map(pm =>
      pm.projectId === projectId && pm.materialId === materialId
        ? { ...pm, used: parseInt(newUsed) }
        : pm
    ));
  };

  const handleAddUsageLog = () => {
    const errors = validateFields([
      { name: 'usageDate', value: newUsageLog.date, label: 'Date', rules: ['date'] },
      { name: 'usageMaterialId', value: newUsageLog.materialId, label: 'Material', rules: ['dropdown'] },
      { name: 'usageQuantity', value: newUsageLog.quantity, label: 'Quantity used', rules: ['quantity'] },
      { name: 'usageRemarks', value: newUsageLog.remarks, label: 'Remarks', rules: newUsageLog.remarks ? ['textarea'] : [] },
    ]);
    setUsageErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors);
      return;
    }
    setUsageLogs([...usageLogs, {
      ...newUsageLog,
      projectId: selectedProject,
      quantity: parseInt(newUsageLog.quantity)
    }]);
    const currentPM = projectMaterials.find(pm =>
      pm.projectId === selectedProject && pm.materialId === newUsageLog.materialId
    );
    if (currentPM) {
      handleUpdateUsage(selectedProject, newUsageLog.materialId,
        currentPM.used + parseInt(newUsageLog.quantity));
    }
    setNewUsageLog({ date: new Date().toISOString().split('T')[0], materialId: '', quantity: '', remarks: '' });
    setShowUsageLog(false);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm";

  const tabs = ['dashboard', 'projects', 'Requests'];

  

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}

      {/* SidePannel — renders desktop sidebar + mobile bottom nav internally */}

      {/* Main content */}
      <div className="pt-20 md:pl-64 md:pt-25">

        {/* Page header */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">Material Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track and manage materials across all projects</p>
        </div>

        {/* Tab bar — segmented control style, matching the Cards/Table toggle elsewhere */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3">
          <div className="flex w-fit mx-auto items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-yellow-400 text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content — pb-24 so bottom nav doesn't cover last element on mobile */}
        <div className="pb-24 md:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardTab
              metrics={dashboardMetrics}
              usageLogs={usageLogs}
              projects={projects}
              materials={materials}
            />
          )}
          {activeTab === 'projects' && (
            <Suspense fallback={null}>
              <ProjectsTab
                projects={projects}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                projectMaterials={getProjectMaterialsWithDetails(selectedProject)}
                usageLogs={getProjectUsageLogs(selectedProject)}
                onAddProjectMaterial={() => setShowAddProjectMaterial(true)}
                onLogUsage={() => setShowUsageLog(true)}
              />
            </Suspense>
          )}
          {activeTab === 'Requests' && (
            <Suspense fallback={null}>
              <RequestTab
                projects={projects}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                projectMaterials={getProjectMaterialsWithDetails(selectedProject)}
                usageLogs={getProjectUsageLogs(selectedProject)}
                onAddProjectMaterial={() => setShowAddProjectMaterial(true)}
                onLogUsage={() => setShowUsageLog(true)}
              />
            </Suspense>
          )}
        </div>

        {/* ── Add Material Modal ── */}
        <ModalMaterial
          isOpen={showAddMaterial}
          onClose={() => setShowAddMaterial(false)}
          title="Add New Material"
          footer={
            <>
              <button onClick={() => setShowAddMaterial(false)} className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleAddMaterial} className="flex-1 sm:flex-none px-5 py-2.5 bg-yellow-400 text-black rounded-xl text-sm font-semibold hover:bg-yellow-500 transition-colors shadow-sm">
                Add Material
              </button>
            </>
          }
        >
          <MaterialForm material={newMaterial} onChange={setNewMaterial} categories={categories} errors={materialErrors} />
        </ModalMaterial>

        {/* ── Edit Material Modal ── */}
        <ModalMaterial
          isOpen={!!editingMaterial}
          onClose={() => setEditingMaterial(null)}
          title="Edit Material"
          footer={
            <>
              <button onClick={() => setEditingMaterial(null)} className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateMaterial} className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                Update Material
              </button>
            </>
          }
        >
          {editingMaterial && (
            <MaterialForm material={editingMaterial} onChange={setEditingMaterial} categories={categories} errors={materialErrors} />
          )}
        </ModalMaterial>

        {/* ── Add Project Material Modal ── */}
        <ModalMaterial
          isOpen={showAddProjectMaterial}
          onClose={() => setShowAddProjectMaterial(false)}
          title="Add Material to Project"
          footer={
            <>
              <button onClick={() => setShowAddProjectMaterial(false)} className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleAddProjectMaterial} className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                Add to Project
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Material</label>
              <select
                name="projectMaterialId"
                value={newProjectMaterial.materialId}
                onChange={(e) => setNewProjectMaterial({...newProjectMaterial, materialId: e.target.value})}
                className={`${inputClass} ${projectMaterialErrors.projectMaterialId ? 'border-red-500' : ''}`}
              >
                <option value="">Choose a material...</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.category} - {m.unit})</option>
                ))}
              </select>
              {projectMaterialErrors.projectMaterialId && <p className="text-red-500 text-sm mt-1">{projectMaterialErrors.projectMaterialId}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Qty</label>
                <input
                  name="projectAssigned"
                  type="number"
                  value={newProjectMaterial.assigned}
                  onChange={(e) => setNewProjectMaterial({...newProjectMaterial, assigned: e.target.value})}
                  className={`${inputClass} ${projectMaterialErrors.projectAssigned ? 'border-red-500' : ''}`}
                  placeholder="100"
                />
                {projectMaterialErrors.projectAssigned && <p className="text-red-500 text-sm mt-1">{projectMaterialErrors.projectAssigned}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Used Qty</label>
                <input
                  name="projectUsed"
                  type="number"
                  value={newProjectMaterial.used}
                  onChange={(e) => setNewProjectMaterial({...newProjectMaterial, used: e.target.value})}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={newProjectMaterial.status}
                onChange={(e) => setNewProjectMaterial({...newProjectMaterial, status: e.target.value})}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="Not Used">Not Used</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </ModalMaterial>

        {/* ── Add Usage Log Modal ── */}
        <ModalMaterial
          isOpen={showUsageLog}
          onClose={() => setShowUsageLog(false)}
          title="Log Material Usage"
          footer={
            <>
              <button onClick={() => setShowUsageLog(false)} className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleAddUsageLog} className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                Log Usage
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                name="usageDate"
                type="date"
                value={newUsageLog.date}
                onChange={(e) => setNewUsageLog({...newUsageLog, date: e.target.value})}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Material</label>
              <select
                name="usageMaterialId"
                value={newUsageLog.materialId}
                onChange={(e) => setNewUsageLog({...newUsageLog, materialId: e.target.value})}
                className={`${inputClass} ${usageErrors.usageMaterialId ? 'border-red-500' : ''}`}
              >
                <option value="">Choose a material...</option>
                {getProjectMaterialsWithDetails(selectedProject).map(pm => (
                  <option key={pm.materialId} value={pm.materialId}>
                    {pm.material?.name} (Remaining: {pm.remaining} {pm.material?.unit})
                  </option>
                ))}
              </select>
              {usageErrors.usageMaterialId && <p className="text-red-500 text-sm mt-1">{usageErrors.usageMaterialId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity Used</label>
              <input
                name="usageQuantity"
                type="number"
                value={newUsageLog.quantity}
                onChange={(e) => setNewUsageLog({...newUsageLog, quantity: e.target.value})}
                className={`${inputClass} ${usageErrors.usageQuantity ? 'border-red-500' : ''}`}
                placeholder="20"
              />
              {usageErrors.usageQuantity && <p className="text-red-500 text-sm mt-1">{usageErrors.usageQuantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
              <textarea
                name="usageRemarks"
                value={newUsageLog.remarks}
                onChange={(e) => setNewUsageLog({...newUsageLog, remarks: e.target.value})}
                rows="3"
                className={inputClass}
                placeholder="e.g., For Living Room wall"
              />
            </div>
          </div>
        </ModalMaterial>

      </div>
    </div>
  );
};

export default MaterialManagement;
