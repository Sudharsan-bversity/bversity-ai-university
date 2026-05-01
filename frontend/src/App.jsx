import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

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
};

const TUTOR_PHOTOS = {
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
};

const SUBJECTS = [
  { id: 'bioinformatics',     name: 'Bioinformatics',                             tutor: 'Dr. Priya Nair',    role: 'Senior Bioinformatics Scientist',                  org: 'Broad Institute of MIT and Harvard', color: '#00A896', description: 'Sequence analysis, BLAST, phylogenetics, NGS pipelines, protein structure, and computational biology tools',
    intro: "I build computational pipelines to make sense of genomic data at scale — everything from cancer mutation signatures to population-level association studies. I've watched bioinformatics go from a niche specialty to the backbone of modern medicine, and I want to give you that foundation properly. By the end of this, you'll be fluent in the tools and concepts that the industry actually uses." },
  { id: 'genomics',           name: 'Genomics',                                    tutor: 'Dr. Marcus Webb',   role: 'Director of Genomics Research',                   org: 'Illumina',                           color: '#7B2D8B', description: 'Genome structure, sequencing technologies, variant analysis, GWAS, single-cell, and precision medicine',
    intro: "I work at the company that sequences more of the world's DNA than anyone else. I've watched the cost of sequencing a genome drop from $3 billion to under $200 in my career — and what that's done to medicine is still unfolding. This subject will give you the conceptual and technical grounding to understand what's coming next." },
  { id: 'drug_discovery',     name: 'Drug Discovery & Development',                tutor: 'Dr. Kavya Reddy',   role: 'Principal Scientist, Drug Discovery',             org: 'Genentech',                          color: '#E05C00', description: 'Target identification, HTS, medicinal chemistry, ADMET, preclinical development, and the full pipeline',
    intro: "I've taken small molecule programs from target identification all the way through Phase I trials. I've seen molecules fail at every stage of the pipeline — and a few make it. I'll teach you why the process looks the way it does, what catastrophe you'd invite by skipping each stage, and how to think like a drug hunter." },
  { id: 'clinical_trials',    name: 'Clinical Trials & Regulatory Affairs',        tutor: 'Dr. Elena Vasquez', role: 'Head of Regulatory Affairs',                      org: 'Novartis',                           color: '#0066CC', description: 'Trial phases, FDA/EMA regulations, ICH guidelines, adaptive designs, and NDA/MAA submissions',
    intro: "I've submitted NDAs to both the FDA and the EMA, and I've been in the room when regulators push back. Most scientists understand the biology — very few understand what it takes to convince a regulator that your data is sufficient. That gap is exactly what this subject closes." },
  { id: 'genai_ml',           name: 'Gen AI & Machine Learning for Life Sciences', tutor: 'Dr. Aisha Okonkwo', role: 'Director of Machine Learning',                    org: 'Recursion Pharmaceuticals',          color: '#6B3FA0', description: 'ML foundations, deep learning, protein language models, generative molecules, and AI-driven drug discovery',
    intro: "I use AI to run millions of cellular experiments and find patterns no human could see. I've been at the intersection of ML and biology for a decade — before most people thought that was a real job. I'll be honest with you about where AI in life sciences is genuinely useful and where it's overhyped." },
  { id: 'biotech_business',   name: 'Biotech Business & Management',               tutor: 'Rohan Mehta',       role: 'VP of Corporate Strategy & Business Development', org: 'AstraZeneca',                        color: '#B5451B', description: 'Business models, financing, valuation, BD&L, market access, IP strategy, and building biotech companies',
    intro: "Before AstraZeneca, I spent six years at McKinsey advising pharma and biotech companies on strategy, deals, and market access. I deliberately don't have a PhD — most of what this subject covers is learned in boardrooms and on term sheets, not in classrooms. I'll share what I've actually seen work." },
  { id: 'cell_gene_therapy',  name: 'Cell & Gene Therapy',                         tutor: 'Dr. James Okonkwo', role: 'Director of Vector Development',                  org: 'bluebird bio',                       color: '#0891B2', description: 'Viral vectors, CRISPR genome editing, CAR-T, in vivo and ex vivo gene therapy, CGT manufacturing and regulatory pathways',
    intro: "I've been building viral vectors since before CRISPR existed, and I worked on early AAV programs that eventually became approved therapies. I've watched gene therapy go from an experimental curiosity to transforming patients' lives — and I've seen the failures that built the safety framework we have today. You'll need to understand both." },
  { id: 'protein_engineering',name: 'Protein Engineering & Design',                tutor: 'Dr. Sophie Laurent', role: 'Lead, Computational Protein Design',              org: 'Genentech',                          color: '#BE185D', description: 'Directed evolution, AlphaFold, RFdiffusion, antibody engineering, de novo design, and therapeutic protein formats',
    intro: "I work at the intersection of structural biology and deep learning — designing proteins computationally that actually fold and function. AlphaFold changed everything; things that took years now take weeks. But you need strong physical intuition before the computational tools make sense, and that's where we'll start." },
  { id: 'rna_therapeutics',   name: 'RNA Therapeutics',                            tutor: 'Dr. Amira Hassan',  role: 'VP RNA Platform Sciences',                        org: 'Moderna',                            color: '#B91C1C', description: 'mRNA design, siRNA, ASOs, LNP delivery, RNA vaccines, chemical modifications, and the RNA drug pipeline',
    intro: "I was at Moderna before the COVID vaccine, and I watched mRNA go from a scientific curiosity to the fastest vaccine ever developed. RNA therapeutics is the most exciting drug platform in medicine right now — the reason is that every protein the human genome encodes is now potentially reachable. I'll start there and work forward." },
  { id: 'biomanufacturing',   name: 'Biomanufacturing & Bioprocessing',            tutor: 'Dr. Carlos Reyes',  role: 'VP Bioprocess Development',                       org: 'Lonza',                              color: '#047857', description: 'Upstream and downstream bioprocessing, GMP, cell line development, scale-up, cell therapy manufacturing, and biosimilars',
    intro: "I help companies scale their molecules from lab bench to commercial production — and I've seen what happens when that fails. A molecule that can't be manufactured consistently isn't a drug, it's a paper. Manufacturing is where science meets reality, and I want you to respect it as a scientific discipline, not a downstream afterthought." },
  { id: 'longevity_science',  name: 'Longevity Science',                           tutor: 'Dr. Yuki Tanaka',   role: 'Senior Research Scientist',                       org: 'Calico Life Sciences',               color: '#4338CA', description: 'Hallmarks of aging, cellular senescence, epigenetic clocks, longevity pathways, proteostasis, and the geroscience clinical pipeline',
    intro: "I work at the Alphabet-funded company trying to understand why we age. Longevity science has a credibility problem — too much hype, too many supplements, too many claims not backed by human data. I'll be rigorous with you about what the data actually shows, what's mechanism and what's speculation, and where the genuinely exciting frontiers are." },
];

const SUBJECT_HOURS = {
  bioinformatics:      25,
  genomics:            22,
  drug_discovery:      28,
  clinical_trials:     20,
  genai_ml:            24,
  biotech_business:    18,
  cell_gene_therapy:   22,
  protein_engineering: 20,
  rna_therapeutics:    20,
  biomanufacturing:    18,
  longevity_science:   16,
};

