// src/popup/components/AuthPanel.tsx
import React, { useState } from 'react';
import { BackendService } from '../../utils/backendConfig';

interface AuthPanelProps {
  backendService: BackendService;
  onAuthChange: (isAuthenticated: boolean) => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({ backendService, onAuthChange }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let success: boolean;
      
      if (isLogin) {
        success = await backendService.login(email, password);
        if (success) {
          setSuccess('Successfully logged in!');
          onAuthChange(true);
        } else {
          setError('Invalid email or password');
        }
      } else {
        success = await backendService.register(email, password, name);
        if (success) {
          setSuccess('Account created successfully!');
          onAuthChange(true);
        } else {
          setError('Registration failed. Email may already be in use.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await backendService.logout();
    onAuthChange(false);
    setEmail('');
    setPassword('');
    setName('');
    setSuccess('Successfully logged out');
  };

  if (backendService.isAuthenticated()) {
    return (
      <div className="auth-card">
        <h3>🔐 Account Status</h3>
        <div className="auth-status">
          <div className="auth-success">
            <span className="auth-emoji">✅</span>
            <span className="auth-message">You are signed in</span>
          </div>
          <button 
            className="btn btn-secondary"
            onClick={handleLogout}
            disabled={loading}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h3>🔐 {isLogin ? 'Sign In' : 'Create Account'}</h3>
      
      {error && (
        <div className="auth-error">
          <span className="error-emoji">❌</span>
          <span className="error-message">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="auth-success">
          <span className="success-emoji">✅</span>
          <span className="success-message">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        {!isLogin && (
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required={!isLogin}
              disabled={loading}
            />
          </div>
        )}
        
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="auth-switch">
        <button
          className="btn-link"
          onClick={() => setIsLogin(!isLogin)}
          disabled={loading}
        >
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </div>

      <div className="auth-benefits">
        <h4>✨ Cloud Sync Benefits</h4>
        <ul>
          <li>📊 Access your data from any device</li>
          <li>🔒 Secure cloud backup</li>
          <li>📈 Advanced analytics</li>
          <li>🔄 Cross-device synchronization</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthPanel;