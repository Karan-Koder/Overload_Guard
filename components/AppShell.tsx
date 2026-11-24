'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  FileClock,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  Mail,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from './AppProvider';
const nav = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/inbox', label: 'Approval inbox', icon: Inbox },
  { href: '/log', label: 'Activity log', icon: FileClock },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, error, toast, reload, busy } = useApp();
  const [guide, setGuide] = useState(false);
  const pending = data?.suggestions.filter((s) => s.status === 'awaiting_approval').length ?? 0;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-symbol">
            <ShieldCheck size={25} strokeWidth={2.2} />
          </span>
          <span>
            overload<span className="brand-light">guard</span>
            <small>A LITTLE LESS, A LOT BETTER.</small>
          </span>
        </Link>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-link ${pathname === n.href ? 'active' : ''}`}
              aria-current={pathname === n.href ? 'page' : undefined}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.href === '/inbox' && pending > 0 && <b className="nav-count">{pending}</b>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-apps">
          <div className="workspace-label">
            CONNECTED SOURCES <span>DEMO</span>
          </div>
          {[
            { name: 'Google Calendar', key: 'calendar', icon: CalendarDays },
            { name: 'Gmail', key: 'gmail', icon: Mail },
            { name: 'Google Classroom', key: 'classroom', icon: BookOpen },
          ].map((s) => (
            <div className="source-row" key={s.key}>
              <s.icon size={17} />
              <span>{s.name}</span>
              <span
                className={`connection-dot ${data?.settings.connected[s.key as 'calendar' | 'gmail' | 'classroom'] ? 'on' : ''}`}
                aria-label={
                  data?.settings.connected[s.key as 'calendar' | 'gmail' | 'classroom']
                    ? 'Sample source enabled'
                    : 'Disconnected'
                }
              />
            </div>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="control-note">
            <ShieldCheck size={21} />
            <strong>Your week. Your say.</strong>
            <p>
              Drafts need your approval.
              <br />
              You always have the final word.
            </p>
          </div>
          <button className="help-button" onClick={() => setGuide(true)}>
            <CircleHelp size={17} />
            How the demo works
            <ChevronRight size={15} />
          </button>
          <div className="profile">
            <span className="avatar">A</span>
            <span>
              <strong>{data?.student || 'Your workspace'}</strong>
              <small>2nd-year CSE · Student</small>
            </span>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <ChevronRight size={14} />
            <strong>{nav.find((n) => n.href === pathname)?.label || 'Overview'}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span />
              Interactive prototype
            </span>
            <span className="avatar small">A</span>
          </div>
        </header>
        <main id="main-content">
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button onClick={() => void reload()}>Retry</button>
            </div>
          )}
          {data ? (
            children
          ) : (
            <div className="loading-state">
              <LoaderCircle className="spin" size={28} />
              <h2>Making room for your week…</h2>
              {error && (
                <button onClick={() => void reload()} className="button">
                  Try again
                </button>
              )}
            </div>
          )}
        </main>
        <footer>
          <ShieldCheck size={15} />
          <span>
            Overload Guard tracks workload, not health. It does not diagnose anything. If you feel
            overwhelmed or unsafe, call Tele-MANAS{' '}
            <a href="tel:+9114416?oai_link_source=model_response_hotline">14416</a> (free, 24×7) or
            talk to someone you trust.
          </span>
          <span className="footer-prototype">Made for wHACKiest 2026</span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {busy && (
        <div className="working-indicator" role="status">
          <LoaderCircle size={16} className="spin" />
          Saving…
        </div>
      )}
      {guide && (
        <div className="modal-backdrop" onClick={() => setGuide(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="icon-button modal-close"
              aria-label="Close guide"
              onClick={() => setGuide(false)}
              autoFocus
            >
              <X size={20} />
            </button>
            <span className="eyebrow">
              <Sparkles size={15} />
              TWO-MINUTE WALKTHROUGH
            </span>
            <h2 id="guide-title">A calmer week starts here.</h2>
            <ol>
              <li>Look at Thursday’s workload score and its reasons.</li>
              <li>
                Click <strong>Add demo load</strong> to simulate three new commitments.
              </li>
              <li>Review recovery time and proposed changes. Try Undo.</li>
              <li>Open the Approval inbox, edit a draft, then approve it.</li>
              <li>Check the activity log and play your weekly briefing.</li>
            </ol>
            <p className="muted">
              All app connections use sample data. Approvals save local drafts and proposals; no
              email is sent and no real event is moved. Data resets when the server restarts.
            </p>
            <button className="button primary" onClick={() => setGuide(false)}>
              Explore my week
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