const CLUSTER_COLORS = {
  'Science & Technical':  '#00A896',
  'Business & Commercial': '#0066CC',
  'Emerging & Hybrid':    '#7B2D8B',
};

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
  const m = url.match(/\/file\/d\/([^/?\s]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return url;
}

function TermTooltip({ term }) {
  const [state, setState] = React.useState('idle'); // idle | loading | ready | empty
  const [data, setData] = React.useState(null);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const timerRef = React.useRef(null);
  const fetchedRef = React.useRef(false);

  function prefetch() {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setState('loading');
    fetch(`/api/term-image/${encodeURIComponent(term)}`)
      .then(r => r.json())
      .then(d => {
        if (d.image || d.extract) { setData(d); setState('ready'); }
        else setState('empty');
      })
      .catch(() => setState('empty'));
  }

  function handleMouseEnter() {
    clearTimeout(timerRef.current);
    prefetch();
    timerRef.current = setTimeout(() => { if (state !== 'empty') setState(s => s === 'loading' || s === 'ready' ? s : 'loading'); }, 200);
  }

  function handleMouseLeave() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setState(s => s === 'ready' ? 'ready-hidden' : s), 150);
  }

  const showPopup = state === 'ready' || state === 'loading';

  return (
    <span className="term-tooltip-wrap" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <strong className="term-tooltip-trigger">{term}</strong>
      {showPopup && (
        <span className="term-tooltip-popup" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {state === 'loading' && <span className="term-tooltip-loading">Loading…</span>}
          {state === 'ready' && data?.image && (
            <img src={data.image} alt={term}
              className={`term-tooltip-img${imgLoaded ? ' loaded' : ''}`}
              onLoad={() => setImgLoaded(true)} />
          )}
          {state === 'ready' && data?.extract && (
            <span className="term-tooltip-def">{data.extract}</span>
          )}
        </span>
      )}
    </span>
  );
}

function formatInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return <TermTooltip key={i} term={inner} />;
    }
    return part.split(/(`[^`]+`)/g).map((cp, j) => {
      if (cp.startsWith('`') && cp.endsWith('`')) return <code key={`${i}-${j}`}>{cp.slice(1, -1)}</code>;
      return cp;
    });
  });
}

function formatMessage(text) { return formatInline(text); }

function ConceptCard({ data, color }) {
  const c = color || '#16c1ad';
  return (
    <div className="concept-card" style={{ '--cc-color': c }}>
      <div className="concept-card-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span className="concept-card-label-top" style={{ color: c }}>Concept</span>
        <span className="concept-card-title">{data.title}</span>
      </div>
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
    </div>
  );
}

function renderMessageContent(content, opts = {}) {
  let cardData = null;
  let cleanContent = content;

  const cardMatch = cleanContent.match(/<<<CARD:(\{[\s\S]*?\})>>>/);
  if (cardMatch) {
    try { cardData = JSON.parse(cardMatch[1]); } catch (e) {}
    cleanContent = cleanContent.replace(/\n?<<<CARD:\{[\s\S]*?\}>>>\n?/, '').trim();
  }

  // strip DEFS tag — no longer used for rendering
  cleanContent = cleanContent.replace(/\n?<<<DEFS:\{[\s\S]*?\}>>>\n?/, '').trim();

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
  if (cardData) out.push(<ConceptCard key="cc" data={cardData} color={opts.color} />);
  return out;
}

function subjectById(id) { return SUBJECTS.find(s => s.id === id); }

// ── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({ student, view, onCourses, onDashboard, onCareerPath, onProfile, onCommunity, onPrograms, onLogout, hasCareer, avatarColor }) {
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
      label: hasCareer ? 'My Path' : 'Discover Path',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
      onClick: onCareerPath,
      active: view === 'career-map' || view === 'career-select',
    },
    {
      id: 'community',
      label: 'Community',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
      onClick: onCommunity,
      active: view === 'community',
    },
    {
      id: 'programs',
      label: 'Degree Programs',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
      onClick: onPrograms,
      active: view === 'programs',
      badge: 'Admissions Open',
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo-1.png" alt="Bversity" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${item.active ? 'active' : ''}`}
            onClick={item.onClick}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
            {item.badge && <span className="sidebar-item-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user" onClick={onProfile} style={{ cursor: 'pointer' }} title="Edit profile">
          <div className="sidebar-avatar" style={{ background: avatarColor || 'var(--teal)' }}>{student.name.charAt(0).toUpperCase()}</div>
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

// ── Shared constants ───────────────────────────────────────────────────────

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', "Master's", 'PhD', 'Working Professional', 'Other'];
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
    desc: 'Break into or level up within biotech and life sciences',
  },
  {
    id: 'industry_readiness',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    title: 'Industry Readiness',
    desc: "In a science degree and want to be industry-ready before you graduate",
  },
  {
    id: 'emerging_fields',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Stay Ahead',
    desc: 'Stay current with AI, genomics, longevity and what\'s reshaping the industry',
  },
  {
    id: 'domain_depth',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    title: 'Domain Depth',
    desc: 'Building or working at a biotech company and need rapid domain knowledge',
  },
];
const AVATAR_COLORS = ['#16c1ad','#109285','#1f1f1f','#636363','#0066CC','#6B3FA0','#B5451B','#059669','#DB2777','#E05C00'];

// ── Profile View ───────────────────────────────────────────────────────────

