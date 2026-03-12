'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface RegistrationData {
  teamId: string;
  teamName: string;
  members: { name: string; email: string; phone: string }[];
  amountPaid: number;
}

export default function SuccessPage() {
  const [data, setData] = useState<RegistrationData | null>(null);
  const [confettiDone, setConfettiDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const whatsappLink = process.env.NEXT_PUBLIC_WHATSAPP_LINK || '#';

  useEffect(() => {
    const raw = sessionStorage.getItem('housie_registration');
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  // Confetti
  useEffect(() => {
    if (!data) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#FFD700', '#8B0000', '#ffffff', '#FF6B6B', '#4ECDC4', '#ff9f43'];
    const pieces: {
      x: number; y: number; w: number; h: number;
      color: string; vx: number; vy: number; rotation: number; spin: number;
    }[] = [];

    for (let i = 0; i < 180; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 300,
        w: Math.random() * 12 + 6,
        h: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 2,
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 10,
      });
    }

    let frame = 0;
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.y += p.vy;
        p.x += p.vx;
        p.rotation += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      frame++;
      if (frame < 180) animId = requestAnimationFrame(animate);
      else setConfettiDone(true);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [data]);

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <p style={{ fontSize: 60, marginBottom: 16 }}>🔍</p>
        <h1 className="font-display" style={{ fontSize: 32, color: 'var(--text-primary)', marginBottom: 12 }}>No Registration Found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 15 }}>
          This page shows your confirmation after successful payment. If you just paid, this may be a session issue.
        </p>
        <Link href="/">
          <button className="btn-red"><span>← Back to Home</span></button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', position: 'relative', padding: '48px 16px' }}>
      {/* Confetti canvas */}
      {!confettiDone && (
        <canvas
          ref={canvasRef}
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999 }}
        />
      )}

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,0,0.1), transparent)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.07), transparent)', filter: 'blur(60px)' }} />
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 80, marginBottom: 16, lineHeight: 1 }}>🎉</div>
          <h1 className="font-display" style={{ fontSize: 'clamp(32px, 6vw, 60px)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
            You&apos;re On The <span className="text-gold-gradient">Red Carpet!</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
            Registration confirmed. See you at the event!
          </p>
        </div>

        {/* Team ID badge */}
        <div
          style={{
            background: 'linear-gradient(135deg, #8B0000, #4a0000)',
            border: '2px solid rgba(255,215,0,0.5)',
            borderRadius: 20,
            padding: '32px 40px',
            textAlign: 'center',
            marginBottom: 24,
            animation: 'fadeInUp 0.5s ease',
          }}
        >
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,215,0,0.6)', marginBottom: 8 }}>Your Team ID</p>
          <p className="font-display" style={{ fontSize: 56, fontWeight: 900, color: 'var(--gold)', letterSpacing: 8, lineHeight: 1 }}>
            {data.teamId}
          </p>
          <p style={{ color: 'rgba(255,215,0,0.7)', marginTop: 8, fontSize: 14 }}>{data.teamName}</p>
        </div>

        {/* Details card */}
        <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
          {/* Members */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>Your Squad</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.members.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: i === 0 ? 'linear-gradient(135deg, #8B0000, #cc0000)' : 'rgba(255,215,0,0.1)',
                      border: i === 0 ? 'none' : '1px solid rgba(255,215,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      color: i === 0 ? 'white' : 'var(--gold)',
                      flexShrink: 0,
                    }}
                  >
                    {i === 0 ? '👑' : i + 1}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, fontSize: 15 }}>
                      {m.name} {i === 0 && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 400, marginLeft: 6 }}>LEADER</span>}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rc-divider" style={{ marginBottom: 20 }} />

          {/* Amount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Amount Paid</p>
              <p className="font-display" style={{ fontSize: 36, fontWeight: 900, color: '#22c55e' }}>₹{data.amountPaid}</p>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 999, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#22c55e', fontSize: 18 }}>✓</span>
              <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 14 }}>PAID</span>
            </div>
          </div>
        </div>

        {/* Screenshot tip */}
        <div
          style={{
            background: 'rgba(255,215,0,0.05)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 24, flexShrink: 0 }}>📸</span>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginBottom: 2 }}>
              Save This Screenshot!
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Screenshot this page and save your Team ID <strong style={{ color: 'var(--gold)' }}>{data.teamId}</strong>. A confirmation email has also been sent to all members.
            </p>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          id="join-whatsapp-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            color: 'white',
            padding: '18px 32px',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 18,
            marginBottom: 24,
            transition: 'transform 0.3s, box-shadow 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(37,211,102,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: 24 }}>📱</span>
          Join Our WhatsApp Group
        </a>

        {/* Event reminder */}
        <div className="glass-card" style={{ padding: 24, textAlign: 'center', marginBottom: 32 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
            👗 Remember the dress code: <strong style={{ color: 'var(--text-primary)' }}>Red Carpet Attire</strong>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            🎫 Bring your ticket + Team ID <strong style={{ color: 'var(--gold)' }}>{data.teamId}</strong> to the entry desk
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/">
            <button className="btn-gold" style={{ fontSize: 14 }}>
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>

      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
