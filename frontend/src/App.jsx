import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#fff' }}>
          <h2 style={{ color: '#c00' }}>Something went wrong</h2>
          <pre style={{ color: '#333', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{this.state.error.message}</pre>
          <pre style={{ color: '#666', whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{this.state.error.stack}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Dismiss</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SUBJECT_ICONS = {
  bioinformatics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 12 6 12 8 4 11 20 14 8 16 14 18 12 22 12"/>
    </svg>
  ),
  genomics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18h8"/><path d="M3 22h18"/>
      <path d="M14 22a7 7 0 100-14h-1"/>
      <path d="M9 14h2"/>
      <path d="M9 12a2 2 0 010-4v-3a1 1 0 012 0v1a2 2 0 012 2v1"/>
    </svg>
  ),
  drug_discovery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v7.527a2 2 0 01-.211.896L4.72 18.578A1 1 0 005.596 20h12.808a1 1 0 00.876-1.422L14.21 10.423A2 2 0 0114 9.527V2"/>
      <line x1="8.5" y1="2" x2="15.5" y2="2"/>
      <line x1="7" y1="16" x2="17" y2="16"/>
    </svg>
  ),
  clinical_trials: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1"/>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <path d="M9 14l2 2 4-4"/>
    </svg>
  ),
  genai_ml: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  biotech_business: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  cell_gene_therapy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="3"/><circle cx="7" cy="17" r="3"/>
      <line x1="10" y1="7" x2="22" y2="3"/><line x1="10" y1="17" x2="22" y2="21"/>
      <line x1="16" y1="5" x2="16" y2="19"/>
    </svg>
  ),
  protein_engineering: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="10" ry="4"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>
    </svg>
  ),
  rna_therapeutics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8 Q5 4 8 8 Q11 12 14 8 Q17 4 20 8 Q23 12 24 8"/>
      <path d="M2 16 Q5 12 8 16 Q11 20 14 16 Q17 12 20 16 Q23 20 24 16"/>
    </svg>
  ),
  biomanufacturing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 01-2 2H3"/>
      <path d="M21 3h-3a2 2 0 00-2 2v3"/>
      <path d="M3 16h3a2 2 0 012 2v3"/>
      <path d="M16 21v-3a2 2 0 012-2h3"/>
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  longevity_science: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
      <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8 17.72m2.54-15.38c-1.39 4.26-3.68 7.04-7.1 9.66"/>
    </svg>
  ),
};

const CAREER_ICONS = {
  bioinformatics_scientist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3c4 2 8 2 16 0v18c-8 2-12 2-16 0V3z" opacity=".25" fill="currentColor" stroke="none"/>
      <path d="M4 3c4 2 8 2 16 0"/><path d="M4 21c4-2 12-2 16 0"/>
      <path d="M4 3v18"/><path d="M20 3v18"/>
      <path d="M4 9c4 2 12 2 16 0"/><path d="M4 15c4-2 12-2 16 0"/>
    </svg>
  ),
  genomics_data_analyst: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="3" y1="20" x2="21" y2="20"/>
    </svg>
  ),
  drug_discovery_scientist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v7.527a2 2 0 01-.211.896L4.72 18.578A1 1 0 005.596 20h12.808a1 1 0 00.876-1.422L14.21 10.423A2 2 0 0114 9.527V2"/>
      <line x1="8.5" y1="2" x2="15.5" y2="2"/>
      <line x1="7" y1="15" x2="17" y2="15"/>
    </svg>
  ),
  clinical_research_associate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <path d="M9 14l2 2 4-4"/>
    </svg>
  ),
  regulatory_affairs_associate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  computational_biologist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      <line x1="12" y1="4" x2="12" y2="20" opacity=".4"/>
    </svg>
  ),
  pharmacovigilance_scientist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  ),
  medical_science_liaison: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  biomarker_scientist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  clinical_data_manager: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  biotech_bd_associate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  ),
  market_access_analyst: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  medical_affairs_associate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  genomics_commercial_specialist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20l4-16m2 16l4-16"/>
      <path d="M3 8h18M3 16h18"/>
    </svg>
  ),
  biotech_product_manager: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  life_sciences_consultant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/>
    </svg>
  ),
  biotech_venture_analyst: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  licensing_partnerships: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  ai_drug_discovery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2"/><circle cx="4" cy="20" r="2"/><circle cx="20" cy="20" r="2"/>
      <path d="M12 6l-6.5 12M12 6l6.5 12M6 18h12"/>
    </svg>
  ),
  precision_medicine_specialist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>
      <line x1="12" y1="2" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  biotech_founder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M15 21v-5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  ),
};

const IcoLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const IcoUnlock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/>
  </svg>
);
const IcoCertificate = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IcoClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoMap = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);
const IcoTarget = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IcoMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);

const SUBJECT_IMAGES = {
  bioinformatics:      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=320&fit=crop&q=80',
  genomics:            'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=800&h=320&fit=crop&q=80',
  drug_discovery:      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=320&fit=crop&q=80',
  clinical_trials:     'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=320&fit=crop&q=80',
  genai_ml:            'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=320&fit=crop&q=80',
  biotech_business:    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=320&fit=crop&q=80',
  cell_gene_therapy:   'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=320&fit=crop&q=80',
  protein_engineering: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=320&fit=crop&q=80',
  rna_therapeutics:    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=320&fit=crop&q=80',
  biomanufacturing:    'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&h=320&fit=crop&q=80',
  longevity_science:   'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=320&fit=crop&q=80',
  us_cra:              'https://images.unsplash.com/photo-1581093806997-124204d9fa9d?w=800&h=320&fit=crop&q=80',
  us_ccrp:             'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800&h=320&fit=crop&q=80',
  us_regulatory:       'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=320&fit=crop&q=80',
  us_pharmacovigilance:'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=320&fit=crop&q=80',
  us_msl:              'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=320&fit=crop&q=80',
  us_cdm:              'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=320&fit=crop&q=80',
};

const TUTOR_AVATARS = {
  'Dr. Priya Nair':     'https://i.pravatar.cc/150?img=47',
  'Dr. Marcus Webb':    'https://i.pravatar.cc/150?img=11',
  'Dr. Kavya Reddy':    'https://i.pravatar.cc/150?img=45',
  'Dr. Elena Vasquez':  'https://i.pravatar.cc/150?img=5',
  'Dr. Aisha Okonkwo':  'https://i.pravatar.cc/150?img=48',
  'Rohan Mehta':        'https://i.pravatar.cc/150?img=14',
  'Dr. James Okonkwo':  'https://i.pravatar.cc/150?img=12',
  'Dr. Sophie Laurent': 'https://i.pravatar.cc/150?img=25',
  'Dr. Amira Hassan':   'https://i.pravatar.cc/150?img=44',
  'Dr. Carlos Reyes':   'https://i.pravatar.cc/150?img=16',
  'Dr. Yuki Tanaka':    'https://i.pravatar.cc/150?img=56',
  'Sarah Mitchell':     'https://i.pravatar.cc/150?img=23',
  'Marcus Webb':        'https://i.pravatar.cc/150?img=53',
  'Dr. Robert Chen':    'https://i.pravatar.cc/150?img=33',
  'Dr. Anika Sharma':   'https://i.pravatar.cc/150?img=49',
  'Dr. Lisa Park':      'https://i.pravatar.cc/150?img=20',
  'David Kim':          'https://i.pravatar.cc/150?img=60',
};

const _urlRegion = new URLSearchParams(window.location.search).get('region');
const _hostRegion = window.location.hostname.startsWith('usa.') ? 'us' : null;
if (_urlRegion) localStorage.setItem('bversity_region', _urlRegion);
else if (_hostRegion) localStorage.setItem('bversity_region', _hostRegion);
const ACTIVE_REGION = localStorage.getItem('bversity_region') || 'india';

const US_SUBJECTS = [
  { id: 'us_cra',              name: 'Clinical Research Associate',    tutor: 'Sarah Mitchell',      role: 'Senior CRA, Oncology Trials',          org: 'IQVIA, Boston',                color: '#0066CC',
    description: 'GCP & ICH E6, site qualification, informed consent, monitoring visits, SAE reporting, TMF management, and CCRA exam BOK',
    intro: "I've been monitoring clinical trials across New England for 6 years  -  from site qual visits to close-outs. I know what a good site looks like and what a troubled one looks like before I even sit down. GCP isn't bureaucracy: every requirement exists because something went wrong for a patient once. I'll teach you the regulations the way I learned them  -  through the sites, the situations, and the hard calls you'll face.",
    certification: 'CCRA', certBody: 'ACRP' },
  { id: 'us_ccrp',             name: 'Clinical Research Professional', tutor: 'Marcus Webb',          role: 'Lead CRC, Academic Medical Center',    org: 'Cleveland Clinic',             color: '#2563EB',
    description: 'Research ethics, scientific concepts, patient safety, clinical operations, data management, and CCRP exam BOK (SOCRA)',
    intro: "I've coordinated over 40 trials at a major academic medical center  -  Phase I first-in-human studies to Phase IV post-market registries. SOCRA's CCRP is the credential for people who understand the full trial from the inside. The exam is broad by design: ethics, science, operations, data. I'll make sure none of those domains surprises you.",
    certification: 'CCRP', certBody: 'SOCRA' },
  { id: 'us_regulatory',       name: 'Regulatory Affairs  -  Drugs',    tutor: 'Dr. Robert Chen',     role: 'Senior Director, Regulatory Affairs',  org: 'Bristol Myers Squibb',         color: '#6B3FA0',
    description: 'FDA organization, IND/NDA/BLA pathways, labeling, special designations, CMC, post-approval requirements, and RAC-Drugs exam BOK',
    intro: "I spent 7 years as an FDA reviewer before moving to industry. I've seen the inside of both rooms  -  the agency and the sponsor. Most RA professionals know what to file. Very few understand why each requirement exists and how a reviewer thinks when they read your submission. That's what I'll teach you.",
    certification: 'RAC-Drugs', certBody: 'RAPS' },
  { id: 'us_pharmacovigilance', name: 'Pharmacovigilance',             tutor: 'Dr. Anika Sharma',    role: 'Global Pharmacovigilance Lead',         org: 'AstraZeneca, Wilmington DE',   color: '#E05C00',
    description: 'Adverse event reporting, ICSR processing, MedDRA coding, signal detection, REMS, ICH E2 guidelines, periodic safety reports, and CPVC exam BOK',
    intro: "Behind every case number in a safety database is a person who had a bad experience with a medicine. I spent 5 years at FDA reviewing those cases before joining industry. Pharmacovigilance done well protects the next million patients. I'll teach you the science and the judgment  -  how to assess a signal, when to escalate, how to write a PBRER that tells the real story.",
    certification: 'CPVC', certBody: 'CCRPS' },
  { id: 'us_msl',              name: 'Medical Science Liaison',        tutor: 'Dr. Lisa Park',       role: 'Senior MSL, Oncology',                 org: 'Genentech, San Francisco',     color: '#00A896',
    description: 'KOL engagement, scientific exchange, HEOR, real-world evidence, IIT support, medical affairs compliance, and BCMAS exam BOK',
    intro: "I have a PhD from Stanford and a postdoc from UCSF. I walked away from a tenure-track path to become an MSL, and I haven't looked back. This role is one of the best-kept secrets in biopharma  -  you sit at the intersection of cutting-edge science and clinical practice, trusted by physicians who won't take a sales call. Let me show you what that actually looks like.",
    certification: 'BCMAS', certBody: 'ACMA' },
  { id: 'us_cdm',              name: 'Clinical Data Management',       tutor: 'David Kim',           role: 'Senior Clinical Data Manager',         org: 'Medidata Solutions, New York', color: '#B5451B',
    description: 'EDC configuration, CDISC standards (CDASH/SDTM/ADaM), edit checks, data cleaning, 21 CFR Part 11, database lock, and CCDM exam BOK',
    intro: "I've built and locked databases for Phase III trials. CDM is the backbone of clinical evidence  -  if the data is wrong, every downstream decision is wrong. I'll teach you how to design edit checks that catch real errors, build SDTM that passes FDA scrutiny, and actually lock a database.",
    certification: 'CCDM', certBody: 'SCDM' },
];

const US_CAREER_TRACKS = [
  { id: 'us_ctm',    name: 'Clinical Trial Manager',              tutor: 'Jennifer Okafor',     role: 'Clinical Trial Manager',               org: 'PPD / Thermo Fisher, Durham NC',  color: '#0891B2', type: 'career',
    salary: '$95K–$130K', markets: 'Boston · DC · NY',
    description: 'Protocol management, site selection and oversight, CRO management, budget and timeline, regulatory submissions, and trial close-out',
    intro: "I've managed Phase II and III trials across 20+ sites in the US. Clinical Trial Management is one of the most demanding  -  and most rewarding  -  roles in drug development. There's no single dominant certification for this role, so I'll give you something better: the actual skills, frameworks, and judgment that hiring managers at CROs and sponsors are looking for." },
  { id: 'us_bioinformatics', name: 'Bioinformatics & AI Drug Discovery', tutor: 'Dr. Elena Rodriguez', role: 'Computational Biologist',            org: 'Genentech, South San Francisco',  color: '#047857', type: 'career',
    salary: '$110K–$160K', markets: 'Bay Area · San Diego · Boston',
    description: 'Python & R for biology, NGS pipelines, variant analysis, ML for drug target discovery, protein structure prediction, and cloud bioinformatics',
    intro: "I build pipelines that turn terabytes of genomic data into drug targets. This is the hottest intersection in life sciences right now  -  Bay Area and San Diego companies are hiring bioinformaticians faster than any other role. The mistake most people make is treating it as pure coding. The biology is what separates a good pipeline from a great one. We'll work on real datasets from day one." },
];

const INDIA_SUBJECTS = [
  { id: 'bioinformatics',     name: 'Bioinformatics',                             tutor: 'Dr. Priya Nair',    role: 'Senior Bioinformatics Scientist',                  org: 'Broad Institute of MIT and Harvard', color: '#00A896', description: 'Sequence analysis, BLAST, phylogenetics, NGS pipelines, protein structure, and computational biology tools',
    intro: "I build computational pipelines to make sense of genomic data at scale, covering everything from cancer mutation signatures to population-level association studies. I've watched bioinformatics go from a niche specialty to the backbone of modern medicine, and I want to give you that foundation properly. By the end of this, you'll be fluent in the tools and concepts that the industry actually uses." },
  { id: 'genomics',           name: 'Genomics',                                    tutor: 'Dr. Marcus Webb',   role: 'Director of Genomics Research',                   org: 'Illumina',                           color: '#7B2D8B', description: 'Genome structure, sequencing technologies, variant analysis, GWAS, single-cell, and precision medicine',
    intro: "I work at the company that sequences more of the world's DNA than anyone else. I've watched the cost of sequencing a genome drop from $3 billion to under $200 in my career, and what that's done to medicine is still unfolding. This subject will give you the conceptual and technical grounding to understand what's coming next." },
  { id: 'drug_discovery',     name: 'Drug Discovery & Development',                tutor: 'Dr. Kavya Reddy',   role: 'Principal Scientist, Drug Discovery',             org: 'Genentech',                          color: '#E05C00', description: 'Target identification, HTS, medicinal chemistry, ADMET, preclinical development, and the full pipeline',
    intro: "I've taken small molecule programs from target identification all the way through Phase I trials. I've seen molecules fail at every stage of the pipeline. A few make it. I'll teach you why the process looks the way it does, what catastrophe you'd invite by skipping each stage, and how to think like a drug hunter." },
  { id: 'clinical_trials',    name: 'Clinical Trials & Regulatory Affairs',        tutor: 'Dr. Elena Vasquez', role: 'Head of Regulatory Affairs',                      org: 'Novartis',                           color: '#0066CC', description: 'Trial phases, FDA/EMA regulations, ICH guidelines, adaptive designs, and NDA/MAA submissions',
    intro: "I've submitted NDAs to both the FDA and the EMA, and I've been in the room when regulators push back. Most scientists understand the biology. Very few understand what it takes to convince a regulator that your data is sufficient. That gap is exactly what this subject closes." },
  { id: 'genai_ml',           name: 'Gen AI & Machine Learning for Life Sciences', tutor: 'Dr. Aisha Okonkwo', role: 'Director of Machine Learning',                    org: 'Recursion Pharmaceuticals',          color: '#6B3FA0', description: 'ML foundations, deep learning, protein language models, generative molecules, and AI-driven drug discovery',
    intro: "I use AI to run millions of cellular experiments and find patterns no human could see. I've been at the intersection of ML and biology for a decade, before most people thought that was a real job. I'll be honest with you about where AI in life sciences is genuinely useful and where it's overhyped." },
  { id: 'biotech_business',   name: 'Biotech Business & Management',               tutor: 'Rohan Mehta',       role: 'VP of Corporate Strategy & Business Development', org: 'AstraZeneca',                        color: '#B5451B', description: 'Business models, financing, valuation, BD&L, market access, IP strategy, and building biotech companies',
    intro: "Before AstraZeneca, I spent six years at McKinsey advising pharma and biotech companies on strategy, deals, and market access. I deliberately don't have a PhD. Most of what this subject covers is learned in boardrooms and on term sheets, not in classrooms. I'll share what I've actually seen work." },
  { id: 'cell_gene_therapy',  name: 'Cell & Gene Therapy',                         tutor: 'Dr. James Okonkwo', role: 'Director of Vector Development',                  org: 'bluebird bio',                       color: '#0891B2', description: 'Viral vectors, CRISPR genome editing, CAR-T, in vivo and ex vivo gene therapy, CGT manufacturing and regulatory pathways',
    intro: "I've been building viral vectors since before CRISPR existed. I worked on early AAV programs that eventually became approved therapies. I've watched gene therapy go from an experimental curiosity to transforming patients' lives, and I've seen the failures that built the safety framework we have today. You'll need to understand both." },
  { id: 'protein_engineering',name: 'Protein Engineering & Design',                tutor: 'Dr. Sophie Laurent', role: 'Lead, Computational Protein Design',              org: 'Genentech',                          color: '#BE185D', description: 'Directed evolution, AlphaFold, RFdiffusion, antibody engineering, de novo design, and therapeutic protein formats',
    intro: "I work at the intersection of structural biology and deep learning, designing proteins computationally that actually fold and function. AlphaFold changed everything; things that took years now take weeks. But you need strong physical intuition before the computational tools make sense, and that's where we'll start." },
  { id: 'rna_therapeutics',   name: 'RNA Therapeutics',                            tutor: 'Dr. Amira Hassan',  role: 'VP RNA Platform Sciences',                        org: 'Moderna',                            color: '#B91C1C', description: 'mRNA design, siRNA, ASOs, LNP delivery, RNA vaccines, chemical modifications, and the RNA drug pipeline',
    intro: "I was at Moderna before the COVID vaccine, and I watched mRNA go from a scientific curiosity to the fastest vaccine ever developed. RNA therapeutics is the most exciting drug platform in medicine right now. Every protein the human genome encodes is now potentially reachable. every protein the human genome encodes is now potentially reachable. I'll start there and work forward." },
  { id: 'biomanufacturing',   name: 'Biomanufacturing & Bioprocessing',            tutor: 'Dr. Carlos Reyes',  role: 'VP Bioprocess Development',                       org: 'Lonza',                              color: '#047857', description: 'Upstream and downstream bioprocessing, GMP, cell line development, scale-up, cell therapy manufacturing, and biosimilars',
    intro: "I help companies scale their molecules from lab bench to commercial production, and I've seen what happens when that fails. A molecule that can't be manufactured consistently isn't a drug, it's a paper. Manufacturing is where science meets reality, and I want you to respect it as a scientific discipline, not a downstream afterthought." },
  { id: 'longevity_science',  name: 'Longevity Science',                           tutor: 'Dr. Yuki Tanaka',   role: 'Senior Research Scientist',                       org: 'Calico Life Sciences',               color: '#4338CA', description: 'Hallmarks of aging, cellular senescence, epigenetic clocks, longevity pathways, proteostasis, and the geroscience clinical pipeline',
    intro: "I work at the Alphabet-funded company trying to understand why we age. Longevity science has a credibility problem: too much hype, too many supplements, too many claims not backed by human data. I'll be rigorous with you about what the data actually shows, what's mechanism and what's speculation, and where the genuinely exciting frontiers are." },
];

const SUBJECTS = ACTIVE_REGION === 'us' ? US_SUBJECTS : INDIA_SUBJECTS;
const SUBJECTS_BY_ID = Object.fromEntries([...US_SUBJECTS, ...INDIA_SUBJECTS].map(s => [s.id, s]));

const US_EXAM_DOMAINS = {
  us_cra: {
    certBody: "ACRP", certName: "CCRA", examQuestions: 150, passScore: "70%",
    tagline: "The gold standard credential for clinical site monitoring in the US and globally.",
    salaryRange: "$75k – $120k", demandLabel: "High demand", demandColor: "#16a34a",
    topEmployers: ["ICON plc", "Covance", "PPD", "Pfizer", "Syneos Health"],
    careerLadder: ["Clinical Research Associate", "Senior CRA", "CRA Manager", "Clinical Operations Director"],
    unlocks: ["Access roles at top CROs and pharma sponsors", "Required by most Phase II–IV monitoring jobs", "Recognized in 40+ countries"],
    domains: [
      { name: "GCP & Ethics", weight: 30, concepts: [
        {id:"cra_gcp_a", name:"GCP Principles and ICH E6(R2)"},
        {id:"cra_gcp_b", name:"Protocol Structure and Deviations"},
        {id:"cra_gcp_c", name:"Investigator Brochure and IP Regulations"},
        {id:"cra_ethics_a", name:"Informed Consent Process"},
        {id:"cra_ethics_b", name:"IRB and IEC Roles"},
        {id:"cra_ethics_c", name:"AE and SAE Identification"},
      ]},
      { name: "Regulatory Framework", weight: 20, concepts: [
        {id:"cra_reg_a", name:"FDA Regulatory Framework"},
        {id:"cra_reg_b", name:"Sponsor and Investigator Obligations"},
      ]},
      { name: "Site Management & Monitoring", weight: 30, concepts: [
        {id:"cra_ops_a", name:"Monitoring Visit Conduct"},
        {id:"cra_ops_b", name:"Site Qualification and Selection"},
        {id:"cra_ops_c", name:"TMF and Essential Documents"},
        {id:"cra_ops_d", name:"Issue Escalation and CAPA"},
      ]},
      { name: "Data & Safety Reporting", weight: 20, concepts: [
        {id:"cra_data_a", name:"CRF Completion and EDC"},
        {id:"cra_data_b", name:"Data Quality and Database Lock"},
        {id:"cra_mgmt_a", name:"Site Staff and Delegation Logs"},
        {id:"cra_mgmt_b", name:"Budget and Contract Management"},
      ]},
    ],
  },
  us_ccrp: {
    certBody: "SOCRA", certName: "CCRP", examQuestions: 175, passScore: "70%",
    tagline: "The most recognised credential for research coordinators at clinical trial sites.",
    salaryRange: "$55k – $90k", demandLabel: "Very high demand", demandColor: "#16a34a",
    topEmployers: ["Mayo Clinic", "Johns Hopkins", "UCSF", "MD Anderson", "Labcorp"],
    careerLadder: ["Clinical Research Coordinator", "Senior Coordinator", "Lead CRC", "Research Operations Manager"],
    unlocks: ["Entry point into site-based clinical research careers", "Preferred by academic medical centres and hospitals", "Pairs well with nursing or allied health backgrounds"],
    domains: [
      { name: "Study Startup", weight: 35, concepts: [
        {id:"ccrp_startup_a", name:"Protocol Feasibility Assessment"},
        {id:"ccrp_startup_b", name:"IRB Submission and Approval"},
        {id:"ccrp_startup_c", name:"Informed Consent Document Creation"},
        {id:"ccrp_startup_d", name:"Essential Document Preparation"},
        {id:"ccrp_startup_e", name:"Staff Training and Delegation"},
      ]},
      { name: "Study Implementation", weight: 45, concepts: [
        {id:"ccrp_impl_a", name:"Subject Screening and Enrollment"},
        {id:"ccrp_impl_b", name:"Protocol Execution and Compliance"},
        {id:"ccrp_impl_c", name:"Investigational Product Management"},
        {id:"ccrp_impl_d", name:"AE Documentation and Reporting"},
        {id:"ccrp_impl_e", name:"Data Entry and Source Documentation"},
        {id:"ccrp_impl_f", name:"Regulatory Communication"},
      ]},
      { name: "Study Closeout", weight: 20, concepts: [
        {id:"ccrp_close_a", name:"Closeout Visit Conduct"},
        {id:"ccrp_close_b", name:"Record Archiving Requirements"},
        {id:"ccrp_close_c", name:"Final Data Reconciliation"},
      ]},
    ],
  },
  us_regulatory: {
    certBody: "RAPS", certName: "RAC (Drugs)", examQuestions: 200, passScore: "65%",
    tagline: "The most respected regulatory credential in pharma and biotech — opens doors at FDA, sponsors and consultancies.",
    salaryRange: "$90k – $150k", demandLabel: "High demand", demandColor: "#16a34a",
    topEmployers: ["FDA", "Bristol Myers Squibb", "Genentech", "Medpace", "Regulatory Compliance Associates"],
    careerLadder: ["Regulatory Associate", "Regulatory Specialist", "Senior Manager Regulatory Affairs", "VP Regulatory Affairs"],
    unlocks: ["Qualify for regulatory roles at pharma, biotech and medical device companies", "Recognised by FDA and global health authorities", "Pathway to consulting and advisory board roles"],
    domains: [
      { name: "Regulatory Strategy", weight: 20, concepts: [
        {id:"rac_strategy_a", name:"FDA Organizational Structure"},
        {id:"rac_strategy_b", name:"Risk-Benefit Analysis"},
        {id:"rac_strategy_c", name:"Regulatory Strategy Development"},
      ]},
      { name: "Pre-Marketing Submissions", weight: 35, concepts: [
        {id:"rac_pre_a", name:"IND Application Requirements"},
        {id:"rac_pre_b", name:"NDA and BLA Compilation"},
        {id:"rac_pre_c", name:"ICH E-Series Clinical Guidelines"},
        {id:"rac_pre_d", name:"ICH S-Series Nonclinical Guidelines"},
        {id:"rac_pre_e", name:"Special Designations"},
      ]},
      { name: "Post-Marketing Requirements", weight: 25, concepts: [
        {id:"rac_post_a", name:"Labeling Requirements"},
        {id:"rac_post_b", name:"Post-Approval Changes and Supplements"},
        {id:"rac_post_c", name:"PSUR and PBRER Reporting"},
        {id:"rac_post_d", name:"REMS Programs"},
      ]},
      { name: "Regulatory Interfacing", weight: 20, concepts: [
        {id:"rac_interface_a", name:"Regulatory Meeting Preparation"},
        {id:"rac_interface_b", name:"EU and ICH Global Alignment"},
        {id:"rac_interface_c", name:"CMC Regulatory Requirements"},
      ]},
    ],
  },
  us_pharmacovigilance: {
    certBody: "CCRPS", certName: "CPVC", examQuestions: 120, passScore: "70%",
    tagline: "Specialist credential for drug safety professionals — one of the fastest-growing niches in clinical operations.",
    salaryRange: "$70k – $115k", demandLabel: "Growing fast", demandColor: "#0284c7",
    topEmployers: ["AstraZeneca", "Parexel", "ICON plc", "Syneos Health", "Novo Nordisk"],
    careerLadder: ["PV Associate", "Drug Safety Scientist", "PV Manager", "Head of Drug Safety"],
    unlocks: ["Enter the drug safety and pharmacovigilance function at CROs and pharma", "Required for roles involving ICSR processing and signal management", "Increasingly in demand as drug pipelines expand globally"],
    domains: [
      { name: "ICSR Processing", weight: 28, concepts: [
        {id:"pv_icsr_a", name:"ICSR Processing and Triage"},
        {id:"pv_icsr_b", name:"MedDRA Coding"},
        {id:"pv_icsr_c", name:"Expedited Reporting Timelines"},
        {id:"pv_icsr_d", name:"Narrative Writing"},
      ]},
      { name: "Signal Management", weight: 21, concepts: [
        {id:"pv_signal_a", name:"Signal Detection Methods"},
        {id:"pv_signal_b", name:"Signal Lifecycle Management"},
        {id:"pv_signal_c", name:"Benefit-Risk Evaluation"},
      ]},
      { name: "Regulatory Requirements", weight: 21, concepts: [
        {id:"pv_reg_a", name:"FDA PV Regulations"},
        {id:"pv_reg_b", name:"EMA GVP Modules"},
        {id:"pv_reg_c", name:"ICH E2 Guidelines"},
      ]},
      { name: "Aggregate Reporting", weight: 15, concepts: [
        {id:"pv_aggregate_a", name:"PSUR and PBRER Structure"},
        {id:"pv_aggregate_b", name:"DSUR Preparation"},
      ]},
      { name: "PV Systems & Governance", weight: 15, concepts: [
        {id:"pv_systems_a", name:"Safety Database Operations"},
        {id:"pv_systems_b", name:"QPPV and PV System Governance"},
      ]},
    ],
  },
  us_msl: {
    certBody: "ACMA", certName: "BCMAS", examQuestions: 100, passScore: "70%",
    tagline: "The credential for science-driven professionals moving into high-impact field medical roles.",
    salaryRange: "$130k – $185k", demandLabel: "Premium salaries", demandColor: "#7c3aed",
    topEmployers: ["Genentech", "Eli Lilly", "Novartis", "Johnson & Johnson", "AbbVie"],
    careerLadder: ["Medical Science Liaison", "Senior MSL", "Regional MSL Director", "Head of Medical Affairs"],
    unlocks: ["One of the highest-paid non-clinical roles in pharma", "Credentialises your transition from science or clinical practice", "Direct access to KOLs and clinical decision-makers"],
    domains: [
      { name: "Industry & Drug Development", weight: 20, concepts: [
        {id:"msl_industry_a", name:"Pharma Industry Structure"},
        {id:"msl_industry_b", name:"Drug Development Stages"},
        {id:"msl_industry_c", name:"Real-World Evidence and RWE Studies"},
      ]},
      { name: "Compliance & Regulations", weight: 22, concepts: [
        {id:"msl_reg_a", name:"Good Promotion Practices"},
        {id:"msl_reg_b", name:"Compliant Off-Label Communication"},
        {id:"msl_reg_c", name:"AI and Digital Compliance in Medical Affairs"},
      ]},
      { name: "KOL Engagement", weight: 28, concepts: [
        {id:"msl_kol_a", name:"KOL Identification and Mapping"},
        {id:"msl_kol_b", name:"Scientific Exchange Skills"},
        {id:"msl_kol_c", name:"Congress and Advisory Board Engagement"},
      ]},
      { name: "HEOR & Value Communication", weight: 22, concepts: [
        {id:"msl_heor_a", name:"Health Economics Principles"},
        {id:"msl_heor_b", name:"Patient-Reported Outcomes"},
        {id:"msl_heor_c", name:"Value Dossier and Payer Engagement"},
      ]},
      { name: "Publications & Field Insights", weight: 8, concepts: [
        {id:"msl_pubs_a", name:"Publication Planning"},
        {id:"msl_pubs_b", name:"MSL Field Insights and Reporting"},
      ]},
    ],
  },
  us_cdm: {
    certBody: "SCDM", certName: "CCDM", examQuestions: 150, passScore: "70%",
    tagline: "The benchmark certification for clinical data managers — validates your expertise across CDISC, EDC and regulatory submission.",
    salaryRange: "$85k – $145k", demandLabel: "High demand", demandColor: "#16a34a",
    topEmployers: ["Medidata Solutions", "Veeva Systems", "Oracle Health Sciences", "IQVIA", "Covance"],
    careerLadder: ["Clinical Data Coordinator", "Clinical Data Manager", "Sr. CDM", "Data Management Lead / Director"],
    unlocks: ["Qualify for CDM roles at CROs, sponsors and EDC vendors", "Required by most companies for independent data management work", "Strong pathway into data standards and CDISC consulting"],
    domains: [
      { name: "Database & CRF Design", weight: 27, concepts: [
        {id:"cdm_design_a", name:"CRF and eCRF Design"},
        {id:"cdm_design_b", name:"CDISC Standards: CDASH"},
        {id:"cdm_design_c", name:"Data Management Plan"},
        {id:"cdm_design_d", name:"Edit Check Specification"},
      ]},
      { name: "Data Processing & Queries", weight: 20, concepts: [
        {id:"cdm_process_a", name:"Query Management"},
        {id:"cdm_process_b", name:"External Data Reconciliation"},
        {id:"cdm_process_c", name:"SAE and AE Reconciliation"},
      ]},
      { name: "CDISC Standards", weight: 20, concepts: [
        {id:"cdm_standards_a", name:"CDISC SDTM Standards"},
        {id:"cdm_standards_b", name:"CDISC ADaM Standards"},
      ]},
      { name: "Regulatory Compliance", weight: 13, concepts: [
        {id:"cdm_process_d", name:"21 CFR Part 11 Compliance"},
        {id:"cdm_review_a", name:"SDTM Submission Package Review"},
      ]},
      { name: "Testing & Validation", weight: 13, concepts: [
        {id:"cdm_testing_a", name:"UAT Planning and Execution"},
        {id:"cdm_testing_b", name:"System Validation"},
      ]},
      { name: "Database Management", weight: 7, concepts: [
        {id:"cdm_mgmt_a", name:"Database Lock Process"},
        {id:"cdm_mgmt_b", name:"Vendor Oversight"},
      ]},
    ],
  },
};

const US_SAMPLE_QUESTIONS = {
  us_cra: [
    { domain: "GCP & Ethics", text: "You arrive at a site and discover the PI has been signing informed consent forms on behalf of subjects who were conscious and capable. What is your immediate action?", options: ["Accept it since the PI is medically responsible for subjects","Document the finding, issue a protocol deviation, and escalate to your sponsor manager","Report the site directly to FDA","Close the site immediately pending investigation"], answer: 1, explanation: "Consent must be obtained by the subject themselves (or their LAR if incapacitated). PI-signed consent from capable subjects is a GCP violation requiring a deviation report and sponsor escalation." },
    { domain: "Data & Safety Reporting", text: "During SDV, you find a hospitalization that occurred on study but was never reported as an SAE. The PI states it was unrelated to the drug. What do you do?", options: ["Accept the PI's causality assessment and close the finding","Document it and work with the site to submit a late SAE report to the sponsor","Report the site to the IRB immediately","Remove it from your monitoring report since the PI has cleared it"], answer: 1, explanation: "Causality is assessed by the investigator, but a hospitalization meets the SAE seriousness criterion regardless of relatedness. A late SAE report must still be submitted." },
    { domain: "Site Management & Monitoring", text: "The IP temperature log shows a 4-hour excursion above the required storage range. Before the next dose can be dispensed, what must happen?", options: ["The PI can use clinical judgment and dispense if they believe it is safe","The sponsor must be notified and must provide disposition instructions","The pharmacist can approve continued use based on the short duration","The IP should be immediately destroyed without sponsor consultation"], answer: 1, explanation: "Temperature excursions require sponsor notification. Only the sponsor or manufacturer can assess impact on product integrity and authorize disposition - the site cannot make this decision alone." },
  ],
  us_ccrp: [
    { domain: "Study Startup", text: "A subject signs and dates the consent form, but their signature is on the wrong line. The correct line is blank. What is the appropriate correction?", options: ["Draw a single line through the error, initial, date, and have the subject re-sign in the correct location","White-out the incorrect signature and ask the subject to re-sign","Create a new consent form and have the subject sign again, discarding the original","Leave it as-is since the subject clearly intended to consent"], answer: 0, explanation: "Good documentation practice requires a single-line correction, initialed and dated by the person making the correction. White-out is never acceptable. The original document must be retained." },
    { domain: "Study Implementation", text: "A subject enrolled last week now reports a new medication they forgot to mention at screening. The medication is listed as prohibited in the protocol. What do you do?", options: ["Document it in the medical history and continue","Document a protocol deviation, notify the PI, and notify the sponsor per protocol","Remove the subject from the study without documentation","Ask the subject to stop the medication before documenting anything"], answer: 1, explanation: "Taking a prohibited medication is a protocol deviation that must be documented, assessed by the PI, and reported to the sponsor. Subject safety and protocol integrity both require proper documentation." },
    { domain: "Study Closeout", text: "According to FDA regulations, how long must research records generally be retained after an NDA is approved?", options: ["5 years","2 years after approval or 2 years after the investigation is discontinued","Indefinitely","10 years"], answer: 1, explanation: "21 CFR 312.62 requires records to be retained for 2 years after the NDA is approved or 2 years after the investigation is discontinued and FDA is notified - whichever is later." },
  ],
  us_regulatory: [
    { domain: "Pre-Marketing Submissions", text: "A sponsor wants to conduct a Phase I first-in-human trial for a new chemical entity. Which of the following must be submitted to FDA before the trial can begin?", options: ["NDA with Phase I data","IND with pharmacology/toxicology data, clinical protocol, and investigator information","BLA with CMC data only","510(k) premarket notification"], answer: 1, explanation: "An IND (Investigational New Drug Application) under 21 CFR 312 must be submitted and allowed to go into effect (30-day review period with no clinical hold) before any human trials can begin." },
    { domain: "Special Designations", text: "A drug for a rare pediatric disease has demonstrated preliminary clinical evidence of substantial improvement over available therapy. Which designation provides the most development benefits, including rolling review?", options: ["Priority Review","Fast Track","Breakthrough Therapy","Accelerated Approval"], answer: 2, explanation: "Breakthrough Therapy designation provides the most intensive FDA guidance and the ability to use rolling review. It requires preliminary clinical evidence showing substantial improvement over existing therapies on a clinically significant endpoint." },
    { domain: "Post-Marketing Requirements", text: "A manufacturer wants to change the manufacturing site for the drug substance after NDA approval. What type of supplement is typically required for this change?", options: ["Annual Report","CBE-30 supplement","Prior Approval Supplement","CBE-0 supplement"], answer: 2, explanation: "A manufacturing site change for the drug substance is a major change under 21 CFR 314.70 that requires a Prior Approval Supplement - the change cannot be implemented until FDA approves the supplement." },
  ],
  us_pharmacovigilance: [
    { domain: "ICSR Processing", text: "You receive a report of a patient death possibly related to your company's marketed product. It comes from a published case report. What is the reporting timeline to FDA?", options: ["15 calendar days from receipt","7 calendar days from receipt","30 days - it's from literature, not a direct report","No reporting required for literature cases"], answer: 1, explanation: "A fatal serious unexpected adverse event is subject to 7-calendar-day expedited reporting to FDA under 21 CFR 314.81. Literature reports are valid sources that trigger the same timelines as direct reports once identified." },
    { domain: "Signal Management", text: "During a signal detection review, you notice a Proportional Reporting Ratio (PRR) of 4.2 with a chi-squared value above the threshold for a new drug-event combination. What is the appropriate next step?", options: ["Immediately withdraw the drug from the market","Document the finding and initiate a formal signal validation assessment","Report the signal to FDA within 24 hours","Discard it since PRR alone is not sufficient for a safety action"], answer: 1, explanation: "A PRR above threshold is a signal detection trigger, not a confirmed signal. It must be formally validated - assessed against clinical plausibility, existing data, and alternative explanations - before any regulatory action." },
    { domain: "Regulatory Requirements", text: "A PSUR for an EU-approved product covers a 3-year data lock point. According to ICH E2C, what is the submission deadline to EMA after the data lock point?", options: ["30 days","60 days","90 days","6 months"], answer: 2, explanation: "ICH E2C(R2) and GVP Module VII require submission of the PBRER (PSUR) within 90 calendar days of the data lock point for products with a 3-year reporting frequency." },
  ],
  us_msl: [
    { domain: "Compliance & Regulations", text: "A KOL contacts you asking for data on an unapproved indication for your company's product. They say they have a patient in mind. What is the appropriate MSL response?", options: ["Share the data since the request came from the KOL, not a sales interaction","Decline entirely as sharing any off-label information is prohibited","Route the request to Medical Information as a solicited unsolicited request, which can be fulfilled compliantly","Share only published data since that is publicly available"], answer: 2, explanation: "A healthcare provider's direct, unsolicited request for off-label information can be fulfilled compliantly by routing through Medical Information with appropriate documentation. The MSL should not personally fulfill the request without this process." },
    { domain: "KOL Engagement", text: "An MSL is presenting Phase III data to a regional KOL. The KOL raises a point that contradicts one of your efficacy claims. What is the best response?", options: ["Defend your data and dismiss the KOL's concern to maintain product credibility","Acknowledge the point, explore their perspective, and offer to follow up with your medical affairs team","Immediately end the meeting and report the KOL's comment to your manager","Agree with the KOL to maintain the relationship"], answer: 1, explanation: "Scientific exchange requires intellectual honesty. Acknowledging and exploring a challenge builds credibility and trust. MSLs should engage with scientific debate, not avoid or deflect it. Follow-up with the medical affairs team is appropriate." },
    { domain: "HEOR & Value Communication", text: "A payer asks you about the cost-effectiveness of your product versus the standard of care. What is the most appropriate way for an MSL to respond?", options: ["Provide the ICER and cost-per-QALY data from the value dossier in a one-on-one meeting","Decline - health economics discussions are for Market Access only","Share only published HEOR studies without any interpretation","Refer payers to the sales team for pricing discussions"], answer: 0, explanation: "MSLs can share health economic data with appropriate payer audiences in 1:1 settings under OIG guidance. Presenting value dossier evidence in context is within MSL scope and different from discussing pricing or contracting." },
  ],
  us_cdm: [
    { domain: "CDISC Standards", text: "An SDTM dataset for adverse events uses the variable AESEV with a value of 'Grade 3'. A CDISC conformance check flags this as non-compliant. Why?", options: ["CTCAE grading is not allowed in SDTM","AESEV must use CDISC controlled terminology: MILD, MODERATE, SEVERE","Grade 3 should be coded as a MedDRA PT","The AE domain does not include severity"], answer: 1, explanation: "CDISC SDTM controlled terminology requires AESEV values of MILD, MODERATE, or SEVERE. CTCAE grade numbers are not valid for this variable. CTCAE grades may be captured in a separate variable (AETOXGR)." },
    { domain: "Regulatory Compliance", text: "According to 21 CFR Part 11, which of the following is required for audit trails in electronic clinical trial systems?", options: ["Paper backup printouts signed by the investigator monthly","Computer-generated timestamps showing who made each change, what was changed, and when","Biometric verification for all data entries","Supervisor counter-signature for every edit"], answer: 1, explanation: "21 CFR Part 11 requires computer-generated audit trails that capture the date and time of operator entries and actions that create, modify, or delete electronic records - including the original value, new value, and the identity of the person making the change." },
    { domain: "Database & CRF Design", text: "A site is entering lab values directly into the eCRF without a corresponding paper or electronic source document. What is the most appropriate CDM response?", options: ["Accept it since the eCRF audit trail serves as the source","Issue a query requiring the site to identify or create an original source document","Flag it as a major protocol deviation and lock the database","Report it to the IRB as a GCP violation"], answer: 1, explanation: "Source data must exist before eCRF transcription - the eCRF is not itself a source document unless it is the point of original data capture (PODC). A query should request that the site identify the original source or, if it was genuinely PODC, document it as such." },
  ],
};

const SUBJECT_HOURS = {
  bioinformatics:        25,
  genomics:              22,
  drug_discovery:        28,
  clinical_trials:       20,
  genai_ml:              24,
  biotech_business:      18,
  cell_gene_therapy:     22,
  protein_engineering:   20,
  rna_therapeutics:      20,
  biomanufacturing:      18,
  longevity_science:     16,
  us_cra:                20,
  us_ccrp:               22,
  us_regulatory:         22,
  us_pharmacovigilance:  18,
  us_msl:                20,
  us_cdm:                18,
  us_ctm:                24,
  us_bioinformatics:     26,
};

const CLUSTER_COLORS = {
  'Science & Technical':  '#00A896',
  'Business & Commercial': '#0066CC',
  'Emerging & Hybrid':    '#7B2D8B',
};

const CLUSTER_IMAGES = {
  'Science & Technical':  'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=1200&q=80',
  'Business & Commercial': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80',
  'Emerging & Hybrid':    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
};

const CAREER_IMAGES = {
  bioinformatics_scientist:       'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=900&q=80',
  genomics_data_analyst:          'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=900&q=80',
  drug_discovery_scientist:       'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=900&q=80',
  clinical_research_associate:    'https://images.unsplash.com/photo-1581093806997-124204d9fa9d?w=900&q=80',
  regulatory_affairs_associate:   'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80',
  computational_biologist:        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80',
  pharmacovigilance_scientist:    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=80',
  medical_science_liaison:        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=900&q=80',
  biomarker_scientist:            'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=900&q=80',
  clinical_data_manager:          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80',
  biotech_bd_associate:           'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80',
  market_access_analyst:          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&q=80',
  medical_affairs_associate:      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80',
  genomics_commercial_specialist: 'https://images.unsplash.com/photo-1568219557405-376e23e4f7cf?w=900&q=80',
  biotech_product_manager:        'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=900&q=80',
  life_sciences_consultant:       'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&q=80',
  biotech_venture_analyst:        'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=900&q=80',
  licensing_partnerships:         'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80',
  ai_drug_discovery:              'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=80',
  precision_medicine_specialist:  'https://images.unsplash.com/photo-1576086476234-1103be98f096?w=900&q=80',
  biotech_founder:                'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=80',
};

// Image config context  -  populated from /api/images, falls back to hardcoded maps above
const ImgCtx = React.createContext(null);
function useImgs() {
  const ctx = React.useContext(ImgCtx);
  return {
    career:  (id)     => ctx?.careers?.[id]?.url     || CAREER_IMAGES[id]  || CLUSTER_IMAGES['Science & Technical'],
    cluster: (name)   => ctx?.clusters?.[name]?.url  || CLUSTER_IMAGES[name] || CLUSTER_IMAGES['Science & Technical'],
    degree:  (id)     => ctx?.degrees?.[id]?.url     || null,
  };
}

// ── Utils ──────────────────────────────────────────────────────────────────

function getStoredStudent() {
  try { const s = localStorage.getItem('bversity_student'); return s ? JSON.parse(s) : null; }
  catch { return null; }
}
function storeStudent(s) { localStorage.setItem('bversity_student', JSON.stringify(s)); }
function clearStudent()  { localStorage.removeItem('bversity_student'); }

function cleanLine(line) {
  return line.replace(/^#{1,6}\s+/, '').replace(/^[-*_]{3,}$/, '');
}

function driveEmbedUrl(url) {
  if (!url) return '';
  const m = url.match(/\/file\/d\/([^/?\s]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return url;
}

function TermTooltip({ term }) {
  const [data, setData] = React.useState(null);   // null = not yet fetched
  const [ready, setReady] = React.useState(false); // false = no result
  const [open, setOpen] = React.useState(false);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const timerRef = React.useRef(null);

  // Prefetch as soon as the term appears in the DOM
  React.useEffect(() => {
    fetch(`/api/term-image/${encodeURIComponent(term)}`)
      .then(r => r.json())
      .then(d => { if (d.image || d.extract) { setData(d); setReady(true); } })
      .catch(() => {});
  }, [term]);

  function handleMouseEnter() {
    clearTimeout(timerRef.current);
    if (ready) timerRef.current = setTimeout(() => setOpen(true), 120);
  }

  function handleMouseLeave() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <span className="term-tooltip-wrap" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <strong className={`term-tooltip-trigger${ready ? ' has-tip' : ''}`}>{term}</strong>
      {open && ready && (
        <span className="term-tooltip-popup" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {data?.image && (
            <img src={data.image} alt={term}
              className={`term-tooltip-img${imgLoaded ? ' loaded' : ''}`}
              onLoad={() => setImgLoaded(true)} />
          )}
          {data?.extract && <span className="term-tooltip-def">{data.extract}</span>}
        </span>
      )}
    </span>
  );
}

function formatInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      if (inner.trim().endsWith('?')) return <strong key={i} className="question-bold">{inner}</strong>;
      return <TermTooltip key={i} term={inner} />;
    }
    return part.split(/(`[^`]+`)/g).map((cp, j) => {
      if (cp.startsWith('`') && cp.endsWith('`')) return <code key={`${i}-${j}`}>{cp.slice(1, -1)}</code>;
      return cp;
    });
  });
}

function formatMessage(text) { return formatInline(text); }

function ConceptCard({ data, color, studentId, subjectId, savedId: initialSavedId }) {
  const c = color || '#16c1ad';
  const [collapsed, setCollapsed] = useState(true);
  const [savedId, setSavedId]     = useState(initialSavedId || null);
  const [saving, setSaving]       = useState(false);

  async function toggleSave() {
    if (!studentId || saving) return;
    setSaving(true);
    try {
      if (savedId) {
        await fetch(`/api/saved-concepts/${studentId}/${savedId}`, { method: 'DELETE' });
        setSavedId(null);
      } else {
        const res = await fetch(`/api/saved-concepts/${studentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject_id: subjectId || '', title: data.title, card_data: data }),
        });
        const json = await res.json();
        setSavedId(json.id);
      }
    } catch {}
    setSaving(false);
  }

  return (
    <div className={`concept-card${collapsed ? ' concept-card--collapsed' : ''}`} style={{ '--cc-color': c }}>
      <div className="concept-card-header" onClick={() => setCollapsed(v => !v)} style={{ cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span className="concept-card-label-top" style={{ color: c }}>Concept</span>
        <span className="concept-card-title">{data.title}</span>
        <div className="concept-card-header-actions" onClick={e => e.stopPropagation()}>
          <button
            className={`cc-save-btn${savedId ? ' saved' : ''}`}
            onClick={toggleSave}
            disabled={saving}
            title={savedId ? 'Remove from library' : 'Save to library'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={savedId ? c : 'none'} stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
          <button className="cc-collapse-btn" onClick={() => setCollapsed(v => !v)} title={collapsed ? 'Expand' : 'Collapse'}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {collapsed
                ? <><polyline points="6 9 12 15 18 9"/></>
                : <><polyline points="18 15 12 9 6 15"/></>}
            </svg>
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="concept-card-body">
          <div className="concept-card-row">
            <span className="concept-card-row-label">What it is</span>
            <span className="concept-card-row-text">{data.what}</span>
          </div>
          <div className="concept-card-row">
            <span className="concept-card-row-label">Why it matters</span>
            <span className="concept-card-row-text">{data.why}</span>
          </div>
          {data.how && data.how.length > 0 && (
            <div className="concept-card-row">
              <span className="concept-card-row-label">How it works</span>
              <ul className="concept-card-how">
                {data.how.map((pt, i) => <li key={i}>{formatInline(pt)}</li>)}
              </ul>
            </div>
          )}
          {data.example && (
            <div className="concept-card-row">
              <span className="concept-card-row-label">Real example</span>
              <span className="concept-card-row-text concept-card-example">{data.example}</span>
            </div>
          )}
          {data.remember && (
            <div className="concept-card-remember" style={{ borderColor: c + '40', background: c + '0d' }}>
              <span className="concept-card-remember-star" style={{ color: c }}>★</span>
              <span>{data.remember}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderMessageContent(content, opts = {}) {
  if (content == null) return null;
  let cardData = null;
  let cleanContent = content;

  const cardMatch = cleanContent.match(/<<<CARD:(\{[\s\S]*?\})>>>/);
  if (cardMatch) {
    try { cardData = JSON.parse(cardMatch[1]); } catch (e) {}
    cleanContent = cleanContent.replace(/\n?<<<CARD:\{[\s\S]*?\}>>>\n?/, '').trim();
  }

  cleanContent = cleanContent.replace(/\n?<<<DEFS:[\s\S]*?>>>\n?/g, '').trim();

  const fi = (t) => formatInline(t);

  const lines = cleanContent.split('\n');
  const blocks = [];
  let listGroup = null;

  lines.forEach((raw) => {
    const line = raw.replace(/^#{1,6}\s+/, '').replace(/^[-*_]{3,}$/, '');
    const bulletMatch = line.match(/^[-•*]\s+(.*)/);
    const numberedMatch = line.match(/^\d+\.\s+(.*)/);

    if (bulletMatch) {
      if (!listGroup || listGroup.type !== 'ul') { listGroup = { type: 'ul', items: [] }; blocks.push(listGroup); }
      listGroup.items.push(bulletMatch[1]);
    } else if (numberedMatch) {
      if (!listGroup || listGroup.type !== 'ol') { listGroup = { type: 'ol', items: [] }; blocks.push(listGroup); }
      listGroup.items.push(numberedMatch[1]);
    } else {
      listGroup = null;
      blocks.push({ type: 'text', text: line });
    }
  });

  const out = [];
  let pending = [];
  blocks.forEach((b, i) => {
    if (b.type === 'text') {
      if (!b.text.trim()) { if (pending.length) { out.push(<p key={i}>{pending.map((t, j) => j < pending.length - 1 ? [fi(t), <br key={j}/>] : fi(t))}</p>); pending = []; } return; }
      pending.push(b.text);
    } else {
      if (pending.length) { out.push(<p key={`p${i}`}>{pending.map((t, j) => j < pending.length - 1 ? [fi(t), <br key={j}/>] : fi(t))}</p>); pending = []; }
      const Tag = b.type === 'ol' ? 'ol' : 'ul';
      out.push(<Tag key={i} className={`msg-list msg-list-${b.type}`}>{b.items.map((item, j) => <li key={j}>{fi(item)}</li>)}</Tag>);
    }
  });
  if (pending.length) out.push(<p key="last">{pending.map((t, j) => j < pending.length - 1 ? [fi(t), <br key={j}/>] : fi(t))}</p>);
  if (cardData && !opts.skipCard) out.push(<ConceptCard key="cc" data={cardData} color={opts.color} studentId={opts.studentId} subjectId={opts.subjectId} savedId={opts.savedIds?.[cardData.title]} />);
  return out;
}

function ConceptNoteRow({ conceptId, notes, saving, onSave, color }) {
  const [draft, setDraft] = React.useState(notes);
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => { setDraft(notes); }, [notes]);
  async function handleSave() {
    await onSave(conceptId, draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className="cn-notes-row">
      <textarea
        className="cn-notes-area"
        placeholder="Faculty notes for AI (e.g. common confusion, emphasis, extra context)…"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={2}
      />
      <button
        className="cn-notes-save"
        style={{ background: color || '#00A896' }}
        disabled={saving || draft === notes}
        onClick={handleSave}
      >{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save note'}</button>
    </div>
  );
}

function subjectById(id) { return SUBJECTS.find(s => s.id === id); }

// ── LinkedIn / Bio completion modal ────────────────────────────────────────

function LinkedInModal({ student, onSaved }) {
  const [linkedin, setLinkedin] = React.useState('');
  const [bio, setBio]           = React.useState('');
  const [saving, setSaving]     = React.useState(false);
  const [error, setError]       = React.useState('');

  async function handleSave() {
    const url = linkedin.trim();
    if (!url) { setError('Please enter your LinkedIn URL to continue.'); return; }
    if (!url.includes('linkedin.com')) {
      setError('Enter a valid LinkedIn URL (e.g. https://linkedin.com/in/yourname)');
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/profile/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin_url: url, bio: bio.trim() }),
      });
      onSaved({ linkedin_url: url, bio: bio.trim() });
    } catch { setError('Could not save. Please try again.'); }
    setSaving(false);
  }

  return (
    <div className="li-modal-overlay">
      <div className="li-modal">
        <div className="li-modal-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#0A66C2"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
        </div>
        <h2 className="li-modal-title">One last thing before you begin</h2>
        <p className="li-modal-sub">Bversity is a professional learning community. Your LinkedIn profile appears on the community map so fellow learners and our alumni network can find and connect with you.</p>
        <div className="li-modal-field">
          <label className="li-modal-label">LinkedIn URL <span className="li-modal-req">required</span></label>
          <input
            className="li-modal-input"
            type="url"
            placeholder="https://linkedin.com/in/yourname"
            value={linkedin}
            onChange={e => { setLinkedin(e.target.value); setError(''); }}
            autoFocus
          />
          <span className="li-modal-hint">This is required to access the platform.</span>
        </div>
        <div className="li-modal-field">
          <label className="li-modal-label">One-line bio <span className="li-modal-opt">optional</span></label>
          <input
            className="li-modal-input"
            type="text"
            placeholder={ACTIVE_REGION === 'us' ? 'e.g. CRA at IQVIA, prepping for CCRA exam' : 'e.g. Final year Biotech at BITS Pilani, interested in drug discovery and pharma consulting'}
            maxLength={120}
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
          <span className="li-modal-hint">Shown on the community map when others hover your dot.</span>
        </div>
        {error && <div className="li-modal-error">{error}</div>}
        <div className="li-modal-actions">
          <button className="li-modal-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save & enter Bversity →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function SearchModal({ student, onStudy, onClose }) {
  const [query, setQuery] = React.useState('');
  const [data, setData]   = React.useState(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    fetch(`/api/search-data/${student.id}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [student.id]);

  const q = query.trim().toLowerCase();

  const conceptResults = React.useMemo(() => {
    if (!data || !q) return [];
    return data.covered.filter(c =>
      c.concept_name.toLowerCase().includes(q) ||
      c.concept_desc.toLowerCase().includes(q) ||
      c.subject_name.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [data, q]);

  const noteResults = React.useMemo(() => {
    if (!data || !q) return [];
    return data.notes.filter(n => n.content.toLowerCase().includes(q)).slice(0, 5);
  }, [data, q]);

  const hasResults = conceptResults.length > 0 || noteResults.length > 0;
  const showEmpty  = q.length > 1 && !hasResults && data;
  const showHint   = !q && data;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-row">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search your concepts and notes…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
          />
          <kbd className="search-kbd" onClick={onClose}>esc</kbd>
        </div>

        <div className="search-results">
          {showHint && (
            <div className="search-hint">
              {data.covered.length > 0
                ? `${data.covered.length} concepts studied · ${data.notes.length} notes`
                : 'Start studying to see concepts here'}
            </div>
          )}

          {conceptResults.length > 0 && (
            <div className="search-group">
              <div className="search-group-label">Concepts</div>
              {conceptResults.map(c => (
                <button key={`${c.subject_id}:${c.concept_id}`} className="search-result-row" onClick={() => { onStudy(c); onClose(); }}>
                  <span className="search-result-dot" style={{ background: c.subject_color }} />
                  <div className="search-result-info">
                    <span className="search-result-name">{c.concept_name}</span>
                    <span className="search-result-sub">{c.subject_name}</span>
                  </div>
                  <span className={`search-result-badge ${c.mastered ? 'mastered' : 'covered'}`}>
                    {c.mastered ? 'Mastered' : 'Covered'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {noteResults.length > 0 && (
            <div className="search-group">
              <div className="search-group-label">Notes</div>
              {noteResults.map(n => (
                <button key={n.id} className="search-result-row search-result-note" onClick={() => { onStudy(n); onClose(); }}>
                  <svg className="search-note-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                  </svg>
                  <div className="search-result-info">
                    <span className="search-result-name search-result-note-text">{n.content.slice(0, 80)}{n.content.length > 80 ? '…' : ''}</span>
                    {n.subject_name && <span className="search-result-sub">{n.subject_name}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showEmpty && (
            <div className="search-empty">No results for "<strong>{query}</strong>"</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ student, view, onCourses, onDashboard, onCareerPath, onProfile, onCommunity, onPrograms, onLibrary, onLabs, onLogout, hasCareer, avatarColor, avatarNum, onSearch, onContact }) {
  const navItems = [
    {
      id: 'home',
      label: 'Courses',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
      onClick: onCourses,
      active: view === 'home' || view === 'chat',
    },
    {
      id: 'dashboard',
      label: 'My Progress',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
      onClick: onDashboard,
      active: view === 'dashboard' || view === 'capstone',
    },
    {
      id: 'career',
      label: ACTIVE_REGION === 'us' ? 'My Path' : hasCareer ? 'My Path' : 'Discover Path',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
      onClick: onCareerPath,
      active: view === 'career-map' || view === 'career-select',
    },
    {
      id: 'library',
      label: 'My Library',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
      onClick: onLibrary,
      active: view === 'library',
    },
    ...(ACTIVE_REGION !== 'us' ? [{
      id: 'labs',
      label: 'Innovation Labs',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 01-.211.896L4.72 18.578A1 1 0 005.596 20h12.808a1 1 0 00.876-1.422L14.21 10.423A2 2 0 0114 9.527V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/><line x1="7" y1="16" x2="17" y2="16"/></svg>,
      onClick: onLabs,
      active: view === 'labs' || view === 'lab-project',
      sublabel: 'Real-world projects',
    }] : []),
    {
      id: 'community',
      label: 'Community',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
      onClick: onCommunity,
      active: view === 'community',
    },
    ...(ACTIVE_REGION !== 'us' ? [{
      id: 'programs',
      label: 'Degree Programs',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
      onClick: onPrograms,
      active: view === 'programs',
      sublabel: 'Admissions open · 2026',
    }] : []),
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo-3.png" alt="Bversity" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${item.active ? 'active' : ''}`}
            onClick={item.onClick}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">
              {item.label}
              {item.sublabel && <span className="sidebar-item-sublabel">{item.sublabel}</span>}
            </span>
            {item.badge && <span className="sidebar-item-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-founder-btn" onClick={onContact}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>Talk to Sudharsan</span>
        </button>
        <div className="sidebar-user" onClick={onProfile} style={{ cursor: 'pointer' }} title="Edit profile">
          {avatarNum
            ? <img src={`/avatars/Number=${avatarNum}.png`} alt={student.name} className="sidebar-avatar-img" />
            : <div className="sidebar-avatar" style={{ background: avatarColor || 'var(--teal)' }}>{student.name.charAt(0).toUpperCase()}</div>
          }
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{student.name}</span>
            <span className="sidebar-user-sub">View profile</span>
          </div>
          <button className="sidebar-logout-btn" onClick={e => { e.stopPropagation(); onLogout(); }} title="Sign out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Login ──────────────────────────────────────────────────────────────────

// ── Industry Innovation Labs data ──────────────────────────────────────────

const INDUSTRY_LABS = [
  {
    subject_id: 'bioinformatics', subject_name: 'Bioinformatics', color: '#00A896',
    projects: [
      {
        id: 'bio_p1', title: 'Decode a Rare Disease Gene', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'ClinVar', url: 'https://www.ncbi.nlm.nih.gov/clinvar/' }, { name: 'gnomAD', url: 'https://gnomad.broadinstitute.org/' }, { name: 'NCBI Gene', url: 'https://www.ncbi.nlm.nih.gov/gene/' }, { name: 'UniProt', url: 'https://www.uniprot.org/' }],
        scenario: "You're a junior bioinformatician at a rare disease research institute. A clinical geneticist walks in with a case: a 7-year-old with progressive muscle weakness, no confirmed diagnosis after two years of testing. Whole-exome sequencing has flagged three variants in the DMD gene. Your job is to interpret them.",
        problem: 'Determine which variant is most likely pathogenic, justify your reasoning using clinical databases, and produce a 1-page variant interpretation report.',
        why_it_matters: 'Variant interpretation is one of the most in-demand skills in clinical genomics. Every genomics lab, hospital genetics department, and rare disease biotech needs people who can do this accurately.',
        expected_output: 'A 1-page variant interpretation report: variant details, ACMG evidence, classification, and a clear recommendation to the clinician.',
        steps: [
          { id: 's1', text: 'Open ClinVar and search for the DMD gene. Browse pathogenic variants  -  note what types are reported (nonsense, frameshift, missense). Get familiar with how ClinVar classifies variants.', hint: 'Use the Gene filter on the left sidebar. Look for variants with "Pathogenic" or "Likely pathogenic" significance. ClinVar shows the evidence submitted by labs worldwide.' },
          { id: 's2', text: 'Open gnomAD and search for the DMD gene. Understand what allele frequency means: a variant seen in >1% of the population is unlikely to cause a rare disease. Note the AF threshold you will use (<0.01%).', hint: 'gnomAD shows how common a variant is across 125,000+ exomes. Rare disease variants are typically absent or extremely rare (AF < 0.0001). A high AF = likely benign.' },
          { id: 's3', text: 'Look up DMD on NCBI Gene. Read the gene summary. Understand what dystrophin does and why loss-of-function causes disease. Write 2 sentences summarising this.', hint: 'DMD encodes dystrophin, a structural protein in muscle fibres. Without it, muscle cells rupture during contraction. Loss-of-function variants (frameshift, nonsense) disrupt the reading frame and prevent functional protein production.' },
          { id: 's4', text: 'Classify each of three hypothetical variants: (A) c.8713C>T (p.Arg2905*)  -  a nonsense variant, absent from gnomAD, reported pathogenic in ClinVar. (B) c.4515G>A (p.Glu1505=)  -  synonymous, in gnomAD at AF 0.3%. (C) c.9274G>A (p.Gly3092Ser)  -  missense, no ClinVar entries, AF 0.005%. Write ACMG classification for each.', hint: 'Variant A: PVS1 (null variant in a gene where LoF causes disease) + PS1 (same amino acid change as known pathogenic) = Pathogenic. Variant B: synonymous + common = Benign. Variant C: rare missense, no functional data = Uncertain Significance.' },
          { id: 's5', text: 'Write your 1-page report. Structure: Patient context → Variants identified → Evidence per variant → Final classification → Recommendation to clinician. Keep it under 450 words. Be direct  -  clinicians need clear conclusions.', hint: 'A good report says: "Variant A (c.8713C>T) is classified Pathogenic based on PVS1 and ClinVar evidence. This is consistent with a diagnosis of Duchenne Muscular Dystrophy. We recommend genetic counselling and referral to a neuromuscular specialist." No hedging.' },
          { id: 's6', text: 'Review your report. Does it tell the clinician what to do next? Is every classification backed by at least two pieces of evidence? Would a non-specialist understand it? Finalise.', hint: 'Read it aloud. If any sentence is unclear, rewrite it. Precision and clarity are both required in clinical reporting.' },
        ],
        rubric: ['Correctly identified the pathogenic variant with at least two pieces of evidence', 'Applied ACMG criteria accurately to all three variants', 'Report is structured, specific, and actionable for a clinician', 'Demonstrates understanding of what the DMD gene does and why the variant causes disease'],
        whats_next: ['Try Project 2: Build a Sequence Homology Pipeline', 'Continue the Bioinformatics curriculum', 'Attempt the Bioinformatics Capstone'],
      },
      {
        id: 'bio_p2', title: 'Build a Sequence Homology Pipeline', time: '3–4 hours', difficulty: 'Intermediate',
        tools: [{ name: 'NCBI BLASTp', url: 'https://blast.ncbi.nlm.nih.gov/Blast.cgi?PAGE=Proteins' }, { name: 'Clustal Omega', url: 'https://www.ebi.ac.uk/Tools/msa/clustalo/' }, { name: 'iTOL', url: 'https://itol.embl.de/' }, { name: 'UniProt', url: 'https://www.uniprot.org/' }],
        scenario: "You've joined a biotech startup engineering novel enzymes for gene editing. Your PI found a promising bacterial nuclease in a published paper and wants to know: how conserved is it across species, and are there natural variants worth testing? Before spending lab time, she wants a computational answer.",
        problem: 'Identify homologs of a target protein using BLAST, perform a multiple sequence alignment, build a phylogenetic tree, and identify the most conserved  -  and therefore functionally critical  -  regions.',
        why_it_matters: 'Homology analysis is used every day in drug target validation, protein engineering, and evolutionary biology. The ability to identify conserved functional residues from sequence alone is a core skill.',
        expected_output: 'A phylogenetic tree image, annotated alignment highlighting conserved regions, and a 1-paragraph written recommendation for which species variant to test first.',
        steps: [
          { id: 's1', text: 'Go to UniProt. Search for "Cas9 Streptococcus pyogenes" and open the SpCas9 entry (Q99ZW2). Download the protein sequence in FASTA format.', hint: 'The FASTA download is under the Sequences section. The format starts with a > header line followed by the amino acid sequence. Copy the entire thing including the > line.' },
          { id: 's2', text: 'Go to NCBI BLASTp. Paste your FASTA sequence. Set database to "UniProtKB/Swiss-Prot", limit results to 15 hits, and run. Wait for results.', hint: 'BLASTp compares your protein sequence against a database. The E-value measures statistical significance  -  lower is more significant. Identity % tells you how similar the sequences are.' },
          { id: 's3', text: 'From your BLAST results, select 8 hits from different bacterial species. Aim for a range of identity percentages (30–95%). Download their sequences and combine them with your original SpCas9 into a single FASTA file.', hint: 'Diversity matters for a good tree. Pick hits from different genera, not just Streptococcus. A range of identity values will give a more informative phylogenetic analysis.' },
          { id: 's4', text: 'Upload all 9 sequences to Clustal Omega and run a multiple sequence alignment. Download the alignment output.', hint: 'Clustal Omega aligns all sequences simultaneously. Positions where all sequences have the same amino acid are 100% conserved. These are your most important residues.' },
          { id: 's5', text: 'Examine the alignment output. Identify at least 3 columns that are identical across all species. Look up what these positions correspond to in SpCas9  -  are they in the RuvC or HNH nuclease domains? Write one sentence per conserved region.', hint: 'SpCas9 has two nuclease domains: HNH (cuts the target strand) and RuvC (cuts the non-target strand). Key catalytic residues include D10 (RuvC) and H840 (HNH). If these are conserved in your alignment, that is significant.' },
          { id: 's6', text: 'Build a phylogenetic tree. Use the Newick tree output from Clustal Omega, upload it to iTOL, and download or screenshot the visualisation. Label each branch with the species name.', hint: 'iTOL (Interactive Tree of Life) can import Newick format trees directly. Once uploaded, use the display options to show labels and branch lengths.' },
          { id: 's7', text: 'Write a 1-paragraph recommendation: which species variant would you prioritise for lab testing, and why? Consider: how close it is to SpCas9 (easier to predict behaviour), whether its active site residues are conserved, and whether the organism it comes from has any useful properties.', hint: 'A good recommendation considers both scientific rationale (active site conservation) and practical factors (the closer to SpCas9, the more predictable the behaviour in human cells). SaCas9 from S. aureus is a good real-world example  -  smaller, packaged more easily into AAV.' },
        ],
        rubric: ['BLASTp search performed correctly with diverse, meaningful species selected', 'Conserved regions identified and their functional significance explained', 'Phylogenetic tree is correctly constructed and interpretable', 'Recommendation shows understanding of both biology and practical constraints'],
        whats_next: ['Try Project 1: Decode a Rare Disease Gene', 'Continue the Bioinformatics curriculum', 'Attempt the Bioinformatics Capstone'],
      },
    ],
  },
  {
    subject_id: 'genomics', subject_name: 'Genomics', color: '#7B2D8B',
    projects: [
      {
        id: 'gen_p1', title: 'Interpret a Clinical WGS Case', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'GWAS Catalog', url: 'https://www.ebi.ac.uk/gwas/' }, { name: 'ClinVar', url: 'https://www.ncbi.nlm.nih.gov/clinvar/' }, { name: 'OMIM', url: 'https://www.omim.org/' }, { name: 'gnomAD', url: 'https://gnomad.broadinstitute.org/' }],
        scenario: "You're a genomics analyst at a precision medicine company. A clinician has referred a 45-year-old woman with a strong family history of breast and ovarian cancer. Her whole-genome sequencing report has returned three flagged variants: one in BRCA1, one in PALB2, and one in ATM. Your job is to interpret clinical significance and draft the recommendation.",
        problem: 'Evaluate three cancer predisposition variants, determine which represent actionable findings, and produce a structured clinical genomics report.',
        why_it_matters: 'Clinical genome interpretation is the bridge between sequencing technology and patient care. Genomics analysts at hospitals, cancer centres, and diagnostics companies do exactly this work every day.',
        expected_output: 'A structured 1-page clinical genomics report with variant classifications, evidence, and a clinical recommendation for each gene.',
        steps: [
          { id: 's1', text: 'Open OMIM (omim.org) and search for BRCA1, PALB2, and ATM. For each gene, note: what syndrome is associated with it, what cancers it increases risk for, and what the inheritance pattern is.', hint: 'BRCA1 is associated with Hereditary Breast and Ovarian Cancer syndrome (HBOC), autosomal dominant. PALB2 is now recognised as a high-risk breast cancer gene. ATM confers moderate risk. Note the relative risk increases.' },
          { id: 's2', text: 'Search ClinVar for a pathogenic BRCA1 variant: c.5266dupC (p.Gln1756Profs*74). Note how many labs have submitted evidence, what the review status is, and what conditions it is associated with.', hint: 'c.5266dupC (formerly 5382insC) is one of the most common BRCA1 founder mutations. ClinVar shows "5 stars" for variants with expert panel review. Look at the evidence submitters  -  you will see ENIGMA, a major international consortium.' },
          { id: 's3', text: 'Now look up an ATM variant: c.7271T>G (p.Val2424Gly) in ClinVar. This variant has conflicting interpretations. Note which labs classified it as pathogenic and which as uncertain. Understand why the same variant gets different classifications.', hint: 'Conflicting interpretations arise when labs use different evidence weightings. Some labs require functional data; others use population frequency alone. The variant\'s penetrance (how often it causes disease) is also debated for ATM.' },
          { id: 's4', text: 'Check gnomAD for both variants. Note the allele frequency. A pathogenic cancer predisposition variant should be very rare (<0.001% in the general population). Does what you see match the classifications?', hint: 'BRCA1 founder mutations are extremely rare globally but enriched in certain populations (Ashkenazi Jewish). Even then, AF is typically <0.5%. An AF of >1% would be inconsistent with a highly penetrant disease variant.' },
          { id: 's5', text: 'Assign clinical significance to each of the three variants using ACMG criteria: BRCA1 (pathogenic), ATM (uncertain significance), PALB2 (assume: likely pathogenic). Write the evidence basis for each classification in 2–3 sentences.', hint: 'For BRCA1: PVS1 (frameshift/null variant) + PS4 (observed in many affected individuals) = Pathogenic. For ATM: conflicting evidence, no functional data = Uncertain Significance. For PALB2 likely pathogenic: population data + segregation data.' },
          { id: 's6', text: 'Write your clinical report. Include: patient demographics, variants found, classification per variant, what each means for cancer risk, and a recommendation (e.g., referral to genetic counsellor, surveillance protocol, cascade testing for family members).', hint: 'Actionable findings (BRCA1 pathogenic) require immediate referral. Uncertain significance findings should be reported but NOT used to drive clinical decisions  -  and you must say this explicitly. Family cascade testing is standard for pathogenic findings.' },
        ],
        rubric: ['Correctly classified all three variants with evidence cited', 'Demonstrated understanding of ACMG criteria and why uncertain significance cannot drive clinical decisions', 'Recommendations are appropriate and specific (not generic)', 'Report is structured and written for a clinical audience'],
        whats_next: ['Try Project 2: Design a Liquid Biopsy Panel', 'Continue the Genomics curriculum', 'Attempt the Genomics Capstone'],
      },
      {
        id: 'gen_p2', title: 'Design a Liquid Biopsy Panel', time: '3–4 hours', difficulty: 'Intermediate',
        tools: [{ name: 'Foundation One CDx label', url: 'https://www.accessdata.fda.gov/cdrh_docs/pdf17/P170019C.pdf' }, { name: 'COSMIC', url: 'https://cancer.sanger.ac.uk/cosmic' }, { name: 'ClinicalTrials.gov', url: 'https://clinicaltrials.gov/' }, { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }],
        scenario: "You're a genomics scientist at a diagnostics startup building a ctDNA liquid biopsy panel for non-small cell lung cancer (NSCLC). Your VP has asked you to design a 5-gene panel that covers the most clinically actionable mutations, justify every gene inclusion, and compare your panel to Foundation One Liquid CDx.",
        problem: 'Select 5 genes for an NSCLC liquid biopsy panel, justify each with clinical evidence (approved therapies or trial data), and compare your panel to an existing commercial product.',
        why_it_matters: 'Liquid biopsy is one of the fastest-growing areas in oncology diagnostics. Designing a gene panel requires understanding both the biology of cancer and the clinical landscape of approved targeted therapies.',
        expected_output: 'A 1-page panel design document: 5 genes with justification, matched therapies, and a comparison table against Foundation One Liquid CDx.',
        steps: [
          { id: 's1', text: 'Open COSMIC (cancer.sanger.ac.uk). Search for "lung" in the Cancer Gene Census. Identify the top 10 most frequently mutated genes in lung adenocarcinoma. Write down the top 5 you will investigate further.', hint: 'COSMIC tracks somatic mutations across thousands of tumour types. For NSCLC adenocarcinoma, the most commonly mutated genes include EGFR, KRAS, ALK (fusion), ROS1 (fusion), MET, BRAF, RET, NTRK1, and TP53.' },
          { id: 's2', text: 'For each of your 5 candidate genes, search ClinicalTrials.gov or PubMed for an FDA-approved targeted therapy. Write the gene, the mutation type (e.g., EGFR exon 19 deletion), the matched drug (e.g., osimertinib), and the approval year.', hint: 'Strong panel genes have approved therapies: EGFR → osimertinib (Tagrisso), ALK → alectinib (Alecensa), ROS1 → crizotinib, BRAF V600E → dabrafenib+trametinib, MET exon 14 → capmatinib. Each represents a companion diagnostic opportunity.' },
          { id: 's3', text: 'Download the Foundation One Liquid CDx FDA label (link above). Find the list of biomarkers it reports. Note which genes it includes for NSCLC. How many of your 5 genes overlap?', hint: 'Foundation One Liquid CDx reports 324 genes but highlights specific biomarkers for matched therapies. For NSCLC, look at Table 1 in the label which lists therapeutic indications by biomarker. It covers EGFR, ALK, ROS1, BRAF, MET, RET, and NTRK1/2/3.' },
          { id: 's4', text: 'Now consider sensitivity vs. specificity for a liquid biopsy panel. ctDNA circulates at very low allele frequencies (<0.1% in early disease). What does this mean for your panel design? Should you prioritise genes with hotspot mutations or broad coverage?', hint: 'Hotspot panels (targeting specific known mutations like KRAS G12C, EGFR exon 19 del) offer higher sensitivity at low allele frequency because you know exactly where to look. Broad coverage panels can detect novel mutations but require deeper sequencing. For a 5-gene panel, hotspot design is more practical.' },
          { id: 's5', text: 'Finalise your 5-gene panel. For each gene write: (1) mutation type targeted, (2) frequency in NSCLC (from COSMIC), (3) matched approved therapy, (4) why you included it over alternatives.', hint: 'A good panel maximises clinical actionability per gene. TP53 is commonly mutated but has no matched therapy  -  so despite high frequency, it adds less clinical value than EGFR or ALK. Justify inclusions in terms of patient impact.' },
          { id: 's6', text: 'Build a comparison table: your panel vs. Foundation One Liquid CDx. Columns: gene, mutation type, matched therapy, included in F1? Conclude with 1 paragraph: what does your focused panel offer that a 324-gene panel does not? (Think: turnaround time, cost, sensitivity at low VAF.)', hint: 'Focused panels have advantages: faster turnaround, lower cost, higher sensitivity for targeted mutations (you can sequence deeper at fewer loci), and simpler data interpretation. The trade-off is missing novel or rare mutations.' },
        ],
        rubric: ['5 genes selected with clear evidence-based justification and matched approved therapies', 'Demonstrates understanding of liquid biopsy sensitivity and allele frequency considerations', 'Comparison to Foundation One CDx is accurate and shows understanding of commercial landscape', 'Panel design shows awareness of clinical utility vs. breadth trade-offs'],
        whats_next: ['Try Project 1: Interpret a Clinical WGS Case', 'Continue the Genomics curriculum', 'Attempt the Genomics Capstone'],
      },
    ],
  },
  {
    subject_id: 'drug_discovery', subject_name: 'Drug Discovery & Development', color: '#E05C00',
    projects: [
      {
        id: 'dd_p1', title: 'Target an Undrugged Protein', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'ChEMBL', url: 'https://www.ebi.ac.uk/chembl/' }, { name: 'PDB', url: 'https://www.rcsb.org/' }, { name: 'UniProt', url: 'https://www.uniprot.org/' }, { name: 'Open Targets', url: 'https://www.opentargets.org/' }],
        scenario: "You're a drug discovery scientist at a startup working on pancreatic cancer. Most pancreatic cancers are driven by KRAS mutations  -  historically called 'undruggable.' Amgen's sotorasib changed that in 2021 for KRAS G12C in lung cancer, but the KRAS G12D mutation (dominant in pancreatic cancer) still has no approved therapy. Your challenge is to assess whether KRAS G12D is a viable target today.",
        problem: 'Evaluate KRAS G12D as a drug target using public databases: assess target validity, existing chemical matter, structural tractability, and write a 1-page target assessment memo.',
        why_it_matters: 'Target selection is the most consequential decision in drug discovery. A well-reasoned target assessment memo is exactly what a drug discovery team produces before committing years of work and hundreds of millions of dollars.',
        expected_output: 'A 1-page target assessment memo covering: disease linkage, existing compounds, structural analysis, and a go/no-go recommendation with rationale.',
        steps: [
          { id: 's1', text: 'Open Open Targets (opentargets.org). Search for KRAS. Find its overall association score with pancreatic cancer and lung cancer. Note the evidence types contributing to the score (genetic, somatic mutation, literature).', hint: 'Open Targets aggregates genetic and clinical evidence for target-disease associations. A high score means strong evidence that the target is causally involved in the disease. Look at the "Somatic mutations" evidence for KRAS in pancreatic cancer  -  it should be very high.' },
          { id: 's2', text: 'Search ChEMBL for KRAS. Find how many bioactive compounds have been reported. Filter to compounds with activity against KRAS G12C specifically. Note the contrast with KRAS G12D  -  how many approved drugs target each?', hint: 'ChEMBL will show sotorasib and adagrasib targeting KRAS G12C. For KRAS G12D, you will find experimental compounds in early development but no approved drugs. This contrast is the heart of the project.' },
          { id: 's3', text: 'Open the RCSB PDB. Search for "KRAS G12D" structures. Open one structure. Look at the binding pocket around position 12. Is there a clear pocket for a small molecule to bind? Note the GDP/GTP binding site.', hint: 'KRAS is a GTPase  -  it cycles between GDP-bound (inactive) and GTP-bound (active) states. The G12D mutation locks it in the active state. The challenge is that KRAS has a very shallow binding groove, unlike classic enzyme active sites. Look for the switch I and switch II regions.' },
          { id: 's4', text: 'Search PubMed for "KRAS G12D inhibitor 2023 2024." Find at least one experimental compound that has shown activity. Note the compound name, mechanism (covalent vs. non-covalent), and what stage of development it is in.', hint: 'MRTX1133 from Mirati Therapeutics is a non-covalent KRAS G12D inhibitor that reached clinical trials in 2023. Others include compounds from Revolution Medicines and Relay Therapeutics. Note that G12D is harder than G12C because there is no cysteine for covalent warhead attachment.' },
          { id: 's5', text: 'Summarise the target landscape in a structured table: Disease linkage (strong/moderate/weak), Genetic validation (yes/no), Existing approved drugs (yes/no), Structural tractability (high/medium/low), Clinical compounds (yes/no).', hint: 'KRAS G12D: Disease linkage = strong (>90% of pancreatic cancers). Genetic validation = yes (oncogenic driver). Approved drugs = no. Structural tractability = medium (improving). Clinical compounds = yes (MRTX1133, others). This is a genuinely tractable but hard target.' },
          { id: 's6', text: 'Write your 1-page target assessment memo. Structure: Background → Target Biology → Drug Discovery Landscape → Structural Assessment → Recommendation. Your recommendation should be "Go" or "No Go" with clear rationale. State what the key risk is.', hint: 'A strong memo is decisive. Example conclusion: "We recommend pursuing KRAS G12D as a primary target. Genetic validation is unambiguous. The structural challenge of the flat binding pocket has been addressed by recent non-covalent inhibitors. Key risk: differentiation from MRTX1133  -  our programme must identify a clear competitive advantage in potency, selectivity, or PK profile."' },
        ],
        rubric: ['Target assessment covers all five dimensions with evidence from public databases', 'Demonstrates understanding of KRAS biology and why it was historically undruggable', 'Structural analysis shows engagement with PDB data, not just text descriptions', 'Recommendation is clear, decisive, and backed by specific evidence'],
        whats_next: ['Try Project 2: Reverse-Engineer a Phase III Failure', 'Continue the Drug Discovery curriculum', 'Attempt the Drug Discovery Capstone'],
      },
      {
        id: 'dd_p2', title: 'Reverse-Engineer a Phase III Failure', time: '3–4 hours', difficulty: 'Intermediate',
        tools: [{ name: 'ClinicalTrials.gov', url: 'https://clinicaltrials.gov/' }, { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }, { name: 'FDA Drug Databases', url: 'https://www.fda.gov/drugs/drug-approvals-and-databases' }],
        scenario: "Solanezumab was Eli Lilly's anti-amyloid antibody for Alzheimer's disease. It passed Phase II and entered two large Phase III trials  -  EXPEDITION and EXPEDITION2  -  involving thousands of patients and nearly a billion dollars in investment. Both trials failed to meet their primary endpoints. Lilly continued with a third trial. It also failed. You are going to figure out why.",
        problem: "Using publicly available clinical trial data, reconstruct why solanezumab failed across three Phase III trials, identify the key scientific and design errors, and propose what you would have done differently.",
        why_it_matters: 'Understanding drug failures is as important as understanding successes. The mistakes made in Alzheimer\'s drug development  -  and the lessons from solanezumab specifically  -  reshaped how the entire field designs trials and selects patients.',
        expected_output: 'A structured 1-page failure analysis: timeline, hypothesis, what the data showed, why it failed, and 3 specific things you would have done differently.',
        steps: [
          { id: 's1', text: 'Search ClinicalTrials.gov for "solanezumab." Open the EXPEDITION3 trial (NCT01900665). Read the study design: primary endpoint, patient population (mild vs. moderate Alzheimer\'s), intervention, and duration.', hint: 'EXPEDITION3 enrolled patients with mild Alzheimer\'s specifically  -  this was a design change from the earlier trials after a post-hoc analysis suggested the drug might work better in milder disease. Note the primary endpoint: CDR-SB (Clinical Dementia Rating Sum of Boxes).' },
          { id: 's2', text: 'Search PubMed for "solanezumab EXPEDITION results." Find the NEJM paper (Doody et al., 2014) reporting EXPEDITION and EXPEDITION2 results. Note the primary outcome and whether the drug met it. What did the secondary outcomes show?', hint: 'The primary endpoint was not met. However, a pre-specified secondary analysis of mild Alzheimer\'s patients showed a 34% slowing of cognitive decline. This is what justified EXPEDITION3  -  which ultimately also failed.' },
          { id: 's3', text: 'Read about the amyloid hypothesis: the idea that amyloid-beta plaques cause Alzheimer\'s. Solanezumab targeted soluble amyloid-beta, not plaques. Search PubMed for "soluble vs. insoluble amyloid Alzheimer\'s" and note the debate.', hint: 'Solanezumab binds soluble monomeric amyloid-beta  -  the form circulating in the bloodstream  -  rather than insoluble plaques. The hypothesis was that clearing soluble amyloid would prevent plaque formation. Critics argued the drug needed to engage the actual plaques in the brain. Compare this to lecanemab, which targets protofibrils and was approved in 2023.' },
          { id: 's4', text: 'Identify the three most likely reasons solanezumab failed: (1) wrong patient population, (2) wrong target form of amyloid, (3) treatment too late. Write one paragraph of evidence for each, citing the trial data or biology.', hint: 'Wrong population: the drug was tested in symptomatic patients where brain damage was already extensive. Wrong form: monomeric amyloid may not be the toxic species. Too late: amyloid accumulates 10–15 years before symptoms  -  by diagnosis, the window may have closed. The A4 trial tested solanezumab in pre-symptomatic patients  -  it also failed.' },
          { id: 's5', text: 'Now propose 3 specific design changes. For each: what would you change, what evidence supports the change, and what risk does it carry?', hint: 'Example changes: (1) Use PET imaging to confirm amyloid burden before enrolling patients  -  ensure you are treating the right patients. (2) Target protofibrils or plaques instead of monomers  -  like lecanemab does. (3) Enrich for APOE4 carriers who have higher amyloid burden and faster progression. Each change has a trade-off: smaller eligible population, higher trial cost, etc.' },
          { id: 's6', text: 'Write your 1-page failure analysis. Structure: What was the drug and hypothesis → What the trials showed → Three reasons it failed → Three things you would have done differently. Be specific  -  reference actual trial names, endpoints, and biology.', hint: 'The best failure analyses are honest and specific. Do not say "the endpoint was not met." Say "CDR-SB declined equally in the solanezumab and placebo arms, suggesting no slowing of cognitive decline at any stage of disease studied." Precision is what separates a good analyst from a generic one.' },
        ],
        rubric: ['Accurately reconstructed the trial timeline and primary outcomes', 'Demonstrated understanding of the amyloid hypothesis and where solanezumab fit within it', 'Three failure reasons are evidence-based, specific, and biologically grounded', 'Proposed changes are realistic and show understanding of trial design trade-offs'],
        whats_next: ['Try Project 1: Target an Undrugged Protein', 'Continue the Drug Discovery curriculum', 'Attempt the Drug Discovery Capstone'],
      },
    ],
  },
  {
    subject_id: 'clinical_trials', subject_name: 'Clinical Trials & Regulatory Affairs', color: '#0066CC',
    projects: [
      {
        id: 'ct_p1', title: 'Annotate a Real FDA Drug Approval', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'FDA Drugs@FDA', url: 'https://www.accessdata.fda.gov/scripts/cder/daf/' }, { name: 'ClinicalTrials.gov', url: 'https://clinicaltrials.gov/' }, { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }],
        scenario: "You've just joined the regulatory affairs team at a mid-size oncology biotech. Your VP wants you to understand how FDA approval packages are structured before you start working on your own NDA. She gives you an assignment: download the complete review for a recently approved drug and annotate it  -  identify the pivotal trial, the primary endpoint, the safety signal that almost blocked approval, and the label restrictions that resulted.",
        problem: "Read and annotate the FDA medical review for osimertinib (Tagrisso)  -  the third-generation EGFR inhibitor approved for NSCLC. Map the clinical evidence to the approval decision.",
        why_it_matters: 'Being able to read and interpret an FDA medical review is a core skill for regulatory affairs, medical affairs, and clinical development roles. These documents are publicly available and form the foundation of how drugs reach patients.',
        expected_output: 'A structured annotation document: pivotal trial summary, primary endpoint and result, key safety findings, label restrictions, and your assessment of the approval rationale.',
        steps: [
          { id: 's1', text: 'Go to FDA Drugs@FDA. Search for "osimertinib." Find the original NDA approval (2015). Download the "Medical Review" PDF. It will be long (100+ pages)  -  you do not need to read every page.', hint: 'Drugs@FDA organises reviews by application number. Osimertinib\'s original NDA was approved under Breakthrough Therapy designation. Look for the summary sections first: the Medical Officer\'s review and the statistical review. Skip the raw data appendices.' },
          { id: 's2', text: 'Find the pivotal trial in the review. What was it called? What was the study design (single-arm, randomised, blinded)? What was the patient population? Note these in your annotation.', hint: 'The pivotal trial for the original approval was AURA Extension  -  a single-arm Phase II trial. Note: this was an accelerated approval based on response rate (ORR), not survival. Understand why FDA accepted a single-arm design for this indication.' },
          { id: 's3', text: 'Find the primary endpoint and the result. Was the endpoint objective response rate (ORR), progression-free survival (PFS), or overall survival (OS)? What was the result and how does it compare to historical controls?', hint: 'ORR of 57% in T790M-positive NSCLC patients who had progressed on prior EGFR therapy. This was substantially higher than chemotherapy in the same setting (~20% ORR). FDA accepted this as clinically meaningful for accelerated approval.' },
          { id: 's4', text: 'Find the safety section. What were the most common adverse events? Was there a specific safety signal that required a Black Box Warning, label restriction, or REMS? Note it.', hint: 'Osimertinib has a risk of QTc prolongation and interstitial lung disease (ILD). ILD occurred in ~3% of patients in trials and was fatal in some cases. Look for how FDA addressed this in the label  -  there should be a "Warnings and Precautions" section.' },
          { id: 's5', text: 'Read the label (Prescribing Information). Find: (1) the approved indication, (2) any patient selection requirement (companion diagnostic?), (3) the key warnings. Note how the approval was later converted from accelerated to regular approval.', hint: 'Osimertinib requires cobas EGFR Mutation Test v2 as a companion diagnostic for T790M detection. The approval was later expanded to first-line based on the FLAURA trial showing PFS benefit vs. first-gen EGFR inhibitors. Note how the indication evolved.' },
          { id: 's6', text: 'Write your annotation document. Include: Drug name and mechanism → Pivotal trial design and population → Primary endpoint and result → Key safety signals and how FDA addressed them → Label restrictions → Your 1-paragraph assessment of why FDA approved it despite being a single-arm trial.', hint: 'Your assessment should explain the regulatory reasoning: unmet medical need (no options after T790M resistance), substantial effect size (57% ORR in a population with rapidly progressing disease), and the commitment to a confirmatory trial. This is how Accelerated Approval is supposed to work.' },
        ],
        rubric: ['Pivotal trial correctly identified and described with study design details', 'Primary endpoint and result stated accurately with comparison to historical control', 'Safety signal identified and label consequence explained', 'Assessment of approval rationale shows understanding of Accelerated Approval pathway'],
        whats_next: ['Try Project 2: Write a Phase II Protocol Synopsis', 'Continue the Clinical Trials curriculum', 'Attempt the Clinical Trials Capstone'],
      },
      {
        id: 'ct_p2', title: 'Write a Phase II Protocol Synopsis', time: '3–4 hours', difficulty: 'Intermediate',
        tools: [{ name: 'ICH E6 GCP Guidelines', url: 'https://database.ich.org/sites/default/files/E6_R2__Guideline.pdf' }, { name: 'ClinicalTrials.gov', url: 'https://clinicaltrials.gov/' }, { name: 'FDA Guidance Documents', url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents' }],
        scenario: "Your biotech has just completed a Phase I trial for BV-101, a novel KRAS G12C inhibitor. Dose-limiting toxicities were defined, the MTD was established at 600mg BID, and early efficacy signals were seen in NSCLC patients. The CMO wants a Phase II protocol synopsis ready in two weeks for the board to review before the IND amendment is filed.",
        problem: 'Write a 1-page Phase II protocol synopsis for a fictitious KRAS G12C inhibitor in NSCLC, covering study design, patient population, primary and secondary endpoints, and stopping rules.',
        why_it_matters: 'Protocol writing is a core skill for clinical development, regulatory affairs, and medical affairs roles. A synopsis is what gets presented to FDA, the IRB, and the board  -  it must be precise, complete, and scientifically justified.',
        expected_output: 'A 1-page protocol synopsis with all required sections filled in, following ICH E6 structure, with justified endpoint selection.',
        steps: [
          { id: 's1', text: 'Read the ICH E6 R2 guideline (section 6: Protocol and Protocol Amendment). List the 10 elements that every clinical trial protocol must contain. These will become your synopsis sections.', hint: 'ICH E6 Section 6 lists: background/rationale, objectives, design, selection/withdrawal criteria, treatment, efficacy/safety assessments, statistics, direct access to source data, ethics, and data handling. Your synopsis needs all of these in condensed form.' },
          { id: 's2', text: 'Define your study design. Will this be single-arm or randomised? What is the control arm if randomised? What is the treatment duration? Justify each choice.', hint: 'For a Phase II oncology trial, single-arm with historical control is acceptable if the primary endpoint is response rate and the control rate is well-established. Randomisation against docetaxel (a common second-line NSCLC therapy) would be more rigorous but slower to enrol. State your reasoning.' },
          { id: 's3', text: 'Define your patient population. Write the inclusion criteria (3–5) and exclusion criteria (3–5). Be specific: EGFR/ALK wild-type? KRAS G12C confirmed by local testing? Prior platinum-based therapy? ECOG status?', hint: 'Inclusion: NSCLC with confirmed KRAS G12C mutation (by an approved CDx or validated local test), ≥1 prior line of therapy (platinum-based), ECOG PS 0–1, adequate organ function. Exclusion: symptomatic CNS metastases, prior KRAS inhibitor treatment, active autoimmune disease requiring systemic treatment.' },
          { id: 's4', text: 'Select your primary endpoint and justify it. Options: objective response rate (ORR), progression-free survival (PFS), or disease control rate (DCR). Explain why you chose it and what threshold would constitute a meaningful result.', hint: 'ORR is the most common Phase II primary endpoint in oncology  -  it is measurable earlier than PFS or OS, and FDA accepts it for accelerated approval. A meaningful threshold for KRAS G12C NSCLC second-line: ORR >30% (historical rate with docetaxel is ~10%). Use Simon\'s two-stage design to minimise exposure to an ineffective drug.' },
          { id: 's5', text: 'Select 3 secondary endpoints. For each, explain what it measures and why it matters to regulators and prescribers.', hint: 'Good secondary endpoints: (1) Duration of response (DoR)  -  how long responses last. (2) Progression-free survival (PFS)  -  time from enrolment to progression or death. (3) Safety and tolerability  -  AE rates, dose reductions, discontinuations. These give a fuller picture than ORR alone.' },
          { id: 's6', text: 'Write stopping rules for safety. Under what circumstances would the trial be paused or terminated early? Reference CTCAE grade definitions.', hint: 'Example stopping rules: ≥3 Grade 4 adverse events in the first 15 patients pause for safety review. If confirmed ILD Grade ≥2 occurs in >5% of patients, the trial is suspended. Early efficacy stopping: if ORR exceeds 60% at interim analysis, consider expanding the cohort. Use specific numbers  -  not vague language.' },
          { id: 's7', text: 'Assemble your synopsis. One page, all sections present. Title → Background (2 sentences) → Objectives → Study Design → Population → Endpoints → Stopping Rules → Statistical Analysis Plan (sample size justification). Have a colleague or peer read it  -  is every section clear?', hint: 'For sample size: assume null ORR 10%, target ORR 30%, 80% power, α 0.05 (one-sided). Simon\'s two-stage design requires ~46 evaluable patients. State this explicitly in the statistical section.' },
        ],
        rubric: ['All ICH E6 required sections are present and complete', 'Patient population (inclusion/exclusion) is specific and scientifically justified', 'Primary endpoint selection is justified with reference to historical control and regulatory precedent', 'Stopping rules are specific, use CTCAE grading, and cover both safety and efficacy scenarios'],
        whats_next: ['Try Project 1: Annotate a Real FDA Approval', 'Continue the Clinical Trials curriculum', 'Attempt the Clinical Trials Capstone'],
      },
    ],
  },
  {
    subject_id: 'genai_ml', subject_name: 'Gen AI & Machine Learning for Life Sciences', color: '#6B3FA0',
    projects: [
      {
        id: 'ai_p1', title: 'Predict a Protein Structure with ColabFold', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'ColabFold (AlphaFold2)', url: 'https://colab.research.google.com/github/sokrypton/ColabFold/blob/main/AlphaFold2.ipynb' }, { name: 'RCSB PDB', url: 'https://www.rcsb.org/' }, { name: 'iCn3D Viewer', url: 'https://www.ncbi.nlm.nih.gov/Structure/icn3d/' }],
        scenario: "You're a computational biologist at a drug discovery startup. Your target protein has no crystal structure in the PDB  -  the experimental team is backed up for months. Your PI asks you to run an AlphaFold prediction using ColabFold (free, runs in a browser), compare it to a homologous structure that does exist in the PDB, and assess how much you can trust the predicted model.",
        problem: "Run an AlphaFold2 prediction for a real protein using ColabFold, visualise the structure, interpret the pLDDT confidence scores, and compare your predicted structure to its experimental PDB counterpart.",
        why_it_matters: 'AlphaFold changed structural biology overnight. Every drug discovery team now uses it. Understanding what the model predicts well (and what it does not) is essential for anyone using it to drive decisions.',
        expected_output: 'A structure image with confidence scores annotated, a written comparison to the PDB structure, and a 1-paragraph assessment of where the model can and cannot be trusted.',
        steps: [
          { id: 's1', text: 'Open ColabFold in Google Colab (link above  -  you need a free Google account). In the "query_sequence" field, paste this sequence for lysozyme (PDB: 1LYZ): KVFERCELARTLKRLGMDGYRGISLANWMCLAKWESGYNTRATNYNAGDRSTDYGIFQINSRYWCNDGKTPGAVNACHLSCSALLQDNIADAVACAKRVVRDPQGIRAWVAWRNRCQNRDVRQYVQGCGV. Run all cells.', hint: 'ColabFold runs AlphaFold2 in the cloud for free. Click Runtime → Run All and accept the prompts. The prediction takes 5–15 minutes depending on server load. You will get a PDB file and confidence plots.' },
          { id: 's2', text: 'When the run completes, download the top-ranked model (rank_001). Also download the pLDDT confidence plot. Note the overall pLDDT score  -  above 90 is high confidence, 70–90 is moderate, below 70 is low confidence.', hint: 'pLDDT (predicted Local Distance Difference Test) is AlphaFold\'s per-residue confidence metric. High pLDDT (blue in the standard colouring) means the prediction is reliable. Low pLDDT (red/orange) often corresponds to disordered regions.' },
          { id: 's3', text: 'Open RCSB PDB. Search for 1LYZ (hen egg white lysozyme). Download the PDB file. This is the experimental crystal structure you will compare to your prediction.', hint: '1LYZ was determined by X-ray crystallography at 2.0Å resolution. It is one of the most-studied proteins in history. Your AlphaFold prediction should be highly accurate for this protein since it is a small, well-structured globular protein with no disordered regions.' },
          { id: 's4', text: 'Open iCn3D (link above). Load your ColabFold predicted structure. Colour it by pLDDT score. Note which regions are high confidence vs. low confidence. Take a screenshot.', hint: 'In iCn3D, use File → Open → PDB File to load your model. Under Style → Color → Temperature Factor you can visualise pLDDT scores (stored in the B-factor column of the ColabFold output). Blue = high confidence, red = low confidence.' },
          { id: 's5', text: 'Load the 1LYZ experimental structure in iCn3D. Visually compare the two structures. Do the secondary structure elements (alpha helices, beta sheets) align? Are there any major differences in loop regions?', hint: 'For lysozyme, the prediction should be very close to the experimental structure. Look for differences in loop regions  -  these are often less well-predicted. The core alpha helices should be essentially identical.' },
          { id: 's6', text: 'Write your 1-paragraph assessment. Answer: Where does the model perform well? Where should you be cautious? If you were using this prediction to design a drug binding site, which regions would you trust and which would you validate experimentally first?', hint: 'Key point: AlphaFold predictions for structured regions of well-folded proteins are highly reliable. Loop regions, termini, and intrinsically disordered regions are less reliable. For drug design, you should trust core structural elements but validate binding pocket geometry experimentally before committing to a lead series.' },
        ],
        rubric: ['ColabFold run successfully completed with correct sequence', 'pLDDT confidence scores correctly interpreted and annotated', 'Comparison to experimental structure is substantive and identifies specific differences', 'Assessment demonstrates understanding of where AlphaFold can and cannot be trusted'],
        whats_next: ['Try Project 2: Build a QSAR Bioactivity Classifier', 'Continue the Gen AI & ML curriculum', 'Attempt the Gen AI & ML Capstone'],
      },
      {
        id: 'ai_p2', title: 'Build a QSAR Bioactivity Classifier', time: '4–5 hours', difficulty: 'Intermediate',
        tools: [{ name: 'ChEMBL', url: 'https://www.ebi.ac.uk/chembl/' }, { name: 'Google Colab (Python)', url: 'https://colab.research.google.com/' }, { name: 'RDKit Docs', url: 'https://www.rdkit.org/docs/' }],
        scenario: "You're at a computational chemistry team within a mid-size pharma. Your team is screening thousands of compounds for activity against EGFR  -  a well-validated oncology target. Running wet lab assays on all of them would take years. Your job is to build a simple QSAR (Quantitative Structure-Activity Relationship) model using public ChEMBL data that can predict which compounds are likely to be active before they ever go into the lab.",
        problem: "Download EGFR bioactivity data from ChEMBL, featurise compounds with molecular fingerprints using RDKit, train a random forest classifier, and evaluate it with ROC-AUC and a confusion matrix.",
        why_it_matters: 'QSAR modelling is used in every major pharma company to prioritise compounds before expensive assays. Understanding how to build, evaluate, and honestly critique these models is a foundational skill in computational drug discovery.',
        expected_output: 'A working Colab notebook with the full pipeline, a ROC-AUC curve, a confusion matrix, and a written critique of the model\'s limitations.',
        steps: [
          { id: 's1', text: 'Open Google Colab. Create a new notebook. Install and import: rdkit, pandas, scikit-learn, matplotlib. Run: !pip install rdkit pandas scikit-learn matplotlib', hint: 'In Colab: !pip install rdkit installs RDKit. Import with: from rdkit import Chem; from rdkit.Chem import AllChem, DataStructs; import pandas as pd; from sklearn.ensemble import RandomForestClassifier; from sklearn.metrics import roc_auc_score, confusion_matrix' },
          { id: 's2', text: 'Go to ChEMBL. Search for "EGFR" as a target. Filter to human EGFR (CHEMBL203). Export bioactivity data as CSV (IC50 values, standard type = IC50, organism = Homo sapiens). Download and upload to Colab.', hint: 'ChEMBL will give you thousands of compounds with IC50 values against EGFR. Export with standard filters: Standard Type = IC50, Standard Units = nM. You want the SMILES column and the standard_value column at minimum.' },
          { id: 's3', text: 'In your notebook, load the CSV. Create a binary label: active (IC50 ≤ 1000 nM = 1) vs. inactive (IC50 > 1000 nM = 0). Drop rows with missing SMILES. Print class distribution.', hint: 'df["label"] = (df["standard_value"] <= 1000).astype(int). Check class balance  -  if you have 90% actives and 10% inactives, your model will be biased. Note the imbalance ratio as it affects your evaluation strategy.' },
          { id: 's4', text: 'Generate Morgan fingerprints for each compound using RDKit. Convert to a numpy array for model input. Morgan fingerprints encode circular atom environments  -  they are the standard representation for QSAR models.', hint: 'mols = [Chem.MolFromSmiles(s) for s in df["canonical_smiles"]]; fps = [AllChem.GetMorganFingerprintAsBitVect(m, 2, nBits=2048) for m in mols if m is not None]; X = np.array(fps). Use radius=2, nBits=2048 as standard parameters.' },
          { id: 's5', text: 'Split data 80/20 train/test. Train a RandomForestClassifier (n_estimators=100). Predict on the test set. Calculate ROC-AUC. Plot the ROC curve and confusion matrix.', hint: 'from sklearn.model_selection import train_test_split; X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y). A ROC-AUC of 0.85+ is good for QSAR. 0.7–0.85 is acceptable. Below 0.7 suggests the model is not useful.' },
          { id: 's6', text: 'Write a 1-paragraph critique of your model. Address: What does the ROC-AUC tell you? What are the limitations of Morgan fingerprints as features? Why might this model fail on structurally novel compounds? What would you do next to improve it?', hint: 'Key limitations: Morgan fingerprints capture local atom environments but miss 3D shape and conformational flexibility. The model was trained on historical data  -  it will perform poorly on compounds with novel scaffolds (applicability domain problem). Next steps: use 3D descriptors, add pharmacophore features, or switch to a graph neural network.' },
        ],
        rubric: ['Working notebook with complete pipeline from data loading to evaluation', 'ROC-AUC correctly calculated and plotted with proper train/test split', 'Critique demonstrates understanding of QSAR model limitations, not just accuracy reporting', 'Discussion of applicability domain and what the model cannot reliably predict'],
        whats_next: ['Try Project 1: Predict a Protein Structure with ColabFold', 'Continue the Gen AI & ML curriculum', 'Attempt the Gen AI & ML Capstone'],
      },
    ],
  },
  {
    subject_id: 'biotech_business', subject_name: 'Biotech Business & Management', color: '#B5451B',
    projects: [
      {
        id: 'bb_p1', title: 'Tear Down a Real Biotech Acquisition', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'SEC EDGAR', url: 'https://www.sec.gov/cgi-bin/browse-edgar' }, { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }, { name: 'Evaluate Pharma (free tier)', url: 'https://www.evaluate.com/vantage' }, { name: 'BMS press releases', url: 'https://news.bms.com/' }],
        scenario: "In 2022, Bristol Myers Squibb acquired Turning Point Therapeutics for $4.1 billion  -  a 122% premium to the 60-day average share price. At the time, Turning Point's lead asset repotrectinib had not yet received FDA approval. You are an analyst at a life sciences investment bank. Your MD wants a deal teardown memo on your desk by tomorrow morning.",
        problem: "Reconstruct the strategic rationale for BMS's $4.1B acquisition of Turning Point Therapeutics  -  what they were buying, why they paid a 122% premium, and whether it was worth it.",
        why_it_matters: "Deal analysis is a core skill for BD, corporate strategy, investment banking, and VC roles. Understanding what drives biotech M&A premiums  -  pipeline value, competitive dynamics, strategic fit  -  is how you evaluate deals in real time.",
        expected_output: "A 1-page deal teardown memo: what BMS bought, why they paid the premium, the key risks, and your verdict on whether it was a good deal.",
        steps: [
          { id: 's1', text: "Search PubMed for 'repotrectinib ROS1 NSCLC.' Read the TRIDENT-1 trial abstract. Note the response rate, duration of response, and how it compared to existing ROS1 inhibitors (crizotinib, lorlatinib).", hint: "Repotrectinib showed ~91% ORR in treatment-naive ROS1-positive NSCLC in TRIDENT-1. More importantly, it showed ~40% ORR in patients who had already received 1–2 prior ROS1 inhibitors. This 'next-generation' activity in a pre-treated population is the scientific anchor of the deal." },
          { id: 's2', text: "Search SEC EDGAR for the BMS acquisition proxy statement (S-4 or DEFM14A filing for Turning Point Therapeutics). Find the disclosed deal terms: upfront payment, any contingent value rights (CVRs), and the acquiree board's fairness opinion.", hint: "The BMS acquisition was an all-cash deal at $76 per share, no CVRs. The Turning Point board hired Centerview Partners to provide a fairness opinion. The S-4 will show the financial analysis supporting the price  -  look for the DCF and comparable company analysis sections." },
          { id: 's3', text: "Estimate what BMS was paying for. At the time of acquisition, repotrectinib was in Phase 3. What is the ROS1-positive NSCLC market size? What was the estimated peak sales potential? How does $4.1B relate to a risk-adjusted NPV?", hint: "ROS1-positive NSCLC is ~1–2% of NSCLC patients (~4,000 new US patients/year). At ~$150,000/year treatment cost and high penetration, peak US sales could be $500–800M. Apply a 60% probability of approval and a 12% discount rate  -  you can back into roughly $1–1.5B rNPV. The premium above that represents competitive urgency and pipeline optionality." },
          { id: 's4', text: "Identify 3 strategic reasons BMS paid a 122% premium beyond the DCF value. Think about: competitive dynamics (who else might have bid?), BMS's existing oncology portfolio, and what Turning Point's pipeline beyond repotrectinib offered.", hint: "Strategic reasons: (1) BMS needed a next-gen ROS1 asset to compete with Roche/Genentech's entrectinib and Pfizer's lorlatinib. (2) Turning Point had a broad kinase inhibitor platform with additional pipeline assets. (3) There was likely competitive tension  -  Pfizer, Roche, and Merck were all potential buyers, which pushed the price up. Fear of losing the deal to a competitor is a real premium driver." },
          { id: 's5', text: "Identify 2 key risks of the deal at the time it was announced. What could go wrong between signing and value realisation?", hint: "Risk 1: FDA approval uncertainty  -  repotrectinib was not yet approved, and accelerated approval timelines can slip. Risk 2: Commercial execution  -  the ROS1-positive NSCLC market is small and requires precise patient identification through companion diagnostics. If testing rates are low, peak sales fall. Repotrectinib was approved in late 2023 as Augtyro." },
          { id: 's6', text: "Write your 1-page teardown memo. Structure: The asset (what BMS bought) → The price and what justified it → Strategic rationale beyond DCF → Key risks → Your verdict (was it a good deal?). Be direct  -  your MD needs a view, not a summary.", hint: "A good verdict is specific: 'At $4.1B, BMS paid ~3x rNPV, which is aggressive but defensible given competitive urgency and platform optionality. The real question is whether repotrectinib can hold share against next-generation competitors in the pre-treated setting  -  the TRIDENT-1 data suggest yes. We rate this a strategically sound acquisition at a full price.'" },
        ],
        rubric: ["Correctly identified what BMS was acquiring and the clinical data supporting the premium", "rNPV logic is present  -  attempted to reconcile deal price with commercial opportunity", "Three strategic rationale points go beyond DCF and show understanding of competitive dynamics", "Verdict is specific, direct, and justified  -  not just a summary of what happened"],
        whats_next: ["Try Project 2: Build a Market Size Model for a New Modality", "Continue the Biotech Business curriculum", "Attempt the Biotech Business Capstone"],
      },
      {
        id: 'bb_p2', title: 'Build a Market Size Model for RNA Therapeutics', time: '3–4 hours', difficulty: 'Intermediate',
        tools: [{ name: 'WHO Disease Statistics', url: 'https://www.who.int/data/gho' }, { name: 'FDA Orange Book', url: 'https://www.accessdata.fda.gov/scripts/cder/ob/' }, { name: 'ClinicalTrials.gov', url: 'https://clinicaltrials.gov/' }, { name: 'Google Sheets / Excel', url: 'https://sheets.google.com' }],
        scenario: "You're a strategy analyst at a life sciences VC fund. The partners are evaluating whether to lead a $50M Series B in an RNA therapeutics company focused on rare liver diseases. Before the partners meeting, you need a bottom-up market size model that tells them: what is the realistic addressable market for RNA liver drugs over the next 10 years?",
        problem: "Build a bottom-up market size model for RNA therapeutics in rare liver diseases, including patient population estimates, treatment penetration assumptions, pricing benchmarks, and a 10-year revenue projection.",
        why_it_matters: "Market modelling is a core skill for VC, BD, strategy, and investor relations roles. A credible bottom-up model  -  grounded in epidemiology and pricing benchmarks, not top-down percentages  -  is what separates a rigorous analyst from a generic one.",
        expected_output: "A market model spreadsheet with all assumptions visible and a 1-page investment memo summarising the opportunity and your key assumptions.",
        steps: [
          { id: 's1', text: "Open a new Google Sheet. Create columns: Disease, Global Prevalence, US Prevalence, Diagnosed Rate, Treatment-Eligible Rate, Year 5 Penetration, Year 10 Penetration, Price per patient/year, Year 5 Revenue, Year 10 Revenue.", hint: "A bottom-up model builds the market from patient counts, not percentages of a total market. This is more credible because every assumption is visible and challengeable. Start with the diseases  -  pick 3: Transthyretin Amyloidosis (ATTR), Alpha-1 Antitrypsin Deficiency (AATD), and Acute Hepatic Porphyria (AHP)." },
          { id: 's2', text: "Look up global and US prevalence for each disease. ATTR: ~50,000 US patients (hATTR subtype). AATD: ~100,000 symptomatic US patients. AHP: ~3,000 diagnosed US patients. Enter these in your model with sources noted in a comment.", hint: "Be precise about what you are counting. ATTR has two forms: hereditary (hATTR, ~50,000 US) and wild-type (wtATTR, much larger but different treatment dynamics). For a rare liver RNA drug focus, use hATTR. Note your disease scope decision explicitly." },
          { id: 's3', text: "Add a 'Diagnosed Rate' column. Not all patients are diagnosed  -  especially in rare diseases. Research diagnosis rates for each: AATD is chronically underdiagnosed (~10% diagnosed). ATTR diagnosis has improved with technetium scintigraphy but remains at ~20–30% in the US. Adjust your patient numbers.", hint: "Diagnosed rate is the fraction of prevalent patients who have a confirmed diagnosis and are potentially accessible for treatment. For ATTR, ~20% diagnosed = ~10,000 US diagnosed patients. This is your starting pool before applying any additional filters." },
          { id: 's4', text: "Add pricing benchmarks. Look up current list prices: Alnylam's patisiran (Onpattro) launched at ~$450,000/patient/year. Givosiran (Givlaari) for AHP: ~$575,000/year. Use these as anchors for your price assumptions.", hint: "RNA therapeutics command ultra-high prices due to small patient populations and transformative efficacy. Your model price assumption should be $400,000–$600,000/patient/year for rare disease RNA drugs. Note that net price after rebates is typically 20–30% lower than list price." },
          { id: 's5', text: "Build penetration curves for Year 1, 5, and 10. A new RNA therapy entering a rare disease market typically reaches 10–15% penetration by Year 3, 30–40% by Year 5, 50–60% by Year 10 in well-diagnosed populations. Apply these to your diagnosed patient pool.", hint: "Penetration is slower in poorly-diagnosed diseases (AATD) and faster in better-characterised ones (AHP, where Alnylam already built physician awareness with givosiran). Adjust accordingly. Also apply an annual price erosion assumption of 2–5% per year as biosimilars or competitors may enter." },
          { id: 's6', text: "Calculate Year 5 and Year 10 total revenues across all three diseases. Sum them. Write your 1-page investment memo: What is the realistic addressable US market by Year 10? What is the key assumption driving the model? What would cause the model to be wrong on the upside and downside?", hint: "A rigorous memo names the single biggest assumption: for ATTR, it is likely diagnosis rate improvement driven by AI-assisted echocardiography screening. Upside: ATTR diagnosis rate reaches 50% (better screening). Downside: oral tafamidis (Pfizer's Vyndaqel) takes the majority of market share before RNA drugs reach peak penetration." },
        ],
        rubric: ["Bottom-up model built from patient populations, not top-down percentages", "Diagnosis rate and penetration rate assumptions are explicitly stated and justified", "Pricing benchmarks are grounded in real approved RNA drugs", "Investment memo identifies the key assumption and directional risks clearly"],
        whats_next: ["Try Project 1: Tear Down a Real Biotech Acquisition", "Continue the Biotech Business curriculum", "Attempt the Biotech Business Capstone"],
      },
    ],
  },
  {
    subject_id: 'cell_gene_therapy', subject_name: 'Cell & Gene Therapy', color: '#0891B2',
    projects: [
      {
        id: 'cgt_p1', title: 'Design a Gene Therapy Vector for Duchenne MD', time: '3–4 hours', difficulty: 'Intermediate',
        tools: [{ name: 'Addgene Vector Database', url: 'https://www.addgene.org/vector-database/' }, { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }, { name: 'ClinicalTrials.gov', url: 'https://clinicaltrials.gov/' }, { name: 'FDA ATMP Guidance', url: 'https://www.fda.gov/vaccines-blood-biologics/cellular-gene-therapy-products' }],
        scenario: "You're a vector biologist at a gene therapy startup. Your CSO has asked you to design the AAV vector construct for a microdystrophin gene therapy targeting Duchenne Muscular Dystrophy (DMD). Sarepta's Elevidys was approved in 2023  -  you need to understand what they built and design a next-generation vector with a rationale for why it would be better.",
        problem: "Design a complete AAV vector construct for microdystrophin delivery in DMD: choose the serotype, promoter, payload, and ITR configuration. Justify each choice against existing approved products.",
        why_it_matters: "Vector design is the most technically critical decision in gene therapy development. Every element  -  serotype, promoter, transgene design  -  directly determines whether the therapy will work, be safe, and be manufacturable.",
        expected_output: "A vector design document: serotype choice with rationale, promoter selection, microdystrophin construct design, safety considerations, and a 1-paragraph comparison to Elevidys.",
        steps: [
          { id: 's1', text: "Search PubMed for 'microdystrophin AAV DMD clinical trial.' Find the paper describing Sarepta's construct (SRP-9001, now Elevidys). Note the AAV serotype used, the promoter, and the microdystrophin design (which dystrophin domains are included).", hint: "Elevidys uses AAV9 as the serotype (broad muscle tropism, crosses blood-brain barrier). The promoter is MHCK7 (muscle-specific, high expression in cardiac and skeletal muscle). The microdystrophin includes spectrin-like repeats and the ABD domain  -  roughly 138kDa, fitting within AAV's 4.7kb packaging limit." },
          { id: 's2', text: "Open Addgene's Vector Database. Search for AAV vectors used in DMD or microdystrophin studies. Compare AAV8 vs. AAV9 vs. AAVrh74 for muscle tropism, immune profile, and prevalence of pre-existing antibodies in the human population.", hint: "AAVrh74 (used by Sarepta in earlier constructs) has lower pre-existing neutralising antibody prevalence than AAV9 in some populations. AAV9 reaches cardiac muscle well but has higher seroprevalence. For your next-gen design, consider: if you want to re-dose (not possible with current AAVs due to immune response), you need a different serotype or immune evasion strategy." },
          { id: 's3', text: "Design your microdystrophin construct. The full dystrophin cDNA is 11.1kb  -  far too large for AAV. You need to select which domains to keep. Research which domains are essential: the actin-binding domain (ABD), the central rod domain (how many spectrin-like repeats?), and the C-terminal domain.", hint: "Essential domains for function: N-terminal ABD (binds F-actin), at least 4 spectrin-like repeats (R1-R3, R24 are commonly used), and the C-terminal domain (binds the DGC complex). Hinge regions H1, H2, H3 are needed for flexibility. The key trade-off: more repeats = better function but larger construct size." },
          { id: 's4', text: "Choose your promoter. Options: CMV (ubiquitous, strong but silenced over time), CK8 or MHCK7 (muscle-specific, avoids off-target expression), MCK (strong in mature muscle). Justify your choice for DMD.", hint: "Muscle-specific promoters (MHCK7, CK8) are preferred for DMD because they restrict expression to skeletal and cardiac muscle, reducing off-target liver expression and potential immunogenicity. Sarepta uses MHCK7. A next-gen improvement could be a promoter with stronger cardiac expression given DMD cardiomyopathy is a major cause of death." },
          { id: 's5', text: "Address safety: what are the three main safety risks of your AAV construct and how would you mitigate each?", hint: "Risk 1: Pre-existing neutralising antibodies  -  mitigate by screening patients pre-dosing (exclude seropositive patients or use immunosuppression). Risk 2: Immune response to microdystrophin (seen in some Elevidys patients)  -  mitigate with transient immunosuppression protocol. Risk 3: Genotoxicity  -  AAV integrates rarely but randomly; mitigate by selecting a self-complementary design and avoiding strong enhancers near proto-oncogenes." },
          { id: 's6', text: "Write a 1-paragraph comparison to Elevidys. What design choices did you make differently and why? What would be the key experiment to validate your next-gen construct is superior?", hint: "Be specific: if you chose AAVrh74 over AAV9, explain the seroprevalence rationale. If you added extra spectrin-like repeats, cite the functional data showing improved muscle force. The key validation experiment: a head-to-head comparison in mdx mice measuring specific muscle force (not just western blot) and cardiac function at 6 months." },
        ],
        rubric: ["Serotype choice is justified with reference to tropism, seroprevalence, and immune profile data", "Microdystrophin domain selection is scientifically grounded  -  essential domains identified correctly", "Promoter choice is appropriate for DMD and justified against alternatives", "Safety risks are specific and mitigations are realistic and evidence-based"],
        whats_next: ["Try Project 2: Audit a Real Gene Therapy FDA Approval", "Continue the Cell & Gene Therapy curriculum", "Attempt the CGT Capstone"],
      },
      {
        id: 'cgt_p2', title: 'Audit a Real Gene Therapy FDA Approval', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'FDA Biologics License Applications', url: 'https://www.fda.gov/vaccines-blood-biologics/biologics-license-applications-bla-process' }, { name: 'FDA Elevidys Approval Package', url: 'https://www.fda.gov/vaccines-blood-biologics/biologics-license-applications-bla-process/elevidys' }, { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }],
        scenario: "Elevidys (delandistrogene moxeparvovec) became the first approved gene therapy for Duchenne Muscular Dystrophy in June 2023  -  and it was controversial. FDA granted accelerated approval over the objection of its own advisory committee. You are a regulatory consultant. A client wants to understand what FDA required, what the controversy was, and what the confirmatory trial must show.",
        problem: "Audit the Elevidys FDA approval: understand the clinical evidence package, the accelerated approval controversy, the surrogate endpoint debate, and what the EMBARK confirmatory trial must demonstrate.",
        why_it_matters: "Analysing a controversial approval teaches you more about FDA's decision-making than any textbook. The Elevidys approval is a masterclass in surrogate endpoints, unmet medical need, and the politics of accelerated approval.",
        expected_output: "A structured audit document: evidence package summary, why the advisory committee voted against approval, FDA's reasoning for overriding them, and what EMBARK must show for full approval.",
        steps: [
          { id: 's1', text: "Search PubMed for 'delandistrogene moxeparvovec Elevidys FDA 2023.' Find the NEJM paper by Mendell et al. reporting the pivotal trial results. Note the primary endpoint, the result, and the patient age range studied.", hint: "The pivotal trial used microdystrophin expression (measured by western blot as % of normal) as the primary endpoint  -  a surrogate biomarker. The trial showed significant increase in microdystrophin expression. The controversy is whether this protein expression translates to clinical benefit (functional improvement)." },
          { id: 's2', text: "Find the FDA advisory committee meeting transcript or briefing document for Elevidys (May 2023). What was the committee vote? What was the main concern they raised about the surrogate endpoint?", hint: "The Peripheral and Central Nervous System Drugs Advisory Committee voted 8-6 against approval. The core concern: microdystrophin expression is a surrogate endpoint  -  there was no statistically significant evidence that it translated to functional improvement (e.g., North Star Ambulatory Assessment scores). FDA overrode the adcom recommendation, which is unusual and controversial." },
          { id: 's3', text: "Understand FDA's reasoning for overriding the committee. Search for 'FDA Elevidys accelerated approval reasoning 2023.' What unmet medical need argument did FDA make? What surrogate endpoint validation did they cite?", hint: "FDA's reasoning: (1) DMD is a devastating, life-limiting disease with significant unmet need. (2) Microdystrophin production is reasonably likely to predict clinical benefit based on the natural history of partial dystrophin expression in Becker MD patients (who have less severe disease than DMD). This is the 'reasonably likely to predict' standard for accelerated approval surrogates." },
          { id: 's4', text: "Find the EMBARK confirmatory trial on ClinicalTrials.gov. Note: primary endpoint, patient population, trial duration, and expected completion date. This is what Sarepta must show to convert to full approval.", hint: "EMBARK uses the North Star Ambulatory Assessment (NSAA) as the primary functional endpoint  -  this is a validated clinical outcome measure. The trial compares treated vs. placebo in ambulatory DMD patients aged 4–7. If NSAA improvement is not significant at 52 weeks, FDA could withdraw approval." },
          { id: 's5', text: "The EMBARK trial reported top-line results in late 2023. Search for 'EMBARK Elevidys results 2023 Sarepta.' Did the trial meet its primary endpoint? What happened to the FDA approval status?", hint: "EMBARK did not meet its primary NSAA endpoint at 52 weeks (p=0.17). Despite this, FDA expanded Elevidys approval in June 2024 to all ambulatory DMD patients aged 4 and older  -  another controversial decision. The secondary endpoint (100-metre walk test) was met. This created significant debate about FDA's standards." },
          { id: 's6', text: "Write your audit document. Structure: What was approved and on what evidence → Advisory committee recommendation and why FDA overrode it → What EMBARK needed to show → What it actually showed → Your assessment: did FDA make the right call? Should Elevidys remain on the market?", hint: "There is no right answer  -  this is a genuine scientific and ethical debate. A good assessment acknowledges both sides: the urgency argument (these children have no other options and the disease is rapidly progressing) vs. the evidence standard argument (approving drugs without functional evidence sets a dangerous precedent and may mislead families). Take a position and defend it." },
        ],
        rubric: ["Correctly identified the surrogate endpoint and the clinical concern about it", "Advisory committee vote and FDA override reasoning accurately described", "EMBARK trial design and results accurately reported", "Final assessment takes a clear position with evidence-based reasoning  -  not neutral"],
        whats_next: ["Try Project 1: Design a Gene Therapy Vector", "Continue the Cell & Gene Therapy curriculum", "Attempt the CGT Capstone"],
      },
    ],
  },
  {
    subject_id: 'protein_engineering', subject_name: 'Protein Engineering & Design', color: '#BE185D',
    projects: [
      {
        id: 'pe_p1', title: 'Engineer Stability Mutations for a Therapeutic Antibody', time: '3–4 hours', difficulty: 'Intermediate',
        tools: [{ name: 'RCSB PDB', url: 'https://www.rcsb.org/' }, { name: 'iCn3D Structure Viewer', url: 'https://www.ncbi.nlm.nih.gov/Structure/icn3d/' }, { name: 'DynaMut2', url: 'https://biosig.lab.uq.edu.au/dynamut2/' }, { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }],
        scenario: "You're a protein engineer at a biologics company. Your antibody lead, based on trastuzumab (Herceptin), has a thermal stability problem  -  it aggregates at 37°C during manufacture. The CMC team is demanding a more stable variant before they can scale up. Your job is to identify the aggregation-prone regions and propose point mutations to improve thermal stability.",
        problem: "Using trastuzumab's crystal structure and free computational tools, identify aggregation-prone regions and propose 3 point mutations to improve thermal stability. Justify each mutation structurally.",
        why_it_matters: "Protein stability engineering is one of the most practically important skills in therapeutic protein development. Unstable antibodies aggregate, lose potency, cause adverse immune reactions, and fail in manufacturing. Every biologic program faces this challenge.",
        expected_output: "A mutation proposal document: 3 mutations with structural justification, predicted stability impact, and the experimental validation assay you would run to confirm.",
        steps: [
          { id: 's1', text: "Open RCSB PDB. Search for trastuzumab  -  load structure 1N8Z (trastuzumab Fab in complex with HER2). Open it in iCn3D. Get familiar with the structure: identify the heavy chain (H), light chain (L), CDR loops (the antigen-binding loops), and the framework regions.", hint: "In iCn3D, use Analysis → Sequences to see the chain layout. The CDR loops are the most variable regions  -  they form the antigen-binding site. The framework regions form the stable scaffold. Aggregation often occurs at exposed hydrophobic patches on the CDR loops." },
          { id: 's2', text: "Identify hydrophobic patches on the antibody surface that might drive aggregation. In iCn3D, colour the structure by hydrophobicity (Style → Color → Hydrophobicity). Large exposed hydrophobic patches on loop regions are aggregation-prone.", hint: "Hydrophobic residues prefer to be buried in the protein core. When they are exposed on the surface (often in CDR loops), they can drive aggregation by sticking to other antibody molecules. Look for Trp, Phe, Leu, Ile, Val residues in loop regions that are solvent-exposed." },
          { id: 's3', text: "Search PubMed for 'trastuzumab stability engineering mutations' or 'antibody aggregation CDR mutations.' Find at least one paper reporting mutations that improved antibody stability. Note the specific residues changed and the experimental validation.", hint: "Several groups have published trastuzumab stability engineering studies. Common strategies include: replacing exposed Trp or Phe in CDRs with less hydrophobic residues, introducing disulfide bonds in the VH-VL interface, or grafting CDRs onto more stable framework scaffolds." },
          { id: 's4', text: "Propose Mutation 1: target an exposed hydrophobic residue you identified in Step 2. Go to DynaMut2 (link above), upload the 1N8Z PDB file, enter your mutation, and predict the ΔΔG (stability change). A negative ΔΔG means stabilising.", hint: "DynaMut2 is a free web server that predicts the thermodynamic effect of point mutations on protein stability. Input: PDB file, chain ID, residue number, wildtype residue, mutant residue. Output: predicted ΔΔG in kcal/mol. Negative = stabilising. Try conservative mutations first: replace Trp with Ala or Ser in a non-essential loop position." },
          { id: 's5', text: "Propose Mutations 2 and 3 using the same DynaMut2 workflow. For each: note the position, the WT→mutant change, the predicted ΔΔG, and one sentence of structural justification (why does this mutation improve stability?)", hint: "Good mutations to explore: (1) Removing a buried cavity by filling it with a larger hydrophobic residue. (2) Adding a salt bridge by introducing a charged residue near an oppositely-charged partner. (3) Reducing entropy of a flexible loop by replacing Gly with Ala. Each strategy has a different mechanistic basis." },
          { id: 's6', text: "Specify the experimental validation assay for each mutation. How would you confirm the mutation actually improves stability without harming antigen binding?", hint: "Thermal shift assay (DSF/nanoDSF): measure Tm of WT vs. mutant  -  a higher Tm means more stable. Size-exclusion chromatography (SEC): measure aggregation at 37°C over 4 weeks. SPR (surface plasmon resonance): confirm binding affinity to HER2 is unchanged (mutations must not reduce potency). All three assays are standard in biologics CMC development." },
        ],
        rubric: ["Aggregation-prone regions identified with structural reasoning (not just listed)", "DynaMut2 used correctly and ΔΔG values interpreted accurately", "Each mutation has a clear mechanistic justification beyond 'it is predicted to be stabilising'", "Experimental validation plan is specific and would actually distinguish stabilised from unstable variants"],
        whats_next: ["Try Project 2: Trace a Computational Protein Design", "Continue the Protein Engineering curriculum", "Attempt the Protein Engineering Capstone"],
      },
      {
        id: 'pe_p2', title: 'Trace a De Novo Protein Design from Computation to Experiment', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }, { name: 'RCSB PDB', url: 'https://www.rcsb.org/' }, { name: 'Baker Lab Design Server', url: 'https://design.ipd.uw.edu/' }],
        scenario: "The Baker Lab at the University of Washington published a landmark 2023 paper designing proteins from scratch using RFdiffusion  -  proteins with no natural counterpart, built to perform specific functions. You are a science writer at a biotech investor newsletter. Your readers are smart but not protein engineers. Your job is to explain this paper's significance and trace how one designed protein went from a computational model to experimental validation.",
        problem: "Read and interpret the key RFdiffusion paper (Watson et al., 2023, Nature), trace how one specific designed protein was validated experimentally, and produce a 600-word explainer that non-experts can understand.",
        why_it_matters: "The ability to translate cutting-edge science into clear, accessible language is one of the most underrated skills in biotech. BD professionals, investors, and medical affairs teams all need people who can do this accurately and compellingly.",
        expected_output: "A 600-word explainer document covering: what RFdiffusion does, how one designed protein was validated, what this means for drug discovery, and one honest limitation.",
        steps: [
          { id: 's1', text: "Search PubMed for 'RFdiffusion de novo protein design Watson 2023 Nature.' Find and read the abstract and introduction. Note: what problem does RFdiffusion solve? What is the key innovation compared to previous methods?", hint: "RFdiffusion uses a diffusion model (the same class of AI behind image generators like DALL-E) to generate protein backbone structures from scratch. The key innovation is that it can design proteins for specific tasks: binding a target, building a symmetric assembly, or scaffolding a functional motif. Previous methods (Rosetta) required extensive human-guided search." },
          { id: 's2', text: "Find the section of the paper where they design protein binders for a specific target. Which target did they choose as a case study? What was the experimental validation method? What affinity did the top binder achieve?", hint: "One major case study is designing binders for influenza hemagglutinin (HA). The computational designs were synthesised, expressed, and tested by SPR (surface plasmon resonance) for binding affinity. Top binders achieved low nanomolar or sub-nanomolar affinity  -  comparable to antibodies but in a smaller, more stable scaffold." },
          { id: 's3', text: "Find a designed protein from the paper that has a structure deposited in the PDB. Search the RCSB PDB for 'RFdiffusion 2023.' Open the structure. Compare the experimental (crystal structure) to the computational prediction. Note the RMSD if reported.", hint: "Several designed proteins from the paper had crystal structures solved to validate the design. An RMSD < 1.5Å between the design model and crystal structure means the computational prediction was essentially correct. This experimental validation is what makes the results trustworthy  -  not just the computational model." },
          { id: 's4', text: "Find one failure case or limitation in the paper. What types of proteins or design challenges did RFdiffusion struggle with? Be specific.", hint: "RFdiffusion performs better on structured, globular proteins than on intrinsically disordered proteins or membrane proteins. The paper reports success rates  -  what percentage of designed sequences expressed correctly and showed the designed function. Not all designs work. The success rate varies by task complexity." },
          { id: 's5', text: "Draft your 600-word explainer. Structure: Hook (why should a biotech investor care?) → What RFdiffusion does in plain language → The experiment (what they built and how they confirmed it worked) → What this means for drug discovery → One honest limitation. Avoid jargon  -  every technical term must be explained.", hint: "Good hook: 'For 50 years, protein engineers have worked like archaeologists  -  sifting through evolution's library of natural proteins to find useful sequences. RFdiffusion does something fundamentally different: it builds proteins that have never existed.' Then explain the technology without using words like 'diffusion model' without explaining what that means." },
          { id: 's6', text: "Review your explainer. Read it as if you are a life sciences investor who last took biology in university. Does every paragraph make sense without prior knowledge? Is the limitation clearly framed as a limitation, not buried? Is it exactly 600 words (±50)?", hint: "Common mistakes: starting paragraphs with 'Furthermore' or 'In conclusion'; using unexplained acronyms (RMSD, SPR, PDB); making claims the paper does not support ('this will cure cancer'). The best science writing is precise, clear, and honest about uncertainty." },
        ],
        rubric: ["RFdiffusion's innovation clearly explained without jargon or unexplained acronyms", "Experimental validation accurately described  -  specific protein, specific assay, specific result", "Drug discovery implications are plausible and grounded in the paper's evidence", "Limitation is specific and honest, not softened into a non-criticism"],
        whats_next: ["Try Project 1: Engineer Stability Mutations", "Continue the Protein Engineering curriculum", "Attempt the Protein Engineering Capstone"],
      },
    ],
  },
  {
    subject_id: 'rna_therapeutics', subject_name: 'RNA Therapeutics', color: '#B91C1C',
    projects: [
      {
        id: 'rna_p1', title: 'Design an mRNA Vaccine Sequence', time: '3–4 hours', difficulty: 'Intermediate',
        tools: [{ name: 'Benchling (free)', url: 'https://benchling.com/signup' }, { name: 'NCBI Nucleotide', url: 'https://www.ncbi.nlm.nih.gov/nucleotide/' }, { name: 'EMBOSS Backtranseq', url: 'https://www.ebi.ac.uk/Tools/st/emboss_backtranseq/' }, { name: 'mFold RNA folding', url: 'http://www.unafold.org/mfold/applications/rna-folding-form.php' }],
        scenario: "It's 2019. Moderna's scientists have just been handed a new target: they need to design an mRNA sequence that encodes a stabilised coronavirus spike protein for a potential vaccine. You are going to recreate the key design decisions they faced  -  before COVID-19 changed everything.",
        problem: "Design a codon-optimised mRNA sequence for a stabilised viral spike protein: choose the antigen, apply proline stabilisation mutations, codon-optimise the sequence, add 5' cap and UTR elements, and assess secondary structure.",
        why_it_matters: "mRNA sequence design is now a foundational skill in RNA therapeutics. Every mRNA vaccine and therapeutic in development goes through exactly these steps. Understanding the logic behind each design choice is what separates a sequence engineer from someone who just runs software.",
        expected_output: "A complete mRNA design document: antigen choice rationale, 2P stabilisation mutations, codon-optimised sequence (first 30 codons), UTR elements selected, and mFold secondary structure screenshot with interpretation.",
        steps: [
          { id: 's1', text: "Go to NCBI Nucleotide. Search for 'SARS-CoV-2 spike protein mRNA' and find the original Wuhan-1 strain spike protein sequence (accession MN908947 or QHD43416 for the protein). Download the spike protein amino acid sequence in FASTA format.", hint: "The spike protein is 1273 amino acids. You will not be designing the full mRNA  -  you will work with the first 100 amino acids and the key furin cleavage site region. Understanding the full sequence helps you appreciate the design problem: 1273 amino acids × 3 nucleotides/codon = ~3,800 nucleotide mRNA before UTRs." },
          { id: 's2', text: "Research the '2P' proline stabilisation mutations. Search PubMed for 'prefusion spike stabilisation 2P mutations Wrapp 2020 Science.' What do K986P and V987P do to the spike protein, and why does this matter for an mRNA vaccine?", hint: "The native spike protein is metastable  -  it folds from a prefusion conformation (the one antibodies neutralise best) to a post-fusion conformation after it fuses with the host cell. 2P mutations (two prolines at positions 986-987) lock the protein in the prefusion conformation, which is far more immunogenic. Moderna and BioNTech both used this strategy in their COVID vaccines." },
          { id: 's3', text: "Codon-optimise the first 30 amino acids of the spike protein for human expression. Use EMBOSS Backtranseq with the human codon usage table. Compare your codon-optimised sequence to the native coronavirus sequence  -  what percentage of codons changed?", hint: "Codon optimisation replaces rare human codons with common ones, increasing translation efficiency. Coronaviruses have evolved codon usage optimised for their own host biology  -  these are often different from optimal human codons. Expect 30–50% of codons to change. The goal is maximum protein expression from the mRNA." },
          { id: 's4', text: "Design your 5' UTR. Research what the Moderna mRNA-1273 5' UTR looks like (it has been published). Key elements: a 5' cap (m7G), the Kozak sequence for ribosome recognition, and a stem-loop structure. Write the 5' UTR sequence you would use and justify each element.", hint: "The Moderna 5' UTR is based on human alpha-globin mRNA UTR  -  naturally highly translated. Key elements: 5' cap (m7GpppN)  -  required for ribosome recognition and mRNA stability; Kozak sequence (GCCACCAUGG) immediately before the start codon  -  optimal for ribosome loading; avoid secondary structure near the start codon." },
          { id: 's5', text: "Run your designed sequence (5' UTR + first 90 nucleotides of spike coding sequence) through mFold RNA folding server. Screenshot the predicted secondary structure. Identify any stem-loops forming near the start codon  -  these reduce translation efficiency and should be avoided.", hint: "Ideal mRNA structure near the 5' end: minimal secondary structure in the 5' UTR (allows ribosome scanning), the start codon (AUG) in an accessible, unstructured region. If mFold shows a strong stem-loop overlapping your AUG, you need to change flanking codons to disrupt it while maintaining the amino acid sequence." },
          { id: 's6', text: "Write your design document. Structure: Antigen choice and 2P rationale → Codon optimisation strategy and % change → 5' UTR design and element justification → mFold structure assessment → One design challenge you would need to solve next (e.g., poly-A tail length, pseudouridine modification, LNP formulation).", hint: "The next challenge to mention: pseudouridine modification. Native mRNA contains uridine, which triggers innate immune sensing (TLR7/8). Moderna and BioNTech replaced all uridines with N1-methylpseudouridine (m1Ψ)  -  this eliminates immune stimulation and dramatically increases protein expression. This is the most important chemical modification in mRNA therapeutics." },
        ],
        rubric: ["2P stabilisation mutations correctly described with mechanistic understanding of why they work", "Codon optimisation performed and % codon change noted", "5' UTR elements are all present and individually justified", "mFold structure interpreted correctly  -  secondary structure near AUG identified and addressed"],
        whats_next: ["Try Project 2: Reconstruct the COVID Vaccine Design", "Continue the RNA Therapeutics curriculum", "Attempt the RNA Therapeutics Capstone"],
      },
      {
        id: 'rna_p2', title: 'Reconstruct the COVID Vaccine Design Decisions', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }, { name: 'FDA mRNA-1273 EUA Review', url: 'https://www.fda.gov/media/144434/download' }, { name: 'BioNTech BNT162b2 paper', url: 'https://pubmed.ncbi.nlm.nih.gov/33301246/' }],
        scenario: "January 10, 2020. The SARS-CoV-2 genome sequence is posted online. Within hours, Moderna's team begins designing mRNA-1273. 66 days later, the first human is injected in a Phase I trial. You are going to reconstruct every major design decision they made in those 66 days  -  and understand the molecular biology behind each one.",
        problem: "Trace the key sequence design decisions behind mRNA-1273 from antigen selection to first-in-human injection: antigen choice, proline stabilisation, chemical modifications, LNP formulation, and manufacturing strategy.",
        why_it_matters: "mRNA-1273 is the most consequential mRNA product ever made. Every decision in its design is now a case study for the entire field. Understanding what they chose and why gives you a framework for designing any mRNA therapeutic.",
        expected_output: "A structured decision log: 6 key design decisions, the reasoning behind each, and a 1-paragraph reflection on what you would have done differently with hindsight.",
        steps: [
          { id: 's1', text: "Search PubMed for 'Corbett mRNA-1273 design 2020 NEJM'  -  this is the Moderna Phase I paper. Read the methods section on vaccine design. Note: what antigen did they choose and what stabilisation strategy did they use?", hint: "Corbett et al., NEJM 2020 (DOI 10.1056/NEJMoa2024671). Key design: full-length spike protein with K986P/V987P 2P proline mutations, transmembrane anchor (to present on cell surface), and furin cleavage site preserved. Alternative they considered: just the receptor-binding domain (RBD). They chose full-length for broader antibody response." },
          { id: 's2', text: "Find the section on chemical modifications. What nucleoside modification was used in mRNA-1273? Why was this modification critical for safety and efficacy?", hint: "mRNA-1273 uses N1-methylpseudouridine (m1Ψ) to replace all uridines. This modification: (1) prevents innate immune sensing via TLR7/8 and RIG-I (unmodified mRNA is immunostimulatory), (2) dramatically increases translational efficiency (the modified mRNA makes more spike protein per cell), and (3) reduces cytotoxicity. Karikó and Weissman won the 2023 Nobel Prize for this discovery." },
          { id: 's3', text: "Research the LNP formulation. What are the four components of the Moderna LNP? What does each component do? Search 'Moderna SM-102 LNP formulation mRNA' for the ionisable lipid component.", hint: "Moderna's LNP contains: (1) SM-102  -  an ionisable lipid (positively charged at low pH for mRNA loading, neutral at physiological pH to reduce toxicity); (2) DSPC  -  a phospholipid for structural stability; (3) cholesterol  -  membrane fluidity; (4) PEG-DMG  -  polyethylene glycol lipid for stealth (prevents immune clearance). The SM-102 ionisable lipid is the proprietary component and the subject of IP disputes with BioNTech." },
          { id: 's4', text: "Read the FDA EUA review for mRNA-1273 (link above  -  page 1–30 of the briefing document). What was the primary endpoint in COVE Phase III? What was the efficacy result?", hint: "Primary endpoint: prevention of symptomatic COVID-19 at least 14 days after the second dose in participants without prior SARS-CoV-2 infection. Result: 94.1% efficacy (94.5% in the primary analysis). The placebo arm had 185 cases; the vaccine arm had 11 cases. Note: this was efficacy against symptomatic disease  -  not infection per se." },
          { id: 's5', text: "Compare Moderna's mRNA-1273 to BioNTech's BNT162b2 (Pfizer/BioNTech). Find the BNT162b2 paper (Polack et al., NEJM 2020). What are the three key differences between the two vaccines?", hint: "Key differences: (1) Antigen: BNT162b2 uses full-length spike with 2P mutations (same as Moderna); BNT162b2b1 (an earlier candidate) used just the RBD. (2) LNP formulation: different ionisable lipid (ALC-0315 vs SM-102). (3) Dose: Moderna 100μg vs BioNTech 30μg. (4) Storage: Moderna was -20°C stable; BioNTech originally required -70°C (later improved). These differences drove different deployment strategies." },
          { id: 's6', text: "Write your 1-paragraph reflection. With hindsight (and the knowledge of Omicron immune escape, waning immunity, and the bivalent booster strategy): what one design decision would you revisit, and what would you change?", hint: "Strong reflection options: (1) Would you target RBD alone for better immune focusing? (2) Would you use a self-amplifying mRNA design to allow lower doses? (3) Would you use a pan-coronavirus conserved antigen to prepare for variants? There is no 'correct' answer  -  the reflection should show understanding of the trade-offs, not just describe the current approach." },
        ],
        rubric: ["All six design decisions correctly identified and their molecular basis explained", "m1Ψ modification correctly described with both the immune evasion and translation enhancement mechanisms", "LNP four-component formulation correctly explained", "Reflection is specific, takes a position, and shows understanding of the real trade-offs"],
        whats_next: ["Try Project 1: Design an mRNA Vaccine Sequence", "Continue the RNA Therapeutics curriculum", "Attempt the RNA Therapeutics Capstone"],
      },
    ],
  },
  {
    subject_id: 'longevity_science', subject_name: 'Longevity Science', color: '#4338CA',
    projects: [
      {
        id: 'lon_p1', title: 'Interpret an Epigenetic Aging Clock', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }, { name: 'Aging.ai', url: 'https://aging.ai/' }, { name: 'DNA methylation clock explainer', url: 'https://www.nature.com/articles/s41574-020-0432-6' }],
        scenario: "You've just joined the research team at a longevity biotech. Your company is running a clinical trial testing an intervention (caloric restriction + rapamycin) to slow biological aging. The primary outcome is change in biological age as measured by epigenetic clocks. Your supervisor wants you to understand exactly what these clocks measure, what they do not measure, and how to interpret a participant's result.",
        problem: "Understand how epigenetic aging clocks work, interpret a hypothetical participant's clock result, identify the 3 most modifiable biological age drivers, and write a data interpretation memo.",
        why_it_matters: "Epigenetic aging clocks are becoming the primary outcome measure in longevity clinical trials. Anyone working in longevity medicine, geroscience, or precision health needs to understand what these biomarkers mean and what they cannot tell you.",
        expected_output: "A 1-page data interpretation memo: clock mechanism, participant interpretation, 3 modifiable drivers, and the clock's key limitation in clinical trial use.",
        steps: [
          { id: 's1', text: "Search PubMed for 'Horvath epigenetic clock 2013 Genome Biology.' Read the abstract and introduction. What does the clock measure? How was it built? What is the correlation between DNA methylation age and chronological age?", hint: "Horvath's clock measures DNA methylation at 353 CpG sites. It was trained on ~8,000 samples across 51 tissue types. The correlation between methylation age and chronological age is r=0.96  -  remarkably accurate across tissues and ages. Key point: the clock measures biological age, not chronological age  -  they diverge, and that divergence is what we care about clinically." },
          { id: 's2', text: "Find the DunedinPACE clock paper (Belsky et al., 2022, eLife). How is DunedinPACE different from Horvath's original clock? What does it measure that chronological clocks do not?", hint: "DunedinPACE measures the pace of aging  -  how fast someone is aging right now  -  rather than their current biological age. It was trained on longitudinal data from the Dunedin cohort. A DunedinPACE of 1.0 means you are aging at the average rate. 0.8 means 20% slower. 1.2 means 20% faster. This is more useful for intervention trials than a static biological age estimate." },
          { id: 's3', text: "Interpret a hypothetical participant result: Chronological age 45, Horvath GrimAge 51, DunedinPACE 1.15, GrimAge components elevated: smoking pack-years surrogate, plasminogen activator inhibitor-1 (PAI-1). What does this profile tell you clinically?", hint: "GrimAge 51 at chronological age 45 = 6 years of accelerated aging. DunedinPACE 1.15 = aging 15% faster than average. Elevated PAI-1 is associated with cardiovascular and metabolic disease risk. The smoking surrogate being elevated suggests either current/former smoking or significant oxidative stress. This participant is at substantially elevated mortality risk." },
          { id: 's4', text: "Identify 3 modifiable factors that have the strongest evidence for reducing epigenetic age. Search PubMed for 'epigenetic clock reversal intervention' or 'biological age reduction lifestyle.' Note the intervention, the study, and the magnitude of effect.", hint: "Best-evidence interventions: (1) Exercise  -  multiple studies show 1–3 year biological age reduction with sustained aerobic + resistance training. (2) Diet quality  -  Mediterranean diet and caloric restriction both associated with slower DunedinPACE. (3) Sleep  -  poor sleep quality accelerates epigenetic aging by 1–2 years. Rapamycin and metformin have early trial data but less human evidence than lifestyle factors." },
          { id: 's5', text: "Identify the single biggest limitation of using epigenetic clocks as a primary endpoint in a 12-month clinical trial.", hint: "The biggest limitation: clocks were calibrated on chronological age, not on actual health outcomes. We do not yet know that reducing your epigenetic age by 2 years on a clock translates to 2 fewer years of disease or mortality. The clock is a proxy  -  a very good one, but the clinical validation is still ongoing. The TRIIM-X trial (growth hormone + metformin + DHEA) showed clock reversal but was a small, uncontrolled study." },
          { id: 's6', text: "Write your 1-page memo. Structure: What the clock measures (2 sentences) → Participant interpretation → 3 modifiable drivers with evidence level → Key limitation and how you would address it in trial design.", hint: "Address the limitation practically: in your trial, you would use multiple clocks (Horvath, GrimAge, DunedinPACE) and require concordant improvement across at least 2 to call a response. You would also track clinical biomarkers (inflammatory markers, cardiovascular risk scores) as co-primaries to build the link between clock improvement and health outcomes." },
        ],
        rubric: ["Epigenetic clock mechanism correctly explained  -  CpG methylation basis understood", "Participant interpretation is specific and clinically relevant, not generic", "3 modifiable interventions are evidence-graded  -  distinguishes between strong and preliminary evidence", "Limitation is the key causal validation gap, not a secondary methodological point"],
        whats_next: ["Try Project 2: Analyse the TAME Trial", "Continue the Longevity Science curriculum", "Attempt the Longevity Science Capstone"],
      },
      {
        id: 'lon_p2', title: 'Analyse the TAME Trial and the Future of Geroscience', time: '2–3 hours', difficulty: 'Beginner',
        tools: [{ name: 'TAME Trial website', url: 'https://www.afar.org/tame-trial' }, { name: 'ClinicalTrials.gov', url: 'https://clinicaltrials.gov/' }, { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' }],
        scenario: "The TAME trial (Targeting Aging with Metformin) is the first clinical trial in history designed to target the biology of aging itself  -  not a specific disease, but aging as a process. FDA approved it as a trial, which required a landmark regulatory decision: recognising 'aging' as a modifiable condition. You are a science policy analyst advising a government health agency on whether to fund a second TAME-like trial.",
        problem: "Analyse the TAME trial design, its regulatory significance, the metformin evidence base, and produce a policy memo recommending whether to fund a follow-on geroscience trial.",
        why_it_matters: "The TAME trial is redefining what clinical trials can target. Understanding its design, regulatory novelty, and the metformin evidence base is essential for anyone working in longevity medicine, health policy, or geroscience.",
        expected_output: "A 1-page policy memo: TAME trial design summary, regulatory significance, evidence for metformin as a geroscience intervention, and a funding recommendation with conditions.",
        steps: [
          { id: 's1', text: "Read the TAME trial overview at afar.org/tame-trial. Then find the TAME protocol on ClinicalTrials.gov (NCT03077360). Note: primary endpoint, patient population, intervention, duration, and sample size.", hint: "TAME enrolls 3,000 participants aged 65–79 without diabetes (metformin is already standard of care for diabetes  -  this trial tests it in aging per se). Primary endpoint: a composite of first occurrence of any of 6 conditions (MI, stroke, heart failure, cancer, dementia, death). Duration: 6 years. This composite endpoint was chosen specifically because FDA would not accept 'aging' as a primary endpoint." },
          { id: 's2', text: "Understand the regulatory innovation. Search 'FDA aging indication TAME Barzilai' and find Nir Barzilai's description of the FDA negotiations. What did FDA agree to that was unprecedented?", hint: "FDA agreed that the composite endpoint (multiple age-related conditions) could serve as a regulatory endpoint for a drug targeting aging. This implicitly recognised that aging is a targetable biological process. The regulatory significance: if TAME succeeds, metformin could receive an indication for 'slowing aging'  -  something no drug has ever had." },
          { id: 's3', text: "Review the evidence base for metformin as a longevity intervention. Find the UK CPRD observational study (Bannister et al., 2014, Diabetes, Obesity and Metabolism) showing diabetic patients on metformin outlived matched non-diabetic controls. What is the main limitation of this evidence?", hint: "The Bannister study found metformin-treated diabetics had lower mortality than matched non-diabetic controls  -  suggesting metformin's effects go beyond glucose control. The key limitation: this is observational data. Confounders include healthy user bias (people stable enough to take metformin long-term may be healthier to begin with). TAME is a randomised controlled trial specifically designed to address this confounding." },
          { id: 's4', text: "Identify the proposed mechanism of metformin's longevity effect. Search PubMed for 'metformin AMPK mTOR aging mechanism.' What cellular pathways does it activate/inhibit?", hint: "Metformin activates AMPK (AMP-activated protein kinase) by inhibiting Complex I of the mitochondrial electron transport chain. AMPK activation: inhibits mTORC1 (reducing protein synthesis and cell growth signals associated with aging), activates autophagy (cellular cleanup), and improves mitochondrial function. These are core longevity pathways also targeted by caloric restriction." },
          { id: 's5', text: "Identify 2 design limitations of the TAME trial. What would you change in a follow-on trial?", hint: "Limitations: (1) Only one drug  -  cannot assess combination approaches (metformin + rapamycin + NAD+ precursors). (2) Six-year duration  -  for practical policy decisions, we need shorter biomarker-based endpoints. (3) No biological aging clock as co-primary  -  if DunedinPACE or GrimAge were included, you could see biological effect before 6 years of clinical follow-up. In a follow-on trial, add validated aging clocks as co-primaries." },
          { id: 's6', text: "Write your 1-page policy memo. Structure: TAME summary → Regulatory significance → Metformin evidence strength and limitations → Your recommendation (fund a follow-on trial? Yes/No/Conditional) → 2 conditions or modifications you would require.", hint: "A 'Conditional Yes' is the most defensible recommendation. Condition 1: the follow-on trial must include epigenetic aging clocks as co-primary endpoints to shorten the feedback loop. Condition 2: the trial should include a combination arm (metformin + rapamycin) since animal data shows synergy. State the risk: if TAME itself fails, public and regulatory appetite for geroscience trials may shrink significantly." },
        ],
        rubric: ["TAME trial design accurately described with correct primary endpoint and population", "Regulatory significance correctly explained  -  what FDA agreed to and why it matters", "Metformin mechanism is specific (AMPK → mTOR pathway) and the observational evidence limitation is correctly identified", "Policy recommendation is specific, takes a clear position, and conditions are realistic"],
        whats_next: ["Try Project 1: Interpret an Epigenetic Aging Clock", "Continue the Longevity Science curriculum", "Attempt the Longevity Science Capstone"],
      },
    ],
  },
];

// ── Shared constants ───────────────────────────────────────────────────────

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', "Master's", 'PhD', 'Working Professional', 'Other'];
const US_YEAR_OPTIONS = ['0–1 years', '1–3 years', '3–5 years', '5–10 years', '10+ years'];
const USE_CASES = [
  {
    id: 'career_direction',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
      </svg>
    ),
    title: 'Career Direction',
    desc: 'Find exactly where your biology degree leads in biotech',
    tag: 'Picks a career path for you',
    needsCareer: true,
  },
  {
    id: 'industry_readiness',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    title: 'Industry Readiness',
    desc: 'Learn how clinical trials, genomics and drug discovery actually work in industry',
    tag: 'Career-mapped curriculum',
    needsCareer: true,
  },
  {
    id: 'stay_ahead',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Stay Ahead',
    desc: 'Longevity, AI in drug discovery, RNA therapeutics. Stay current on what\'s reshaping biotech',
    tag: 'Explore freely, no fixed path',
    needsCareer: false,
  },
  {
    id: 'forward_deployed',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    title: 'Forward Deployed Engineer',
    desc: 'Bridge science and technology inside pharma and biotech. The most in-demand hybrid role',
    tag: 'Emerging & Hybrid careers',
    needsCareer: true,
    cluster: 'Emerging & Hybrid',
  },
];
const AVATAR_COLORS = ['#16c1ad','#109285','#1f1f1f','#636363','#0066CC','#6B3FA0','#B5451B','#059669','#DB2777','#E05C00'];

// ── Profile View ───────────────────────────────────────────────────────────

function StudentAvatar({ name, color, size = 40, avatarNum = null }) {
  if (avatarNum) {
    return (
      <img
        src={`/avatars/Number=${avatarNum}.png`}
        alt={name}
        className="student-avatar-img"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  const bg = color || '#16c1ad';
  return (
    <div className="student-avatar-circle" style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function AvatarPicker({ current, onSelect, onClose }) {
  const TOTAL = 116;
  return (
    <div className="avatar-picker-backdrop" onClick={onClose}>
      <div className="avatar-picker-panel" onClick={e => e.stopPropagation()}>
        <div className="avatar-picker-header">
          <span className="avatar-picker-title">Choose your avatar</span>
          <button className="avatar-picker-close" onClick={onClose}>✕</button>
        </div>
        <div className="avatar-picker-grid">
          {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`avatar-picker-item ${current === n ? 'selected' : ''}`}
              onClick={() => { onSelect(n); onClose(); }}
            >
              <img src={`/avatars/Number=${n}.png`} alt={`Avatar ${n}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming','Washington DC',
];

const US_CITIES = [
  { city: 'Boston',             state: 'Massachusetts' },
  { city: 'Cambridge',          state: 'Massachusetts' },
  { city: 'Worcester',          state: 'Massachusetts' },
  { city: 'San Francisco',      state: 'California' },
  { city: 'San Diego',          state: 'California' },
  { city: 'Los Angeles',        state: 'California' },
  { city: 'South San Francisco',state: 'California' },
  { city: 'Thousand Oaks',      state: 'California' },
  { city: 'New York',           state: 'New York' },
  { city: 'New Brunswick',      state: 'New Jersey' },
  { city: 'Princeton',          state: 'New Jersey' },
  { city: 'Parsippany',         state: 'New Jersey' },
  { city: 'Research Triangle',  state: 'North Carolina' },
  { city: 'Durham',             state: 'North Carolina' },
  { city: 'Raleigh',            state: 'North Carolina' },
  { city: 'Chapel Hill',        state: 'North Carolina' },
  { city: 'Washington DC',      state: 'Washington DC' },
  { city: 'Rockville',          state: 'Maryland' },
  { city: 'Gaithersburg',       state: 'Maryland' },
  { city: 'Baltimore',          state: 'Maryland' },
  { city: 'Philadelphia',       state: 'Pennsylvania' },
  { city: 'Chicago',            state: 'Illinois' },
  { city: 'Seattle',            state: 'Washington' },
  { city: 'Bothell',            state: 'Washington' },
  { city: 'Indianapolis',       state: 'Indiana' },
  { city: 'Cleveland',          state: 'Ohio' },
  { city: 'Columbus',           state: 'Ohio' },
  { city: 'Houston',            state: 'Texas' },
  { city: 'Austin',             state: 'Texas' },
  { city: 'Dallas',             state: 'Texas' },
  { city: 'Denver',             state: 'Colorado' },
  { city: 'Salt Lake City',     state: 'Utah' },
  { city: 'Atlanta',            state: 'Georgia' },
  { city: 'Miami',              state: 'Florida' },
  { city: 'Tampa',              state: 'Florida' },
  { city: 'Wilmington',         state: 'Delaware' },
  { city: 'Hartford',           state: 'Connecticut' },
  { city: 'New Haven',          state: 'Connecticut' },
  { city: 'Ann Arbor',          state: 'Michigan' },
  { city: 'Minneapolis',        state: 'Minnesota' },
  { city: 'Portland',           state: 'Oregon' },
  { city: 'Nashville',          state: 'Tennessee' },
  { city: 'Kansas City',        state: 'Missouri' },
  { city: 'St. Louis',          state: 'Missouri' },
];

const US_EXP_OPTIONS = ['< 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'];

function ProfileView({ student, profileData, onBack, onProfileUpdated }) {
  const [college, setCollege]         = useState(profileData?.college || '');
  const [year, setYear]               = useState(profileData?.year_of_study || '');
  const [aspirations, setAspirations] = useState(profileData?.aspirations || '');
  const [motivation, setMotivation]   = useState(profileData?.motivation || '');
  const [tutorNote, setTutorNote]     = useState(profileData?.tutor_note || '');
  const [avatarColor, setAvatarColor] = useState(profileData?.avatar_color || AVATAR_COLORS[0]);
  const [avatarNum, setAvatarNum]     = useState(profileData?.avatar_num || null);
  const [showPicker, setShowPicker]   = useState(false);
  const [linkedin, setLinkedin]       = useState(profileData?.linkedin_url || '');
  const [github, setGithub]           = useState(profileData?.github_url || '');
  const [bio, setBio]                 = useState(profileData?.bio || '');
  const [city, setCity]               = useState(profileData?.city || '');
  const [state, setState]             = useState(profileData?.state || '');
  const [showOnMap, setShowOnMap]     = useState(profileData?.show_on_map !== 0);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  async function handleSave() {
    setSaving(true); setSaved(false);
    try {
      await fetch(`/api/profile/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          college, year_of_study: year, aspirations, motivation,
          tutor_note: tutorNote, avatar_color: avatarColor, avatar_num: avatarNum,
          linkedin_url: linkedin, github_url: github, bio,
          city, state, show_on_map: showOnMap ? 1 : 0,
        }),
      });
      setSaved(true);
      onProfileUpdated({ avatar_color: avatarColor, avatar_num: avatarNum, linkedin_url: linkedin, github_url: github, bio, city, state });
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    finally { setSaving(false); }
  }

  const hasLinkedIn = linkedin.trim().length > 0;
  const hasGitHub   = github.trim().length > 0;

  return (
    <div className="profile-view">
      <div className="profile-hero">
        <button className="profile-hero-back" onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>
        <div className="profile-hero-inner">
          <div className="profile-avatar-wrap" onClick={() => setShowPicker(true)} title="Change avatar">
            <StudentAvatar name={student.name} color={avatarColor} avatarNum={avatarNum} size={72} />
            <span className="profile-avatar-edit">Change</span>
          </div>
          <div>
            <div className="profile-hero-name">{student.name}</div>
            {profileData?.career_title && (
              <div className="profile-hero-role">{profileData.career_title}</div>
            )}
            {(profileData?.college || profileData?.city) && (
              <div className="profile-hero-meta">
                {[profileData.college, profileData.city].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-body">
        {/* Avatar picker */}
        <div className="profile-section">
          <h3 className="profile-section-title">Your Avatar</h3>
          <div className="profile-avatar-row">
            <StudentAvatar name={student.name} color={avatarColor} avatarNum={avatarNum} size={56} />
            <button className="profile-avatar-change-btn" onClick={() => setShowPicker(true)}>
              Choose from 116 avatars →
            </button>
            {avatarNum && (
              <button className="profile-avatar-reset-btn" onClick={() => setAvatarNum(null)}>
                Use initial
              </button>
            )}
          </div>
          {!avatarNum && (
            <div className="profile-color-picker" style={{ marginTop: 10 }}>
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  className={`profile-color-dot ${avatarColor === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setAvatarColor(c)}
                />
              ))}
            </div>
          )}
        </div>
        {showPicker && (
          <AvatarPicker
            current={avatarNum}
            onSelect={setAvatarNum}
            onClose={() => setShowPicker(false)}
          />
        )}

        <div className="profile-divider" />

        {/* Professional links */}
        <div className="profile-section">
          <h3 className="profile-section-title">Professional Presence</h3>

          <div className="profile-field">
            <label>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#0077B5' }}>
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
              </svg>
              LinkedIn Profile
            </label>
            <input
              type="url"
              className="profile-input"
              placeholder="https://linkedin.com/in/yourname"
              value={linkedin}
              onChange={e => setLinkedin(e.target.value)}
            />
            {hasLinkedIn ? (
              <a className="profile-link-badge linkedin" href={linkedin} target="_blank" rel="noreferrer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                View LinkedIn profile →
              </a>
            ) : (
              <div className="profile-nudge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {ACTIVE_REGION === 'us' ? 'LinkedIn is the primary channel pharma and CRO recruiters use to find candidates.' : 'LinkedIn is how biotech recruiters find talent.'}{' '}<a href="https://linkedin.com/signup" target="_blank" rel="noreferrer">Create your profile →</a>
              </div>
            )}
          </div>

          <div className="profile-field">
            <label>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#333' }}>
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub Profile
            </label>
            <input
              type="url"
              className="profile-input"
              placeholder="https://github.com/yourusername"
              value={github}
              onChange={e => setGithub(e.target.value)}
            />
            {hasGitHub ? (
              <a className="profile-link-badge github" href={github} target="_blank" rel="noreferrer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                View GitHub profile →
              </a>
            ) : (
              <div className="profile-nudge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {ACTIVE_REGION === 'us' ? 'Useful for CDM and data roles — shows your scripting and analysis work.' : 'GitHub is essential for bioinformatics & AI roles. Employers check it.'}{' '}<a href="https://github.com/signup" target="_blank" rel="noreferrer">Create a free account →</a>
              </div>
            )}
          </div>

          <div className="profile-field">
            <label>One-line bio</label>
            <input
              type="text"
              className="profile-input"
              placeholder={ACTIVE_REGION === 'us' ? 'e.g. CRA with 3 years in oncology trials, preparing for CCRA' : 'e.g. 2nd-year PhD working on CRISPR diagnostics'}
              maxLength={100}
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
            <div className="profile-nudge" style={{ color: 'rgba(255,255,255,0.35)' }}>Shown on the community map when others hover your dot.</div>
          </div>
        </div>

        <div className="profile-divider" />

        {/* Background */}
        <div className="profile-section">
          <h3 className="profile-section-title">Your Background</h3>
          <div className="profile-row">
            <div className="profile-field">
              <label>{ACTIVE_REGION === 'us' ? 'College / Organization' : 'College / University'}</label>
              <input type="text" className="profile-input" placeholder={ACTIVE_REGION === 'us' ? 'e.g. Duke University, ICON plc, Pfizer…' : 'e.g. IIT Bombay, Stanford…'} value={college} onChange={e => setCollege(e.target.value)} />
            </div>
            <div className="profile-field profile-field-sm">
              <label>{ACTIVE_REGION === 'us' ? 'Experience Level' : 'Year of Study'}</label>
              <select className="profile-select" value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Select…</option>
                {(ACTIVE_REGION === 'us'
                  ? ['0–1 years', '1–3 years', '3–5 years', '5–10 years', '10+ years']
                  : YEAR_OPTIONS
                ).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="profile-divider" />

        {/* Aspirations & motivation */}
        <div className="profile-section">
          <h3 className="profile-section-title">Goals & Motivation</h3>
          <div className="profile-field">
            <label>Career aspirations</label>
            <textarea className="profile-textarea" rows={3} placeholder={ACTIVE_REGION === 'us' ? 'What role are you targeting after your certification?' : 'Where do you want to go in biotech?'} value={aspirations} onChange={e => setAspirations(e.target.value)} />
          </div>
          <div className="profile-field">
            <label>Why Bversity?</label>
            <div className="onboarding-chips">
              {USE_CASES.map(m => (
                <button key={m.id} type="button" className={`onboarding-chip ${motivation === m.id ? 'selected' : ''}`} onClick={() => setMotivation(m.id)}>
                  {m.title}
                </button>
              ))}
            </div>
          </div>
          <div className="profile-field">
            <label>Note for your industry experts <span className="onboarding-optional">(optional)</span></label>
            <textarea className="profile-textarea" rows={3} placeholder="Learning style, prior knowledge, topics you want to focus on…" value={tutorNote} onChange={e => setTutorNote(e.target.value)} />
          </div>
        </div>

        <div className="profile-divider" />

        {/* Location & community map */}
        <div className="profile-section">
          <h3 className="profile-section-title">Location & Community</h3>
          <p className="profile-section-sub">Show up on the Bversity Community Map so learners across the world can find you.</p>
          <div className="profile-row">
            <div className="profile-field">
              <label>City</label>
              <input type="text" className="profile-input" placeholder={ACTIVE_REGION === 'us' ? 'e.g. Boston, San Francisco, Raleigh…' : 'e.g. Bangalore, Mumbai…'} value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="profile-field profile-field-sm">
              <label>State</label>
              <select className="profile-select" value={state} onChange={e => setState(e.target.value)}>
                <option value="">Select…</option>
                {(ACTIVE_REGION === 'us' ? US_STATES : INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <label className="profile-map-toggle">
            <input type="checkbox" checked={showOnMap} onChange={e => setShowOnMap(e.target.checked)} />
            <span className="profile-map-toggle-track" />
            <span className="profile-map-toggle-label">Show me on the community map</span>
          </label>
        </div>

        <div className="profile-save-bar">
          {saved && <span className="profile-saved-msg">Saved!</span>}
          <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Onboarding ─────────────────────────────────────────────────────────────

function OnboardingView({ student, careerProfile, onComplete }) {
  const [step, setStep]                   = useState(1);
  const [college, setCollege]             = useState(careerProfile?.waitlist_university || '');
  const [year, setYear]                   = useState(careerProfile?.waitlist_year_of_study || '');
  const [aspirations, setAspirations]     = useState('');
  const [motivation, setMotivation]       = useState('');
  const [tutorNote, setTutorNote]         = useState('');
  const [careers, setCareers]             = useState([]);
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [selectedCluster, setSelectedCluster]   = useState('');
  const [city, setCity]                   = useState('');
  const [obState, setObState]             = useState('');
  const [showOnMap, setShowOnMap]         = useState(true);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    fetch('/api/careers').then(r => r.json()).then(setCareers).catch(() => {});
  }, []);

  async function handleFinish(skipLocation = false) {
    if (saving) return;
    setSaving(true);
    try {
      await fetch(`/api/profile/${student.id}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          college: college.trim() || '',
          year_of_study: year || '',
          aspirations: aspirations.trim() || '',
          motivation,
          tutor_note: tutorNote.trim(),
          career_id: selectedCareerId,
          city: skipLocation ? '' : city.trim(),
          state: skipLocation ? '' : obState,
          show_on_map: showOnMap ? 1 : 0,
        }),
      });
      const profileRes = await fetch(`/api/profile/${student.id}`);
      const profileData = await profileRes.json();
      onComplete(profileData);
    } catch {
      onComplete(null);
    }
  }

  // ── US onboarding (3-step, working professional flow) ──────────────────────
  if (ACTIVE_REGION === 'us') {
    function USCitySearch({ city, onSelect }) {
      const [query, setQuery] = React.useState(city || '');
      const [open, setOpen] = React.useState(false);
      const filtered = query.length > 0
        ? US_CITIES.filter(c => c.city.toLowerCase().startsWith(query.toLowerCase())).slice(0, 8)
        : [];
      return (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="onboarding-input"
            placeholder="e.g. Boston, San Diego, Research Triangle…"
            value={query}
            autoFocus
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
          />
          {open && filtered.length > 0 && (
            <div className="us-city-dropdown">
              {filtered.map(c => (
                <div key={c.city} className="us-city-option" onMouseDown={() => { onSelect(c.city, c.state); setQuery(c.city); setOpen(false); }}>
                  <span className="us-city-name">{c.city}</span>
                  <span className="us-city-state">{c.state}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    const canUsStep1 = college.trim() && year;
    const canUsStep2 = !!selectedCareerId;
    const ArrowIcon = () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    );
    return (
      <div className="onboarding-screen">
        <div className="onboarding-progress">
          {[1,2,3].map(i => (
            <div key={i} className={`onboarding-pip ${i <= step ? 'active' : ''}`} />
          ))}
        </div>
        <div className={`onboarding-card ${step === 2 ? 'onboarding-card--wide' : ''}`}>
          <div className="onboarding-step-label">Step {step} of 3</div>

          {step === 1 && (
            <>
              <h2 className="onboarding-heading">Welcome to Bversity, {student.name.split(' ')[0]}!</h2>
              <p className="onboarding-sub">Tell us a bit about your background so your AI tutor can teach to exactly where you are right now.</p>
              <div className="onboarding-fields">
                <div className="onboarding-field">
                  <label>Where do you currently work?</label>
                  <input type="text" className="onboarding-input"
                    placeholder="e.g. IQVIA, Pfizer, PPD, a hospital, self-employed…"
                    value={college} onChange={e => setCollege(e.target.value)} autoFocus
                  />
                </div>
                <div className="onboarding-field">
                  <label>Years of experience in life sciences</label>
                  <div className="onboarding-chips">
                    {US_EXP_OPTIONS.map(opt => (
                      <button key={opt} type="button"
                        className={`onboarding-chip ${year === opt ? 'selected' : ''}`}
                        onClick={() => setYear(opt)}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
                <div className="onboarding-field">
                  <label>Anything your tutor should know? <span className="onboarding-optional">(optional)</span></label>
                  <textarea className="onboarding-textarea"
                    placeholder="Certification timeline, prior study, specific gaps to focus on…"
                    value={tutorNote} onChange={e => setTutorNote(e.target.value)} rows={2}
                  />
                </div>
              </div>
              <button className="onboarding-next" disabled={!canUsStep1} onClick={() => setStep(2)}>
                Continue <ArrowIcon />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="onboarding-heading">Which certification are you targeting?</h2>
              <p className="onboarding-sub">Your entire learning roadmap  -  subjects, concepts, and practice  -  will be built around this. You can change it later.</p>
              <div className="ob-career-grid ob-career-grid--full">
                {US_SUBJECTS.map(cert => (
                  <div key={cert.id}
                    className={`ob-career-card ${selectedCareerId === cert.id ? 'selected' : ''}`}
                    style={{ '--career-color': cert.color }}
                    onClick={() => setSelectedCareerId(cert.id)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedCareerId(cert.id)}
                  >
                    <div className="ob-career-card-top">
                      <div className="ob-career-meta">
                        <div className="ob-career-title">{cert.name}</div>
                        <div className="ob-career-salary">{cert.certification} · {cert.certBody}</div>
                      </div>
                      {selectedCareerId === cert.id && <span className="ob-career-check">✓</span>}
                    </div>
                    <p className="ob-career-desc">{cert.org} · {cert.role}</p>
                  </div>
                ))}
              </div>
              <div className="onboarding-nav" style={{ marginTop: '1.5rem' }}>
                <button className="onboarding-back" onClick={() => setStep(1)}>← Back</button>
                <button className="onboarding-next" disabled={!canUsStep2} onClick={() => setStep(3)}>
                  Continue <ArrowIcon />
                </button>
              </div>
              <div className="ob-explore-skip">
                <button className="ob-explore-btn" onClick={() => { setSelectedCareerId(''); setStep(3); }}>
                  Not sure yet  -  explore for now →
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="onboarding-heading">Put yourself on the map</h2>
              <p className="onboarding-sub">Connect with Bversity professionals across the US. Optional  -  skip if you prefer.</p>
              <div className="onboarding-fields">
                <div className="onboarding-field">
                  <label>City</label>
                  <USCitySearch city={city} onSelect={(c, s) => { setCity(c); setObState(s); }} />
                </div>
                {obState && (
                  <div className="onboarding-field">
                    <label>State</label>
                    <input className="onboarding-input" value={obState} readOnly style={{ background: '#f5f5f5', color: '#666' }} />
                  </div>
                )}
                <label className="profile-map-toggle">
                  <input type="checkbox" checked={showOnMap} onChange={e => setShowOnMap(e.target.checked)} />
                  <span className="profile-map-toggle-track" />
                  <span className="profile-map-toggle-label">Show me on the community map</span>
                </label>
              </div>
              <div className="onboarding-nav">
                <button className="onboarding-back" onClick={() => setStep(2)}>← Back</button>
                <button className="onboarding-next onboarding-finish" disabled={saving} onClick={() => handleFinish(false)}>
                  {saving ? 'Setting up…' : "Let's go →"}
                </button>
              </div>
              <button className="onboarding-skip" onClick={() => handleFinish(true)} disabled={saving}>Skip for now</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── India onboarding ────────────────────────────────────────────────────────
  const totalSteps = motivation === 'stay_ahead' ? 3 : 4;
  // For forward_deployed, auto-lock cluster so step 3 skips the cluster picker
  const effectiveCluster = motivation === 'forward_deployed' ? 'Emerging & Hybrid' : selectedCluster;

  function goFromStep2() {
    if (motivation === 'stay_ahead') {
      setStep(4);
    } else if (motivation === 'forward_deployed') {
      setSelectedCluster('Emerging & Hybrid');
      setStep(3);
    } else {
      setStep(3);
    }
  }

  function goBackFromStep3() {
    if (motivation === 'forward_deployed') {
      setSelectedCluster('');
      setSelectedCareerId('');
      setStep(2);
    } else if (selectedCluster) {
      setSelectedCluster('');
      setSelectedCareerId('');
    } else {
      setStep(2);
    }
  }

  function goBackFromStep4() {
    if (motivation === 'stay_ahead') {
      setStep(2);
    } else {
      setStep(3);
    }
  }

  // Display step number: for stay_ahead, step 4 shows as step 3
  function displayStep(s) {
    if (motivation === 'stay_ahead' && s === 4) return 3;
    return s;
  }

  const canStep1 = college.trim() && year;
  const canStep2 = !!motivation;
  const canStep3 = !!selectedCareerId;
  const clusters = ['Science & Technical', 'Business & Commercial', 'Emerging & Hybrid'];
  const ArrowIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );

  return (
    <div className={`onboarding-screen ${step === 3 ? 'onboarding-screen--wide' : ''}`}>
      <div className="onboarding-progress">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className={`onboarding-pip ${i + 1 <= displayStep(step) ? 'active' : ''}`} />
        ))}
      </div>

      <div className={`onboarding-card ${step === 3 ? 'onboarding-card--wide' : ''}`}>
        <div className="onboarding-step-label">Step {displayStep(step)} of {totalSteps}</div>

        {/* ── Step 1: Background ── */}
        {step === 1 && (
          <>
            <h2 className="onboarding-heading">Welcome to Bversity, {student.name.split(' ')[0]}!</h2>
            <p className="onboarding-sub">Let's set up your profile so your AI industry experts can teach to exactly where you are right now.</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <label>{ACTIVE_REGION === 'us' ? 'College / Organization' : 'Which college or university are you at?'}</label>
                <input type="text" className="onboarding-input"
                  placeholder={ACTIVE_REGION === 'us' ? 'e.g. Duke University, ICON plc, Pfizer…' : 'e.g. IIT Bombay, BITS Pilani, Manipal…'}
                  value={college} onChange={e => setCollege(e.target.value)} autoFocus
                />
              </div>
              <div className="onboarding-field">
                <label>{ACTIVE_REGION === 'us' ? 'Experience Level' : 'What year are you in?'}</label>
                <div className="onboarding-chips">
                  {(ACTIVE_REGION === 'us' ? US_YEAR_OPTIONS : YEAR_OPTIONS).map(y => (
                    <button key={y} type="button"
                      className={`onboarding-chip ${year === y ? 'selected' : ''}`}
                      onClick={() => setYear(y)}
                    >{y}</button>
                  ))}
                </div>
              </div>
            </div>
            <button className="onboarding-next" disabled={!canStep1} onClick={() => setStep(2)}>
              Continue <ArrowIcon />
            </button>
          </>
        )}

        {/* ── Step 2: Use case ── */}
        {step === 2 && (
          <>
            <h2 className="onboarding-heading">What brings you to Bversity?</h2>
            <p className="onboarding-sub">Your experts will shape every lesson around your specific goal.</p>
            <div className="ob-usecase-grid">
              {USE_CASES.map(uc => (
                <button key={uc.id} type="button"
                  className={`ob-usecase-card ${motivation === uc.id ? 'selected' : ''}`}
                  onClick={() => setMotivation(uc.id)}
                >
                  <span className="ob-usecase-icon">{uc.icon}</span>
                  <span className="ob-usecase-title">{uc.title}</span>
                  <span className="ob-usecase-desc">{uc.desc}</span>
                  {uc.tag && <span className="ob-usecase-tag">{uc.tag}</span>}
                  {motivation === uc.id && <span className="ob-usecase-check">✓</span>}
                </button>
              ))}
            </div>
            <div className="onboarding-field" style={{ marginTop: '1.2rem' }}>
              <label>Anything your experts should know? <span className="onboarding-optional">(optional)</span></label>
              <textarea className="onboarding-textarea"
                placeholder="Learning style, prior knowledge, topics to focus on…"
                value={tutorNote} onChange={e => setTutorNote(e.target.value)} rows={2}
              />
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back" onClick={() => setStep(1)}>← Back</button>
              <button className="onboarding-next" disabled={!canStep2} onClick={goFromStep2}>
                Continue <ArrowIcon />
              </button>
            </div>
          </>
        )}

        {/* ── Step 3a: Cluster picker ── */}
        {step === 3 && !effectiveCluster && (
          <>
            <h2 className="onboarding-heading">Which world do you see yourself in?</h2>
            <p className="onboarding-sub">This shapes how we personalise your curriculum. You can always change it later.</p>
            <div className="ob-cluster-grid">
              {[
                {
                  id: 'Science & Technical',
                  color: CLUSTER_COLORS['Science & Technical'],
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                    </svg>
                  ),
                  headline: 'Science & Technical',
                  desc: 'Research, data, and the pipeline. Roles where science is your primary tool, from bench to bioinformatics.',
                  examples: 'Bioinformatician · Drug Discovery Scientist · Clinical Research Associate',
                },
                {
                  id: 'Business & Commercial',
                  color: CLUSTER_COLORS['Business & Commercial'],
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
                    </svg>
                  ),
                  headline: 'Business & Commercial',
                  desc: 'Strategy, deals, and market access. Roles where science meets business, from BD to consulting.',
                  examples: 'Life Sciences Consultant · BD Associate · Market Access Analyst',
                },
                {
                  id: 'Emerging & Hybrid',
                  color: CLUSTER_COLORS['Emerging & Hybrid'],
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  ),
                  headline: 'Emerging & Hybrid',
                  desc: 'The frontier. Roles that barely existed 10 years ago: AI, precision medicine, and building your own company.',
                  examples: 'AI Drug Discovery · Precision Medicine Specialist · Biotech Founder',
                },
              ].map(cl => (
                <button key={cl.id} type="button"
                  className="ob-cluster-card"
                  style={{ '--cl-color': cl.color }}
                  onClick={() => setSelectedCluster(cl.id)}
                >
                  <span className="ob-cluster-icon" style={{ color: cl.color }}>{cl.icon}</span>
                  <span className="ob-cluster-headline" style={{ color: cl.color }}>{cl.headline}</span>
                  <span className="ob-cluster-desc">{cl.desc}</span>
                  <span className="ob-cluster-examples">{cl.examples}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-nav" style={{ marginTop: '1.5rem' }}>
              <button className="onboarding-back" onClick={() => setStep(2)}>← Back</button>
            </div>
            <div className="ob-explore-skip">
              <button className="ob-explore-btn" onClick={() => { setSelectedCareerId(''); setStep(4); }}>
                I'm not sure yet. Explore for now →
              </button>
            </div>
          </>
        )}

        {/* ── Step 3b: Career picker within cluster ── */}
        {step === 3 && !!effectiveCluster && (
          <>
            <div className="ob-cluster-back-row">
              <button type="button" className="ob-cluster-back-btn" onClick={goBackFromStep3}>
                {motivation === 'forward_deployed' ? '← Back' : '← Back to clusters'}
              </button>
              <span className="ob-cluster-badge" style={{ background: CLUSTER_COLORS[effectiveCluster] + '18', color: CLUSTER_COLORS[effectiveCluster] }}>
                {effectiveCluster}
              </span>
            </div>
            <h2 className="onboarding-heading">Now pick your target role</h2>
            <p className="onboarding-sub">Your entire learning roadmap is built around this. Every subject, every concept, made relevant to where you're headed.</p>
            <div className="ob-career-grid ob-career-grid--full">
              {careers.filter(c => c.cluster === effectiveCluster).map(career => {
                const color = CLUSTER_COLORS[effectiveCluster];
                return (
                  <div key={career.id}
                    className={`ob-career-card ${selectedCareerId === career.id ? 'selected' : ''}`}
                    style={{ '--career-color': color }}
                    onClick={() => setSelectedCareerId(career.id)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedCareerId(career.id)}
                  >
                    <div className="ob-career-card-top">
                      <span className="ob-career-icon">{CAREER_ICONS[career.id]}</span>
                      <div className="ob-career-meta">
                        <div className="ob-career-title">{career.title}</div>
                        <div className="ob-career-salary">{career.salary_range}</div>
                      </div>
                      {selectedCareerId === career.id && <span className="ob-career-check">✓</span>}
                    </div>
                    <p className="ob-career-desc">{career.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="onboarding-nav" style={{ marginTop: '1.5rem' }}>
              <button className="onboarding-back" onClick={goBackFromStep3}>← Back</button>
              <button className="onboarding-next" disabled={!canStep3} onClick={() => setStep(4)}>
                Continue <ArrowIcon />
              </button>
            </div>
            <div className="ob-explore-skip">
              <button className="ob-explore-btn" onClick={() => { setSelectedCareerId(''); setStep(4); }}>
                I'm not sure yet. Explore for now →
              </button>
            </div>
          </>
        )}

        {/* ── Step 4: Location ── */}
        {step === 4 && (
          <>
            <h2 className="onboarding-heading">Put yourself on the map</h2>
            <p className="onboarding-sub">Show other Bversity learners across the world where you're studying from. Be the first pin in your city.</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <label>City</label>
                <input type="text" className="onboarding-input"
                  placeholder={ACTIVE_REGION === 'us' ? 'e.g. Boston, San Francisco, Raleigh…' : 'e.g. Bangalore, Mumbai, Chennai…'}
                  value={city} onChange={e => setCity(e.target.value)} autoFocus
                />
              </div>
              <div className="onboarding-field">
                <label>State</label>
                <select className="onboarding-input" value={obState} onChange={e => setObState(e.target.value)}>
                  <option value="">Select state…</option>
                  {(ACTIVE_REGION === 'us' ? US_STATES : INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <label className="profile-map-toggle">
                <input type="checkbox" checked={showOnMap} onChange={e => setShowOnMap(e.target.checked)} />
                <span className="profile-map-toggle-track" />
                <span className="profile-map-toggle-label">Show me on the community map</span>
              </label>
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back" onClick={goBackFromStep4}>← Back</button>
              <button className="onboarding-next onboarding-finish" disabled={saving} onClick={() => handleFinish(false)}>
                {saving ? 'Setting up…' : "Let's go →"}
              </button>
            </div>
            <button className="onboarding-skip" onClick={() => handleFinish(true)} disabled={saving}>
              Skip for now
            </button>
          </>
        )}

      </div>
    </div>
  );
}

// ── Welcome Screen ─────────────────────────────────────────────────────────

function HowItWorksOverlay({ onClose, onGetStarted, onRequestAccess }) {
  return (
    <div className="hiw-backdrop" onClick={onClose}>
      <div className="hiw-panel" onClick={e => e.stopPropagation()}>
        <button className="hiw-close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="hiw-header">
          <div className="hiw-tag">Bversity · Biotech &amp; Life Sciences Career Pathways</div>
          <h2 className="hiw-title">Discover your career in biotech &amp; life sciences</h2>
          <p className="hiw-desc">
            Not lectures. Not video courses. A living, adaptive platform built career-first — from discovery to industry readiness.
          </p>
        </div>

        <div className="hiw-section-label">Your career pathway, built by Bversity</div>
        <div className="hiw-use-cases">
          <div className="hiw-use-case">
            <div className="hiw-uc-icon">🧭</div>
            <div className="hiw-uc-body">
              <div className="hiw-uc-title">Career Discovery</div>
              <div className="hiw-uc-desc">Find exactly where your biology background leads in biotech and life sciences.</div>
            </div>
          </div>
          <div className="hiw-use-case">
            <div className="hiw-uc-icon">🏭</div>
            <div className="hiw-uc-body">
              <div className="hiw-uc-title">Industry Readiness</div>
              <div className="hiw-uc-desc">Learn how clinical trials, genomics pipelines and drug discovery actually work in industry.</div>
            </div>
          </div>
          <div className="hiw-use-case">
            <div className="hiw-uc-icon">⚡</div>
            <div className="hiw-uc-body">
              <div className="hiw-uc-title">Emerging Fields</div>
              <div className="hiw-uc-desc">Longevity, AI in drug discovery, RNA therapeutics. Stay ahead of what's reshaping the industry.</div>
            </div>
          </div>
          <div className="hiw-use-case">
            <div className="hiw-uc-icon">🚀</div>
            <div className="hiw-uc-body">
              <div className="hiw-uc-title">Get Hired</div>
              <div className="hiw-uc-desc">Build domain knowledge and real skills that hiring managers at CROs, pharma, and biotech actually look for.</div>
            </div>
          </div>
        </div>

        <div className="hiw-section-label">How it works</div>
        <div className="hiw-steps">
          <div className="hiw-step">
            <div className="hiw-step-num">1</div>
            <div className="hiw-step-text">
              <strong>Pick your career destination</strong>
              <span>Choose the role you're building towards from curated biotech and life sciences career tracks.</span>
            </div>
          </div>
          <div className="hiw-step">
            <div className="hiw-step-num">2</div>
            <div className="hiw-step-text">
              <strong>See your learning pathway</strong>
              <span>Your personalised track shows every subject and skill you need, mapped to your target role, in the right order.</span>
            </div>
          </div>
          <div className="hiw-step">
            <div className="hiw-step-num">3</div>
            <div className="hiw-step-text">
              <strong>Learn with AI industry experts</strong>
              <span>One-on-one sessions with AI tutors who have real industry backgrounds — adaptive, deep, and built around you.</span>
            </div>
          </div>
          <div className="hiw-step">
            <div className="hiw-step-num">4</div>
            <div className="hiw-step-text">
              <strong>Walk in career-ready</strong>
              <span>Build domain knowledge, earn verified credentials, and go into interviews knowing what the industry actually expects.</span>
            </div>
          </div>
        </div>

        <div className="hiw-footer-ctas">
          <button className="welcome-cta" onClick={onRequestAccess}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Request Access
          </button>
          <button className="welcome-cta-ghost" onClick={onGetStarted}>
            Sign In
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onGetStarted }) {
  const [waitlistCount, setWaitlistCount] = useState(null);
  const [showWaitlist, setShowWaitlist]   = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    fetch('/api/waitlist-count')
      .then(r => r.json())
      .then(d => setWaitlistCount(d.count))
      .catch(() => {});
  }, []);

  if (showWaitlist) {
    return <WaitlistForm onBack={() => setShowWaitlist(false)} onCountUpdate={setWaitlistCount} />;
  }

  return (
    <div className="welcome-screen">
      <video className="welcome-video-bg" autoPlay muted loop playsInline>
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>
      <div className="welcome-video-overlay" />

      <header className="welcome-header">
        <img src="/logo-3.png" alt="Bversity" className="welcome-logo-img" />
        <button className="welcome-signin-btn" onClick={onGetStarted}>Sign In</button>
      </header>

      <div className="welcome-content-block">
        {ACTIVE_REGION === 'us' ? (
          <div className="welcome-hero">
            <div className="welcome-tag">US &amp; Europe · Life Science Certifications</div>
            <h1 className="welcome-headline">
              Your AI co-pilot for<br />
              <span className="welcome-headline-accent">life science certifications</span>
            </h1>
            <p className="welcome-subline">
              Built for working professionals in clinical research, pharma, and life sciences.
              Prep for CCRA, CCRP, RAC, and more  -  at your own pace.
            </p>
            <div className="welcome-cta-row">
              <button className="welcome-cta" onClick={onGetStarted}>
                Start your prep
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="welcome-cta-ghost" onClick={() => setShowWaitlist(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Request Access
              </button>
            </div>
            {waitlistCount !== null && waitlistCount > 0 && (
              <p className="welcome-waitlist-count">
                Join {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} already on the waitlist
              </p>
            )}
          </div>
        ) : (
          <div className="welcome-hero">
            <div className="welcome-tag">Biotech &amp; Life Sciences · Career Pathways</div>
            <h1 className="welcome-headline">
              Discover your path in<br />
              <span className="welcome-headline-accent">biotech &amp; life sciences</span>
            </h1>
            <p className="welcome-subline">
              From career discovery to industry readiness — learn from AI-powered experts
              and build the skills that get you hired.
            </p>
            <div className="welcome-cta-row">
              <button className="welcome-cta" onClick={() => setShowHowItWorks(true)}>
                How it works
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="welcome-cta-ghost" onClick={() => setShowWaitlist(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Request Access
              </button>
            </div>
            {waitlistCount !== null && waitlistCount > 0 && (
              <p className="welcome-waitlist-count">
                Join {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} already on the waitlist
              </p>
            )}
          </div>
        )}

        <div className="welcome-subjects-bar">
          {ACTIVE_REGION === 'us' ? (
            US_SUBJECTS.map(s => (
              <span key={s.id} className="welcome-subject-pill">
                <span className="welcome-pill-icon">🎓</span>
                {s.name}
              </span>
            ))
          ) : (
            SUBJECTS.map(s => (
              <span key={s.id} className="welcome-subject-pill">
                <span className="welcome-pill-icon">{SUBJECT_ICONS[s.id]}</span>
                {s.name}
              </span>
            ))
          )}
        </div>
      </div>

      <footer className="welcome-footer">
        {ACTIVE_REGION === 'us'
          ? 'Powered by Anthropic Claude · Life Science Certifications · US & Europe'
          : 'Powered by Anthropic Claude · Biotech & Life Sciences Career Pathways'}
      </footer>

      {showHowItWorks && (
        <HowItWorksOverlay
          onClose={() => setShowHowItWorks(false)}
          onGetStarted={onGetStarted}
          onRequestAccess={() => { setShowHowItWorks(false); setShowWaitlist(true); }}
        />
      )}
    </div>
  );
}

// ── Waitlist Form ────────────────────────────────────────────────────────────

function WaitlistForm({ onBack, onCountUpdate }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', university: '', year_of_study: '', country: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(null);
  const [error, setError]           = useState('');

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Something went wrong');
      setSubmitted(data);
      if (onCountUpdate) onCountUpdate(data.position);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  if (submitted) {
    return (
      <div className="waitlist-screen">
        <div className="waitlist-card">
          <div className="waitlist-success-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16c1ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="waitlist-success-title">You're on the waitlist!</h2>
          <p className="waitlist-success-pos">You are <strong>#{submitted.position}</strong> on the waitlist</p>
          <p className="waitlist-success-sub">We'll send you an invite to <strong>{form.email}</strong> when your spot opens up. We review applications every week.</p>
          <button className="waitlist-back-btn" onClick={onBack}>Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="waitlist-screen">
      <video className="welcome-video-bg" autoPlay muted loop playsInline>
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>
      <div className="welcome-video-overlay" />
      <div className="waitlist-card">
        <button className="waitlist-back-link" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <img src="/logo-3.png" alt="Bversity" className="waitlist-logo" />
        <h2 className="waitlist-title">Request Access</h2>
        <p className="waitlist-subtitle">Tell us a bit about yourself and we'll review your application.</p>

        <form className="waitlist-form" onSubmit={handleSubmit}>
          <div className="waitlist-row">
            <div className="waitlist-field">
              <label>Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" required />
            </div>
            <div className="waitlist-field">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" required />
            </div>
          </div>
          <div className="waitlist-row">
            <div className="waitlist-field">
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 890" />
            </div>
            <div className="waitlist-field">
              <label>Country</label>
              <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Where are you from?" />
            </div>
          </div>
          {ACTIVE_REGION === 'us' ? (
            <div className="waitlist-row">
              <div className="waitlist-field">
                <label>Current Employer / Organization</label>
                <input value={form.university} onChange={e => set('university', e.target.value)} placeholder="e.g. IQVIA, Pfizer, a hospital, self-employed…" />
              </div>
              <div className="waitlist-field">
                <label>Years of Experience in Life Sciences</label>
                <select value={form.year_of_study} onChange={e => set('year_of_study', e.target.value)}>
                  <option value="">Select…</option>
                  {US_EXP_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="waitlist-row">
              <div className="waitlist-field">
                <label>University / Institution</label>
                <input value={form.university} onChange={e => set('university', e.target.value)} placeholder="Your university or workplace" />
              </div>
              <div className="waitlist-field">
                <label>Year of Study</label>
                <select value={form.year_of_study} onChange={e => set('year_of_study', e.target.value)}>
                  <option value="">Select year</option>
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="waitlist-field waitlist-field-full">
            <label>Why do you want access?</label>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)}
              placeholder={ACTIVE_REGION === 'us'
                ? "Which certification are you targeting? Where are you in your prep? What gaps are you trying to close?"
                : "Tell us about your goals, what you're hoping to learn, or what drew you to Bversity..."}
              rows={4} />
          </div>
          {error && <p className="waitlist-error">{error}</p>}
          <button type="submit" className="waitlist-submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Join the Waitlist →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Sample Weekly Report Modal ───────────────────────────────────────────────

function SampleReportModal({ onClose }) {
  const SAMPLE = {
    name: 'Arjun Sharma',
    week: 'Week of 28 Apr 2025',
    narrative: '"Arjun, this was a strong week. You covered 8 concepts across two subjects and your evening sessions are getting longer, a sign the material is clicking. The one area to watch: Market Sizing and Regulatory Pathways have been sitting in \'covered\' for a while. One focused session on each would push them to mastered and meaningfully move your career readiness score."',
    sessions: 3, wow_sessions: '+1',
    concepts_covered: 8, wow_concepts: '+3',
    concepts_mastered: 2,
    quizzes: '2 / 3',
    streak: 5,
    peak_time: 'Evening',
    peak_day: 'Wednesday',
    avg_session: '34 min',
    avg_msgs: '12 messages',
    learning_style: 'Deep diver',
    strongest_concept: 'Drug Discovery Fundamentals',
    stuck_concepts: ['Market Sizing', 'Regulatory Pathways'],
    active_subjects: ['Life Sciences Fundamentals', 'Biotech Business'],
    career_title: 'Biotech Business Development Associate',
    career_readiness: 24,
    untouched: ['Investor Pitch Deck Anatomy', 'Term Sheet Negotiation'],
  };

  function downloadPDF() {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bversity Weekly Report: Sample</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f6f9; padding: 32px 16px; }
    .doc { max-width: 580px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.15); }
    .hdr { background: #07142A; padding: 28px 32px 24px; }
    .hdr-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .brand { font-size: 18px; font-weight: 900; color: #fff; }
    .brand-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
    .report-meta { text-align: right; font-size: 11px; color: rgba(255,255,255,0.45); line-height: 1.6; }
    .hdr-title { font-size: 21px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
    .hdr-narrative { margin-top: 12px; font-size: 13px; color: rgba(255,255,255,0.72); line-height: 1.65; font-style: italic; }
    .body { background: #fff; padding: 28px 32px; border: 1px solid #E8EDF3; border-top: none; border-radius: 0 0 12px 12px; }
    .section-label { font-size: 10px; font-weight: 700; color: #9EABBE; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
    .stats-row { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
    .stat-box { flex: 1; min-width: 90px; background: #F0FBF9; border-radius: 10px; padding: 14px 12px; text-align: center; }
    .stat-val { font-size: 26px; font-weight: 900; color: #16c1ad; line-height: 1; }
    .stat-lbl { font-size: 11px; color: #07142A; margin-top: 4px; line-height: 1.3; }
    .stat-delta { font-size: 10px; color: #16a34a; margin-top: 3px; font-weight: 600; }
    .streak { font-size: 13px; color: #07142A; font-weight: 600; margin-bottom: 4px; }
    .divider { border-top: 1px solid #E8EDF3; margin: 18px 0; }
    .row { display: flex; gap: 8px; margin-bottom: 7px; align-items: flex-start; }
    .row-label { font-size: 12px; color: #9EABBE; min-width: 140px; flex-shrink: 0; }
    .row-value { font-size: 12px; color: #07142A; font-weight: 600; }
    .cta { text-align: center; margin-bottom: 16px; }
    .cta-btn { display: inline-block; background: #16c1ad; color: #fff; border-radius: 8px; padding: 12px 28px; font-size: 13px; font-weight: 700; text-decoration: none; }
    .footer { text-align: center; font-size: 11px; color: #9EABBE; }
    .watermark { text-align: center; font-size: 11px; color: #ccc; margin-top: 16px; letter-spacing: 2px; }
    @media print {
      body { background: #fff; padding: 0; }
      .doc { box-shadow: none; }
    }
  </style>
</head>
<body>
<div class="doc">
  <div class="hdr">
    <div class="hdr-row">
      <div><div class="brand">Bversity</div><div class="brand-sub">AI University · School of Bioscience</div></div>
      <div class="report-meta">Weekly Learning Report<br>${SAMPLE.week}</div>
    </div>
    <div class="hdr-title">Your week at Bversity, ${SAMPLE.name.split(' ')[0]} 🧬</div>
    <div class="hdr-narrative">${SAMPLE.narrative}</div>
  </div>
  <div class="body">
    <div class="section-label">This Week</div>
    <div class="stats-row">
      <div class="stat-box"><div class="stat-val">${SAMPLE.sessions}</div><div class="stat-lbl">Sessions</div><div class="stat-delta">${SAMPLE.wow_sessions} vs last week</div></div>
      <div class="stat-box"><div class="stat-val">${SAMPLE.concepts_covered}</div><div class="stat-lbl">Concepts Covered</div><div class="stat-delta">${SAMPLE.wow_concepts} vs last week</div></div>
      <div class="stat-box"><div class="stat-val">${SAMPLE.concepts_mastered}</div><div class="stat-lbl">Concepts Mastered</div></div>
      <div class="stat-box"><div class="stat-val">${SAMPLE.quizzes}</div><div class="stat-lbl">Quizzes Passed</div></div>
    </div>
    <div class="streak">🔥 ${SAMPLE.streak}-day streak. Keep it going!</div>
    <div class="divider"></div>
    <div class="section-label">Your Learning Pattern</div>
    <div class="row"><div class="row-label">Peak time</div><div class="row-value">${SAMPLE.peak_time} learner · most active on ${SAMPLE.peak_day}s</div></div>
    <div class="row"><div class="row-label">Session length</div><div class="row-value">Avg ${SAMPLE.avg_session} · ${SAMPLE.avg_msgs} per session</div></div>
    <div class="row"><div class="row-label">Learning style</div><div class="row-value">${SAMPLE.learning_style}</div></div>
    <div class="divider"></div>
    <div class="section-label">Concepts</div>
    <div class="row"><div class="row-label">Latest mastery</div><div class="row-value">${SAMPLE.strongest_concept} ✓</div></div>
    <div class="row"><div class="row-label">Needs attention</div><div class="row-value">${SAMPLE.stuck_concepts.join(', ')}</div></div>
    <div class="row"><div class="row-label">Active subjects</div><div class="row-value">${SAMPLE.active_subjects.join(', ')}</div></div>
    <div class="divider"></div>
    <div class="section-label">Career Path</div>
    <div class="row"><div class="row-label">Target role</div><div class="row-value">${SAMPLE.career_title} · ${SAMPLE.career_readiness}% career ready</div></div>
    <div class="row"><div class="row-label">Not yet started</div><div class="row-value">${SAMPLE.untouched.join(', ')}</div></div>
    <div class="divider"></div>
    <div class="cta"><div class="cta-btn">Continue Learning →</div></div>
    <div class="footer">Sent every Monday · university.bversity.io</div>
  </div>
</div>
<div class="watermark">SAMPLE REPORT</div>
<script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;
    const w = window.open('', '_blank', 'width=700,height=900');
    w.document.write(html);
    w.document.close();
  }

  const s = SAMPLE;
  const navy = '#07142A';
  const teal = '#16c1ad';
  const tealDim = '#0d9e8e';
  const muted = '#7A8FA6';
  const border = '#E8EDF3';
  const bg = '#F4F6F9';

  function StatBox({ val, label, delta }) {
    return (
      <div style={{ flex: 1, minWidth: 90, background: '#F0FBF9', borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: teal, lineHeight: 1 }}>{val}</div>
        <div style={{ fontSize: 11, color: navy, marginTop: 4, lineHeight: 1.3 }}>{label}</div>
        {delta && <div style={{ fontSize: 10, color: '#16a34a', marginTop: 3, fontWeight: 600 }}>{delta} vs last week</div>}
      </div>
    );
  }

  function SectionLabel({ children }) {
    return <div style={{ fontSize: 10, fontWeight: 700, color: muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{children}</div>;
  }

  function Divider() {
    return <div style={{ borderTop: `1px solid ${border}`, margin: '18px 0' }} />;
  }

  function Row({ label, value }) {
    return (
      <div style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, color: muted, minWidth: 140 }}>{label}</div>
        <div style={{ fontSize: 12, color: navy, fontWeight: 600 }}>{value}</div>
      </div>
    );
  }

  return (
    <div className="sample-report-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sample-report-shell">

        {/* Toolbar  -  hidden on print */}
        <div className="sample-report-toolbar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#3D5166', fontWeight: 600 }}>Sample Weekly Report</span>
            <span style={{ fontSize: 11, color: muted, background: bg, border: `1px solid ${border}`, borderRadius: 99, padding: '2px 10px' }}>Preview</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="sample-report-print-btn" onClick={downloadPDF}>⬇ Download PDF</button>
            <button className="sample-report-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Document */}
        <div className="sample-report-doc" id="sample-report-doc">

          {/* Header */}
          <div style={{ background: navy, borderRadius: '12px 12px 0 0', padding: '28px 32px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Bversity</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>AI University · School of Bioscience</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Weekly Learning Report</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.week}</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Your week at Bversity, {s.name.split(' ')[0]} 🧬</div>
            <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontStyle: 'italic', maxWidth: 520 }}>
              {s.narrative}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '28px 32px', background: '#fff', borderRadius: '0 0 12px 12px', border: `1px solid ${border}`, borderTop: 'none' }}>

            {/* Stats */}
            <SectionLabel>This Week</SectionLabel>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <StatBox val={s.sessions} label="Sessions" delta={s.wow_sessions} />
              <StatBox val={s.concepts_covered} label="Concepts Covered" delta={s.wow_concepts} />
              <StatBox val={s.concepts_mastered} label="Concepts Mastered" />
              <StatBox val={s.quizzes} label="Quizzes Passed" />
            </div>
            <div style={{ fontSize: 13, color: navy, fontWeight: 600, marginBottom: 6 }}>
              🔥 {s.streak}-day streak. Keep it going!
            </div>

            <Divider />

            {/* Learning pattern */}
            <SectionLabel>Your Learning Pattern</SectionLabel>
            <Row label="Peak time" value={`${s.peak_time} learner · most active on ${s.peak_day}s`} />
            <Row label="Session length" value={`Avg ${s.avg_session} · ${s.avg_msgs} per session`} />
            <Row label="Learning style" value={s.learning_style} />

            <Divider />

            {/* Concepts */}
            <SectionLabel>Concepts</SectionLabel>
            <Row label="Latest mastery" value={`${s.strongest_concept} ✓`} />
            <Row label="Needs attention" value={s.stuck_concepts.join(', ')} />
            <Row label="Active subjects" value={s.active_subjects.join(', ')} />

            <Divider />

            {/* Career */}
            <SectionLabel>Career Path</SectionLabel>
            <Row label="Target role" value={`${s.career_title} · ${s.career_readiness}% career ready`} />
            <Row label="Not yet started" value={s.untouched.join(', ')} />

            <Divider />

            {/* CTA */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ display: 'inline-block', background: teal, color: '#fff', borderRadius: 8, padding: '12px 28px', fontSize: 13, fontWeight: 700 }}>
                Continue Learning →
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: muted }}>
              Sent every Monday · university.bversity.io
            </div>
          </div>

          {/* Sample watermark */}
          <div className="sample-report-watermark no-print">SAMPLE</div>
        </div>
      </div>
    </div>
  );
}

// ── Re-entry Screen ─────────────────────────────────────────────────────────

function ReEntryScreen({ student, onGo, onDismiss }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reentry/${student.id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); onDismiss(); });
  }, [student.id]);

  if (loading) return (
    <div className="reentry-shell">
      <div className="reentry-loading">
        <div className="reentry-loading-dot" /><div className="reentry-loading-dot" /><div className="reentry-loading-dot" />
      </div>
    </div>
  );
  if (!data) return null;

  const firstName = student.name.split(' ')[0];
  const { days_away, last_session, next_concept, overdue_count,
          streak_count, streak_at_risk, streak_broken, streak_today } = data;

  function awayText() {
    if (days_away === 0) return 'You were just here.';
    if (days_away === 1) return 'Back after a day away.';
    if (days_away <= 6) return `Back after ${days_away} days.`;
    if (days_away <= 13) return `You've been away for ${days_away} days.`;
    return `It's been ${days_away} days. Good to see you.`;
  }

  function ctaLabel() {
    if (next_concept) return `Study ${next_concept.concept_name}`;
    if (last_session) return `Continue ${last_session.subject_name}`;
    return 'Start learning';
  }

  function handleGo() {
    const targetSubjectId = next_concept?.subject_id || last_session?.subject_id;
    if (targetSubjectId) {
      const subj = SUBJECTS.find(s => s.id === targetSubjectId);
      if (subj) { onGo(subj); return; }
    }
    onDismiss();
  }

  return (
    <div className="reentry-shell">
      <div className="reentry-card">

        {/* Header */}
        <div className="reentry-header">
          <div className="reentry-greeting">Welcome back, {firstName}</div>
          <div className="reentry-away">{awayText()}</div>
        </div>

        {/* Streak */}
        {streak_count > 0 && (
          <div className={`reentry-streak ${streak_broken ? 'broken' : streak_at_risk ? 'at-risk' : 'active'}`}>
            <span className="reentry-streak-icon">
              {streak_broken ? '💔' : streak_at_risk ? '⚠️' : '🔥'}
            </span>
            <div>
              {streak_broken
                ? <><strong>Your {streak_count}-day streak ended.</strong> Start a new one today.</>
                : streak_at_risk
                ? <><strong>Streak at risk!</strong> You have {streak_count} days. Don't break it now.</>
                : <><strong>{streak_count}-day streak</strong>. Keep it going!</>
              }
            </div>
          </div>
        )}

        {/* Last session recap */}
        {last_session?.summary && (
          <div className="reentry-recap">
            <div className="reentry-recap-label">
              <span className="reentry-recap-dot" style={{ background: last_session.subject_color }} />
              Last session · {last_session.subject_name}
            </div>
            <div className="reentry-recap-text">{last_session.summary}</div>
          </div>
        )}

        {/* Next action */}
        {next_concept && (
          <div className="reentry-next" style={{ borderColor: next_concept.subject_color + '44', background: next_concept.subject_color + '08' }}>
            <div className="reentry-next-label">
              {next_concept.is_overdue
                ? <span className="reentry-overdue-chip">{overdue_count} overdue</span>
                : <span className="reentry-today-chip">Up next</span>
              }
            </div>
            <div className="reentry-next-concept" style={{ color: next_concept.subject_color }}>
              {next_concept.concept_name}
            </div>
            <div className="reentry-next-subject">{next_concept.subject_name}</div>
          </div>
        )}

        {/* CTA */}
        <button
          className="reentry-cta"
          style={{ background: next_concept?.subject_color || last_session?.subject_color || '#00A896' }}
          onClick={handleGo}
        >
          {ctaLabel()} →
        </button>

        <button className="reentry-skip" onClick={onDismiss}>
          See everything
        </button>
      </div>
    </div>
  );
}

// ── Login ───────────────────────────────────────────────────────────────────

function LoginView({ onLogin, onBack }) {
  const [step, setStep]             = useState(1);
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [code, setCode]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [showReport, setShowReport] = useState(false);

  async function handleRequestCode(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/request-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Something went wrong.'); return; }
      setStep(2);
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Invalid code.'); return; }
      onLogin({ id: data.student_id, name: data.name, returning: data.returning });
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-inner">
          <div className="login-brand">
            <img src="/logo-3.png" alt="Bversity" className="login-logo-img" />
          </div>
          <h2 className="login-headline">Learn biotech like you're already working in it.</h2>
          <p className="login-subline">Industry faculty from Broad Institute, Illumina, Genentech, and Novartis  -  teaching the exact curriculum your career requires.</p>
          <div className="login-features">
            <div className="login-feature"><span className="login-feature-dot" />Career-mapped curriculum, only what you need to know</div>
            <div className="login-feature"><span className="login-feature-dot" />AI industry experts that adapt to your pace and prior knowledge</div>
            <div className="login-feature"><span className="login-feature-dot" />Real-world capstone projects, marked by faculty</div>
          </div>
          <div className="login-chips">
            {['Bioinformatics', 'Genomics', 'Drug Discovery', 'Clinical Trials', 'Gen AI & ML', 'Biotech Business'].map(s => (
              <span key={s} className="login-chip">{s}</span>
            ))}
          </div>
          <button className="login-sample-report-btn" onClick={() => setShowReport(true)}>
            📄 See a sample weekly progress report →
          </button>
        </div>
      </div>
      {showReport && <SampleReportModal onClose={() => setShowReport(false)} />}
      <div className="login-right">
        <div className="login-form-wrap">
          {step === 1 ? (
            <>
              <div className="login-form-top">
                {onBack && (
                  <button className="login-back-link" onClick={onBack}>← Back</button>
                )}
                <h2>Welcome to Bversity</h2>
                <p>Enter your details and we'll send a verification code to your email.</p>
              </div>
              <form className="login-form" onSubmit={handleRequestCode}>
                <div className="form-group">
                  <label htmlFor="name">Full name</label>
                  <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
                </div>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="login-btn" disabled={loading || !name.trim() || !email.trim()}>
                  {loading ? 'Sending code...' : 'Send verification code →'}
                </button>
              </form>
              <p className="login-note">Access is invite-only. Contact sudharsan@bversity.io to request access.</p>
            </>
          ) : (
            <>
              <div className="login-form-top">
                <button className="login-back-link" onClick={() => { setStep(1); setCode(''); setError(''); }}>
                  ← Back
                </button>
                <h2>Check your email</h2>
                <p>We sent a 6-digit code to <strong>{email}</strong>. It expires in 15 minutes.</p>
              </div>
              <form className="login-form" onSubmit={handleVerifyCode}>
                <div className="form-group">
                  <label htmlFor="code">Verification code</label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="code-input"
                    autoFocus
                    required
                  />
                </div>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="login-btn" disabled={loading || code.length < 6}>
                  {loading ? 'Verifying...' : 'Enter Bversity →'}
                </button>
              </form>
              <p className="login-note">Didn't receive it? Check spam, or <button className="login-resend-btn" onClick={() => { setStep(1); setCode(''); setError(''); }}>resend code</button>.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Career Preview Modal ───────────────────────────────────────────────────

function CareerPreviewModal({ career, currentCareerId, saving, onConfirm, onClose }) {
  const imgs = useImgs();
  const color = CLUSTER_COLORS[career.cluster] || '#00A896';
  const relevantSubjects = SUBJECTS.filter(s => (career.relevant_subjects || []).includes(s.id));
  const totalHours = relevantSubjects.reduce((sum, s) => sum + (SUBJECT_HOURS[s.id] || 20), 0);
  const isCurrentPath = currentCareerId === career.id;

  return (
    <div className="cpv-backdrop" onClick={onClose}>
      <div className="cpv-panel" onClick={e => e.stopPropagation()}>
        <button className="cpv-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div
          className="cpv-header"
          style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.30) 100%), url(${imgs.career(career.id)})` }}
        >
          <div className="cpv-cluster-badge">
            {career.cluster}
          </div>
          <h2 className="cpv-title">{career.title}</h2>
          <div className="cpv-salary-row">
            <div className="cpv-salary-item">
              <span className="cpv-salary-flag">🇺🇸</span>
              <span className="cpv-salary-label">US Market</span>
              <span className="cpv-salary-value">{career.salary_range}</span>
            </div>
            {career.salary_range_india && (
              <div className="cpv-salary-item">
                <span className="cpv-salary-flag">🇮🇳</span>
                <span className="cpv-salary-label">India Market</span>
                <span className="cpv-salary-value">{career.salary_range_india}</span>
              </div>
            )}
          </div>
          <p className="cpv-desc">{career.description}</p>
        </div>

        <div className="cpv-subjects-label">
          Subjects in this path
          <span className="cpv-hours-pill">{totalHours} hrs total</span>
        </div>
        <div className="cpv-subjects">
          {relevantSubjects.map((s, i) => (
            <div key={s.id} className="cpv-subject-row">
              <span className="cpv-subject-num">{i + 1}</span>
              <span className="cpv-subject-icon" style={{ color: s.color }}>{SUBJECT_ICONS[s.id]}</span>
              <span className="cpv-subject-name">{s.name}</span>
              <span className="cpv-subject-hrs">{SUBJECT_HOURS[s.id] || 20}h</span>
            </div>
          ))}
        </div>

        {career.min_qualification && (
          <div className="cpv-qual">Minimum qualification: <strong>{career.min_qualification}</strong></div>
        )}

        <div className="cpv-actions">
          <button className="cpv-cancel" onClick={onClose}>Cancel</button>
          <button
            className="cpv-confirm"
            style={{ background: color, boxShadow: `0 4px 16px ${color}44` }}
            onClick={() => onConfirm(career.id)}
            disabled={!!saving}
          >
            {saving ? 'Setting path...' : isCurrentPath ? 'Current path' : 'Choose this path →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Career Select ──────────────────────────────────────────────────────────

function USPracticeQuestion({ question, index }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="us-pq-card">
      <div className="us-pq-meta">
        <span className="us-pq-number">Q{index + 1}</span>
        <span className="us-pq-domain-tag">{question.domain}</span>
      </div>
      <p className="us-pq-text">{question.text}</p>
      <div className="us-pq-options">
        {question.options.map((opt, i) => (
          <button
            key={i}
            className={`us-pq-option${selected === i ? ' selected' : ''}${revealed ? (i === question.answer ? ' correct' : selected === i ? ' wrong' : '') : ''}`}
            onClick={() => { if (!revealed) setSelected(i); }}
            disabled={revealed}
          >
            <span className="us-pq-letter">{String.fromCharCode(65 + i)}</span>
            {opt}
          </button>
        ))}
      </div>
      {selected !== null && !revealed && (
        <button className="us-pq-check-btn" onClick={() => setRevealed(true)}>Check Answer</button>
      )}
      {revealed && (
        <div className={`us-pq-explanation${selected === question.answer ? ' correct' : ' wrong'}`}>
          <strong>{selected === question.answer ? 'Correct.' : 'Not quite.'}</strong> {question.explanation}
        </div>
      )}
    </div>
  );
}

function USExamBlueprintView({ student, careerProfile, onBack }) {
  const certId = careerProfile?.career_id;
  const certSubject = US_SUBJECTS.find(s => s.id === certId);
  const examData = US_EXAM_DOMAINS[certId];
  const [conceptProgress, setConceptProgress] = useState(null);
  const [practiceUnlocked, setPracticeUnlocked] = useState(
    () => localStorage.getItem(`bversity_pq_${student?.id}`) === '1'
  );
  const [showPopup, setShowPopup] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState(null);

  useEffect(() => {
    if (student?.id && certId) {
      fetch(`/api/progress/${student.id}/${certId}`)
        .then(r => r.json())
        .then(d => setConceptProgress(d))
        .catch(() => {});
    }
  }, [student?.id, certId]);

  useEffect(() => {
    if (!certId) return;
    setJobsLoading(true);
    setJobsError(null);
    fetch(`/api/jobs/${certId}`)
      .then(r => { if (!r.ok) throw new Error('unavailable'); return r.json(); })
      .then(d => { setJobs(d.jobs || []); setJobsLoading(false); })
      .catch(e => { setJobsError(e.message); setJobsLoading(false); });
  }, [certId]);

  if (!certSubject || !examData) {
    return (
      <div className="us-blueprint-view">
        <p className="us-blueprint-empty">No certification selected. Go to Courses to pick your cert.</p>
      </div>
    );
  }

  const conceptMap = {};
  (conceptProgress?.concepts || []).forEach(c => { conceptMap[c.id] = c; });

  const coveredSet = new Set(Object.values(conceptMap).filter(c => c.covered).map(c => c.id));
  const totalConcepts = examData.domains.reduce((sum, d) => sum + d.concepts.length, 0);
  const coveredConcepts = examData.domains.reduce(
    (sum, d) => sum + d.concepts.filter(c => coveredSet.has(c.id)).length, 0
  );
  const readinessPct = totalConcepts > 0 ? Math.round((coveredConcepts / totalConcepts) * 100) : 0;

  function handleUnlock() { setShowPopup(true); }
  function handlePopupClose() {
    localStorage.setItem(`bversity_pq_${student?.id}`, '1');
    setPracticeUnlocked(true);
    setShowPopup(false);
  }

  const sampleQuestions = US_SAMPLE_QUESTIONS[certId] || [];

  return (
    <div className="us-blueprint-view">

      {/* ── Career context hero ── */}
      <div className="us-bp-career-hero">
        <div className="us-bp-ch-top">
          <div className="us-bp-ch-badge-row">
            <span className="us-bp-ch-cert-badge">{examData.certBody} · {examData.certName}</span>
            <span className="us-bp-ch-demand" style={{ color: examData.demandColor, borderColor: examData.demandColor + '33', background: examData.demandColor + '12' }}>{examData.demandLabel}</span>
          </div>
          <p className="us-bp-ch-tagline">{examData.tagline}</p>
        </div>

        <div className="us-bp-ch-grid">
          <div className="us-bp-ch-card">
            <div className="us-bp-ch-card-label">Salary range</div>
            <div className="us-bp-ch-card-val us-bp-ch-salary">{examData.salaryRange}</div>
            <div className="us-bp-ch-card-sub">US market, certified holders</div>
          </div>
          <div className="us-bp-ch-card">
            <div className="us-bp-ch-card-label">Career ladder</div>
            <div className="us-bp-ch-ladder">
              {(examData.careerLadder || []).map((step, i, arr) => (
                <span key={i} className="us-bp-ch-ladder-step">
                  <span className={`us-bp-ch-ladder-dot${i === 0 ? ' first' : ''}`} />
                  <span className="us-bp-ch-ladder-text">{step}</span>
                  {i < arr.length - 1 && <span className="us-bp-ch-ladder-arrow">→</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="us-bp-ch-card">
            <div className="us-bp-ch-card-label">Top employers</div>
            <div className="us-bp-ch-employers">
              {(examData.topEmployers || []).map(e => <span key={e} className="us-bp-ch-employer-pill">{e}</span>)}
            </div>
          </div>
          <div className="us-bp-ch-card">
            <div className="us-bp-ch-card-label">What this unlocks</div>
            <ul className="us-bp-ch-unlocks">
              {(examData.unlocks || []).map((u, i) => <li key={i}>{u}</li>)}
            </ul>
          </div>
        </div>

      </div>

      {/* ── Active Job Roles ── */}
      <div className="us-bp-section-header" style={{ marginTop: '2rem' }}>
        <h2 className="us-bp-section-title">Active job roles</h2>
        <p className="us-bp-section-sub">Live {examData.certName} openings across the US · updated every 3 days</p>
      </div>
      {jobsLoading ? (
        <div className="us-jobs-loading">
          <div className="us-jobs-loading-dots"><span/><span/><span/></div>
          <p>Fetching live listings…</p>
        </div>
      ) : jobsError ? (
        <div className="us-jobs-error"><p>Job listings unavailable right now.</p></div>
      ) : jobs.length === 0 ? (
        <div className="us-jobs-error"><p>No current listings found. Check back soon.</p></div>
      ) : (
        <div className="us-jobs-flat-list">
          {jobs.map((job, i) => {
            const hasSal = job.salary_min || job.salary_max;
            const salStr = hasSal ? `$${job.salary_min ? Math.round(job.salary_min/1000)+'k' : ''}${job.salary_min && job.salary_max ? '–' : ''}${job.salary_max ? '$'+Math.round(job.salary_max/1000)+'k' : ''}` : null;
            const cityOnly = job.location ? job.location.split(',')[0] : null;
            const snippet = job.description ? job.description.replace(/<[^>]+>/g, '').slice(0, 110).trim() + '…' : null;
            return (
              <a key={i} className="us-job-row" href={job.url} target="_blank" rel="noopener noreferrer">
                <div className="us-job-row-main">
                  <div className="us-job-row-top">
                    <span className="us-job-row-title">{job.title}</span>
                    <span className="us-job-row-company">{job.company}</span>
                    {cityOnly && <span className="us-job-row-loc">{cityOnly}</span>}
                    {salStr && <span className="us-job-row-sal">{salStr}</span>}
                    <span className="us-job-row-link">View →</span>
                  </div>
                  {snippet && <p className="us-job-row-desc">{snippet}</p>}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* ── Practice Questions ── */}
      <div className="us-bp-section-header" style={{ marginTop: '2.5rem' }}>
        <h2 className="us-bp-section-title">Practice Questions</h2>
        <p className="us-bp-section-sub">Scenario-based questions modeled on the actual {examData.certName} exam format</p>
      </div>
      {!practiceUnlocked ? (
        <div className="us-practice-locked">
          <div className="us-practice-lock-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <h3 className="us-practice-lock-title">Test your exam readiness</h3>
          <p className="us-practice-lock-desc">3 scenario-based questions per domain, with full answer explanations. Unlock once, use forever.</p>
          <button className="us-practice-unlock-btn" onClick={handleUnlock}>Request Access</button>
        </div>
      ) : (
        <div className="us-practice-questions">
          {sampleQuestions.map((q, i) => (
            <USPracticeQuestion key={i} question={q} index={i} />
          ))}
          <p className="us-pq-more-note">More questions per domain coming soon. Ask your tutor to quiz you in chat anytime.</p>
        </div>
      )}

      {showPopup && (
        <div className="us-unlock-overlay" onClick={handlePopupClose}>
          <div className="us-unlock-modal" onClick={e => e.stopPropagation()}>
            <div className="us-unlock-emoji">🎉</div>
            <h3 className="us-unlock-title">You're all set!</h3>
            <p className="us-unlock-body">Practice questions are now active for your {examData.certName} prep. Use them to test your recall between study sessions - they're modeled on the real exam format.</p>
            <p className="us-unlock-sub">Good luck. You've got this.</p>
            <button className="us-unlock-confirm-btn" onClick={handlePopupClose}>Start Practising</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CareerSelectView({ student, currentCareerId, onSelect, onBack }) {
  const imgs = useImgs();
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetch('/api/careers').then(r => r.json()).then(data => {
      setCareers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleConfirm(careerId) {
    setSaving(careerId);
    try {
      const res = await fetch(`/api/profile/${student.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_id: careerId }),
      });
      const data = await res.json();
      onSelect(data);
    } catch { setSaving(null); }
  }

  const clusters = ['Science & Technical', 'Business & Commercial', 'Emerging & Hybrid'];

  if (loading) return <div className="career-loading">Loading career paths...</div>;

  return (
    <div className="career-select-view">
      <div className="career-select-top">
        <button className="chat-back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>
      <div className="career-select-hero">
        <h1>Choose your career destination</h1>
        <p>Your AI industry experts will connect every concept they teach to how it's actually used in your target role, making your learning specific and purposeful.</p>
      </div>
      {clusters.map(cluster => {
        const clusterCareers = careers.filter(c => c.cluster === cluster);
        const color = CLUSTER_COLORS[cluster];
        return (
          <div key={cluster} className="career-cluster-section">
            <div className="career-cluster-label" style={{ color }}>
              <span className="career-cluster-dot" style={{ background: color }} />
              {cluster}
            </div>
            <div className="career-cards-grid">
              {clusterCareers.map(career => (
                <div
                  key={career.id}
                  className={`career-card ${currentCareerId === career.id ? 'selected' : ''}`}
                  style={{ '--career-color': color }}
                  onClick={() => setPreview(career)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setPreview(career)}
                >
                  <div
                    className="career-card-image"
                    style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 100%), url(${imgs.career(career.id)})` }}
                  >
                    <div className="career-card-image-title">{career.title}</div>
                    <div className="career-card-image-salary">
                      <span>🇺🇸 {career.salary_range}</span>
                      {career.salary_range_india && <span>🇮🇳 {career.salary_range_india}</span>}
                    </div>
                    {currentCareerId === career.id && <span className="career-card-image-check">✓ Current</span>}
                  </div>
                  <div className="career-card-body">
                    <p className="career-card-desc">{career.description}</p>
                    <div className="career-card-cta">
                      {currentCareerId === career.id ? 'Current path' : 'View path →'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {preview && (
        <CareerPreviewModal
          career={preview}
          currentCareerId={currentCareerId}
          saving={saving}
          onConfirm={handleConfirm}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

// ── Career Map ─────────────────────────────────────────────────────────────

const CAREER_STAGES = [
  { id: 'start',   label: 'Just started',   min: 0,  max: 15 },
  { id: 'core',    label: 'Building core',  min: 15, max: 40 },
  { id: 'getting', label: 'Getting there',  min: 40, max: 70 },
  { id: 'ready',   label: 'Job-ready',      min: 70, max: 100 },
];

function CareerMapView({ student, careerProfile, onBack, onChangePath, onStudy }) {
  const imgs = useImgs();
  const [dashData, setDashData] = useState(null);
  const [paceData, setPaceData] = useState(null);

  useEffect(() => {
    fetch(`/api/dashboard/${student.id}`).then(r => r.json()).then(setDashData).catch(() => {});
    fetch(`/api/career-pace/${student.id}`).then(r => r.json()).then(setPaceData).catch(() => {});
  }, [student.id]);

  const career = careerProfile?.career;
  if (!career) return null;

  const clusterColor = CLUSTER_COLORS[career.cluster] || '#00A896';

  // Readiness computed from relevant subjects' concept progress
  const relevantSubjects = SUBJECTS.filter(s => (career.relevant_subjects || []).includes(s.id));
  const relevantProgress = relevantSubjects.map(s => {
    const prog = dashData?.subjects?.[s.id];
    return {
      subject: s,
      covered:  prog?.covered_count  ?? 0,
      mastered: prog?.mastered_count ?? 0,
      total:    prog?.total ?? 36,
    };
  });
  const totalConcepts  = relevantProgress.reduce((sum, p) => sum + p.total,    0);
  const masteredCount  = relevantProgress.reduce((sum, p) => sum + p.mastered, 0);
  const coveredCount   = relevantProgress.reduce((sum, p) => sum + p.covered,  0);
  const readinessPct   = totalConcepts > 0 ? Math.round((masteredCount / totalConcepts) * 100) : 0;

  // Stage
  const currentStage = CAREER_STAGES.find(s => readinessPct < s.max) || CAREER_STAGES[CAREER_STAGES.length - 1];

  // Time estimate
  const weeklyPace = paceData?.weekly_pace ?? 0;
  const remaining  = totalConcepts - masteredCount;
  const weeksLeft  = weeklyPace > 0 ? Math.ceil(remaining / weeklyPace) : null;

  // Next focus: subject with most remaining concepts that the student hasn't started or has lowest mastery ratio
  const nextFocus = relevantProgress
    .filter(p => p.mastered < p.total)
    .sort((a, b) => {
      const ratioA = a.total > 0 ? a.mastered / a.total : 0;
      const ratioB = b.total > 0 ? b.mastered / b.total : 0;
      return ratioA - ratioB;
    })[0] ?? null;

  return (
    <div className="career-map-view">
      <div className="career-map-nav">
        <button className="chat-back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button className="change-path-btn" onClick={onChangePath}>Change career path</button>
      </div>

      <div
        className="career-map-hero"
        style={{
          '--career-color': clusterColor,
          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.38) 60%, rgba(0,0,0,0.18) 100%), url(${imgs.career(career.id)})`,
        }}
      >
        <div className="career-hero-content">
          <div className="career-map-cluster-badge">
            {career.cluster}
          </div>
          <h1 className="career-map-title">{career.title}</h1>
          <p className="career-map-desc">{career.description}</p>
          <div className="career-hero-badges">
            <div className="career-salary-badge">
              🇺🇸 {career.salary_range}
            </div>
            {career.salary_range_india && (
              <div className="career-salary-badge">
                🇮🇳 {career.salary_range_india}
              </div>
            )}
            {career.min_qualification && (
              <div className="career-qual-badge">
                {career.min_qualification === 'BTech / BSc' ? 'Starts with BTech / BSc' :
                 career.min_qualification === 'Any background' ? 'Open to all backgrounds' :
                 `Entry: ${career.min_qualification}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Career Progress Narrative ── */}
      <div className="career-narrative" style={{ '--cn-color': clusterColor }}>
        {/* Stage journey */}
        <div className="cn-stage-row">
          {CAREER_STAGES.map((stage, i) => {
            const isActive  = stage.id === currentStage.id;
            const isPast    = CAREER_STAGES.indexOf(CAREER_STAGES.find(s => s.id === currentStage.id)) > i;
            return (
              <React.Fragment key={stage.id}>
                <div className={`cn-stage-item ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}>
                  <div className="cn-stage-dot" style={isActive || isPast ? { background: clusterColor, borderColor: clusterColor } : {}} />
                  <span className="cn-stage-label">{stage.label}</span>
                </div>
                {i < CAREER_STAGES.length - 1 && (
                  <div className={`cn-stage-connector ${isPast || isActive ? 'filled' : ''}`}
                       style={isPast || isActive ? { background: clusterColor } : {}} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Narrative text */}
        <div className="cn-narrative-text">
          <span className="cn-stage-badge" style={{ background: clusterColor + '1a', color: clusterColor, border: `1px solid ${clusterColor}33` }}>
            {currentStage.label}
          </span>
          <p className="cn-sentence">
            {student.name.split(' ')[0]}, you've mastered <strong>{masteredCount}</strong> of <strong>{totalConcepts}</strong> concepts needed to become a <strong>{career.title}</strong>.
            {weeksLeft !== null && weeksLeft > 0
              ? <> At your current pace, you'll be job-ready in approximately <strong>{weeksLeft} week{weeksLeft > 1 ? 's' : ''}</strong>.</>
              : masteredCount >= totalConcepts
              ? <> You have the core knowledge to step into this role.</>
              : <> Start studying consistently to get your readiness estimate.</>
            }
          </p>
        </div>

        {/* Readiness meter */}
        <div className="cn-meter-row">
          <div className="cn-meter-track">
            <div className="cn-meter-fill covered" style={{ width: `${totalConcepts > 0 ? (coveredCount / totalConcepts) * 100 : 0}%`, background: clusterColor + '40' }} />
            <div className="cn-meter-fill mastered" style={{ width: `${totalConcepts > 0 ? (masteredCount / totalConcepts) * 100 : 0}%`, background: clusterColor }} />
          </div>
          <span className="cn-meter-pct" style={{ color: clusterColor }}>{readinessPct}%</span>
        </div>
        <div className="cn-meter-legend">
          <span style={{ color: clusterColor }}>{masteredCount} mastered</span>
          <span style={{ color: clusterColor + '99' }}>{coveredCount} covered</span>
          <span className="cn-remaining">{totalConcepts - masteredCount - coveredCount} remaining</span>
        </div>

        {/* Next focus */}
        {nextFocus && (
          <div className="cn-next-focus" onClick={() => onStudy(nextFocus.subject)} role="button" tabIndex={0}
               onKeyDown={e => e.key === 'Enter' && onStudy(nextFocus.subject)}
               style={{ borderColor: nextFocus.subject.color + '55' }}>
            <div className="cn-next-label">Your next focus</div>
            <div className="cn-next-content">
              <span className="cn-next-icon" style={{ color: nextFocus.subject.color }}>{SUBJECT_ICONS[nextFocus.subject.id]}</span>
              <div className="cn-next-info">
                <div className="cn-next-name">{nextFocus.subject.name}</div>
                <div className="cn-next-stat">{nextFocus.mastered} of {nextFocus.total} concepts mastered</div>
              </div>
              <div className="cn-next-cta" style={{ background: nextFocus.subject.color }}>Study now →</div>
            </div>
          </div>
        )}
      </div>

      <div className="career-map-body">
        <div className="career-map-grid">
          <div className="career-map-section">
            <h3 className="cms-title">A day in the life</h3>
            <p className="cms-text">{career.day_in_life}</p>
          </div>

          <div className="career-map-section">
            <h3 className="cms-title">Industries</h3>
            <div className="industry-tags">
              {career.industries.map(ind => (
                <span key={ind} className="industry-tag" style={{ borderColor: clusterColor + '55', color: clusterColor }}>{ind}</span>
              ))}
            </div>
          </div>

          <div className="career-map-section career-progression-section">
            <h3 className="cms-title">Career progression</h3>
            <div className="career-progression">
              {career.progression.map((step, i) => (
                <div key={i} className="progression-step">
                  <div className="progression-dot" style={{ background: i === 0 ? clusterColor : 'var(--border)', borderColor: clusterColor }} />
                  <span className="progression-label" style={{ fontWeight: i === 0 ? 700 : 400, color: i === 0 ? 'var(--navy)' : 'var(--text-muted)' }}>
                    {step}
                  </span>
                  {i < career.progression.length - 1 && (
                    <div className="progression-connector" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="career-map-section career-readiness-section">
            <h3 className="cms-title">Career readiness</h3>
            <div className="readiness-summary">
              <div className="readiness-pct" style={{ color: clusterColor }}>{readinessPct}%</div>
              <div className="readiness-label">of relevant concepts mastered</div>
            </div>
            <div className="readiness-bar-track">
              <div className="readiness-bar-covered" style={{ width: `${totalConcepts > 0 ? ((coveredCount) / totalConcepts) * 100 : 0}%`, background: clusterColor + '44' }} />
              <div className="readiness-bar-mastered" style={{ width: `${totalConcepts > 0 ? (masteredCount / totalConcepts) * 100 : 0}%`, background: clusterColor }} />
            </div>
            <div className="readiness-legend">
              <span style={{ color: clusterColor }}>■ {masteredCount} mastered</span>
              <span style={{ color: clusterColor + '88' }}>■ {coveredCount} covered</span>
              <span className="readiness-remaining">○ {totalConcepts - masteredCount - coveredCount} remaining</span>
            </div>
          </div>
        </div>

        <div className="career-concepts-section">
          <h3 className="cms-title">Subjects for this career</h3>
          <div className="career-subject-progress-list">
            {relevantProgress.map(({ subject: s, covered, mastered, total }) => {
              const covPct  = total > 0 ? Math.round((covered  / total) * 100) : 0;
              const mastPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
              return (
                <div key={s.id} className="career-subj-row" onClick={() => onStudy(s)} role="button" tabIndex={0}
                     onKeyDown={e => e.key === 'Enter' && onStudy(s)}>
                  <span className="career-subj-icon" style={{ color: s.color }}>{SUBJECT_ICONS[s.id]}</span>
                  <div className="career-subj-info">
                    <div className="career-subj-name">{s.name}</div>
                    <div className="career-subj-bar-track">
                      <div className="career-subj-bar-fill" style={{ width: `${covPct}%`, background: s.color + '44' }} />
                      <div className="career-subj-bar-fill" style={{ width: `${mastPct}%`, background: s.color }} />
                    </div>
                  </div>
                  <span className="career-subj-stat" style={{ color: s.color }}>{mastered}/{total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Community Map ──────────────────────────────────────────────────────────

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const INDIA_TOPO_URL = WORLD_TOPO_URL; // kept for any legacy refs

const STATE_CENTROIDS = {
  'Andhra Pradesh':[79.74,15.91],'Arunachal Pradesh':[94.73,28.22],'Assam':[92.94,26.20],
  'Bihar':[85.31,25.10],'Chhattisgarh':[81.87,21.28],'Goa':[74.12,15.30],
  'Gujarat':[71.19,22.26],'Haryana':[76.09,29.06],'Himachal Pradesh':[77.17,31.10],
  'Jharkhand':[85.28,23.61],'Karnataka':[75.71,15.32],'Kerala':[76.27,10.85],
  'Madhya Pradesh':[78.66,22.97],'Maharashtra':[75.71,19.75],'Manipur':[93.91,24.66],
  'Meghalaya':[91.37,25.47],'Mizoram':[92.94,23.16],'Nagaland':[94.56,26.16],
  'Odisha':[85.10,20.95],'Punjab':[75.34,31.15],'Rajasthan':[74.22,27.02],
  'Sikkim':[88.51,27.53],'Tamil Nadu':[78.66,11.13],'Telangana':[79.02,17.85],
  'Tripura':[91.99,23.94],'Uttar Pradesh':[80.95,26.85],'Uttarakhand':[79.02,30.07],
  'West Bengal':[87.86,22.99],'Delhi':[77.21,28.61],'Chandigarh':[76.78,30.73],
  'Jammu & Kashmir':[74.80,33.78],'Ladakh':[77.56,34.15],'Puducherry':[79.81,11.94],
  'Andaman & Nicobar Islands':[92.79,11.74],'Lakshadweep':[72.64,10.57],
  'Dadra & Nagar Haveli':[73.02,20.19],'Daman & Diu':[72.83,20.40],
};

const CITY_COORDS = {
  'Mumbai':[72.88,19.08],'Delhi':[77.21,28.61],'New Delhi':[77.21,28.61],
  'Bangalore':[77.59,12.97],'Bengaluru':[77.59,12.97],'Hyderabad':[78.49,17.39],
  'Chennai':[80.27,13.08],'Kolkata':[88.36,22.57],'Pune':[73.86,18.52],
  'Ahmedabad':[72.57,23.02],'Jaipur':[75.79,26.91],'Surat':[72.83,21.17],
  'Lucknow':[80.95,26.85],'Kanpur':[80.33,26.45],'Nagpur':[79.09,21.15],
  'Indore':[75.86,22.72],'Bhopal':[77.40,23.26],'Chandigarh':[76.78,30.73],
  'Kochi':[76.27,9.93],'Coimbatore':[76.96,11.02],'Visakhapatnam':[83.22,17.69],
  'Patna':[85.14,25.59],'Thiruvananthapuram':[76.94,8.52],'Mysore':[76.64,12.30],
  'Mysuru':[76.64,12.30],'Noida':[77.39,28.54],'Gurgaon':[77.03,28.46],
  'Gurugram':[77.03,28.46],'Vadodara':[73.18,22.31],'Agra':[78.01,27.18],
  'Varanasi':[82.97,25.32],'Nashik':[73.79,19.99],'Meerut':[77.71,28.98],
  'Ranchi':[85.32,23.34],'Guwahati':[91.74,26.14],'Mangalore':[74.85,12.91],
  'Vijayawada':[80.65,16.51],'Rajkot':[70.80,22.30],'Amritsar':[74.87,31.63],
  'Ludhiana':[75.86,30.90],'Jodhpur':[73.02,26.24],'Udaipur':[73.68,24.59],
  'Bhubaneswar':[85.82,20.30],'Raipur':[81.63,21.25],'Dehradun':[78.03,30.32],
  'Shimla':[77.17,31.10],'Shillong':[91.89,25.58],'Panaji':[73.83,15.49],
  'Pondicherry':[79.81,11.94],'Navi Mumbai':[73.02,19.03],'Thane':[72.96,19.22],
  'Srinagar':[74.80,34.08],'Jammu':[74.86,32.73],'Hubli':[75.12,15.36],
  'Aurangabad':[75.34,19.88],'Tiruchirappalli':[78.69,10.79],'Salem':[78.15,11.65],
  'Warangal':[79.59,17.98],'Guntur':[80.44,16.30],'Bhilai':[81.43,21.21],
  'Dhanbad':[86.43,23.80],'Gwalior':[78.17,26.22],'Bareilly':[79.42,28.35],
  'Howrah':[88.31,22.59],'Thrissur':[76.21,10.52],'Madurai':[78.12,9.93],
  'Tirupati':[79.42,13.63],'Secunderabad':[78.50,17.44],'Davanagere':[75.92,14.47],
  'Nagercoil':[77.43,8.18],'Bijapur':[75.72,16.83],'Vijayapura':[75.72,16.83],
  'Ghaziabad':[77.43,28.67],'Nedumkandam':[77.02,9.65],'Perambalur':[78.88,11.23],
  // US cities
  'New York':[-74.00,40.71],'New York City':[-74.00,40.71],'NYC':[-74.00,40.71],
  'Los Angeles':[-118.24,34.05],'San Francisco':[-122.42,37.77],'Chicago':[-87.63,41.88],
  'Boston':[-71.06,42.36],'Washington':[-77.04,38.91],'Washington DC':[-77.04,38.91],
  'Seattle':[-122.33,47.61],'San Diego':[-117.16,32.72],'Dallas':[-96.80,32.78],
  'Houston':[-95.37,29.76],'Austin':[-97.74,30.27],'Denver':[-104.99,39.74],
  'Atlanta':[-84.39,33.75],'Miami':[-80.19,25.77],'Philadelphia':[-75.17,39.95],
  'Phoenix':[-112.07,33.45],'Minneapolis':[-93.27,44.98],'Detroit':[-83.05,42.33],
  'Portland':[-122.68,45.52],'Raleigh':[-78.64,35.78],'Research Triangle':[-78.94,35.90],
  'Durham':[-78.90,35.99],'Chapel Hill':[-79.06,35.91],'Nashville':[-86.78,36.17],
  'Baltimore':[-76.61,39.29],'Cleveland':[-81.69,41.50],'Pittsburgh':[-79.99,40.44],
  'Salt Lake City':[-111.89,40.76],'Las Vegas':[-115.14,36.17],'Indianapolis':[-86.16,39.77],
  'Columbus':[-82.99,39.96],'Charlotte':[-80.84,35.23],'Tampa':[-82.46,27.95],
  'Orlando':[-81.38,28.54],'San Jose':[-121.89,37.34],'Sacramento':[-121.49,38.58],
  'Kansas City':[-94.58,39.10],'St. Louis':[-90.20,38.63],'Richmond':[-77.46,37.54],
  'New Haven':[-72.93,41.31],'Hartford':[-72.68,41.76],'Princeton':[-74.65,40.36],
  // European cities
  'London':[-0.13,51.51],'Manchester':[-2.24,53.48],'Edinburgh':[-3.19,55.95],
  'Birmingham':[-1.90,52.48],'Bristol':[-2.59,51.45],'Leeds':[-1.55,53.80],
  'Paris':[2.35,48.85],'Lyon':[4.83,45.76],'Marseille':[5.37,43.30],'Toulouse':[1.44,43.60],
  'Berlin':[13.40,52.52],'Munich':[11.58,48.14],'Frankfurt':[8.68,50.11],'Hamburg':[9.99,53.55],
  'Amsterdam':[4.90,52.37],'Rotterdam':[4.48,51.92],'Utrecht':[5.12,52.09],
  'Zurich':[8.55,47.37],'Geneva':[6.14,46.20],'Basel':[7.59,47.56],
  'Dublin':[-6.26,53.33],'Cork':[-8.47,51.90],
  'Stockholm':[18.07,59.33],'Copenhagen':[12.57,55.68],'Oslo':[10.75,59.91],
  'Brussels':[4.35,50.85],'Ghent':[3.72,51.05],'Antwerp':[4.40,51.22],
  'Madrid':[-3.70,40.42],'Barcelona':[2.17,41.39],'Milan':[9.19,45.46],'Rome':[12.50,41.90],
  'Warsaw':[21.01,52.23],'Prague':[14.42,50.09],'Vienna':[16.37,48.21],
  'Lisbon':[-9.14,38.72],'Athens':[23.73,37.98],'Helsinki':[24.94,60.17],
};

function getLearnerCoords(learner, index) {
  const cityKey = Object.keys(CITY_COORDS).find(
    k => k.toLowerCase() === (learner.city || '').toLowerCase()
  );
  if (cityKey) {
    const [lng, lat] = CITY_COORDS[cityKey];
    const seed = (index * 7919) % 100;
    return [lng + (seed - 50) * 0.003, lat + ((seed * 3) % 100 - 50) * 0.003];
  }
  const stateKey = Object.keys(STATE_CENTROIDS).find(
    k => k.toLowerCase() === (learner.state || '').toLowerCase()
  );
  if (stateKey) {
    const [lng, lat] = STATE_CENTROIDS[stateKey];
    const seed = (index * 6271) % 100;
    return [lng + (seed - 50) * 0.8, lat + ((seed * 3) % 100 - 50) * 0.5];
  }
  return null;
}

function LearnerPopup({ learner, onClose }) {

  return (
    <div className="map-popup-overlay" onClick={onClose}>
      <div className="map-popup" onClick={e => e.stopPropagation()}>
        <button className="map-popup-close" onClick={onClose}>×</button>
        <div className="map-popup-avatar" style={{ background: learner.avatar_color || '#00A896' }}>
          {learner.name.charAt(0).toUpperCase()}
        </div>
        <div className="map-popup-name">{learner.name}</div>
        {learner.career_title && (
          <div className="map-popup-career">{learner.career_icon} {learner.career_title}</div>
        )}
        {(learner.city || learner.state) && (
          <div className="map-popup-location">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {[learner.city, learner.state].filter(Boolean).join(', ')}
          </div>
        )}
        <div className="map-popup-links">
          {learner.linkedin_url && (
            <a href={learner.linkedin_url} target="_blank" rel="noreferrer" className="map-popup-link map-popup-link-li">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
              LinkedIn
            </a>
          )}
          {learner.github_url && (
            <a href={learner.github_url} target="_blank" rel="noreferrer" className="map-popup-link map-popup-link-gh">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              GitHub
            </a>
          )}
          {!learner.linkedin_url && !learner.github_url && (
            <span className="map-popup-no-links">No links added yet</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Degree Programs ────────────────────────────────────────────────────────

function DegreeProgramsView() {
  const imgs = useImgs();
  const programs = [
    {
      id: 'msc',
      degree: 'M.Sc',
      title: 'M.Sc Biotechnology',
      specialization: 'Specializations in Genomics, AI/ML & Clinical Ops',
      duration: '2 Years Full-Time',
      format: 'Campus + Industry Immersion',
      intake: 'August 2026',
      deadline: 'Round 1 closes April 30, 2026',
      description: "India's first industry-immersive M.Sc built with CROs and GCCs. Year 1 is campus-based academics; Year 2 is fully work-embedded with real capstone projects in drug discovery, variant-calling pipelines, and clinical datasets.",
      highlights: ['85% placed within 6 months', '50+ life sciences placement partners', '14-day international immersion in France', 'Industry co-designed modules'],
      stat: '85% placed',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=320&fit=crop&q=80',
      color: '#0d9e8c',
      tag: 'Admissions Open',
      url: 'https://bversity.io/msc-biotech',
    },
    {
      id: 'bsc',
      degree: 'B.Sc (Hons)',
      title: 'B.Sc (Hons) Bioengineering',
      specialization: 'Tracks: GenAI & ML for Life Sciences · Bioinformatics & Genomics',
      duration: '4 Years Full-Time',
      format: 'Campus + 1 Year Industry Residency',
      intake: 'August 2026',
      deadline: 'Applications close June 30, 2026',
      description: "India's first B.Sc built for the era of AI-powered biology. 67% of the degree is hands-on through labs, projects, and industry work. Choose between a Research track (MSc/PhD) or Industry track (direct placement) in your final semester.",
      highlights: ['67% hands-on labs & projects', '4 capstone project options', '14-day international immersion in France', 'Curriculum updated every 6 months'],
      stat: '67% hands-on',
      image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=320&fit=crop&q=80',
      color: '#4338CA',
      tag: 'Admissions Open',
      url: 'https://bversity.io/bsc-biotech',
    },
  ];

  return (
    <div className="deg-view">
      <div className="deg-hero">
        <div className="deg-hero-tag">Degree Programs by Bversity</div>
        <h1 className="deg-hero-title">Earn a degree from the world's first AI-Native Biotech University</h1>
        <p className="deg-hero-sub">Fully online, career-mapped, and powered by Bversity's adaptive learning intelligence. Recognised credentials for the next generation of life sciences professionals.</p>
      </div>

      <div className="deg-cards">
        {programs.map(p => (
          <div key={p.id} className="deg-card" style={{ '--deg-color': p.color }}>
            <div className="deg-card-banner">
              <img src={imgs.degree(p.id) || p.image} alt={p.title} className="deg-card-banner-img" />
              <div className="deg-card-banner-overlay" style={{ background: `linear-gradient(to top, ${p.color}ee 0%, ${p.color}88 40%, transparent 100%)` }} />
              <div className="deg-card-banner-content">
                <div className="deg-card-tag">{p.tag}</div>
                <div className="deg-badge">{p.degree}</div>
              </div>
            </div>
            <div className="deg-card-body">
              <h2 className="deg-card-title">{p.title}</h2>
              <div className="deg-card-spec">{p.specialization}</div>
              <p className="deg-card-desc">{p.description}</p>
              <div className="deg-card-meta">
                <div className="deg-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {p.duration}
                </div>
                <div className="deg-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Intake: {p.intake}
                </div>
                <div className="deg-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                  {p.format}
                </div>
              </div>
              <div className="deg-highlights">
                {p.highlights.map(h => (
                  <div key={h} className="deg-highlight-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {h}
                  </div>
                ))}
              </div>
              <div className="deg-card-footer">
                <div className="deg-deadline">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {p.deadline}
                </div>
                <a href={p.url} target="_blank" rel="noreferrer" className="deg-apply-btn" style={{ background: p.color }}>
                  Learn more
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityMapView({ student, onAddLocation }) {
  const [learners, setLearners]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [hovered, setHovered]     = useState(null); // { learner, x, y }
  const mapRef = useRef(null);

  useEffect(() => {
    fetch('/api/community/map')
      .then(r => r.json())
      .then(data => { setLearners(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cityCount   = new Set(learners.map(l => l.city).filter(Boolean)).size;
  const myDotIndex  = learners.findIndex(l => l.student_id === student.id);
  const iAmOnMap    = myDotIndex !== -1;

  const HIGHLIGHT_COUNTRIES = new Set(['356','840','826','276','250','528','756','372','752','208','578','056','724','380','620','300','246','040','616','203','705','703','642','348','191','233','428','440','233']);


  const markersWithCoords = learners.map((l, i) => ({ ...l, coords: getLearnerCoords(l, i), index: i }))
    .filter(l => l.coords !== null);

  function handleMarkerEnter(e, learner) {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHovered({ learner, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div className="community-view">
      <div className="community-header">
        <div className="community-header-left">
          <h1 className="community-title">Bversity Community Map</h1>
          <p className="community-subtitle">
            {learners.length === 0
              ? 'No learners on the map yet. Be the very first! Add your city in your profile.'
              : learners.length === 1 && iAmOnMap
              ? "You're the first learner on the map. Share Bversity and get more people on here!"
              : `${learners.length} learner${learners.length !== 1 ? 's' : ''} · ${cityCount} cit${cityCount !== 1 ? 'ies' : 'y'} · US, Europe & India`}
          </p>
        </div>
        {!iAmOnMap && (
          <button className="community-add-btn" onClick={onAddLocation}>
            + Add my location
          </button>
        )}
      </div>

      <div className="community-map-wrap">
        <div className="community-map-glass" ref={mapRef} onMouseLeave={() => setHovered(null)}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [20, 30], scale: 145 }}
            width={900}
            height={500}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            <Geographies geography={WORLD_TOPO_URL}>
              {({ geographies }) => geographies.map(geo => {
                const isHighlight = HIGHLIGHT_COUNTRIES.has(geo.id);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHighlight ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.02)'}
                    stroke={isHighlight ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.04)'}
                    strokeWidth={isHighlight ? 0.6 : 0.3}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: isHighlight ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)', cursor: 'default' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })}
            </Geographies>

            {markersWithCoords.map((learner) => {
              const isMe      = learner.student_id === student.id;
              const dotColor  = learner.avatar_color || '#16c1ad';
              const isHovered = hovered?.learner?.student_id === learner.student_id;
              return (
                <Marker
                  key={learner.student_id}
                  coordinates={learner.coords}
                  onClick={() => setSelected(learner)}
                  onMouseEnter={e => handleMarkerEnter(e, learner)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <circle
                    r={isHovered ? (isMe ? 9 : 7) : (isMe ? 7 : 5)}
                    fill={dotColor}
                    stroke={isMe ? '#fff' : 'rgba(255,255,255,0.5)'}
                    strokeWidth={isMe ? 1.5 : 1}
                    className={isMe ? 'map-dot-me' : 'map-dot'}
                    style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                  />
                  {isMe && (
                    <circle
                      r={11}
                      fill="none"
                      stroke={dotColor}
                      strokeWidth={1}
                      opacity={0.4}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                </Marker>
              );
            })}
          </ComposableMap>

          {/* Hover tooltip */}
          {hovered && (
            <div
              className="map-hover-tip"
              style={{
                left: hovered.x + 14,
                top:  hovered.y - 10,
              }}
              onMouseEnter={() => {}}
            >
              <div className="map-hover-avatar" style={{ background: hovered.learner.avatar_color || '#16c1ad' }}>
                {hovered.learner.name.charAt(0).toUpperCase()}
              </div>
              <div className="map-hover-info">
                <div className="map-hover-name">{hovered.learner.name}</div>
                {hovered.learner.bio && (
                  <div className="map-hover-bio">{hovered.learner.bio}</div>
                )}
                {hovered.learner.career_title && (
                  <div className="map-hover-career">{hovered.learner.career_icon} {hovered.learner.career_title}</div>
                )}
                {(hovered.learner.city || hovered.learner.state) && (
                  <div className="map-hover-loc">{[hovered.learner.city, hovered.learner.state].filter(Boolean).join(', ')}</div>
                )}
                {hovered.learner.linkedin_url && (
                  <a className="map-hover-li" href={hovered.learner.linkedin_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                    Connect on LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}

          {learners.length === 0 && !loading && (
            <div className="map-empty-overlay">
              <div className="map-empty-badge"><IcoMap /></div>
              <p className="map-empty-title">You could be the first dot on this map</p>
              <p className="map-empty-sub">Add your city in your profile. It takes 10 seconds.</p>
            </div>
          )}
        </div>

        <div className="community-legend">
          <span className="legend-item"><span className="legend-dot legend-dot-learner" /> Learner</span>
          <span className="legend-item"><span className="legend-dot legend-dot-me" /> You</span>
          <span className="legend-item legend-first">Hover to preview · click to connect</span>
        </div>
      </div>

      {selected && <LearnerPopup learner={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Career Change Interstitial ─────────────────────────────────────────────

const CHANGE_REASONS = [
  { id: 'explore',    label: 'Exploring other options',             sub: 'I\'m curious what else is out there' },
  { id: 'too_hard',   label: 'Current path feels too difficult',    sub: 'I\'m struggling and need a change' },
  { id: 'pivot',      label: 'I\'ve learned more and want to pivot', sub: 'I have a clearer picture of where I want to go' },
  { id: 'life',       label: 'Life or career circumstances changed', sub: 'External factors are driving this' },
  { id: 'other',      label: 'Other reason',                        sub: 'Something else is going on' },
];

function CareerChangeView({ student, careerProfile, onProceed, onTalkToTutor, onCancel }) {
  const [reason, setReason]   = useState('');
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);

  const career = careerProfile?.career;
  const clusterColor = career ? (CLUSTER_COLORS[career.cluster] || '#00A896') : '#00A896';

  async function handleProceed() {
    if (!reason) return;
    setSaving(true);
    try {
      await fetch(`/api/career-change/${student.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_career_id: careerProfile?.career_id || null,
          to_career_id: null,
          reason,
          notes: notes.trim() || null,
        }),
      });
      onProceed();
    } catch { setSaving(false); }
  }

  return (
    <div className="career-change-screen">
      <div className="career-change-card">
        <button className="career-change-cancel-link" onClick={onCancel}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Stay on my current path
        </button>

        <div className="career-change-current" style={{ borderColor: clusterColor + '44', background: clusterColor + '0d' }}>
          <span className="career-change-current-label">Currently on</span>
          <span className="career-change-current-name" style={{ color: clusterColor }}>
            {career ? career.title : 'your current path'}
          </span>
        </div>

        <h2 className="career-change-heading">Before you change paths…</h2>
        <p className="career-change-sub">Help us understand why you want to switch. This helps your experts and helps us improve Bversity.</p>

        <div className="career-change-reasons">
          {CHANGE_REASONS.map(r => (
            <button
              key={r.id}
              className={`career-change-reason ${reason === r.id ? 'selected' : ''}`}
              style={reason === r.id ? { borderColor: clusterColor, background: clusterColor + '14' } : {}}
              onClick={() => setReason(r.id)}
            >
              <span className="ccr-radio" style={reason === r.id ? { borderColor: clusterColor, background: clusterColor } : {}}>
                {reason === r.id && <span className="ccr-radio-dot" />}
              </span>
              <span className="ccr-text">
                <span className="ccr-label">{r.label}</span>
                <span className="ccr-sub">{r.sub}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="career-change-notes-wrap">
          <label className="career-change-notes-label">Anything else you'd like to share? <span className="ccr-optional">(optional)</span></label>
          <textarea
            className="career-change-notes"
            placeholder="e.g. I realised I enjoy the business side more than the lab..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="career-change-actions">
          <button
            className="career-change-proceed-btn"
            disabled={!reason || saving}
            onClick={handleProceed}
            style={reason ? { background: clusterColor } : {}}
          >
            {saving ? 'Saving...' : 'Continue to change path →'}
          </button>
          <button className="career-change-tutor-btn" onClick={onTalkToTutor}>
            Talk to my expert first
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Capstone View ──────────────────────────────────────────────────────────

function AiAssessmentPanel({ submission, subject, capstone }) {
  if (!submission?.ai_feedback) return null;
  let parsed = null;
  try { parsed = typeof submission.ai_feedback === 'string' ? JSON.parse(submission.ai_feedback) : submission.ai_feedback; } catch {}
  if (!parsed) return null;

  return (
    <div className="ai-assessment-panel" style={{ borderColor: subject.color + '44' }}>
      <div className="ai-assessment-header">
        <span className="ai-assessment-badge">AI Preliminary Assessment</span>
        <span className="ai-assessment-score" style={{ color: subject.color }}>
          {submission.ai_score}<span className="ai-assessment-denom">/{capstone.total_marks}</span>
        </span>
      </div>
      <p className="ai-assessment-note">Your instructor will review and set the final score. This is an automated preliminary reading.</p>
      {parsed.criterion_scores?.length > 0 && (
        <div className="ai-criteria-list">
          {parsed.criterion_scores.map((c, i) => (
            <div key={i} className="ai-criterion-row">
              <div className="ai-criterion-header">
                <span className="ai-criterion-name">{c.criterion}</span>
                <span className="ai-criterion-marks" style={{ color: subject.color }}>{c.marks_awarded}/{c.max_marks}</span>
              </div>
              {c.comments && <div className="ai-criterion-comments">{c.comments}</div>}
            </div>
          ))}
        </div>
      )}
      {parsed.strengths && (
        <div className="ai-feedback-section">
          <div className="ai-feedback-label">Strengths</div>
          <div className="ai-feedback-text">{parsed.strengths}</div>
        </div>
      )}
      {parsed.areas_for_improvement && (
        <div className="ai-feedback-section">
          <div className="ai-feedback-label">Areas for improvement</div>
          <div className="ai-feedback-text">{parsed.areas_for_improvement}</div>
        </div>
      )}
      {parsed.overall_feedback && (
        <div className="ai-feedback-section">
          <div className="ai-feedback-label">Overall</div>
          <div className="ai-feedback-text">{parsed.overall_feedback}</div>
        </div>
      )}
    </div>
  );
}

function CapstoneView({ subject, student, onBack }) {
  const [capstone, setCapstone] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [coveredCount, setCoveredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [capRes, subRes, progRes] = await Promise.all([
          fetch(`/api/capstone/${subject.id}`),
          fetch(`/api/capstone/${subject.id}/submission/${student.id}`),
          fetch(`/api/progress/${student.id}/${subject.id}`),
        ]);
        const capData  = await capRes.json();
        const subData  = await subRes.json();
        const progData = await progRes.json();
        setCapstone(capData);
        setSubmission(subData.submitted ? subData : null);
        setCoveredCount(progData.covered_count);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [subject.id, student.id]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file || !capstone) return;
    setUploading(true); setUploadError(''); setUploadSuccess(false);
    const form = new FormData();
    form.append('student_id', student.id);
    form.append('file', file);
    try {
      const res = await fetch(`/api/capstone/${subject.id}/submit`, { method: 'POST', body: form });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Upload failed');
      }
      const data = await res.json();
      setSubmission({
        submitted: true,
        id: data.submission_id,
        filename: data.filename,
        submitted_at: new Date().toISOString(),
        score: null,
        feedback: null,
        marked_at: null,
      });
      setUploadSuccess(true);
    } catch (err) { setUploadError(err.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  if (loading) return <div className="capstone-loading">Loading capstone project...</div>;
  if (!capstone) return null;

  const unlocked = coveredCount >= capstone.unlock_threshold;
  const needed   = capstone.unlock_threshold - coveredCount;

  return (
    <div className="capstone-view">
      <div className="capstone-nav">
        <button className="chat-back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="capstone-nav-meta">
          <span className="capstone-subject-pill" style={{ background: subject.color + '18', color: subject.color, border: `1px solid ${subject.color}44` }}>
            {subject.name}
          </span>
        </div>
      </div>

      <div className="capstone-hero" style={{ borderColor: subject.color + '44' }}>
        <div className="capstone-hero-label" style={{ color: subject.color }}>Capstone Project</div>
        <h1 className="capstone-title">{capstone.title}</h1>
      </div>

      {!unlocked && (
        <div className="capstone-locked-banner">
          <span className="capstone-lock-icon"><IcoLock /></span>
          <div>
            <strong>Capstone is locked.</strong> Cover {needed} more concept{needed !== 1 ? 's' : ''} in {subject.name} to unlock your capstone project. Keep chatting with {subject.tutor.split(' ')[1] || subject.tutor}!
          </div>
        </div>
      )}

      <div className="capstone-body">
        <div className="capstone-section">
          <div className="capstone-section-label">Problem Statement</div>
          <p className="capstone-section-text">{capstone.problem_statement}</p>
        </div>

        <div className="capstone-section">
          <div className="capstone-section-label">Instructions</div>
          <ol className="capstone-instructions">
            {(capstone.instructions || '').split('\n').filter(l => l.trim()).map((step, i) => (
              <li key={i}>{step.replace(/^\d+\.\s*/, '')}</li>
            ))}
          </ol>
        </div>

        <div className="capstone-section">
          <div className="capstone-section-label">Deliverable</div>
          <p className="capstone-section-text">{capstone.deliverable}</p>
        </div>

        <div className="capstone-section">
          <div className="capstone-section-label">Marking Rubric</div>
          <table className="capstone-rubric-table">
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              {capstone.rubric.map((row, i) => (
                <tr key={i}>
                  <td>{row.criterion}</td>
                  <td className="rubric-marks">{row.marks}</td>
                </tr>
              ))}
              <tr className="rubric-total-row">
                <td>Total</td>
                <td className="rubric-marks">{capstone.total_marks}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {unlocked && (
          <div className="capstone-submission-section">
            {submission ? (
              <div className="capstone-submitted-card" style={{ borderColor: subject.color + '44' }}>
                {submission.score !== null ? (
                  <>
                    <div className="capstone-score-display">
                      <span className="capstone-score-number" style={{ color: subject.color }}>{submission.score}</span>
                      <span className="capstone-score-denom">/{capstone.total_marks}</span>
                    </div>
                    <div className="capstone-marked-label">Marked by faculty</div>
                    {submission.feedback && (
                      <div className="capstone-feedback">
                        <div className="capstone-feedback-label">Faculty feedback</div>
                        <p>{submission.feedback}</p>
                      </div>
                    )}
                  </>
                ) : submission.ai_score !== null ? (
                  <>
                    <div className="capstone-pending-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><path d="M7 11V9a5 5 0 0110 0v2"/><line x1="8" y1="15" x2="8" y2="17"/><line x1="12" y1="15" x2="12" y2="17"/><line x1="16" y1="15" x2="16" y2="17"/></svg></div>
                    <div className="capstone-pending-title">AI assessment complete</div>
                    <div className="capstone-pending-file">{submission.filename}</div>
                    <div className="capstone-pending-sub">Your instructor will review and confirm the final score.</div>
                    <AiAssessmentPanel submission={submission} subject={subject} capstone={capstone} />
                  </>
                ) : (
                  <>
                    <div className="capstone-pending-icon"><IcoMail /></div>
                    <div className="capstone-pending-title">Submission received</div>
                    <div className="capstone-pending-file">{submission.filename}</div>
                    <div className="capstone-pending-sub">AI grading in progress. Preliminary feedback will appear shortly. Your instructor will confirm the final score.</div>
                  </>
                )}
                <div className="capstone-resubmit-hint">
                  <label className="upload-btn" style={{ borderColor: subject.color, color: subject.color, fontSize: '0.78rem', padding: '4px 12px' }}>
                    {uploading ? 'Uploading…' : 'Resubmit'}
                    <input ref={fileRef} type="file" accept={capstone.accepted_formats.map(f => `.${f}`).join(',')} onChange={handleUpload} disabled={uploading} hidden />
                  </label>
                </div>
              </div>
            ) : (
              <div className="capstone-upload-card">
                <div className="capstone-upload-title">Ready to submit?</div>
                <div className="capstone-upload-hint">
                  Accepted formats: <strong>{capstone.accepted_formats.join(', ').toUpperCase()}</strong> · Max size: <strong>{capstone.max_size_mb}MB</strong>
                </div>
                {uploadSuccess && <div className="capstone-upload-success">Submitted! Your work is now with the faculty.</div>}
                {uploadError && <p className="upload-error">{uploadError}</p>}
                <label className="capstone-upload-btn" style={{ background: subject.color }}>
                  {uploading ? 'Uploading…' : 'Upload your submission'}
                  <input ref={fileRef} type="file" accept={capstone.accepted_formats.map(f => `.${f}`).join(',')} onChange={handleUpload} disabled={uploading} hidden />
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Feedback Modal ──────────────────────────────────────────────────────────

const FEEDBACK_Q1_OPTIONS = [
  'Preparing for a job or internship',
  'Supplementing my college coursework',
  'Exploring biotech as a career',
  'Upskilling while working',
  'Just curious / exploring',
];
const FEEDBACK_Q2_OPTIONS = [
  'The AI tutor explaining concepts',
  'The structured learning path',
  'The quizzes testing my knowledge',
  'The career roadmap',
  'The certificate at the end',
];
const FEEDBACK_Q3_OPTIONS = [
  'Much better than what I\'ve used before',
  'About the same',
  'Worse in some ways',
  'This is my first structured learning tool',
];

function FreeTrialModal({ onClose }) {
  return (
    <div className="freetrial-overlay">
      <div className="freetrial-modal">
        <div className="freetrial-badge">Free Trial</div>
        <h2 className="freetrial-title">You're on a 7-day free trial</h2>
        <p className="freetrial-body">
          We've given you full access to explore Bversity  -  every {ACTIVE_REGION === 'us' ? 'certification, every AI tutor, every exam-prep session' : 'subject, every AI tutor, every concept session'}.
          This trial runs for <strong>7–10 days</strong>, and we're using it to understand how the platform is being used
          and what's adding the most value.
        </p>
        <p className="freetrial-body">
          If Bversity is helping you grow and you'd like to continue beyond the trial,
          reach out to Sudharsan for paid access at <strong>{ACTIVE_REGION === 'us' ? '$29/month' : '₹299/month'}</strong>.
        </p>
        <a className="freetrial-contact-link" href="mailto:sudharsan@bversity.io?subject=Paid Access Request">
          sudharsan@bversity.io
        </a>
        <button className="freetrial-cta" onClick={onClose}>
          Continue using the platform →
        </button>
      </div>
    </div>
  );
}

function FeedbackModal({ studentId, onClose }) {
  const [q1, setQ1]           = useState('');
  const [q2, setQ2]           = useState('');
  const [q3, setQ3]           = useState('');
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);

  const canSubmit = q1 && q2 && q3 && rating > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, q1, q2, q3, rating, comment }),
      });
    } catch {}
    setSaving(false);
    setDone(true);
    setTimeout(onClose, 2000);
  }

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal">
        <button type="button" className="feedback-close-btn" onClick={onClose} aria-label="Close">×</button>
        {done ? (
          <div className="feedback-modal-done">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <p>Thank you for your feedback!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="feedback-modal-title">Quick feedback</h3>
            <p className="feedback-modal-sub">You've been learning for 30 minutes. Takes less than a minute.</p>

            <div className="feedback-question">
              <p className="feedback-q-label">Why are you using this platform?</p>
              <div className="feedback-options">
                {FEEDBACK_Q1_OPTIONS.map(opt => (
                  <button key={opt} type="button"
                    className={`feedback-option ${q1 === opt ? 'selected' : ''}`}
                    onClick={() => setQ1(opt)}>{opt}</button>
                ))}
              </div>
            </div>

            <div className="feedback-question">
              <p className="feedback-q-label">What's been most valuable?</p>
              <div className="feedback-options">
                {FEEDBACK_Q2_OPTIONS.map(opt => (
                  <button key={opt} type="button"
                    className={`feedback-option ${q2 === opt ? 'selected' : ''}`}
                    onClick={() => setQ2(opt)}>{opt}</button>
                ))}
              </div>
            </div>

            <div className="feedback-question">
              <p className="feedback-q-label">How does this compare to other learning resources?</p>
              <div className="feedback-options">
                {FEEDBACK_Q3_OPTIONS.map(opt => (
                  <button key={opt} type="button"
                    className={`feedback-option ${q3 === opt ? 'selected' : ''}`}
                    onClick={() => setQ3(opt)}>{opt}</button>
                ))}
              </div>
            </div>

            <div className="feedback-question">
              <p className="feedback-q-label">Overall rating</p>
              <div className="feedback-stars">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button"
                    className={`feedback-star ${n <= (hovered || rating) ? 'active' : ''}`}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(n)}>★</button>
                ))}
              </div>
            </div>

            <div className="feedback-question">
              <p className="feedback-q-label">One thing you'd change <span className="feedback-optional">(optional)</span></p>
              <textarea
                className="feedback-textarea"
                placeholder="Your answer…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
              />
            </div>

            <div className="feedback-modal-actions">
              <button type="submit" className="feedback-submit-btn" disabled={!canSubmit || saving}>
                {saving ? 'Sending…' : 'Submit feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Admin View ─────────────────────────────────────────────────────────────

function AdminView({ onBack }) {
  const [adminKey, setAdminKey]       = useState(() => localStorage.getItem('bversity_admin_key') || '');
  const [keyInput, setKeyInput]       = useState('');
  const [showKey, setShowKey]         = useState(false);
  const [tab, setTab]                 = useState('overview');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetail, setStudentDetail]         = useState(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [studentDetailTab, setStudentDetailTab]   = useState('timeline');
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents]       = useState([]);
  const [overview, setOverview]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [marking, setMarking]         = useState(null);
  const [markForm, setMarkForm]       = useState({ score: '', feedback: '' });
  const [markError, setMarkError]     = useState('');
  const [markSuccess, setMarkSuccess] = useState(null);
  const [approvedEmails, setApprovedEmails] = useState([]);
  const [newEmail, setNewEmail]       = useState('');
  const [emailError, setEmailError]   = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [videoSubject, setVideoSubject]   = useState('');
  const [videoConcepts, setVideoConcepts] = useState([]);
  const [videoMap, setVideoMap]           = useState({});
  const [videoEdit, setVideoEdit]         = useState(null);
  const [videoForm, setVideoForm]         = useState({ drive_url: '', title: '' });
  const [videoSaving, setVideoSaving]     = useState(false);
  const [videoError, setVideoError]       = useState('');
  const [conceptNotesMap, setConceptNotesMap] = useState({});
  const [conceptNotesSaving, setConceptNotesSaving] = useState(null);
  const [resSubject, setResSubject]       = useState('');
  const [resConcepts, setResConcepts]     = useState([]);
  const [resMap, setResMap]               = useState({});
  const [resExpandedConcept, setResExpandedConcept] = useState(null);
  const [resForm, setResForm]             = useState({ url: '', title: '', resource_type: 'article', description: '' });
  const [resSaving, setResSaving]         = useState(false);
  const [resError, setResError]           = useState('');
  const [emailPreview, setEmailPreview]               = useState(null);
  const [emailPreviewLoading, setEmailPreviewLoading] = useState(false);
  const [emailSending, setEmailSending]               = useState(null);
  const [emailSentMsg, setEmailSentMsg]               = useState('');
  const [analyticsSubjects, setAnalyticsSubjects]     = useState(null);
  const [analyticsQuizzes, setAnalyticsQuizzes]       = useState(null);
  const [analyticsLoading, setAnalyticsLoading]       = useState(false);
  const [analyticsHeatSubject, setAnalyticsHeatSubject] = useState('');
  const [analyticsHeatmap, setAnalyticsHeatmap]       = useState([]);
  const [feedbackList, setFeedbackList]               = useState([]);
  const [cohortData, setCohortData]                   = useState(null);
  const [waitlistRequests, setWaitlistRequests]       = useState([]);
  const [waitlistLoading, setWaitlistLoading]         = useState(false);
  const [waitlistAction, setWaitlistAction]           = useState(null);
  const [metrics, setMetrics]                         = useState(null);
  const [metricsLoading, setMetricsLoading]           = useState(false);
  const [weeklySending, setWeeklySending]             = useState(false);
  const [weeklyResult, setWeeklyResult]               = useState(null);
  const [reminderSending, setReminderSending]         = useState(false);
  const [reminderResult, setReminderResult]           = useState(null);
  const [peakHours, setPeakHours]                     = useState([]);
  const [health, setHealth]                           = useState(null);
  const [chatLogs, setChatLogs]                       = useState([]);
  const [chatLogsLoading, setChatLogsLoading]         = useState(false);
  const [chatThread, setChatThread]                   = useState(null);
  const [chatThreadLoading, setChatThreadLoading]     = useState(false);
  const [chatFilter, setChatFilter]                   = useState('');
  const [studyPlans, setStudyPlans]                   = useState([]);
  const [studyPlansLoading, setStudyPlansLoading]     = useState(false);
  const [expandedPlan, setExpandedPlan]               = useState(null);
  const [announceForm, setAnnounceForm]               = useState({ subject: '', message: '', target: 'all' });
  const [announcePreview, setAnnouncePreview]         = useState(null);
  const [announceSending, setAnnounceSending]         = useState(false);
  const [announceSent, setAnnounceSent]               = useState('');
  const [imageConfig, setImageConfig]                 = useState(null);
  const [imageEdits, setImageEdits]                   = useState({});
  const [imageSaving, setImageSaving]                 = useState({});
  const [imageSaved, setImageSaved]                   = useState({});
  const [systemHealth, setSystemHealth]               = useState(null);
  const [systemHealthLoading, setSystemHealthLoading] = useState(false);
  const [stFilter, setStFilter]                       = useState('all');
  const [stSearch, setStSearch]                       = useState('');

  async function loadAdminData(key) {
    const headers = { 'X-Admin-Key': key };
    const [subsRes, overviewRes, studentsRes, emailsRes] = await Promise.all([
      fetch('/api/admin/submissions',    { headers }),
      fetch('/api/admin/overview',       { headers }),
      fetch('/api/admin/students',       { headers }),
      fetch('/api/admin/approved-emails',{ headers }),
    ]);
    if (!subsRes.ok) throw new Error('Invalid admin key');
    setSubmissions(await subsRes.json());
    if (overviewRes.ok)  setOverview(await overviewRes.json());
    if (studentsRes.ok)  setStudents(await studentsRes.json());
    if (emailsRes.ok)    setApprovedEmails(await emailsRes.json());
    fetch('/api/admin/health', { headers }).then(r => r.ok ? r.json().then(setHealth) : null).catch(() => {});
  }

  useEffect(() => {
    const saved = localStorage.getItem('bversity_admin_key');
    if (saved) loadAdminData(saved).catch(() => { localStorage.removeItem('bversity_admin_key'); setAdminKey(''); });
  }, []);

  async function handleAuth(e) {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setLoading(true); setError('');
    try {
      const key = keyInput.trim();
      await loadAdminData(key);
      localStorage.setItem('bversity_admin_key', key);
      setAdminKey(key);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleAddEmail(e) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailLoading(true); setEmailError('');
    try {
      const res = await fetch('/api/admin/approved-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setEmailError(data.detail || 'Error adding email'); return; }
      setApprovedEmails(prev => [data, ...prev]);
      setNewEmail('');
    } catch { setEmailError('Connection error.'); }
    finally { setEmailLoading(false); }
  }

  async function handleRemoveEmail(email) {
    try {
      await fetch(`/api/admin/approved-emails/${encodeURIComponent(email)}`, {
        method: 'DELETE', headers: { 'X-Admin-Key': adminKey },
      });
      setApprovedEmails(prev => prev.filter(e => e.email !== email));
    } catch {}
  }

  async function loadVideoMap(subjectId) {
    try {
      const res = await fetch(`/api/concept-videos/${subjectId}`);
      setVideoMap(await res.json());
    } catch {}
  }

  async function handleVideoSubjectChange(subjectId) {
    setVideoSubject(subjectId);
    setVideoEdit(null);
    setVideoError('');
    if (!subjectId) { setVideoMap({}); setVideoConcepts([]); setConceptNotesMap({}); return; }
    const [conceptsRes] = await Promise.all([
      fetch(`/api/curriculum/${subjectId}`),
      loadVideoMap(subjectId),
    ]);
    setVideoConcepts(await conceptsRes.json());
    try {
      const nr = await fetch(`/api/admin/concept-notes/${subjectId}`, { headers: { 'X-Admin-Key': adminKey } });
      setConceptNotesMap(await nr.json());
    } catch {}
  }

  async function saveConceptNote(conceptId, notes) {
    setConceptNotesSaving(conceptId);
    try {
      await fetch(`/api/admin/concept-notes/${videoSubject}/${conceptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ notes }),
      });
      setConceptNotesMap(prev => ({ ...prev, [conceptId]: notes }));
    } catch {}
    finally { setConceptNotesSaving(null); }
  }

  async function handleVideoSave(conceptId) {
    if (!videoForm.drive_url.trim()) { setVideoError('Paste a Google Drive link.'); return; }
    setVideoSaving(true); setVideoError('');
    try {
      const res = await fetch(`/api/admin/concept-videos/${videoSubject}/${conceptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ drive_url: videoForm.drive_url.trim(), title: videoForm.title.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      await loadVideoMap(videoSubject);
      setVideoEdit(null);
    } catch { setVideoError('Could not save. Check the URL and try again.'); }
    finally { setVideoSaving(false); }
  }

  async function handleVideoDelete(conceptId) {
    try {
      await fetch(`/api/admin/concept-videos/${videoSubject}/${conceptId}`, {
        method: 'DELETE', headers: { 'X-Admin-Key': adminKey },
      });
      await loadVideoMap(videoSubject);
      if (videoEdit === conceptId) setVideoEdit(null);
    } catch {}
  }

  async function loadResMap(subjectId) {
    try { const r = await fetch(`/api/resources/${subjectId}`); setResMap(await r.json()); } catch {}
  }
  async function handleResSubjectChange(subjectId) {
    setResSubject(subjectId); setResExpandedConcept(null); setResError('');
    if (!subjectId) { setResMap({}); setResConcepts([]); return; }
    const [cr] = await Promise.all([fetch(`/api/curriculum/${subjectId}`), loadResMap(subjectId)]);
    setResConcepts(await cr.json());
  }
  async function handleResAdd(conceptId) {
    if (!resForm.url.trim() || !resForm.title.trim()) { setResError('URL and title are required.'); return; }
    setResSaving(true); setResError('');
    try {
      const r = await fetch(`/api/admin/resources/${resSubject}/${conceptId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify(resForm),
      });
      if (!r.ok) throw new Error();
      await loadResMap(resSubject);
      setResForm({ url: '', title: '', resource_type: 'article', description: '' });
    } catch { setResError('Could not save.'); }
    finally { setResSaving(false); }
  }
  async function handleResDelete(resourceId) {
    try {
      await fetch(`/api/admin/resources/${resourceId}`, { method: 'DELETE', headers: { 'X-Admin-Key': adminKey } });
      await loadResMap(resSubject);
    } catch {}
  }

  async function loadAnalytics() {
    if (analyticsSubjects) return;
    setAnalyticsLoading(true);
    try {
      const headers = { 'X-Admin-Key': adminKey };
      const [subRes, quizRes] = await Promise.all([
        fetch('/api/admin/analytics/subjects', { headers }),
        fetch('/api/admin/analytics/quizzes',  { headers }),
      ]);
      if (subRes.ok)  setAnalyticsSubjects(await subRes.json());
      if (quizRes.ok) setAnalyticsQuizzes(await quizRes.json());
    } catch {}
    finally { setAnalyticsLoading(false); }
  }

  async function loadEmailPreview() {
    if (emailPreview) return;
    setEmailPreviewLoading(true);
    try {
      const r = await fetch('/api/admin/email-preview', { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setEmailPreview(await r.json());
    } catch {}
    finally { setEmailPreviewLoading(false); }
  }

  async function sendEmailCampaign(type) {
    setEmailSending(type); setEmailSentMsg('');
    try {
      const endpoint = type === 'nudge' ? '/api/admin/send-nudges' : '/api/admin/send-weekly-digest';
      const r = await fetch(endpoint, { method: 'POST', headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) {
        const d = await r.json();
        setEmailSentMsg(`${d.queued} email${d.queued !== 1 ? 's' : ''} queued successfully.`);
        setEmailPreview(null); // reset so it re-fetches on next open
      }
    } catch { setEmailSentMsg('Error sending. Please try again.'); }
    finally { setEmailSending(null); }
  }

  async function loadHeatmap(subjectId) {
    setAnalyticsHeatSubject(subjectId);
    if (!subjectId) { setAnalyticsHeatmap([]); return; }
    try {
      const r = await fetch(`/api/admin/analytics/heatmap/${subjectId}`, { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setAnalyticsHeatmap(await r.json());
    } catch {}
  }

  async function loadCohort() {
    try {
      const r = await fetch('/api/admin/analytics/cohort', { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setCohortData(await r.json());
    } catch {}
  }

  async function loadFeedback() {
    try {
      const r = await fetch('/api/admin/feedback', { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setFeedbackList(await r.json());
    } catch {}
  }

  async function loadWaitlist() {
    setWaitlistLoading(true);
    try {
      const r = await fetch('/api/admin/access-requests', { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setWaitlistRequests(await r.json());
    } catch {}
    finally { setWaitlistLoading(false); }
  }

  async function loadMetrics() {
    setMetricsLoading(true);
    try {
      const [mRes, pRes, hRes] = await Promise.all([
        fetch('/api/admin/metrics',    { headers: { 'X-Admin-Key': adminKey } }),
        fetch('/api/admin/peak-hours', { headers: { 'X-Admin-Key': adminKey } }),
        fetch('/api/admin/health',     { headers: { 'X-Admin-Key': adminKey } }),
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (pRes.ok) setPeakHours(await pRes.json());
      if (hRes.ok) setHealth(await hRes.json());
    } catch {}
    finally { setMetricsLoading(false); }
  }

  async function loadChatLogs() {
    setChatLogsLoading(true);
    try {
      const r = await fetch('/api/admin/chat-logs', { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setChatLogs(await r.json());
    } catch {}
    finally { setChatLogsLoading(false); }
  }

  async function loadImages() {
    try {
      const r = await fetch('/api/admin/images', { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) {
        const data = await r.json();
        setImageConfig(data);
        const edits = {};
        for (const [section, items] of Object.entries(data)) {
          for (const [key, val] of Object.entries(items)) {
            edits[`${section}__${key}`] = val.url;
          }
        }
        setImageEdits(edits);
      }
    } catch {}
  }

  async function loadSystemHealth() {
    setSystemHealthLoading(true);
    try {
      const r = await fetch('/api/admin/system-health', { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setSystemHealth(await r.json());
    } catch {}
    setSystemHealthLoading(false);
  }

  async function saveImage(section, key) {
    const editKey = `${section}__${key}`;
    const url = imageEdits[editKey] || '';
    setImageSaving(s => ({ ...s, [editKey]: true }));
    try {
      const r = await fetch('/api/admin/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ section, key, url }),
      });
      if (r.ok) {
        setImageSaved(s => ({ ...s, [editKey]: true }));
        setTimeout(() => setImageSaved(s => ({ ...s, [editKey]: false })), 2000);
      }
    } catch {}
    finally { setImageSaving(s => ({ ...s, [editKey]: false })); }
  }

  async function loadChatThread(studentId, subjectId) {
    setChatThread(null); setChatThreadLoading(true);
    try {
      const r = await fetch(`/api/admin/chat-logs/${studentId}/${subjectId}`, { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setChatThread({ studentId, subjectId, messages: await r.json() });
    } catch {}
    finally { setChatThreadLoading(false); }
  }

  async function loadStudentDetail(studentId) {
    setSelectedStudentId(studentId);
    setStudentDetail(null);
    setStudentDetailLoading(true);
    setStudentDetailTab('timeline');
    try {
      const r = await fetch(`/api/admin/students/${studentId}/detail`, { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setStudentDetail(await r.json());
    } catch {}
    finally { setStudentDetailLoading(false); }
  }

  async function loadStudyPlans() {
    setStudyPlansLoading(true);
    try {
      const r = await fetch('/api/admin/study-plans', { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setStudyPlans(await r.json());
    } catch {}
    finally { setStudyPlansLoading(false); }
  }

  async function loadAnnouncePreview(target) {
    try {
      const r = await fetch(`/api/admin/announce/preview?target=${encodeURIComponent(target)}`, { headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setAnnouncePreview(await r.json());
    } catch {}
  }

  async function sendAnnouncement(e) {
    e.preventDefault();
    if (!announceForm.subject.trim() || !announceForm.message.trim()) return;
    setAnnounceSending(true); setAnnounceSent('');
    try {
      const r = await fetch('/api/admin/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify(announceForm),
      });
      if (r.ok) {
        const d = await r.json();
        setAnnounceSent(`Sent to ${d.queued} student${d.queued !== 1 ? 's' : ''} ✓`);
        setAnnounceForm(f => ({ ...f, subject: '', message: '' }));
      }
    } catch {}
    finally { setAnnounceSending(false); }
  }

  function downloadCSV(endpoint, filename) {
    const url = `/api/admin/${endpoint}`;
    fetch(url, { headers: { 'X-Admin-Key': adminKey } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
      });
  }

  async function handleWaitlistApprove(id) {
    setWaitlistAction(id + '_approve');
    try {
      const r = await fetch(`/api/admin/approve-request/${id}`, { method: 'POST', headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setWaitlistRequests(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' } : w));
    } catch {}
    finally { setWaitlistAction(null); }
  }

  async function handleWaitlistReject(id) {
    setWaitlistAction(id + '_reject');
    try {
      const r = await fetch(`/api/admin/reject-request/${id}`, { method: 'POST', headers: { 'X-Admin-Key': adminKey } });
      if (r.ok) setWaitlistRequests(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected' } : w));
    } catch {}
    finally { setWaitlistAction(null); }
  }

  async function handleDownload(id, filename) {
    try {
      const res = await fetch(`/api/admin/submissions/${id}/download`, {
        headers: { 'X-Admin-Key': adminKey },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  async function handleMark(id) {
    const score = parseInt(markForm.score, 10);
    if (isNaN(score) || score < 0 || score > 100) { setMarkError('Score must be 0–100'); return; }
    if (!markForm.feedback.trim()) { setMarkError('Feedback is required'); return; }
    setMarkError('');
    try {
      const res = await fetch(`/api/admin/submissions/${id}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ score, feedback: markForm.feedback.trim() }),
      });
      if (!res.ok) throw new Error('Marking failed');
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, score, feedback: markForm.feedback.trim(), marked_at: new Date().toISOString() } : s));
      setMarking(null);
      setMarkForm({ score: '', feedback: '' });
      setMarkSuccess(id);
      setTimeout(() => setMarkSuccess(null), 3000);
    } catch (err) { setMarkError(err.message); }
  }

  const subjectFor = (id) => subjectById(id);

  if (!adminKey) {
    return (
      <div className="admin-auth-screen">
        <div className="admin-auth-card">
          <div className="admin-auth-brand">
            <img src="/logo-1.png" alt="Bversity" className="admin-auth-logo-img" />
          </div>

          <div className="admin-auth-divider" />

          <div className="admin-auth-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Faculty Portal
          </div>

          <h2 className="admin-auth-heading">Welcome back</h2>
          <p className="admin-auth-sub">Enter your admin key to access the faculty dashboard.</p>

          <form onSubmit={handleAuth} className="admin-auth-form">
            <div className="admin-key-wrap">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="Enter admin key"
                className="admin-key-input"
                autoFocus
              />
              <button
                type="button"
                className="admin-key-toggle"
                onClick={() => setShowKey(v => !v)}
                tabIndex={-1}
              >
                {showKey ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading || !keyInput.trim()}>
              {loading ? 'Verifying…' : 'Access portal →'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-sidebar">
        <div className="admin-sb-brand">
          <img src="/logo-1.png" alt="Bversity" className="admin-sb-logo" />
          <div className="admin-sb-subtitle">Faculty Portal</div>
        </div>
        <nav className="admin-sb-nav">
          {[
            { id: 'overview',    label: 'Overview',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
            { id: 'metrics',     label: 'Metrics',    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
            { id: 'students',    label: 'Students',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
            { id: 'submissions', label: 'Capstones',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg> },
            { id: 'videos',      label: 'Videos',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg> },
            { id: 'resources',   label: 'Resources',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> },
            { id: 'analytics',   label: 'Analytics',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg> },
            { id: 'cohort',      label: 'Cohort',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg> },
            { id: 'emails',      label: 'Emails',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
            { id: 'access',      label: 'Access',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
            { id: 'feedback',    label: 'Feedback',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
            { id: 'waitlist',    label: 'Waitlist',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
              badge: waitlistRequests.filter(w => w.status === 'pending').length },
            { id: 'chatlogs',    label: 'Chat Logs',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/></svg> },
            { id: 'studyplans',  label: 'Study Plans', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg> },
            { id: 'export',      label: 'Export',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
            { id: 'announce',    label: 'Announce',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z"/><path d="M6 17V7a2 2 0 012-2h1"/><path d="M18 17V7a2 2 0 00-2-2h-1"/><line x1="12" y1="5" x2="12" y2="2"/></svg> },
            { id: 'images',      label: 'Images',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
            { id: 'system',      label: 'System',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
          ].map(item => (
            <button
              key={item.id}
              className={`admin-sb-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => {
                setTab(item.id);
                if (item.id === 'analytics') loadAnalytics();
                if (item.id === 'cohort') loadCohort();
                if (item.id === 'emails') loadEmailPreview();
                if (item.id === 'feedback') loadFeedback();
                if (item.id === 'waitlist') loadWaitlist();
                if (item.id === 'metrics') loadMetrics();
                if (item.id === 'chatlogs') loadChatLogs();
                if (item.id === 'studyplans') loadStudyPlans();
                if (item.id === 'announce') { loadAnnouncePreview('all'); };
                if (item.id === 'images') loadImages();
                if (item.id === 'system') loadSystemHealth();
              }}
            >
              <span className="admin-sb-icon">{item.icon}</span>
              {item.label}
              {item.badge > 0 && <span className="admin-sb-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <button className="admin-sb-back" onClick={() => { localStorage.removeItem('bversity_admin_key'); setAdminKey(''); setKeyInput(''); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </div>
      <div className="admin-main">

      {/* Health bar  -  always visible */}
      {health && (
        <div className="admin-health-bar">
          <div className={`admin-health-dot ${health.status === 'ok' ? 'green' : 'red'}`} />
          <span className="admin-health-item"><strong>Status:</strong> {health.status === 'ok' ? 'All systems operational' : 'Degraded'}</span>
          <span className="admin-health-sep" />
          <span className="admin-health-item"><strong>Uptime:</strong> {health.uptime}</span>
          <span className="admin-health-sep" />
          <span className="admin-health-item"><strong>DB:</strong> {health.db_size_mb} MB</span>
          <span className="admin-health-sep" />
          <span className="admin-health-item"><strong>Students:</strong> {health.total_students}</span>
          <span className="admin-health-sep" />
          <span className="admin-health-item"><strong>Messages:</strong> {health.total_messages}</span>
        </div>
      )}

      {tab === 'metrics' && (
        <div className="admin-content">
          {metricsLoading && <div className="admin-empty">Loading metrics…</div>}
          {!metricsLoading && metrics && (() => {
            // sparkline SVG helper
            const sparkMax = Math.max(...metrics.sparkline.map(d => d.dau), 1);
            const W = 340, H = 52, pts = metrics.sparkline;
            const x = i => Math.round((i / (pts.length - 1)) * W);
            const y = v => Math.round(H - 4 - ((v / sparkMax) * (H - 8)));
            const polyline = pts.map((d, i) => `${x(i)},${y(d.dau)}`).join(' ');
            const area = `${x(0)},${H} ` + pts.map((d, i) => `${x(i)},${y(d.dau)}`).join(' ') + ` ${x(pts.length - 1)},${H}`;

            // peak hours grid
            const peakMax = Math.max(...peakHours.map(p => p.count), 1);
            const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

            return (
              <>
                {/* Pulse stats */}
                <div className="metrics-section-label">Platform Pulse</div>
                <div className="metrics-pulse-row">
                  {[
                    { label: 'DAU', value: metrics.dau, sub: 'active today' },
                    { label: 'WAU', value: metrics.wau, sub: 'active this week' },
                    { label: 'MAU', value: metrics.mau, sub: 'active this month' },
                    { label: 'Stickiness', value: `${metrics.dau_mau_ratio}%`, sub: 'DAU / MAU ratio' },
                    { label: 'New Today', value: metrics.new_today, sub: 'signups today' },
                    { label: 'New This Week', value: metrics.new_this_week, sub: 'signups this week' },
                  ].map(c => (
                    <div key={c.label} className="metrics-pulse-card">
                      <div className="metrics-pulse-value">{c.value}</div>
                      <div className="metrics-pulse-label">{c.label}</div>
                      <div className="metrics-pulse-sub">{c.sub}</div>
                    </div>
                  ))}
                </div>

                {/* 30-day sparkline */}
                <div className="metrics-section-label" style={{ marginTop: 28 }}>30-Day Activity</div>
                <div className="metrics-spark-card">
                  <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="metrics-spark-svg">
                    <defs>
                      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16c1ad" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#16c1ad" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={area} fill="url(#sparkGrad)" />
                    <polyline points={polyline} fill="none" stroke="#16c1ad" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                  <div className="metrics-spark-labels">
                    <span>{pts[0]?.date}</span>
                    <span>{pts[Math.floor(pts.length / 2)]?.date}</span>
                    <span>{pts[pts.length - 1]?.date}</span>
                  </div>
                  <div className="metrics-spark-peak">Peak DAU: <strong>{sparkMax}</strong></div>
                </div>

                {/* Retention */}
                <div className="metrics-section-label" style={{ marginTop: 28 }}>Retention</div>
                <div className="metrics-retention-row">
                  {[
                    { label: 'Day 1', value: metrics.retention.d1, desc: 'came back next day' },
                    { label: 'Day 7', value: metrics.retention.d7, desc: 'active in first week' },
                    { label: 'Day 30', value: metrics.retention.d30, desc: 'still active at 30 days' },
                  ].map(r => (
                    <div key={r.label} className="metrics-retention-card">
                      <div className="metrics-ret-label">{r.label}</div>
                      <div className="metrics-ret-value">{r.value}%</div>
                      <div className="metrics-ret-track">
                        <div className="metrics-ret-fill" style={{ width: `${r.value}%`, background: r.value >= 40 ? '#16c1ad' : r.value >= 20 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <div className="metrics-ret-desc">{r.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Engagement quality */}
                <div className="metrics-section-label" style={{ marginTop: 28 }}>Learning Quality</div>
                <div className="metrics-quality-row">
                  {[
                    { label: 'Avg Msgs / Session', value: metrics.avg_session_msgs, sub: 'messages per active day' },
                    { label: 'Depth Score', value: `${metrics.depth_score}%`, sub: 'mastered / covered ratio' },
                    { label: 'Avg Streak', value: metrics.avg_streak, sub: 'days (active students)' },
                    { label: 'Max Streak', value: metrics.max_streak, sub: 'longest streak achieved' },
                    { label: 'Students w/ Streak', value: metrics.students_with_streak, sub: 'have active streak' },
                  ].map(c => (
                    <div key={c.label} className="metrics-quality-card">
                      <div className="metrics-quality-value">{c.value}</div>
                      <div className="metrics-quality-label">{c.label}</div>
                      <div className="metrics-quality-sub">{c.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Top concepts */}
                <div className="metrics-section-label" style={{ marginTop: 28 }}>Most-Reached Concepts</div>
                <div className="metrics-concepts-list">
                  {metrics.top_concepts.map((c, i) => {
                    const subj = SUBJECTS.find(s => s.id === c.subject_id);
                    const masteryPct = c.student_count > 0 ? Math.round((c.mastered_count / c.student_count) * 100) : 0;
                    return (
                      <div key={i} className="metrics-concept-row">
                        <div className="metrics-concept-dot" style={{ background: subj?.color || '#ccc' }} />
                        <div className="metrics-concept-name">{c.concept_id.replace(/_/g, ' ')}</div>
                        <div className="metrics-concept-subj" style={{ color: subj?.color }}>{subj?.name}</div>
                        <div className="metrics-concept-bar-track">
                          <div className="metrics-concept-bar-fill" style={{ width: `${masteryPct}%`, background: subj?.color || '#16c1ad' }} />
                        </div>
                        <div className="metrics-concept-mastery">{masteryPct}% mastered</div>
                        <div className="metrics-concept-count">{c.student_count} students</div>
                      </div>
                    );
                  })}
                </div>

                {/* Peak hours heatmap */}
                {peakHours.length > 0 && (
                  <>
                    <div className="metrics-section-label" style={{ marginTop: 28 }}>Peak Activity Heatmap</div>
                    <div className="metrics-heatmap-wrap">
                      <div className="metrics-heatmap-hour-labels">
                        {Array.from({ length: 24 }, (_, h) => (
                          <div key={h} className="metrics-heatmap-h-label">{h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}</div>
                        ))}
                      </div>
                      {days.map((day, dow) => {
                        const rowMax = Math.max(...peakHours.filter(p => p.dow === dow).map(p => p.count), 1);
                        return (
                          <div key={day} className="metrics-heatmap-row">
                            <div className="metrics-heatmap-day-label">{day}</div>
                            {Array.from({ length: 24 }, (_, h) => {
                              const cell = peakHours.find(p => p.dow === dow && p.hour === h);
                              const intensity = cell ? cell.count / peakMax : 0;
                              return (
                                <div
                                  key={h}
                                  className="metrics-heatmap-cell"
                                  title={`${day} ${h}:00, ${cell?.count ?? 0} messages`}
                                  style={{ background: intensity > 0 ? `rgba(22,193,173,${0.08 + intensity * 0.82})` : undefined }}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}

      {tab === 'overview' && (
        <div className="admin-content">
          <div className="admin-overview-grid">
            {[
              { label: 'Total Learners',      value: overview?.total_students    ?? '-', sub: 'registered accounts' },
              { label: 'Active This Week',    value: overview?.active_week       ?? '-', sub: 'sent a message in 7 days' },
              { label: 'Concepts Covered',    value: overview?.total_concepts    ?? '-', sub: 'across all students' },
              { label: 'Messages Sent',       value: overview?.total_messages    ?? '-', sub: 'student messages total' },
              { label: 'Pending Capstones',   value: overview?.pending_capstones ?? '-', sub: 'awaiting your review', alert: (overview?.pending_capstones > 0) },
            ].map(card => (
              <div key={card.label} className={`admin-ov-card ${card.alert ? 'alert' : ''}`}>
                <div className="admin-ov-value">{card.value}</div>
                <div className="admin-ov-label">{card.label}</div>
                <div className="admin-ov-sub">{card.sub}</div>
              </div>
            ))}
          </div>

          <div className="admin-ov-section-title">Learner Engagement</div>
          <div className="admin-engage-row">
            <div className="admin-engage-card admin-engage-card--red">
              <div className="admin-engage-value">{overview?.never_started ?? '-'}</div>
              <div className="admin-engage-label">Never Started</div>
              <div className="admin-engage-sub">approved but haven't opened the platform</div>
            </div>
            <div className="admin-engage-card admin-engage-card--green">
              <div className="admin-engage-value">{overview?.active_week ?? '-'}</div>
              <div className="admin-engage-label">Active This Week</div>
              <div className="admin-engage-sub">sent a message in the last 7 days</div>
            </div>
            <div className="admin-engage-card admin-engage-card--amber">
              <div className="admin-engage-value">{overview?.gone_quiet ?? '-'}</div>
              <div className="admin-engage-label">Gone Quiet</div>
              <div className="admin-engage-sub">started but no activity in 7+ days</div>
            </div>
          </div>

          <div className="admin-ov-section-title" style={{ marginTop: '28px' }}>All Learners  -  Usage</div>
          <div className="admin-engage-table">
            <div className="admin-et-header">
              <span>Learner</span>
              <span>Status</span>
              <span>Days Used</span>
              <span>Messages</span>
              <span>Joined</span>
            </div>
            {[...students].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(s => {
              const isNeverStarted = !s.last_active;
              const lastDate = s.last_active ? new Date(s.last_active) : null;
              const daysSince = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / 86400000) : null;
              const isActiveWeek = daysSince !== null && daysSince <= 7;
              const status = isNeverStarted ? 'never' : isActiveWeek ? 'active' : 'quiet';
              const statusLabel = { never: 'Not Started', active: 'Active', quiet: 'Gone Quiet' }[status];
              return (
                <div key={s.id} className="admin-et-row">
                  <div className="admin-et-name">
                    <div className="admin-st-avatar admin-st-avatar--sm" style={{ background: s.avatar_color || '#00A896' }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="admin-et-fullname">{s.name}</div>
                      <div className="admin-et-email">{s.email}</div>
                    </div>
                  </div>
                  <div>
                    <span className={`admin-status-badge admin-status-badge--${status}`}>{statusLabel}</span>
                  </div>
                  <div className="admin-et-days">
                    {s.days_active > 0 ? (
                      <>
                        <span className="admin-et-days-num">{s.days_active}</span>
                        <span className="admin-et-days-label"> day{s.days_active !== 1 ? 's' : ''}</span>
                      </>
                    ) : ' - '}
                  </div>
                  <div className="admin-et-msgs">{s.message_count > 0 ? s.message_count : ' - '}</div>
                  <div className="admin-et-last">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ' - '}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'students' && (() => {
        const filtered = [...students]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .filter(s => {
            if (stSearch && !s.name.toLowerCase().includes(stSearch.toLowerCase()) && !s.email.toLowerCase().includes(stSearch.toLowerCase())) return false;
            if (stFilter === 'never') return !s.last_active;
            if (stFilter === 'active') return s.last_active && (Date.now() - new Date(s.last_active).getTime()) <= 7 * 86400000;
            if (stFilter === 'quiet') return s.last_active && (Date.now() - new Date(s.last_active).getTime()) > 7 * 86400000;
            return true;
          });
        return (
        <div className="admin-content">
          <div className="admin-students-header">
            <span className="admin-students-count">{filtered.length} of {students.length} learner{students.length !== 1 ? 's' : ''}</span>
            <div className="admin-st-filters">
              <input className="admin-st-search" placeholder="Search name or email…" value={stSearch} onChange={e => setStSearch(e.target.value)} />
              <div className="admin-st-filter-btns">
                {[['all','All'],['active','Active'],['quiet','Gone Quiet'],['never','Not Started']].map(([v,l]) => (
                  <button key={v} className={`admin-st-filter-btn ${stFilter === v ? 'active' : ''}`} onClick={() => setStFilter(v)}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="admin-students-list admin-students-list--full">
            {filtered.length === 0 ? (
              <div className="admin-empty">No students match.</div>
            ) : filtered.map(s => (
              <div key={s.id} className="admin-student-row" style={{cursor:'pointer'}} onClick={() => loadStudentDetail(s.id)}>
                <div className="admin-st-avatar" style={{ background: s.avatar_color || '#00A896' }}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="admin-st-info">
                  <div className="admin-st-name">{s.name}</div>
                  <div className="admin-st-email">{s.email}</div>
                  {(s.college || s.year_of_study) && (
                    <div className="admin-st-college">{[s.college, s.year_of_study].filter(Boolean).join(' · ')}</div>
                  )}
                </div>
                {s.career_title ? (
                  <div className="admin-st-career">{s.career_icon} {s.career_title}</div>
                ) : (
                  <div className="admin-st-career admin-st-career--none">No career selected</div>
                )}
                <div className="admin-st-progress-col">
                  <div className="admin-st-prog-label">{s.concepts_covered} covered · {s.concepts_mastered} mastered</div>
                  <div className="admin-st-prog-bar-track">
                    <div className="admin-st-prog-bar-fill" style={{ width: `${Math.min(100, (s.concepts_covered / 36) * 100)}%` }} />
                  </div>
                  <div className="admin-st-prog-label" style={{ opacity: 0.6 }}>{s.subjects_touched} subject{s.subjects_touched !== 1 ? 's' : ''} · {s.message_count} messages</div>
                </div>
                <div className="admin-st-meta">
                  <div className="admin-st-last-label">Last active</div>
                  <div className="admin-st-last">
                    {s.last_active ? new Date(s.last_active).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                  </div>
                  {s.days_active > 0 && (
                    <div className="admin-st-days-used">{s.days_active} day{s.days_active !== 1 ? 's' : ''} used</div>
                  )}
                  {s.city || s.state ? (
                    <div className="admin-st-location">{[s.city, s.state].filter(Boolean).join(', ')}</div>
                  ) : null}
                </div>
                <button className="admin-st-delete-btn" title="Delete student" onClick={e => {
                  e.stopPropagation();
                  if (window.confirm(`Permanently delete ${s.name}? This removes all their messages, progress, and data.`)) {
                    fetch(`/api/admin/students/${s.id}`, { method: 'DELETE', headers: { 'X-Admin-Key': adminKey } })
                      .then(r => r.ok ? setStudents(prev => prev.filter(x => x.id !== s.id)) : alert('Failed to delete'));
                  }
                }}>✕</button>
              </div>
            ))}
          </div>
        </div>
        );
      })()}

      {/* ── Student Detail Drawer ── */}
      {selectedStudentId && (
        <div className="sd-overlay" onClick={() => setSelectedStudentId(null)}>
          <div className="sd-drawer" onClick={e => e.stopPropagation()}>
            <button className="sd-close" onClick={() => setSelectedStudentId(null)}>✕</button>

            {studentDetailLoading && <div className="sd-loading">Loading...</div>}

            {studentDetail && (() => {
              const { student, stats, progress_by_subject, sessions, session_summaries, timeline, quizzes, platform_feedback, concept_feedback, daily_activity, study_plan } = studentDetail;
              const SUBJECTS_MAP = Object.fromEntries([...US_SUBJECTS, ...INDIA_SUBJECTS].map(s => [s.id, s]));

              // daily heatmap
              const dailyMap = Object.fromEntries(daily_activity.map(d => [d.day, d.count]));
              const today = new Date();
              const heatmapDays = Array.from({length: 84}, (_, i) => {
                const d = new Date(today); d.setDate(d.getDate() - (83 - i));
                const key = d.toISOString().slice(0,10);
                return { key, count: dailyMap[key] || 0 };
              });

              const positiveCF = concept_feedback.filter(f => f.value === 'up').length;
              const negativeCF = concept_feedback.filter(f => f.value === 'down').length;

              return (
                <>
                  {/* Header */}
                  <div className="sd-header">
                    <div className="sd-avatar" style={{background: student.avatar_color || '#00A896'}}>{student.name.charAt(0).toUpperCase()}</div>
                    <div className="sd-header-info">
                      <div className="sd-name">{student.name}</div>
                      <div className="sd-email">{student.email}</div>
                      <div className="sd-meta-row">
                        {student.career_title && <span className="sd-badge">{student.career_icon} {student.career_title}</span>}
                        {(student.city || student.state) && <span className="sd-badge-dim">{[student.city, student.state].filter(Boolean).join(', ')}</span>}
                        {student.college && <span className="sd-badge-dim">{student.college}{student.year_of_study ? ` · ${student.year_of_study}` : ''}</span>}
                        <span className="sd-badge-dim">Joined {new Date(student.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="sd-stats">
                    {[
                      ['Days Active', stats.days_active],
                      ['Sessions', stats.total_sessions],
                      ['Messages', stats.total_messages],
                      ['Concepts Covered', stats.total_concepts_covered],
                      ['Concepts Mastered', stats.total_concepts_mastered],
                      ['Streak', `${stats.streak_count} days`],
                    ].map(([label, val]) => (
                      <div key={label} className="sd-stat-box">
                        <div className="sd-stat-val">{val}</div>
                        <div className="sd-stat-label">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Activity heatmap */}
                  <div className="sd-section">
                    <div className="sd-section-title">Activity — last 12 weeks</div>
                    <div className="sd-heatmap">
                      {heatmapDays.map(d => (
                        <div key={d.key} className="sd-heatmap-cell" title={`${d.key}: ${d.count} messages`}
                          style={{background: d.count === 0 ? 'rgba(255,255,255,0.05)' : d.count < 3 ? '#0d9e8c55' : d.count < 8 ? '#0d9e8c99' : '#0d9e8c'}} />
                      ))}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="sd-tabs">
                    {[['timeline','Timeline'],['progress','Progress'],['sessions','Conversations'],['feedback','Feedback'],['plan','Study Plan']].map(([v,l]) => (
                      <button key={v} className={`sd-tab ${studentDetailTab === v ? 'active' : ''}`} onClick={() => setStudentDetailTab(v)}>{l}</button>
                    ))}
                  </div>

                  {/* Timeline */}
                  {studentDetailTab === 'timeline' && (
                    <div className="sd-timeline">
                      {timeline.length === 0 && <div className="sd-empty">No activity yet.</div>}
                      {[...timeline].reverse().map((e, i) => {
                        const subj = SUBJECTS_MAP[e.subject_id];
                        const subjName = subj?.name || e.subject_id || '';
                        let icon = '💬', label = '';
                        if (e.type === 'session') { icon = '💬'; label = `Started a session in ${subjName} · ${e.message_count} messages`; }
                        else if (e.type === 'concept_covered') { icon = '📖'; label = `Covered concept in ${subjName}`; }
                        else if (e.type === 'concept_mastered') { icon = '✅'; label = `Mastered concept in ${subjName}`; }
                        else if (e.type === 'quiz') { icon = e.passed ? '🎯' : '❌'; label = `Quiz ${e.passed ? 'passed' : 'failed'} in ${subjName}`; }
                        else if (e.type === 'subject_completed') { icon = '🏆'; label = `Completed subject: ${subjName}`; }
                        else if (e.type === 'career_change') { icon = '🔄'; label = `Changed career goal · ${e.reason}`; }
                        return (
                          <div key={i} className="sd-tl-item">
                            <div className="sd-tl-icon">{icon}</div>
                            <div className="sd-tl-body">
                              <div className="sd-tl-label">{label}</div>
                              <div className="sd-tl-time">{new Date(e.at).toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Progress */}
                  {studentDetailTab === 'progress' && (
                    <div className="sd-progress-list">
                      {Object.keys(progress_by_subject).length === 0 && <div className="sd-empty">No progress yet.</div>}
                      {Object.entries(progress_by_subject).map(([sid, data]) => {
                        const subj = SUBJECTS_MAP[sid];
                        const total = subj?.concepts?.length || 1;
                        const covered = data.covered.length;
                        const mastered = data.mastered.length;
                        return (
                          <div key={sid} className="sd-prog-subject">
                            <div className="sd-prog-subj-name">{subj?.name || sid}</div>
                            <div className="sd-prog-bars">
                              <div className="sd-prog-bar-row">
                                <span>Covered</span>
                                <div className="sd-prog-track"><div className="sd-prog-fill sd-prog-fill--covered" style={{width:`${Math.min(100,(covered/total)*100)}%`}} /></div>
                                <span>{covered}/{total}</span>
                              </div>
                              <div className="sd-prog-bar-row">
                                <span>Mastered</span>
                                <div className="sd-prog-track"><div className="sd-prog-fill sd-prog-fill--mastered" style={{width:`${Math.min(100,(mastered/total)*100)}%`}} /></div>
                                <span>{mastered}/{total}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {quizzes.length > 0 && (
                        <div className="sd-quiz-section">
                          <div className="sd-section-title" style={{marginTop:'1.5rem'}}>Module Quizzes</div>
                          {quizzes.map((q, i) => (
                            <div key={i} className="sd-quiz-row">
                              <span className={`sd-quiz-badge ${q.passed ? 'pass' : 'fail'}`}>{q.passed ? 'Pass' : 'Fail'}</span>
                              <span>{SUBJECTS_MAP[q.subject_id]?.name || q.subject_id} — {q.module_id}</span>
                              <span className="sd-quiz-date">{q.completed_at ? new Date(q.completed_at).toLocaleDateString() : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conversations */}
                  {studentDetailTab === 'sessions' && (
                    <div className="sd-sessions-list">
                      {sessions.length === 0 && <div className="sd-empty">No conversations yet.</div>}
                      {[...sessions].reverse().map((s, i) => {
                        const subj = SUBJECTS_MAP[s.subject_id];
                        const summary = session_summaries.find(ss => ss.subject_id === s.subject_id);
                        return (
                          <div key={i} className="sd-session-card">
                            <div className="sd-session-top">
                              <span className="sd-session-subj">{subj?.name || s.subject_id}</span>
                              <span className="sd-session-meta">{s.message_count} messages · {new Date(s.started_at).toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                            </div>
                            {summary && <div className="sd-session-summary">{summary.summary}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Feedback */}
                  {studentDetailTab === 'feedback' && (
                    <div className="sd-feedback-section">
                      {platform_feedback.length === 0 && concept_feedback.length === 0 && <div className="sd-empty">No feedback submitted yet.</div>}
                      {platform_feedback.map((f, i) => (
                        <div key={i} className="sd-pfeedback-card">
                          <div className="sd-pfeedback-rating">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)} <span>{f.rating}/5</span></div>
                          {f.q1 && <div className="sd-pfeedback-q"><strong>Q1:</strong> {f.q1}</div>}
                          {f.q2 && <div className="sd-pfeedback-q"><strong>Q2:</strong> {f.q2}</div>}
                          {f.q3 && <div className="sd-pfeedback-q"><strong>Q3:</strong> {f.q3}</div>}
                          {f.comment && <div className="sd-pfeedback-comment">"{f.comment}"</div>}
                          <div className="sd-pfeedback-date">{new Date(f.submitted_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                      {concept_feedback.length > 0 && (
                        <>
                          <div className="sd-section-title" style={{marginTop:'1rem'}}>Concept Reactions — {positiveCF} 👍 · {negativeCF} 👎</div>
                          {concept_feedback.slice(0, 20).map((f, i) => (
                            <div key={i} className="sd-cf-row">
                              <span>{f.value === 'up' ? '👍' : '👎'}</span>
                              <span>{f.concept_title}</span>
                              <span className="sd-cf-subj">{SUBJECTS_MAP[f.subject_id]?.name || f.subject_id}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Study Plan */}
                  {studentDetailTab === 'plan' && (
                    <div className="sd-plan-list">
                      {study_plan.length === 0 && <div className="sd-empty">No study plan generated yet.</div>}
                      {study_plan.map((p, i) => (
                        <div key={i} className="sd-plan-row">
                          <span className="sd-plan-day">Day {p.day_number}</span>
                          <span className="sd-plan-concept">{p.concept_id}</span>
                          <span className="sd-plan-subj">{SUBJECTS_MAP[p.subject_id]?.name || p.subject_id}</span>
                          <span className="sd-plan-date">{p.target_date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {tab === 'submissions' ? (
        <div className="admin-content">
          <div className="admin-stats-bar">
            <span className="admin-stat"><strong>{submissions.length}</strong> total submissions</span>
            <span className="admin-stat"><strong>{submissions.filter(s => s.score !== null).length}</strong> marked</span>
            <span className="admin-stat"><strong>{submissions.filter(s => s.score === null).length}</strong> pending review</span>
          </div>

          {submissions.length === 0 ? (
            <div className="admin-empty">No submissions yet.</div>
          ) : (
            <div className="admin-submissions-list">
              {submissions.map(sub => {
                const s = subjectFor(sub.subject_id);
                const isMarking = marking === sub.id;
                return (
                  <div key={sub.id} className="admin-submission-card">
                    <div className="admin-sub-header">
                      <div className="admin-sub-student">
                        <div className="admin-sub-avatar">{sub.student_name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="admin-sub-name">{sub.student_name}</div>
                          <div className="admin-sub-date">Submitted {new Date(sub.submitted_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {s && (
                        <span className="admin-sub-subject-pill" style={{ background: s.color + '18', color: s.color, border: `1px solid ${s.color}44` }}>
                          <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>{SUBJECT_ICONS[s.id]}</span> {s.name}
                        </span>
                      )}
                      {sub.score !== null ? (
                        <span className="admin-sub-score" style={{ color: s?.color || '#00A896' }}>{sub.score}/100</span>
                      ) : sub.ai_score !== null ? (
                        <span className="admin-ai-score-badge">{sub.ai_score}/100 AI</span>
                      ) : (
                        <span className="admin-sub-pending">Pending</span>
                      )}
                    </div>

                    <div className="admin-sub-file">
                      <span className="admin-sub-filename">{sub.filename}</span>
                      <button className="admin-download-btn" onClick={() => handleDownload(sub.id, sub.filename)}>
                        Download
                      </button>
                      {sub.ai_score === null && (
                        <button className="admin-download-btn" style={{ color: '#a08eff' }}
                          onClick={async () => {
                            await fetch(`/api/admin/submissions/${sub.id}/ai-grade`, { method: 'POST', headers: { 'X-Admin-Key': adminKey } });
                            alert('AI grading queued. Refresh in 30 seconds.');
                          }}>
                          AI Grade
                        </button>
                      )}
                    </div>

                    {sub.score !== null && sub.feedback && !isMarking && (
                      <div className="admin-sub-feedback-preview">
                        <span className="admin-feedback-label">Feedback:</span> {sub.feedback}
                      </div>
                    )}

                    {sub.ai_feedback && !isMarking && sub.score === null && (() => {
                      let parsed = null;
                      try { parsed = JSON.parse(sub.ai_feedback); } catch {}
                      if (!parsed) return null;
                      return (
                        <div className="admin-ai-assessment">
                          <div className="admin-ai-header">
                            <span className="admin-ai-label">AI Assessment</span>
                            <button className="admin-ai-use-btn"
                              onClick={() => {
                                const feedbackText = [
                                  parsed.overall_feedback,
                                  parsed.strengths ? `Strengths: ${parsed.strengths}` : '',
                                  parsed.areas_for_improvement ? `Areas for improvement: ${parsed.areas_for_improvement}` : '',
                                  ...(parsed.criterion_scores || []).map(c => `${c.criterion}: ${c.marks_awarded}/${c.max_marks}. ${c.comments}`),
                                ].filter(Boolean).join('\n\n');
                                setMarking(sub.id);
                                setMarkForm({ score: String(sub.ai_score), feedback: feedbackText });
                                setMarkError('');
                              }}>
                              Use AI assessment →
                            </button>
                          </div>
                          {parsed.criterion_scores?.map((c, i) => (
                            <div key={i} className="admin-ai-criterion">
                              <span className="admin-ai-crit-name">{c.criterion}</span>
                              <span className="admin-ai-crit-marks">{c.marks_awarded}/{c.max_marks}</span>
                              <span className="admin-ai-crit-comment">{c.comments}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {markSuccess === sub.id && (
                      <div className="admin-mark-success">Marked successfully.</div>
                    )}

                    {isMarking ? (
                      <div className="admin-mark-form">
                        <div className="admin-mark-row">
                          <label>Score (0–100)</label>
                          <input
                            type="number" min="0" max="100"
                            value={markForm.score}
                            onChange={e => setMarkForm(f => ({ ...f, score: e.target.value }))}
                            className="admin-score-input"
                          />
                        </div>
                        <div className="admin-mark-row">
                          <label>Feedback</label>
                          <textarea
                            value={markForm.feedback}
                            onChange={e => setMarkForm(f => ({ ...f, feedback: e.target.value }))}
                            className="admin-feedback-input"
                            rows={4}
                            placeholder="Written feedback for the student..."
                          />
                        </div>
                        {markError && <p className="form-error">{markError}</p>}
                        <div className="admin-mark-actions">
                          <button className="admin-submit-mark-btn" style={{ background: s?.color || '#00A896' }} onClick={() => handleMark(sub.id)}>
                            Submit mark
                          </button>
                          <button className="admin-cancel-btn" onClick={() => { setMarking(null); setMarkError(''); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="admin-mark-btn"
                        onClick={() => { setMarking(sub.id); setMarkForm({ score: sub.score ?? '', feedback: sub.feedback ?? '' }); setMarkError(''); }}
                      >
                        {sub.score !== null ? 'Edit mark' : 'Mark submission'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'videos' && (
        <div className="admin-content">
          <div className="videos-section">
            <h3 className="access-title">Concept Videos</h3>
            <p className="access-subtitle">Link a Google Drive video to any concept. Students see it in chat when that concept is covered.</p>
            <div className="videos-subject-row">
              <select
                className="videos-subject-select"
                value={videoSubject}
                onChange={e => handleVideoSubjectChange(e.target.value)}
              >
                <option value="">Select a subject</option>
                {SUBJECTS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {videoSubject && (() => {
              const subjectObj = SUBJECTS.find(s => s.id === videoSubject);
              return (
                <div className="videos-concept-list">
                  {videoConcepts.map(concept => {
                      const existing = videoMap[concept.id];
                      const isEditing = videoEdit === concept.id;
                      return (
                        <div key={concept.id} className={`videos-concept-row ${existing ? 'has-video' : ''}`}>
                          <div className="videos-concept-info">
                            <span className="videos-concept-name">{concept.name}</span>
                            <span className="videos-concept-id">{concept.id}</span>
                          </div>
                          {existing && !isEditing && (
                            <div className="videos-existing">
                              <span className="videos-existing-title">{existing.title || 'Linked'}</span>
                              <button className="videos-edit-btn" onClick={() => { setVideoEdit(concept.id); setVideoForm({ drive_url: existing.drive_url, title: existing.title || '' }); setVideoError(''); }}>Edit</button>
                              <button className="videos-delete-btn" onClick={() => handleVideoDelete(concept.id)}>Remove</button>
                            </div>
                          )}
                          {!existing && !isEditing && (
                            <button className="videos-add-btn" onClick={() => { setVideoEdit(concept.id); setVideoForm({ drive_url: '', title: '' }); setVideoError(''); }}>+ Add video</button>
                          )}
                          {isEditing && (
                            <div className="videos-edit-form">
                              <input
                                className="videos-url-input"
                                placeholder="Google Drive share link"
                                value={videoForm.drive_url}
                                onChange={e => setVideoForm(f => ({ ...f, drive_url: e.target.value }))}
                              />
                              <input
                                className="videos-title-input"
                                placeholder="Title (optional)"
                                value={videoForm.title}
                                onChange={e => setVideoForm(f => ({ ...f, title: e.target.value }))}
                              />
                              {videoError && <p className="form-error">{videoError}</p>}
                              <div className="videos-edit-actions">
                                <button className="admin-submit-mark-btn" style={{ background: subjectObj?.color || '#00A896' }} disabled={videoSaving} onClick={() => handleVideoSave(concept.id)}>
                                  {videoSaving ? 'Saving…' : 'Save'}
                                </button>
                                <button className="admin-cancel-btn" onClick={() => { setVideoEdit(null); setVideoError(''); }}>Cancel</button>
                              </div>
                            </div>
                          )}
                          <ConceptNoteRow
                            conceptId={concept.id}
                            notes={conceptNotesMap[concept.id] || ''}
                            saving={conceptNotesSaving === concept.id}
                            onSave={saveConceptNote}
                            color={subjectObj?.color}
                          />
                        </div>
                      );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {tab === 'resources' && (
        <div className="admin-content">
          <div className="videos-section">
            <h3 className="access-title">Resource Library</h3>
            <p className="access-subtitle">Add papers, articles, and links per concept. Students see them when that concept is covered.</p>
            <div className="videos-subject-row">
              <select className="videos-subject-select" value={resSubject} onChange={e => handleResSubjectChange(e.target.value)}>
                <option value="">Select a subject</option>
                {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {resSubject && (
              <div className="videos-concept-list">
                {resConcepts.map(concept => {
                  const existing = resMap[concept.id] || [];
                  const isExpanded = resExpandedConcept === concept.id;
                  return (
                    <div key={concept.id} className={`videos-concept-row ${existing.length ? 'has-video' : ''}`}>
                      <div className="videos-concept-info">
                        <span className="videos-concept-name">{concept.name}</span>
                        <span className="videos-concept-id">{concept.id}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        {existing.map(r => (
                          <div key={r.id} className="videos-existing">
                            <span className={`resource-type-badge resource-type-${r.resource_type}`}>{r.resource_type}</span>
                            <span className="videos-existing-title">{r.title}</span>
                            <button className="videos-delete-btn" onClick={() => handleResDelete(r.id)}>Remove</button>
                          </div>
                        ))}
                        <button className="videos-add-btn" onClick={() => { setResExpandedConcept(isExpanded ? null : concept.id); setResError(''); }}>
                          {isExpanded ? 'Cancel' : '+ Add resource'}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="videos-edit-form" style={{ width: '100%', marginTop: 6 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input className="videos-url-input" placeholder="URL (paper, article, link)" value={resForm.url} onChange={e => setResForm(f => ({ ...f, url: e.target.value }))} style={{ flex: 2 }} />
                            <select className="videos-subject-select" value={resForm.resource_type} onChange={e => setResForm(f => ({ ...f, resource_type: e.target.value }))} style={{ flex: 1 }}>
                              {['paper', 'article', 'book', 'case-study', 'video', 'tool'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <input className="videos-title-input" placeholder="Title" value={resForm.title} onChange={e => setResForm(f => ({ ...f, title: e.target.value }))} />
                          <input className="videos-title-input" placeholder="Short description (optional)" value={resForm.description} onChange={e => setResForm(f => ({ ...f, description: e.target.value }))} />
                          {resError && <p className="form-error">{resError}</p>}
                          <div className="videos-edit-actions">
                            <button className="admin-submit-mark-btn" style={{ background: SUBJECTS.find(s=>s.id===resSubject)?.color || '#00A896' }} disabled={resSaving} onClick={() => handleResAdd(concept.id)}>
                              {resSaving ? 'Saving…' : 'Add resource'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'emails' && (
        <div className="admin-content">
          <h3 className="access-title">Email Campaigns</h3>
          <p className="access-subtitle">Welcome and certificate emails fire automatically. Use the buttons below to send batch campaigns.</p>

          {emailSentMsg && <div className="email-sent-toast">{emailSentMsg}</div>}

          {emailPreviewLoading && <div className="admin-empty">Loading preview…</div>}

          {emailPreview && (
            <div className="email-campaigns-grid">

              <div className="email-campaign-card">
                <div className="email-camp-header">
                  <div className="email-camp-icon" style={{ background: 'rgba(255,107,107,0.15)', color: '#ff6b6b' }}><IcoClock /></div>
                  <div>
                    <div className="email-camp-title">Study Plan Lag Nudge</div>
                    <div className="email-camp-desc">Sent to students who are 3+ days behind their 30-day plan.</div>
                  </div>
                </div>
                <div className="email-camp-meta">
                  <div className="email-camp-count">{emailPreview.lag_nudge_count}</div>
                  <div className="email-camp-count-label">student{emailPreview.lag_nudge_count !== 1 ? 's' : ''} would receive this</div>
                </div>
                {emailPreview.lag_nudge_targets?.length > 0 && (
                  <div className="email-camp-targets">
                    {emailPreview.lag_nudge_targets.map(t => (
                      <div key={t.email} className="email-camp-target-row">
                        <span className="email-camp-target-name">{t.name}</span>
                        <span className="email-camp-target-meta">{t.lag_days}d behind</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="email-send-btn"
                  disabled={emailPreview.lag_nudge_count === 0 || emailSending === 'nudge'}
                  onClick={() => sendEmailCampaign('nudge')}
                >
                  {emailSending === 'nudge' ? 'Sending…' : `Send to ${emailPreview.lag_nudge_count} student${emailPreview.lag_nudge_count !== 1 ? 's' : ''}`}
                </button>
              </div>

              <div className="email-campaign-card">
                <div className="email-camp-header">
                  <div className="email-camp-icon" style={{ background: 'rgba(0,168,150,0.15)', color: '#00A896' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg></div>
                  <div>
                    <div className="email-camp-title">Weekly Progress Digest</div>
                    <div className="email-camp-desc">Sent to all students who have started learning. Shows their week's progress.</div>
                  </div>
                </div>
                <div className="email-camp-meta">
                  <div className="email-camp-count">{emailPreview.digest_count}</div>
                  <div className="email-camp-count-label">student{emailPreview.digest_count !== 1 ? 's' : ''} would receive this</div>
                </div>
                <button
                  className="email-send-btn email-send-btn--teal"
                  disabled={emailPreview.digest_count === 0 || emailSending === 'digest'}
                  onClick={() => sendEmailCampaign('digest')}
                >
                  {emailSending === 'digest' ? 'Sending…' : `Send to ${emailPreview.digest_count} student${emailPreview.digest_count !== 1 ? 's' : ''}`}
                </button>
              </div>

            </div>
          )}

          {(() => {
            const joinedEmails = new Set(students.map(s => s.email.toLowerCase()));
            const notJoined = approvedEmails.filter(e => !joinedEmails.has(e.email.toLowerCase()));
            return (
              <div className="email-not-joined-section">
                <div className="admin-ov-section-title" style={{ marginBottom: '0.75rem' }}>Approved But Haven't Joined</div>
                <div className="email-not-joined-card">
                  <div className="email-nj-summary">
                    <div className="email-nj-count">{notJoined.length}</div>
                    <div className="email-nj-desc">
                      <div className="email-nj-title">People approved but never logged in</div>
                      <div className="email-nj-sub">Send them a reminder to come join the platform.</div>
                    </div>
                    <button
                      className="email-send-btn email-send-btn--amber"
                      disabled={notJoined.length === 0 || reminderSending}
                      onClick={async () => {
                        if (!window.confirm(`Send a reminder email to ${notJoined.length} people who haven't joined yet?`)) return;
                        setReminderSending(true); setReminderResult(null);
                        try {
                          const r = await fetch('/api/admin/send-join-reminder', { method: 'POST', headers: { 'X-Admin-Key': adminKey } });
                          if (r.ok) setReminderResult(await r.json());
                        } finally { setReminderSending(false); }
                      }}
                    >
                      {reminderSending ? 'Sending…' : `Send reminder to ${notJoined.length}`}
                    </button>
                  </div>
                  {reminderResult && (
                    <div className="email-nj-result">✓ Sent to {reminderResult.sent} of {reminderResult.total} people</div>
                  )}
                  {notJoined.length > 0 && (
                    <div className="email-nj-list">
                      {notJoined.map(e => (
                        <div key={e.email} className="email-nj-row">
                          <span className="email-nj-email">{e.email}</span>
                          <span className="email-nj-date">Approved {e.added_at ? new Date(e.added_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="email-auto-section">
            <div className="admin-ov-section-title">Automatic Emails</div>
            <div className="email-auto-list">
              {[
                { icon: <IcoMail />, title: 'Welcome email', desc: 'Fires when a new student registers for the first time.' },
                { icon: <IcoCertificate />, title: 'Certificate earned', desc: 'Fires when a student covers all concepts in a subject.' },
              ].map(e => (
                <div key={e.title} className="email-auto-row">
                  <span className="email-auto-icon">{e.icon}</span>
                  <div>
                    <div className="email-auto-title">{e.title}</div>
                    <div className="email-auto-desc">{e.desc}</div>
                  </div>
                  <span className="email-auto-badge">Auto</span>
                </div>
              ))}

              {/* ── Weekly Report ── */}
              <div className="email-auto-row weekly-report-row">
                <span className="email-auto-icon"><IcoClock /></span>
                <div style={{ flex: 1 }}>
                  <div className="email-auto-title">Weekly progress report</div>
                  <div className="email-auto-desc">
                    Sends a personalised AI-written report to every active student  - 
                    sessions, concepts covered, coaching note, and what to focus on next week.
                  </div>
                  {weeklyResult && (
                    <div className="weekly-report-result">
                      ✓ Queued for {weeklyResult.queued} student{weeklyResult.queued !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <button
                  className="weekly-report-btn"
                  disabled={weeklySending}
                  onClick={async () => {
                    setWeeklySending(true);
                    setWeeklyResult(null);
                    try {
                      const r = await fetch('/api/admin/send-weekly-digest', {
                        method: 'POST',
                        headers: { 'X-Admin-Key': adminKey },
                      });
                      if (r.ok) setWeeklyResult(await r.json());
                    } finally {
                      setWeeklySending(false);
                    }
                  }}
                >
                  {weeklySending ? 'Sending…' : 'Send now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="admin-content">
          {analyticsLoading && <div className="admin-empty">Loading analytics…</div>}

          {analyticsSubjects && (
            <div className="analytics-section">
              <div className="admin-ov-section-title">Subject Enrollment</div>
              <div className="analytics-subject-table">
                {analyticsSubjects.map(s => {
                  const maxStudents = Math.max(...analyticsSubjects.map(x => x.students_count), 1);
                  return (
                    <div key={s.subject_id} className="analytics-subject-row">
                      <div className="analytics-subject-name">
                        <span className="analytics-subject-dot" style={{ background: s.color }} />
                        {s.subject_name}
                      </div>
                      <div className="analytics-subject-stats">
                        <span className="analytics-stat-pill">{s.students_count} student{s.students_count !== 1 ? 's' : ''}</span>
                        {s.total_completions > 0 && <span className="analytics-stat-pill analytics-stat-green">{s.total_completions} completed</span>}
                      </div>
                      <div className="analytics-coverage-wrap">
                        <div className="analytics-coverage-track">
                          <div className="analytics-coverage-fill" style={{ width: `${s.avg_coverage_pct}%`, background: s.color + 'cc' }} />
                        </div>
                        <span className="analytics-coverage-pct">{s.avg_coverage_pct}% avg</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="analytics-section">
            <div className="admin-ov-section-title">Concept Coverage Heatmap</div>
            <select
              className="videos-subject-select"
              value={analyticsHeatSubject}
              onChange={e => loadHeatmap(e.target.value)}
            >
              <option value="">Select a subject</option>
              {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {analyticsHeatmap.length > 0 && (() => {
              const maxCount = Math.max(...analyticsHeatmap.map(c => c.student_count), 1);
              return (
                <div className="analytics-heatmap">
                  {analyticsHeatmap.map(c => (
                    <div key={c.concept_id} className="analytics-heat-row">
                      <div className="analytics-heat-name">{c.concept_name}</div>
                      <div className="analytics-heat-track">
                        <div className="analytics-heat-fill"
                          style={{ width: `${Math.max(2, (c.student_count / maxCount) * 100)}%`,
                                   opacity: 0.3 + (c.student_count / maxCount) * 0.7 }} />
                      </div>
                      <span className="analytics-heat-count">{c.student_count}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {analyticsQuizzes && (
            <div className="analytics-section">
              <div className="admin-ov-section-title">Quiz Activity</div>
              <div className="analytics-quiz-row">
                {[
                  { label: 'Quizzes Taken',  value: analyticsQuizzes.total_taken },
                  { label: 'Quizzes Passed', value: analyticsQuizzes.total_passed },
                  { label: 'Pass Rate',      value: `${analyticsQuizzes.pass_rate}%` },
                ].map(card => (
                  <div key={card.label} className="analytics-quiz-card">
                    <div className="admin-ov-value">{card.value}</div>
                    <div className="admin-ov-label">{card.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'cohort' && (
        <div className="admin-content">
          <div className="cohort-analytics">
            {!cohortData && <div className="admin-empty">Loading cohort data…</div>}
            {cohortData && (
              <>
                {/* Top stats row */}
                <div className="cohort-stats-row">
                  <div className="cohort-stat-box">
                    <div className="cohort-stat-value">{cohortData.total_students}</div>
                    <div className="cohort-stat-label">Total Students</div>
                  </div>
                  <div className="cohort-stat-box">
                    <div className="cohort-stat-value">{cohortData.active_this_week}</div>
                    <div className="cohort-stat-label">Active This Week</div>
                  </div>
                  <div className="cohort-stat-box">
                    <div className="cohort-stat-value">{cohortData.active_this_month}</div>
                    <div className="cohort-stat-label">Active This Month</div>
                  </div>
                  <div className="cohort-stat-box">
                    <div className="cohort-stat-value">{cohortData.engagement.total_messages}</div>
                    <div className="cohort-stat-label">Total Messages</div>
                  </div>
                </div>

                <div className="cohort-two-col">
                  {/* Career distribution */}
                  <div className="cohort-section">
                    <h3 className="cohort-section-title">Career Path Distribution</h3>
                    {cohortData.career_distribution.map(c => (
                      <div key={c.career_id} className="cohort-bar-row">
                        <div className="cohort-bar-label">{c.career_title}</div>
                        <div className="cohort-bar-track">
                          <div className="cohort-bar-fill" style={{ width: `${Math.round((c.count / cohortData.total_students) * 100)}%` }} />
                        </div>
                        <div className="cohort-bar-count">{c.count}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quiz pass rates */}
                  <div className="cohort-section">
                    <h3 className="cohort-section-title">Quiz Pass Rates by Subject</h3>
                    {cohortData.quiz_pass_rates.filter(q => q.taken > 0).map(q => (
                      <div key={q.subject_id} className="cohort-bar-row">
                        <div className="cohort-bar-label">{q.subject_name}</div>
                        <div className="cohort-bar-track">
                          <div className="cohort-bar-fill cohort-bar-fill--quiz" style={{ width: `${Math.round(q.pass_rate * 100)}%` }} />
                        </div>
                        <div className="cohort-bar-count">{Math.round(q.pass_rate * 100)}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hardest concepts table */}
                <div className="cohort-section cohort-section--full">
                  <h3 className="cohort-section-title">Hardest Concepts (lowest mastery rate)</h3>
                  <table className="cohort-table">
                    <thead><tr>
                      <th>Concept</th><th>Subject</th><th>Students Reached</th><th>Mastered</th><th>Rate</th>
                    </tr></thead>
                    <tbody>
                      {cohortData.hardest_concepts.map((c, i) => (
                        <tr key={i}>
                          <td>{c.concept_name}</td>
                          <td>{c.subject_name}</td>
                          <td>{c.covered_count}</td>
                          <td>{c.mastered_count}</td>
                          <td>
                            <span className={`cohort-rate-badge ${c.mastery_rate < 0.3 ? 'cohort-rate-badge--low' : c.mastery_rate < 0.6 ? 'cohort-rate-badge--mid' : 'cohort-rate-badge--high'}`}>
                              {Math.round(c.mastery_rate * 100)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Engagement stats */}
                <div className="cohort-section cohort-section--full">
                  <h3 className="cohort-section-title">Engagement</h3>
                  <div className="cohort-stats-row">
                    <div className="cohort-stat-box">
                      <div className="cohort-stat-value">{cohortData.engagement.avg_messages_per_student.toFixed(1)}</div>
                      <div className="cohort-stat-label">Avg Messages / Student</div>
                    </div>
                    <div className="cohort-stat-box">
                      <div className="cohort-stat-value">{cohortData.engagement.students_with_streak}</div>
                      <div className="cohort-stat-label">Students with Streak</div>
                    </div>
                    <div className="cohort-stat-box">
                      <div className="cohort-stat-value">{cohortData.engagement.avg_streak.toFixed(1)}</div>
                      <div className="cohort-stat-label">Avg Streak (active)</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'access' && (
        <div className="admin-content">
          <div className="access-section">
            <h3 className="access-title">Approved Emails</h3>
            <p className="access-subtitle">Only these emails can log in to Bversity.</p>
            <form className="access-add-form" onSubmit={handleAddEmail}>
              <input
                type="email"
                className="access-email-input"
                placeholder="student@email.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
              />
              <button type="submit" className="access-add-btn" disabled={emailLoading || !newEmail.trim()}>
                {emailLoading ? 'Adding…' : 'Grant access'}
              </button>
            </form>
            {emailError && <p className="form-error" style={{ marginTop: '0.5rem' }}>{emailError}</p>}
            <div className="access-list">
              {approvedEmails.length === 0 ? (
                <p className="access-empty">No approved emails yet.</p>
              ) : approvedEmails.map(e => (
                <div key={e.email} className="access-row">
                  <span className="access-email">{e.email}</span>
                  <span className="access-date">{new Date(e.added_at).toLocaleDateString()}</span>
                  <button className="access-remove-btn" onClick={() => handleRemoveEmail(e.email)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'waitlist' && (
        <div className="admin-content">
          <div className="feedback-admin-section">
            <h3 className="access-title">Waitlist Requests</h3>
            <p className="access-subtitle">
              {waitlistRequests.length} total · {waitlistRequests.filter(w => w.status === 'pending').length} pending review
            </p>
            {waitlistLoading ? (
              <p className="access-empty">Loading...</p>
            ) : waitlistRequests.length === 0 ? (
              <p className="access-empty">No requests yet. Share the waitlist link to start collecting applications.</p>
            ) : (
              <div className="waitlist-admin-list">
                {waitlistRequests.map(w => (
                  <div key={w.id} className={`waitlist-admin-row waitlist-status-${w.status}`}>
                    <div className="waitlist-admin-header">
                      <div className="waitlist-admin-identity">
                        <span className="waitlist-admin-name">{w.name}</span>
                        <span className="waitlist-admin-email">{w.email}</span>
                        {w.phone && <span className="waitlist-admin-phone">{w.phone}</span>}
                      </div>
                      <span className={`waitlist-admin-status waitlist-status-badge-${w.status}`}>{w.status}</span>
                    </div>
                    <div className="waitlist-admin-details">
                      {w.university && <span><strong>University:</strong> {w.university}</span>}
                      {w.year_of_study && <span><strong>Year:</strong> {w.year_of_study}</span>}
                      {w.country && <span><strong>Country:</strong> {w.country}</span>}
                      <span><strong>Applied:</strong> {new Date(w.submitted_at).toLocaleDateString()}</span>
                    </div>
                    {w.reason && (
                      <div className="waitlist-admin-reason">
                        <strong>Why they want access:</strong> {w.reason}
                      </div>
                    )}
                    {w.status === 'pending' && (
                      <div className="waitlist-admin-actions">
                        <button
                          className="waitlist-approve-btn"
                          disabled={waitlistAction === w.id + '_approve'}
                          onClick={() => handleWaitlistApprove(w.id)}
                        >
                          {waitlistAction === w.id + '_approve' ? 'Approving...' : '✓ Approve & Grant Access'}
                        </button>
                        <button
                          className="waitlist-reject-btn"
                          disabled={waitlistAction === w.id + '_reject'}
                          onClick={() => handleWaitlistReject(w.id)}
                        >
                          {waitlistAction === w.id + '_reject' ? 'Rejecting...' : '✕ Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'feedback' && (
        <div className="admin-content">
          <div className="feedback-admin-section">
            <h3 className="access-title">Student Feedback</h3>
            <p className="access-subtitle">{feedbackList.length} response{feedbackList.length !== 1 ? 's' : ''} collected after 30 min of platform use.</p>
            {feedbackList.length === 0 ? (
              <p className="access-empty">No feedback submitted yet.</p>
            ) : (
              <div className="feedback-admin-list">
                {feedbackList.map(f => (
                  <div key={f.id} className="feedback-admin-row">
                    <div className="feedback-admin-meta">
                      <span className="feedback-admin-name">{f.name || 'Unknown'}</span>
                      <span className="feedback-admin-email">{f.email}</span>
                      <span className="feedback-admin-date">{new Date(f.submitted_at).toLocaleDateString()}</span>
                      <span className="feedback-admin-stars">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                    </div>
                    <div className="feedback-admin-answers">
                      {f.q1 && <div className="feedback-admin-answer"><span className="feedback-admin-q">Why using platform:</span> {f.q1}</div>}
                      {f.q2 && <div className="feedback-admin-answer"><span className="feedback-admin-q">Most valuable:</span> {f.q2}</div>}
                      {f.q3 && <div className="feedback-admin-answer"><span className="feedback-admin-q">vs. other resources:</span> {f.q3}</div>}
                      {f.comment && <div className="feedback-admin-answer"><span className="feedback-admin-q">Would change:</span> <em>"{f.comment}"</em></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'chatlogs' && (
        <div className="admin-content">
          <div className="cl-header">
            <h3 className="access-title">Chat Logs</h3>
            <input
              className="cl-search"
              placeholder="Filter by student or subject…"
              value={chatFilter}
              onChange={e => setChatFilter(e.target.value)}
            />
          </div>
          {chatLogsLoading && <div className="admin-empty">Loading…</div>}
          {!chatLogsLoading && (
            <div className="cl-list">
              {chatLogs
                .filter(l => !chatFilter || l.name.toLowerCase().includes(chatFilter.toLowerCase()) || l.subject_name.toLowerCase().includes(chatFilter.toLowerCase()))
                .map((l, i) => {
                  const isOpen = chatThread?.studentId === l.student_id && chatThread?.subjectId === l.subject_id;
                  return (
                    <div key={i} className="cl-row">
                      <div className="cl-row-top" onClick={() => isOpen ? setChatThread(null) : loadChatThread(l.student_id, l.subject_id)}>
                        <div className="cl-avatar">{l.name.charAt(0).toUpperCase()}</div>
                        <div className="cl-info">
                          <div className="cl-name">{l.name}</div>
                          <div className="cl-email">{l.email}</div>
                        </div>
                        <div className="cl-subject-pill" style={{ background: l.subject_color + '18', color: l.subject_color, border: `1px solid ${l.subject_color}44` }}>
                          {l.subject_name}
                        </div>
                        <div className="cl-meta">
                          <span>{l.message_count} msgs</span>
                          <span className="cl-dot">·</span>
                          <span>{new Date(l.last_message_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className={`cl-chevron ${isOpen ? 'open' : ''}`}>›</div>
                      </div>
                      {isOpen && (
                        <div className="cl-thread">
                          {chatThreadLoading && <div className="admin-empty" style={{ padding: '12px 0' }}>Loading thread…</div>}
                          {!chatThreadLoading && chatThread?.messages.map((msg, mi) => (
                            <div key={mi} className={`cl-msg cl-msg--${msg.role}`}>
                              <div className="cl-msg-role">{msg.role === 'user' ? l.name.split(' ')[0] : 'AI Tutor'}</div>
                              <div className="cl-msg-content">{msg.content}</div>
                              <div className="cl-msg-time">{new Date(msg.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              {chatLogs.length === 0 && !chatLogsLoading && <div className="admin-empty">No conversations yet.</div>}
            </div>
          )}
        </div>
      )}

      {tab === 'studyplans' && (
        <div className="admin-content">
          <h3 className="access-title">Study Plans</h3>
          <p className="access-subtitle">{studyPlans.length} student{studyPlans.length !== 1 ? 's' : ''} with active plans</p>
          {studyPlansLoading && <div className="admin-empty">Loading…</div>}
          {!studyPlansLoading && (
            <div className="sp-admin-list">
              {studyPlans.length === 0 && <div className="admin-empty">No study plans generated yet.</div>}
              {studyPlans.map(st => {
                const isOpen = expandedPlan === st.student_id;
                const weeks = [];
                for (let i = 0; i < st.plan.length; i += 7) weeks.push(st.plan.slice(i, i + 7));
                return (
                  <div key={st.student_id} className="sp-admin-row">
                    <div className="sp-admin-top" onClick={() => setExpandedPlan(isOpen ? null : st.student_id)}>
                      <div className="cl-avatar" style={{ background: st.avatar_color || '#00A896' }}>{st.name.charAt(0).toUpperCase()}</div>
                      <div className="cl-info">
                        <div className="cl-name">{st.name}</div>
                        <div className="cl-email">{st.career_title || 'No career set'}</div>
                      </div>
                      <div className="sp-admin-stats">
                        <span className="sp-admin-pct">{st.pct}%</span>
                        <div className="sp-admin-bar-track">
                          <div className="sp-admin-bar-fill" style={{ width: `${st.pct}%` }} />
                        </div>
                        <span className="sp-admin-detail">{st.covered_concepts}/{st.total_concepts} concepts</span>
                        {st.overdue_concepts > 0 && <span className="sp-admin-overdue">{st.overdue_concepts} overdue</span>}
                      </div>
                      <div className={`cl-chevron ${isOpen ? 'open' : ''}`}>›</div>
                    </div>
                    {isOpen && (
                      <div className="sp-admin-plan">
                        {weeks.map((week, wi) => (
                          <div key={wi} className="sp-admin-week">
                            <div className="sp-admin-week-label">Week {wi + 1}</div>
                            <div className="sp-admin-week-grid">
                              {week.map(day => {
                                const allDone = day.concepts.every(c => c.covered);
                                const anyDone = day.concepts.some(c => c.covered);
                                const isOverdue = new Date(day.target_date) < new Date() && !allDone;
                                return (
                                  <div key={day.day} className={`sp-admin-day ${allDone ? 'done' : isOverdue ? 'overdue' : anyDone ? 'partial' : ''}`}>
                                    <div className="sp-admin-day-num">Day {day.day}</div>
                                    <div className="sp-admin-day-date">{new Date(day.target_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                    {day.concepts.map((c, ci) => {
                                      const subj = SUBJECTS.find(s => s.id === c.subject_id);
                                      return (
                                        <div key={ci} className={`sp-admin-concept ${c.covered ? 'covered' : ''}`}>
                                          <span className="sp-admin-dot" style={{ background: c.covered ? '#16c1ad' : (subj?.color || '#ccc') }} />
                                          <span>{c.concept_id.replace(/_/g, ' ')}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'export' && (
        <div className="admin-content">
          <h3 className="access-title">Export Data</h3>
          <p className="access-subtitle">Download platform data as CSV for external analysis or reporting.</p>
          <div className="export-cards">
            <div className="export-card">
              <div className="export-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <div className="export-card-body">
                <div className="export-card-title">Student Roster</div>
                <div className="export-card-desc">Name, email, career, college, city, streak, concepts covered &amp; mastered, last active date for every learner.</div>
                <div className="export-card-cols">Columns: Name · Email · Joined · Career · College · Year · City · State · Streak · Last Active · Covered · Mastered · Messages · Subjects</div>
              </div>
              <button className="export-btn" onClick={() => downloadCSV('export/students', 'bversity_students.csv')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download CSV
              </button>
            </div>

            <div className="export-card">
              <div className="export-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
              </div>
              <div className="export-card-body">
                <div className="export-card-title">Concept Progress</div>
                <div className="export-card-desc">Every concept covered by every student, with first covered date and mastered date. Use this for deep learning analytics.</div>
                <div className="export-card-cols">Columns: Student · Email · Subject · Concept · First Covered · Mastered At</div>
              </div>
              <button className="export-btn" onClick={() => downloadCSV('export/progress', 'bversity_progress.csv')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'announce' && (
        <div className="admin-content">
          <h3 className="access-title">Broadcast Announcement</h3>
          <p className="access-subtitle">Send an email announcement to your learners. Delivered via Resend using your configured sender.</p>
          {announceSent && <div className="announce-success">{announceSent}</div>}
          <form className="announce-form" onSubmit={sendAnnouncement}>
            <div className="announce-target-row">
              <label className="announce-label">Send to</label>
              <div className="announce-target-pills">
                {[
                  { value: 'all', label: 'All students' },
                  { value: 'active_week', label: 'Active this week' },
                  { value: 'bioinformatics_scientist', label: 'Bioinformatics' },
                  { value: 'genomics_data_analyst', label: 'Genomics' },
                  { value: 'drug_discovery_scientist', label: 'Drug Discovery' },
                  { value: 'clinical_data_manager', label: 'Clinical Trials' },
                  { value: 'ml_biotech_engineer', label: 'GenAI / ML' },
                  { value: 'biotech_business_analyst', label: 'Biotech Business' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`announce-pill ${announceForm.target === opt.value ? 'active' : ''}`}
                    onClick={() => { setAnnounceForm(f => ({ ...f, target: opt.value })); loadAnnouncePreview(opt.value); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {announcePreview && (
                <div className="announce-preview-count">
                  <strong>{announcePreview.count}</strong> student{announcePreview.count !== 1 ? 's' : ''} will receive this
                  {announcePreview.sample_names.length > 0 && (
                    <span className="announce-preview-names"> · {announcePreview.sample_names.join(', ')}{announcePreview.count > 5 ? '…' : ''}</span>
                  )}
                </div>
              )}
            </div>
            <div className="announce-field">
              <label className="announce-label">Subject line</label>
              <input
                className="announce-input"
                placeholder="e.g. New content available: CRISPR module updated"
                value={announceForm.subject}
                onChange={e => setAnnounceForm(f => ({ ...f, subject: e.target.value }))}
                required
              />
            </div>
            <div className="announce-field">
              <label className="announce-label">Message</label>
              <textarea
                className="announce-textarea"
                placeholder="Write your announcement here. Keep it clear and actionable."
                rows={6}
                value={announceForm.message}
                onChange={e => setAnnounceForm(f => ({ ...f, message: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="announce-send-btn" disabled={announceSending || !announceForm.subject.trim() || !announceForm.message.trim()}>
              {announceSending ? 'Sending…' : `Send to ${announcePreview?.count ?? '…'} student${announcePreview?.count !== 1 ? 's' : ''}`}
            </button>
          </form>
        </div>
      )}

      {tab === 'images' && (
        <div className="admin-content">
          <h3 className="access-title">Image Library</h3>
          <p className="access-subtitle">Manage every image used across the platform. Paste any public image URL (Unsplash, your CDN, Google Drive public link) and hit Save  -  updates take effect immediately on next page load.</p>
          {!imageConfig ? (
            <div className="img-lib-loading">Loading image config…</div>
          ) : (
            <>
              {[
                { section: 'careers',  title: 'Career Path Images', subtitle: 'Shown on career selection cards, the career detail modal, and the career hero page' },
                { section: 'clusters', title: 'Cluster Fallback Images', subtitle: 'Used as a fallback when no career-specific image is set' },
                { section: 'degrees',  title: 'Degree Program Images', subtitle: 'Banner image on the M.Sc and B.Sc degree cards' },
              ].map(({ section, title, subtitle }) => (
                <div key={section} className="img-lib-section">
                  <div className="img-lib-section-header">
                    <div className="img-lib-section-title">{title}</div>
                    <div className="img-lib-section-sub">{subtitle}</div>
                  </div>
                  <div className="img-lib-grid">
                    {Object.entries(imageConfig[section] || {}).map(([key, val]) => {
                      const editKey = `${section}__${key}`;
                      const currentUrl = imageEdits[editKey] ?? val.url;
                      const saved = imageSaved[editKey];
                      const saving = imageSaving[editKey];
                      return (
                        <div key={key} className="img-lib-item">
                          <div
                            className="img-lib-thumb"
                            style={{ backgroundImage: `url(${currentUrl})` }}
                          />
                          <div className="img-lib-label">{val.label}</div>
                          <div className="img-lib-key">{key}</div>
                          <div className="img-lib-row">
                            <input
                              className="img-lib-input"
                              value={currentUrl}
                              onChange={e => setImageEdits(ed => ({ ...ed, [editKey]: e.target.value }))}
                              placeholder="https://..."
                            />
                            <button
                              className={`img-lib-save ${saved ? 'saved' : ''}`}
                              onClick={() => saveImage(section, key)}
                              disabled={saving}
                            >
                              {saving ? '…' : saved ? '✓' : 'Save'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'system' && (
        <div className="admin-content">
          <h3 className="access-title">System Health & Capacity</h3>
          <p className="access-subtitle">Live view of server resources and platform limits. Use this to know when to scale up.</p>
          {systemHealthLoading && <div className="sys-loading">Loading…</div>}
          {systemHealth && (() => {
            const { disk, memory, db, students, messages, limits } = systemHealth;
            function Gauge({ label, used, total, unit, softLimit, note, color }) {
              const pct = Math.min(100, Math.round(used / total * 100));
              const atSoft = softLimit && (used / total * 100) >= softLimit;
              const status = pct >= 85 ? 'red' : pct >= 60 ? 'amber' : 'green';
              const c = color || (status === 'red' ? '#ef4444' : status === 'amber' ? '#f59e0b' : '#10b981');
              return (
                <div className="sys-gauge">
                  <div className="sys-gauge-header">
                    <span className="sys-gauge-label">{label}</span>
                    <span className="sys-gauge-val" style={{ color: c }}>{used}{unit} <span className="sys-gauge-of">/ {total}{unit}</span></span>
                  </div>
                  <div className="sys-gauge-track">
                    <div className="sys-gauge-fill" style={{ width: `${pct}%`, background: c }} />
                    {softLimit && <div className="sys-gauge-soft-mark" style={{ left: `${softLimit}%` }} />}
                  </div>
                  <div className="sys-gauge-meta">
                    <span className="sys-gauge-pct">{pct}% used</span>
                    {note && <span className="sys-gauge-note">{note}</span>}
                  </div>
                  {atSoft && <div className="sys-gauge-warn">⚠ Approaching limit  -  consider upgrading</div>}
                </div>
              );
            }
            return (
              <div className="sys-grid">
                <div className="sys-section">
                  <div className="sys-section-title">Server Resources</div>
                  <Gauge label="Disk Storage" used={disk.used_gb} total={disk.total_gb} unit="GB"
                    softLimit={Math.round(limits.storage_upgrade.value / disk.total_gb * 100)}
                    note={limits.storage_upgrade.note} />
                  <Gauge label="Memory (RAM)" used={memory.used_gb} total={memory.total_gb} unit="GB"
                    softLimit={limits.memory_upgrade.value}
                    note={limits.memory_upgrade.note} />
                  <div className="sys-stat-row">
                    <span className="sys-stat-label">Database size</span>
                    <span className="sys-stat-val">{db.size_mb} MB</span>
                  </div>
                </div>

                <div className="sys-section">
                  <div className="sys-section-title">Students</div>
                  <Gauge label="Total registered" used={students.total} total={students.hard_limit} unit=""
                    softLimit={Math.round(students.soft_limit / students.hard_limit * 100)}
                    note="SQLite handles ~500 well. Above 1,000  -  migrate to Postgres." />
                  <div className="sys-stat-row">
                    <span className="sys-stat-label">Active today</span>
                    <span className="sys-stat-val">{students.active_today}</span>
                  </div>
                  <div className="sys-info-box">
                    <strong>Concurrent users limit:</strong> ~{limits.concurrent_users.value} at once<br/>
                    <span className="sys-info-note">{limits.concurrent_users.note}</span>
                  </div>
                </div>

                <div className="sys-section">
                  <div className="sys-section-title">Messages & API</div>
                  <Gauge label="Messages today" used={messages.today} total={messages.daily_hard_limit} unit=""
                    softLimit={Math.round(messages.daily_soft_limit / messages.daily_hard_limit * 100)}
                    note={`Anthropic rate limit: ~${limits.api_rpm.value} req/min. ${limits.api_rpm.note}`} />
                  <div className="sys-stat-row">
                    <span className="sys-stat-label">Total messages (all time)</span>
                    <span className="sys-stat-val">{messages.total.toLocaleString()}</span>
                  </div>
                  <div className="sys-info-box">
                    <strong>Email (Resend free tier):</strong><br/>
                    <span className="sys-info-note">{limits.email_daily.note}</span>
                  </div>
                </div>

                <div className="sys-section sys-section--upgrade">
                  <div className="sys-section-title">When to upgrade</div>
                  {[
                    { threshold: '25+ concurrent users',  action: 'Upgrade DigitalOcean droplet to 4GB RAM + 2 vCPU ($24/mo)' },
                    { threshold: '500+ students',         action: 'Migrate database from SQLite → Postgres (add managed DB on DigitalOcean)' },
                    { threshold: '1,000+ messages/day',   action: 'Upgrade Anthropic API tier or add request queuing' },
                    { threshold: '100+ emails/day',       action: 'Upgrade Resend to paid plan ($20/mo for 50k emails)' },
                    { threshold: '15GB+ disk used',       action: 'Resize droplet disk or move file uploads to object storage (Spaces/S3)' },
                  ].map(({ threshold, action }) => (
                    <div key={threshold} className="sys-upgrade-row">
                      <span className="sys-upgrade-trigger">At {threshold}:</span>
                      <span className="sys-upgrade-action">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          {systemHealth && (
            <button className="sys-refresh-btn" onClick={loadSystemHealth}>↻ Refresh</button>
          )}
        </div>
      )}

      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function StudyPlanSection({ planDays, spWeeks, spDoneDays, spTotalConcepts, spCoveredConcepts, spPct, spOverdueDays, lagDays, lagConcepts, today, onStudy }) {
  const [expandedWeeks, setExpandedWeeks] = React.useState(() => {
    // Auto-expand only the current week
    const todayStr = today.toDateString();
    const currentWeekIdx = spWeeks.findIndex(week =>
      week.some(d => new Date(d.target_date).toDateString() === todayStr) ||
      week.some(d => new Date(d.target_date) >= today)
    );
    return new Set([currentWeekIdx === -1 ? 0 : currentWeekIdx]);
  });

  function toggleWeek(wi) {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      next.has(wi) ? next.delete(wi) : next.add(wi);
      return next;
    });
  }

  // Today's day entry
  const todayEntry = planDays.find(d => new Date(d.target_date).toDateString() === today.toDateString());
  // Next uncovered upcoming day
  const nextEntry = !todayEntry && planDays.find(d => new Date(d.target_date) > today && !d.concepts.every(c => c.covered));

  return (
    <div className="sp-section">

      {/* ── Header ── */}
      <div className="sp-progress-header">
        <div className="sp-progress-top">
          <h2 className="sp-title">Study Plan</h2>
          <div className="sp-progress-stats">
            <span><strong>{spCoveredConcepts}</strong> / {spTotalConcepts} concepts</span>
            <span className="sp-stat-sep">·</span>
            <span><strong>{spDoneDays}</strong> / {planDays.length} days</span>
            <span className="sp-stat-sep">·</span>
            {lagDays >= 1
              ? <span className="sp-behind-chip">{lagDays}d behind</span>
              : <span className="sp-ontrack-chip">On track ✓</span>
            }
          </div>
        </div>
        <div className="sp-progress-track">
          <div className="sp-progress-fill" style={{ width: `${spPct}%` }} />
        </div>
        <div className="sp-progress-pct">{spPct}% complete</div>
      </div>

      {/* ── Today focus card ── */}
      {(todayEntry || (lagDays >= 1 && spOverdueDays.length > 0)) && (
        <div className="sp-focus-area">
          {lagDays >= 1 && spOverdueDays.length > 0 && (
            <div className="sp-catchup-strip">
              <span className="sp-catchup-strip-icon">⚡</span>
              <span><strong>{lagConcepts} concept{lagConcepts !== 1 ? 's' : ''} overdue.</strong> Catch up by studying these first.</span>
              <div className="sp-catchup-pills">
                {spOverdueDays.slice(0, 3).flatMap(d => d.concepts.filter(c => !c.covered)).slice(0, 4).map(c => {
                  const subj = SUBJECTS.find(s => s.id === c.subject_id);
                  return (
                    <button key={c.concept_id} className="sp-catchup-pill"
                      style={{ '--pill-color': subj?.color || '#888' }}
                      onClick={() => subj && onStudy(subj)}>
                      {c.concept_name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {todayEntry && (
            <div className="sp-today-card">
              <div className="sp-today-left">
                <div className="sp-today-label">Today</div>
                <div className="sp-today-date">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                <div className="sp-today-concepts">
                  {todayEntry.concepts.map(c => {
                    const subj = SUBJECTS.find(s => s.id === c.subject_id);
                    return (
                      <div key={c.concept_id} className={`sp-today-concept ${c.covered ? 'done' : ''}`}>
                        <span className="sp-today-check">{c.covered ? '✓' : '○'}</span>
                        <span className="sp-today-concept-name">{c.concept_name}</span>
                        {subj && <span className="sp-today-subject-pill" style={{ background: subj.color + '22', color: subj.color }}>{subj.name.split(' ').slice(0, 2).join(' ')}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <button className="sp-today-cta" onClick={() => {
                const firstUncovered = todayEntry.concepts.find(c => !c.covered);
                const subj = SUBJECTS.find(s => s.id === (firstUncovered || todayEntry.concepts[0])?.subject_id);
                if (subj) onStudy(subj);
              }}>
                {todayEntry.concepts.every(c => c.covered) ? 'Review today →' : 'Study now →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Weeks ── */}
      <div className="sp-weeks-list">
        {spWeeks.map((week, wi) => {
          const weekCovered = week.reduce((s, d) => s + d.concepts.filter(c => c.covered).length, 0);
          const weekTotal   = week.reduce((s, d) => s + d.concepts.length, 0);
          const weekDone    = week.every(d => d.concepts.every(c => c.covered));
          const isExpanded  = expandedWeeks.has(wi);
          const hasToday    = week.some(d => new Date(d.target_date).toDateString() === today.toDateString());
          const hasOverdue  = week.some(d => {
            const dd = new Date(d.target_date);
            return dd < new Date(today.toDateString()) && !d.concepts.every(c => c.covered);
          });
          const weekStart = new Date(week[0].target_date);
          const weekEnd   = new Date(week[week.length - 1].target_date);
          const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

          // Get unique subjects in this week
          const weekSubjects = [...new Set(week.flatMap(d => d.concepts.map(c => c.subject_id)))]
            .map(sid => SUBJECTS.find(s => s.id === sid)).filter(Boolean);

          return (
            <div key={wi} className={`sp-week-row ${isExpanded ? 'expanded' : ''} ${hasToday ? 'current' : ''}`}>
              <button className="sp-week-header" onClick={() => toggleWeek(wi)}>
                <div className="sp-week-header-left">
                  <span className="sp-week-num">Week {wi + 1}</span>
                  <span className="sp-week-range">{weekRange}</span>
                  <div className="sp-week-subject-dots">
                    {weekSubjects.slice(0, 4).map(s => (
                      <span key={s.id} className="sp-week-dot" style={{ background: s.color }} title={s.name} />
                    ))}
                  </div>
                </div>
                <div className="sp-week-header-right">
                  {weekDone
                    ? <span className="sp-week-chip done">Complete ✓</span>
                    : hasOverdue
                      ? <span className="sp-week-chip overdue">Has overdue</span>
                      : hasToday
                        ? <span className="sp-week-chip today">This week</span>
                        : <span className="sp-week-chip upcoming">{weekCovered}/{weekTotal} concepts</span>
                  }
                  <span className="sp-week-chevron">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="sp-week-days">
                  {week.map(day => {
                    const dayDate   = new Date(day.target_date);
                    const isPast    = dayDate < new Date(today.toDateString());
                    const isToday   = dayDate.toDateString() === today.toDateString();
                    const allCovered = day.concepts.every(c => c.covered);
                    const isOverdue  = isPast && !allCovered;
                    const status     = allCovered ? 'done' : isToday ? 'today' : isOverdue ? 'overdue' : 'upcoming';
                    const firstSubj  = SUBJECTS.find(s => s.id === day.concepts[0]?.subject_id);

                    return (
                      <div key={day.day} className={`sp-day-row sp-day-row--${status}`} style={{ '--day-color': firstSubj?.color || '#888' }}>
                        <div className="sp-day-row-left">
                          <div className="sp-day-row-date">
                            <span className="sp-day-row-dow">{isToday ? 'Today' : dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="sp-day-row-dm">{dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="sp-day-row-concepts">
                            {day.concepts.map(c => {
                              const subj = SUBJECTS.find(s => s.id === c.subject_id);
                              return (
                                <div key={c.concept_id}
                                  className={`sp-day-concept-item ${c.covered ? 'done' : ''} ${subj ? 'clickable' : ''}`}
                                  onClick={() => subj && onStudy(subj)}>
                                  <span className="sp-day-concept-check">{c.covered ? '✓' : '·'}</span>
                                  <span className="sp-day-concept-name">{c.concept_name}</span>
                                  {subj && <span className="sp-day-concept-subj" style={{ color: subj.color }}>{subj.name.split(':')[0].trim()}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="sp-day-row-right">
                          {status === 'done' && <span className="sp-day-status-badge done">✓</span>}
                          {status === 'overdue' && <span className="sp-day-status-badge overdue">Late</span>}
                          {status === 'today' && (
                            <button className="sp-day-study-btn" onClick={() => {
                              const firstUncovered = day.concepts.find(c => !c.covered);
                              const subj = SUBJECTS.find(s => s.id === (firstUncovered || day.concepts[0])?.subject_id);
                              if (subj) onStudy(subj);
                            }}>Study →</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Concept Library ────────────────────────────────────────────────────────

function ConceptLibraryView({ student }) {
  const [cards, setCards]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    fetch(`/api/saved-concepts/${student.id}`)
      .then(r => r.json())
      .then(data => { setCards(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [student.id]);

  async function handleUnsave(id) {
    await fetch(`/api/saved-concepts/${student.id}/${id}`, { method: 'DELETE' });
    setCards(prev => prev.filter(c => c.id !== id));
  }

  const subjectIds = [...new Set(cards.map(c => c.subject_id))];

  const filtered = cards.filter(c => {
    const matchesSubject = filterSubject === 'all' || c.subject_id === filterSubject;
    const matchesSearch  = !search || c.title.toLowerCase().includes(search.toLowerCase())
      || (c.card_data?.what || '').toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const grouped = subjectIds
    .filter(sid => filterSubject === 'all' || sid === filterSubject)
    .map(sid => ({
      sid,
      subject: SUBJECTS_BY_ID[sid],
      items: filtered.filter(c => c.subject_id === sid),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="lib-view">
      <div className="lib-header">
        <div>
          <h1 className="lib-title">Concept Library</h1>
          <p className="lib-sub">{cards.length} concept{cards.length !== 1 ? 's' : ''} saved across {subjectIds.length} subject{subjectIds.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="lib-controls">
          <div className="lib-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="lib-search"
              placeholder="Search concepts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="lib-filter" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
            <option value="all">All subjects</option>
            {subjectIds.map(sid => (
              <option key={sid} value={sid}>{SUBJECTS_BY_ID[sid]?.name || sid}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="lib-empty">Loading your library…</div>
      ) : cards.length === 0 ? (
        <div className="lib-empty">
          <div className="lib-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </div>
          <div className="lib-empty-title">No saved concepts yet</div>
          <div className="lib-empty-sub">When your expert introduces a concept during a session, tap the bookmark icon on the card to save it here.</div>
        </div>
      ) : grouped.length === 0 ? (
        <div className="lib-empty">No concepts match your search.</div>
      ) : (
        <div className="lib-groups">
          {grouped.map(({ sid, subject, items }) => (
            <div key={sid} className="lib-group">
              <div className="lib-group-header">
                <span className="lib-group-dot" style={{ background: subject?.color || 'var(--teal)' }} />
                <span className="lib-group-name">{subject?.name || sid}</span>
                <span className="lib-group-count">{items.length}</span>
              </div>
              <div className="lib-cards">
                {items.map(item => (
                  <LibConceptCard
                    key={item.id}
                    item={item}
                    color={subject?.color}
                    onUnsave={() => handleUnsave(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LibConceptCard({ item, color, onUnsave }) {
  const c = color || '#16c1ad';
  const [collapsed, setCollapsed] = useState(true);
  const data = item.card_data;

  return (
    <div className={`concept-card lib-concept-card${collapsed ? ' concept-card--collapsed' : ''}`} style={{ '--cc-color': c }}>
      <div className="concept-card-header" onClick={() => setCollapsed(v => !v)} style={{ cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span className="concept-card-label-top" style={{ color: c }}>Concept</span>
        <span className="concept-card-title">{data.title}</span>
        <div className="concept-card-header-actions" onClick={e => e.stopPropagation()}>
          <button className="cc-save-btn saved" onClick={onUnsave} title="Remove from library">
            <svg width="13" height="13" viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
          <button className="cc-collapse-btn" onClick={() => setCollapsed(v => !v)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? <polyline points="6 9 12 15 18 9"/> : <polyline points="18 15 12 9 6 15"/>}
            </svg>
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="concept-card-body">
          {data.what && <div className="concept-card-row"><span className="concept-card-row-label">What it is</span><span className="concept-card-row-text">{data.what}</span></div>}
          {data.why && <div className="concept-card-row"><span className="concept-card-row-label">Why it matters</span><span className="concept-card-row-text">{data.why}</span></div>}
          {data.how && data.how.length > 0 && (
            <div className="concept-card-row">
              <span className="concept-card-row-label">How it works</span>
              <ul className="concept-card-how">{data.how.map((pt, i) => <li key={i}>{formatInline(pt)}</li>)}</ul>
            </div>
          )}
          {data.example && <div className="concept-card-row"><span className="concept-card-row-label">Real example</span><span className="concept-card-row-text concept-card-example">{data.example}</span></div>}
          {data.remember && (
            <div className="concept-card-remember" style={{ borderColor: c + '40', background: c + '0d' }}>
              <span className="concept-card-remember-star" style={{ color: c }}>★</span>
              <span>{data.remember}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Founder Contact Modal ──────────────────────────────────────────────────

const CONTACT_REASONS = [
  'I have a question about the curriculum',
  'I\'m stuck and need help',
  'I have feedback or a suggestion',
  'Something isn\'t working',
];

function FounderContactModal({ student, onClose }) {
  const [reason, setReason]     = useState('');
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  async function handleSubmit() {
    if (!reason || !message.trim()) return;
    setSending(true);
    try {
      await fetch('/api/contact-founder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name:  student.name,
          student_email: student.email,
          reason,
          message: message.trim(),
        }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="founder-modal-overlay" onClick={onClose}>
      <div className="founder-modal" onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className="founder-modal-sent">
            <div className="founder-sent-icon">✓</div>
            <h3>Sent to Sudharsan</h3>
            <p>He'll reply to your email within 24 hours.</p>
            <button className="founder-close-btn" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="founder-modal-header">
              <div>
                <p className="founder-modal-eyebrow">Direct message</p>
                <h3 className="founder-modal-title">Talk to Sudharsan</h3>
                <p className="founder-modal-sub">Co-founder of Bversity · replies within 24h</p>
              </div>
              <button className="founder-modal-x" onClick={onClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="founder-modal-body">
              <p className="founder-field-label">What's this about?</p>
              <div className="founder-reasons">
                {CONTACT_REASONS.map(r => (
                  <button
                    key={r}
                    className={`founder-reason-btn${reason === r ? ' selected' : ''}`}
                    onClick={() => setReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <p className="founder-field-label">Your message</p>
              <textarea
                className="founder-textarea"
                placeholder="Write anything  -  there's no wrong way to say it."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
              />

              <button
                className="founder-submit-btn"
                onClick={handleSubmit}
                disabled={!reason || !message.trim() || sending}
              >
                {sending ? 'Sending…' : 'Send message →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function IndustryLabsView({ student, onOpenProject }) {
  const [labProgress, setLabProgress] = useState({});

  useEffect(() => {
    fetch(`/api/labs/${student.id}`)
      .then(r => r.json())
      .then(data => setLabProgress(data || {}))
      .catch(() => {});
  }, [student.id]);

  return (
    <div className="labs-view">
      <div className="labs-header">
        <div>
          <h1 className="labs-title">Industry Innovation Labs</h1>
          <p className="labs-sub">Real-world challenges built from actual research, clinical data, and industry tools</p>
        </div>
      </div>
      <div className="labs-grid">
        {INDUSTRY_LABS.map(subjectLabs => {
          const subject = SUBJECTS.find(s => s.id === subjectLabs.subject_id);
          if (!subject) return null;
          return (
            <div key={subjectLabs.subject_id} className="labs-subject-block">
              <div className="labs-subject-header">
                <span className="labs-subject-dot" style={{ background: subject.color }} />
                <span className="labs-subject-name">{subject.name}</span>
              </div>
              <div className="labs-project-cards">
                {subjectLabs.projects.map(proj => {
                  const progress = labProgress[proj.id];
                  const isCompleted = progress?.status === 'completed';
                  const isStarted = !!progress && !isCompleted;
                  const stepsDone = progress?.steps_done?.length || 0;
                  return (
                    <div
                      key={proj.id}
                      className={`labs-project-card${isCompleted ? ' labs-project-card--done' : ''}`}
                      style={{ '--lab-color': subject.color }}
                      onClick={() => onOpenProject(proj, subject)}
                    >
                      <div className="labs-project-top">
                        <span className={`labs-status-badge${isCompleted ? ' done' : isStarted ? ' active' : ''}`}>
                          {isCompleted ? 'Completed' : isStarted ? `${stepsDone}/${proj.steps.length} steps` : 'Not started'}
                        </span>
                        <div className="labs-project-meta">
                          <span>{proj.time}</span>
                          <span className="labs-meta-dot">·</span>
                          <span>{proj.difficulty}</span>
                        </div>
                      </div>
                      <h3 className="labs-project-title">{proj.title}</h3>
                      <div className="labs-realworld-tag">
                        <span className="labs-realworld-dot" />
                        Real-world evidence
                      </div>
                      <p className="labs-project-scenario">{proj.scenario.slice(0, 120)}…</p>
                      <div className="labs-project-tools">
                        {proj.tools.slice(0, 3).map(t => (
                          <span key={t.name} className="labs-tool-chip">{t.name}</span>
                        ))}
                        {proj.tools.length > 3 && <span className="labs-tool-chip labs-tool-more">+{proj.tools.length - 3}</span>}
                      </div>
                      <div className="labs-project-cta">
                        {isCompleted ? 'Review →' : isStarted ? 'Continue →' : 'Begin project →'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LabProjectView({ student, project, subject, onBack }) {
  const [labProgress, setLabProgress] = useState(null);
  const [hintOpen, setHintOpen]       = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [feedback, setFeedback]       = useState(null);
  const [showWhatsNext, setShowWhatsNext] = useState(false);

  // file upload
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  // AI assistant sidebar
  const [assistOpen, setAssistOpen]       = useState(false);
  const [assistMessages, setAssistMessages] = useState([]);
  const [assistInput, setAssistInput]     = useState('');
  const [assistLoading, setAssistLoading] = useState(false);
  const assistEndRef = useRef(null);
  const assistInputRef = useRef(null);

  // scroll-to-top ref
  const viewRef = useRef(null);

  useEffect(() => {
    if (viewRef.current) viewRef.current.scrollTop = 0;
  }, [project.id]);

  useEffect(() => {
    fetch(`/api/labs/${student.id}`)
      .then(r => r.json())
      .then(data => {
        const prog = data[project.id] || null;
        setLabProgress(prog);
        if (prog?.ai_feedback) { setFeedback(prog.ai_feedback); setShowWhatsNext(true); }
      })
      .catch(() => {});
  }, [student.id, project.id]);

  useEffect(() => {
    assistEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistMessages]);

  const stepsDone  = new Set(labProgress?.steps_done || []);
  const isCompleted = labProgress?.status === 'completed';
  const allStepsDone = project.steps.every(s => stepsDone.has(s.id));
  const tutorFirstName = subject.tutor.split(' ')[1] || subject.tutor;

  async function toggleStep(stepId) {
    if (isCompleted) return;
    if (stepsDone.has(stepId)) {
      await fetch(`/api/labs/${student.id}/${project.id}/steps/${stepId}`, { method: 'DELETE' });
      setLabProgress(prev => ({
        ...(prev || {}),
        steps_done: (prev?.steps_done || []).filter(s => s !== stepId),
      }));
    } else {
      await fetch(`/api/labs/${student.id}/${project.id}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subject.id, step_id: stepId }),
      });
      setLabProgress(prev => ({
        ...(prev || {}),
        steps_done: [...(prev?.steps_done || []), stepId],
        status: 'in_progress',
      }));
    }
  }

  async function handleSubmitFile() {
    if (!uploadedFile || submitting) return;
    setSubmitting(true);
    const form = new FormData();
    form.append('file', uploadedFile);
    form.append('subject_id', subject.id);
    form.append('rubric', JSON.stringify(project.rubric));
    try {
      const res  = await fetch(`/api/labs/${student.id}/${project.id}/submit-file`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setFeedback(data.feedback);
      setLabProgress(prev => ({ ...(prev || {}), status: 'completed', ai_feedback: data.feedback }));
      setShowWhatsNext(true);
    } catch { /* no-op */ } finally {
      setSubmitting(false);
    }
  }

  async function openAssistant() {
    setAssistOpen(true);
    if (assistMessages.length === 0) {
      setAssistLoading(true);
      try {
        const res  = await fetch(`/api/labs/${student.id}/assist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject_id: subject.id,
            tutor_name: subject.tutor,
            tutor_role: subject.role,
            project_title: project.title,
            project_scenario: project.scenario,
            project_problem: project.problem,
            messages: [{ role: 'user', content: "Hi, I just opened this project. Can you introduce yourself and give me a quick overview of what I'm about to do?" }],
          }),
        });
        const data = await res.json();
        setAssistMessages([{ role: 'assistant', content: data.response }]);
      } catch { /* no-op */ } finally {
        setAssistLoading(false);
      }
    }
  }

  async function sendAssistMessage(e) {
    e && e.preventDefault();
    if (!assistInput.trim() || assistLoading) return;
    const userMsg = { role: 'user', content: assistInput };
    const updated = [...assistMessages, userMsg];
    setAssistMessages(updated);
    setAssistInput('');
    setAssistLoading(true);
    try {
      const res  = await fetch(`/api/labs/${student.id}/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subject.id,
          tutor_name: subject.tutor,
          tutor_role: subject.role,
          project_title: project.title,
          project_scenario: project.scenario,
          project_problem: project.problem,
          messages: updated,
        }),
      });
      const data = await res.json();
      setAssistMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch { /* no-op */ } finally {
      setAssistLoading(false);
    }
  }

  return (
    <div className={`lab-project-wrapper${assistOpen ? ' lab-with-sidebar' : ''}`}>

      {/* ── main content ── */}
      <div className="lab-project-view" ref={viewRef}>
        <div className="lab-project-topbar">
          <button className="lab-back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Industry Innovation Labs
          </button>
          <button
            className={`lab-expert-toggle${assistOpen ? ' active' : ''}`}
            style={{ borderColor: subject.color + '60', color: assistOpen ? '#fff' : subject.color, background: assistOpen ? subject.color : 'transparent' }}
            onClick={() => assistOpen ? setAssistOpen(false) : openAssistant()}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Ask {tutorFirstName}
          </button>
        </div>

        <div className="lab-project-hero" style={{ borderColor: subject.color + '40', background: subject.color + '08' }}>
          <div className="lab-project-hero-top">
            <div>
              <span className="lab-subject-tag" style={{ color: subject.color, background: subject.color + '18' }}>{subject.name}</span>
              <h1 className="lab-project-hero-title">{project.title}</h1>
            </div>
            <div className="lab-project-hero-meta">
              <span className="lab-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {project.time}
              </span>
              <span className="lab-meta-item">{project.difficulty}</span>
            </div>
          </div>
          <div className="lab-tools-row">
            {project.tools.map(t => (
              <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer" className="lab-tool-link" style={{ color: subject.color, borderColor: subject.color + '40' }}>
                {t.name} ↗
              </a>
            ))}
          </div>
        </div>

        <div className="lab-project-body">
          <div className="lab-section">
            <div className="lab-section-label">Scenario</div>
            <p className="lab-section-text">{project.scenario}</p>
          </div>
          <div className="lab-section">
            <div className="lab-section-label">Your challenge</div>
            <p className="lab-section-text">{project.problem}</p>
          </div>
          <div className="lab-section lab-section-row">
            <div className="lab-half">
              <div className="lab-section-label">Why this matters</div>
              <p className="lab-section-text">{project.why_it_matters}</p>
            </div>
            <div className="lab-half">
              <div className="lab-section-label">What you'll deliver</div>
              <p className="lab-section-text">{project.expected_output}</p>
            </div>
          </div>

          <div className="lab-steps-section">
            <div className="lab-section-label">Steps</div>
            <div className="lab-steps">
              {project.steps.map((step, i) => {
                const done        = stepsDone.has(step.id);
                const hintVisible = hintOpen[step.id];
                return (
                  <div key={step.id} className={`lab-step${done ? ' lab-step--done' : ''}`}>
                    <div className="lab-step-row">
                      <button
                        className={`lab-step-check${done ? ' checked' : ''}`}
                        style={done ? { background: subject.color, borderColor: subject.color } : { borderColor: subject.color + '60' }}
                        onClick={() => toggleStep(step.id)}
                        disabled={isCompleted}
                      >
                        {done && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                      <div className="lab-step-content">
                        <span className="lab-step-num">Step {i + 1}</span>
                        <p className="lab-step-text">{step.text}</p>
                      </div>
                      <button
                        className={`lab-hint-btn${hintVisible ? ' open' : ''}`}
                        onClick={() => setHintOpen(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                      >
                        I'm stuck
                      </button>
                    </div>
                    {hintVisible && (
                      <div className="lab-hint-box" style={{ borderColor: subject.color + '40', background: subject.color + '08' }}>
                        <span className="lab-hint-icon" style={{ color: subject.color }}>💡</span>
                        <p>{step.hint}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!isCompleted && (
            <div className="lab-submit-section">
              <div className="lab-section-label">Submit your work</div>
              <p className="lab-submit-hint">Upload your report, write-up, or analysis. We accept PDF, Word (.docx), or plain text files. Your work will be reviewed by AI against the rubric below.</p>
              <div className="lab-rubric">
                <div className="lab-rubric-label">Rubric</div>
                <ul className="lab-rubric-list">
                  {project.rubric.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.doc"
                style={{ display: 'none' }}
                onChange={e => setUploadedFile(e.target.files[0] || null)}
              />
              <div className="lab-upload-area" onClick={() => fileInputRef.current?.click()}>
                {uploadedFile ? (
                  <div className="lab-upload-selected">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={subject.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="lab-upload-filename">{uploadedFile.name}</span>
                    <button className="lab-upload-clear" onClick={e => { e.stopPropagation(); setUploadedFile(null); }}>×</button>
                  </div>
                ) : (
                  <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className="lab-upload-cta">Click to upload your work</span>
                    <span className="lab-upload-formats">PDF, DOCX, or TXT</span>
                  </>
                )}
              </div>
              <button
                className="lab-submit-btn"
                style={{ background: uploadedFile ? subject.color : undefined }}
                onClick={handleSubmitFile}
                disabled={!uploadedFile || submitting}
              >
                {submitting ? 'Reviewing your work…' : 'Submit for AI review →'}
              </button>
              {!allStepsDone && (
                <p className="lab-submit-note">You can submit before completing all steps, but checking off each one improves your feedback quality.</p>
              )}
            </div>
          )}

          {feedback && (
            <div className="lab-feedback-section">
              <div className="lab-feedback-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={subject.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span style={{ color: subject.color }}>AI Review Feedback</span>
              </div>
              <div className="lab-feedback-body" dangerouslySetInnerHTML={{ __html: feedback.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
            </div>
          )}

          {showWhatsNext && (
            <div className="lab-whats-next" style={{ borderColor: subject.color + '30', background: subject.color + '06' }}>
              <div className="lab-whats-next-title" style={{ color: subject.color }}>What's next</div>
              <ul className="lab-whats-next-list">
                {project.whats_next.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <button className="lab-back-to-labs" onClick={onBack}>← Back to all labs</button>
            </div>
          )}
        </div>
      </div>

      {/* ── AI assistant sidebar ── */}
      {assistOpen && (
        <div className="lab-assistant-panel" style={{ '--assist-color': subject.color }}>
          <div className="lab-assist-header">
            <div className="lab-assist-tutor">
              <div className="lab-assist-avatar" style={{ background: subject.color + '22', color: subject.color }}>
                {tutorFirstName[0]}
              </div>
              <div>
                <div className="lab-assist-name">{subject.tutor}</div>
                <div className="lab-assist-role">{subject.role}</div>
              </div>
            </div>
            <button className="lab-assist-close" onClick={() => setAssistOpen(false)}>×</button>
          </div>

          <div className="lab-assist-messages">
            {assistMessages.length === 0 && assistLoading && (
              <div className="lab-assist-typing">
                <span /><span /><span />
              </div>
            )}
            {assistMessages.map((m, i) => (
              <div key={i} className={`lab-assist-msg${m.role === 'user' ? ' user' : ' bot'}`}>
                <div
                  className="lab-assist-bubble"
                  dangerouslySetInnerHTML={{ __html: (m.content || '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }}
                />
              </div>
            ))}
            {assistMessages.length > 0 && assistLoading && (
              <div className="lab-assist-msg bot">
                <div className="lab-assist-bubble">
                  <span className="lab-assist-typing"><span /><span /><span /></span>
                </div>
              </div>
            )}
            <div ref={assistEndRef} />
          </div>

          <form className="lab-assist-input-row" onSubmit={sendAssistMessage}>
            <textarea
              ref={assistInputRef}
              className="lab-assist-input"
              placeholder="Ask anything about this project…"
              value={assistInput}
              onChange={e => setAssistInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAssistMessage(); } }}
              rows={2}
            />
            <button
              type="submit"
              className="lab-assist-send"
              style={{ background: subject.color }}
              disabled={!assistInput.trim() || assistLoading}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Weekly Report Sample Modal ────────────────────────────────────────────
function WeeklyReportSampleModal({ onClose }) {
  return (
    <div className="sample-modal-overlay" onClick={onClose}>
      <div className="sample-modal" onClick={e => e.stopPropagation()}>
        <div className="sample-modal-header">
          <div>
            <p className="sample-modal-eyebrow">Sample</p>
            <h3 className="sample-modal-title">Your Weekly Progress Report</h3>
          </div>
          <button className="founder-modal-x" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="sample-report-body">
          <div className="sample-report-greeting">Week of 28 Apr – 4 May</div>
          <div className="sample-report-coaching">
            You're putting in real depth  -  your Tuesday evening sessions averaged 34 minutes, which is where the retention actually happens. You've mastered Sequence Alignment and BLAST this week, which puts you exactly on track for your Bioinformatics Scientist goal. Next week, push into Phylogenetics before moving to the next subject.
          </div>
          <div className="sample-report-stats">
            <div className="sample-stat-box">
              <span className="sample-stat-val">3</span>
              <span className="sample-stat-label">Sessions</span>
            </div>
            <div className="sample-stat-box">
              <span className="sample-stat-val">4</span>
              <span className="sample-stat-label">Concepts covered</span>
            </div>
            <div className="sample-stat-box">
              <span className="sample-stat-val">2</span>
              <span className="sample-stat-label">Mastered</span>
            </div>
            <div className="sample-stat-box">
              <span className="sample-stat-val">7</span>
              <span className="sample-stat-label">Day streak</span>
            </div>
          </div>
          <div className="sample-report-focus">
            <p className="sample-focus-label">Focus next week</p>
            <div className="sample-focus-pills">
              <span className="sample-focus-pill">Phylogenetics</span>
              <span className="sample-focus-pill">NGS Pipelines</span>
              <span className="sample-focus-pill">Protein Structure</span>
            </div>
          </div>
          <p className="sample-report-note">This report is generated by AI using your actual learning data  -  sessions, concepts, quiz scores, and career goal  -  and lands in your inbox every Monday.</p>
        </div>
      </div>
    </div>
  );
}

// ── Certificate Sample Modal ──────────────────────────────────────────────
function CertificateSampleModal({ onClose }) {
  return (
    <div className="sample-modal-overlay" onClick={onClose}>
      <div className="sample-modal sample-modal--cert" onClick={e => e.stopPropagation()}>
        <div className="sample-modal-header">
          <div>
            <p className="sample-modal-eyebrow">Sample</p>
            <h3 className="sample-modal-title">Your Certificate of Completion</h3>
          </div>
          <button className="founder-modal-x" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="sample-cert-wrap">
          <div className="certificate-parchment" style={{ transform: 'scale(0.72)', transformOrigin: 'top center', marginBottom: '-80px' }}>
            <div className="cert-inner-border">
              <div className="cert-p-logo">
                <img src="/logo-3.png" alt="Bversity" className="cert-p-logo-img" />
                <div className="cert-p-logo-sub">School of Biosciences</div>
              </div>
              <div className="cert-p-heading">CERTIFICATE</div>
              <div className="cert-p-subheading">of Completion</div>
              <div className="cert-p-divider" />
              <div className="cert-p-certify-text">This is to certify that</div>
              <div className="cert-p-student-name">Your Name</div>
              <div className="cert-p-name-underline" />
              <div className="cert-p-awarded-text">has successfully completed all academic requirements and is hereby awarded the</div>
              <div className="cert-p-course">Bioinformatics</div>
              <div className="cert-p-recognition">in recognition of their perseverance, commitment, and scholarly achievement. We celebrate this milestone and encourage you to carry forward the knowledge, skills, and values acquired here.</div>
              <div className="cert-p-sig-row">
                <div className="cert-p-sig-person">
                  <div className="cert-p-sig-line" />
                  <div className="cert-p-sig-name">Raghul Jaganathan</div>
                  <div className="cert-p-sig-title">Chief Academic Officer,<br />Bversity School of Bioscience</div>
                </div>
                <div className="cert-p-seal">
                  <div className="cert-p-seal-icon"><IcoCertificate /></div>
                  <div className="cert-p-seal-text">BVERSITY{'\n'}WITH HONORS</div>
                </div>
                <div className="cert-p-sig-person">
                  <div className="cert-p-sig-line" />
                  <div className="cert-p-sig-name">Sudharsan V</div>
                  <div className="cert-p-sig-title">Chief Executive Officer,<br />Bversity School of Bioscience</div>
                </div>
              </div>
              <div className="cert-p-cert-no">Graduation certificate no. BVG-SAMPLE</div>
              <div className="cert-p-legal">Certificate by Bversity school of Bioscience (an entity by TABS Learning private limited. CIN : U80903TN2021PTC144439)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Journey Section ───────────────────────────────────────────────────────
function JourneySection({ data }) {
  const [showReport, setShowReport]   = useState(false);
  const [showCert, setShowCert]       = useState(false);

  const hasCapstone = Object.values(data.subjects || {}).some(s => s.capstone_submission);
  const hasCert     = Object.values(data.subjects || {}).some(s => s.certificate_earned);

  const steps = [
    {
      num: '01',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      title: 'Weekly Report',
      desc: 'Every Monday, a personalised AI progress report lands in your inbox  -  sessions, concepts mastered, and what to focus on next.',
      active: true,
      cta: 'View sample report',
      onCta: () => setShowReport(true),
    },
    {
      num: '02',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      title: 'Capstone Project',
      desc: 'Complete a subject and unlock a real-world capstone project  -  a graded assignment reviewed and marked by faculty.',
      active: hasCapstone,
      cta: null,
    },
    {
      num: '03',
      icon: <IcoCertificate />,
      title: 'Verified Certificate',
      desc: 'Pass your capstone and earn a verified Bversity certificate  -  with your name, subject, credential ID, and faculty signatures.',
      active: hasCert,
      cta: 'View sample certificate',
      onCta: () => setShowCert(true),
    },
  ];

  return (
    <div className="journey-section">
      <p className="journey-eyebrow">Your Learning Journey</p>
      <div className="journey-timeline">
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <div className={`journey-node${step.active ? ' journey-node--active' : ''}`}>
              <div className="journey-node-dot" />
              <div className="journey-node-label">{step.title}</div>
              {step.cta && (
                <button className="journey-sample-btn" onClick={step.onCta}>{step.cta} →</button>
              )}
            </div>
            {i < steps.length - 1 && <div className="journey-line" />}
          </React.Fragment>
        ))}
      </div>
      {showReport && <WeeklyReportSampleModal onClose={() => setShowReport(false)} />}
      {showCert   && <CertificateSampleModal  onClose={() => setShowCert(false)}  />}
    </div>
  );
}

function USDashboardView({ student, careerProfile, onStudy }) {
  const certId = careerProfile?.career_id;
  const certSubject = US_SUBJECTS.find(s => s.id === certId);
  const examData = US_EXAM_DOMAINS[certId];
  const [conceptProgress, setConceptProgress] = useState(null);

  useEffect(() => {
    if (student?.id && certId) {
      fetch(`/api/progress/${student.id}/${certId}`)
        .then(r => r.json())
        .then(setConceptProgress)
        .catch(() => {});
    }
  }, [student?.id, certId]);

  if (!certSubject || !examData) {
    return (
      <div className="us-dashboard">
        <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>No certification selected. Go to Courses to choose your cert.</p>
      </div>
    );
  }

  const conceptMap = {};
  (conceptProgress?.concepts || []).forEach(c => { conceptMap[c.id] = c; });
  const coveredSet  = new Set(Object.values(conceptMap).filter(c => c.covered).map(c => c.id));
  const masteredSet = new Set(Object.values(conceptMap).filter(c => c.mastered).map(c => c.id));

  const totalConcepts   = examData.domains.reduce((sum, d) => sum + d.concepts.length, 0);
  const coveredCount    = examData.domains.reduce((sum, d) => sum + d.concepts.filter(c => coveredSet.has(c.id)).length, 0);
  const masteredCount   = examData.domains.reduce((sum, d) => sum + d.concepts.filter(c => masteredSet.has(c.id)).length, 0);
  const readinessPct    = totalConcepts > 0 ? Math.round((coveredCount / totalConcepts) * 100) : 0;
  const domainsStarted  = examData.domains.filter(d => d.concepts.some(c => coveredSet.has(c.id))).length;
  const domainsLeft     = examData.domains.length - examData.domains.filter(d => d.concepts.every(c => coveredSet.has(c.id))).length;

  const nextConcept = examData.domains.flatMap(d => d.concepts).find(c => !coveredSet.has(c.id));

  const circumference = 2 * Math.PI * 52;
  const dash = (readinessPct / 100) * circumference;

  return (
    <div className="us-dashboard">

      {/* ── Stats row ── */}
      <div className="us-dash-stats">
        <div className="us-dash-stat-card">
          <div className="us-dash-stat-num">{coveredCount}</div>
          <div className="us-dash-stat-label">CONCEPTS COVERED</div>
        </div>
        <div className="us-dash-stat-card">
          <div className="us-dash-stat-num">{masteredCount}</div>
          <div className="us-dash-stat-label">CONCEPTS MASTERED</div>
        </div>
        <div className="us-dash-stat-card">
          <div className="us-dash-stat-num">{totalConcepts}</div>
          <div className="us-dash-stat-label">TOTAL CURRICULUM</div>
        </div>
      </div>

      {/* ── Readiness + Domain breakdown ── */}
      <div className="us-dash-main-row">

        {/* Left: readiness card */}
        <div className="us-dash-readiness-card">
          <div className="us-dash-readiness-label">EXAM READINESS</div>
          <div className="us-dash-ring-wrap">
            <svg viewBox="0 0 120 120" className="us-dash-ring-svg">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#00A896" strokeWidth="10"
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={circumference * 0.25}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div className="us-dash-ring-inner">
              <div className="us-dash-ring-pct">{readinessPct}%</div>
              <div className="us-dash-ring-sub">READY</div>
            </div>
          </div>
          <div className="us-dash-readiness-cert">{examData.certName}</div>
          <div className="us-dash-readiness-detail">
            {domainsLeft > 0
              ? `${domainsLeft} domain${domainsLeft > 1 ? 's' : ''} left to complete`
              : 'All domains covered'}
          </div>
          <button className="us-dash-study-btn" onClick={() => onStudy(certSubject)}>
            {coveredCount === 0 ? 'Start your prep →' : 'Continue prep →'}
          </button>
        </div>

        {/* Right: domain breakdown */}
        <div className="us-dash-domains-panel">
          <div className="us-dash-domains-title">Domain Progress</div>
          {examData.domains.map(domain => {
            const covered = domain.concepts.filter(c => coveredSet.has(c.id)).length;
            const total   = domain.concepts.length;
            const pct     = total > 0 ? Math.round((covered / total) * 100) : 0;
            const next    = domain.concepts.find(c => !coveredSet.has(c.id));
            const done    = covered === total;
            return (
              <div key={domain.name} className={`us-dash-domain-row${done ? ' done' : ''}`}>
                <div className="us-dash-domain-top">
                  <span className="us-dash-domain-name">{domain.name}</span>
                  <span className="us-dash-domain-count">{covered}/{total}</span>
                </div>
                <div className="us-dash-domain-bar-track">
                  <div className="us-dash-domain-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                {next && (
                  <div className="us-dash-domain-next">
                    <span className="us-dash-next-label">Next up</span>
                    <span className="us-dash-next-concept">{next.name}</span>
                    <button className="us-dash-next-btn" onClick={() => onStudy(certSubject)}>Study →</button>
                  </div>
                )}
                {done && (
                  <div className="us-dash-domain-done">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Domain complete
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function DashboardView({ student, careerProfile, onStudy, onCapstone, onCertificate }) {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [allVideos, setAllVideos]   = useState({});
  const [videoModal, setVideoModal] = useState(null);
  const [studyPlan, setStudyPlan]   = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/${student.id}`).then(r => r.json()),
      fetch(`/api/concept-videos`).then(r => r.json()),
      fetch(`/api/study-plan/${student.id}`).then(r => r.json()).catch(() => null),
    ]).then(([d, v, p]) => { setData(d); setAllVideos(v); setStudyPlan(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, [student.id]);

  if (loading) return <div className="dashboard-loading">Loading your progress map...</div>;
  if (!data) return null;

  const totalCovered  = Object.values(data.subjects || {}).reduce((s, x) => s + x.covered_count, 0);
  const totalMastered = Object.values(data.subjects || {}).reduce((s, x) => s + x.mastered_count, 0);
  const totalConcepts = Object.values(data.subjects || {}).reduce((s, x) => s + x.total, 0);

  const today = new Date();
  const lagDays = studyPlan?.lag_days ?? 0;
  const lagConcepts = studyPlan?.lag_concepts ?? 0;

  const planDays = studyPlan?.plan ?? [];
  const spDoneDays = planDays.filter(d => d.concepts.every(c => c.covered)).length;
  const spTotalConcepts = planDays.reduce((s, d) => s + d.concepts.length, 0);
  const spCoveredConcepts = planDays.reduce((s, d) => s + d.concepts.filter(c => c.covered).length, 0);
  const spPct = spTotalConcepts > 0 ? Math.round((spCoveredConcepts / spTotalConcepts) * 100) : 0;
  const spWeeks = [];
  for (let i = 0; i < planDays.length; i += 7) spWeeks.push(planDays.slice(i, i + 7));
  const spOverdueDays = planDays.filter(d => {
    const dd = new Date(d.target_date);
    return dd < new Date(today.toDateString()) && !d.concepts.every(c => c.covered);
  });

  const selectedUsCert = ACTIVE_REGION === 'us' ? US_SUBJECTS.find(s => s.id === careerProfile?.career_id) : null;
  const examData = selectedUsCert ? US_EXAM_DOMAINS[selectedUsCert.id] : null;

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <h1>
          <span className="dashboard-hero-name">{student.name.split(' ')[0]}'s</span>
          <span className="dashboard-hero-sub"> {selectedUsCert ? `${examData?.certName ?? selectedUsCert.name} Progress` : 'Learning Map'}</span>
        </h1>
        <div className="hero-mastery">
          <div className="hero-mastery-bar-track">
            <div className="hero-mastery-bar-fill" style={{
              width: `${studyPlan && spTotalConcepts > 0
                ? spPct
                : Math.round((totalCovered / Math.max(totalConcepts, 1)) * 100)}%`
            }} />
          </div>
          <div className="hero-mastery-meta">
            {studyPlan && spTotalConcepts > 0 ? (
              <>
                <span className="hero-mastery-stat"><strong>{spCoveredConcepts}</strong> / {spTotalConcepts} concepts</span>
                <span className="hero-mastery-dot">·</span>
                <span className="hero-mastery-stat"><strong>{spDoneDays}</strong> / {planDays.length} days</span>
                <span className="hero-mastery-dot">·</span>
                <span className="hero-mastery-stat">{spPct}% complete</span>
                {lagDays >= 1 && (
                  <>
                    <span className="hero-mastery-dot">·</span>
                    <span className="hero-mastery-behind">{lagDays}d behind</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="hero-mastery-stat"><strong>{totalCovered}</strong> / {totalConcepts} concepts covered</span>
                {totalMastered > 0 && (
                  <>
                    <span className="hero-mastery-dot">·</span>
                    <span className="hero-mastery-stat"><strong>{totalMastered}</strong> mastered</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {data && <JourneySection data={data} />}

      {studyPlan && studyPlan.plan?.length > 0 && (
        <StudyPlanSection
          planDays={planDays}
          spWeeks={spWeeks}
          spDoneDays={spDoneDays}
          spTotalConcepts={spTotalConcepts}
          spCoveredConcepts={spCoveredConcepts}
          spPct={spPct}
          spOverdueDays={spOverdueDays}
          lagDays={lagDays}
          lagConcepts={lagConcepts}
          today={today}
          onStudy={onStudy}
        />
      )}

      {selectedUsCert && examData && (
        <div className="dash-us-cert-banner">
          <div className="dash-us-cert-banner-left">
            <div className="dash-us-cert-badge">{examData.certBody}</div>
            <div className="dash-us-cert-name">{examData.certName}</div>
            <div className="dash-us-cert-meta">{selectedUsCert.tutor} · {selectedUsCert.org}</div>
          </div>
          <div className="dash-us-cert-banner-right">
            <div className="dash-us-cert-stat"><strong>{examData.examQuestions}</strong><span>questions</span></div>
            <div className="dash-us-cert-stat"><strong>{examData.passScore}</strong><span>to pass</span></div>
            <div className="dash-us-cert-stat"><strong>{examData.domains.length}</strong><span>domains</span></div>
          </div>
        </div>
      )}

      <div className="dashboard-subjects">
        {SUBJECTS.map((subject) => {
          const prog = (data.subjects || {})[subject.id];
          if (!prog) return null;
          const capSub = prog.capstone_submission;
          return (
            <div key={subject.id} className="dashboard-subject-card">
              <div className="dashboard-subject-header">
                <div className="dashboard-subject-title">
                  <img
                    src={TUTOR_AVATARS[subject.tutor]}
                    className="tutor-photo-md"
                    alt={subject.tutor}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div>
                    <div className="dashboard-subject-name">{subject.name}</div>
                    <div className="dashboard-subject-tutor" style={{ color: subject.color }}>{subject.tutor}</div>
                    <div className="dashboard-subject-org">{subject.org}</div>
                  </div>
                </div>
                <div className="dashboard-subject-stats">
                  <span className="ds-covered">{prog.covered_count} covered</span>
                  <span className="ds-sep">·</span>
                  <span className="ds-mastered" style={{ color: subject.color }}>{prog.mastered_count} mastered</span>
                  <span className="ds-sep">·</span>
                  <span className="ds-total">{prog.total} total</span>
                </div>
              </div>

              <div className="dashboard-progress-bar-track">
                <div className="dashboard-progress-covered"  style={{ width: `${(prog.covered_count / prog.total) * 100}%`, background: subject.color + '44' }} />
                <div className="dashboard-progress-mastered" style={{ width: `${(prog.mastered_count / prog.total) * 100}%`, background: subject.color }} />
              </div>

              <div className="concept-map">
                {(() => {
                  // Group concepts into modules (strip trailing _a/_b/_c)
                  const moduleMap = {};
                  (prog.concepts || []).forEach(c => {
                    const parent = c.id.replace(/_[abc]$/, '');
                    if (!moduleMap[parent]) moduleMap[parent] = [];
                    moduleMap[parent].push(c);
                  });
                  const subjectVideos = allVideos[subject.id] || {};
                  return Object.entries(moduleMap).map(([moduleId, subs]) => {
                    const allMastered = subs.every(c => c.mastered);
                    const anyCovered  = subs.some(c => c.covered);
                    const displayName = subs.length > 1
                      ? subs[0].name.split(':')[0].split(' - ')[0].trim()
                      : subs[0].name;
                    const videoEntry  = subs.map(c => subjectVideos[c.id]).find(Boolean);
                    return (
                      <div key={moduleId} className={`concept-module ${allMastered ? 'mastered' : anyCovered ? 'covered' : 'pending'}`}
                           style={anyCovered ? { borderColor: subject.color + '55', '--subject-color': subject.color } : {}}>
                        <div className="concept-module-header" title={subs.map(s => s.name).join(' · ')}>
                          <span className="concept-module-icon" style={{ color: allMastered ? subject.color : anyCovered ? subject.color + 'aa' : '' }}>
                            {allMastered ? '✓✓' : anyCovered ? '✓' : '○'}
                          </span>
                          <span className="concept-module-name">{displayName}</span>
                          {videoEntry && (
                            <button className="concept-watch-btn" style={{ color: subject.color }}
                              onClick={() => setVideoModal({ url: videoEntry.drive_url, title: videoEntry.title || displayName })}>
                              ▶
                            </button>
                          )}
                          {anyCovered && (
                            <button className="concept-revisit-btn" title="Revisit this module"
                              onClick={() => onStudy(subject, { id: moduleId, name: displayName, subs })}>
                              ↩
                            </button>
                          )}
                        </div>
                        <div className="concept-module-subs">
                          {subs.map(c => (
                            <span key={c.id} className={`concept-sub-dot ${c.mastered ? 'dot-mastered' : c.covered ? 'dot-covered' : 'dot-pending'}`}
                                  style={c.mastered || c.covered ? { background: c.mastered ? subject.color : subject.color + '55' } : {}}
                                  title={c.name} />
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="dashboard-subject-footer">
                <button className="study-btn" style={{ borderColor: subject.color, color: subject.color }} onClick={() => onStudy(subject)}>
                  {prog.covered_count > 0 ? 'Continue →' : 'Start →'}
                </button>
                {prog.covered_count >= prog.total && prog.total > 0 && (
                  <button className="ds-cert-btn" onClick={() => onCertificate(subject)} title="View your certificate">
                    <IcoCertificate /> Certificate
                  </button>
                )}
                <div className="capstone-status-chip" onClick={() => onCapstone(subject)} title="View capstone project">
                  {prog.capstone_unlocked ? (
                    capSub ? (
                      capSub.score !== null ? (
                        <span className="cs-chip cs-scored" style={{ borderColor: subject.color, color: subject.color }}>
                          <IcoCertificate /> Capstone: {capSub.score}/100
                        </span>
                      ) : (
                        <span className="cs-chip cs-pending" style={{ borderColor: subject.color + '88', color: subject.color }}>
                          <IcoMail /> Capstone: Awaiting review
                        </span>
                      )
                    ) : (
                      <span className="cs-chip cs-unlocked" style={{ borderColor: subject.color, color: subject.color }}>
                        <IcoUnlock /> Capstone unlocked →
                      </span>
                    )
                  ) : (
                    <span className="cs-chip cs-locked">
                      <IcoLock /> Capstone locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {videoModal && (
        <div className="modal-overlay" onClick={() => setVideoModal(null)}>
          <div className="dash-video-modal" onClick={e => e.stopPropagation()}>
            <div className="dash-video-modal-header">
              <span className="dash-video-modal-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                {videoModal.title}
              </span>
              <button className="map-popup-close" onClick={() => setVideoModal(null)}>×</button>
            </div>
            <div className="concept-video-frame-wrap">
              <iframe
                src={driveEmbedUrl(videoModal.url)}
                className="concept-video-frame"
                allow="autoplay"
                allowFullScreen
                title={videoModal.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Certificate ────────────────────────────────────────────────────────────

function CertificateView({ student, subject, onBack, onStudy }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetch(`/api/certificate/${student.id}/${subject.id}`)
      .then(r => r.json())
      .then(d => { setCert(d.eligible ? d : null); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`/api/progress/${student.id}/${subject.id}`)
      .then(r => r.json())
      .then(d => setProgress(d))
      .catch(() => {});
  }, [student.id, subject.id]);

  const handleDownload = () => window.print();

  const handleLinkedIn = () => {
    if (!cert) return;
    const verifyUrl = `https://university.bversity.io/verify/BVG-${cert.credential_id}`;
    const date = cert.completion_date ? new Date(cert.completion_date) : new Date();
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: `${cert.subject_name} | Bversity`,
      organizationName: 'Bversity',
      issueYear: String(date.getFullYear()),
      issueMonth: String(date.getMonth() + 1),
      certUrl: verifyUrl,
      certId: `BVG-${cert.credential_id}`,
    });
    window.open(`https://www.linkedin.com/profile/add?${params.toString()}`, '_blank');
  };

  if (loading) return <div className="certificate-view"><div className="certificate-loading">Verifying certificate eligibility…</div></div>;

  const covered = progress?.covered_count ?? 0;
  const total   = progress?.total ?? 12;
  const pct     = Math.round((covered / total) * 100);

  if (!cert) {
    return (
      <div className="certificate-view">
        <button className="certificate-back-btn" onClick={onBack}>← Back to Dashboard</button>
        <div className="certificate-locked-card">
          <div className="certificate-locked-icon"><IcoCertificate /></div>
          <div className="certificate-locked-title">Certificate not yet earned</div>
          <div className="certificate-locked-msg">
            Cover all {total} concepts in <strong>{subject.name}</strong> to earn your certificate.
          </div>
          <div className="certificate-locked-progress">
            <div className="certificate-locked-bar-track">
              <div className="certificate-locked-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="certificate-locked-pct">{covered}/{total}</span>
          </div>
          <button className="certificate-locked-study-btn" onClick={() => onStudy(subject)}>
            Continue studying →
          </button>
        </div>
      </div>
    );
  }

  const dateLabel = cert.completion_date
    ? new Date(cert.completion_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const courseName = cert.subject_name.toUpperCase();

  return (
    <div className="certificate-view">
      <button className="certificate-back-btn" onClick={onBack}>← Back to Dashboard</button>

      <div className="certificate-parchment">
        <div className="cert-inner-border">

          <div className="cert-p-logo">
            <img src="/logo-3.png" alt="Bversity" className="cert-p-logo-img" />
            <div className="cert-p-logo-sub">School of Biosciences</div>
          </div>

          {/* Big heading */}
          <div className="cert-p-heading">CERTIFICATE</div>
          <div className="cert-p-subheading">of Completion</div>

          <div className="cert-p-divider" />

          <div className="cert-p-certify-text">This is to certify that</div>

          <div className="cert-p-student-name">{cert.student_name}</div>
          <div className="cert-p-name-underline" />

          <div className="cert-p-awarded-text">
            has successfully completed all academic requirements and is hereby awarded the
          </div>

          <div className="cert-p-course">{courseName}</div>

          <div className="cert-p-recognition">
            in recognition of their perseverance, commitment, and scholarly achievement.
            We celebrate this milestone and encourage you to carry forward the knowledge,
            skills, and values acquired here, as you embark on the next chapter of your journey.
          </div>

          {/* Signatures */}
          <div className="cert-p-sig-row">
            <div className="cert-p-sig-person">
              <div className="cert-p-sig-line" />
              <div className="cert-p-sig-name">Raghul Jaganathan</div>
              <div className="cert-p-sig-title">Chief Academic Officer,<br />Bversity School of Bioscience</div>
            </div>

            <div className="cert-p-seal">
              <div className="cert-p-seal-icon"><IcoCertificate /></div>
              <div className="cert-p-seal-text">BVERSITY{'\n'}WITH HONORS</div>
            </div>

            <div className="cert-p-sig-person">
              <div className="cert-p-sig-line" />
              <div className="cert-p-sig-name">Sudharsan V</div>
              <div className="cert-p-sig-title">Chief Executive Officer,<br />Bversity School of Bioscience</div>
            </div>
          </div>

          <div className="cert-p-cert-no">Graduation certificate no. BVG-{cert.credential_id}</div>
          <div className="cert-p-legal">
            Certificate by Bversity school of Bioscience (an entity by TABS Learning private limited. CIN : U80903TN2021PTC144439)
          </div>

        </div>
      </div>

      <div className="certificate-actions">
        <button className="cert-action-btn cert-action-download" onClick={handleDownload}>
          ⬇ Download PDF
        </button>
        <button className="cert-action-btn cert-action-linkedin" onClick={handleLinkedIn}>
          Add to LinkedIn Profile
        </button>
        <button className="cert-action-btn cert-action-copy" onClick={() => {
          navigator.clipboard.writeText(`https://university.bversity.io/verify/BVG-${cert.credential_id}`);
        }}>
          Copy shareable link
        </button>
      </div>
      <div className="cert-credential-note">
        Issued {dateLabel} · Credential no. BVG-{cert.credential_id} ·{' '}
        <a href={`/verify/BVG-${cert.credential_id}`} target="_blank" rel="noreferrer" className="cert-verify-link">
          Verify online
        </a>
      </div>
    </div>
  );
}

// ── Public Certificate (shareable verify page) ─────────────────────────────

function PublicCertificateView({ credentialId }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/verify/${credentialId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setCert(d); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [credentialId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f2' }}>
      <div style={{ color: '#666', fontSize: '0.9rem' }}>Verifying certificate…</div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f7f2', gap: '1rem' }}>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}>Certificate not found</div>
      <div style={{ fontSize: '0.83rem', color: '#888' }}>The credential ID BVG-{credentialId} does not exist in our records.</div>
      <a href="/" style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#00A896' }}>Go to Bversity →</a>
    </div>
  );

  const dateLabel = cert.completion_date
    ? new Date(cert.completion_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="certificate-view" style={{ minHeight: '100vh', background: '#f8f7f2' }}>
      <div className="cert-public-header">
        <img src="/logo-3.png" alt="Bversity" style={{ height: '36px' }} />
        <div className="cert-public-verified-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Verified Certificate
        </div>
      </div>

      <div className="certificate-parchment">
        <div className="cert-inner-border">
          <div className="cert-p-logo">
            <img src="/logo-3.png" alt="Bversity" className="cert-p-logo-img" />
            <div className="cert-p-logo-sub">School of Biosciences</div>
          </div>
          <div className="cert-p-heading">CERTIFICATE</div>
          <div className="cert-p-subheading">of Completion</div>
          <div className="cert-p-divider" />
          <div className="cert-p-certify-text">This is to certify that</div>
          <div className="cert-p-student-name">{cert.student_name}</div>
          <div className="cert-p-name-underline" />
          <div className="cert-p-awarded-text">
            has successfully completed all academic requirements and is hereby awarded the
          </div>
          <div className="cert-p-course">{cert.subject_name.toUpperCase()}</div>
          <div className="cert-p-recognition">
            in recognition of their perseverance, commitment, and scholarly achievement.
            We celebrate this milestone and encourage you to carry forward the knowledge,
            skills, and values acquired here, as you embark on the next chapter of your journey.
          </div>
          <div className="cert-p-sig-row">
            <div className="cert-p-sig-person">
              <div className="cert-p-sig-line" />
              <div className="cert-p-sig-name">Raghul Jaganathan</div>
              <div className="cert-p-sig-title">Chief Academic Officer,<br />Bversity School of Bioscience</div>
            </div>
            <div className="cert-p-seal">
              <div className="cert-p-seal-icon"><IcoCertificate /></div>
              <div className="cert-p-seal-text">BVERSITY{'\n'}WITH HONORS</div>
            </div>
            <div className="cert-p-sig-person">
              <div className="cert-p-sig-line" />
              <div className="cert-p-sig-name">Sudharsan V</div>
              <div className="cert-p-sig-title">Chief Executive Officer,<br />Bversity School of Bioscience</div>
            </div>
          </div>
          <div className="cert-p-cert-no">Graduation certificate no. BVG-{cert.credential_id}</div>
          <div className="cert-p-legal">
            Certificate by Bversity school of Bioscience (an entity by TABS Learning private limited. CIN : U80903TN2021PTC144439)
          </div>
        </div>
      </div>

      <div className="cert-public-footer">
        <div className="cert-public-meta">
          Issued {dateLabel} · Credential no. BVG-{cert.credential_id}
        </div>
        <a href="https://university.bversity.io" className="cert-public-cta">
          Learn at Bversity →
        </a>
      </div>
    </div>
  );
}

// ── Learning Path Track ────────────────────────────────────────────────────

function LearningPathTrack({ student, career, careerSubjects, progress, statuses, activeCount, onCardClick, onPause, careerConceptCounts }) {
  const completedCount = careerSubjects.filter(s => statuses[s.id]?.status === 'completed').length;
  const totalSubjects  = careerSubjects.length;
  const pathPct        = totalSubjects > 0 ? Math.round((completedCount / totalSubjects) * 100) : 0;

  return (
    <div className="lp-section">
      <div className="lp-header">
        <div className="lp-header-left">
          <h2 className="lp-title">Your Learning Path</h2>
          <p className="lp-subtitle">{career.title} · {totalSubjects} subjects · {careerSubjects.reduce((sum, s) => sum + (SUBJECT_HOURS[s.id] || 20), 0)} hrs estimated</p>
        </div>
        <div className="lp-progress-pill">
          <span className="lp-progress-num">{completedCount}/{totalSubjects}</span>
          <span className="lp-progress-label">completed</span>
          <div className="lp-progress-bar-track">
            <div className="lp-progress-bar-fill" style={{ width: `${pathPct}%` }} />
          </div>
        </div>
      </div>

      <div className="lp-track">
        {(() => {
          const nextUpIdx = careerSubjects.findIndex(s => {
            const st = statuses[s.id]?.status;
            return st !== 'completed';
          });
          return careerSubjects.map((s, idx) => {
          const st        = statuses[s.id]?.status;
          const prog      = (progress || {})[s.id];
          const covered   = prog?.covered_count  ?? 0;
          const mastered  = prog?.mastered_count ?? 0;
          const total     = prog?.total ?? 36;
          const mastPct   = total > 0 ? Math.round((mastered / total) * 100) : 0;
          const covPct    = total > 0 ? Math.round((covered  / total) * 100) : 0;
          const started   = covered > 0;
          const isActive  = st === 'active';
          const isPaused  = st === 'paused';
          const isDone    = st === 'completed';
          const isLocked  = !isActive && !isPaused && !isDone;
          const isCurrent = isActive || (isPaused && !isDone);
          const hours     = SUBJECT_HOURS[s.id] || 20;
          const isNextUp  = idx === nextUpIdx && !isActive;
          const coreCount = careerConceptCounts?.[s.id] || 0;

          let stepState = 'locked';
          if (isDone)   stepState = 'done';
          else if (isActive) stepState = 'active';
          else if (isPaused) stepState = 'paused';

          let ctaLabel = 'Unlock to start';
          if (isActive)  ctaLabel = started ? 'Continue →' : 'Start →';
          if (isPaused)  ctaLabel = 'Resume →';
          if (isDone)    ctaLabel = 'Review →';
          if (isLocked && activeCount >= 2) ctaLabel = 'Pause a subject first';

          return (
            <div key={s.id} className={`lp-step lp-step--${stepState}`}>
              <div className="lp-step-left">
                <div className="lp-step-circle" style={isDone ? { background: s.color, borderColor: s.color } : isCurrent ? { borderColor: s.color, color: s.color } : {}}>
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                {idx < careerSubjects.length - 1 && (
                  <div className="lp-step-line" style={isDone ? { background: s.color } : {}} />
                )}
              </div>

              <div className="lp-step-card" onClick={() => onCardClick(s)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onCardClick(s)}>
                <div className="lp-step-card-top">
                  <div className="lp-step-icon" style={{ color: isDone || isActive ? s.color : undefined }}>
                    {SUBJECT_ICONS[s.id]}
                  </div>
                  <div className="lp-step-meta">
                    <div className="lp-step-name">{s.name}</div>
                    <div className="lp-step-info">
                      <span>{total} concepts</span>
                      <span className="lp-dot">·</span>
                      <span>~{hours} hrs</span>
                      <span className="lp-dot">·</span>
                      <span style={{ color: s.color }}>{s.tutor}</span>
                    </div>
                  </div>
                  <div className="lp-step-badges">
                    {isNextUp && <span className="lp-badge lp-badge--nextup">Next up</span>}
                    {isDone   && <span className="lp-badge lp-badge--done">Completed</span>}
                    {isActive && <span className="lp-badge lp-badge--active">In Progress</span>}
                    {isPaused && <span className="lp-badge lp-badge--paused">Paused</span>}
                    {isLocked && !isNextUp && <span className="lp-badge lp-badge--locked">Locked</span>}
                  </div>
                </div>

                {started && !isDone && (
                  <div className="lp-step-progress">
                    <div className="lp-step-bar-track">
                      <div className="lp-step-bar-cov"  style={{ width: `${covPct}%`,  background: s.color + '40' }} />
                      <div className="lp-step-bar-mast" style={{ width: `${mastPct}%`, background: s.color }} />
                    </div>
                    <span className="lp-step-pct" style={{ color: s.color }}>{mastered}/{total} mastered</span>
                  </div>
                )}
                {isDone && (
                  <div className="lp-step-progress">
                    <div className="lp-step-bar-track">
                      <div className="lp-step-bar-mast" style={{ width: '100%', background: s.color }} />
                    </div>
                    <span className="lp-step-pct" style={{ color: s.color }}>All {total} concepts mastered</span>
                  </div>
                )}

                <div className="lp-step-footer">
                  <span className="lp-step-desc">{s.description}</span>
                  {coreCount > 0 && (
                    <span className="lp-step-core-tag" style={{ color: s.color }}>
                      {coreCount} concept{coreCount !== 1 ? 's' : ''} core to your career
                    </span>
                  )}
                  {!isLocked && (
                    <button className="lp-step-cta" style={{ color: s.color, borderColor: s.color + '55' }}
                      onClick={e => { e.stopPropagation(); onCardClick(s); }}>
                      {ctaLabel}
                    </button>
                  )}
                  {isActive && (
                    <button className="lp-step-pause" onClick={e => { e.stopPropagation(); onPause(s); }}>
                      Pause
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        });
        })()}
      </div>
    </div>
  );
}

// ── Subject Entry: Expert Intro ────────────────────────────────────────────

function ExpertIntroScreen({ subject, student, onReady, onBack }) {
  function handleReady() {
    localStorage.setItem(`bv_met_${subject.id}_${student.id}`, '1');
    onReady();
  }
  const tutorPhoto = TUTOR_AVATARS[subject.tutor];
  return (
    <div className="entry-screen entry-screen--intro">
      <button className="entry-back-btn entry-back-btn--light" onClick={onBack}>← Back to courses</button>
      <div className="intro-hero-card">
        {/* Photo header */}
        <div
          className="intro-hero-photo"
          style={{
            backgroundImage: tutorPhoto
              ? `linear-gradient(to top, ${subject.color}ee 0%, ${subject.color}55 40%, transparent 100%), url(${tutorPhoto})`
              : `linear-gradient(135deg, ${subject.color}cc 0%, ${subject.color}88 100%)`,
          }}
        >
          {!tutorPhoto && (
            <div className="intro-hero-initials">
              {subject.tutor.split(' ').filter(w => w.length > 2).slice(-2).map(w => w[0]).join('')}
            </div>
          )}
          <div className="intro-hero-overlay-text">
            <div className="intro-hero-subject-badge">{subject.name}</div>
            <div className="intro-hero-name">{subject.tutor}</div>
            <div className="intro-hero-role">{subject.role}</div>
            <div className="intro-hero-org">{subject.org}</div>
          </div>
        </div>

        {/* Body */}
        <div className="intro-hero-body">
          <blockquote className="intro-hero-quote" style={{ borderColor: subject.color }}>
            "{subject.intro}"
          </blockquote>
          <button
            className="intro-hero-cta"
            style={{ background: subject.color }}
            onClick={handleReady}
          >
            Start learning with {subject.tutor.split(' ')[subject.tutor.startsWith('Dr') ? 2 : 0] || subject.tutor.split(' ')[0]} →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subject Entry: Session Contract ────────────────────────────────────────

function SessionStartScreen({ subject, student, onBegin, onBack }) {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const MINS_PER_CONCEPT = 7;

  useEffect(() => {
    fetch(`/api/progress/${student.id}/${subject.id}`).then(r => r.json()).then(progressData => {
      const uncovered = (progressData.concepts || []).filter(c => !c.covered).slice(0, 3);
      const covered   = (progressData.concepts || []).filter(c => c.covered);
      setIsFirstVisit(covered.length === 0);
      if (uncovered.length > 0) {
        setConcepts(uncovered);
      } else {
        setConcepts((progressData.concepts || []).slice(0, 3).map(c => ({ ...c, review: true })));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [student.id, subject.id]);

  const totalMins = concepts.length * MINS_PER_CONCEPT;
  const isReview  = concepts[0]?.review;

  function handleBegin() {
    onBegin(isFirstVisit);
  }

  const tutorPhoto = TUTOR_AVATARS[subject.tutor];
  return (
    <div className="entry-screen entry-screen--session">
      <button className="entry-back-btn entry-back-btn--light" onClick={onBack}>← Back</button>
      <div className="session-hero-card">
        {/* Tutor photo header */}
        <div
          className="session-hero-photo"
          style={{
            backgroundImage: tutorPhoto
              ? `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%), url(${tutorPhoto})`
              : `linear-gradient(135deg, ${subject.color}cc, ${subject.color}66)`,
          }}
        >
          <div className="session-hero-overlay">
            <div className="session-hero-subject" style={{ color: subject.color === '#fff' ? '#eee' : subject.color }}>
              {subject.name}
            </div>
            <div className="session-hero-tutor">{subject.tutor}</div>
            <div className="session-hero-role">{subject.role} · {subject.org}</div>
          </div>
        </div>

        <div className="session-hero-body">
        <div className="entry-session-label">
          {isReview ? "Today's review session" : "Today's session"}
        </div>

        {loading ? (
          <div className="entry-concepts-loading">Loading session…</div>
        ) : (
          <div className="entry-concepts-list">
            {concepts.map((c, i) => (
              <div key={c.id} className="entry-concept-row">
                <span className="entry-concept-num" style={{ background: subject.color + '20', color: subject.color }}>{i + 1}</span>
                <span className="entry-concept-name">{c.name}</span>
                <span className="entry-concept-time">~{MINS_PER_CONCEPT} min</span>
              </div>
            ))}
          </div>
        )}

        <div className="entry-session-meta">
          ~{totalMins} minutes total · Ask me anything along the way
        </div>

        <p className="entry-ready-prompt">Shall we start?</p>
        <button className="entry-cta-btn" style={{ background: subject.color }} onClick={handleBegin} disabled={loading}>
          Begin session →
        </button>
        </div>
      </div>
    </div>
  );
}

// ── Home ───────────────────────────────────────────────────────────────────

const PAUSE_REASONS = [
  { id: 'taking_break',   label: 'Taking a break',              sub: 'I\'ll come back to this later' },
  { id: 'focus_shift',    label: 'Moving focus to another subject', sub: 'I want to study something else right now' },
  { id: 'finished_now',   label: 'Completed for now',           sub: 'I\'ve learned what I needed' },
  { id: 'too_advanced',   label: 'Too advanced right now',      sub: 'I need to build more foundation first' },
  { id: 'career_changed', label: 'Career goals changed',        sub: 'This subject is less relevant now' },
];

// ── Share Card ────────────────────────────────────────────────────────────────

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function generateShareCard({ name, careerTitle, score, completed, total, streak }) {
  const W = 1200, H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0b1f2e');
  bg.addColorStop(0.55, '#091e18');
  bg.addColorStop(1, '#081510');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Teal glow (right side)
  ctx.save();
  ctx.globalAlpha = 0.15;
  const glow = ctx.createRadialGradient(960, 200, 0, 960, 200, 420);
  glow.addColorStop(0, '#16c1ad');
  glow.addColorStop(1, 'rgba(22,193,173,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Vertical divider
  ctx.strokeStyle = 'rgba(22,193,173,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(760, 80); ctx.lineTo(760, H - 80); ctx.stroke();

  // ── LEFT COLUMN ──────────────────────────────────────────
  const TEAL = '#16c1ad';
  const LX = 72;

  // Accent bar
  ctx.fillStyle = TEAL;
  ctx.fillRect(LX, 64, 52, 4);

  // Brand
  ctx.fillStyle = TEAL;
  ctx.font = 'bold 20px system-ui,-apple-system,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BVERSITY AI UNIVERSITY', LX, 105);

  // Intro
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '28px system-ui,-apple-system,sans-serif';
  ctx.fillText(`Hi, I’m ${name.split(' ')[0]}`, LX, 195);

  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = '24px system-ui,-apple-system,sans-serif';
  ctx.fillText('Building my career as a', LX, 238);

  // Career title (word-wrapped)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px system-ui,-apple-system,sans-serif';
  const maxTitleW = 640;
  const words = careerTitle.split(' ');
  let line = '', ty = 318;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxTitleW && line) {
      ctx.fillText(line, LX, ty); line = w; ty += 68;
    } else { line = test; }
  }
  ctx.fillText(line, LX, ty);

  // Aspirational badge pill
  const pillY = 490, pillH = 44, pillR = 22;
  const pillLabel = '✦  One of the first to study at an AI-native university';
  ctx.font = '600 17px system-ui,-apple-system,sans-serif';
  const pillW = Math.min(ctx.measureText(pillLabel).width + 48, 620);
  ctx.fillStyle = 'rgba(22,193,173,0.14)';
  drawRoundRect(ctx, LX, pillY, pillW, pillH, pillR); ctx.fill();
  ctx.strokeStyle = 'rgba(22,193,173,0.35)';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, LX, pillY, pillW, pillH, pillR); ctx.stroke();
  ctx.fillStyle = TEAL;
  ctx.fillText(pillLabel, LX + 24, pillY + 28);

  // Bottom url
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '16px system-ui,-apple-system,sans-serif';
  ctx.fillText('university.bversity.io', LX, H - 44);

  // ── RIGHT COLUMN  -  emblem ────────────────────────────────
  const cx = 980, cy = 280;

  // Outer glow ring
  ctx.save();
  ctx.globalAlpha = 0.18;
  const emblemGlow = ctx.createRadialGradient(cx, cy, 60, cx, cy, 180);
  emblemGlow.addColorStop(0, TEAL);
  emblemGlow.addColorStop(1, 'rgba(22,193,173,0)');
  ctx.fillStyle = emblemGlow;
  ctx.beginPath(); ctx.arc(cx, cy, 180, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Decorative concentric arcs
  [140, 110, 80].forEach((r, i) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI * 0.75, Math.PI * 0.25);
    ctx.strokeStyle = `rgba(22,193,173,${0.12 + i * 0.1})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.25, Math.PI * 1.25);
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + i * 0.03})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Centre text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui,-apple-system,sans-serif';
  ctx.fillText('Bversity', cx, cy - 10);
  ctx.fillStyle = TEAL;
  ctx.font = '600 16px system-ui,-apple-system,sans-serif';
  ctx.fillText('AI UNIVERSITY', cx, cy + 18);

  // Tagline below emblem
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '15px system-ui,-apple-system,sans-serif';
  ctx.fillText('Biotech & Life Sciences', cx, H - 44);
  ctx.textAlign = 'left';

  return canvas;
}

function ShareCardModal({ student, careerProfile, onClose }) {
  const canvasRef = useRef(null);
  const career = careerProfile?.career;
  const careerTitle = career?.title ?? 'Life Sciences Professional';

  useEffect(() => {
    const c = generateShareCard({ name: student.name, careerTitle });
    const preview = canvasRef.current;
    if (!preview) return;
    preview.width = c.width; preview.height = c.height;
    preview.getContext('2d').drawImage(c, 0, 0);
  }, []);

  function handleDownload() {
    const c = generateShareCard({ name: student.name, careerTitle });
    const a = document.createElement('a');
    a.download = 'bversity-journey.png';
    a.href = c.toDataURL('image/png');
    a.click();
  }

  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://university.bversity.io')}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-card-modal" onClick={e => e.stopPropagation()}>
        <div className="share-card-modal-header">
          <h2>Share your journey</h2>
          <button className="share-card-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="share-card-preview-wrap">
          <canvas ref={canvasRef} className="share-card-canvas" />
        </div>
        <p className="share-card-hint">Download the image and attach it to your LinkedIn post.</p>
        <div className="share-card-actions">
          <button className="share-card-download-btn" onClick={handleDownload}>↓ Download PNG</button>
          <a className="share-card-linkedin-btn" href={liUrl} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Share on LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}

// ── End Share Card ─────────────────────────────────────────────────────────────

function computeReadiness(careerProfile, progress) {
  if (!careerProfile?.career) return null;
  const ids = careerProfile.career.relevant_subjects || [];
  if (!ids.length) return null;
  const safeProgress = progress || {};
  const BASE = 10, SUBJECT_MAX = 88;
  let scoreSum = 0, completed = 0;
  ids.forEach(id => {
    const p = safeProgress[id];
    if (!p || p.total === 0) return;
    const s = (p.mastered_count + 0.4 * Math.max(0, p.covered_count - p.mastered_count)) / p.total;
    scoreSum += s;
    if (s >= 0.7) completed++;
  });
  const score = Math.min(Math.round(BASE + (scoreSum / ids.length) * SUBJECT_MAX), 98);
  const nextSubjectId = ids.find(id => {
    const p = safeProgress[id];
    if (!p || p.total === 0) return true;
    const s = (p.mastered_count + 0.4 * Math.max(0, p.covered_count - p.mastered_count)) / p.total;
    return s < 0.7;
  });
  const nextSubject = nextSubjectId ? SUBJECTS.find(s => s.id === nextSubjectId) : null;
  return { score, completed, total: ids.length, remaining: ids.length - completed, nextSubject };
}

function CareerReadinessScore({ careerProfile, progress, onViewPath, onShare }) {
  const data = computeReadiness(careerProfile, progress);
  if (!data) return null;
  const { score, remaining, nextSubject } = data;
  const career = careerProfile?.career;

  const R = 52, stroke = 8;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - score / 100);
  const color = score < 30 ? '#f59e0b' : score < 60 ? '#16c1ad' : '#059669';

  const tagline = remaining === 0
    ? `You've covered your full learning path for ${career.title}`
    : nextSubject
      ? `Next up: ${nextSubject.name}, ${remaining} subject${remaining !== 1 ? 's' : ''} left to be interview-ready`
      : `${remaining} subject${remaining !== 1 ? 's' : ''} left on your path to ${career.title}`;

  return (
    <div className="readiness-card" onClick={onViewPath} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onViewPath()}>
      <div className="readiness-arc-wrap">
        <svg width={R * 2 + stroke} height={R * 2 + stroke} className="readiness-svg">
          <circle cx={R + stroke / 2} cy={R + stroke / 2} r={R}
            fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <circle cx={R + stroke / 2} cy={R + stroke / 2} r={R}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            transform={`rotate(-90 ${R + stroke / 2} ${R + stroke / 2})`}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="readiness-score-center">
          <span className="readiness-pct" style={{ color }}>{score}%</span>
          <span className="readiness-label">ready</span>
        </div>
      </div>
      <div className="readiness-text">
        <div className="readiness-title">Career Readiness</div>
        <div className="readiness-career">{career.title}</div>
        <div className="readiness-tagline">{tagline}</div>
        <div className="readiness-card-footer">
          <span className="readiness-cta">View your learning path →</span>
          {onShare && (
            <button className="readiness-share-btn" onClick={e => { e.stopPropagation(); onShare(); }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Share progress
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function USPrepAtAGlanceCard({ student, certSubject, examData, onStudy }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetch(`/api/progress/${student.id}/${certSubject.id}`)
      .then(r => r.json())
      .then(setProgress)
      .catch(() => {});
  }, [student.id, certSubject.id]);

  const coveredSet = new Set((progress?.concepts || []).filter(c => c.covered).map(c => c.id));
  const total      = examData.domains.reduce((sum, d) => sum + d.concepts.length, 0);
  const covered    = examData.domains.reduce((sum, d) => sum + d.concepts.filter(c => coveredSet.has(c.id)).length, 0);
  const pct        = total > 0 ? Math.round((covered / total) * 100) : 0;
  const nextConcept = examData.domains.flatMap(d => d.concepts).find(c => !coveredSet.has(c.id));
  const nextDomain  = examData.domains.find(d => d.concepts.some(c => !coveredSet.has(c.id)));

  const circumference = 2 * Math.PI * 34;
  const dash = (pct / 100) * circumference;

  return (
    <div className="us-glance-card">
      <div className="us-glance-top">
        <div className="us-glance-ring-wrap">
          <svg viewBox="0 0 80 80" className="us-glance-ring">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="7"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke="#00A896" strokeWidth="7"
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <div className="us-glance-ring-inner">
            <span className="us-glance-pct">{pct}%</span>
          </div>
        </div>
        <div className="us-glance-summary">
          <div className="us-glance-label">EXAM READINESS</div>
          <div className="us-glance-cert">{examData.certName}</div>
          <div className="us-glance-counts">
            <span><strong>{covered}</strong> / {total} concepts covered</span>
          </div>
          <div className="us-glance-tutor">{certSubject.tutor} · {certSubject.org}</div>
        </div>
      </div>

      {nextConcept && (
        <div className="us-glance-next">
          <div className="us-glance-next-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Next up · {nextDomain?.name}
          </div>
          <div className="us-glance-next-concept">{nextConcept.name}</div>
          <button className="us-glance-study-btn" onClick={() => onStudy(certSubject)}>
            {covered === 0 ? 'Start studying →' : 'Continue studying →'}
          </button>
        </div>
      )}

      {!nextConcept && covered > 0 && (
        <div className="us-glance-complete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Full curriculum covered — practice questions next
        </div>
      )}
    </div>
  );
}

function HomeView({ student, isFirstTime, careerProfile, onSelect, onViewPath, onPauseSubject, onCareerUpdate }) {
  const [progress, setProgress]   = useState({});
  const [statuses, setStatuses]   = useState({});
  const [unlocking, setUnlocking] = useState(null); // { subject, mode: 'unlock'|'resume'|'at_cap' }
  const [showShare, setShowShare] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  function refreshStatuses() {
    fetch(`/api/subjects/status/${student.id}`).then(r => r.json()).then(setStatuses).catch(() => {});
  }

  useEffect(() => {
    fetch(`/api/progress/${student.id}`).then(r => r.json()).then(setProgress).catch(() => {});
    refreshStatuses();
  }, [student.id]);

  const career         = careerProfile?.career;
  const selectedUsCert = ACTIVE_REGION === 'us' ? US_SUBJECTS.find(s => s.id === careerProfile?.career_id) : null;
  const recommendedIds = new Set(career?.relevant_subjects || []);
  const totalCoveredConcepts = Object.values(progress || {}).reduce((sum, p) => sum + (p.covered_count ?? 0), 0);
  const showCareerNudge = !career && !selectedUsCert && totalCoveredConcepts >= 5 && careerProfile?.motivation === 'stay_ahead' && !nudgeDismissed;
  const activeCount    = Object.values(statuses || {}).filter(s => s.status === 'active').length;
  const careerSubjects = career
    ? (career.relevant_subjects || []).map(id => SUBJECTS.find(s => s.id === id)).filter(Boolean)
    : [];
  const exploreSubjects = career
    ? SUBJECTS.filter(s => !recommendedIds.has(s.id))
    : SUBJECTS;

  const [certSaving, setCertSaving] = useState(false);
  const [switchPrompt, setSwitchPrompt] = useState(null); // cert object

  async function handleUsCertSelect(cert) {
    setCertSaving(cert.id);
    try {
      const res = await fetch(`/api/profile/${student.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_id: cert.id }),
      });
      const data = await res.json();
      onCareerUpdate(data);
    } catch { /* silent */ } finally { setCertSaving(false); }
  }

  function handleOtherCertClick(cert) {
    setSwitchPrompt(cert);
  }

  async function confirmCertSwitch() {
    const cert = switchPrompt;
    setSwitchPrompt(null);
    await handleUsCertSelect(cert);
  }

  async function handleUsAutoUnlock(subject) {
    const st = statuses[subject.id]?.status;
    if (st === 'active') { onSelect(subject); return; }
    if (st === 'paused') { setUnlocking({ subject, mode: 'resume' }); return; }
    try {
      const res = await fetch(`/api/subjects/unlock/${student.id}/${subject.id}`, { method: 'POST' });
      if (res.ok) {
        setStatuses(prev => ({ ...prev, [subject.id]: { status: 'active' } }));
        onSelect(subject);
      }
    } catch {}
  }

  function handleCardClick(subject) {
    if (ACTIVE_REGION === 'us') { handleUsAutoUnlock(subject); return; }
    const st = statuses[subject.id]?.status;
    if (st === 'active') {
      onSelect(subject);
    } else if (st === 'paused') {
      setUnlocking({ subject, mode: 'resume' });
    } else {
      if (activeCount >= 2) {
        setUnlocking({ subject, mode: 'at_cap' });
      } else {
        setUnlocking({ subject, mode: 'unlock' });
      }
    }
  }

  function handleAfterUnlock(subject) {
    setStatuses(prev => ({ ...prev, [subject.id]: { status: 'active' } }));
    setUnlocking(null);
    onSelect(subject);
  }

  function handlePauseFromModal(subject) {
    setUnlocking(null);
    onPauseSubject(subject);
  }

  return (
    <div className="home">
      <div className="home-hero">
        {isFirstTime ? (
          <>
            <h1>Welcome to Bversity, <span>{student.name.split(' ')[0]}</span></h1>
            <p>{ACTIVE_REGION === 'us' ? 'Your AI tutors are ready to help you prep. Pick a certification subject to begin.' : 'Your AI industry experts will guide you through a structured curriculum adapted to you. Pick a subject to begin.'}</p>
          </>
        ) : (
          <>
            <div className="home-hero-top">
              <h1><span className="home-hero-greeting">Welcome back,</span> <span>{student.name.split(' ')[0]}</span></h1>
              {careerProfile?.streak_count > 0 && (
                <div className={`streak-badge${careerProfile.streak_at_risk ? ' streak-badge--risk' : careerProfile.streak_today ? ' streak-badge--done' : ''}`}>
                  <span className="streak-flame">{careerProfile.streak_at_risk ? '⚠️' : '🔥'}</span>
                  <span className="streak-count">{careerProfile.streak_count}</span>
                  <span className="streak-label">{careerProfile.streak_at_risk ? 'streak at risk' : 'day streak'}</span>
                </div>
              )}
            </div>
            <p>{ACTIVE_REGION === 'us' ? 'Your tutors remember where you left off. Pick a subject to continue your prep.' : 'Your experts remember where you left off. Pick a subject to continue.'}</p>
          </>
        )}
        {selectedUsCert ? (
          <div className="career-path-badge" style={{ '--career-color': selectedUsCert.color }}>
            <div className="cpb-text">
              <div className="cpb-title">{selectedUsCert.name}</div>
              <div className="cpb-sub">{selectedUsCert.certification} · {selectedUsCert.certBody} · your certification target</div>
            </div>
          </div>
        ) : career ? (
          <div className="career-path-badge" onClick={onViewPath} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onViewPath()}>
            <span className="cpb-icon">{CAREER_ICONS[career.id]}</span>
            <div className="cpb-text">
              <div className="cpb-title">{career.title}</div>
              <div className="cpb-sub">Your career destination · view path →</div>
            </div>
          </div>
        ) : showCareerNudge ? (
          <div className="career-path-smart-nudge">
            <div className="cpsn-body">
              <span className="cpsn-icon"><IcoTarget /></span>
              <div className="cpsn-text">
                <div className="cpsn-title">You've covered {totalCoveredConcepts} concepts. {ACTIVE_REGION === 'us' ? 'Ready to lock in your certification target?' : 'Ready to pick a destination?'}</div>
                <div className="cpsn-sub">{ACTIVE_REGION === 'us' ? 'Pick a certification and your tutors will focus every session on what matters for that exam.' : 'Adding a career goal lets your experts personalise every lesson from here on.'}</div>
              </div>
            </div>
            <div className="cpsn-actions">
              <button className="cpsn-btn-primary" onClick={onViewPath}>{ACTIVE_REGION === 'us' ? 'Pick a certification' : 'Pick a career path'}</button>
              <button className="cpsn-btn-dismiss" onClick={() => setNudgeDismissed(true)}>Maybe later</button>
            </div>
          </div>
        ) : (
          <div className="career-path-nudge" onClick={onViewPath} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onViewPath()}>
            <span className="career-path-nudge-icon"><IcoTarget /></span>
            {ACTIVE_REGION === 'us' ? 'Pick your certification target. Your tutors will focus every session around it.' : 'Set your career destination. Your experts will personalise your learning path'}
          </div>
        )}
        {activeCount > 0 && (
          <div className="home-active-hint">
            {activeCount === 2
              ? 'You have 2 active subjects. Pause one to start another.'
              : `You have ${activeCount} active subject. You can run up to 2 at once.`}
          </div>
        )}
      </div>

      <div className="home-body">
      <CareerReadinessScore careerProfile={careerProfile} progress={progress} onViewPath={onViewPath} onShare={() => setShowShare(true)} />

      {career ? (
        <>
          <LearningPathTrack
            student={student}
            career={career}
            careerSubjects={careerSubjects}
            progress={progress}
            statuses={statuses}
            activeCount={activeCount}
            onCardClick={handleCardClick}
            onPause={onPauseSubject}
            careerConceptCounts={careerProfile?.career_concept_counts}
          />

          {exploreSubjects.length > 0 && (
            <div className="subjects-section subjects-section--explore">
              <div className="subjects-section-header">
                <h2 className="subjects-section-title">Explore Other Subjects</h2>
                <p className="subjects-section-sub">Not part of your core curriculum, but great for broadening your knowledge in adjacent areas.</p>
              </div>
              <div className="subjects-grid">
                {exploreSubjects.map(s => (
                  <SubjectCard
                    key={s.id}
                    subject={s}
                    progress={(progress || {})[s.id]}
                    status={statuses[s.id]?.status}
                    isRecommended={false}
                    activeCount={activeCount}
                    onClick={() => handleCardClick(s)}
                    onPause={() => onPauseSubject(s)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : ACTIVE_REGION === 'us' ? (
        <>
          {selectedUsCert ? (
            <>
              <div className="subjects-section">
                <div className="subjects-section-header">
                  <h2 className="subjects-section-title">My certification prep</h2>
                  <p className="subjects-section-sub">You are preparing for the {US_EXAM_DOMAINS[selectedUsCert.id]?.certName} · {US_EXAM_DOMAINS[selectedUsCert.id]?.certBody}</p>
                </div>
                <div className="us-cert-hero-row">
                  <SubjectCard
                    subject={selectedUsCert}
                    progress={progress[selectedUsCert.id]}
                    status={statuses[selectedUsCert.id]?.status}
                    isRecommended={true}
                    activeCount={activeCount}
                    onClick={() => handleCardClick(selectedUsCert)}
                    onPause={() => onPauseSubject(selectedUsCert)}
                  />
                  <USPrepAtAGlanceCard
                    student={student}
                    certSubject={selectedUsCert}
                    examData={US_EXAM_DOMAINS[selectedUsCert.id]}
                    onStudy={onSelect}
                  />
                </div>
              </div>
              {SUBJECTS.filter(s => s.id !== selectedUsCert.id).length > 0 && (
                <div className="subjects-section subjects-section--explore">
                  <div className="subjects-section-header">
                    <h2 className="subjects-section-title">Other Certifications</h2>
                    <p className="subjects-section-sub">Explore other clinical research certifications available on Bversity.</p>
                  </div>
                  <div className="subjects-grid">
                    {SUBJECTS.filter(s => s.id !== selectedUsCert.id).map(s => (
                      <SubjectCard
                        key={s.id}
                        subject={s}
                        progress={progress[s.id]}
                        status={statuses[s.id]?.status}
                        isRecommended={false}
                        activeCount={activeCount}
                        onClick={() => handleOtherCertClick(s)}
                        onPause={() => onPauseSubject(s)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="subjects-section">
              <div className="subjects-section-header">
                <h2 className="subjects-section-title">Choose Your Certification</h2>
                <p className="subjects-section-sub">Select the certification you're preparing for and your AI tutor will guide you through the full exam curriculum.</p>
              </div>
              <div className="subjects-grid">
                {SUBJECTS.map(s => (
                  <SubjectCard
                    key={s.id}
                    subject={s}
                    progress={progress[s.id]}
                    status={statuses[s.id]?.status}
                    isRecommended={false}
                    activeCount={activeCount}
                    onClick={() => handleUsCertSelect(s)}
                    onPause={() => onPauseSubject(s)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="subjects-section">
            <div className="subjects-section-header">
              <h2 className="subjects-section-title">All Subjects</h2>
              <p className="subjects-section-sub">Browse all of Bversity's curriculum. <button className="subjects-set-career-link" onClick={onViewPath}>Set a career path</button> to get a personalised recommendation.</p>
            </div>
            <div className="subjects-grid">
              {SUBJECTS.map(s => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  progress={progress[s.id]}
                  status={statuses[s.id]?.status}
                  isRecommended={false}
                  activeCount={activeCount}
                  onClick={() => handleCardClick(s)}
                  onPause={() => onPauseSubject(s)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {unlocking && (
        <SubjectUnlockModal
          subject={unlocking.subject}
          mode={unlocking.mode}
          statuses={statuses}
          progress={progress}
          student={student}
          isRecommended={recommendedIds.has(unlocking.subject.id)}
          onAfterUnlock={handleAfterUnlock}
          onPauseActive={handlePauseFromModal}
          onCancel={() => setUnlocking(null)}
        />
      )}

      {showShare && (
        <ShareCardModal
          student={student}
          careerProfile={careerProfile}
          onClose={() => setShowShare(false)}
        />
      )}

      {switchPrompt && (
        <div className="us-switch-overlay" onClick={() => setSwitchPrompt(null)}>
          <div className="us-switch-modal" onClick={e => e.stopPropagation()}>
            <div className="us-switch-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3m10 0h3a2 2 0 002-2v-3"/></svg>
            </div>
            <h3 className="us-switch-title">Switching to {switchPrompt.name}?</h3>
            <p className="us-switch-body">Before we update your active certification, just checking — what's brought you here?</p>
            <div className="us-switch-options">
              <button className="us-switch-opt us-switch-opt--mistake" onClick={() => setSwitchPrompt(null)}>
                <span className="us-switch-opt-icon">👆</span>
                <div>
                  <div className="us-switch-opt-label">I clicked by mistake</div>
                  <div className="us-switch-opt-sub">Take me back to my current prep</div>
                </div>
              </button>
              <button className="us-switch-opt us-switch-opt--switch" onClick={confirmCertSwitch}>
                <span className="us-switch-opt-icon">🎯</span>
                <div>
                  <div className="us-switch-opt-label">I want to switch to {switchPrompt.certification}</div>
                  <div className="us-switch-opt-sub">Update my active certification — my progress stays</div>
                </div>
              </button>
            </div>
            <p className="us-switch-note">Your study progress for any certification is never lost when you switch.</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function SubjectCard({ subject, progress, status, isRecommended, activeCount, onClick, onPause }) {
  const covered  = progress?.covered_count  ?? 0;
  const mastered = progress?.mastered_count ?? 0;
  const total    = progress?.total ?? 36;
  const started  = covered > 0;
  const mastPct  = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const covPct   = total > 0 ? Math.round((covered  / total) * 100) : 0;

  const isActive    = status === 'active';
  const isPaused    = status === 'paused';
  const isCompleted = status === 'completed';
  const isLocked    = !isActive && !isPaused && !isCompleted && activeCount >= 2;

  let ctaText = 'Start learning';
  if (isActive)    ctaText = started ? 'Continue learning' : 'Start learning';
  if (isPaused)    ctaText = 'Resume';
  if (isCompleted) ctaText = 'View certificate';
  if (isLocked)    ctaText = 'Pause a subject to unlock';

  return (
    <div
      className={`subject-card${isPaused ? ' subject-card--paused' : ''}${isLocked ? ' subject-card--locked' : ''}${isCompleted ? ' subject-card--completed' : ''}`}
      style={{ '--card-color': subject.color }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className="subject-card-banner">
        <img
          src={SUBJECT_IMAGES[subject.id]}
          className="subject-card-banner-img"
          alt={subject.name}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="subject-card-banner-overlay" style={{ background: `linear-gradient(to top, ${subject.color}DD 0%, ${subject.color}66 55%, rgba(0,0,0,0.25) 100%)` }} />
        <div className="subject-banner-badges">
          {isRecommended && <span className="subject-badge subject-badge--rec">Recommended</span>}
          {isActive    && <span className="subject-badge subject-badge--active">Active</span>}
          {isPaused    && <span className="subject-badge subject-badge--paused">Paused</span>}
          {isCompleted && <span className="subject-badge subject-badge--done">✓ Done</span>}
          {isLocked    && <span className="subject-badge subject-badge--locked"><IcoLock /></span>}
          {isActive && started && (
            <div className="subject-banner-pct" style={{ color: '#ffffff' }}>
              {mastPct}<span className="subject-banner-pct-sym">%</span>
            </div>
          )}
        </div>
        <div className="subject-banner-tutor">
          <img
            src={TUTOR_AVATARS[subject.tutor]}
            className="tutor-photo-sm"
            alt={subject.tutor}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div>
            <div className="subject-banner-tutor-name">{subject.tutor}</div>
            <div className="subject-banner-tutor-org">{subject.org}</div>
          </div>
        </div>
      </div>
      <div className="subject-card-body">
        <div className="subject-name">{subject.name}</div>
        <p className="subject-description">{subject.description}</p>
        {started && (
          <div className="subject-progress">
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${covPct}%`, background: subject.color + '50' }} />
              <div className="progress-bar-fill mastered-fill" style={{ width: `${mastPct}%`, background: subject.color }} />
            </div>
            <span className="progress-label">{mastered}/{total}</span>
          </div>
        )}
        <div className="subject-cta" style={isLocked ? { color: 'var(--text-muted)', cursor: 'default' } : {}}>
          {ctaText}
          {!isLocked && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </div>
        {isActive && (
          <button
            className="subject-pause-link"
            onClick={e => { e.stopPropagation(); onPause(); }}
          >
            Pause this subject
          </button>
        )}
      </div>
    </div>
  );
}

// ── Subject Unlock Modal ───────────────────────────────────────────────────────

function SubjectUnlockModal({ subject, mode, statuses, progress, student, isRecommended, onAfterUnlock, onPauseActive, onCancel }) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const activeSubjects = SUBJECTS.filter(s => statuses[s.id]?.status === 'active');
  // Concepts covered across all active subjects
  const coveredInActive = activeSubjects.reduce((sum, s) => sum + (progress[s.id]?.covered_count ?? 0), 0);
  const milestoneNeeded = 12;
  const milestoneMet    = coveredInActive >= milestoneNeeded;

  async function handleUnlock() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/subjects/unlock/${student.id}/${subject.id}`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        if (d.detail === 'milestone_not_reached') setError('milestone');
        else if (d.detail === 'max_active_reached') setError('at_cap');
        else setError('unknown');
        setLoading(false); return;
      }
      onAfterUnlock(subject);
    } catch { setError('unknown'); setLoading(false); }
  }

  async function handleResume() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/subjects/resume/${student.id}/${subject.id}`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        if (d.detail === 'max_active_reached') setError('at_cap');
        else setError('unknown');
        setLoading(false); return;
      }
      onAfterUnlock(subject);
    } catch { setError('unknown'); setLoading(false); }
  }

  const effectiveMode = error === 'at_cap' ? 'at_cap' : error === 'milestone' ? 'milestone' : mode;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="unlock-modal" style={{ '--card-color': subject.color }}>
        <button className="unlock-modal-close" onClick={onCancel} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div
          className="unlock-modal-banner unlock-modal-banner--photo"
          style={{
            backgroundImage: TUTOR_AVATARS[subject.tutor]
              ? `linear-gradient(to top, ${subject.color}f0 0%, ${subject.color}88 50%, transparent 100%), url(${TUTOR_AVATARS[subject.tutor]})`
              : `linear-gradient(135deg, ${subject.color}cc, ${subject.color}88)`,
          }}
        >
          {isRecommended && <span className="subject-badge subject-badge--rec unlock-modal-rec-badge">Recommended</span>}
          <div className="unlock-modal-banner-text">
            <div className="unlock-modal-subject-name">{subject.name}</div>
            <div className="unlock-modal-tutor">{subject.tutor}</div>
            <div className="unlock-modal-tutor-role">{subject.role} · {subject.org}</div>
          </div>
        </div>

        {effectiveMode === 'resume' && (
          <>
            <div className="unlock-modal-body">
              <h3>Resume {subject.name}?</h3>
              <p>You paused this subject earlier. Pick up right where you left off. Your expert remembers everything.</p>
            </div>
            <div className="unlock-modal-actions">
              <button className="unlock-modal-cancel" onClick={onCancel}>Not now</button>
              <button className="unlock-modal-confirm" style={{ background: subject.color }} onClick={handleResume} disabled={loading}>
                {loading ? 'Resuming…' : 'Resume learning →'}
              </button>
            </div>
          </>
        )}

        {effectiveMode === 'unlock' && (
          <>
            <div className="unlock-modal-body">
              <h3>{activeSubjects.length === 0 ? 'Start your first subject' : 'Unlock a second subject'}</h3>
              <p>
                {activeSubjects.length === 0
                  ? 'This will be your first active subject. You can run up to 2 subjects at the same time.'
                  : `You've covered ${coveredInActive} concept${coveredInActive !== 1 ? 's' : ''} across your active subject${activeSubjects.length !== 1 ? 's' : ''}. You can run this alongside it.`}
              </p>
            </div>
            <div className="unlock-modal-actions">
              <button className="unlock-modal-cancel" onClick={onCancel}>Cancel</button>
              <button className="unlock-modal-confirm" style={{ background: subject.color }} onClick={handleUnlock} disabled={loading}>
                {loading ? 'Starting…' : 'Start learning →'}
              </button>
            </div>
          </>
        )}

        {effectiveMode === 'milestone' && (
          <>
            <div className="unlock-modal-body">
              <h3>Build depth first</h3>
              <p>
                To run two subjects simultaneously, cover at least <strong>{milestoneNeeded} concepts</strong> in your active subject first. You've covered <strong>{coveredInActive}</strong> so far.
              </p>
              <div className="unlock-modal-progress-wrap">
                <div className="unlock-modal-progress-track">
                  <div className="unlock-modal-progress-fill" style={{ width: `${Math.min(100, (coveredInActive / milestoneNeeded) * 100)}%`, background: subject.color }} />
                </div>
                <span className="unlock-modal-progress-label">{coveredInActive}/{milestoneNeeded}</span>
              </div>
              {activeSubjects.length > 0 && (
                <p className="unlock-modal-alt">Or, pause <strong>{activeSubjects[0].name}</strong> and focus solely on this subject.</p>
              )}
            </div>
            <div className="unlock-modal-actions">
              <button className="unlock-modal-cancel" onClick={onCancel}>Keep studying {activeSubjects[0]?.name}</button>
              {activeSubjects.length > 0 && (
                <button className="unlock-modal-confirm" style={{ background: subject.color }} onClick={() => onPauseActive(activeSubjects[0])}>
                  Pause {activeSubjects[0].name} →
                </button>
              )}
            </div>
          </>
        )}

        {effectiveMode === 'at_cap' && (
          <>
            <div className="unlock-modal-body">
              <h3>You're studying 2 subjects</h3>
              <p>Pause one of your active subjects to make room for <strong>{subject.name}</strong>.</p>
              <div className="unlock-modal-active-list">
                {activeSubjects.map(s => (
                  <div key={s.id} className="unlock-modal-active-row" style={{ borderColor: s.color + '44' }}>
                    <span style={{ color: s.color, width: 20, height: 20, flexShrink: 0 }}>{SUBJECT_ICONS[s.id]}</span>
                    <span className="unlock-modal-active-name">{s.name}</span>
                    <button className="unlock-modal-pause-btn" onClick={() => onPauseActive(s)}>Pause</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="unlock-modal-actions">
              <button className="unlock-modal-cancel" onClick={onCancel}>Cancel</button>
            </div>
          </>
        )}

        {error === 'unknown' && (
          <p className="unlock-modal-error">Something went wrong. Please try again.</p>
        )}
      </div>
    </div>
  );
}

// ── Subject Pause View ─────────────────────────────────────────────────────────

function SubjectPauseView({ subject, student, onPaused, onCancel }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);

  async function handlePause() {
    if (!reason) return;
    setSaving(true);
    try {
      await fetch(`/api/subjects/pause/${student.id}/${subject.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, notes: notes.trim() || '' }),
      });
      onPaused(subject);
    } catch { setSaving(false); }
  }

  return (
    <div className="career-change-screen">
      <div className="career-change-card">
        <button className="career-change-cancel-link" onClick={onCancel}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Keep studying {subject.name}
        </button>

        <div className="career-change-current" style={{ borderColor: subject.color + '44', background: subject.color + '0d' }}>
          <span className="career-change-current-label">Pausing</span>
          <span className="career-change-current-name" style={{ color: subject.color }}>
            {subject.name}
          </span>
        </div>

        <h2 className="career-change-heading">Why are you pausing?</h2>
        <p className="career-change-sub">Help your expert understand. You can resume this subject any time.</p>

        <div className="career-change-reasons">
          {PAUSE_REASONS.map(r => (
            <button
              key={r.id}
              className={`career-change-reason ${reason === r.id ? 'selected' : ''}`}
              style={reason === r.id ? { borderColor: subject.color, background: subject.color + '14' } : {}}
              onClick={() => setReason(r.id)}
            >
              <span className="ccr-radio" style={reason === r.id ? { borderColor: subject.color, background: subject.color } : {}}>
                {reason === r.id && <span className="ccr-radio-dot" />}
              </span>
              <span className="ccr-text">
                <span className="ccr-label">{r.label}</span>
                <span className="ccr-sub">{r.sub}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="career-change-notes-wrap">
          <label className="career-change-notes-label">Anything else? <span className="ccr-optional">(optional)</span></label>
          <textarea
            className="career-change-notes"
            placeholder="e.g. I want to focus on Drug Discovery for my internship..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="career-change-actions">
          <button className="career-change-cancel-btn" onClick={onCancel}>Cancel</button>
          <button
            className="career-change-proceed-btn"
            disabled={!reason || saving}
            style={reason ? { background: subject.color, borderColor: subject.color } : {}}
            onClick={handlePause}
          >
            {saving ? 'Pausing…' : `Pause ${subject.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quiz Modal ─────────────────────────────────────────────────────────────

function QuizModal({ moduleId, moduleName, subjectId, studentId, subjectColor, onClose, onPassed }) {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [answers, setAnswers]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults]     = useState(null);

  useEffect(() => {
    setLoading(true); setError('');
    fetch(`/api/quiz/questions/${subjectId}/${moduleId}?student_id=${encodeURIComponent(studentId || '')}`)
      .then(async r => {
        if (r.status === 429) {
          const d = await r.json();
          const mins = d.detail?.match(/cooldown:(\d+)/)?.[1] || '60';
          return Promise.reject({ cooldown: true, mins });
        }
        return r.ok ? r.json() : Promise.reject({});
      })
      .then(d => { setQuestions(d.questions); setLoading(false); })
      .catch(err => {
        if (err.cooldown) {
          setError(`cooldown:${err.mins}`);
        } else {
          setError('Could not load questions. Please try again.');
        }
        setLoading(false);
      });
  }, [moduleId, subjectId, studentId]);

  async function handleSubmit() {
    if (!questions || Object.keys(answers).length < questions.length) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/quiz/submit/${studentId}/${subjectId}/${moduleId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: questions.map((_, i) => answers[i] ?? -1) }),
      });
      const d = await r.json();
      setResults(d);
      if (d.passed) onPassed(moduleId);
    } catch { setError('Submission failed. Please try again.'); }
    finally { setSubmitting(false); }
  }

  const allAnswered = questions && Object.keys(answers).length === questions.length;

  return (
    <div className="quiz-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="quiz-modal">
        <div className="quiz-modal-header" style={{ borderBottomColor: subjectColor + '44' }}>
          <div className="quiz-modal-title">
            <span className="quiz-modal-icon" style={{ color: subjectColor }}>✦</span>
            Module Quiz: <strong>{moduleName}</strong>
          </div>
          <button className="quiz-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="quiz-modal-body">
          {loading && <div className="quiz-loading">Generating your quiz questions…</div>}
          {error && error.startsWith('cooldown:') ? (
            <div className="quiz-cooldown">
              <div className="quiz-cooldown-icon"><IcoClock /></div>
              <div className="quiz-cooldown-title">Come back soon</div>
              <div className="quiz-cooldown-sub">You can retry this quiz in <strong>{error.split(':')[1]} minute{error.split(':')[1] === '1' ? '' : 's'}</strong>. Use the time to review the material.</div>
            </div>
          ) : error ? (
            <div className="quiz-error">{error}</div>
          ) : null}

          {results && (
            <div className={`quiz-results-banner ${results.passed ? 'passed' : 'failed'}`}
                 style={results.passed ? { borderColor: subjectColor + '66', background: subjectColor + '15' } : {}}>
              <div className="quiz-results-score">
                <span className="quiz-results-num">{results.correct}/{results.total}</span>
                <span className="quiz-results-label">correct</span>
              </div>
              <div className="quiz-results-right">
                <div className="quiz-results-verdict" style={results.passed ? { color: subjectColor } : {}}>
                  {results.passed ? '✓ Passed' : '✗ Not quite'}
                </div>
                <div className="quiz-results-sub">
                  {results.passed
                    ? 'Well done! You can move on to the next module.'
                    : 'Review the explanations below and try again.'}
                </div>
              </div>
            </div>
          )}

          {questions && questions.map((q, qi) => {
            const res = results?.results?.[qi];
            const studentAns = answers[qi];
            return (
              <div key={qi} className={`quiz-q-block ${results ? (res.student_answer === res.correct_index ? 'q-correct' : 'q-wrong') : ''}`}>
                <div className="quiz-q-num">Q{qi + 1}</div>
                <div className="quiz-q-text">{q.question}</div>
                <div className="quiz-options">
                  {q.options.map((opt, oi) => {
                    let cls = 'quiz-option';
                    if (results) {
                      if (oi === res.correct_index) cls += ' opt-correct';
                      else if (oi === res.student_answer && res.student_answer !== res.correct_index) cls += ' opt-wrong';
                    } else if (answers[qi] === oi) {
                      cls += ' opt-selected';
                    }
                    return (
                      <label key={oi} className={cls}
                        style={results && oi === res.correct_index ? { borderColor: subjectColor, background: subjectColor + '18' } : {}}>
                        <input type="radio" name={`q${qi}`} value={oi} disabled={!!results}
                          checked={answers[qi] === oi}
                          onChange={() => !results && setAnswers(prev => ({ ...prev, [qi]: oi }))} />
                        <span className="opt-letter">{String.fromCharCode(65 + oi)}</span>
                        <span className="opt-text">{opt.replace(/^[A-D]\.\s*/, '')}</span>
                      </label>
                    );
                  })}
                </div>
                {results && res.student_answer !== res.correct_index && (
                  <div className="quiz-explanation">
                    <strong>Why:</strong> {res.explanation}
                  </div>
                )}
                {results && res.student_answer === res.correct_index && (
                  <div className="quiz-explanation quiz-explanation--correct">
                    {res.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="quiz-modal-footer">
          {!results ? (
            <button className="quiz-submit-btn" disabled={!allAnswered || submitting}
              style={{ background: allAnswered ? subjectColor : undefined }}
              onClick={handleSubmit}>
              {submitting ? 'Scoring…' : `Submit Answers (${Object.keys(answers).length}/${questions?.length ?? 4})`}
            </button>
          ) : results.passed ? (
            <button className="quiz-submit-btn" style={{ background: subjectColor }} onClick={onClose}>
              Continue →
            </button>
          ) : (
            <button className="quiz-retry-btn" onClick={() => { setResults(null); setAnswers({}); }}>
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chat ───────────────────────────────────────────────────────────────────

function ChatView({ subject, student, careerProfile, onBack, onCareerDetected, onViewCapstone, onViewCertificate, onPauseSubject, revisionModule, onRevisionConsumed, autoStart, autoStartIsFirstVisit, onAutoStartConsumed, onOpenLabs }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [conceptsCovered, setConceptsCovered] = useState(0);
  const [conceptsMastered, setConceptsMastered] = useState(0);
  const [conceptsTotal, setConceptsTotal] = useState(12);
  const [notification, setNotification] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizModal, setQuizModal]           = useState(null);
  const [careerBanner, setCareerBanner] = useState(null);
  const [capstoneUnlocked, setCapstoneUnlocked] = useState(false);
  const [conceptVideos, setConceptVideos]   = useState({});
  const [conceptResources, setConceptResources] = useState({});
  const [quizStatus, setQuizStatus]         = useState({});
  const [notesOpen, setNotesOpen]           = useState(false);
  const [showTutorAbout, setShowTutorAbout] = useState(false);
  const [notes, setNotes]                 = useState([]);
  const [noteInput, setNoteInput]         = useState('');
  const [conceptFeedback, setConceptFeedback] = useState({});
  const [msgFeedback, setMsgFeedback]         = useState({});
  const [sessionConceptCount, setSessionConceptCount] = useState(0);
  const [showExitNudge, setShowExitNudge]     = useState(false);
  const [sessionTimerFired, setSessionTimerFired] = useState(false);
  const [showCertShare, setShowCertShare]     = useState(false);
  const [recallActive, setRecallActive]       = useState(false);
  const [recallInput, setRecallInput]         = useState('');
  const [recallSubmitting, setRecallSubmitting] = useState(false);
  const [labNudgeDismissed, setLabNudgeDismissed] = useState(false);
  const messagesEndRef = useRef(null);
  const lastAiMsgRef = useRef(null);
  const inputRef = useRef(null);
  const recallInputRef = useRef(null);
  const historyLengthRef = useRef(0);
  const prevMsgCountRef = useRef(0);

  const [savedConceptIds, setSavedConceptIds] = useState({});
  const [cardHintSeen, setCardHintSeen] = useState(() => !!localStorage.getItem('bv_card_hint_seen'));

  async function loadSavedConcepts() {
    try {
      const data = await fetch(`/api/saved-concepts/${student.id}`).then(r => r.json());
      const map = {};
      data.forEach(sc => { map[sc.title] = sc.id; });
      setSavedConceptIds(map);
    } catch {}
  }

  async function loadNotes() {
    try {
      const res = await fetch(`/api/notes/${student.id}?subject_id=${subject.id}`);
      setNotes(await res.json());
    } catch {}
  }

  async function saveNote(content) {
    try {
      await fetch(`/api/notes/${student.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, subject_id: subject.id }),
      });
      await loadNotes();
    } catch {}
  }

  async function deleteNote(id) {
    try {
      await fetch(`/api/notes/${student.id}/${id}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {}
  }

  async function sendConceptFeedback(conceptTitle, value) {
    setConceptFeedback(prev => ({ ...prev, [conceptTitle]: value }));
    try {
      await fetch('/api/concept-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, subject_id: subject.id, concept_title: conceptTitle, value }),
      });
    } catch {}
  }

  async function sendMsgFeedback(msgIdx, value) {
    setMsgFeedback(prev => ({ ...prev, [msgIdx]: value }));
    try {
      await fetch('/api/message-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, subject_id: subject.id, message_idx: msgIdx, value }),
      });
    } catch {}
  }

  async function handleRecallSubmit() {
    const text = recallInput.trim();
    if (!text || recallSubmitting) return;
    setRecallSubmitting(true);
    setRecallActive(false);
    setRecallInput('');
    // Send as first message with recall_warmup flag so AI asks the recall question,
    // then the student answer flows as the second message
    try {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
      setLoading(true);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, subject_id: subject.id, message: text, recall_warmup: true }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
      setRecallSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleRecallSkip() {
    setRecallActive(false);
    setRecallInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  useEffect(() => {
    if (recallActive) setTimeout(() => recallInputRef.current?.focus(), 100);
  }, [recallActive]);

  useEffect(() => {
    const t = setTimeout(() => setSessionTimerFired(true), 20 * 60 * 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer;
    async function load() {
      try {
        const [histRes, progRes, videosRes, resourcesRes, quizRes] = await Promise.all([
          fetch(`/api/history/${student.id}/${subject.id}`),
          fetch(`/api/progress/${student.id}/${subject.id}`),
          fetch(`/api/concept-videos/${subject.id}`),
          fetch(`/api/resources/${subject.id}`),
          fetch(`/api/quiz/status/${student.id}/${subject.id}`),
        ]);
        if (cancelled) return;
        const hist = await histRes.json();
        const prog = await progRes.json();
        const mappedHist = hist.map((m) => ({ role: m.role === 'assistant' ? 'bot' : m.role, content: m.content }));
        setMessages(mappedHist);
        historyLengthRef.current = mappedHist.length;
        setConceptsCovered(prog.covered_count);
        setConceptsMastered(prog.mastered_count);
        setConceptsTotal(prog.total);
        setConceptVideos(await videosRes.json());
        setConceptResources(await resourcesRes.json());
        setQuizStatus(await quizRes.json());

        // Check recall warmup  -  only if no other auto-trigger and not seen today
        const recallKey = `bv_recall_${student.id}_${subject.id}`;
        if (!revisionModule && !autoStart && !sessionStorage.getItem(recallKey)) {
          try {
            const rc = await fetch(`/api/recall-check/${student.id}/${subject.id}`);
            const rcData = await rc.json();
            if (rcData.needed) {
              sessionStorage.setItem(recallKey, '1');
              setRecallActive(true);
            }
          } catch {}
        }
      } catch {}
      finally {
        if (cancelled) return;
        setHistoryLoading(false);
        if (revisionModule) {
          const msg = `Please give me a focused revision of the "${revisionModule.name}" module. Summarise the key points from each of its sub-topics in a structured way with bullet points.`;
          setInput(msg);
          timer = setTimeout(() => { if (!cancelled) { sendMessageText(msg); if (onRevisionConsumed) onRevisionConsumed(); } }, 200);
        } else if (autoStart) {
          const msg = autoStartIsFirstVisit ? "I'm ready to start." : "I'm ready to continue.";
          timer = setTimeout(() => { if (!cancelled) { sendMessageText(msg); if (onAutoStartConsumed) onAutoStartConsumed(); } }, 300);
        } else {
          timer = setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
    }
    load();
    loadNotes();
    loadSavedConcepts();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [student.id, subject.id]);

  useEffect(() => {
    const prev = prevMsgCountRef.current;
    prevMsgCountRef.current = messages.length;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'bot' && messages.length > prev) {
      // New AI message: scroll to its top so the reader starts from the beginning
      lastAiMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // User message or loading indicator: scroll to bottom as normal
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  useEffect(() => {
    if (!careerBanner) return;
    const t = setTimeout(() => setCareerBanner(null), 6000);
    return () => clearTimeout(t);
  }, [careerBanner]);

  async function sendMessageText(text, overrideQuizMode) {
    if (!text || loading) return;
    const isQuiz = overrideQuizMode ?? false;
    setMessages((prev) => [...prev, { role: 'user', content: text, quiz: isQuiz }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, subject_id: subject.id, message: text, quiz_mode: isQuiz }),
      });
      if (res.status === 429) {
        setMessages(prev => [...prev, { role: 'bot', content: "You've sent a lot of messages this hour. Take a short break and come back fresh. Your progress is saved." }]);
        setLoading(false); return;
      }
      const data = await res.json();
      setIsMock(data.mock);
      const newMsgs = [{ role: 'bot', content: data.reply, quiz: isQuiz }];
      if (data.newly_covered?.length > 0) {
        data.newly_covered.forEach(cid => {
          const vid = conceptVideos[cid]; if (vid) newMsgs.push({ role: 'video', conceptId: cid, driveUrl: vid.drive_url, title: vid.title });
          const resources = conceptResources[cid]; if (resources?.length) newMsgs.push({ role: 'resources', conceptId: cid, resources });
        });
      }
      if (data.modules_completed?.length > 0) data.modules_completed.forEach(mod => newMsgs.push({ role: 'module-quiz', moduleId: mod.id, moduleName: mod.name }));
      if (data.subject_completed) { newMsgs.push({ role: 'subject-complete', credentialId: data.subject_completed.credential_id }); setTimeout(() => setShowCertShare(true), 1800); }
      setMessages((prev) => [...prev, ...newMsgs]);
      if (data.concepts_covered  !== undefined) setConceptsCovered(data.concepts_covered);
      if (data.concepts_mastered !== undefined) setConceptsMastered(data.concepts_mastered);
      if (data.concepts_total    !== undefined) setConceptsTotal(data.concepts_total);
      if (data.newly_mastered?.length > 0) setNotification({ type: 'mastered', ids: data.newly_mastered });
      else if (data.newly_covered?.length > 0) setNotification({ type: 'covered', ids: data.newly_covered });
      if (data.career_detected) { onCareerDetected(data.career_detected); setCareerBanner(data.career_detected); }
      if (data.capstone_now_unlocked) setCapstoneUnlocked(true);
      if (data.newly_covered?.length > 0) {
        setSessionConceptCount(prev => {
          const next = prev + data.newly_covered.length;
          if (next >= 2) setShowExitNudge(true);
          return next;
        });
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Something went wrong. Please try again.' }]);
    } finally { setLoading(false); }
  }

  async function sendMessage(overrideQuizMode) {
    const text = input.trim();
    if (!text || loading) return;
    const isQuiz = overrideQuizMode ?? quizMode;
    setMessages((prev) => [...prev, { role: 'user', content: text, quiz: isQuiz }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, subject_id: subject.id, message: text, quiz_mode: isQuiz }),
      });
      if (res.status === 429) {
        setMessages(prev => [...prev, { role: 'bot', content: "You've sent a lot of messages this hour. Take a short break and come back fresh. Your progress is saved." }]);
        setLoading(false); return;
      }
      const data = await res.json();
      setIsMock(data.mock);
      const replyContent = data.reply || "I'm here  -  go ahead and ask me anything, or tell me what you'd like to learn today.";
      const newMsgs = [{ role: 'bot', content: replyContent, quiz: isQuiz }];
      if (data.newly_covered?.length > 0) {
        data.newly_covered.forEach(cid => {
          const vid = conceptVideos[cid];
          if (vid) newMsgs.push({ role: 'video', conceptId: cid, driveUrl: vid.drive_url, title: vid.title });
          const resources = conceptResources[cid];
          if (resources?.length) newMsgs.push({ role: 'resources', conceptId: cid, resources });
        });
      }
      if (data.modules_completed?.length > 0) {
        data.modules_completed.forEach(mod => {
          newMsgs.push({ role: 'module-quiz', moduleId: mod.id, moduleName: mod.name });
        });
      }
      if (data.subject_completed) { newMsgs.push({ role: 'subject-complete', credentialId: data.subject_completed.credential_id }); setTimeout(() => setShowCertShare(true), 1800); }
      setMessages((prev) => [...prev, ...newMsgs]);
      if (data.concepts_covered  !== undefined) setConceptsCovered(data.concepts_covered);
      if (data.concepts_mastered !== undefined) setConceptsMastered(data.concepts_mastered);
      if (data.concepts_total    !== undefined) setConceptsTotal(data.concepts_total);
      if (data.newly_mastered?.length > 0) {
        setNotification({ type: 'mastered', ids: data.newly_mastered });
      } else if (data.newly_covered?.length > 0) {
        setNotification({ type: 'covered', ids: data.newly_covered });
      }
      if (data.career_detected) {
        onCareerDetected(data.career_detected);
        setCareerBanner(data.career_detected);
      }
      if (data.capstone_now_unlocked) {
        setCapstoneUnlocked(true);
      }
      if (data.newly_covered?.length > 0) {
        setSessionConceptCount(prev => {
          const next = prev + data.newly_covered.length;
          if (next >= 2) setShowExitNudge(true);
          return next;
        });
      }
      if (isQuiz) setQuizMode(false);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Something went wrong. Please try again.' }]);
    } finally { setLoading(false); }
  }

  function handleQuizMe() {
    setInput('Quiz me on what I\'ve covered so far.');
    setQuizMode(true);
  }

  useEffect(() => {
    if (quizMode && input) { sendMessage(true); }
  }, [quizMode]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const isFirstVisit = !historyLoading && messages.length === 0;
  const pct = Math.round((conceptsMastered / conceptsTotal) * 100);
  const coveredPct = Math.round((conceptsCovered / conceptsTotal) * 100);
  const canQuiz = conceptsCovered > conceptsMastered;
  const career = careerProfile?.career;

  return (
    <div className={`chat-view ${notesOpen ? 'notes-open' : ''}`}>
      <div className="chat-header">
        <div className="chat-back-group">
          <button className="chat-back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Courses
          </button>
          {onPauseSubject && (
            <button className="chat-pause-btn" onClick={() => onPauseSubject(subject)} title="Pause this subject">
              Pause
            </button>
          )}
          <button className={`chat-notes-btn ${notesOpen ? 'active' : ''}`} onClick={() => setNotesOpen(v => !v)} title="Notes">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Notes {notes.length > 0 && <span className="chat-notes-count">{notes.length}</span>}
          </button>
        </div>
        <div className="chat-subject-info">
          <img
            src={TUTOR_AVATARS[subject.tutor]}
            className="chat-tutor-photo"
            alt={subject.tutor}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="chat-faculty-info" onClick={() => setShowTutorAbout(true)} style={{ cursor: 'pointer' }} title="About this expert">
            <span className="chat-faculty-name">{subject.tutor}</span>
            <span className="chat-faculty-meta">{subject.role} · {subject.org}</span>
            <span className="chat-faculty-about-link">Read my bio →</span>
          </div>
          {career && (
            <span className="chat-career-chip" style={{ borderColor: subject.color + '66', color: subject.color }}>
              {career.title}
            </span>
          )}
        </div>
        <div className="chat-progress">
          <div className="chat-progress-bar-track">
            <div className="chat-progress-bar-fill covered-bg" style={{ width: `${coveredPct}%`, background: subject.color + '44' }} />
            <div className="chat-progress-bar-fill" style={{ width: `${pct}%`, background: subject.color }} />
          </div>
          <span className="chat-progress-label" title={`${conceptsCovered} covered · ${conceptsMastered} mastered`}>
            {conceptsMastered}/{conceptsTotal} ✓✓
          </span>
        </div>
      </div>

      {isMock && (
        <div className="mock-banner">
          <strong>Mock mode:</strong> Add your <code>ANTHROPIC_API_KEY</code> to <code>.env</code> to enable live AI expert sessions.
        </div>
      )}

      {careerBanner && (
        <div className="career-detected-banner">
          <span className="career-detected-icon"><IcoTarget /></span> <strong>Career path detected:</strong> Check <strong>My Path</strong> in the header to see your personalised career map.
        </div>
      )}

      {capstoneUnlocked && (
        <div className="capstone-unlocked-banner" style={{ borderColor: subject.color }}>
          <span className="capstone-unlock-emoji"><IcoCertificate /></span>
          <div>
            <strong>Capstone project unlocked!</strong> You've covered enough of the {subject.name} curriculum to tackle the real-world capstone.
          </div>
          <button className="capstone-banner-btn" style={{ background: subject.color }} onClick={() => onViewCapstone(subject)}>
            View project →
          </button>
        </div>
      )}

      {notification && (
        <div className={`concept-unlocked-banner ${notification.type}`} style={{ borderColor: subject.color }}>
          {notification.type === 'mastered' ? (
            <><span style={{ color: subject.color }}>✓✓</span> <strong>Mastered:</strong> {notification.ids.map(id => id.replace(/_/g, ' ')).join(', ')}</>
          ) : (
            <><span style={{ color: subject.color }}>✓</span> <strong>Covered:</strong> {notification.ids.map(id => id.replace(/_/g, ' ')).join(', ')}</>
          )}
        </div>
      )}

      <div className={`messages-area${isFirstVisit ? ' is-empty' : ''}`}>
        {historyLoading ? (
          <div className="history-loading">Loading your session...</div>
        ) : (
          <>
            {isFirstVisit && (
              <div className="chat-ready-state">
                <div className="chat-ready-faculty">
                  <div className="chat-ready-avatar" style={{ background: subject.color + '22', borderColor: subject.color + '44' }}>
                    <span style={{ color: subject.color }}>{SUBJECT_ICONS[subject.id]}</span>
                  </div>
                  <div>
                    <div className="chat-ready-name">{subject.tutor}</div>
                    <div className="chat-ready-role">{subject.role} · {subject.org}</div>
                  </div>
                </div>
                <p className="chat-ready-hint">
                  {conceptsCovered > 0
                    ? `${subject.tutor.split(' ')[1] || subject.tutor} will recap where you left off and pick up from your next concept.`
                    : `${subject.tutor.split(' ')[1] || subject.tutor} will introduce themselves and walk you through what you'll cover today.`}
                </p>
                <button
                  className="chat-ready-btn"
                  style={{ background: subject.color }}
                  onClick={() => sendMessageText(conceptsCovered > 0 ? "I'm ready to continue." : "I'm ready to start.")}
                >
                  {conceptsCovered > 0 ? 'Ready to continue →' : 'Ready to begin →'}
                </button>
              </div>
            )}

            {recallActive && (
              <div className="recall-warmup-card" style={{ '--rw-color': subject.color }}>
                <div className="rw-header">
                  <span className="rw-icon" style={{ color: subject.color }}>↩</span>
                  <span className="rw-title">Quick recall before we begin</span>
                </div>
                <p className="rw-prompt">
                  What do you remember from your last session on <strong>{subject.name}</strong>?
                </p>
                <textarea
                  ref={recallInputRef}
                  className="rw-input"
                  placeholder="Jot down whatever comes to mind…"
                  value={recallInput}
                  onChange={e => setRecallInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRecallSubmit(); } }}
                  rows={3}
                />
                <div className="rw-actions">
                  <button
                    className="rw-submit"
                    style={{ background: subject.color }}
                    disabled={!recallInput.trim() || recallSubmitting}
                    onClick={handleRecallSubmit}
                  >
                    {recallSubmitting ? 'Submitting…' : 'Submit recall →'}
                  </button>
                  <button className="rw-skip" onClick={handleRecallSkip}>Skip for now</button>
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.role === 'video') {
                const embedUrl = driveEmbedUrl(msg.driveUrl);
                return (
                  <div key={i} className="concept-video-card">
                    <div className="concept-video-label" style={{ color: subject.color }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      {msg.title || 'Watch: related video'}
                    </div>
                    <div className="concept-video-frame-wrap">
                      <iframe src={embedUrl} className="concept-video-frame" allow="autoplay" allowFullScreen title={msg.title || 'Concept video'} />
                    </div>
                  </div>
                );
              }
              if (msg.role === 'resources') {
                return (
                  <div key={i} className="concept-resources-card">
                    <div className="concept-resources-label" style={{ color: subject.color }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Further reading
                    </div>
                    {msg.resources.map(r => (
                      <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="resource-link-row">
                        <span className={`resource-type-badge resource-type-${r.resource_type}`}>{r.resource_type}</span>
                        <span className="resource-link-title">{r.title}</span>
                        {r.description && <span className="resource-link-desc">{r.description}</span>}
                      </a>
                    ))}
                  </div>
                );
              }
              if (msg.role === 'subject-complete') {
                return (
                  <div key={i} className="subject-complete-banner">
                    <div className="subject-complete-icon"><IcoCertificate /></div>
                    <div className="subject-complete-body">
                      <div className="subject-complete-title">Subject complete!</div>
                      <div className="subject-complete-sub">You've covered all concepts in <strong>{subject.name}</strong>. Your certificate is ready.</div>
                    </div>
                    <button className="subject-complete-btn" style={{ background: subject.color }}
                      onClick={() => onViewCertificate && onViewCertificate(subject)}>
                      View certificate →
                    </button>
                  </div>
                );
              }
              if (msg.role === 'module-quiz') {
                const quizState = quizStatus[msg.moduleId];
                const passed    = quizState?.passed;
                const attempted = quizState !== undefined;
                return (
                  <div key={i} className={`module-quiz-banner ${passed ? 'mq-passed' : ''}`}
                       style={{ borderColor: passed ? subject.color + '88' : subject.color + '44',
                                background: passed ? subject.color + '10' : undefined }}>
                    <div className="module-quiz-left">
                      <span className="module-quiz-icon" style={{ color: subject.color }}>
                        {passed ? '✓' : '✦'}
                      </span>
                      <div>
                        <div className="module-quiz-title">Module complete: <strong>{msg.moduleName}</strong></div>
                        <div className="module-quiz-sub">
                          {passed ? 'Quiz passed. Great work!' : attempted ? 'Not passed yet. Try again.' : 'Test your understanding before moving on.'}
                        </div>
                      </div>
                    </div>
                    {!passed && (
                      <button className="module-quiz-btn" style={{ background: subject.color }}
                        onClick={() => setQuizModal({ moduleId: msg.moduleId, moduleName: msg.moduleName })}>
                        {attempted ? 'Retry quiz →' : 'Take quiz →'}
                      </button>
                    )}
                  </div>
                );
              }
              const cardMatch = msg.role === 'bot' && msg.content ? msg.content.match(/<<<CARD:(\{[\s\S]*?\})>>>/) : null;
              let cardData = null;
              let cardTitle = null;
              if (cardMatch) { try { cardData = JSON.parse(cardMatch[1]); cardTitle = cardData.title; } catch {} }
              const ccVote = cardTitle ? conceptFeedback[cardTitle] : null;
              const msgVote = msgFeedback[i];
              const isLastBot = msg.role === 'bot' && i === messages.length - 1;
              const firstCardIdx = messages.findIndex(m => m.role === 'bot' && m.content && m.content.includes('<<<CARD:'));
              const showCardHint = cardData && !cardHintSeen && i === firstCardIdx;
              return (
                <div key={i} ref={isLastBot ? lastAiMsgRef : null} className={`message-row ${msg.role}${msg.quiz ? ' quiz-message' : ''}`}>
                  <div className={`message-avatar ${msg.role}`}>
                    {msg.role === 'bot' ? subject.tutor.replace(/^Dr\.\s*/, '').charAt(0) : student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="message-body">
                    <div className="message-bubble">
                      {msg.quiz && msg.role === 'bot' && <div className="quiz-label">Assessment</div>}
                      {renderMessageContent(msg.content, { color: subject.color, studentId: student.id, subjectId: subject.id, savedIds: savedConceptIds, skipCard: true })}
                      {msg.role === 'bot' && (
                        <div className="msg-actions-row">
                          <button className="msg-save-btn" title="Save to notes" onClick={() => { saveNote(msg.content); setNotesOpen(true); }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                            Save
                          </button>
                          <button
                            className={`msg-flag-btn${msgVote === 'down' ? ' flagged' : ''}`}
                            title="Flag this response"
                            onClick={() => !msgVote && sendMsgFeedback(i, 'down')}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill={msgVote === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
                            {msgVote === 'down' ? 'Flagged' : 'Flag'}
                          </button>
                        </div>
                      )}
                      {cardTitle && msg.role === 'bot' && (
                        <div className="cc-feedback">
                          <span className="cc-feedback-label">Got this concept?</span>
                          <button className={`cc-feedback-btn up${ccVote === 'up' ? ' active' : ''}`} disabled={!!ccVote} onClick={() => sendConceptFeedback(cardTitle, 'up')} title="I got it">👍</button>
                          <button className={`cc-feedback-btn down${ccVote === 'down' ? ' active' : ''}`} disabled={!!ccVote} onClick={() => sendConceptFeedback(cardTitle, 'down')} title="Still confused">👎</button>
                          {ccVote && <span className="cc-feedback-thanks">{ccVote === 'up' ? 'Great!' : 'Noted. Will revisit.'}</span>}
                        </div>
                      )}
                    </div>
                    {cardData && msg.role === 'bot' && (
                      <ConceptCard data={cardData} color={subject.color} studentId={student.id} subjectId={subject.id} savedId={savedConceptIds?.[cardData.title]} />
                    )}
                    {showCardHint && (
                      <div className="card-hint">
                        <div className="card-hint-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        </div>
                        <div className="card-hint-text">
                          <strong>This is a Concept Card</strong>  -  a summary of what you just learned. Click it to expand, or save it to revisit from your sidebar anytime.
                        </div>
                        <button className="card-hint-dismiss" onClick={() => { localStorage.setItem('bv_card_hint_seen', '1'); setCardHintSeen(true); }}>Got it</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="message-row bot">
                <div className="message-avatar bot">{subject.tutor.replace(/^Dr\.\s*/, '').charAt(0)}</div>
                <div className="typing-indicator">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {sessionTimerFired && (
        <div className="session-timer-toast">
          <span>You've been studying for 20 minutes. Great session! Take a 5-min break and come back fresh.</span>
          <button className="session-timer-dismiss" onClick={() => setSessionTimerFired(false)}>✕</button>
        </div>
      )}

      {showExitNudge && !sessionTimerFired && (
        <div className="exit-nudge">
          <span className="exit-nudge-icon">✦</span>
          <div className="exit-nudge-text">
            <strong>Strong session!</strong> You've covered {sessionConceptCount} new concept{sessionConceptCount > 1 ? 's' : ''} today.
          </div>
          <button className="exit-nudge-dismiss" onClick={() => setShowExitNudge(false)}>✕</button>
        </div>
      )}

      {showCertShare && (
        <div className="cert-share-overlay" onClick={() => setShowCertShare(false)}>
          <div className="cert-share-nudge" onClick={e => e.stopPropagation()}>
            <button className="cert-share-close" onClick={() => setShowCertShare(false)}>✕</button>
            <div className="cert-share-emoji">🎓</div>
            <div className="cert-share-title">You've completed {subject.name}!</div>
            <div className="cert-share-sub">Share your certificate on LinkedIn. It takes 30 seconds and lets your network know you're building real expertise.</div>
            <div className="cert-share-actions">
              <button className="cert-share-li-btn" onClick={() => { setShowCertShare(false); onViewCertificate && onViewCertificate(subject); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                View & share certificate
              </button>
              <button className="cert-share-skip" onClick={() => setShowCertShare(false)}>Maybe later</button>
            </div>
          </div>
        </div>
      )}

      {(() => {
        const subjectHasLabs = INDUSTRY_LABS.some(s => s.subject_id === subject.id);
        const showLabNudge = subjectHasLabs && conceptsCovered >= 3 && !labNudgeDismissed && messages.length >= 6;
        return showLabNudge ? (
          <div className="lab-chat-nudge" style={{ borderColor: subject.color + '40', background: subject.color + '08' }}>
            <div className="lab-chat-nudge-content">
              <span className="lab-chat-nudge-icon" style={{ color: subject.color }}>🧪</span>
              <div>
                <span className="lab-chat-nudge-title">Ready for a real-world challenge?</span>
                <span className="lab-chat-nudge-sub">We have a hands-on Industry Innovation Lab project for {subject.name}.</span>
              </div>
            </div>
            <div className="lab-chat-nudge-actions">
              <button className="lab-chat-nudge-btn" style={{ background: subject.color }} onClick={() => onOpenLabs && onOpenLabs()}>Try the lab →</button>
              <button className="lab-chat-nudge-dismiss" onClick={() => setLabNudgeDismissed(true)}>Dismiss</button>
            </div>
          </div>
        ) : null;
      })()}

      <div className="chat-input-area">
        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${subject.tutor.split(' ')[1] || subject.tutor} anything…`}
            rows={1}
            disabled={historyLoading}
          />
          {canQuiz && !historyLoading && (
            <button className="quiz-btn" onClick={handleQuizMe} disabled={loading} title="Test your understanding">
              Quiz me
            </button>
          )}
          <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading || historyLoading} aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="input-hint">Enter to send · Shift+Enter for new line{canQuiz ? ' · "Quiz me" to test your understanding' : ''}</p>
      </div>

      {notesOpen && (
        <div className="notes-panel">
          <div className="notes-panel-header">
            <span className="notes-panel-title">Notes: {subject.name}</span>
            <button className="notes-panel-close" onClick={() => setNotesOpen(false)}>×</button>
          </div>
          <div className="notes-freeform">
            <textarea
              className="notes-freeform-input"
              placeholder="Write a note…"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              rows={3}
            />
            <button className="notes-freeform-save" style={{ background: subject.color }}
              disabled={!noteInput.trim()}
              onClick={() => { saveNote(noteInput.trim()); setNoteInput(''); }}>
              Save note
            </button>
          </div>
          <div className="notes-list">
            {notes.length === 0 && <p className="notes-empty">No notes yet. Save a message or write one above.</p>}
            {notes.map(n => (
              <div key={n.id} className="notes-item">
                <div className="notes-item-content">{renderMessageContent(n.content)}</div>
                <div className="notes-item-footer">
                  <span className="notes-item-date">{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <button className="notes-item-delete" onClick={() => deleteNote(n.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {quizModal && (
        <QuizModal
          moduleId={quizModal.moduleId}
          moduleName={quizModal.moduleName}
          subjectId={subject.id}
          studentId={student.id}
          subjectColor={subject.color}
          onClose={() => setQuizModal(null)}
          onPassed={(moduleId) => {
            setQuizStatus(prev => ({ ...prev, [moduleId]: { passed: true } }));
            setQuizModal(null);
          }}
        />
      )}

      {showTutorAbout && (
        <div className="modal-overlay" onClick={() => setShowTutorAbout(false)}>
          <div className="tutor-about-modal" onClick={e => e.stopPropagation()}>
            <button className="tutor-about-close" onClick={() => setShowTutorAbout(false)}>×</button>
            <div
              className="tutor-about-photo"
              style={{
                backgroundImage: TUTOR_AVATARS[subject.tutor]
                  ? `linear-gradient(to top, ${subject.color}ee 0%, ${subject.color}44 50%, transparent 100%), url(${TUTOR_AVATARS[subject.tutor]})`
                  : `linear-gradient(135deg, ${subject.color}cc, ${subject.color}66)`,
              }}
            >
              <div className="tutor-about-overlay">
                <div className="tutor-about-name">{subject.tutor}</div>
                <div className="tutor-about-role">{subject.role}</div>
                <div className="tutor-about-org">{subject.org}</div>
              </div>
            </div>
            <div className="tutor-about-body">
              <blockquote className="tutor-about-quote" style={{ borderColor: subject.color }}>
                "{subject.intro}"
              </blockquote>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── App Root ────────────────────────────────────────────────────────────────

export default function App() {
  const isAdminMode = window.location.hash === '#admin';
  if (isAdminMode) return <AdminView onBack={() => { window.location.hash = ''; }} />;

  const verifyMatch = window.location.pathname.match(/^\/verify\/(?:BVG-)?([A-Z0-9]+)$/i);
  if (verifyMatch) return <PublicCertificateView credentialId={verifyMatch[1].toUpperCase()} />;

  const [student, setStudent] = useState(getStoredStudent);
  const [screen, setScreen] = useState('welcome');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [revisionModule, setRevisionModule]   = useState(null);
  const [capstoneSubject, setCapstoneSubject] = useState(null);
  const [certificateSubject, setCertificateSubject] = useState(null);
  const [pauseSubject, setPauseSubject] = useState(null);
  const [view, setView] = useState('home');
  const [activeLabProject, setActiveLabProject] = useState(null);
  const [activeLabSubject, setActiveLabSubject] = useState(null);
  const [isReturning, setIsReturning] = useState(!!getStoredStudent());
  const [careerProfile, setCareerProfile] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFreeTrial, setShowFreeTrial] = useState(false);
  const [showReEntry, setShowReEntry] = useState(false);
  const [showSearch, setShowSearch]     = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [showContact, setShowContact]   = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [imgConfig, setImgConfig] = useState(null);

  useEffect(() => {
    fetch('/api/images').then(r => r.json()).then(setImgConfig).catch(() => {});
  }, []);

  async function fetchCareerProfile(studentId) {
    try {
      const res = await fetch(`/api/profile/${studentId}`);
      if (res.status === 404) {
        clearStudent();
        setStudent(null);
        setScreen('welcome');
        return;
      }
      const data = await res.json();
      setCareerProfile(data);
      if (!data.onboarded) setShowOnboarding(true);
      else if (!data.linkedin_url) {
        setShowLinkedIn(true);
      }
    } catch {}
  }

  useEffect(() => {
    const s = getStoredStudent();
    if (s) fetchCareerProfile(s.id);
  }, []);

  useEffect(() => {
    if (!student) return;
    const doneKey = `bv_feedback_done_${student.id}`;
    const timeKey = `bv_time_spent_${student.id}`;
    if (localStorage.getItem(doneKey)) return;
    const interval = setInterval(() => {
      const spent = parseInt(localStorage.getItem(timeKey) || '0', 10) + 60;
      localStorage.setItem(timeKey, String(spent));
      if (spent >= 1800) {
        clearInterval(interval);
        setShowFeedback(true);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [student]);

  useEffect(() => {
    if (!student) return;
    const seenKey = `bv_freetrial_seen_${student.id}`;
    if (sessionStorage.getItem(seenKey)) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(seenKey, '1');
      setShowFreeTrial(true);
    }, 10 * 60 * 1000);
    return () => clearTimeout(t);
  }, [student]);

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (student) setShowSearch(v => !v);
      }
      if (e.key === 'Escape') setShowSearch(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [student]);

  function handleSearchStudy(item) {
    // item is either a concept {subject_id, ...} or a note {subject_id, ...}
    const subj = SUBJECTS.find(s => s.id === item.subject_id);
    if (!subj) return;
    setSelectedSubject(subj);
    setSubjectEntryPhase(null);
    setAutoStartChat(false);
    setView('chat');
  }

  function handleLogin(data) {
    const s = { id: data.student_id || data.id, name: data.name };
    storeStudent(s);
    setStudent(s);
    setIsReturning(data.returning);
    fetchCareerProfile(s.id);
    // show re-entry screen only for returning users, once per browser session
    const reentryKey = `bv_reentry_${s.id}`;
    if (data.returning && !sessionStorage.getItem(reentryKey)) {
      sessionStorage.setItem(reentryKey, '1');
      setShowReEntry(true);
    }
    setView('home');
  }

  function handleLogout() {
    clearStudent();
    setStudent(null);
    setSelectedSubject(null);
    setCapstoneSubject(null);
    setCertificateSubject(null);
    setCareerProfile(null);
    setView('home');
    setIsReturning(false);
  }

  const [subjectEntryPhase, setSubjectEntryPhase] = useState(null); // 'intro' | 'session' | null
  const [autoStartChat, setAutoStartChat]         = useState(false);
  const [sessionIsFirstVisit, setSessionIsFirstVisit] = useState(false);

  function handleSelectSubject(subject) {
    window.scrollTo(0, 0);
    setSelectedSubject(subject);
    const met = localStorage.getItem(`bv_met_${subject.id}_${student?.id}`);
    setSubjectEntryPhase(met ? 'session' : 'intro');
    setView('subject-entry');
  }

  function handleBack() {
    window.scrollTo(0, 0);
    fireSessionEnd();
    setSelectedSubject(null);
    setSubjectEntryPhase(null);
    setAutoStartChat(false);
    setView('home');
  }

  function fireSessionEnd() {
    if (selectedSubject && student) {
      fetch(`/api/session-end/${student.id}/${selectedSubject.id}`, { method: 'POST' }).catch(() => {});
    }
  }

  function handlePauseSubject(subject) {
    fireSessionEnd();
    setPauseSubject(subject);
    setView('subject-pause');
  }

  function handleSubjectPaused(subject) {
    setPauseSubject(null);
    setSelectedSubject(null);
    setView('home');
  }

  function handleCareerPath() {
    if (ACTIVE_REGION === 'us') {
      setView('career-map');
    } else if (careerProfile?.career_id) {
      setView('career-map');
    } else {
      setView('career-select');
    }
  }

  function handleCareerSelected(profileData) {
    setCareerProfile(profileData);
    setView('career-map');
  }

  function handleCareerDetected(career_id) {
    if (student) fetchCareerProfile(student.id);
  }

  function handleViewCapstone(subject) {
    fireSessionEnd();
    setCapstoneSubject(subject);
    setView('capstone');
  }

  function handleViewCertificate(subject) {
    fireSessionEnd();
    setCertificateSubject(subject);
    setView('certificate');
  }

  if (!student) {
    if (screen === 'welcome') return <WelcomeScreen onGetStarted={() => setScreen('login')} />;
    return <LoginView onLogin={handleLogin} onBack={() => setScreen('welcome')} />;
  }

  if (showOnboarding) {
    return (
      <OnboardingView
        student={student}
        careerProfile={careerProfile}
        onComplete={(profileData) => {
          setShowOnboarding(false);
          if (profileData) setCareerProfile(profileData);
          if (profileData?.career_id) setView('career-map');
        }}
      />
    );
  }

  if (showReEntry && student) {
    return (
      <ReEntryScreen
        student={student}
        onGo={(subject) => {
          setShowReEntry(false);
          handleSelectSubject(subject);
        }}
        onDismiss={() => setShowReEntry(false)}
      />
    );
  }

  return (
    <ImgCtx.Provider value={imgConfig}>
    <div className="app-shell">
      <Sidebar
        student={student}
        view={view}
        onCourses={() => { setSelectedSubject(null); setCapstoneSubject(null); setView('home'); }}
        onDashboard={() => setView('dashboard')}
        onCareerPath={handleCareerPath}
        onProfile={() => setView('profile')}
        onCommunity={() => setView('community')}
        onPrograms={() => setView('programs')}
        onLibrary={() => setView('library')}
        onLabs={() => setView('labs')}
        onLogout={handleLogout}
        hasCareer={!!careerProfile?.career_id}
        avatarColor={careerProfile?.avatar_color}
        avatarNum={careerProfile?.avatar_num}
        onSearch={() => setShowSearch(true)}
        onContact={() => setShowContact(true)}
      />
      {showSearch && (
        <SearchModal
          student={student}
          onStudy={item => { handleSearchStudy(item); setShowSearch(false); }}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showContact && student && (
        <FounderContactModal student={student} onClose={() => setShowContact(false)} />
      )}
      {showLinkedIn && student && (
        <LinkedInModal
          student={student}
          onSaved={(updates) => {
            setCareerProfile(prev => ({ ...prev, ...updates }));
            setShowLinkedIn(false);
          }}
        />
      )}
      <main className="main-panel">
      <ErrorBoundary>
      {view === 'subject-pause' && pauseSubject ? (
        <SubjectPauseView
          subject={pauseSubject}
          student={student}
          onPaused={handleSubjectPaused}
          onCancel={() => { setPauseSubject(null); setView(selectedSubject ? 'chat' : 'home'); }}
        />
      ) : view === 'subject-entry' && selectedSubject ? (
        subjectEntryPhase === 'intro' ? (
          <ExpertIntroScreen
            subject={selectedSubject}
            student={student}
            onReady={() => setSubjectEntryPhase('session')}
            onBack={handleBack}
          />
        ) : (
          <SessionStartScreen
            subject={selectedSubject}
            student={student}
            onBegin={(firstVisit) => { setSessionIsFirstVisit(firstVisit); setAutoStartChat(true); setSubjectEntryPhase(null); setView('chat'); }}
            onBack={() => {
              const met = localStorage.getItem(`bv_met_${selectedSubject.id}_${student?.id}`);
              met ? handleBack() : setSubjectEntryPhase('intro');
            }}
          />
        )
      ) : view === 'chat' && selectedSubject ? (
        <ChatView
          subject={selectedSubject}
          student={student}
          careerProfile={careerProfile}
          onBack={handleBack}
          onCareerDetected={handleCareerDetected}
          onViewCapstone={handleViewCapstone}
          onViewCertificate={handleViewCertificate}
          onPauseSubject={handlePauseSubject}
          revisionModule={revisionModule}
          onRevisionConsumed={() => setRevisionModule(null)}
          autoStart={autoStartChat}
          autoStartIsFirstVisit={sessionIsFirstVisit}
          onAutoStartConsumed={() => { setAutoStartChat(false); setSessionIsFirstVisit(false); }}
          onOpenLabs={() => setView('labs')}
        />
      ) : view === 'dashboard' ? (
        ACTIVE_REGION === 'us' ? (
          <USDashboardView
            student={student}
            careerProfile={careerProfile}
            onStudy={(subject) => { setSelectedSubject(subject); setView('chat'); }}
          />
        ) : (
          <DashboardView
            student={student}
            careerProfile={careerProfile}
            onStudy={(subject, mod) => { setSelectedSubject(subject); setRevisionModule(mod || null); setView('chat'); }}
            onCapstone={handleViewCapstone}
            onCertificate={handleViewCertificate}
          />
        )
      ) : view === 'certificate' && certificateSubject ? (
        <CertificateView
          student={student}
          subject={certificateSubject}
          onBack={() => setView('dashboard')}
          onStudy={handleSelectSubject}
        />
      ) : view === 'capstone' && capstoneSubject ? (
        <CapstoneView
          subject={capstoneSubject}
          student={student}
          onBack={() => setView('dashboard')}
        />
      ) : view === 'profile' ? (
        <ProfileView
          student={student}
          profileData={careerProfile}
          onBack={() => setView('home')}
          onProfileUpdated={(updates) => setCareerProfile(prev => ({ ...prev, ...updates }))}
        />
      ) : view === 'library' ? (
        <ConceptLibraryView student={student} />
      ) : view === 'labs' ? (
        <IndustryLabsView
          student={student}
          onOpenProject={(proj, subj) => {
            setActiveLabProject(proj);
            setActiveLabSubject(subj);
            setView('lab-project');
          }}
        />
      ) : view === 'lab-project' && activeLabProject ? (
        <LabProjectView
          student={student}
          project={activeLabProject}
          subject={activeLabSubject}
          onBack={() => setView('labs')}
        />
      ) : view === 'community' ? (
        <CommunityMapView
          student={student}
          onAddLocation={() => setView('profile')}
        />
      ) : view === 'programs' ? (
        <DegreeProgramsView />
      ) : view === 'career-select' ? (
        <CareerSelectView
          student={student}
          currentCareerId={careerProfile?.career_id}
          onSelect={handleCareerSelected}
          onBack={() => setView('home')}
        />
      ) : view === 'career-map' ? (
        ACTIVE_REGION === 'us' ? (
          <USExamBlueprintView
            student={student}
            careerProfile={careerProfile}
            onBack={() => setView('home')}
          />
        ) : (
          <CareerMapView
            student={student}
            careerProfile={careerProfile}
            onBack={() => setView('home')}
            onChangePath={() => setView('career-change')}
            onStudy={handleSelectSubject}
          />
        )
      ) : view === 'career-change' ? (
        <CareerChangeView
          student={student}
          careerProfile={careerProfile}
          onProceed={() => setView('career-select')}
          onTalkToTutor={() => setView('home')}
          onCancel={() => setView('career-map')}
        />
      ) : (
        <HomeView
          student={student}
          isFirstTime={!isReturning}
          careerProfile={careerProfile}
          onSelect={handleSelectSubject}
          onViewPath={handleCareerPath}
          onPauseSubject={handlePauseSubject}
          onCareerUpdate={handleCareerSelected}
        />
      )}
      </ErrorBoundary>
      </main>
      {showFreeTrial && <FreeTrialModal onClose={() => setShowFreeTrial(false)} />}
      {showFeedback && student && (
        <FeedbackModal
          studentId={student.id}
          onClose={() => {
            setShowFeedback(false);
            localStorage.setItem(`bv_feedback_done_${student.id}`, '1');
          }}
        />
      )}
    </div>
    </ImgCtx.Provider>
  );
}
