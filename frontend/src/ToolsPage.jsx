import React, { useState, useRef, useEffect } from 'react';

// ─── DATA ──────────────────────────────────────────────────────────────────

const SALARY_DATA = [
  { role: 'Regulatory Affairs Scientist',    cat: 'regulatory', region: 'india', range: '₹4–12 LPA',   exp: '0–3 yrs' },
  { role: 'Senior RA Manager',               cat: 'regulatory', region: 'india', range: '₹14–28 LPA',  exp: '5–10 yrs' },
  { role: 'Regulatory Affairs Associate',    cat: 'regulatory', region: 'us',    range: '$65–90K',      exp: '1–3 yrs' },
  { role: 'Regulatory Affairs Director',     cat: 'regulatory', region: 'us',    range: '$130–180K',    exp: '10+ yrs' },
  { role: 'Clinical Research Associate',     cat: 'clinical',   region: 'india', range: '₹3.5–8 LPA',  exp: '0–2 yrs' },
  { role: 'Senior CRA',                      cat: 'clinical',   region: 'india', range: '₹10–20 LPA',  exp: '4–8 yrs' },
  { role: 'Clinical Research Associate',     cat: 'clinical',   region: 'us',    range: '$60–85K',      exp: '1–3 yrs' },
  { role: 'Clinical Trial Manager',          cat: 'clinical',   region: 'us',    range: '$95–130K',     exp: '5–8 yrs' },
  { role: 'QA Specialist',                   cat: 'quality',    region: 'india', range: '₹3–7 LPA',    exp: '0–2 yrs' },
  { role: 'QA Manager',                      cat: 'quality',    region: 'india', range: '₹12–22 LPA',  exp: '6–10 yrs' },
  { role: 'QA Specialist',                   cat: 'quality',    region: 'us',    range: '$60–80K',      exp: '1–4 yrs' },
  { role: 'Head of Quality',                 cat: 'quality',    region: 'us',    range: '$110–155K',    exp: '10+ yrs' },
  { role: 'Pharmacovigilance Scientist',     cat: 'safety',     region: 'india', range: '₹4–10 LPA',   exp: '1–4 yrs' },
  { role: 'Drug Safety Associate',           cat: 'safety',     region: 'us',    range: '$55–80K',      exp: '0–3 yrs' },
  { role: 'Medical Science Liaison',         cat: 'medical',    region: 'india', range: '₹12–30 LPA',  exp: '3–8 yrs' },
  { role: 'Medical Science Liaison',         cat: 'medical',    region: 'us',    range: '$130–200K',    exp: '5+ yrs' },
  { role: 'Bioprocess Engineer',             cat: 'research',   region: 'india', range: '₹5–14 LPA',   exp: '1–5 yrs' },
  { role: 'Bioprocess Engineer',             cat: 'research',   region: 'us',    range: '$75–115K',     exp: '2–6 yrs' },
  { role: 'Research Scientist',              cat: 'research',   region: 'india', range: '₹6–18 LPA',   exp: '2–6 yrs' },
  { role: 'Research Scientist',              cat: 'research',   region: 'us',    range: '$80–120K',     exp: '3–7 yrs' },
  { role: 'Clinical Data Manager',           cat: 'clinical',   region: 'india', range: '₹5–14 LPA',   exp: '1–5 yrs' },
  { role: 'Clinical Data Manager',           cat: 'clinical',   region: 'us',    range: '$75–110K',     exp: '3–7 yrs' },
  { role: 'Medical Writer',                  cat: 'medical',    region: 'india', range: '₹4–16 LPA',   exp: '1–6 yrs' },
  { role: 'Medical Writer',                  cat: 'medical',    region: 'us',    range: '$70–110K',     exp: '2–7 yrs' },
  { role: 'Validation Engineer',             cat: 'quality',    region: 'india', range: '₹4–14 LPA',   exp: '1–5 yrs' },
];

const ROLES = [
  { title: 'Regulatory Affairs Scientist', salary: '₹4–28 LPA / $65–180K', desc: 'Ensure pharmaceutical products meet regulatory requirements for global market approval. Prepare and submit CTDs to agencies like CDSCO, FDA, and EMA.', skills: ['CTD/eCTD', 'ICH Guidelines', 'FDA/EMA Submissions', 'Regulatory Strategy'], growth: 'High' },
  { title: 'Clinical Research Associate (CRA)', salary: '₹3.5–20 LPA / $60–130K', desc: 'Monitor clinical trials at investigator sites, ensuring data quality, patient safety, and protocol compliance with GCP guidelines.', skills: ['GCP', 'Site Monitoring', 'CTMS', 'ICH E6'], growth: 'High' },
  { title: 'Quality Assurance Specialist', salary: '₹3–22 LPA / $60–155K', desc: 'Develop and maintain quality systems ensuring products meet GMP, GCP, and regulatory standards. Conduct audits and manage deviations.', skills: ['GMP', 'Quality Systems', 'Auditing', 'CAPA'], growth: 'Stable' },
  { title: 'Pharmacovigilance Scientist', salary: '₹4–22 LPA / $55–100K', desc: 'Monitor, detect, and assess adverse drug reactions post-launch. Ensure compliance with global pharmacovigilance regulations.', skills: ['ICSRs', 'PSUR/PBRER', 'MedDRA', 'Signal Detection'], growth: 'High' },
  { title: 'Medical Science Liaison (MSL)', salary: '₹12–35 LPA / $130–200K', desc: 'Field-based scientific experts who engage with Key Opinion Leaders and healthcare professionals to communicate complex medical data.', skills: ['KOL Engagement', 'Scientific Presentations', 'Medical Communication', 'Therapy Expertise'], growth: 'High' },
  { title: 'Clinical Data Manager', salary: '₹5–14 LPA / $75–110K', desc: 'Manage clinical trial data from collection to clean-up, ensuring data integrity and regulatory compliance for statistical analysis.', skills: ['Oracle/Medidata', 'CDISC Standards', 'Data Cleaning', 'DMP Writing'], growth: 'Stable' },
  { title: 'Bioprocess Engineer', salary: '₹5–14 LPA / $75–115K', desc: 'Design and optimize biological manufacturing processes for biologics, vaccines, and biosimilars at lab and commercial scale.', skills: ['Upstream Processing', 'GMP Manufacturing', 'Scale-up', 'PAT Tools'], growth: 'High' },
  { title: 'Drug Safety Associate', salary: '₹3.5–10 LPA / $55–80K', desc: 'Process and report adverse event cases from clinical trials and post-marketing, maintaining global safety databases.', skills: ['Case Processing', 'E2B Submissions', 'ARISg/Veeva', 'Medical Coding'], growth: 'Stable' },
  { title: 'Medical Writer', salary: '₹4–18 LPA / $70–110K', desc: 'Produce regulatory documents, CSRs, manuscripts, and patient information leaflets that meet ICH guidelines.', skills: ['CSR Writing', 'ICH E3', 'ICMJE Guidelines', 'eCTD Module 5'], growth: 'Stable' },
  { title: 'Validation Engineer', salary: '₹4–14 LPA / $65–100K', desc: 'Validate pharmaceutical equipment, facilities, and computerized systems for GMP and regulatory compliance.', skills: ['IQ/OQ/PQ', '21 CFR Part 11', 'CSV', 'Risk Assessment'], growth: 'Stable' },
  { title: 'Clinical Operations Manager', salary: '₹12–35 LPA / $95–160K', desc: 'Oversee clinical trial delivery from start-up to close-out, managing CROs, timelines, budgets, and cross-functional teams.', skills: ['Trial Management', 'CRO Oversight', 'Risk Management', 'Budget Control'], growth: 'High' },
  { title: 'Bioinformatics Scientist', salary: '₹6–20 LPA / $80–130K', desc: 'Apply computational tools to analyze biological data including genomics, proteomics, and clinical trial datasets.', skills: ['Python/R', 'NGS Analysis', 'Bioconductor', 'Statistical Modeling'], growth: 'Very High' },
];

