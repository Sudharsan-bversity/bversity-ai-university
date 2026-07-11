import { useEffect, useRef, useState } from 'react';
import {
  GraduationCap, BookOpen, FlaskConical, BadgeCheck, LayoutDashboard,
  Stethoscope, Code2, LogOut, AlertTriangle, CheckCircle2, ShieldAlert,
  ShieldCheck, Lock, Loader2, PlayCircle, ClipboardList, MessagesSquare,
  Circle, X, Send,
} from 'lucide-react';

const ITEM_TYPE_ICON = {
  video: PlayCircle, screen_capture: PlayCircle, reading: BookOpen,
  practice_assignment: ClipboardList, graded_assessment: ClipboardList, dialogue: MessagesSquare,
};
const ITEM_TYPE_LABEL = {
  video: 'Video', screen_capture: 'Walkthrough', reading: 'Reading',
  practice_assignment: 'Practice Assignment', graded_assessment: 'Graded Assessment', dialogue: 'Dialogue',
};

// Minimal, safe markdown-to-JSX renderer for the subset used in seeded readings
// (##/### headings, **bold**, - bullet lists, plain paragraphs) -- no HTML injection.
function renderMarkdown(text) {
  const lines = (text || '').split('\n');
  const blocks = [];
  let listBuf = [];
  const flushList = () => {
    if (listBuf.length) { blocks.push(<ul key={blocks.length}>{listBuf}</ul>); listBuf = []; }
  };
  const inline = (line) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p);
  };
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); return; }
    if (trimmed.startsWith('### ')) { flushList(); blocks.push(<h4 key={i}>{inline(trimmed.slice(4))}</h4>); }
    else if (trimmed.startsWith('## ')) { flushList(); blocks.push(<h3 key={i}>{inline(trimmed.slice(3))}</h3>); }
    else if (trimmed.startsWith('- ')) { listBuf.push(<li key={i}>{inline(trimmed.slice(2))}</li>); }
    else { flushList(); blocks.push(<p key={i}>{inline(trimmed)}</p>); }
  });
  flushList();
  return blocks;
}

const TENANT_ID = 'ph_gov';

const DISCIPLINES = [
  { id: 'allied_healthcare', title: 'College of Allied Health & Nursing', Icon: Stethoscope, courseId: 'ph_allied_health' },
  { id: 'software_engineering', title: 'College of Information Technology & Engineering', Icon: Code2, courseId: 'ph_software_eng' },
];

