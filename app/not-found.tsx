import Link from 'next/link';
export default function NotFound() { return <div className="page calm-empty large-empty"><h1>This page took a breather.</h1><p>Return to your workload overview to continue.</p><Link href="/" className="button primary">Open overview</Link></div>; }
