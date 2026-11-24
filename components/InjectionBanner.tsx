import { ShieldAlert } from 'lucide-react';
import type { WorkItem } from '@/lib/types';
export function InjectionBanner({ item }: { item: WorkItem }) {
  if (!item.flagged) return null;
  return (
    <section className="injection-banner" aria-label="Untrusted email warning">
      <div className="injection-icon">
        <ShieldAlert size={20} />
      </div>
      <div>
        <div className="injection-heading">
          <strong>A suspicious instruction. Safely ignored.</strong>
          <span className="badge red">Blocked by policy</span>
        </div>
        <p>
          This email contains instructions aimed at AI assistants. Overload Guard ignored them. Its
          real deadline still counts toward your workload.
        </p>
        <details>
          <summary>Inspect the flagged email</summary>
          <p className="injection-from">
            From: {item.owner?.email} · {item.title}
          </p>
          <mark>{item.flagged.matched}</mark>
          <p>No invite accepted. No OTP accessed or forwarded.</p>
        </details>
      </div>
    </section>
  );
}