function StudentAvatar({ name, color, size = 40 }) {
  const bg = color || '#16c1ad';
  return (
    <div className="student-avatar-circle" style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}>
      {name.charAt(0).toUpperCase()}
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

function ProfileView({ student, profileData, onBack, onProfileUpdated }) {
  const [college, setCollege]         = useState(profileData?.college || '');
  const [year, setYear]               = useState(profileData?.year_of_study || '');
  const [aspirations, setAspirations] = useState(profileData?.aspirations || '');
  const [motivation, setMotivation]   = useState(profileData?.motivation || '');
  const [tutorNote, setTutorNote]     = useState(profileData?.tutor_note || '');
  const [avatarColor, setAvatarColor] = useState(profileData?.avatar_color || AVATAR_COLORS[0]);
  const [linkedin, setLinkedin]       = useState(profileData?.linkedin_url || '');
  const [github, setGithub]           = useState(profileData?.github_url || '');
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
          tutor_note: tutorNote, avatar_color: avatarColor,
          linkedin_url: linkedin, github_url: github,
          city, state, show_on_map: showOnMap ? 1 : 0,
        }),
      });
      setSaved(true);
      onProfileUpdated({ avatar_color: avatarColor, linkedin_url: linkedin, github_url: github, city, state });
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    finally { setSaving(false); }
  }

  const hasLinkedIn = linkedin.trim().length > 0;
  const hasGitHub   = github.trim().length > 0;

  return (
    <div className="profile-view">
      <div className="profile-header">
        <button className="chat-back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h2 className="profile-title">My Profile</h2>
      </div>

      <div className="profile-body">
        {/* Avatar section */}
        <div className="profile-avatar-section">
          <StudentAvatar name={student.name} color={avatarColor} size={72} />
          <div className="profile-avatar-right">
            <div className="profile-name">{student.name}</div>
            <div className="profile-avatar-label">Pick your colour</div>
            <div className="profile-color-picker">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  className={`profile-color-dot ${avatarColor === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setAvatarColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

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
                LinkedIn is how biotech recruiters find talent. <a href="https://linkedin.com/signup" target="_blank" rel="noreferrer">Create your profile →</a>
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
                GitHub is essential for bioinformatics & AI roles — employers check it. <a href="https://github.com/signup" target="_blank" rel="noreferrer">Create a free account →</a>
              </div>
            )}
          </div>
        </div>

        <div className="profile-divider" />

        {/* Background */}
        <div className="profile-section">
          <h3 className="profile-section-title">Your Background</h3>
          <div className="profile-row">
            <div className="profile-field">
              <label>College / University</label>
              <input type="text" className="profile-input" placeholder="e.g. IIT Bombay, Stanford…" value={college} onChange={e => setCollege(e.target.value)} />
            </div>
            <div className="profile-field profile-field-sm">
              <label>Year of Study</label>
              <select className="profile-select" value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Select…</option>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
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
            <textarea className="profile-textarea" rows={3} placeholder="Where do you want to go in biotech?" value={aspirations} onChange={e => setAspirations(e.target.value)} />
          </div>
          <div className="profile-field">
            <label>Why Bversity?</label>
            <div className="onboarding-chips">
              {MOTIVATION_OPTIONS.map(m => (
                <button key={m.id} type="button" className={`onboarding-chip ${motivation === m.id ? 'selected' : ''}`} onClick={() => setMotivation(m.id)}>
                  {m.label}
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
          <p className="profile-section-sub">Show up on the Bversity Community Map so learners across India can find you.</p>
          <div className="profile-row">
            <div className="profile-field">
              <label>City</label>
              <input type="text" className="profile-input" placeholder="e.g. Bangalore, Mumbai…" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="profile-field profile-field-sm">
              <label>State</label>
              <select className="profile-select" value={state} onChange={e => setState(e.target.value)}>
                <option value="">Select…</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
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

const TOTAL_ONBOARDING_STEPS = 4;

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
          college: college.trim() || '—',
          year_of_study: year || '—',
          aspirations: aspirations.trim() || '—',
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
        {Array.from({ length: TOTAL_ONBOARDING_STEPS }, (_, i) => (
          <div key={i} className={`onboarding-pip ${i + 1 <= step ? 'active' : ''}`} />
        ))}
      </div>

      <div className={`onboarding-card ${step === 3 ? 'onboarding-card--wide' : ''}`}>
        <div className="onboarding-step-label">Step {step} of {TOTAL_ONBOARDING_STEPS}</div>

        {/* ── Step 1: Background ── */}
        {step === 1 && (
          <>
            <h2 className="onboarding-heading">Welcome to Bversity, {student.name.split(' ')[0]}!</h2>
            <p className="onboarding-sub">Let's set up your profile so your AI industry experts can teach to exactly where you are right now.</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <label>Which college or university are you at?</label>
                <input type="text" className="onboarding-input"
                  placeholder="e.g. IIT Bombay, BITS Pilani, Manipal…"
                  value={college} onChange={e => setCollege(e.target.value)} autoFocus
                />
              </div>
              <div className="onboarding-field">
                <label>What year are you in?</label>
                <div className="onboarding-chips">
                  {YEAR_OPTIONS.map(y => (
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
              <button className="onboarding-next" disabled={!canStep2} onClick={() => setStep(3)}>
                Continue <ArrowIcon />
              </button>
            </div>
          </>
        )}

        {/* ── Step 3a: Cluster picker ── */}
        {step === 3 && !selectedCluster && (
          <>
            <h2 className="onboarding-heading">Which world do you see yourself in?</h2>
            <p className="onboarding-sub">This shapes how we personalise your curriculum — you can always change it later.</p>
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
                  desc: 'Research, data, and the pipeline. Roles where science is your primary tool — from bench to bioinformatics.',
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
                  desc: 'Strategy, deals, and market access. Roles where science meets business — from BD to consulting.',
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
                  desc: 'The frontier. Roles that barely existed 10 years ago — AI, precision medicine, and building your own company.',
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
                I'm not sure yet — I'll just explore for now →
              </button>
            </div>
          </>
        )}

        {/* ── Step 3b: Career picker within cluster ── */}
        {step === 3 && !!selectedCluster && (
          <>
            <div className="ob-cluster-back-row">
              <button type="button" className="ob-cluster-back-btn" onClick={() => { setSelectedCluster(''); setSelectedCareerId(''); }}>
                ← Back to clusters
              </button>
              <span className="ob-cluster-badge" style={{ background: CLUSTER_COLORS[selectedCluster] + '18', color: CLUSTER_COLORS[selectedCluster] }}>
                {selectedCluster}
              </span>
            </div>
            <h2 className="onboarding-heading">Now pick your target role</h2>
            <p className="onboarding-sub">Your entire learning roadmap is built around this — every subject, every concept, made relevant to where you're headed.</p>
            <div className="ob-career-grid ob-career-grid--full">
              {careers.filter(c => c.cluster === selectedCluster).map(career => {
                const color = CLUSTER_COLORS[selectedCluster];
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
              <button className="onboarding-back" onClick={() => { setSelectedCluster(''); setSelectedCareerId(''); }}>← Back</button>
              <button className="onboarding-next" disabled={!canStep3} onClick={() => setStep(4)}>
                Continue <ArrowIcon />
              </button>
            </div>
            <div className="ob-explore-skip">
              <button className="ob-explore-btn" onClick={() => { setSelectedCareerId(''); setStep(4); }}>
                I'm not sure yet — I'll just explore for now →
              </button>
            </div>
          </>
        )}

        {/* ── Step 4: Location ── */}
        {step === 4 && (
          <>
            <h2 className="onboarding-heading">Put yourself on the map</h2>
            <p className="onboarding-sub">Show other Bversity learners across India where you're studying from. Be the first in your city or state.</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <label>City</label>
                <input type="text" className="onboarding-input"
                  placeholder="e.g. Bangalore, Mumbai, Chennai…"
                  value={city} onChange={e => setCity(e.target.value)} autoFocus
                />
              </div>
              <div className="onboarding-field">
                <label>State</label>
                <select className="onboarding-input" value={obState} onChange={e => setObState(e.target.value)}>
                  <option value="">Select state…</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <label className="profile-map-toggle">
                <input type="checkbox" checked={showOnMap} onChange={e => setShowOnMap(e.target.checked)} />
                <span className="profile-map-toggle-track" />
                <span className="profile-map-toggle-label">Show me on the community map</span>
              </label>
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back" onClick={() => setStep(3)}>← Back</button>
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
          <div className="hiw-tag">Bversity Adaptive Learning Intelligence</div>
          <h2 className="hiw-title">The world's first AI-Native University for Biotech &amp; Life Sciences</h2>
          <p className="hiw-desc">
            A new kind of university built for the AI era. Not lectures, not video courses, not a fixed curriculum. Bversity is designed from the ground up to be living, adaptive, and career-first. The university of what's next, built to accelerate your career readiness in the fast-evolving life sciences industry.
          </p>
        </div>

        <div className="hiw-section-label">This is where Bversity will lead you to</div>
        <div className="hiw-use-cases">
          <div className="hiw-use-case">
            <div className="hiw-uc-icon">🧭</div>
            <div className="hiw-uc-body">
              <div className="hiw-uc-title">Career Direction</div>
              <div className="hiw-uc-desc">Not sure what your biology degree leads to? Explore real career paths in biotech, from Drug Discovery Scientist to Bioinformatics Engineer, and find exactly where you fit.</div>
            </div>
          </div>
          <div className="hiw-use-case">
            <div className="hiw-uc-icon">🏭</div>
            <div className="hiw-uc-body">
              <div className="hiw-uc-title">Industry Readiness</div>
              <div className="hiw-uc-desc">Build the domain knowledge that companies actually look for. Go beyond university theory and learn how clinical trials, genomics pipelines, and drug discovery work in the real world.</div>
            </div>
          </div>
          <div className="hiw-use-case">
            <div className="hiw-uc-icon">⚡</div>
            <div className="hiw-uc-body">
              <div className="hiw-uc-title">Stay Ahead of Emerging Fields</div>
              <div className="hiw-uc-desc">Longevity science, AI in drug discovery, RNA therapeutics. Bversity keeps you current on the fastest-moving areas of biotech that are reshaping the industry right now.</div>
            </div>
          </div>
          <div className="hiw-use-case">
            <div className="hiw-uc-icon">🚀</div>
            <div className="hiw-uc-body">
              <div className="hiw-uc-title">Become a Forward Deployed Engineer</div>
              <div className="hiw-uc-desc">The most in-demand hybrid role in biotech. Bridge science and technology, and deploy AI solutions directly inside pharma and biotech companies alongside scientists.</div>
            </div>
          </div>
        </div>

        <div className="hiw-section-label">How it works</div>
        <div className="hiw-steps">
          <div className="hiw-step">
            <div className="hiw-step-num">1</div>
            <div className="hiw-step-text">
              <strong>Pick your career path</strong>
              <span>Choose the role you're building towards from curated biotech career tracks.</span>
            </div>
          </div>
          <div className="hiw-step">
            <div className="hiw-step-num">2</div>
            <div className="hiw-step-text">
              <strong>See exactly what it takes</strong>
              <span>Your personalized learning track shows every skill and subject you need — in the right order.</span>
            </div>
          </div>
          <div className="hiw-step">
            <div className="hiw-step-num">3</div>
            <div className="hiw-step-text">
              <strong>Learn through Bversity</strong>
              <span>Bversity's adaptive learning intelligence guides you through each subject with interactive, expert-level depth.</span>
            </div>
          </div>
          <div className="hiw-step">
            <div className="hiw-step-num">4</div>
            <div className="hiw-step-text">
              <strong>Graduate career-ready</strong>
              <span>Earn verified credentials, build a portfolio of domain knowledge, and walk into interviews with confidence.</span>
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
        <div className="welcome-hero">
          <div className="welcome-tag">AI-Native University · Biotech &amp; Life Sciences</div>
          <h1 className="welcome-headline">
            Learn from the world's first<br />
            <span className="welcome-headline-accent">AI-Native Biotech University</span>
          </h1>
          <p className="welcome-subline">
            Master bioinformatics, genomics, drug discovery, and more
            through one-on-one sessions with AI-powered industry experts.
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

        <div className="welcome-subjects-bar">
          {SUBJECTS.map(s => (
            <span key={s.id} className="welcome-subject-pill">
              <span className="welcome-pill-icon">{SUBJECT_ICONS[s.id]}</span>
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <footer className="welcome-footer">
        Powered by Anthropic Claude · Built for the next generation of biotech leaders
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
          <div className="waitlist-field waitlist-field-full">
            <label>Why do you want access?</label>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Tell us about your goals, what you're hoping to learn, or what drew you to Bversity..." rows={4} />
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

// ── Login ───────────────────────────────────────────────────────────────────

function LoginView({ onLogin, onBack }) {
  const [step, setStep]       = useState(1);
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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
          <p className="login-subline">Industry faculty from Broad Institute, Illumina, Genentech, and Novartis — teaching the exact curriculum your career requires.</p>
          <div className="login-features">
            <div className="login-feature"><span className="login-feature-dot" />Career-mapped curriculum — only what you need to know</div>
            <div className="login-feature"><span className="login-feature-dot" />AI industry experts that adapt to your pace and prior knowledge</div>
            <div className="login-feature"><span className="login-feature-dot" />Real-world capstone projects, marked by faculty</div>
          </div>
          <div className="login-chips">
            {['Bioinformatics', 'Genomics', 'Drug Discovery', 'Clinical Trials', 'Gen AI & ML', 'Biotech Business'].map(s => (
              <span key={s} className="login-chip">{s}</span>
            ))}
          </div>
        </div>
      </div>
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
              <p className="login-note">Access is invite-only. Contact sai@bversity.io to request access.</p>
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

        <div className="cpv-header">
          <div className="cpv-cluster-badge" style={{ color, background: color + '18', border: `1px solid ${color}44` }}>
            {career.cluster}
          </div>
          <div className="cpv-icon-wrap" style={{ color }}>
            {CAREER_ICONS[career.id]}
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

function CareerSelectView({ student, currentCareerId, onSelect, onBack }) {
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
        <p>Your AI industry experts will connect every concept they teach to how it's actually used in your target role — making your learning specific and purposeful.</p>
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
                  <div className="career-card-top">
                    <span className="career-card-icon">{CAREER_ICONS[career.id]}</span>
                    <div className="career-card-meta">
                      <div className="career-card-title">{career.title}</div>
                      <div className="career-card-salary">
                        <span className="career-card-salary-us">🇺🇸 {career.salary_range}</span>
                        {career.salary_range_india && <span className="career-card-salary-in">🇮🇳 {career.salary_range_india}</span>}
                      </div>
                    </div>
                    {currentCareerId === career.id && <span className="career-selected-check">✓</span>}
                  </div>
                  <p className="career-card-desc">{career.description}</p>
                  <div className="career-card-cta">
                    {currentCareerId === career.id ? 'Current path' : 'View path →'}
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

function CareerMapView({ student, careerProfile, onBack, onChangePath, onStudy }) {
  const [dashData, setDashData] = useState(null);

  useEffect(() => {
    fetch(`/api/dashboard/${student.id}`).then(r => r.json()).then(setDashData).catch(() => {});
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

      <div className="career-map-hero" style={{ '--career-color': clusterColor }}>
        <div className="career-map-cluster-badge" style={{ background: clusterColor + '22', color: clusterColor, border: `1px solid ${clusterColor}44` }}>
          {career.cluster}
        </div>
        <div className="career-map-icon">{CAREER_ICONS[career.id]}</div>
        <h1 className="career-map-title">{career.title}</h1>
        <p className="career-map-desc">{career.description}</p>
        <div className="career-hero-badges">
          <div className="career-salary-badge" style={{ borderColor: clusterColor, color: clusterColor }}>
            🇺🇸 {career.salary_range}
          </div>
          {career.salary_range_india && (
            <div className="career-salary-badge" style={{ borderColor: clusterColor, color: clusterColor }}>
              🇮🇳 {career.salary_range_india}
            </div>
          )}
          {career.min_qualification && (
            <div className={`career-qual-badge ${career.min_qualification === 'BTech / BSc' ? 'qual-btech' : career.min_qualification === 'Any background' ? 'qual-any' : 'qual-msc'}`}>
              {career.min_qualification === 'BTech / BSc' ? 'Starts with BTech / BSc' :
               career.min_qualification === 'Any background' ? 'Open to all backgrounds' :
               `Entry: ${career.min_qualification}`}
            </div>
          )}
        </div>
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

const INDIA_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

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
              <img src={p.image} alt={p.title} className="deg-card-banner-img" />
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

  useEffect(() => {
    fetch('/api/community/map')
      .then(r => r.json())
      .then(data => { setLearners(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stateSet    = new Set(learners.map(l => l.state).filter(Boolean));
  const totalStates = stateSet.size;
  const myDotIndex  = learners.findIndex(l => l.student_id === student.id);
  const iAmOnMap    = myDotIndex !== -1;

  const markersWithCoords = learners.map((l, i) => ({ ...l, coords: getLearnerCoords(l, i), index: i }))
    .filter(l => l.coords !== null);

  return (
    <div className="community-view">
      <div className="community-header">
        <div className="community-header-left">
          <h1 className="community-title">Bversity Community Map</h1>
          <p className="community-subtitle">
            {learners.length === 0
              ? 'No learners on the map yet — be the very first! Add your city in your profile.'
              : learners.length === 1 && iAmOnMap
              ? "You're the first learner on the map. Share Bversity — get more people on here!"
              : `${learners.length} learner${learners.length !== 1 ? 's' : ''} · ${totalStates} state${totalStates !== 1 ? 's' : ''} · growing every week`}
          </p>
        </div>
        {!iAmOnMap && (
          <button className="community-add-btn" onClick={onAddLocation}>
            + Add my location
          </button>
        )}
      </div>

      <div className="community-map-wrap">
        <div className="community-map-glass">
          {/* Glow orbs for depth */}
          <div className="map-glow map-glow-1" />
          <div className="map-glow map-glow-2" />

          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [82.5, 22], scale: 1050 }}
            width={800}
            height={700}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            <Geographies geography={INDIA_TOPO_URL}>
              {({ geographies }) => geographies.map(geo => {
                const isIndia = geo.id === '356';
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isIndia ? 'rgba(0,200,150,0.11)' : 'rgba(255,255,255,0.025)'}
                    stroke={isIndia ? 'rgba(0,255,136,0.35)' : 'rgba(255,255,255,0.06)'}
                    strokeWidth={isIndia ? 0.9 : 0.3}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: isIndia ? 'rgba(0,255,136,0.16)' : 'rgba(255,255,255,0.04)', cursor: 'default' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })}
            </Geographies>

            {markersWithCoords.map((learner) => {
              const isMe = learner.student_id === student.id;
              return (
                <Marker
                  key={learner.student_id}
                  coordinates={learner.coords}
                  onClick={() => setSelected(learner)}
                >
                  <circle
                    r={isMe ? 7 : 5}
                    fill={isMe ? '#16c1ad' : '#70cdc2'}
                    stroke={isMe ? 'rgba(22,193,173,0.4)' : 'rgba(112,205,194,0.3)'}
                    strokeWidth={isMe ? 3 : 2}
                    className={isMe ? 'map-dot-me' : 'map-dot'}
                    style={{ cursor: 'pointer', filter: `drop-shadow(0 0 5px ${isMe ? '#16c1ad' : '#70cdc2'})` }}
                  />
                </Marker>
              );
            })}
          </ComposableMap>

          {learners.length === 0 && !loading && (
            <div className="map-empty-overlay">
              <div className="map-empty-badge"><IcoMap /></div>
              <p className="map-empty-title">You could be the first dot on this map</p>
              <p className="map-empty-sub">Add your city in your profile — it takes 10 seconds.</p>
            </div>
          )}
        </div>

        <div className="community-legend">
          <span className="legend-item"><span className="legend-dot-green" /> Learner</span>
          <span className="legend-item"><span className="legend-dot-amber" /> You</span>
          <span className="legend-item legend-first">Click a dot to connect</span>
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
            {capstone.instructions.split('\n').filter(l => l.trim()).map((step, i) => (
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
                    <div className="capstone-pending-sub">AI grading in progress — preliminary feedback will appear shortly. Your instructor will confirm the final score.</div>
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
            <p className="feedback-modal-sub">You've been learning for 30 minutes — takes less than a minute.</p>

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
  const [adminKey, setAdminKey]       = useState('');
  const [keyInput, setKeyInput]       = useState('');
  const [showKey, setShowKey]         = useState(false);
  const [tab, setTab]                 = useState('overview');
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
  const [waitlistRequests, setWaitlistRequests]       = useState([]);
  const [waitlistLoading, setWaitlistLoading]         = useState(false);
  const [waitlistAction, setWaitlistAction]           = useState(null);

  async function handleAuth(e) {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setLoading(true); setError('');
    try {
      const key = keyInput.trim();
      const headers = { 'X-Admin-Key': key };
      const [subsRes, overviewRes, studentsRes, emailsRes] = await Promise.all([
        fetch('/api/admin/submissions',    { headers }),
        fetch('/api/admin/overview',       { headers }),
        fetch('/api/admin/students',       { headers }),
        fetch('/api/admin/approved-emails',{ headers }),
      ]);
      if (!subsRes.ok) throw new Error('Invalid admin key');
      setAdminKey(key);
      setSubmissions(await subsRes.json());
      if (overviewRes.ok)  setOverview(await overviewRes.json());
      if (studentsRes.ok)  setStudents(await studentsRes.json());
      if (emailsRes.ok)    setApprovedEmails(await emailsRes.json());
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
    if (!subjectId) { setVideoMap({}); setVideoConcepts([]); return; }
    const [conceptsRes] = await Promise.all([
      fetch(`/api/curriculum/${subjectId}`),
      loadVideoMap(subjectId),
    ]);
    setVideoConcepts(await conceptsRes.json());
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
    <div className="admin-view">
      <div className="admin-nav">
        <button className="chat-back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="admin-title">Faculty Admin Portal</h2>
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`admin-tab ${tab === 'students' ? 'active' : ''}`} onClick={() => setTab('students')}>Students</button>
          <button className={`admin-tab ${tab === 'submissions' ? 'active' : ''}`} onClick={() => setTab('submissions')}>Capstones</button>
          <button className={`admin-tab ${tab === 'videos' ? 'active' : ''}`} onClick={() => setTab('videos')}>Videos</button>
          <button className={`admin-tab ${tab === 'resources' ? 'active' : ''}`} onClick={() => setTab('resources')}>Resources</button>
          <button className={`admin-tab ${tab === 'analytics' ? 'active' : ''}`} onClick={() => { setTab('analytics'); loadAnalytics(); }}>Analytics</button>
          <button className={`admin-tab ${tab === 'emails' ? 'active' : ''}`} onClick={() => { setTab('emails'); loadEmailPreview(); }}>Emails</button>
          <button className={`admin-tab ${tab === 'access' ? 'active' : ''}`} onClick={() => setTab('access')}>Access</button>
          <button className={`admin-tab ${tab === 'feedback' ? 'active' : ''}`} onClick={() => { setTab('feedback'); loadFeedback(); }}>Feedback</button>
          <button className={`admin-tab ${tab === 'waitlist' ? 'active' : ''}`} onClick={() => { setTab('waitlist'); loadWaitlist(); }}>
            Waitlist
            {waitlistRequests.filter(w => w.status === 'pending').length > 0 && (
              <span className="admin-tab-badge">{waitlistRequests.filter(w => w.status === 'pending').length}</span>
            )}
          </button>
        </div>
      </div>

      {tab === 'overview' && (
        <div className="admin-content">
          <div className="admin-overview-grid">
            {[
              { label: 'Total Learners',      value: overview?.total_students    ?? '—', sub: 'registered accounts' },
              { label: 'Active This Week',    value: overview?.active_week       ?? '—', sub: 'sent a message in 7 days' },
              { label: 'Concepts Covered',    value: overview?.total_concepts    ?? '—', sub: 'across all students' },
              { label: 'Messages Sent',       value: overview?.total_messages    ?? '—', sub: 'student messages total' },
              { label: 'Pending Capstones',   value: overview?.pending_capstones ?? '—', sub: 'awaiting your review', alert: (overview?.pending_capstones > 0) },
            ].map(card => (
              <div key={card.label} className={`admin-ov-card ${card.alert ? 'alert' : ''}`}>
                <div className="admin-ov-value">{card.value}</div>
                <div className="admin-ov-label">{card.label}</div>
                <div className="admin-ov-sub">{card.sub}</div>
              </div>
            ))}
          </div>

          <div className="admin-ov-section-title">Recent Activity</div>
          <div className="admin-students-list">
            {students.slice(0, 5).map(s => (
              <div key={s.id} className="admin-student-row">
                <div className="admin-st-avatar" style={{ background: s.avatar_color || '#00A896' }}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="admin-st-info">
                  <div className="admin-st-name">{s.name}</div>
                  <div className="admin-st-email">{s.email}</div>
                </div>
                {s.career_icon && (
                  <div className="admin-st-career">{s.career_icon} {s.career_title}</div>
                )}
                <div className="admin-st-stats">
                  <span>{s.concepts_covered} concepts</span>
                  <span className="admin-st-dot">·</span>
                  <span>{s.message_count} messages</span>
                </div>
                <div className="admin-st-last">
                  {s.last_active ? new Date(s.last_active).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'students' && (
        <div className="admin-content">
          <div className="admin-students-header">
            <span className="admin-students-count">{students.length} learner{students.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="admin-students-list admin-students-list--full">
            {students.length === 0 ? (
              <div className="admin-empty">No students yet.</div>
            ) : students.map(s => (
              <div key={s.id} className="admin-student-row">
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
                  {s.city || s.state ? (
                    <div className="admin-st-location">{[s.city, s.state].filter(Boolean).join(', ')}</div>
                  ) : null}
                </div>
              </div>
            ))}
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
                            alert('AI grading queued — refresh in ~30 seconds.');
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
                                  ...(parsed.criterion_scores || []).map(c => `${c.criterion}: ${c.marks_awarded}/${c.max_marks} — ${c.comments}`),
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
                <option value="">— Select a subject —</option>
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
                <option value="">— Select a subject —</option>
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
                    <div className="email-camp-desc">Sent to all students who have started learning — shows their week's progress.</div>
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
              <option value="">— Select a subject —</option>
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
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function DashboardView({ student, onStudy, onCapstone, onCertificate }) {
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

  const totalCovered  = Object.values(data.subjects).reduce((s, x) => s + x.covered_count, 0);
  const totalMastered = Object.values(data.subjects).reduce((s, x) => s + x.mastered_count, 0);
  const totalConcepts = Object.values(data.subjects).reduce((s, x) => s + x.total, 0);

  const today = new Date();
  const lagDays = studyPlan?.lag_days ?? 0;
  const lagConcepts = studyPlan?.lag_concepts ?? 0;

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <h1>{student.name.split(' ')[0]}'s Learning Map</h1>
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-value">{totalCovered}</span>
            <span className="stat-label">Concepts Covered</span>
          </div>
          <div className="stat-card mastered">
            <span className="stat-value">{totalMastered}</span>
            <span className="stat-label">Concepts Mastered</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totalConcepts}</span>
            <span className="stat-label">Total Curriculum</span>
          </div>
        </div>
        {lagDays >= 2 && (
          <div className="lag-banner">
            <span className="lag-banner-icon"><IcoClock /></span>
            <span>You're <strong>{lagDays} day{lagDays !== 1 ? 's' : ''} behind</strong> your study plan — {lagConcepts} concept{lagConcepts !== 1 ? 's' : ''} overdue. Try to cover {Math.min(lagConcepts, 4)} today to catch up.</span>
          </div>
        )}
      </div>

      {studyPlan && studyPlan.plan?.length > 0 && (
        <div className="study-plan-section">
          <div className="study-plan-header">
            <h2 className="study-plan-title">Your 30-Day Study Plan</h2>
            {lagDays >= 1 && <span className="study-plan-lag-chip">{lagDays}d behind</span>}
          </div>
          <div className="study-plan-scroll">
            {studyPlan.plan.map(day => {
              const dayDate = new Date(day.target_date);
              const isPast  = dayDate < new Date(today.toDateString());
              const isToday = dayDate.toDateString() === today.toDateString();
              const allCovered  = day.concepts.every(c => c.covered);
              const someCovered = day.concepts.some(c => c.covered);
              const isOverdue   = isPast && !allCovered;
              return (
                <div key={day.day} className={`plan-day-card ${isToday ? 'today' : ''} ${isOverdue ? 'overdue' : ''} ${allCovered ? 'done' : ''}`}>
                  <div className="plan-day-label">
                    {isToday ? 'Today' : dayDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="plan-day-num">Day {day.day}</div>
                  <div className="plan-day-concepts">
                    {day.concepts.map(c => {
                      const subj = SUBJECTS.find(s => s.id === c.subject_id);
                      return (
                        <div key={c.concept_id}
                             className={`plan-concept-chip ${c.covered ? 'covered' : ''} ${subj ? 'clickable' : ''}`}
                             style={c.covered ? { borderColor: subj?.color + '88', color: subj?.color } : {}}
                             onClick={() => subj && onStudy(subj)}
                             role={subj ? 'button' : undefined}
                             tabIndex={subj ? 0 : undefined}
                             onKeyDown={e => e.key === 'Enter' && subj && onStudy(subj)}
                             title={subj ? `Go to ${subj.name}` : undefined}>
                          {c.covered ? '✓ ' : ''}{c.concept_id.replace(/_[abc]$/, '').replace(/_/g, ' ')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dashboard-subjects">
        {SUBJECTS.map((subject) => {
          const prog = data.subjects[subject.id];
          const capSub = prog.capstone_submission;
          return (
            <div key={subject.id} className="dashboard-subject-card">
              <div className="dashboard-subject-header">
                <div className="dashboard-subject-title">
                  <img
                    src={TUTOR_PHOTOS[subject.tutor]}
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
                  prog.concepts.forEach(c => {
                    const parent = c.id.replace(/_[abc]$/, '');
                    if (!moduleMap[parent]) moduleMap[parent] = [];
                    moduleMap[parent].push(c);
                  });
                  const subjectVideos = allVideos[subject.id] || {};
                  return Object.entries(moduleMap).map(([moduleId, subs]) => {
                    const allMastered = subs.every(c => c.mastered);
                    const anyCovered  = subs.some(c => c.covered);
                    const displayName = subs.length > 1
                      ? subs[0].name.split(':')[0].split('—')[0].trim()
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
      name: `${cert.subject_name} — Bversity`,
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

function LearningPathTrack({ student, career, careerSubjects, progress, statuses, activeCount, onCardClick, onPause }) {
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
        {careerSubjects.map((s, idx) => {
          const st        = statuses[s.id]?.status;
          const prog      = progress[s.id];
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
                    {isDone   && <span className="lp-badge lp-badge--done">Completed</span>}
                    {isActive && <span className="lp-badge lp-badge--active">In Progress</span>}
                    {isPaused && <span className="lp-badge lp-badge--paused">Paused</span>}
                    {isLocked && <span className="lp-badge lp-badge--locked">Locked</span>}
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
        })}
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
  return (
    <div className="entry-screen">
      <button className="entry-back-btn" onClick={onBack}>← Back to courses</button>
      <div className="entry-card">
        <div className="entry-expert-badge" style={{ background: subject.color + '18', color: subject.color }}>
          {subject.name}
        </div>
        <div className="entry-avatar" style={{ background: subject.color }}>
          {subject.tutor.split(' ').filter(w => w.startsWith('Dr') || w.length > 2).slice(-2).map(w => w[0]).join('')}
        </div>
        <div className="entry-expert-name">{subject.tutor}</div>
        <div className="entry-expert-role">{subject.role} · {subject.org}</div>
        <blockquote className="entry-intro-text">"{subject.intro}"</blockquote>
        <p className="entry-ready-prompt">Ready to begin?</p>
        <button className="entry-cta-btn" style={{ background: subject.color }} onClick={handleReady}>
          Yes, let's go →
        </button>
      </div>
    </div>
  );
}

// ── Subject Entry: Session Contract ────────────────────────────────────────

function SessionStartScreen({ subject, student, onBegin, onBack }) {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [newsItem, setNewsItem] = useState(null);
  const MINS_PER_CONCEPT = 7;

  useEffect(() => {
    Promise.all([
      fetch(`/api/progress/${student.id}/${subject.id}`).then(r => r.json()),
      fetch(`/api/subject-news/${subject.id}`).then(r => r.json()).catch(() => []),
    ]).then(([progressData, newsData]) => {
      const uncovered = (progressData.concepts || []).filter(c => !c.covered).slice(0, 3);
      if (uncovered.length > 0) {
        setConcepts(uncovered);
      } else {
        setConcepts((progressData.concepts || []).slice(0, 3).map(c => ({ ...c, review: true })));
      }
      if (newsData.length > 0) setNewsItem(newsData[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [student.id, subject.id]);

  const totalMins = concepts.length * MINS_PER_CONCEPT;
  const isReview  = concepts[0]?.review;

  function handleBegin() {
    onBegin(newsItem?.title || null);
  }

  return (
    <div className="entry-screen">
      <button className="entry-back-btn" onClick={onBack}>← Back</button>
      <div className="entry-card entry-card--session">
        <div className="entry-session-header">
          <div className="entry-avatar entry-avatar--sm" style={{ background: subject.color }}>
            {subject.tutor.split(' ').filter(w => w.startsWith('Dr') || w.length > 2).slice(-2).map(w => w[0]).join('')}
          </div>
          <div>
            <div className="entry-expert-name entry-expert-name--sm">{subject.tutor}</div>
            <div className="entry-expert-role">{subject.name}</div>
          </div>
        </div>

        {newsItem && (
          <div className="entry-news-card" style={{ borderColor: subject.color + '40' }}>
            <div className="entry-news-eyebrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
                <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
              </svg>
              Before we begin
            </div>
            <div className="entry-news-headline">{newsItem.title}</div>
            {(newsItem.source || newsItem.pub_date) && (
              <div className="entry-news-meta">
                {newsItem.source && <span>{newsItem.source}</span>}
                {newsItem.source && newsItem.pub_date && <span>·</span>}
                {newsItem.pub_date && <span>{newsItem.pub_date}</span>}
              </div>
            )}
            <div className="entry-news-note" style={{ color: subject.color }}>Your expert will connect this to today's session</div>
          </div>
        )}

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

function computeReadiness(careerProfile, progress) {
  if (!careerProfile?.career) return null;
  const ids = careerProfile.career.relevant_subjects || [];
  if (!ids.length) return null;
  const BASE = 10, SUBJECT_MAX = 88;
  let scoreSum = 0, completed = 0;
  ids.forEach(id => {
    const p = progress[id];
    if (!p || p.total === 0) return;
    const s = (p.mastered_count + 0.4 * Math.max(0, p.covered_count - p.mastered_count)) / p.total;
    scoreSum += s;
    if (s >= 0.7) completed++;
  });
  const score = Math.min(Math.round(BASE + (scoreSum / ids.length) * SUBJECT_MAX), 98);
  const nextSubjectId = ids.find(id => {
    const p = progress[id];
    if (!p || p.total === 0) return true;
    const s = (p.mastered_count + 0.4 * Math.max(0, p.covered_count - p.mastered_count)) / p.total;
    return s < 0.7;
  });
  const nextSubject = nextSubjectId ? SUBJECTS.find(s => s.id === nextSubjectId) : null;
  return { score, completed, total: ids.length, remaining: ids.length - completed, nextSubject };
}

function CareerReadinessScore({ careerProfile, progress, onViewPath }) {
  const data = computeReadiness(careerProfile, progress);
  if (!data) return null;
  const { score, remaining, nextSubject } = data;
  const career = careerProfile.career;

  const R = 52, stroke = 8;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - score / 100);
  const color = score < 30 ? '#f59e0b' : score < 60 ? '#16c1ad' : '#059669';

  const tagline = remaining === 0
    ? `You've covered your full learning path for ${career.title}`
    : nextSubject
      ? `Next up: ${nextSubject.name} — ${remaining} subject${remaining !== 1 ? 's' : ''} left to be interview-ready`
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
        <div className="readiness-cta">View your learning path →</div>
      </div>
    </div>
  );
}

