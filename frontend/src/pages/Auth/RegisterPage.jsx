import React, { useState } from 'react';
import { authAPI } from '../api';

export default function RegisterPage({ onRegisterSuccess, onTogglePage }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState(['DRIVER', 'PASSENGER']); // default both
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRoleChange = (role) => {
    if (roles.includes(role)) {
      if (roles.length > 1) {
        setRoles(roles.filter(r => r !== role));
      }
    } else {
      setRoles([...roles, role]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authAPI.register(name, email, phone, password, roles);
      alert('Registration successful! Please log in.');
      onRegisterSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '85vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(90deg, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
            Create Account
          </h1>
          <p >
            Register to join the ride-share community network
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: 16 }}>
          <div>
            <label >Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Rahul Kumar"
            />
          </div>

          <div>
            <label >Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="rahul@gmail.com"
            />
          </div>

          <div>
            <label >Phone Number</label>
            <input 
              type="tel" 
              className="input-field" 
              required 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="9876543210"
            />
          </div>

          <div>
            <label >Password</label>
            <input 
              type="password" 
              className="input-field" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label >Select Roles</label>
            <div className="flex-row" style={{ gap: 16 }}>
              <label className="flex-row" style={{ gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={roles.includes('DRIVER')} 
                  onChange={() => handleRoleChange('DRIVER')} 
                />
                Driver
              </label>
              <label className="flex-row" style={{ gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={roles.includes('PASSENGER')} 
                  onChange={() => handleRoleChange('PASSENGER')} 
                />
                Passenger
              </label>
            </div>
          </div>

          {error && (
            <div >
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div>
          Already have an account?{' '}
          <span >
            Login Here
          </span>
        </div>
      </div>
    </div>
  );
}
