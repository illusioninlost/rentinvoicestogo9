import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token') || '';
  const [step, setStep] = useState(urlToken ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ token: urlToken, password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleRequest(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Request failed.'); return; }
      setStep('reset');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: form.token, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed.'); return; }
      setStep('done');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  if (step === 'done') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">RentInvoicesToGo</div>
          <div className="auth-success-icon">&#10003;</div>
          <h1 className="auth-title">Password reset</h1>
          <p className="auth-subtitle">Your password has been updated successfully.</p>
          <Link to="/login" className="btn btn-primary auth-submit" style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">RentInvoicesToGo</div>
        <h1 className="auth-title">Reset password</h1>

        {step === 'request' && (
          <>
            <p className="auth-subtitle">Enter your email and we'll send a reset link.</p>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleRequest} className="auth-form">
              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset email'}
              </button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <p className="auth-subtitle">Check your email for the reset code and enter it below.</p>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleReset} className="auth-form">
              <div className="form-group">
                <label>Reset token</label>
                <input
                  type="text"
                  name="token"
                  value={form.token}
                  onChange={handleFormChange}
                  placeholder="Paste your reset token"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>New password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleFormChange}
                    placeholder="At least 8 characters"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm new password</label>
                <div className="password-wrapper">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm"
                    value={form.confirm}
                    onChange={handleFormChange}
                    placeholder="Repeat your new password"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </>
        )}

        <p className="auth-switch">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
