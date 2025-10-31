
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

import EditUserModal from '@/components/admin/EditUserModal';

// Define the User type based on your Prisma schema
interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  isAdmin: boolean;
}

export default function AdminPage() {
  const [referralCode, setReferralCode] = useState('');
  const [currentCode, setCurrentCode] = useState('');
  const [isReferralSystemEnabled, setIsReferralSystemEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin user form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [adminCreationSuccess, setAdminCreationSuccess] = useState('');
  const [adminCreationError, setAdminCreationError] = useState('');

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [userError, setUserError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    setUserError('');
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setUserError('Failed to fetch users.');
      }
    } catch (err) {
      setUserError('An error occurred while fetching users.');
    }
  }, []);

  useEffect(() => {
    async function loadAdminData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: userError } = await supabase
          .from('User')
          .select('isAdmin')
          .eq('id', user.id)
          .single();

        if (userError) {
          setError('Error fetching user data.');
        } else if (profile) {
          setIsAdmin(profile.isAdmin);
          if(profile.isAdmin){
            try {
              const response = await fetch('/api/admin/settings');
              if (response.ok) {
                const data = await response.json();
                setCurrentCode(data.referralCode || '');
                setIsReferralSystemEnabled(data.isReferralSystemEnabled || false);
              } else {
                setError('Failed to fetch settings.');
              }
            } catch (err) {
              setError('An error occurred while fetching the settings.');
            }
            fetchUsers();
          }
        }
      }
      setLoading(false);
    }

    loadAdminData();
  }, [supabase, fetchUsers]);

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'referralCode', value: referralCode }),
      });
      if (response.ok) {
        setSuccess('Referral code updated successfully!');
        setCurrentCode(referralCode);
        setReferralCode('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update referral code.');
      }
    } catch (err) {
      setError('An error occurred while updating the referral code.');
    }
  };
  
  const handleToggleReferralSystem = async () => {
    setError('');
    setSuccess('');
    try {
        const newStatus = !isReferralSystemEnabled;
        const response = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'isReferralSystemEnabled', value: newStatus }),
        });
        if (response.ok) {
            setSuccess(`Referral system ${newStatus ? 'enabled' : 'disabled'} successfully!`);
            setIsReferralSystemEnabled(newStatus);
        } else {
            const data = await response.json();
            setError(data.error || 'Failed to update setting.');
        }
    } catch (err) {
        setError('An error occurred while updating the setting.');
    }
};

  const handleAdminCreationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreationError('');
    setAdminCreationSuccess('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          fullName: newAdminFullName,
          username: newAdminUsername,
        }),
      });
      if (response.ok) {
        setAdminCreationSuccess('Admin user created successfully!');
        fetchUsers();
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminFullName('');
        setNewAdminUsername('');
      } else {
        const data = await response.json();
        setAdminCreationError(data.error || 'Failed to create admin user.');
      }
    } catch (err) {
      setAdminCreationError('An error occurred while creating the admin user.');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUserError('');
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchUsers(); // Refresh users after deletion
        } else {
          const data = await response.json();
          setUserError(data.error || 'Failed to delete user.');
        }
      } catch (err) {
        setUserError('An error occurred while deleting the user.');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-red-500">Access Denied</h1>
      <p>You do not have permission to view this page.</p>
    </div>
  );

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="mb-8 p-4 border rounded shadow">
              <h2 className="text-xl font-semibold mb-2">Referral System Management</h2>
              {success && <p className="text-green-500 mb-4">{success}</p>}
              <div className="flex items-center mb-4">
                <input type="checkbox" id="referral-system-toggle" checked={isReferralSystemEnabled} onChange={handleToggleReferralSystem} className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="referral-system-toggle">Enable Referral System</label>
              </div>
              <p className="mb-2">Current code: <strong>{currentCode || 'Not set'}</strong></p>
              <form onSubmit={handleReferralSubmit} className="flex items-center">
                <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2" placeholder="New code" />
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Save</button>
              </form>
            </div>

            <div className="p-4 border rounded shadow">
              <h2 className="text-xl font-semibold mb-2">Create New Admin User</h2>
              {adminCreationError && <p className="text-red-500 mb-4">{adminCreationError}</p>}
              {adminCreationSuccess && <p className="text-green-500 mb-4">{adminCreationSuccess}</p>}
              <form onSubmit={handleAdminCreationSubmit}>
                 <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input id="email" type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input id="password" type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" required/>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">
                        Full Name
                    </label>
                    <input id="fullName" type="text" value={newAdminFullName} onChange={(e) => setNewAdminFullName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                        Username
                    </label>
                    <input id="username" type="text" value={newAdminUsername} onChange={(e) => setNewAdminUsername(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Create Admin</button>
              </form>
            </div>
          </div>

          <div className="p-4 border rounded shadow">
            <h2 className="text-xl font-semibold mb-2">User Management</h2>
            {userError && <p className="text-red-500 mb-4">{userError}</p>}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.isAdmin ? 'Yes' : 'No'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <EditUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={selectedUser} onUserUpdate={() => { fetchUsers(); setIsModalOpen(false); }} />
    </>
  );
}
