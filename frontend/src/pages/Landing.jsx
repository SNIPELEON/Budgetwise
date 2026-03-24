import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
  const { user } = useAuth();

  useEffect(() => {
    // Intersection observer for reveal animations
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => observer.observe(el));

    // Bar animations on scroll
    const bars = document.querySelectorAll('.prob-bar-fill');
    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = `barGrow 1.2s ${entry.target.style.animationDelay || '0s'} ease-out forwards`;
        }
      });
    }, { threshold: 0.3 });
    bars.forEach(bar => {
      bar.style.transform = 'scaleX(0)';
      barObserver.observe(bar);
    });

    return () => {
      observer.disconnect();
      barObserver.disconnect();
    };
  }, []);

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="nav-logo">Budget<span>Wise</span></div>
        <ul className="nav-links">
          <li><a href="#problem">Problem</a></li>
          <li><a href="#solution">Solution</a></li>
          <li><a href="#market">Market</a></li>
          <li><a href="#vision">Vision</a></li>
        </ul>
        {user ? (
          <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ fontFamily: '"DM Mono", monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Go to App</Link>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm" style={{ fontFamily: '"DM Mono", monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Sign In</Link>
        )}
      </nav>

      {/* HERO */}
      <section id="hero" className="landing-section">
        <div className="deco-line deco-line-v" style={{ left: '12%', top: 0 }}></div>
        <div className="deco-line deco-line-v" style={{ right: '12%', top: 0 }}></div>

        <p className="hero-eyebrow">AI-Powered Personal Finance</p>
        <h1 className="hero-title">Budget<em>Wise</em></h1>
        <div className="hero-rule"></div>
        <p className="hero-tagline">
          Empowering individuals worldwide to achieve financial stability and peace of mind through smart, AI-driven budgeting.
        </p>
        <div className="hero-cta">
          {user ? (
            <Link to="/dashboard" className="btn-primary-pitch">Open Dashboard</Link>
          ) : (
            <Link to="/register" className="btn-primary-pitch">Get Early Access</Link>
          )}
          <Link to="/login" className="btn-outline-pitch">Sign In</Link>
        </div>

        <div className="stat-row">
          <div className="stat-item">
            <div className="stat-num">77%</div>
            <div className="stat-label">Adults lack a budget</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">$1.4T</div>
            <div className="stat-label">Fintech market size</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">Global</div>
            <div className="stat-label">Target market</div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="landing-section">
        <div className="section-inner two-col">
          <div className="reveal">
            <p className="section-label">The Problem</p>
            <h2 className="section-heading">Financial mismanagement is everywhere.</h2>
            <p className="section-body">
              Most individuals struggle to manage their budgets effectively. The complexity of tracking expenses, setting savings goals, and making sense of financial data leads to chronic overspending, unmet goals, and deep-seated financial stress.
            </p>
          </div>
          <div className="problem-visual reveal reveal-delay-2">
            <div className="prob-bar">
              <span className="prob-bar-label">Overspending</span>
              <div className="prob-bar-track"><div className="prob-bar-fill" style={{ width: '83%', animationDelay: '0.2s' }}></div></div>
              <span className="prob-bar-pct">83%</span>
            </div>
            <div className="prob-bar">
              <span className="prob-bar-label">No savings plan</span>
              <div className="prob-bar-track"><div className="prob-bar-fill" style={{ width: '70%', animationDelay: '0.4s' }}></div></div>
              <span className="prob-bar-pct">70%</span>
            </div>
            <div className="prob-bar">
              <span className="prob-bar-label">Financial stress</span>
              <div className="prob-bar-track"><div className="prob-bar-fill" style={{ width: '62%', animationDelay: '0.6s' }}></div></div>
              <span className="prob-bar-pct">62%</span>
            </div>
            <div className="prob-bar">
              <span className="prob-bar-label">Budget tracking</span>
              <div className="prob-bar-track"><div className="prob-bar-fill" style={{ width: '77%', animationDelay: '0.8s' }}></div></div>
              <span className="prob-bar-pct">77%</span>
            </div>
            <div className="prob-bar">
              <span className="prob-bar-label">Missed goals</span>
              <div className="prob-bar-track"><div className="prob-bar-fill" style={{ width: '58%', animationDelay: '1.0s' }}></div></div>
              <span className="prob-bar-pct">58%</span>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section id="solution" className="landing-section">
        <div style={{ maxWidth: 1100, width: '100%' }}>
          <div className="reveal" style={{ marginBottom: '3.5rem' }}>
            <p className="section-label">The Solution</p>
            <h2 className="section-heading" style={{ maxWidth: 560 }}>An AI assistant that makes budgeting effortless.</h2>
          </div>
          <div className="feature-grid">
            <div className="pitch-feature-card reveal reveal-delay-1">
              <span className="feature-num">01</span>
              <div className="feature-icon">📊</div>
              <div className="feature-title">Spending Analysis</div>
              <p className="feature-desc">Automatically categorizes and tracks expenses to surface patterns and insights you'd never notice manually.</p>
            </div>
            <div className="pitch-feature-card reveal reveal-delay-2">
              <span className="feature-num">02</span>
              <div className="feature-icon">🎯</div>
              <div className="feature-title">Savings Targeting</div>
              <p className="feature-desc">Sets personalized savings targets based on income, goals, and lifestyle — and keeps you on track with gentle nudges.</p>
            </div>
            <div className="pitch-feature-card reveal reveal-delay-3">
              <span className="feature-num">03</span>
              <div className="feature-icon">✂️</div>
              <div className="feature-title">Cost-Cutting Suggestions</div>
              <p className="feature-desc">AI identifies subscriptions, recurring waste, and spending leaks, then suggests concrete ways to save more each month.</p>
            </div>
            <div className="pitch-feature-card reveal reveal-delay-4">
              <span className="feature-num">04</span>
              <div className="feature-icon">⚡</div>
              <div className="feature-title">Real-Time Insights</div>
              <p className="feature-desc">Live financial health scores and instant feedback help users make smarter decisions in the moment — not after the damage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MARKET */}
      <section id="market" className="landing-section">
        <div className="section-inner two-col" style={{ alignItems: 'center' }}>
          <div className="reveal">
            <p className="section-label">Target Market</p>
            <h2 className="section-heading" style={{ color: 'var(--bg-secondary)' }}>A truly global opportunity.</h2>
            <p className="section-body" style={{ color: 'rgba(250,247,240,0.55)' }}>
              BudgetWise targets every individual seeking financial literacy and stability — from first-time earners to households managing complex finances. The addressable market is worldwide, with no geographic ceiling.
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }} className="reveal reveal-delay-2">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }}></div>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: 'rgba(250,247,240,0.6)', letterSpacing: '0.06em' }}>Young professionals building first budgets</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }}></div>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: 'rgba(250,247,240,0.6)', letterSpacing: '0.06em' }}>Households managing family finances</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }}></div>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: 'rgba(250,247,240,0.6)', letterSpacing: '0.06em' }}>Individuals recovering from debt</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }}></div>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: 'rgba(250,247,240,0.6)', letterSpacing: '0.06em' }}>Freelancers with variable income streams</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }} className="reveal reveal-delay-2">
            <div className="market-rings">
              <div className="ring ring-1">
                <div style={{ position: 'absolute', top: '0.9rem', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                  <div className="ring-label">TAM</div>
                  <div className="ring-val">$1.4T</div>
                  <div className="ring-sub">Global Fintech</div>
                </div>
              </div>
              <div className="ring ring-2">
                <div style={{ position: 'absolute', bottom: '22%', textAlign: 'center' }}>
                  <div className="ring-label">SAM</div>
                  <div className="ring-val">$84B</div>
                  <div className="ring-sub">Personal Finance Apps</div>
                </div>
              </div>
              <div className="ring ring-3">
                <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <div className="ring-label">SOM</div>
                  <div className="ring-val">$4B</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section id="vision" className="landing-section">
        <div className="vm-grid">
          <div className="vm-card reveal">
            <p className="vm-type">Vision</p>
            <p className="vm-text">"To empower individuals worldwide to achieve financial literacy and stability through innovative technology."</p>
          </div>
          <div className="vm-card reveal reveal-delay-2">
            <p className="vm-type">Mission</p>
            <p className="vm-text">"To simplify personal finance management using AI, enabling users to make informed financial decisions and improve their quality of life."</p>
          </div>
          <div className="vm-card reveal reveal-delay-1" style={{ borderTopColor: 'var(--success)' }}>
            <p className="vm-type" style={{ color: 'var(--success)' }}>Target Customer</p>
            <p className="vm-text" style={{ fontSize: '1.05rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
              Individuals seeking better personal finance management, from first-time earners to seasoned professionals — anyone who wants clarity, control, and confidence over their money.
            </p>
          </div>
          <div className="vm-card reveal reveal-delay-3" style={{ borderTopColor: 'var(--danger)' }}>
            <p className="vm-type" style={{ color: 'var(--danger)' }}>Our Edge</p>
            <p className="vm-text" style={{ fontSize: '1.05rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
              Personalized AI advice, not generic rules. Real-time financial health tracking. Actionable insights delivered at the moment they matter most.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="landing-section">
        <div className="deco-line deco-line-v" style={{ left: '12%', top: 0 }}></div>
        <div className="deco-line deco-line-v" style={{ right: '12%', top: 0 }}></div>
        <p className="hero-eyebrow">Join the Movement</p>
        <h2 className="hero-title" style={{ fontSize: 'clamp(2.8rem,7vw,5.5rem)' }}>
          Financial peace<br /><em>starts here.</em>
        </h2>
        <div className="hero-rule"></div>
        <p className="hero-tagline">Be part of the platform that helps millions of people take control of their financial future.</p>
        <div className="hero-cta" style={{ animationDelay: '0s', opacity: 1 }}>
          <Link to="/register" className="btn-primary-pitch">Get Early Access</Link>
          <Link to="/login" className="btn-outline-pitch">Schedule a Demo</Link>
        </div>
      </section>

      <footer className="landing-footer">
        © {new Date().getFullYear()} BudgetWise &nbsp;·&nbsp; AI-Powered Personal Finance &nbsp;·&nbsp; Global
      </footer>
    </div>
  );
}