async function api(path, opts) {
  const res = await fetch(`/api${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

function BrandMark({ light }) {
  return (
    <div className="gate-brand-mark" style={light ? undefined : { color: 'var(--color-primary)' }}>
      <div className="gate-brand-flag"><GraduationCap size={17} color="#0F172A" /></div>
      Philippines AI University
    </div>
  );
}

function LoginGate({ onEnter }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [discipline, setDiscipline] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSelect(d) {
    if (!name.trim() || !email.trim()) { setError('Enter your name and email to continue.'); return; }
    setDiscipline(d);
    setBusy(true); setError('');
    try {
      const data = await api('/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), tenant_id: TENANT_ID }),
      });
      const student = { id: data.student_id, name: data.name };
      localStorage.setItem('ph_student', JSON.stringify(student));
      localStorage.setItem('ph_discipline', JSON.stringify(d));
      onEnter(student, d);
    } catch (e) {
      setError(e.message);
      setDiscipline(null);
    } finally { setBusy(false); }
  }

  return (
    <div className="gate">
      <div className="gate-brand-panel">
        <BrandMark light />
        <div className="gate-brand-hero">
          <h1 className="gate-brand-title">Outcomes-based AI education, built for national scale.</h1>
          <p className="gate-brand-sub">
            A single platform for curriculum delivery, applied practice simulations, and verified
            competency tracking — aligned to CHED academic mandates and PRC licensure standards.
          </p>
        </div>
        <div className="gate-trust-row">
          <span className="gate-trust-item"><ShieldCheck size={15} /> CHED Aligned</span>
          <span className="gate-trust-item"><BadgeCheck size={15} /> PRC Competency Mapped</span>
          <span className="gate-trust-item"><Lock size={15} /> Data Sovereign</span>
        </div>
      </div>

      <div className="gate-form-panel">
        <div className="gate-form-inner">
          <div className="gate-form-title">Welcome</div>
          <div className="gate-form-sub">Sign in to continue to your program.</div>

          <div className="field-group">
            <label className="field-label">Full name</label>
            <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Juan Dela Cruz" />
          </div>
          <div className="field-group">
            <label className="field-label">Email address</label>
            <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@university.edu.ph" />
          </div>
          {error && <div className="gate-error"><AlertTriangle size={14} />{error}</div>}

          <div className="discipline-section-label">Select your program</div>
          <div className="discipline-cards">
            {DISCIPLINES.map(d => (
              <button key={d.id} className="discipline-card" disabled={busy} onClick={() => handleSelect(d)}>
                <div className="discipline-card-icon"><d.Icon size={22} /></div>
                <div>
                  <div className="discipline-card-title">{d.title}</div>
                  {busy && discipline?.id === d.id && <div className="discipline-card-busy">Signing in…</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Digital Twin: chat-driven tutor delivery, ported from the proven Bversity PV-pilot
// pattern (frontend/src/App.jsx StructuredCourseView and friends) -- same backend contract
// (/chat, /learning-items-current, /learning-items/.../content|complete|submit), restyled
// to this app's design tokens instead of copy-pasted.

function InlineVideoCard({ courseId, item, studentId, onComplete }) {
  const [watched, setWatched] = useState(item.status === 'completed');
  return (
    <div className="twin-inline-card">
      <div className="twin-inline-card-title">{ITEM_TYPE_LABEL[item.type]}: {item.title}</div>
      <video className="item-modal-video" src={`/api/learning-items/video-file/${courseId}/${item.id}`} controls />
      <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={watched}
        onClick={async () => { setWatched(true); await api(`/learning-items/${studentId}/${courseId}/${item.id}/complete`, { method: 'POST' }); onComplete(); }}>
        {watched ? <><CheckCircle2 size={15} /> Marked as watched</> : 'Mark as Watched'}
      </button>
    </div>
  );
}

function ReadingFullScreenView({ courseId, item, studentId, onComplete, onClose }) {
  const [content, setContent] = useState(null);
  const [read, setRead] = useState(item.status === 'completed');
  useEffect(() => {
    api(`/learning-items/${courseId}/${item.id}/content?student_id=${studentId}`).then(d => setContent(d.content)).catch(() => {});
  }, [item.id]);

  async function handleMarkRead() {
    setRead(true);
    await api(`/learning-items/${studentId}/${courseId}/${item.id}/complete`, { method: 'POST' });
    onComplete();
  }

  return (
    <div className="lab-viva-modal-overlay">
      <div className="lab-viva-modal item-detail-modal">
        <div className="item-modal-header">
          <div className="gate-brand-mark" style={{ color: 'var(--color-accent)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Reading</div>
          <button className="btn btn-outline" onClick={onClose}><X size={16} /></button>
        </div>
        <h3 style={{ marginTop: -8, marginBottom: 16 }}>{item.title}</h3>
        <div className="item-modal-reading">{content ? renderMarkdown(content.body_markdown) : 'Loading…'}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-primary" disabled={read} onClick={handleMarkRead}>
            {read ? <><CheckCircle2 size={15} /> Marked as read</> : 'Mark as Read'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>{read ? 'Done — back to chat' : 'Close'}</button>
        </div>
      </div>
    </div>
  );
}

function InlineReadingCard({ courseId, item, studentId, onComplete }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(item.status === 'completed');
  return (
    <>
      <div className="twin-inline-card twin-reading-prompt" onClick={() => setOpen(true)}>
        <BookOpen size={22} color="var(--color-accent)" />
        <div style={{ flex: 1 }}>
          <div className="twin-inline-card-title">Reading: {item.title}</div>
          <div className="item-row-meta">{read ? 'Read — tap to review again' : `Opens in a dedicated reading view · ${item.duration_min} min`}</div>
        </div>
        <button className="btn btn-accent" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>{read ? 'Reopen' : 'Start reading'}</button>
      </div>
      {open && (
        <ReadingFullScreenView courseId={courseId} item={item} studentId={studentId}
          onComplete={() => { setRead(true); onComplete(); }} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function InlineAssessmentCard({ courseId, item, studentId, onComplete }) {
  const [content, setContent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api(`/learning-items/${courseId}/${item.id}/content?student_id=${studentId}`).then(d => setContent(d.content)).catch(() => {});
  }, [item.id]);

  async function handleSubmit() {
    if (!content || Object.keys(answers).length < content.questions.length) return;
    setSubmitting(true);
    try {
      const res = await api(`/learning-items/${studentId}/${courseId}/${item.id}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: content.questions.map((_, i) => answers[i] ?? -1) }),
      });
      setResults(res);
      if (!content.is_graded || res.passed) onComplete();
    } finally { setSubmitting(false); }
  }

  if (!content) return <div className="twin-inline-card">Loading…</div>;
  const allAnswered = Object.keys(answers).length === content.questions.length;

  return (
    <div className="twin-inline-card">
      <div className="twin-inline-card-title">{ITEM_TYPE_LABEL[item.type]}: {item.title}</div>
      {results && (
        <div className={`lab-chat-bubble ${results.passed ? 'safe' : 'error'}`} style={{ margin: '12px 0' }}>
          {results.passed ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          <span><strong>{results.correct}/{results.total} correct</strong> — {results.passed ? 'Passed' : 'Not quite'}</span>
        </div>
      )}
      {content.questions.map((q, qi) => {
        const res = results?.results?.[qi];
        return (
          <div key={qi} style={{ margin: '16px 0' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Q{qi + 1}. {q.question}</div>
            {q.options.map((opt, oi) => {
              const isCorrect = res && oi === res.correct_index;
              const isWrongPick = res && oi === res.student_answer && res.student_answer !== res.correct_index;
              return (
                <label key={oi} className="lab-action-btn" style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: results ? 'default' : 'pointer',
                  borderColor: isCorrect ? 'var(--color-success)' : isWrongPick ? 'var(--color-destructive)' : undefined,
                  background: isCorrect ? 'var(--color-success-soft)' : isWrongPick ? 'var(--color-destructive-soft)' : undefined,
                }}>
                  <input type="radio" name={`ti-q${qi}`} disabled={!!results} checked={answers[qi] === oi}
                    onChange={() => !results && setAnswers(prev => ({ ...prev, [qi]: oi }))} />
                  {opt}
                </label>
              );
            })}
            {res && <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: 6 }}>{q.explanation}</div>}
          </div>
        );
      })}
      {!results && (
        <button className="btn btn-primary" disabled={!allAnswered || submitting} onClick={handleSubmit}>
          {submitting ? 'Scoring…' : `Submit Answers (${Object.keys(answers).length}/${content.questions.length})`}
        </button>
      )}
      {results && content.is_graded && !results.passed && (
        <button className="btn btn-primary" onClick={() => { setAnswers({}); setResults(null); }}>Try Again</button>
      )}
    </div>
  );
}

