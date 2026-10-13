import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SidePannel from './SidePannel';

const AdminLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <nav className="fixed top-0 left-0 right-0 z-50 h-16">
      <Navbar />
    </nav>
    <aside className="fixed left-0 top-0 bottom-0 w-16 md:w-64 z-40 overflow-y-auto">
      <SidePannel />
    </aside>
    <Outlet />
  </div>
);

export default AdminLayout;
