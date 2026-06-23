import React, { useState } from 'react';
import { authAPI } from '../api';

export default function LoginPage({ onLoginSuccess, onTogglePage }) {
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await authAPI.login(email, password);
      localStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 >
          Login
          </h1>
          <p>
            Enter details to access the ride-matching system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: 18 }}>
          <div>
            <label>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
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
            />
          </div>

          {error && (
            <div>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div >
          Don't have an account?{' '}
          <span  onClick={onTogglePage}>
            Register Here
          </span>
        </div>
      </div>
    </div>
  );
}
