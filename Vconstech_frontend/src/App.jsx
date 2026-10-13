// import React, { Suspense, lazy } from "react";
// import { Routes, Route } from "react-router-dom";
// import "./App.css";
// import { ToastContainer } from "./components/common/Toast";
// import AdminLayout from "./components/common/AdminLayout";
// // import Billing from './pages/Interiors/Billing';

// const Login = lazy(() => import("./components/Login"));
// const Dashboard = lazy(() => import("./pages/Interiors/Dashboard"));
// const ProjectManagement = lazy(() => import("./pages/Interiors/ProjectManagement"));
// const MaterialManagement = lazy(() => import("./pages/Interiors/MaterialManagement"));
// const FinancialManagement = lazy(() => import("./pages/Interiors/FinancialManagement"));
// const ContractManagement = lazy(() => import("./pages/Interiors/ContractManagement"));
// const FileManagement = lazy(() => import("./pages/Interiors/FileManagement"));
// const EmployeeLogin = lazy(() => import("./components/Employee/EmployeeLogin"));
// const EmployeeDashboard = lazy(() => import("./pages/Employee/EmployeeDashboard"));
// const AddEngineers = lazy(() => import("./pages/Interiors/AddEngineers"));
// const EmployeeFileManagement = lazy(() => import("./pages/Employee/EmployeeFileManagement"));
// const EmployeeMaterialManagement = lazy(() => import("./pages/Employee/EmployeeMaterialManagement"));
// const LabourManagement = lazy(() => import("./pages/Employee/LabourManagement"));
// const EmployeeProfile = lazy(() => import("./pages/Employee/EmployeeProfile"));
// const AdminLabourManagemet = lazy(() => import("./pages/Interiors/AdminLabourManagemet"));
// const CreateUser = lazy(() => import("./pages/SuperAdmin/CreateUser"));
// const SuperLogin = lazy(() => import("./pages/SuperAdmin/Superlogin"));
// const Billing = lazy(() => import("./pages/Interiors/Billing"));
// const Profile = lazy(() => import("./pages/Interiors/Profile"));
// const UsersPage = lazy(() => import("./pages/SuperAdmin/UsersPage"));
// const ForcedPasswordChange = lazy(() => import("./components/ForcedPasswordChange"));

// function App() {

//   return (
//     <>
//       <Suspense fallback={null}>
//         <Routes>
//           <Route path="/" element={<Login />} />
//           <Route path="/forced-change-password" element={<ForcedPasswordChange />} />
//           <Route element={<AdminLayout />}>
//             <Route path="/dashboard" element={<Dashboard/>} />
//             <Route path="/project" element={<ProjectManagement/>} />
//             <Route path="/project/:projectId" element={<ProjectManagement/>} />
//             <Route path="/material" element={<MaterialManagement/>} />
//             <Route path="/contract" element={<ContractManagement/>} />
//             <Route path="/financial" element={<FinancialManagement/>} />
//             <Route path="/financial-management/billing" element={<Billing />} />
//             <Route path="/financial-management" element={<FinancialManagement/>} />
//             <Route path="/file-managememt" element={<FileManagement/>} />
//             <Route path="/labor-managememt" element={<AdminLabourManagemet/>} />
//             <Route path="/add-engineers" element={<AddEngineers/>} />
//             <Route path="/profile" element={<Profile/>} />
//           </Route>
//           <Route path="/employee-login" element={<EmployeeLogin/>} />
//           <Route path="/employee-dashboard" element={<EmployeeDashboard/>} />
//           <Route path="/employee/file-management" element={<EmployeeFileManagement/>} />
//           <Route path="/employee/material-management" element={<EmployeeMaterialManagement/>} />
//           <Route path="/employee/labour-management" element={<LabourManagement/>} />
//           <Route path="/employee/profile" element={<EmployeeProfile/>} />
//           <Route path="/SuperAdmin/login" element={<SuperLogin/>} />
//           <Route path="/SuperAdmin/CreateUser" element={<CreateUser/>} />
//           <Route path="/SuperAdmin/users" element={<UsersPage />} />
//         </Routes>
//       </Suspense>
//       <ToastContainer />
//     </>
//   );
// }