const QUIZ_QUESTIONS = [
  {
    q: 'What best describes your background?',
    opts: ['Pharmacy / Pharmaceutical Sciences', 'Biotechnology / Life Sciences', 'Chemistry / Biochemistry', 'Engineering (Chemical / Biomedical)', 'Medical / MBBS / BDS', 'Non-science (MBA, Commerce, Arts)'],
  },
  {
    q: 'What kind of work environment excites you?',
    opts: ['Working with regulations and ensuring compliance', 'Working directly with patients or clinical teams', 'Laboratory experiments and research', 'Analysing data and documentation', 'Training, presenting, and advising', 'Manufacturing and production processes'],
  },
  {
    q: 'What is your biggest career goal?',
    opts: ['Join a top pharma or biotech company', 'Transition into life sciences from another field', 'Move into a higher-paying specialist role', 'Work with global healthcare companies', 'Build a niche expertise', 'Work internationally (US, EU, Singapore)'],
  },
  {
    q: 'Which type of task do you enjoy most?',
    opts: ['Reviewing documents and ensuring safety standards', 'Running or managing clinical studies', 'Investigating patient safety and adverse events', 'Analysing clinical or lab data', 'Briefing doctors and scientists on new science', 'Optimising manufacturing processes'],
  },
  {
    q: 'How much life sciences experience do you have?',
    opts: ['Fresher / student (0–1 year)', 'Early career (1–3 years)', 'Mid-level (3–7 years)', 'Senior professional (7+ years)'],
  },
  {
    q: 'Which skills are you most interested in developing?',
    opts: ['Regulatory submissions and CTD dossiers', 'GCP, ICH guidelines, clinical operations', 'Pharmacovigilance and drug safety reporting', 'Biostatistics and clinical data management', 'Medical communication and MSL skills', 'GMP and quality assurance systems'],
  },
];

const QUIZ_RESULTS = [
  { track: 'Regulatory Affairs', icon: '⚖', desc: 'You have the profile for Regulatory Affairs — ensuring life-saving drugs meet global standards before reaching patients. Demand is surging in India, US, and EU.' },
  { track: 'Clinical Research', icon: '🧪', desc: 'Clinical Research is your path — designing and running clinical trials that bring new treatments to patients. One of the highest-growth fields in pharma today.' },
  { track: 'Pharmacovigilance', icon: '🛡', desc: 'Pharmacovigilance suits your analytical instinct — monitoring drug safety after launch. Every pharma company in the world needs this expertise.' },
  { track: 'Clinical Data Management', icon: '📊', desc: 'Clinical Data Management fits your analytical mind — managing the data backbone of clinical trials. High demand globally with strong remote opportunities.' },
  { track: 'Medical Science Liaison', icon: '🧬', desc: 'MSL is your match — combining deep scientific expertise with communication to advise healthcare professionals. The highest-paid field-based role in pharma.' },
  { track: 'Quality Assurance & GMP', icon: '✅', desc: 'QA / GMP is where you belong — ensuring that medicines are safe, effective, and manufactured to the highest global standards.' },
];

const GAP_DATA = {
  'pharma|ra':       { have: ['Pharmaceutical Sciences', 'Drug Formulation', 'ICH Awareness', 'Pharmacology'], missing: ['CTD/eCTD Writing', 'Regulatory Strategy', 'FDA/EMA Submissions', 'Module 2–5 Dossiers'], path: ['Regulatory Affairs', 'Drug Development Lifecycle'] },
  'pharma|cra':      { have: ['GCP Awareness', 'Clinical Terminology', 'Subject Safety'], missing: ['Site Monitoring Skills', 'CTMS Tools', 'Protocol Deviation Handling', 'TMF Management'], path: ['Clinical Research Operations', 'GCP & ICH Guidelines'] },
  'pharma|qa':       { have: ['GMP Fundamentals', 'Pharmaceutical QC', 'Lab Compliance'], missing: ['CAPA Management', 'Audit Techniques', 'Quality Risk Management', 'Deviation Investigation'], path: ['GMP & Quality Systems', 'Regulatory Compliance'] },
  'pharma|msl':      { have: ['Scientific Knowledge', 'Pharmacology', 'Drug Mechanisms'], missing: ['KOL Engagement Strategy', 'Scientific Communication', 'Medical Plan Development', 'Field Medical Compliance'], path: ['Medical Affairs & MSL', 'Scientific Communication'] },
  'pharma|pv':       { have: ['Pharmacology', 'Drug Safety Awareness', 'Clinical Terminology'], missing: ['ICSR Processing', 'MedDRA Coding', 'Signal Detection Methods', 'PBRER/PSUR Writing'], path: ['Pharmacovigilance', 'Drug Safety Operations'] },
  'biotech|ra':      { have: ['Biology/Biochemistry', 'Research Methodology'], missing: ['Regulatory Writing', 'CTD Module Structure', 'ICH Q-Series', 'CDSCO/FDA Guidelines'], path: ['Regulatory Affairs', 'CMC Regulatory Science'] },
  'biotech|cra':     { have: ['Scientific Background', 'Analytical Skills'], missing: ['GCP Certification', 'Clinical Site Monitoring', 'eTMF Management', 'Data Cleaning Review'], path: ['Clinical Research', 'GCP Guidelines'] },
  'biotech|pv':      { have: ['Biology Knowledge', 'Research Skills'], missing: ['Pharmacovigilance Regulations', 'MedDRA', 'Case Processing', 'ICSR Writing'], path: ['Pharmacovigilance', 'Medical Terminology'] },
  'lifesci|ra':      { have: ['Life Sciences Foundation', 'Research Background'], missing: ['Regulatory Frameworks', 'CTD Writing', 'ICH Q/E/S Tripartite Guidelines', 'Global Submission Strategy'], path: ['Regulatory Affairs', 'Quality & Compliance'] },
  'engineering|bp':  { have: ['Engineering Fundamentals', 'Process Understanding', 'Scale-up Concepts'], missing: ['Bioprocess Validation', 'GMP Manufacturing SOPs', 'Batch Record Review', 'PAT Tools'], path: ['Bioprocess Engineering', 'GMP Compliance'] },
  'medical|msl':     { have: ['Clinical Knowledge', 'Patient Communication', 'Medical Terminology'], missing: ['MSL Role Framework', 'KOL Mapping', 'Medical Plan Execution', 'Pharma Compliance Rules'], path: ['Medical Science Liaison', 'Medical Affairs'] },
  'nonscience|pv':   { have: ['Data Handling', 'Attention to Detail', 'Communication Skills'], missing: ['Medical Terminology', 'MedDRA Coding', 'ICSR Processing', 'Pharmacology Basics'], path: ['Pharmacovigilance Basics', 'Medical Terminology for Non-Scientists'] },
};

