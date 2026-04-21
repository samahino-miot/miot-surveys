import React, { useState, useEffect } from 'react';
import { saveUser, deleteUser, User } from '../store';
import { useUsers } from '../hooks/useFirestore';
import { useAuth } from '../components/AuthProvider';
import { Plus, Edit2, Trash2, Shield, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function UserManagement() {
  const { users, loading } = useUsers();
  const { adminUser } = useAuth();
  const isSuperAdmin = adminUser?.role === 'superadmin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin' | 'editor' | 'viewer'>('admin');
  const [status, setStatus] = useState<'pending' | 'active'>('active');
  const [error, setError] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setStatus(user.status || 'active');
    } else {
      setEditingUser(null);
      setName('');
      setEmail('');
      setRole('admin');
      setStatus('active');
    }
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and email are required.');
      return;
    }

    if (status === 'active' && !isSuperAdmin) {
      setError('Only Super Admins can approve users.');
      return;
    }

    const newUser: User = {
      id: editingUser ? editingUser.id : `u_${Date.now()}`,
      name,
      email,
      role,
      status,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
    };

    try {
      await saveUser(newUser);
      showToast(editingUser ? 'User updated successfully!' : 'User created successfully!');
      closeModal();
    } catch (err) {
      setError('Failed to save user.');
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete);
        setUserToDelete(null);
        showToast('User deleted successfully!');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete user. You may not have permission.');
        setUserToDelete(null);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5 text-teal-400" />
          <p className="font-medium">{toastMessage}</p>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-4 p-1 text-slate-400 hover:text-white transition-colors rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete User</h3>
            </div>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this user? They will lose all access to the admin panel.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  placeholder="e.g., Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  placeholder="e.g., jane@miotinternational.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                >
                  <option value="superadmin">Super Admin (Full Access)</option>
                  <option value="admin">Admin (Manage Surveys & Users)</option>
                  <option value="editor">Surveyor (Manage Surveys Only)</option>
                  <option value="viewer">Viewer (View Only)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white font-medium hover:bg-teal-700 rounded-xl transition-colors"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">Manage admin accounts, roles, and access permissions.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors shrink-0"
        >
          <Plus className="h-5 w-5" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900">Name</th>
                <th className="hidden sm:table-cell px-6 py-4 text-sm font-semibold text-slate-900">Email</th>
                <th className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900">Role</th>
                <th className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="hidden md:table-cell px-6 py-4 text-sm font-semibold text-slate-900">Created</th>
                <th className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500 sm:hidden">{user.email}</p>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Shield className={`h-4 w-4 ${
                          user.role === 'superadmin' ? 'text-purple-500' : 
                          user.role === 'admin' ? 'text-blue-500' : 'text-emerald-500'
                        }`} />
                        <span className="capitalize text-sm font-medium text-slate-700">
                          {user.role === 'editor' ? 'Surveyor' : user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {user.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button 
                          onClick={() => openModal(user)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => setUserToDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