// export default App;

import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "./components/common/Toast";
import AdminLayout from "./components/common/AdminLayout";
// import Billing from './pages/Interiors/Billing';

const Login = lazy(() => import("./components/Login"));
const Dashboard = lazy(() => import("./pages/Interiors/Dashboard"));
const ProjectManagement = lazy(() => import("./pages/Interiors/ProjectManagement"));
const MaterialManagement = lazy(() => import("./pages/Interiors/MaterialManagement"));
const FinancialManagement = lazy(() => import("./pages/Interiors/FinancialManagement"));
const ContractManagement = lazy(() => import("./pages/Interiors/ContractManagement"));
const FileManagement = lazy(() => import("./pages/Interiors/FileManagement"));
const EmployeeLogin = lazy(() => import("./components/Employee/EmployeeLogin"));
const EmployeeDashboard = lazy(() => import("./pages/Employee/EmployeeDashboard"));
const AddEngineers = lazy(() => import("./pages/Interiors/AddEngineers"));
const EmployeeFileManagement = lazy(() => import("./pages/Employee/EmployeeFileManagement"));
const EmployeeMaterialManagement = lazy(() => import("./pages/Employee/EmployeeMaterialManagement"));
const LabourManagement = lazy(() => import("./pages/Employee/LabourManagement"));
const LabourView = lazy(() => import("./pages/Employee/LabourView"));
const EmployeeProfile = lazy(() => import("./pages/Employee/EmployeeProfile"));
const AdminLabourManagemet = lazy(() => import("./pages/Interiors/AdminLabourManagemet"));
const CreateUser = lazy(() => import("./pages/SuperAdmin/CreateUser"));
const SuperLogin = lazy(() => import("./pages/SuperAdmin/Superlogin"));
const Billing = lazy(() => import("./pages/Interiors/Billing"));
const Profile = lazy(() => import("./pages/Interiors/Profile"));
const UsersPage = lazy(() => import("./pages/SuperAdmin/UsersPage"));
const ForcedPasswordChange = lazy(() => import("./components/ForcedPasswordChange"));

function App() {

  return (
    <>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forced-change-password" element={<ForcedPasswordChange />} />
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard/>} />
            <Route path="/project" element={<ProjectManagement/>} />
            <Route path="/project/:projectId" element={<ProjectManagement/>} />
            <Route path="/material" element={<MaterialManagement/>} />
            <Route path="/contract" element={<ContractManagement/>} />
            <Route path="/financial" element={<FinancialManagement/>} />
            <Route path="/financial-management/billing" element={<Billing />} />
            <Route path="/financial-management" element={<FinancialManagement/>} />
            <Route path="/file-managememt" element={<FileManagement/>} />
            <Route path="/labor-managememt" element={<AdminLabourManagemet/>} />
            <Route path="/labor-management/labour-view/:labourId" element={<LabourView admin />} />
            <Route path="/add-engineers" element={<AddEngineers/>} />
            <Route path="/profile" element={<Profile/>} />
          </Route>
          <Route path="/employee-login" element={<EmployeeLogin/>} />
          <Route path="/employee-dashboard" element={<EmployeeDashboard/>} />
          <Route path="/employee/file-management" element={<EmployeeFileManagement/>} />
          <Route path="/employee/material-management" element={<EmployeeMaterialManagement/>} />
          <Route path="/employee/labour-management" element={<LabourManagement/>} />
          <Route path="/employee/labour-view/:labourId" element={<LabourView/>} />
          <Route path="/employee/profile" element={<EmployeeProfile/>} />
          <Route path="/SuperAdmin/login" element={<SuperLogin/>} />
          <Route path="/SuperAdmin/CreateUser" element={<CreateUser/>} />
          <Route path="/SuperAdmin/users" element={<UsersPage />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </>
  );
}

export default App;
