'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';

interface Member {
  name: string;
  email: string;       // personal email
  collegeEmail: string;
  regNo: string;
  phone: string;
}

interface FormData {
  teamName: string;
  teamLeader: Member;
  teamSize: number;
  members: Member[];
}

const emptyMember = (): Member => ({
  name: '',
  email: '',
  collegeEmail: '',
  regNo: '',
  phone: '',
});

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    teamName: '',
    teamLeader: emptyMember(),
    teamSize: 2,
    members: [emptyMember()],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'qr-payment' | 'submitting'>('form');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    const extraNeeded = form.teamSize - 1;
    setForm((prev) => {
      const current = [...prev.members];
      while (current.length < extraNeeded) current.push(emptyMember());
      return { ...prev, members: current.slice(0, extraNeeded) };
    });
  }, [form.teamSize]);

  const totalAmount = form.teamSize * 50;

  function validateEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }
  function validatePhone(p: string) {
    return /^[6-9]\d{9}$/.test(p.replace(/\s/g, ''));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.teamName.trim()) errs.teamName = 'Team name is required.';

    // Leader validation
    if (!form.teamLeader.name.trim()) errs['leader.name'] = 'Leader name is required.';
    if (!validatePhone(form.teamLeader.phone)) errs['leader.phone'] = 'Enter a valid 10-digit mobile number.';
    if (!validateEmail(form.teamLeader.email)) errs['leader.email'] = 'Enter a valid email.';
    if (!validateEmail(form.teamLeader.collegeEmail)) errs['leader.collegeEmail'] = 'Enter a valid college email.';
    if (!form.teamLeader.regNo.trim()) errs['leader.regNo'] = 'Registration number is required.';

    form.members.forEach((m, i) => {
      if (!m.name.trim()) errs[`m${i}.name`] = 'Member name is required.';
      if (!validatePhone(m.phone)) errs[`m${i}.phone`] = 'Enter a valid 10-digit mobile number.';
      if (!validateEmail(m.email)) errs[`m${i}.email`] = 'Enter a valid email.';
      if (!validateEmail(m.collegeEmail)) errs[`m${i}.collegeEmail`] = 'Enter a valid college email.';
      if (!m.regNo.trim()) errs[`m${i}.regNo`] = 'Registration number is required.';
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setStep('qr-payment');
  }

  async function handleFinalSubmit() {
    if (!transactionId.trim()) {
      setErrors({ transactionId: 'Transaction ID is required.' });
      return;
    }
    setLoading(true);
    setStep('submitting');

    try {
      const res = await fetch('/api/register-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamData: {
            teamName: form.teamName,
            teamLeader: form.teamLeader,
            members: form.members,
            teamSize: form.teamSize,
          },
          transactionId: transactionId.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to submit registration.');
        setLoading(false);
        setStep('qr-payment');
        return;
      }

      sessionStorage.setItem('housie_registration', JSON.stringify({
        success: true,
        teamId: data.teamId,
        teamName: data.teamName,
        members: [form.teamLeader, ...form.members],
        amountPaid: totalAmount,
      }));
      router.push('/success');
    } catch (err) {
      console.error('Submission Error:', err);
      alert('Something went wrong. Please try again.');
      setLoading(false);
      setStep('qr-payment');
    }
  }

  const inp = (field: string) => ({
    width: '100%' as const,
    background: 'rgba(15,0,0,0.4)',
    border: `1px solid ${errors[field] ? '#ef4444' : 'rgba(255,215,0,0.15)'}`,
    borderRadius: 8,
    padding: '11px 14px',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'all 0.3s ease',
  });

  const lbl = {
    fontSize: 12,
    fontWeight: 500 as const,
    color: 'var(--text-muted)',
    marginBottom: 5,
    display: 'block' as const,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  };
  const err = { color: '#ef4444', fontSize: 11, marginTop: 3 };

  function focusIn(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = 'var(--gold)';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,215,0,0.08)';
  }
  function focusOut(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, field: string) {
    e.currentTarget.style.borderColor = errors[field] ? '#ef4444' : 'rgba(255,215,0,0.15)';
    e.currentTarget.style.boxShadow = 'none';
  }

  // Overlay during submission
  if (step === 'submitting') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
        <div style={{ width: 60, height: 60, border: '4px solid rgba(255,215,0,0.15)', borderTop: '4px solid var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="font-display" style={{ fontSize: 22, color: 'var(--gold)' }}>
          Submitting Registration…
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Please do not close this tab.</p>
      </div>
    );
  }

  // QR Payment Step
  if (step === 'qr-payment') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="glass-card" style={{ maxWidth: 450, width: '100%', padding: '40px 30px', textAlign: 'center', position: 'relative' }}>
          <button onClick={() => setStep('form')} style={{ position: 'absolute', top: 20, left: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>← Back</button>

          <h2 className="font-display" style={{ fontSize: 28, color: 'var(--gold)', marginBottom: 10 }}>Scan & Pay</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 30 }}>Complete the payment to register your team.</p>

          <div style={{ background: '#fff', padding: 10, borderRadius: 12, display: 'inline-block', marginBottom: 30, boxShadow: '0 0 30px rgba(255,215,0,0.2)' }}>
            <img src="/payment-qr.png" alt="Payment QR Code" style={{ width: 220, height: 220, display: 'block' }} />
          </div>

          <div style={{ textAlign: 'left', marginBottom: 30 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, marginBottom: 15, textAlign: 'center' }}>Total Amount: <span style={{ color: 'var(--gold)', fontSize: 20 }}>₹{totalAmount}</span></p>

            <label style={lbl}>Transaction ID / UTR *</label>
            <input
              style={inp('transactionId')}
              placeholder="Enter 12-digit UTR number"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              onFocus={focusIn}
              onBlur={(e) => focusOut(e, 'transactionId')}
            />
            {errors.transactionId && <p style={err}>{errors.transactionId}</p>}
          </div>

          <button
            className="btn-red"
            style={{ width: '100%', padding: '15px' }}
            onClick={handleFinalSubmit}
            disabled={loading}
          >
            <span>{loading ? 'Submitting…' : '✅ Submit Registration'}</span>
          </button>

          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 15 }}>
            Your registration will be verified by the admin. You will receive a confirmation email once approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #1f0404 0%, var(--bg-dark) 40%, #150000 100%)', position: 'relative', overflowX: 'hidden' }}>

      {/* Red carpet background decoration */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Top left orb */}
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 'clamp(300px, 60vw, 600px)', height: 'clamp(300px, 60vw, 600px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,0,0,0.15), transparent 70%)', filter: 'blur(70px)' }} />
        {/* Bottom right orb */}
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 'clamp(300px, 55vw, 550px)', height: 'clamp(300px, 55vw, 550px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.06), transparent 70%)', filter: 'blur(80px)' }} />
        {/* Center orb */}
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 'clamp(400px, 80vw, 800px)', height: 'clamp(400px, 80vw, 800px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,0,0.08), transparent 60%)', filter: 'blur(100px)' }} />
        {/* Red carpet strip — left */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, transparent, #8B0000 20%, #8B0000 80%, transparent)' }} />
        {/* Red carpet strip — right */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, transparent, #8B0000 20%, #8B0000 80%, transparent)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '32px 16px 60px' }}>
        {/* Header */}
        <div style={{ maxWidth: 720, margin: '0 auto 36px', textAlign: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, marginBottom: 28 }}>
            ← Back to Home
          </Link>

          {/* Red carpet ribbon accent */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3))' }} />
            <span style={{ background: 'linear-gradient(135deg, #8B0000, #4a0000)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: 999, padding: '6px 20px', fontSize: 11, fontWeight: 600, color: 'var(--gold)', letterSpacing: 2.5, textTransform: 'uppercase' as const }}>
              🎬 VIP Registration
            </span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,215,0,0.3), transparent)' }} />
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(26px, 5vw, 48px)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10 }}>
            Register Your <span className="text-gold-gradient">Squad</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Housie of Fame &nbsp;•&nbsp; SQAC
          </p>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Team Identity ── */}
          <SectionCard icon="🏷️" title="Team Identity" accentColor="var(--gold)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Team Name *</label>
                <input
                  style={inp('teamName')}
                  placeholder="Team Name"
                  value={form.teamName}
                  onChange={(e) => setForm((p) => ({ ...p, teamName: e.target.value }))}
                  onFocus={focusIn}
                  onBlur={(e) => focusOut(e, 'teamName')}
                />
                {errors.teamName && <p style={err}>{errors.teamName}</p>}
              </div>
              <div>
                <label style={lbl}>Team Size *</label>
                <select
                  style={{ ...inp('teamSize'), cursor: 'pointer' }}
                  value={form.teamSize}
                  onChange={(e) => setForm((p) => ({ ...p, teamSize: Number(e.target.value) }))}
                  onFocus={focusIn}
                  onBlur={(e) => focusOut(e, 'teamSize')}
                >
                  <option value={2}>2 Members — ₹100</option>
                  <option value={3}>3 Members — ₹150</option>
                </select>
              </div>
            </div>
          </SectionCard>

          {/* ── Team Leader ── */}
          <SectionCard icon="👑" title="Team Leader" accentColor="var(--gold)" isLeader>
            <MemberFields
              prefix="leader"
              member={form.teamLeader}
              memberLabel="Leader"
              errors={errors}
              inp={inp} lbl={lbl} err={err} focusIn={focusIn}
              focusOut={focusOut}
              onChange={(updated) => setForm((p) => ({ ...p, teamLeader: updated }))}
            />
          </SectionCard>

          {/* ── Extra Members ── */}
          {form.members.map((member, i) => (
            <SectionCard key={i} icon="🎭" title={`Member ${i + 2}`} accentColor="rgba(255,255,255,0.7)">
              <MemberFields
                prefix={`m${i}`}
                member={member}
                memberLabel={`Member ${i + 2}`}
                errors={errors}
                inp={inp} lbl={lbl} err={err} focusIn={focusIn}
                focusOut={focusOut}
                onChange={(updated) => {
                  const next = [...form.members];
                  next[i] = updated;
                  setForm((p) => ({ ...p, members: next }));
                }}
              />
            </SectionCard>
          ))}

          {/* ── Payment Summary ── */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(80,0,0,0.3) 0%, rgba(20,5,5,0.95) 100%)',
              border: '1px solid rgba(255,215,0,0.4)',
              borderRadius: 16,
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px -15px rgba(139,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* Decorative corner */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle at top right, rgba(255,215,0,0.08), transparent)', borderRadius: '0 16px 0 0' }} />

            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gold)', marginBottom: 18, letterSpacing: 0.5 }}>
              💳 Admission Summary
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 6 }}>
                  {form.teamSize} member{form.teamSize > 1 ? 's' : ''} × ₹50
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#22c55e' }}>✓</span> Secure QR Payment
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, letterSpacing: 1 }}>TOTAL</p>
                <p className="font-display" style={{ fontSize: 44, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>
                  ₹{totalAmount}
                </p>
              </div>
            </div>

            {/* Gold divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)', marginBottom: 20 }} />

            <button
              className="btn-red"
              style={{ width: '100%', padding: '15px', fontSize: 17, borderRadius: 10, letterSpacing: 0.5 }}
              onClick={handleSubmit}
              disabled={loading}
              id="proceed-to-payment-btn"
            >
              <span>{loading ? 'Processing…' : `🎟️  Proceed to Payment — ₹${totalAmount}`}</span>
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', marginTop: 10 }}>
              By proceeding, you agree to the event rules. All registrations are final.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable section card ───────────────────────────────────────────────────
function SectionCard({
  icon, title, accentColor, isLeader, children,
}: {
  icon: string; title: string; accentColor: string; isLeader?: boolean; children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(40,10,10,0.6), rgba(15,5,5,0.85))',
        border: `1px solid ${isLeader ? 'rgba(255,215,0,0.3)' : 'rgba(139,0,0,0.4)'}`,
        borderRadius: 14,
        padding: 26,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Subtle left accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: isLeader ? 'linear-gradient(180deg, var(--gold), #8B0000)' : 'linear-gradient(180deg, rgba(139,0,0,0.5), transparent)' }} />
      <h2 style={{ fontSize: 16, fontWeight: 700, color: accentColor, marginBottom: 20, letterSpacing: 0.3, paddingLeft: 8 }}>
        {icon} {title}
      </h2>
      <div style={{ paddingLeft: 8 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Reusable member fields ──────────────────────────────────────────────────
function MemberFields({
  prefix, member, memberLabel, errors, inp, lbl, err, focusIn, focusOut, onChange,
}: {
  prefix: string;
  member: { name: string; email: string; collegeEmail: string; regNo: string; phone: string };
  memberLabel: string;
  errors: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inp: (f: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lbl: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any;
  focusIn: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  focusOut: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, f: string) => void;
  onChange: (updated: typeof member) => void;
}) {
  const u = (field: keyof typeof member) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...member, [field]: field === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {/* Row 1: Name + Phone */}
      <div>
        <label style={lbl}>Full Name *</label>
        <input
          style={inp(`${prefix}.name`)}
          placeholder={`${memberLabel} Name`}
          value={member.name}
          onChange={u('name')}
          onFocus={focusIn}
          onBlur={(e) => focusOut(e, `${prefix}.name`)}
        />
        {errors[`${prefix}.name`] && <p style={err}>{errors[`${prefix}.name`]}</p>}
      </div>
      <div>
        <label style={lbl}>Mobile Number *</label>
        <input
          style={inp(`${prefix}.phone`)}
          placeholder="9876543210"
          value={member.phone}
          maxLength={10}
          onChange={u('phone')}
          onFocus={focusIn}
          onBlur={(e) => focusOut(e, `${prefix}.phone`)}
        />
        {errors[`${prefix}.phone`] && <p style={err}>{errors[`${prefix}.phone`]}</p>}
      </div>

      {/* Row 2: Personal Email — full width */}
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={lbl}>Personal Email *</label>
        <input
          style={inp(`${prefix}.email`)}
          placeholder={prefix === 'leader' ? 'leader@gmail.com' : `member${prefix.replace('m', '')}@gmail.com`}
          type="email"
          value={member.email}
          onChange={u('email')}
          onFocus={focusIn}
          onBlur={(e) => focusOut(e, `${prefix}.email`)}
        />
        {errors[`${prefix}.email`] && <p style={err}>{errors[`${prefix}.email`]}</p>}
      </div>

      {/* Row 3: College Email + Reg No */}
      <div>
        <label style={lbl}>College Email ID *</label>
        <input
          style={inp(`${prefix}.collegeEmail`)}
          placeholder="ab1234@srmist.edu.in"
          type="email"
          value={member.collegeEmail}
          onChange={u('collegeEmail')}
          onFocus={focusIn}
          onBlur={(e) => focusOut(e, `${prefix}.collegeEmail`)}
        />
        {errors[`${prefix}.collegeEmail`] && <p style={err}>{errors[`${prefix}.collegeEmail`]}</p>}
      </div>
      <div>
        <label style={lbl}>Registration No. *</label>
        <input
          style={inp(`${prefix}.regNo`)}
          placeholder="RA2XXXXXXXXX"
          value={member.regNo}
          onChange={u('regNo')}
          onFocus={focusIn}
          onBlur={(e) => focusOut(e, `${prefix}.regNo`)}
        />
        {errors[`${prefix}.regNo`] && <p style={err}>{errors[`${prefix}.regNo`]}</p>}
      </div>
    </div>
  );
}