function HomeView({ student, isFirstTime, careerProfile, onSelect, onViewPath, onPauseSubject }) {
  const [progress, setProgress]   = useState({});
  const [statuses, setStatuses]   = useState({});
  const [unlocking, setUnlocking] = useState(null); // { subject, mode: 'unlock'|'resume'|'at_cap' }

  function refreshStatuses() {
    fetch(`/api/subjects/status/${student.id}`).then(r => r.json()).then(setStatuses).catch(() => {});
  }

  useEffect(() => {
    fetch(`/api/progress/${student.id}`).then(r => r.json()).then(setProgress).catch(() => {});
    refreshStatuses();
  }, [student.id]);

  const career         = careerProfile?.career;
  const recommendedIds = new Set(career?.relevant_subjects || []);
  const activeCount    = Object.values(statuses).filter(s => s.status === 'active').length;
  const careerSubjects = career
    ? (career.relevant_subjects || []).map(id => SUBJECTS.find(s => s.id === id)).filter(Boolean)
    : [];
  const exploreSubjects = career
    ? SUBJECTS.filter(s => !recommendedIds.has(s.id))
    : SUBJECTS;

  function handleCardClick(subject) {
    const st = statuses[subject.id]?.status;
    if (st === 'active') {
      onSelect(subject);
    } else if (st === 'paused') {
      setUnlocking({ subject, mode: 'resume' });
    } else {
      // locked / no status
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
            <p>Your AI industry experts will guide you through a structured curriculum adapted to you. Pick a subject to begin.</p>
          </>
        ) : (
          <>
            <h1>Welcome back, <span>{student.name.split(' ')[0]}</span></h1>
            <p>Your experts remember where you left off. Pick a subject to continue.</p>
          </>
        )}
        {career ? (
          <div className="career-path-badge" onClick={onViewPath} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onViewPath()}>
            <span className="cpb-icon">{CAREER_ICONS[career.id]}</span>
            <div className="cpb-text">
              <div className="cpb-title">{career.title}</div>
              <div className="cpb-sub">Your career destination · view path →</div>
            </div>
          </div>
        ) : (
          <div className="career-path-nudge" onClick={onViewPath} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onViewPath()}>
            <span className="career-path-nudge-icon"><IcoTarget /></span> Set your career destination — your experts will personalise your learning path
          </div>
        )}
        {activeCount > 0 && (
          <div className="home-active-hint">
            {activeCount === 2
              ? 'You have 2 active subjects — pause one to start another.'
              : `You have ${activeCount} active subject. You can run up to 2 at once.`}
          </div>
        )}
      </div>

      <CareerReadinessScore careerProfile={careerProfile} progress={progress} onViewPath={onViewPath} />

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
          />

          {exploreSubjects.length > 0 && (
            <div className="subjects-section subjects-section--explore">
              <div className="subjects-section-header">
                <h2 className="subjects-section-title">Explore Other Subjects</h2>
                <p className="subjects-section-sub">Not part of your core curriculum — but great for broadening your knowledge in adjacent areas.</p>
              </div>
              <div className="subjects-grid">
                {exploreSubjects.map(s => (
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
            src={TUTOR_PHOTOS[subject.tutor]}
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

        <div className="unlock-modal-banner" style={{ background: `linear-gradient(135deg, ${subject.color}22, ${subject.color}0a)`, borderBottom: `1px solid ${subject.color}20` }}>
          <span style={{ color: subject.color, width: 28, height: 28, flexShrink: 0 }}>{SUBJECT_ICONS[subject.id]}</span>
          <div>
            <div className="unlock-modal-subject-name">{subject.name}</div>
            <div className="unlock-modal-tutor">with {subject.tutor} · {subject.org}</div>
          </div>
          {isRecommended && <span className="subject-badge subject-badge--rec" style={{ marginLeft: 'auto', flexShrink: 0 }}>Recommended</span>}
        </div>

        {effectiveMode === 'resume' && (
          <>
            <div className="unlock-modal-body">
              <h3>Resume {subject.name}?</h3>
              <p>You paused this subject earlier. Pick up right where you left off — your expert remembers everything.</p>
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

function ChatView({ subject, student, careerProfile, onBack, onCareerDetected, onViewCapstone, onViewCertificate, onPauseSubject, revisionModule, onRevisionConsumed, autoStart, autoStartHeadline, onAutoStartConsumed }) {
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
  const [notes, setNotes]                 = useState([]);
  const [noteInput, setNoteInput]         = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  useEffect(() => {
    async function load() {
      try {
        const [histRes, progRes, videosRes, resourcesRes, quizRes] = await Promise.all([
          fetch(`/api/history/${student.id}/${subject.id}`),
          fetch(`/api/progress/${student.id}/${subject.id}`),
          fetch(`/api/concept-videos/${subject.id}`),
          fetch(`/api/resources/${subject.id}`),
          fetch(`/api/quiz/status/${student.id}/${subject.id}`),
        ]);
        const hist = await histRes.json();
        const prog = await progRes.json();
        setMessages(hist.map((m) => ({ role: m.role === 'assistant' ? 'bot' : m.role, content: m.content })));
        setConceptsCovered(prog.covered_count);
        setConceptsMastered(prog.mastered_count);
        setConceptsTotal(prog.total);
        setConceptVideos(await videosRes.json());
        setConceptResources(await resourcesRes.json());
        setQuizStatus(await quizRes.json());
      } catch {}
      finally {
        setHistoryLoading(false);
        if (revisionModule) {
          const msg = `Please give me a focused revision of the "${revisionModule.name}" module — summarise the key points from each of its sub-topics in a structured way with bullet points.`;
          setInput(msg);
          setTimeout(() => { sendMessageText(msg); if (onRevisionConsumed) onRevisionConsumed(); }, 200);
        } else if (autoStart) {
          const msg = autoStartHeadline
            ? `Let's begin. Before we start, I saw this headline: "${autoStartHeadline}" — can you briefly connect this to what we're covering today, then go into the first concept?`
            : "Let's begin.";
          setTimeout(() => { sendMessageText(msg); if (onAutoStartConsumed) onAutoStartConsumed(); }, 300);
        } else {
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
    }
    load();
    loadNotes();
  }, [student.id, subject.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

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
        setMessages(prev => [...prev, { role: 'bot', content: "You've sent a lot of messages this hour — take a short break and come back soon. Your progress is saved." }]);
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
      if (data.subject_completed) newMsgs.push({ role: 'subject-complete', credentialId: data.subject_completed.credential_id });
      setMessages((prev) => [...prev, ...newMsgs]);
      if (data.concepts_covered  !== undefined) setConceptsCovered(data.concepts_covered);
      if (data.concepts_mastered !== undefined) setConceptsMastered(data.concepts_mastered);
      if (data.concepts_total    !== undefined) setConceptsTotal(data.concepts_total);
      if (data.newly_mastered?.length > 0) setNotification({ type: 'mastered', ids: data.newly_mastered });
      else if (data.newly_covered?.length > 0) setNotification({ type: 'covered', ids: data.newly_covered });
      if (data.career_detected) { onCareerDetected(data.career_detected); setCareerBanner(data.career_detected); }
      if (data.capstone_now_unlocked) setCapstoneUnlocked(true);
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
        setMessages(prev => [...prev, { role: 'bot', content: "You've sent a lot of messages this hour — take a short break and come back soon. Your progress is saved." }]);
        setLoading(false); return;
      }
      const data = await res.json();
      setIsMock(data.mock);
      const newMsgs = [{ role: 'bot', content: data.reply, quiz: isQuiz }];
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
      if (data.subject_completed) newMsgs.push({ role: 'subject-complete', credentialId: data.subject_completed.credential_id });
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
            src={TUTOR_PHOTOS[subject.tutor]}
            className="chat-tutor-photo"
            alt={subject.tutor}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="chat-faculty-info">
            <span className="chat-faculty-name">{subject.tutor}</span>
            <span className="chat-faculty-meta">{subject.role} · {subject.org}</span>
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
              <>
                <div className="welcome-message">
                  <div className="welcome-faculty">
                    <span className="welcome-faculty-icon" style={{ color: subject.color }}>{SUBJECT_ICONS[subject.id]}</span>
                    <div>
                      <div className="welcome-faculty-name">{subject.tutor}</div>
                      <div className="welcome-faculty-role">{subject.role} · {subject.org}</div>
                    </div>
                  </div>
                  <p>
                    Say hello to start. {subject.tutor.split(' ')[1]} will ask about your background before diving in — so your path through the <strong>{conceptsTotal}-concept curriculum</strong> is personalised from the start.
                    {!career && ' Mention your career goals and they\'ll weave them into every lesson.'}
                  </p>
                </div>
                <div className="starter-chips">
                  {['Hi, I\'m ready to start', 'What will I learn here?', 'Where should a beginner start?', 'How does this connect to my career?'].map(prompt => (
                    <button key={prompt} className="starter-chip" onClick={() => sendMessageText(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </>
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
                          {passed ? 'Quiz passed — great work!' : attempted ? 'Not passed yet — try again.' : 'Test your understanding before moving on.'}
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
              return (
                <div key={i} className={`message-row ${msg.role}${msg.quiz ? ' quiz-message' : ''}`}>
                  <div className={`message-avatar ${msg.role}`}>
                    {msg.role === 'bot' ? subject.tutor.replace(/^Dr\.\s*/, '').charAt(0) : student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="message-bubble">
                    {msg.quiz && msg.role === 'bot' && <div className="quiz-label">Assessment</div>}
                    {renderMessageContent(msg.content, { color: subject.color })}
                    {msg.role === 'bot' && (
                      <button className="msg-save-btn" title="Save to notes" onClick={() => { saveNote(msg.content); setNotesOpen(true); }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                        Save
                      </button>
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
            <span className="notes-panel-title">Notes — {subject.name}</span>
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
  const [isReturning, setIsReturning] = useState(!!getStoredStudent());
  const [careerProfile, setCareerProfile] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);

  async function fetchCareerProfile(studentId) {
    try {
      const res = await fetch(`/api/profile/${studentId}`);
      const data = await res.json();
      setCareerProfile(data);
      if (!data.onboarded) setShowOnboarding(true);
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

  function handleLogin(data) {
    const s = { id: data.student_id || data.id, name: data.name };
    storeStudent(s);
    setStudent(s);
    setIsReturning(data.returning);
    fetchCareerProfile(s.id);
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
  const [sessionNewsHeadline, setSessionNewsHeadline] = useState(null);

  function handleSelectSubject(subject) {
    setSelectedSubject(subject);
    const met = localStorage.getItem(`bv_met_${subject.id}_${student?.id}`);
    setSubjectEntryPhase(met ? 'session' : 'intro');
    setView('subject-entry');
  }

  function handleBack() {
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
    if (careerProfile?.career_id) {
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

  return (
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
        onLogout={handleLogout}
        hasCareer={!!careerProfile?.career_id}
        avatarColor={careerProfile?.avatar_color}
      />
      <main className="main-panel">
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
            onBegin={(headline) => { setSessionNewsHeadline(headline); setAutoStartChat(true); setSubjectEntryPhase(null); setView('chat'); }}
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
          autoStartHeadline={sessionNewsHeadline}
          onAutoStartConsumed={() => { setAutoStartChat(false); setSessionNewsHeadline(null); }}
        />
      ) : view === 'dashboard' ? (
        <DashboardView
          student={student}
          onStudy={(subject, mod) => { setSelectedSubject(subject); setRevisionModule(mod || null); setView('chat'); }}
          onCapstone={handleViewCapstone}
          onCertificate={handleViewCertificate}
        />
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
        <CareerMapView
          student={student}
          careerProfile={careerProfile}
          onBack={() => setView('home')}
          onChangePath={() => setView('career-change')}
          onStudy={handleSelectSubject}
        />
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
        />
      )}
      </main>
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
  );
}
