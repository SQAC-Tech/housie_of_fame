'use client';

import { useState, useEffect, useCallback } from 'react';

interface TeamMember {
  name: string;
  email: string;
  phone: string;
}

interface Team {
  _id: string;
  teamId: string;
  teamName: string;
  teamLeader: TeamMember;
  members: TeamMember[];
  teamSize: number;
  amountPaid: number;
  paymentId: string;
  orderId: string;
  paymentStatus: 'PAID' | 'FAILED' | 'REFUNDED' | 'PENDING';
  attendance?: {
    present: boolean;
    checkedAt: string;
  };
  college: string;
  createdAt: string;
  isWinner?: boolean;
  winnerTitle?: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [savedPassword, setSavedPassword] = useState('');

  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generatingCerts, setGeneratingCerts] = useState(false);

  async function handleGenerateCerts(type: 'participant' | 'winner') {
    setGeneratingCerts(true);
    try {
      const res = await fetch(`/api/admin/certificates?type=${type}`, {
        headers: { Authorization: `Bearer ${savedPassword}` },
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to generate certificates');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_certificates_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Certificate generation failed: ${err.message}`);
    } finally {
      setGeneratingCerts(false);
    }
  }

  const fetchTeams = useCallback(async (pw: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/teams', {
        headers: { Authorization: `Bearer ${pw}` },
      });
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleAuth() {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setSavedPassword(password);
        setAuthed(true);
        fetchTeams(password);
      } else {
        setAuthError('Incorrect password. Try again.');
      }
    } catch {
      setAuthError('Server error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    if (authed && savedPassword) {
      const interval = setInterval(() => fetchTeams(savedPassword), 30000);
      return () => clearInterval(interval);
    }
  }, [authed, savedPassword, fetchTeams]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export', {
        headers: { Authorization: `Bearer ${savedPassword}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `housie-teams-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  }

  const filtered = teams.filter(
    (t) =>
      t.teamName.toLowerCase().includes(search.toLowerCase()) ||
      t.teamId.toLowerCase().includes(search.toLowerCase()) ||
      t.teamLeader.name.toLowerCase().includes(search.toLowerCase()) ||
      t.teamLeader.email.toLowerCase().includes(search.toLowerCase()) ||
      t.college.toLowerCase().includes(search.toLowerCase())
  );

  const totalParticipants = teams.reduce((s, t) => s + t.teamSize, 0);
  const totalRevenue = teams.reduce((s, t) => s + t.amountPaid, 0);

  const stats = {
    totalTeams: teams.length,
    participants: teams.reduce((acc, t) => acc + t.teamSize, 0),
    revenue: teams.reduce((acc, t) => acc + (t.paymentStatus === 'PAID' ? t.amountPaid : 0), 0),
    checkedIn: teams.filter(t => t.attendance?.present).length,
  };

  const statusColor = (s: string) =>
    s === 'PAID' ? '#22c55e' : s === 'FAILED' ? '#ef4444' : s === 'PENDING' ? '#f59e0b' : '#888';

  // ── Password gate ──
  if (!authed) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          className="glass-card"
          style={{ width: '100%', maxWidth: 400, padding: 40, textAlign: 'center' }}
        >
          <p style={{ fontSize: 48, marginBottom: 16 }}>🔐</p>
          <h1
            className="font-display"
            style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}
          >
            Admin Access
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            Housie of Fame — SQAC Organizer Panel
          </p>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${authError ? '#ef4444' : 'rgba(255,215,0,0.2)'}`,
              borderRadius: 8,
              padding: '12px 16px',
              color: 'var(--text-primary)',
              fontSize: 16,
              outline: 'none',
              marginBottom: 8,
              fontFamily: 'Inter, sans-serif',
            }}
            id="admin-password-input"
          />
          {authError && (
            <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{authError}</p>
          )}
          <button
            className="btn-red"
            style={{ width: '100%', padding: '14px', fontSize: 16, marginTop: 8 }}
            onClick={handleAuth}
            disabled={authLoading}
            id="admin-login-btn"
          >
            <span>{authLoading ? 'Verifying…' : 'Enter Panel'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '32px 24px' }}>
      {/* Header */}
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            className="font-display"
            style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}
          >
            <span className="text-gold-gradient">Housie of Fame</span> — Admin
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Live dashboard • Auto-refreshes every 30s
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleGenerateCerts('participant')}
            disabled={generatingCerts}
            style={{ padding: '10px 20px', fontSize: 14, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: 8, cursor: generatingCerts ? 'wait' : 'pointer', fontWeight: 600 }}
          >
            {generatingCerts ? 'Generating…' : '📜 Participant Certs'}
          </button>
          <button
            onClick={() => handleGenerateCerts('winner')}
            disabled={generatingCerts}
            style={{ padding: '10px 20px', fontSize: 14, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 8, cursor: generatingCerts ? 'wait' : 'pointer', fontWeight: 600 }}
          >
            {generatingCerts ? 'Generating…' : '🏆 Winner Certs'}
          </button>
          <button
            onClick={() => fetchTeams(savedPassword)}
            className="btn-gold"
            style={{ padding: '10px 20px', fontSize: 14 }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleExport}
            className="btn-red"
            style={{ padding: '10px 20px', fontSize: 14 }}
            disabled={exporting}
            id="export-csv-btn"
          >
            <span>{exporting ? 'Exporting…' : '📥 Export CSV'}</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
          {[
            { label: 'Total Teams', value: stats.totalTeams, icon: '🏆', color: '#FFD700' },
            { label: 'Total Participants', value: stats.participants, icon: '👥', color: '#a855f7' },
            { label: 'Total Revenue', value: `₹${stats.revenue}`, icon: '💰', color: '#22c55e' },
            { label: 'Checked In', value: stats.checkedIn, icon: '✅', color: '#3b82f6' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card"
              style={{ padding: 28, transition: 'transform 0.3s' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{stat.icon}</span>
              </div>
              <p
                className="font-display"
                style={{ fontSize: 40, fontWeight: 900, color: stat.color, lineHeight: 1, marginBottom: 6 }}
              >
                {stat.value}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, letterSpacing: 0.5 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Search team, leader, email, college…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 260,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: 8,
              padding: '11px 16px',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
            id="admin-search-input"
          />
          <p style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
            Showing {filtered.length} of {teams.length} teams
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: '3px solid rgba(255,215,0,0.2)',
                borderTop: '3px solid var(--gold)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'var(--text-muted)' }}>Loading teams…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
            <p style={{ color: 'var(--text-muted)' }}>
              {teams.length === 0 ? 'No registrations yet.' : 'No teams match your search.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'rgba(26,26,26,0.8)',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid rgba(255,215,0,0.1)',
                minWidth: 900,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,0,0,0.4), rgba(26,26,26,0.9))',
                    borderBottom: '1px solid rgba(255,215,0,0.2)',
                  }}
                >
                  {['Team ID', 'Team Name', 'Leader', 'Members', 'Attendance', 'Winner', 'College', 'Amount', 'Status', 'Payment ID', 'Registered'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '14px 16px',
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--gold)',
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => (
                  <tr
                    key={t._id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,215,0,0.04)')}
                    onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')
                    }
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: 14,
                          color: 'var(--gold)',
                          background: 'rgba(255,215,0,0.08)',
                          padding: '4px 10px',
                          borderRadius: 6,
                        }}
                      >
                        {t.teamId}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                      {t.teamName}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {t.teamLeader.name}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.teamLeader.email}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.teamLeader.phone}</p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {t.members.map((m, mi) => (
                        <p key={mi} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                          {m.name}
                        </p>
                      ))}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {t.attendance?.present ? (
                        <span style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: 12, fontWeight: 'bold' }}>✅ Present</span>
                      ) : (
                        <span style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(136, 136, 136, 0.1)', color: '#888', fontSize: 12, fontWeight: 'bold' }}>❌ Absent</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={t.isWinner || false}
                          onChange={async (e) => {
                            const isWinner = e.target.checked;
                            const title = isWinner ? prompt('Enter Winner Title (e.g., 1st Place):', 'Winner') : '';
                            if (isWinner && title === null) return; // cancelled

                            try {
                              const res = await fetch(`/api/admin/teams/${t._id}/winner`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${savedPassword}`
                                },
                                body: JSON.stringify({ isWinner, winnerTitle: title })
                              });
                              if (res.ok) fetchTeams(savedPassword);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 600, color: t.isWinner ? '#ef4444' : 'var(--text-muted)' }}>
                          {t.isWinner ? (t.winnerTitle || 'Winner') : 'Make Winner'}
                        </span>
                      </label>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 140 }}>
                      {t.college}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}
                      >
                        ₹{t.amountPaid}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: statusColor(t.paymentStatus),
                          background: `${statusColor(t.paymentStatus)}18`,
                          border: `1px solid ${statusColor(t.paymentStatus)}40`,
                          borderRadius: 999,
                          padding: '4px 10px',
                          letterSpacing: 1,
                        }}
                      >
                        {t.paymentStatus}
                      </span>
                      {t.paymentStatus === 'PENDING' && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Verify payment for team ${t.teamId}?`)) return;
                            try {
                              const res = await fetch('/api/admin/verify-payment', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${savedPassword}`,
                                },
                                body: JSON.stringify({ teamId: t.teamId }),
                              });
                              if (res.ok) fetchTeams(savedPassword);
                              else alert('Verification failed');
                            } catch (err) {
                              console.error(err);
                              alert('Error verifying payment');
                            }
                          }}
                          style={{
                            marginLeft: 8,
                            padding: '4px 8px',
                            fontSize: 10,
                            background: 'var(--gold)',
                            color: '#000',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                        >
                          Verify
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.paymentId}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(t.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div >
  );
}
