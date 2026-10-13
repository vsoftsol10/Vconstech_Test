import React, { useState } from 'react';
import { getAuthToken, logout } from '../utils/auth';

export default function ForcedPasswordChange() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/forced-change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ newPassword })
      });
      const data = await response.json();
      if (!response.ok) return setError(data.error || 'Unable to change password.');
      logout();
      window.location.href = '/';
    } catch {
      setError('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="min-h-screen flex items-center justify-center bg-yellow-50 p-6"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
    <h1 className="mb-2 text-2xl font-bold">Set a new password</h1><p className="mb-6 text-sm text-gray-600">Your temporary password must be changed before you can access ERP.</p>
    {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <label className="block text-sm font-semibold">New password</label><input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mb-4 mt-1 w-full rounded border p-3" />
    <label className="block text-sm font-semibold">Confirm new password</label><input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mb-2 mt-1 w-full rounded border p-3" />
    <p className="mb-5 text-xs text-gray-600">Use 12+ characters including uppercase, lowercase, a number, and a symbol.</p>
    <button disabled={loading} className="w-full rounded bg-yellow-400 p-3 font-semibold text-black">{loading ? 'Saving…' : 'Change password'}</button>
  </form></main>;
}
