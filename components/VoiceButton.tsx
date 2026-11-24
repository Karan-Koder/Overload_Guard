'use client';
import { AudioLines, LoaderCircle, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
export function VoiceButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle'); const [text, setText] = useState(''); const [note, setNote] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null); const objectUrl = useRef<string | null>(null); const generation = useRef(0);
  const stop = () => { generation.current++; audio.current?.pause(); audio.current = null; if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); objectUrl.current = null; window.speechSynthesis?.cancel(); setStatus('idle'); };
  useEffect(() => () => { generation.current++; audio.current?.pause(); if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); window.speechSynthesis?.cancel(); }, []);
  const play = async () => {
    if (status !== 'idle') { stop(); return; }
    const token = ++generation.current; setStatus('loading'); setNote('');
    try {
      const response = await fetch('/api/briefing', { cache: 'no-store' }); if (!response.ok) throw new Error('Briefing unavailable'); const briefing = await response.json();
      if (token !== generation.current) return; setText(briefing.text); if (briefing.note) setNote(briefing.note);
      const voice = await fetch('/api/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: briefing.text }) });
      if (token !== generation.current) return;
      if (voice.ok && voice.status !== 204) {
        objectUrl.current = URL.createObjectURL(await voice.blob()); const player = new Audio(objectUrl.current); audio.current = player; player.onended = stop; player.onerror = () => { stop(); setNote('Audio playback is unavailable. Read your briefing below.'); }; await player.play(); setStatus('playing');
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(briefing.text); utterance.lang = 'en-IN'; utterance.rate = 0.94; utterance.onend = () => { if (token === generation.current) setStatus('idle'); }; utterance.onerror = () => { if (token === generation.current) { setStatus('idle'); setNote('Browser voice is unavailable. Read your briefing below.'); } }; window.speechSynthesis.speak(utterance); setStatus('playing');
      } else { setStatus('idle'); setNote('Speech is not supported in this browser. Your briefing is shown below.'); }
    } catch { setStatus('idle'); setNote('Voice is unavailable right now. Please try again.'); }
  };
  return <div className="voice-area"><button className="button voice-button" onClick={() => void play()}>{status === 'loading' ? <LoaderCircle size={17} className="spin" /> : status === 'playing' ? <Square size={16} /> : <AudioLines size={18} />}{status === 'loading' ? 'Preparing briefing…' : status === 'playing' ? 'Stop briefing' : 'Play weekly briefing'}</button>{text && <details className="briefing-transcript" open={!!note}><summary>Read your briefing</summary><p>{text}</p>{note && <p className="muted">{note}</p>}</details>}{!text && note && <p role="status" className="muted">{note}</p>}</div>;
}
