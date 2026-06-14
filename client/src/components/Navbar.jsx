import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">
            设备借用系统
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/equipment" className="hover:text-blue-200">
              设备列表
            </Link>
            <Link to="/bookings" className="hover:text-blue-200">
              我的预约
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="hover:text-blue-200">
                管理后台
              </Link>
            )}
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm">{user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-blue-500 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