function LearningItemCard({ courseId, item, studentId, onComplete }) {
  if (item.type === 'video' || item.type === 'screen_capture') return <InlineVideoCard courseId={courseId} item={item} studentId={studentId} onComplete={onComplete} />;
  if (item.type === 'reading') return <InlineReadingCard courseId={courseId} item={item} studentId={studentId} onComplete={onComplete} />;
  if (item.type === 'practice_assignment' || item.type === 'graded_assessment') return <InlineAssessmentCard courseId={courseId} item={item} studentId={studentId} onComplete={onComplete} />;
  return null; // dialogue: no card, just the tutor's tone shifting in the thread
}

function DigitalTwinSidebar({ items, completedCount, total, moduleTitle }) {
  const statusLabel = { completed: 'Completed', in_progress: 'In Progress', not_started: 'Not Started' };
  return (
    <div className="twin-sidebar">
      <div className="twin-sidebar-title">{moduleTitle}</div>
      <div className="course-progress-summary" style={{ marginBottom: 14 }}>{completedCount}/{total} items</div>
      <div className="competency-bar-track" style={{ marginBottom: 18 }}>
        <div className="competency-bar-fill pass" style={{ width: `${total ? (completedCount / total) * 100 : 0}%` }} />
      </div>
      {items.map(it => {
        const Icon = ITEM_TYPE_ICON[it.type] || Circle;
        return (
          <div key={it.id} className="twin-sidebar-item">
            {it.status === 'completed' ? <CheckCircle2 size={16} color="var(--color-success)" /> : <Icon size={16} color="var(--color-muted)" />}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{it.title}</div>
              <div className="item-row-meta">{ITEM_TYPE_LABEL[it.type]} · {it.duration_min} min</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DigitalTwinView({ courseId, courseMeta, student, moduleId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [moduleTitle, setModuleTitle] = useState('');
  const lastShownItemId = useRef(null);
  const bottomRef = useRef(null);
  const startedRef = useRef(false);

  async function loadItems() {
    const data = await api(`/learning-items-current/${courseId}?student_id=${student.id}`);
    setItems(data.items); setCompletedCount(data.completed_count); setTotal(data.total);
    setModuleTitle(data.module_title);
  }

  async function sendMessageText(text, isAutoOpen) {
    if (loading) return;
    if (!isAutoOpen) setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const data = await api('/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, subject_id: courseId, message: text, auto_open: !!isAutoOpen }),
      });
      const newMsgs = [{ role: 'bot', content: data.reply }];
      if (data.next_item && data.next_item.id !== lastShownItemId.current) {
        newMsgs.push({ role: 'learning-item', item: data.next_item });
        lastShownItemId.current = data.next_item.id;
      }
      setMessages(prev => [...prev, ...newMsgs]);
      if (data.newly_completed_item_ids?.length || data.next_item) loadItems();
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: 'Something went wrong. Please try again.' }]);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    loadItems();
    sendMessageText('[session_open]', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendMessageText(text, false);
  }
  function handleItemComplete() {
    loadItems();
    sendMessageText('[item_completed]', true);
  }

  const initial = (courseMeta?.tutor_name || 'T').replace(/^Dr\.\s*/, '').charAt(0);

  return (
    <div className="twin-layout">
      <div className="twin-main">
        <div className="course-header-row" style={{ marginBottom: 16 }}>
          <button className="btn btn-outline" onClick={onBack}>← Back to Modules</button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>{courseMeta?.tutor_name}</div>
            <div className="item-row-meta">{courseMeta?.tutor_role}, {courseMeta?.tutor_org}</div>
          </div>
        </div>
        <div className="twin-messages">
          {messages.map((msg, i) => {
            if (msg.role === 'learning-item') {
              return <div key={i} className="twin-message-row bot"><LearningItemCard courseId={courseId} item={msg.item} studentId={student.id} onComplete={handleItemComplete} /></div>;
            }
            return (
              <div key={i} className={`twin-message-row ${msg.role}`}>
                <div className={`twin-message-avatar ${msg.role}`}>{msg.role === 'bot' ? initial : student.name.charAt(0).toUpperCase()}</div>
                <div className="twin-message-bubble">{renderMarkdown(msg.content)}</div>
              </div>
            );
          })}
          {loading && <div className="twin-message-row bot"><div className="twin-message-avatar bot">{initial}</div><div className="twin-message-bubble">…</div></div>}
          <div ref={bottomRef} />
        </div>
        <div className="twin-input-row">
          <input className="field-input" placeholder="Type your response…" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
          <button className="btn btn-primary" disabled={loading || !input.trim()} onClick={handleSend}><Send size={16} /></button>
        </div>
      </div>
      <DigitalTwinSidebar items={items} completedCount={completedCount} total={total} moduleTitle={moduleTitle} />
    </div>
  );
}

function ModuleCatalogView({ student, discipline }) {
  const [modules, setModules] = useState(null);
  const [courseMeta, setCourseMeta] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);

  function load() {
    api(`/course-modules/${discipline.courseId}?student_id=${student.id}`).then(setModules).catch(() => setModules([]));
  }
  useEffect(load, [discipline.courseId, student.id]);
  useEffect(() => {
    api(`/subjects?tenant_id=${TENANT_ID}`).then(list => setCourseMeta(list.find(s => s.id === discipline.courseId))).catch(() => {});
  }, [discipline.courseId]);

  if (activeModuleId) {
    return <DigitalTwinView courseId={discipline.courseId} courseMeta={courseMeta} student={student} moduleId={activeModuleId}
      onBack={() => { setActiveModuleId(null); load(); }} />;
  }

  if (!modules) return <div className="panel">Loading…</div>;
  const statusLabel = { completed: 'Completed', in_progress: 'In Progress', locked: 'Locked' };

  return (
    <div className="panel">
      <div className="panel-title">Syllabus — {discipline.title}</div>
      <table className="curriculum-table">
        <thead><tr><th>Course Code</th><th>Descriptive Title</th><th>Progress</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {modules.map((m, i) => {
            const codeMatch = m.title.match(/^([A-Z]+\s?\d+)\s*:/);
            const code = codeMatch ? codeMatch[1] : (discipline.courseId === 'ph_allied_health' ? `NCM ${100 + i * 4}` : `CS ${102 + i}`);
            const displayTitle = codeMatch ? m.title.slice(codeMatch[0].length).trim() : m.title;
            return (
            <tr key={m.id} style={{ opacity: m.status === 'locked' ? 0.55 : 1 }}>
              <td><span className="course-code-tag">{code}</span></td>
              <td>
                <div style={{ fontWeight: 600 }}>{displayTitle}</div>
                <div className="item-row-meta">{m.topics_desc}</div>
              </td>
              <td>{m.completed_count}/{m.item_count} items</td>
              <td><span className={`status-pill ${m.status === 'locked' ? 'not_started' : m.status}`}>
                {m.status === 'locked' && <Lock size={11} style={{ verticalAlign: -1, marginRight: 3 }} />}{statusLabel[m.status]}
              </span></td>
              <td>
                <button className="btn btn-accent" disabled={m.status === 'locked'} onClick={() => setActiveModuleId(m.id)}>
                  {m.status === 'completed' ? 'Review' : m.status === 'in_progress' && m.completed_count > 0 ? 'Continue' : 'Start Learning'}
                </button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PracticeLabsView({ student, discipline }) {
  const [labs, setLabs] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [scenarioComplete, setScenarioComplete] = useState(false);
  const [chatLog, setChatLog] = useState([]);
  const [code, setCode] = useState('');
  const [vivaOpen, setVivaOpen] = useState(false);
  const [vivaAnswer, setVivaAnswer] = useState('');
  const [vivaResult, setVivaResult] = useState(null);
  const [vivaBusy, setVivaBusy] = useState(false);

  useEffect(() => {
    api(`/practice-labs/${discipline.courseId}/${discipline.id}?student_id=${student.id}`).then(setLabs).catch(() => setLabs([]));
  }, [discipline.courseId, discipline.id, student.id]);

  async function openScenario(labId) {
    const full = await api(`/practice-labs/scenario/${labId}`);
    setScenario(full);
    setStepIndex(0);
    setScenarioComplete(false);
    setChatLog([{ sender: 'AI_Instructor', text: full.intro_message, type: 'neutral' }]);
    setCode(full.scenario_json.baseline_code || '');
  }

  async function handleAction(actionId) {
    try {
      const res = await api(`/practice-labs/${student.id}/${scenario.id}/action`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId, step_index: stepIndex }),
      });
      setChatLog(prev => [...prev, { sender: 'AI_Instructor', text: res.response_message, type: res.trigger_type === 'infraction' ? 'error' : 'safe' }]);
      if (res.advance) {
        if (res.scenario_complete) {
          setScenarioComplete(true);
        } else {
          setStepIndex(res.next_step_index);
          if (res.next_step_prompt) {
            setChatLog(prev => [...prev, { sender: 'AI_Instructor', text: res.next_step_prompt, type: 'neutral' }]);
          }
        }
      }
    } catch (e) {
      setChatLog(prev => [...prev, { sender: 'AI_Instructor', text: `Error: ${e.message}`, type: 'error' }]);
    }
  }

  async function handleVivaSubmit() {
    setVivaBusy(true);
    try {
      const res = await api(`/practice-labs/${student.id}/${scenario.id}/viva`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer: vivaAnswer }),
      });
      setVivaResult(res);
    } catch (e) {
      setVivaResult({ passed: false, feedback: e.message });
    } finally { setVivaBusy(false); }
  }

  if (!labs) return <div className="panel">Loading…</div>;

  if (!scenario) {
    return (
      <div className="panel">
        <div className="panel-title">Available Scenarios</div>
        {labs.length === 0 && <p style={{ color: 'var(--color-muted)' }}>No practice lab scenario available for this discipline yet.</p>}
        {labs.map(l => (
          <div key={l.id} className="item-row" style={{ opacity: l.locked ? 0.6 : 1 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{l.title}</div>
              {l.locked && <div className="item-row-meta"><Lock size={12} style={{ verticalAlign: -1 }} /> Complete the module's practice assignment first</div>}
            </div>
            <button className="btn btn-accent" disabled={l.locked} onClick={() => openScenario(l.id)}>
              {l.locked ? 'Locked' : 'Launch Lab'}
            </button>
          </div>
        ))}
      </div>
    );
  }

  const isSoftwareEng = discipline.id === 'software_engineering';
  const currentStep = scenario.scenario_json.steps[stepIndex];

  return (
    <div className="lab-layout">
      <div className="panel">
        <div className="panel-title">Context Profile</div>
        <div className="lab-context-text">{scenario.context_profile}</div>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setScenario(null)}>← Back to Scenarios</button>
      </div>
      <div className="panel">
        <div className="panel-title">Interactive AI Chat Log</div>
        <div className="lab-chat-log">
          {chatLog.map((m, i) => (
            <div key={i} className={`lab-chat-bubble ${m.type}`}>
              {m.type === 'error' ? <ShieldAlert size={16} /> : m.type === 'safe' ? <CheckCircle2 size={16} /> : null}
              <span>{m.text}</span>
            </div>
          ))}
          {scenarioComplete && (
            <div className="lab-chat-bubble safe"><CheckCircle2 size={16} /><span>Scenario complete — results logged to your Skill Passport.</span></div>
          )}
        </div>
      </div>
      <div className="panel">
        <div className="panel-title">{currentStep?.prompt || 'Execution Control'}</div>
        {scenarioComplete ? null : !isSoftwareEng ? (
          currentStep.actions.map(a => (
            <button key={a.id} className="lab-action-btn" onClick={() => handleAction(a.id)}>{a.label}</button>
          ))
        ) : (
          <>
            <textarea className="lab-code-editor" value={code} onChange={e => setCode(e.target.value)} />
            <button className="btn btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
              onClick={async () => { await handleAction(currentStep.actions[0].id); setVivaOpen(true); }}>
              Submit Code to Tech Lead
            </button>
          </>
        )}
      </div>
      {vivaOpen && (
        <div className="lab-viva-modal-overlay">
          <div className="lab-viva-modal">
            <h3>AI Oral Defense — Verification</h3>
            <p>{scenario.scenario_json.viva_question}</p>
            {!vivaResult ? (
              <>
                <textarea className="lab-code-editor" style={{ background: 'var(--color-surface)', color: 'var(--color-foreground)', minHeight: 100 }}
                  placeholder="Explain your reasoning in plain text…" value={vivaAnswer} onChange={e => setVivaAnswer(e.target.value)} />
                <button className="btn btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                  disabled={vivaBusy || !vivaAnswer.trim()} onClick={handleVivaSubmit}>
                  {vivaBusy ? <><Loader2 size={15} className="spin" /> Grading…</> : 'Submit Answer'}
                </button>
              </>
            ) : (
              <>
                <div className={`lab-chat-bubble ${vivaResult.passed ? 'safe' : 'error'}`}>
                  {vivaResult.passed ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                  <span>{vivaResult.feedback}</span>
                </div>
                <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => { setVivaOpen(false); setVivaResult(null); setVivaAnswer(''); }}>Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SkillPassportView({ student }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    api(`/skill-passport/${student.id}?tenant_id=${TENANT_ID}`).then(setData).catch(() => {});
  }, [student.id]);
  if (!data) return <div className="panel">Loading…</div>;

  // The real licensure exam has a floor rule -- score below 60 in ANY single area fails
  // regardless of average -- so the headline metric is the weakest scored area, not a mean.
  const limiting = data.limiting_area;

  return (
    <div>
      <div className="summary-cards">
        <div className={`summary-card ${limiting && limiting.value < 60 ? 'critical' : 'neutral'}`}>
          <div className="summary-card-label">Licensure Passing Prediction</div>
          <div className="summary-card-value">{limiting ? `${limiting.value}%` : '—'}</div>
          {limiting && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: 6 }}>
              Limited by weakest area: <strong>{limiting.label}</strong>{limiting.value < 60 ? ' (below the 60% floor rule)' : ''}
            </div>
          )}
        </div>
        <div className="summary-card neutral">
          <div className="summary-card-label">Verified Course Completions</div>
          <div className="summary-card-value">{data.course_completions.length}</div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title">Competency Matrix</div>
        {data.competency_matrix.map(c => (
          <div key={c.code} className="competency-row">
            <div className="competency-label">{c.label}</div>
            <div className="competency-bar-track">
              <div className={`competency-bar-fill ${c.status}`} style={{ width: `${c.value ?? 0}%` }} />
            </div>
            <div className="competency-value">{c.value !== null ? `${c.value}%` : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FacultyDashboardView() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('ph_faculty_key') || '');
  const [roster, setRoster] = useState(null);
  const [error, setError] = useState('');

  async function loadRoster() {
    setError('');
    try {
      const data = await api(`/faculty/roster/${TENANT_ID}`, { headers: { 'X-Admin-Key': adminKey } });
      setRoster(data);
      localStorage.setItem('ph_faculty_key', adminKey);
    } catch (e) { setError(e.message); setRoster(null); }
  }

  if (!roster) {
    return (
      <div className="panel faculty-key-panel">
        <div className="panel-title">Faculty Access</div>
        <div className="field-group">
          <label className="field-label">Faculty access key</label>
          <input className="field-input" placeholder="Enter access key" type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={loadRoster}>Enter</button>
        {error && <div className="gate-error"><AlertTriangle size={14} />{error}</div>}
      </div>
    );
  }

  const atRiskCount = roster.filter(r => r.at_risk_areas.length > 0).length;

  return (
    <div>
      {atRiskCount > 0 && (
        <div className="alert-banner">
          <AlertTriangle size={18} />
          <span><strong>{atRiskCount} student{atRiskCount > 1 ? 's' : ''}</strong> flagged at risk of failing licensure benchmarks due to structural baseline logic errors.</span>
        </div>
      )}
      <div className="panel">
        <table className="roster-table">
          <thead><tr><th>Student Name</th><th>Items Completed</th><th>Core Structural Risk</th><th>Actions</th></tr></thead>
          <tbody>
            {roster.map(r => (
              <tr key={r.student_id}>
                <td>{r.name}</td>
                <td>{r.completed_items}</td>
                <td>{r.at_risk_areas.length ? r.at_risk_areas.map(a => <span key={a} className="risk-tag">{a}</span>) : 'None'}</td>
                <td><button className="btn btn-outline">View Skill Passport</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="summary-cards" style={{ marginTop: 20 }}>
        <div className="summary-card neutral">
          <div className="summary-card-label">Faculty Admin Labor Saved</div>
          <div className="summary-card-value">18.5 hrs/wk</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: 6 }}>Automated clinical log evaluation and syntax compilation tracking completed by background processes.</div>
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { id: 'curriculum', label: 'Syllabus & Curriculum', Icon: BookOpen },
  { id: 'practice_labs', label: 'AI Practice Labs', Icon: FlaskConical },
  { id: 'skill_passport', label: 'Digital Skill Passport', Icon: BadgeCheck },
  { id: 'faculty_dashboard', label: 'Faculty Command Center', Icon: LayoutDashboard },
];

function DashboardShell({ student, discipline, onLogout }) {
  const [view, setView] = useState('curriculum');
  const initial = student.name.trim().charAt(0).toUpperCase() || '?';
  const viewTitles = {
    curriculum: 'Syllabus & Curriculum', practice_labs: 'AI Practice Labs',
    skill_passport: 'Digital Skill Passport', faculty_dashboard: 'Faculty Command Center',
  };

  return (
    <div className="shell">
      <div className="shell-sidebar">
        <div className="shell-logo">
          <div className="shell-logo-mark"><GraduationCap size={17} /></div>
          Philippines AI University
        </div>
        {NAV.map(n => (
          <button key={n.id} className={`shell-nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
            <n.Icon size={17} /><span>{n.label}</span>
          </button>
        ))}
        <div className="shell-nav-spacer" />
        <hr className="shell-nav-divider" />
        <button className="shell-nav-item" onClick={onLogout}><LogOut size={17} /><span>Switch Program</span></button>
      </div>
      <div className="shell-main">
        <div className="shell-header">
          <div>
            <h1>{viewTitles[view]}</h1>
            <div className="shell-header-sub">{discipline.title}</div>
          </div>
          <div className="shell-student">
            <div className="shell-student-avatar">{initial}</div>
            {student.name}
          </div>
        </div>
        {view === 'curriculum' && <ModuleCatalogView student={student} discipline={discipline} />}
        {view === 'practice_labs' && <PracticeLabsView student={student} discipline={discipline} />}
        {view === 'skill_passport' && <SkillPassportView student={student} />}
        {view === 'faculty_dashboard' && <FacultyDashboardView />}
      </div>
    </div>
  );
}

export default function App() {
  const [student, setStudent] = useState(() => { try { return JSON.parse(localStorage.getItem('ph_student')); } catch { return null; } });
  const [discipline, setDiscipline] = useState(() => { try { return JSON.parse(localStorage.getItem('ph_discipline')); } catch { return null; } });

  function handleLogout() {
    localStorage.removeItem('ph_student');
    localStorage.removeItem('ph_discipline');
    setStudent(null); setDiscipline(null);
  }

  if (!student || !discipline) {
    return <LoginGate onEnter={(s, d) => { setStudent(s); setDiscipline(d); }} />;
  }
  return <DashboardShell student={student} discipline={discipline} onLogout={handleLogout} />;
}