// ─── ICONS ─────────────────────────────────────────────────────────────────

const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const s = { width: size, height: size, stroke: color, fill: 'none', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    file:      <svg viewBox="0 0 24 24" style={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    quiz:      <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    dollar:    <svg viewBox="0 0 24 24" style={s}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    search:    <svg viewBox="0 0 24 24" style={s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    chart:     <svg viewBox="0 0 24 24" style={s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    linkedin:  <svg viewBox="0 0 24 24" style={s}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
    arrow:     <svg viewBox="0 0 24 24" style={s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    x:         <svg viewBox="0 0 24 24" style={s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check:     <svg viewBox="0 0 24 24" style={s}><polyline points="20 6 9 17 4 12"/></svg>,
    copy:      <svg viewBox="0 0 24 24" style={s}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    bversity:  <svg viewBox="0 0 28 28" style={{ width: 28, height: 28 }}><rect width="28" height="28" rx="7" fill="#07142A"/><text x="14" y="20" textAnchor="middle" fontFamily="Satoshi" fontWeight="900" fontSize="16" fill="#16c1ad">B</text></svg>,
  };
  return icons[name] || null;
};

// ─── MODAL ─────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, subtitle, icon, wide, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="tp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`tp-modal ${wide ? 'tp-modal--wide' : ''}`}>
        <button className="tp-modal-close" onClick={onClose}><Icon name="x" size={16} /></button>
        <div className="tp-modal-hdr">
          <div className="tp-tool-icon">{icon}</div>
          <div>
            <div className="tp-modal-title">{title}</div>
            {subtitle && <div className="tp-modal-sub">{subtitle}</div>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── CV REVIEWER ───────────────────────────────────────────────────────────

function CVReviewer({ onClose }) {
  const [role, setRole] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const roles = ['Regulatory Affairs Scientist', 'Clinical Research Associate', 'Quality Assurance Specialist', 'Medical Science Liaison', 'Pharmacovigilance Scientist', 'Bioprocess Engineer', 'Clinical Data Manager', 'Medical Writer', 'Drug Safety Associate'];

  async function submit() {
    if (!text.trim()) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/tools/cv-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_text: text, target_role: role || 'Biotech / Life Sciences' }),
      });
      const d = await r.json();
      setResult(d.feedback);
    } catch {
      setResult(`Here are key improvements for your CV:\n\n1. **Professional Summary** — Add a 3–4 line summary tailored to ${role || 'your target role'}, mentioning years of experience and key skills.\n\n2. **Skills Section** — Include specific tools like CTMS, eTMF, EDC systems (Medidata, Oracle), or regulatory databases.\n\n3. **Quantified Impact** — Replace generic statements with numbers. Instead of "managed trials", say "managed Phase II oncology trial with 120 patients across 6 sites."\n\n4. **Keywords** — Add GCP, ICH guidelines, 21 CFR Part 11, or other regulatory keywords for ATS screening.\n\n5. **Certifications** — If you have RAPS, ACRP, or any GCP certifications, list them prominently near the top.`);
    }
    setLoading(false);
  }

  return (
    <div className="tp-form-body">
      <div className="tp-field">
        <label className="tp-label">Target Role</label>
        <select className="tp-select" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">Select a role (optional)</option>
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="tp-field">
        <label className="tp-label">Paste your CV / Resume</label>
        <textarea className="tp-textarea" value={text} onChange={e => setText(e.target.value)} placeholder="Paste your full CV here — summary, experience, education, skills..." />
        <div className="tp-hint">Your CV is never stored. Used only to generate feedback.</div>
      </div>
      <button className="tp-submit" onClick={submit} disabled={loading || !text.trim()}>
        {loading ? <><span className="tp-spinner" />Reviewing…</> : 'Review my CV →'}
      </button>
      {result && <ResultBox label="AI Feedback">{<FeedbackText text={result} />}</ResultBox>}
    </div>
  );
}

function FeedbackText({ text }) {
  const lines = text.split('\n').filter(Boolean);
  return (
    <div className="tp-feedback">
      {lines.map((line, i) => {
        if (line.match(/^\d+\./)) {
          const bold = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          return <div key={i} className="tp-fb-item" dangerouslySetInnerHTML={{ __html: bold }} />;
        }
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

// ─── CAREER QUIZ ───────────────────────────────────────────────────────────

function CareerQuiz({ onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);

  function pick(i) { setSelected(i); }

  function next() {
    if (selected === null) return;
    const next = [...answers, selected];
    setAnswers(next);
    setSelected(null);
    if (step + 1 >= QUIZ_QUESTIONS.length) {
      setDone(true);
    } else {
      setStep(s => s + 1);
    }
  }

  function restart() { setStep(0); setAnswers([]); setSelected(null); setDone(false); }

  const freq = {};
  answers.forEach(a => { freq[a % 6] = (freq[a % 6] || 0) + 1; });
  const topIdx = done ? parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0) : 0;
  const result = QUIZ_RESULTS[topIdx];

  if (done) {
    return (
      <div className="tp-quiz-result">
        <div className="tp-quiz-result-label">Your best match</div>
        <div className="tp-quiz-result-track">{result.track}</div>
        <div className="tp-quiz-result-desc">{result.desc}</div>
        <div className="tp-quiz-result-btns">
          <button className="tp-submit" onClick={() => window.location.href = '/'}>Start {result.track} on Bversity →</button>
          <button className="tp-ghost-btn" onClick={restart}>Retake quiz</button>
        </div>
      </div>
    );
  }

  const q = QUIZ_QUESTIONS[step];

  return (
    <div className="tp-quiz-body">
      <div className="tp-quiz-progress">
        {QUIZ_QUESTIONS.map((_, i) => (
          <div key={i} className={`tp-quiz-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
        ))}
      </div>
      <div className="tp-quiz-counter">{step + 1} / {QUIZ_QUESTIONS.length}</div>
      <div className="tp-quiz-q">{q.q}</div>
      <div className="tp-quiz-opts">
        {q.opts.map((opt, i) => (
          <button key={i} className={`tp-quiz-opt ${selected === i ? 'selected' : ''}`} onClick={() => pick(i)}>
            <div className="tp-quiz-opt-dot" />
            {opt}
          </button>
        ))}
      </div>
      <div className="tp-quiz-nav">
        <button className="tp-submit" style={{ marginTop: 0 }} onClick={next} disabled={selected === null}>
          {step === QUIZ_QUESTIONS.length - 1 ? 'See My Result →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

// ─── SALARY EXPLORER ───────────────────────────────────────────────────────

function SalaryExplorer() {
  const [region, setRegion] = useState('all');
  const [cat, setCat] = useState('all');

  const filtered = SALARY_DATA.filter(d =>
    (region === 'all' || d.region === region) &&
    (cat === 'all' || d.cat === cat)
  );

  const catLabels = { regulatory: 'Regulatory', clinical: 'Clinical', quality: 'Quality', safety: 'Safety', medical: 'Medical Affairs', research: 'Research' };

  return (
    <div>
      <div className="tp-sal-filters">
        <div className="tp-field">
          <label className="tp-label">Region</label>
          <select className="tp-select" value={region} onChange={e => setRegion(e.target.value)}>
            <option value="all">All Regions</option>
            <option value="india">India</option>
            <option value="us">United States</option>
          </select>
        </div>
        <div className="tp-field">
          <label className="tp-label">Function</label>
          <select className="tp-select" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="all">All Functions</option>
            {Object.entries(catLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div className="tp-sal-table-wrap">
        <table className="tp-sal-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Function</th>
              <th>Region</th>
              <th>Salary Range</th>
              <th>Experience</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={i}>
                <td className="tp-sal-role">{d.role}</td>
                <td><span className="tp-tag">{catLabels[d.cat]}</span></td>
                <td><span className="tp-tag">{d.region === 'india' ? 'India' : 'US'}</span></td>
                <td className="tp-sal-range">{d.range}</td>
                <td className="tp-sal-exp">{d.exp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tp-hint" style={{ marginTop: 12 }}>Based on industry data. Actual compensation varies by company, city, and experience level.</p>
    </div>
  );
}

// ─── ROLE EXPLORER ─────────────────────────────────────────────────────────

function RoleExplorer() {
  const [q, setQ] = useState('');
  const filtered = ROLES.filter(r =>
    !q || r.title.toLowerCase().includes(q.toLowerCase()) ||
    r.desc.toLowerCase().includes(q.toLowerCase()) ||
    r.skills.some(s => s.toLowerCase().includes(q.toLowerCase()))
  );
  const growthColor = { High: '#4ade80', 'Very High': '#16c1ad', Stable: '#94a3b8' };

  return (
    <div>
      <div className="tp-role-search">
        <span className="tp-role-search-icon"><Icon name="search" size={16} color="#64748b" /></span>
        <input className="tp-role-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search roles, skills, e.g. regulatory, GCP…" />
      </div>
      <div className="tp-role-list">
        {filtered.map((r, i) => (
          <div key={i} className="tp-role-card">
            <div className="tp-role-hdr">
              <div className="tp-role-title">{r.title}</div>
              <div className="tp-role-salary">{r.salary}</div>
            </div>
            <div className="tp-role-desc">{r.desc}</div>
            <div className="tp-role-footer">
              <div className="tp-role-skills">
                {r.skills.map(s => <span key={s} className="tp-skill-tag">{s}</span>)}
              </div>
              <div className="tp-role-growth" style={{ color: growthColor[r.growth] || '#94a3b8' }}>
                {r.growth} demand
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SKILLS GAP ────────────────────────────────────────────────────────────

function SkillsGap() {
  const [bg, setBg] = useState('');
  const [target, setTarget] = useState('');
  const [result, setResult] = useState(null);

  const backgrounds = [
    ['pharma', 'Pharmacy / Pharmaceutical Sciences (B.Pharm, M.Pharm)'],
    ['biotech', 'Biotechnology / Biochemistry Graduate'],
    ['lifesci', 'Life Sciences (Biology, Microbiology, Genetics)'],
    ['engineering', 'Engineering (Chemical, Biomedical)'],
    ['medical', 'Medical / MBBS / BDS'],
    ['nonscience', 'Non-Science Background (MBA, Commerce, Arts)'],
  ];

  const targets = [
    ['ra', 'Regulatory Affairs Scientist'],
    ['cra', 'Clinical Research Associate (CRA)'],
    ['qa', 'Quality Assurance Specialist'],
    ['msl', 'Medical Science Liaison (MSL)'],
    ['pv', 'Pharmacovigilance Scientist'],
    ['bp', 'Bioprocess Engineer'],
  ];

  function analyze() {
    if (!bg || !target) return;
    const key = `${bg}|${target}`;
    setResult(GAP_DATA[key] || {
      have: ['Your educational background', 'Domain knowledge from your degree', 'Analytical and communication skills'],
      missing: ['Role-specific technical skills', 'Industry tools and software', 'Regulatory domain knowledge', 'Practical hands-on experience'],
      path: ['Regulatory Affairs', 'Clinical Research', 'Quality Assurance'],
    });
  }

  function reset() { setResult(null); setBg(''); setTarget(''); }

  if (result) {
    return (
      <div className="tp-gap-result">
        <div className="tp-gap-section">
          <div className="tp-gap-title tp-gap-have">Skills you already have</div>
          <div className="tp-gap-chips">{result.have.map(s => <span key={s} className="tp-chip tp-chip--have">{s}</span>)}</div>
        </div>
        <div className="tp-gap-section">
          <div className="tp-gap-title tp-gap-missing">Skills you need to develop</div>
          <div className="tp-gap-chips">{result.missing.map(s => <span key={s} className="tp-chip tp-chip--missing">{s}</span>)}</div>
        </div>
        <div className="tp-gap-section">
          <div className="tp-gap-title tp-gap-path">Recommended Bversity subjects</div>
          <div className="tp-gap-chips">{result.path.map(s => <span key={s} className="tp-chip tp-chip--path">{s}</span>)}</div>
        </div>
        <button className="tp-submit" onClick={() => window.location.href = '/'}>Start Learning These on Bversity →</button>
        <button className="tp-ghost-btn" onClick={reset}>Analyse again</button>
      </div>
    );
  }

  return (
    <div className="tp-form-body">
      <div className="tp-field">
        <label className="tp-label">Your Background</label>
        <select className="tp-select" value={bg} onChange={e => setBg(e.target.value)}>
          <option value="">Select your background…</option>
          {backgrounds.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="tp-field">
        <label className="tp-label">Target Role</label>
        <select className="tp-select" value={target} onChange={e => setTarget(e.target.value)}>
          <option value="">Select your target role…</option>
          {targets.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <button className="tp-submit" onClick={analyze} disabled={!bg || !target}>Analyse My Skills Gap →</button>
    </div>
  );
}

// ─── LINKEDIN OPTIMIZER ────────────────────────────────────────────────────

function LinkedInOptimizer() {
  const [role, setRole] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState('');

  const roles = ['Regulatory Affairs Scientist', 'Clinical Research Associate', 'Quality Assurance Specialist', 'Medical Science Liaison', 'Pharmacovigilance Scientist', 'Bioprocess Engineer', 'Clinical Data Manager', 'Medical Writer'];

  async function submit() {
    if (!role || !title) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/tools/linkedin-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_role: role, current_title: title, current_bio: bio }),
      });
      const d = await r.json();
      setResult(d);
    } catch {
      setResult({
        headline: `${role} | Building Expertise in Life Sciences | Open to Opportunities in Pharma & Biotech`,
        about: `I am a life sciences professional with a background in ${title}, now focused on building specialist expertise in ${role}.\n\nI am passionate about the intersection of science and industry — understanding how rigorous processes, global regulations, and scientific evidence come together to bring safe and effective medicines to patients.\n\nCurrently deepening my expertise through structured training in ${role} best practices, GCP/GMP compliance, and the global regulatory landscape.\n\nOpen to entry-level and junior opportunities in ${role}. Let's connect if you are in the life sciences space.`,
      });
    }
    setLoading(false);
  }

  function copy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="tp-form-body">
      <div className="tp-2col">
        <div className="tp-field">
          <label className="tp-label">Target Role</label>
          <select className="tp-select" value={role} onChange={e => setRole(e.target.value)}>
            <option value="">Select target role…</option>
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="tp-field">
          <label className="tp-label">Current Job Title</label>
          <input className="tp-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. M.Pharm Graduate, QA Executive…" />
        </div>
      </div>
      <div className="tp-field">
        <label className="tp-label">Current LinkedIn About (optional)</label>
        <textarea className="tp-textarea" style={{ minHeight: 80 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Paste your current About section, or leave blank to generate from scratch…" />
      </div>
      <button className="tp-submit" onClick={submit} disabled={loading || !role || !title}>
        {loading ? <><span className="tp-spinner" />Optimising…</> : 'Optimise my LinkedIn →'}
      </button>

      {result && (
        <div className="tp-li-results">
          <div className="tp-li-block">
            <div className="tp-li-block-hdr">
              <span className="tp-li-block-label">Headline</span>
              <button className="tp-copy-btn" onClick={() => copy(result.headline, 'headline')}>
                {copied === 'headline' ? <Icon name="check" size={14} color="#4ade80" /> : <Icon name="copy" size={14} />}
                {copied === 'headline' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="tp-li-headline">{result.headline}</div>
          </div>
          <div className="tp-li-block">
            <div className="tp-li-block-hdr">
              <span className="tp-li-block-label">About Section</span>
              <button className="tp-copy-btn" onClick={() => copy(result.about, 'about')}>
                {copied === 'about' ? <Icon name="check" size={14} color="#4ade80" /> : <Icon name="copy" size={14} />}
                {copied === 'about' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="tp-li-about">{result.about}</div>
          </div>
          <button className="tp-submit" onClick={() => window.location.href = '/'}>Build skills to back this up →</button>
        </div>
      )}
    </div>
  );
}

// ─── RESULT BOX ────────────────────────────────────────────────────────────

function ResultBox({ label, children }) {
  return (
    <div className="tp-result-box">
      <div className="tp-result-label">{label}</div>
      {children}
      <div className="tp-result-cta">
        <p>Want guided training to back this up?</p>
        <button className="tp-submit" style={{ marginTop: 10 }} onClick={() => window.location.href = '/'}>Start learning free on Bversity →</button>
      </div>
    </div>
  );
}

// ─── TOOL DEFINITIONS ──────────────────────────────────────────────────────

const TOOLS = [
  { id: 'cv',       icon: 'file',     label: 'CV Reviewer',        badge: 'AI',         desc: 'Get instant, biotech-specific feedback on your CV. Tailored to your target role in pharma or life sciences.',     Component: CVReviewer,        title: 'CV / Resume Reviewer',    subtitle: 'Biotech-specific feedback in under 30 seconds' },
  { id: 'quiz',     icon: 'quiz',     label: 'Career Track Finder', badge: '5 min',      desc: 'Answer 6 questions and discover exactly which biotech career track matches your background and ambitions.',       Component: CareerQuiz,        title: 'Career Track Finder',     subtitle: '6 questions · under 3 minutes' },
  { id: 'salary',   icon: 'dollar',   label: 'Salary Explorer',     badge: '25+ roles',  desc: 'Browse compensation data for 25+ biotech and life sciences roles across India and the United States.',            Component: SalaryExplorer,    title: 'Salary Explorer',         subtitle: 'Compensation data across India and the US', wide: true },
  { id: 'roles',    icon: 'search',   label: 'Role Explorer',       badge: '12 roles',   desc: 'Understand what any biotech role actually involves — responsibilities, skills required, and career growth.',       Component: RoleExplorer,      title: 'Biotech Role Explorer',   subtitle: 'Browse life sciences careers in detail', wide: true },
  { id: 'gap',      icon: 'chart',    label: 'Skills Gap Analyser', badge: 'Instant',    desc: 'Tell us where you are and where you want to go. We show you the exact skills gap and how to close it.',           Component: SkillsGap,         title: 'Skills Gap Analyser',     subtitle: 'Find exactly what you need to learn next' },
  { id: 'linkedin', icon: 'linkedin', label: 'LinkedIn Optimiser',  badge: 'AI',         desc: 'Get an AI-written LinkedIn headline and About section built for biotech hiring managers to notice.',               Component: LinkedInOptimizer, title: 'LinkedIn Profile Optimiser', subtitle: 'Stand out to biotech and pharma recruiters' },
];

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const [open, setOpen] = useState(null);
  const active = TOOLS.find(t => t.id === open);

  useEffect(() => {
    document.title = 'Free Biotech Career Tools — Bversity';
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.type = 'image/svg+xml';
    link.href = '/favicon.svg';
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="tp-root">

        {/* NAV */}
        <nav className="tp-nav">
          <div className="tp-nav-inner">
            <a href="/" className="tp-nav-logo">
              <Icon name="bversity" />
              <span>Bversity</span>
            </a>
            <a href="/" className="tp-nav-cta">Start Learning Free →</a>
          </div>
        </nav>

        {/* HERO */}
        <section className="tp-hero">
          <div className="tp-hero-inner">
            <div className="tp-hero-badge">
              <span className="tp-hero-badge-dot" />
              Free Tools · No Login Required
            </div>
            <h1 className="tp-hero-h1">
              Free tools for your<br />
              <em className="tp-hero-accent">biotech career</em>
            </h1>
            <p className="tp-hero-sub">
              AI-powered tools built for pharma and life sciences professionals.
              Get real feedback, explore roles, and find your path — free, no account needed.
            </p>
            <div className="tp-hero-stats">
              {[['6', 'Free tools'], ['25+', 'Roles covered'], ['0', 'Sign-ups needed']].map(([n, l]) => (
                <div key={l} className="tp-hero-stat">
                  <span className="tp-hero-stat-n">{n}</span>
                  <span className="tp-hero-stat-l">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TOOLS BENTO GRID */}
        <section className="tp-section">
          <div className="tp-section-label">All Tools</div>
          <div className="tp-grid">
            {TOOLS.map((tool, i) => (
              <div
                key={tool.id}
                className={`tp-card ${i === 0 || i === 3 ? 'tp-card--wide' : ''}`}
                onClick={() => setOpen(tool.id)}
              >
                <div className="tp-card-top">
                  <div className="tp-tool-icon">
                    <Icon name={tool.icon} size={22} color="var(--teal-light)" />
                  </div>
                  <span className="tp-badge">{tool.badge}</span>
                </div>
                <div className="tp-card-body">
                  <div className="tp-card-title">{tool.label}</div>
                  <div className="tp-card-desc">{tool.desc}</div>
                </div>
                <div className="tp-card-cta">
                  Open tool <Icon name="arrow" size={14} color="var(--teal)" />
                </div>
                <div className="tp-card-glow" />
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="tp-cta-section">
          <div className="tp-cta-inner">
            <div className="tp-cta-label">Ready to go deeper?</div>
            <h2 className="tp-cta-h2">These tools are a preview.<br /><em>The full platform</em> is where learning happens.</h2>
            <p className="tp-cta-sub">Structured career pathways, AI-guided study sessions, concept-by-concept mastery, and a roadmap built for your specific career goal. Completely free to start.</p>
            <div className="tp-cta-btns">
              <a href="/" className="tp-submit tp-cta-primary">Start Learning Free →</a>
              <a href="/" className="tp-ghost-btn" style={{color:'rgba(255,255,255,0.7)', borderColor:'rgba(255,255,255,0.2)'}}>Explore subjects</a>
            </div>
          </div>
        </section>

        <footer className="tp-footer">
          <p>© 2025 Bversity · Built for Biotech & Life Sciences · <a href="mailto:hello@bversity.io">hello@bversity.io</a></p>
        </footer>
      </div>

      {/* MODAL */}
      {active && (
        <Modal
          open={!!open}
          onClose={() => setOpen(null)}
          title={active.title}
          subtitle={active.subtitle}
          icon={<Icon name={active.icon} size={22} color="var(--teal-light)" />}
          wide={active.wide}
        >
          <active.Component onClose={() => setOpen(null)} />
        </Modal>
      )}
    </>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');

  .tp-root {
    --bg:         #F8F6F1;
    --bg-white:   #FFFFFF;
    --bg-teal:    #EAF8F6;
    --navy:       #07142A;
    --navy-2:     #0d2035;
    --teal:       #16c1ad;
    --teal-d:     #0ea896;
    --teal-light: #4dd4c4;
    --teal-pale:  rgba(22,193,173,0.08);
    --teal-pale2: rgba(22,193,173,0.14);
    --text-1:     #0F1923;
    --text-2:     #4a5568;
    --text-3:     #9A9490;
    --border:     #E8E4DC;
    --border-t:   rgba(22,193,173,0.3);
    --shadow-card: 0 1px 3px rgba(7,20,42,0.06), 0 0 0 1px #E8E4DC;
    --shadow-hover: 0 8px 32px rgba(7,20,42,0.1), 0 0 0 1px rgba(22,193,173,0.2);
    --radius:     10px;
    --radius-lg:  14px;
    --serif:      'DM Serif Display', Georgia, serif;
    min-height: 100vh;
    background: var(--bg);
    font-family: 'Satoshi', -apple-system, sans-serif;
    color: var(--text-1);
    -webkit-font-smoothing: antialiased;
  }

  /* NAV */
  .tp-nav {
    position: sticky; top: 0; z-index: 50;
    background: rgba(248,246,241,0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
  }
  .tp-nav-inner {
    max-width: 1200px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    height: 60px; padding: 0 32px;
  }
  .tp-nav-logo {
    display: flex; align-items: center; gap: 10px;
    font-weight: 700; font-size: 1.05rem; color: var(--navy);
    text-decoration: none;
  }
  .tp-nav-cta {
    background: var(--navy); color: #FFFFFF;
    font-weight: 600; font-size: 0.85rem;
    padding: 9px 20px; border-radius: 8px;
    text-decoration: none; transition: background 0.15s, transform 0.1s;
    border: none; cursor: pointer; font-family: 'Satoshi', sans-serif;
  }
  .tp-nav-cta:hover { background: var(--navy-2); transform: translateY(-1px); }

  /* HERO */
  .tp-hero {
    background: var(--bg-white);
    border-bottom: 1px solid var(--border);
    padding: 80px 32px 72px;
    text-align: center;
  }
  .tp-hero-inner { max-width: 780px; margin: 0 auto; }
  .tp-hero-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: var(--teal-pale); border: 1px solid var(--teal-pale2);
    color: var(--teal-d); font-size: 0.75rem; font-weight: 700;
    letter-spacing: 0.07em; text-transform: uppercase;
    padding: 5px 14px; border-radius: 100px; margin-bottom: 28px;
  }
  .tp-hero-badge-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--teal);
    animation: tp-pulse 2s infinite;
  }
  @keyframes tp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
  .tp-hero-h1 {
    font-family: var(--serif);
    font-size: clamp(2.4rem, 5vw, 3.6rem);
    font-weight: 400; line-height: 1.15; margin-bottom: 20px;
    color: var(--navy); letter-spacing: -0.01em;
  }
  .tp-hero-accent { color: var(--teal-d); font-style: italic; }
  .tp-hero-sub {
    font-size: 1.05rem; color: var(--text-2); max-width: 520px;
    margin: 0 auto 52px; line-height: 1.75;
  }
  .tp-hero-stats {
    display: flex; justify-content: center; gap: 0; flex-wrap: wrap;
    border: 1px solid var(--border); border-radius: var(--radius-lg);
    overflow: hidden; max-width: 440px; margin: 0 auto;
    background: var(--bg-white);
  }
  .tp-hero-stat {
    flex: 1; min-width: 120px;
    display: flex; flex-direction: column; align-items: center;
    gap: 3px; padding: 20px 16px;
    border-right: 1px solid var(--border);
  }
  .tp-hero-stat:last-child { border-right: none; }
  .tp-hero-stat-n { font-size: 1.6rem; font-weight: 800; color: var(--teal-d); line-height: 1; }
  .tp-hero-stat-l { font-size: 0.75rem; color: var(--text-3); font-weight: 500; }

  /* SECTION */
  .tp-section { max-width: 1200px; margin: 0 auto; padding: 64px 32px 80px; }
  .tp-section-label {
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 28px;
  }

  /* BENTO GRID */
  .tp-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 220px;
    gap: 14px;
  }
  @media(max-width:960px){ .tp-grid { grid-template-columns: repeat(2, 1fr); } }
  @media(max-width:580px){ .tp-grid { grid-template-columns: 1fr; grid-auto-rows: auto; } }

  .tp-card--wide { grid-column: span 2; }
  @media(max-width:960px){ .tp-card--wide:nth-child(4) { grid-column: span 1; } }
  @media(max-width:580px){ .tp-card--wide { grid-column: span 1; } }

  .tp-card {
    position: relative; overflow: hidden;
    background: var(--bg-white);
    box-shadow: var(--shadow-card);
    border-radius: var(--radius-lg);
    padding: 26px 24px;
    cursor: pointer;
    display: flex; flex-direction: column; gap: 12px;
    transition: box-shadow 0.2s, transform 0.18s;
    border: 1px solid var(--border);
  }
  .tp-card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-3px);
    border-color: var(--border-t);
  }
  .tp-card:hover .tp-card-glow { opacity: 1; }

  .tp-card-glow {
    position: absolute; bottom: -40px; right: -40px;
    width: 160px; height: 160px; border-radius: 50%;
    background: radial-gradient(circle, rgba(22,193,173,0.07) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.3s; pointer-events: none;
  }

  .tp-card-top { display: flex; align-items: center; justify-content: space-between; }
  .tp-tool-icon {
    width: 42px; height: 42px;
    background: var(--teal-pale); border: 1px solid rgba(22,193,173,0.2);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
  }
  .tp-badge {
    background: var(--bg); border: 1px solid var(--border);
    color: var(--text-3); font-size: 0.68rem; font-weight: 700;
    letter-spacing: 0.07em; text-transform: uppercase;
    padding: 3px 10px; border-radius: 100px;
  }
  .tp-card-body { flex: 1; }
  .tp-card-title { font-size: 1rem; font-weight: 700; color: var(--navy); margin-bottom: 7px; }
  .tp-card-desc { font-size: 0.84rem; color: var(--text-2); line-height: 1.65; }
  .tp-card-cta {
    display: flex; align-items: center; gap: 5px;
    font-size: 0.82rem; font-weight: 600; color: var(--teal-d);
    transition: gap 0.15s;
  }
  .tp-card:hover .tp-card-cta { gap: 9px; }

  /* CTA SECTION */
  .tp-cta-section {
    background: var(--navy);
    padding: 96px 32px;
    text-align: center;
  }
  .tp-cta-inner { max-width: 600px; margin: 0 auto; }
  .tp-cta-label {
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--teal-light); margin-bottom: 20px;
  }
  .tp-cta-h2 {
    font-family: var(--serif);
    font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 400;
    line-height: 1.2; margin-bottom: 16px; color: #FFFFFF;
  }
  .tp-cta-h2 em { font-style: italic; color: var(--teal-light); }
  .tp-cta-sub { font-size: 1rem; color: rgba(255,255,255,0.55); line-height: 1.75; margin-bottom: 36px; }
  .tp-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .tp-cta-primary { display: inline-block; text-decoration: none; }

  /* FOOTER */
  .tp-footer {
    background: var(--bg-white); border-top: 1px solid var(--border);
    padding: 28px 32px; text-align: center; color: var(--text-3); font-size: 0.8rem;
  }
  .tp-footer a { color: var(--teal-d); text-decoration: none; }
  .tp-footer a:hover { color: var(--teal); }

  /* MODAL */
  .tp-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(7,20,42,0.5);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 40px 16px; overflow-y: auto;
  }
  .tp-modal {
    background: var(--bg-white); border: 1px solid var(--border);
    border-radius: 18px; width: 100%; max-width: 640px;
    padding: 36px; position: relative; margin: auto;
    animation: tp-modal-in 0.22s cubic-bezier(0.16,1,0.3,1);
    box-shadow: 0 24px 60px rgba(7,20,42,0.15);
  }
  .tp-modal--wide { max-width: 820px; }
  @media(max-width:480px){ .tp-modal { padding: 24px 18px; } }
  @keyframes tp-modal-in { from{opacity:0;transform:translateY(14px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }

  .tp-modal-close {
    position: absolute; top: 18px; right: 18px;
    background: var(--bg); border: 1px solid var(--border);
    color: var(--text-3); width: 34px; height: 34px; border-radius: 8px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, color 0.15s; font-family: inherit;
  }
  .tp-modal-close:hover { background: var(--border); color: var(--text-1); }
  .tp-modal-hdr { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; padding-right: 40px; }
  .tp-modal-title { font-size: 1.1rem; font-weight: 700; color: var(--navy); }
  .tp-modal-sub { font-size: 0.81rem; color: var(--text-3); margin-top: 3px; }

  /* FORM */
  .tp-form-body { display: flex; flex-direction: column; gap: 18px; }
  .tp-field { display: flex; flex-direction: column; gap: 7px; }
  .tp-label { font-size: 0.79rem; font-weight: 600; color: var(--text-2); }
  .tp-select, .tp-input, .tp-textarea {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text-1); font-family: 'Satoshi', sans-serif;
    font-size: 0.9rem; padding: 10px 13px; outline: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .tp-select:focus, .tp-input:focus, .tp-textarea:focus {
    border-color: var(--teal); background: var(--bg-white);
    box-shadow: 0 0 0 3px rgba(22,193,173,0.1);
  }
  .tp-textarea { min-height: 150px; resize: vertical; line-height: 1.6; }
  .tp-select option { background: #FFFFFF; color: var(--text-1); }
  .tp-hint { font-size: 0.77rem; color: var(--text-3); margin-top: 4px; }
  .tp-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media(max-width:480px){ .tp-2col { grid-template-columns: 1fr; } }

  /* BUTTONS */
  .tp-submit {
    background: var(--teal); color: #FFFFFF;
    font-weight: 700; font-size: 0.9rem;
    padding: 13px 22px; border-radius: 8px; border: none;
    cursor: pointer; font-family: 'Satoshi', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s; margin-top: 4px;
    text-decoration: none; width: 100%;
  }
  .tp-submit:hover { background: var(--teal-d); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(22,193,173,0.3); }
  .tp-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
  .tp-ghost-btn {
    background: transparent; border: 1px solid var(--border);
    color: var(--text-2); font-weight: 600; font-size: 0.88rem;
    padding: 12px 22px; border-radius: 8px; cursor: pointer;
    font-family: 'Satoshi', sans-serif; transition: border-color 0.15s, color 0.15s, background 0.15s;
    margin-top: 8px; width: 100%; text-decoration: none;
    display: flex; align-items: center; justify-content: center;
  }
  .tp-ghost-btn:hover { border-color: var(--teal); color: var(--teal-d); background: var(--teal-pale); }
  .tp-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: tp-spin 0.65s linear infinite; flex-shrink: 0;
  }
  @keyframes tp-spin { to { transform: rotate(360deg); } }

  /* RESULT BOX */
  .tp-result-box {
    background: var(--bg-teal); border: 1px solid rgba(22,193,173,0.2);
    border-radius: 10px; padding: 20px; margin-top: 4px;
  }
  .tp-result-label {
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--teal-d); margin-bottom: 12px;
  }
  .tp-result-cta { margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(22,193,173,0.2); }
  .tp-result-cta p { font-size: 0.82rem; color: var(--text-3); margin-bottom: 0; }
  .tp-feedback {}
  .tp-fb-item { font-size: 0.875rem; color: var(--text-2); line-height: 1.7; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .tp-fb-item:last-child { border-bottom: none; }
  .tp-fb-item strong { color: var(--navy); }

  /* QUIZ */
  .tp-quiz-body { display: flex; flex-direction: column; gap: 16px; }
  .tp-quiz-progress { display: flex; gap: 5px; margin-bottom: 4px; }
  .tp-quiz-dot { height: 3px; flex: 1; border-radius: 2px; background: var(--border); transition: background 0.3s; }
  .tp-quiz-dot.done { background: var(--teal); }
  .tp-quiz-dot.active { background: rgba(22,193,173,0.35); }
  .tp-quiz-counter { font-size: 0.78rem; color: var(--text-3); font-weight: 600; }
  .tp-quiz-q { font-size: 1rem; font-weight: 700; color: var(--navy); line-height: 1.5; }
  .tp-quiz-opts { display: flex; flex-direction: column; gap: 8px; }
  .tp-quiz-opt {
    display: flex; align-items: center; gap: 12px;
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 9px; padding: 12px 15px; cursor: pointer;
    font-size: 0.875rem; color: var(--text-2); font-family: 'Satoshi', sans-serif;
    text-align: left; transition: all 0.15s;
  }
  .tp-quiz-opt:hover { border-color: var(--teal); background: var(--teal-pale); color: var(--navy); }
  .tp-quiz-opt.selected { border-color: var(--teal); background: var(--teal-pale); color: var(--navy); font-weight: 600; }
  .tp-quiz-opt-dot {
    width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border);
    flex-shrink: 0; transition: all 0.15s;
  }
  .tp-quiz-opt.selected .tp-quiz-opt-dot { border-color: var(--teal); background: var(--teal); }
  .tp-quiz-nav { margin-top: 4px; }
  .tp-quiz-result { text-align: center; padding: 8px 0; }
  .tp-quiz-result-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 12px; }
  .tp-quiz-result-track { font-family: var(--serif); font-size: 2rem; font-weight: 400; color: var(--teal-d); margin-bottom: 12px; line-height: 1.2; }
  .tp-quiz-result-desc { font-size: 0.9rem; color: var(--text-2); line-height: 1.7; margin-bottom: 24px; }
  .tp-quiz-result-btns { display: flex; flex-direction: column; gap: 8px; }

  /* SALARY */
  .tp-sal-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  @media(max-width:480px){ .tp-sal-filters { grid-template-columns: 1fr; } }
  .tp-sal-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid var(--border); }
  .tp-sal-table { width: 100%; border-collapse: collapse; min-width: 540px; }
  .tp-sal-table th { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); background: var(--bg); }
  .tp-sal-table td { padding: 12px 14px; font-size: 0.86rem; border-bottom: 1px solid var(--border); color: var(--text-2); }
  .tp-sal-table tr:last-child td { border-bottom: none; }
  .tp-sal-table tr:hover td { background: var(--bg); }
  .tp-sal-role { color: var(--navy) !important; font-weight: 500; }
  .tp-sal-range { color: var(--teal-d) !important; font-weight: 700; }
  .tp-sal-exp { color: var(--text-3) !important; font-size: 0.8rem; }
  .tp-tag { display: inline-block; background: var(--bg); border: 1px solid var(--border); color: var(--text-3); font-size: 0.73rem; font-weight: 600; padding: 2px 8px; border-radius: 5px; }

  /* ROLES */
  .tp-role-search { position: relative; margin-bottom: 16px; }
  .tp-role-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; display: flex; }
  .tp-role-input {
    width: 100%; background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text-1); font-family: 'Satoshi', sans-serif;
    font-size: 0.9rem; padding: 10px 14px 10px 40px; outline: none;
    transition: border-color 0.15s;
  }
  .tp-role-input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(22,193,173,0.1); }
  .tp-role-list { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; padding-right: 4px; }
  .tp-role-card { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; transition: border-color 0.15s, background 0.15s; }
  .tp-role-card:hover { border-color: var(--teal); background: var(--bg-white); }
  .tp-role-hdr { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 6px; }
  .tp-role-title { font-weight: 700; color: var(--navy); font-size: 0.92rem; }
  .tp-role-salary { font-size: 0.78rem; color: var(--teal-d); font-weight: 600; flex-shrink: 0; }
  .tp-role-desc { font-size: 0.83rem; color: var(--text-2); line-height: 1.6; }
  .tp-role-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
  .tp-role-skills { display: flex; gap: 6px; flex-wrap: wrap; }
  .tp-skill-tag { background: var(--teal-pale); border: 1px solid rgba(22,193,173,0.2); color: var(--teal-d); font-size: 0.72rem; font-weight: 600; padding: 2px 9px; border-radius: 5px; }
  .tp-role-growth { font-size: 0.78rem; font-weight: 700; }

  /* SKILLS GAP */
  .tp-gap-result { display: flex; flex-direction: column; gap: 20px; }
  .tp-gap-section {}
  .tp-gap-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  .tp-gap-have { color: #16a34a; }
  .tp-gap-missing { color: #dc2626; }
  .tp-gap-path { color: var(--teal-d); }
  .tp-gap-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .tp-chip { font-size: 0.8rem; font-weight: 600; padding: 5px 13px; border-radius: 7px; }
  .tp-chip--have { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }
  .tp-chip--missing { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
  .tp-chip--path { background: var(--teal-pale); border: 1px solid rgba(22,193,173,0.25); color: var(--teal-d); }

  /* LINKEDIN */
  .tp-li-results { display: flex; flex-direction: column; gap: 14px; margin-top: 4px; }
  .tp-li-block { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
  .tp-li-block-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .tp-li-block-label { font-size: 0.73rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--teal-d); }
  .tp-copy-btn {
    display: flex; align-items: center; gap: 5px;
    background: var(--bg-white); border: 1px solid var(--border);
    color: var(--text-3); font-size: 0.78rem; font-weight: 600;
    padding: 4px 10px; border-radius: 6px; cursor: pointer;
    font-family: 'Satoshi', sans-serif; transition: all 0.15s;
  }
  .tp-copy-btn:hover { border-color: var(--teal); color: var(--teal-d); }
  .tp-li-headline { font-size: 0.95rem; font-weight: 600; color: var(--navy); line-height: 1.5; }
  .tp-li-about { font-size: 0.875rem; color: var(--text-2); line-height: 1.8; white-space: pre-line; }

  /* SCROLLBAR */
  .tp-role-list::-webkit-scrollbar { width: 4px; }
  .tp-role-list::-webkit-scrollbar-track { background: transparent; }
  .tp-role-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;
