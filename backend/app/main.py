from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid, os, re, io, sqlite3, shutil, random, hashlib, json, time, collections
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()
_ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=_ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

DB_PATH = os.environ.get("DB_PATH", "/app/bversity.db")
SUBMISSIONS_DIR = os.environ.get("SUBMISSIONS_DIR", "/app/submissions")
os.makedirs(SUBMISSIONS_DIR, exist_ok=True)

# ── Rate limiting ──────────────────────────────────────────────────────────────
RATE_LIMIT_MAX = int(os.environ.get("CHAT_RATE_LIMIT", "40"))   # messages per window
RATE_LIMIT_WINDOW = 3600                                          # 1 hour in seconds
_rate_buckets: dict = collections.defaultdict(collections.deque)

def check_rate_limit(student_id: str):
    now = time.time()
    bucket = _rate_buckets[student_id]
    cutoff = now - RATE_LIMIT_WINDOW
    while bucket and bucket[0] < cutoff:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail=f"Rate limit reached — max {RATE_LIMIT_MAX} messages per hour.")
    bucket.append(now)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT NOT NULL, subject_id TEXT NOT NULL,
            role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS concept_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT NOT NULL, subject_id TEXT NOT NULL,
            concept_id TEXT NOT NULL, first_covered_at TEXT NOT NULL, mastered_at TEXT,
            UNIQUE(student_id, subject_id, concept_id)
        );
        CREATE TABLE IF NOT EXISTS materials (
            id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, filename TEXT NOT NULL,
            chunk_count INTEGER DEFAULT 0, uploaded_at TEXT NOT NULL
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS doc_chunks_fts USING fts5(
            material_id UNINDEXED, subject_id UNINDEXED, content, tokenize = 'porter ascii'
        );
        CREATE TABLE IF NOT EXISTS student_profile (
            student_id TEXT PRIMARY KEY, career_id TEXT, career_goal_raw TEXT, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS capstone_submissions (
            id TEXT PRIMARY KEY, student_id TEXT NOT NULL, subject_id TEXT NOT NULL,
            filename TEXT NOT NULL, filepath TEXT NOT NULL, submitted_at TEXT NOT NULL,
            score INTEGER, feedback TEXT, marked_at TEXT,
            UNIQUE(student_id, subject_id)
        );
        CREATE TABLE IF NOT EXISTS approved_emails (
            email TEXT PRIMARY KEY,
            added_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS career_changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            from_career_id TEXT,
            to_career_id TEXT,
            reason TEXT NOT NULL,
            notes TEXT,
            changed_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS subject_status (
            student_id TEXT NOT NULL,
            subject_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'locked',
            unlocked_at TEXT,
            paused_at TEXT,
            completed_at TEXT,
            pause_reason TEXT,
            pause_notes TEXT,
            PRIMARY KEY (student_id, subject_id)
        );
        CREATE TABLE IF NOT EXISTS module_quizzes (
            student_id  TEXT NOT NULL,
            subject_id  TEXT NOT NULL,
            module_id   TEXT NOT NULL,
            passed      INTEGER DEFAULT 0,
            completed_at TEXT,
            PRIMARY KEY (student_id, subject_id, module_id)
        );
        CREATE TABLE IF NOT EXISTS concept_resources (
            id           TEXT PRIMARY KEY,
            subject_id   TEXT NOT NULL,
            concept_id   TEXT NOT NULL,
            url          TEXT NOT NULL,
            title        TEXT NOT NULL,
            resource_type TEXT NOT NULL DEFAULT 'article',
            description  TEXT,
            added_at     TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            subject_id TEXT,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS study_plan (
            student_id TEXT NOT NULL,
            day_number INTEGER NOT NULL,
            subject_id TEXT NOT NULL,
            concept_id TEXT NOT NULL,
            target_date TEXT NOT NULL,
            PRIMARY KEY (student_id, day_number, concept_id)
        );
        CREATE TABLE IF NOT EXISTS concept_videos (
            subject_id TEXT NOT NULL,
            concept_id TEXT NOT NULL,
            drive_url  TEXT NOT NULL,
            title      TEXT,
            added_at   TEXT NOT NULL,
            PRIMARY KEY (subject_id, concept_id)
        );
        CREATE TABLE IF NOT EXISTS subject_completions (
            student_id    TEXT NOT NULL,
            subject_id    TEXT NOT NULL,
            completed_at  TEXT NOT NULL,
            credential_id TEXT NOT NULL,
            PRIMARY KEY (student_id, subject_id)
        );
        CREATE TABLE IF NOT EXISTS platform_feedback (
            id          TEXT PRIMARY KEY,
            student_id  TEXT NOT NULL,
            q1          TEXT,
            q2          TEXT,
            q3          TEXT,
            rating      INTEGER NOT NULL,
            comment     TEXT,
            submitted_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS module_quiz_questions (
            subject_id      TEXT NOT NULL,
            module_id       TEXT NOT NULL,
            questions_json  TEXT NOT NULL,
            generated_at    TEXT NOT NULL,
            PRIMARY KEY (subject_id, module_id)
        );
        CREATE TABLE IF NOT EXISTS access_requests (
            id           TEXT PRIMARY KEY,
            name         TEXT NOT NULL,
            email        TEXT NOT NULL UNIQUE,
            phone        TEXT,
            university   TEXT,
            year_of_study TEXT,
            country      TEXT,
            reason       TEXT,
            status       TEXT NOT NULL DEFAULT 'pending',
            submitted_at TEXT NOT NULL
        );
    """)
    for col in [
        "ALTER TABLE capstone_submissions ADD COLUMN ai_score INTEGER",
        "ALTER TABLE capstone_submissions ADD COLUMN ai_feedback TEXT",
        "ALTER TABLE capstone_submissions ADD COLUMN ai_graded_at TEXT",
        "ALTER TABLE concept_progress ADD COLUMN mastered_at TEXT",
        "ALTER TABLE student_profile ADD COLUMN college TEXT",
        "ALTER TABLE student_profile ADD COLUMN year_of_study TEXT",
        "ALTER TABLE student_profile ADD COLUMN aspirations TEXT",
        "ALTER TABLE student_profile ADD COLUMN motivation TEXT",
        "ALTER TABLE student_profile ADD COLUMN tutor_note TEXT",
        "ALTER TABLE student_profile ADD COLUMN onboarded_at TEXT",
        "ALTER TABLE student_profile ADD COLUMN avatar_color TEXT",
        "ALTER TABLE student_profile ADD COLUMN linkedin_url TEXT",
        "ALTER TABLE student_profile ADD COLUMN github_url TEXT",
        "ALTER TABLE student_profile ADD COLUMN city TEXT",
        "ALTER TABLE student_profile ADD COLUMN state TEXT",
        "ALTER TABLE student_profile ADD COLUMN show_on_map INTEGER DEFAULT 1",
        "ALTER TABLE student_profile ADD COLUMN is_placed INTEGER DEFAULT 0",
    ]:
        try:
            conn.execute(col)
        except Exception:
            pass
    conn.commit()
    conn.close()


_PLACED_ALUMNI = [
    {"id": "BVA001", "name": "Dristi Mohta",         "email": "dristi.mohta@bversity.alumni",      "city": "Raipur",        "state": "Chhattisgarh",   "linkedin_url": "https://www.linkedin.com/in/dristi-mohta-b62275187/", "avatar_color": "#00A896"},
    {"id": "BVA002", "name": "Arpita Ganguly",        "email": "arpita.ganguly@bversity.alumni",    "city": "Kolkata",       "state": "West Bengal",    "linkedin_url": None, "avatar_color": "#7B61FF"},
    {"id": "BVA003", "name": "Ananaya Jain",          "email": "ananaya.jain@bversity.alumni",      "city": "Ghaziabad",     "state": "Uttar Pradesh",  "linkedin_url": None, "avatar_color": "#FF6B6B"},
    {"id": "BVA004", "name": "Dheeraj Babu",          "email": "dheeraj.babu@bversity.alumni",      "city": "Bangalore",     "state": "Karnataka",      "linkedin_url": None, "avatar_color": "#00A896"},
    {"id": "BVA005", "name": "Ekant Kannam",          "email": "ekant.kannam@bversity.alumni",      "city": "Bijapur",       "state": "Chhattisgarh",   "linkedin_url": None, "avatar_color": "#F5A623"},
    {"id": "BVA006", "name": "Megha",                 "email": "megha@bversity.alumni",             "city": "Chennai",       "state": "Tamil Nadu",     "linkedin_url": None, "avatar_color": "#FF6B6B"},
    {"id": "BVA007", "name": "Khushi Tyagi",          "email": "khushi.tyagi@bversity.alumni",      "city": "Delhi",         "state": "Delhi",          "linkedin_url": None, "avatar_color": "#7B61FF"},
    {"id": "BVA008", "name": "Disha Jain",            "email": "disha.jain@bversity.alumni",        "city": "Bangalore",     "state": "Karnataka",      "linkedin_url": None, "avatar_color": "#00A896"},
    {"id": "BVA009", "name": "Arsha Adak",            "email": "arsha.adak@bversity.alumni",        "city": "Howrah",        "state": "West Bengal",    "linkedin_url": None, "avatar_color": "#F5A623"},
    {"id": "BVA010", "name": "Kayalvizhi",            "email": "kayalvizhi@bversity.alumni",        "city": "Perambalur",    "state": "Tamil Nadu",     "linkedin_url": None, "avatar_color": "#FF6B6B"},
    {"id": "BVA011", "name": "Risha Reddy",           "email": "risha.reddy@bversity.alumni",       "city": "Hyderabad",     "state": "Telangana",      "linkedin_url": None, "avatar_color": "#00A896"},
    {"id": "BVA012", "name": "Suchismita Shaw",       "email": "suchismita.shaw@bversity.alumni",   "city": "Kolkata",       "state": "West Bengal",    "linkedin_url": None, "avatar_color": "#7B61FF"},
    {"id": "BVA013", "name": "Priya Banthia",         "email": "priya.banthia@bversity.alumni",     "city": "Kolkata",       "state": "West Bengal",    "linkedin_url": None, "avatar_color": "#FF6B6B"},
    {"id": "BVA014", "name": "Abel George",           "email": "abel.george@bversity.alumni",       "city": "Nedumkandam",   "state": "Kerala",         "linkedin_url": None, "avatar_color": "#00A896"},
    {"id": "BVA015", "name": "Salam Akash Singh",     "email": "salam.akash@bversity.alumni",       "city": "Pune",          "state": "Maharashtra",    "linkedin_url": None, "avatar_color": "#F5A623"},
    {"id": "BVA016", "name": "Laxmi C M",             "email": "laxmi.cm@bversity.alumni",          "city": "Thrissur",      "state": "Kerala",         "linkedin_url": None, "avatar_color": "#7B61FF"},
    {"id": "BVA017", "name": "Reshma B",              "email": "reshma.b@bversity.alumni",          "city": "Madurai",       "state": "Tamil Nadu",     "linkedin_url": None, "avatar_color": "#FF6B6B"},
    {"id": "BVA018", "name": "Sowfika Dharshini",     "email": "sowfika.dharshini@bversity.alumni", "city": "Coimbatore",    "state": "Tamil Nadu",     "linkedin_url": None, "avatar_color": "#00A896"},
    {"id": "BVA019", "name": "Narendra Varma",        "email": "narendra.varma@bversity.alumni",    "city": "Tirupati",      "state": "Andhra Pradesh", "linkedin_url": None, "avatar_color": "#F5A623"},
    {"id": "BVA020", "name": "Sri Vaishnavi Dabberu", "email": "sri.vaishnavi@bversity.alumni",     "city": "Secunderabad",  "state": "Telangana",      "linkedin_url": None, "avatar_color": "#7B61FF"},
    {"id": "BVA021", "name": "Krishna Verma",         "email": "krishna.verma@bversity.alumni",     "city": "Ahmedabad",     "state": "Gujarat",        "linkedin_url": None, "avatar_color": "#00A896"},
    {"id": "BVA022", "name": "Amisha N",              "email": "amisha.n@bversity.alumni",          "city": "Davanagere",    "state": "Karnataka",      "linkedin_url": None, "avatar_color": "#FF6B6B"},
    {"id": "BVA023", "name": "Brindha",               "email": "brindha@bversity.alumni",           "city": "Nagercoil",     "state": "Tamil Nadu",     "linkedin_url": None, "avatar_color": "#F5A623"},
]

def seed_placed_alumni():
    conn = get_db()
    now = datetime.utcnow().isoformat()
    for a in _PLACED_ALUMNI:
        conn.execute(
            "INSERT OR IGNORE INTO students (id, name, email, created_at) VALUES (?, ?, ?, ?)",
            (a["id"], a["name"], a["email"], now),
        )
        conn.execute(
            """INSERT INTO student_profile (student_id, career_id, updated_at, city, state, show_on_map, is_placed, linkedin_url, avatar_color)
               VALUES (?, NULL, ?, ?, ?, 1, 1, ?, ?)
               ON CONFLICT(student_id) DO UPDATE SET
                 city = excluded.city, state = excluded.state,
                 show_on_map = 1, is_placed = 1,
                 linkedin_url = COALESCE(excluded.linkedin_url, student_profile.linkedin_url),
                 avatar_color = excluded.avatar_color,
                 updated_at = excluded.updated_at""",
            (a["id"], now, a["city"], a["state"], a["linkedin_url"], a["avatar_color"]),
        )
    conn.commit()
    conn.close()


init_db()
seed_placed_alumni()

# ── Curriculum ────────────────────────────────────────────────────────────────

CURRICULUM = {
    "bioinformatics": [
        {"id": "central_dogma_a",      "name": "DNA Structure & Replication",                  "desc": "Double helix, base pairing rules, nucleotides, semi-conservative replication, DNA polymerase fidelity and error rates"},
        {"id": "central_dogma_b",      "name": "Transcription & RNA Processing",               "desc": "RNA polymerase II, promoters, enhancers, pre-mRNA splicing, 5' capping, poly-A tail — how genes become transcripts"},
        {"id": "central_dogma_c",      "name": "Translation & Post-Translational Modification","desc": "Ribosomes, codons, tRNA, the genetic code, protein folding, PTMs (phosphorylation, glycosylation, ubiquitination)"},
        {"id": "seq_formats_a",        "name": "FASTA & FASTQ Formats",                        "desc": "FASTA sequence records, FASTQ quality scores, Phred encoding, per-base quality interpretation, multi-record files"},
        {"id": "seq_formats_b",        "name": "SAM/BAM & Alignment Formats",                  "desc": "SAM header sections, mandatory fields, CIGAR string decoding, FLAG values, sorting and indexing with SAMtools"},
        {"id": "seq_formats_c",        "name": "VCF/BCF & Variant Representation",             "desc": "VCF record structure, CHROM/POS/REF/ALT fields, INFO and FORMAT annotations, multi-sample VCFs, BCF compression"},
        {"id": "pairwise_alignment_a", "name": "Global Alignment: Needleman-Wunsch",           "desc": "Dynamic programming matrix, traceback, affine gap penalties, when to use global vs local alignment"},
        {"id": "pairwise_alignment_b", "name": "Local Alignment: Smith-Waterman",              "desc": "Local DP formulation, zero-floor rule, optimal local matches, computational complexity, hardware acceleration"},
        {"id": "pairwise_alignment_c", "name": "Scoring Matrices & Gap Penalties",             "desc": "PAM and BLOSUM matrices, how they were derived, choosing the right matrix and gap penalty for your alignment problem"},
        {"id": "blast_search_a",       "name": "BLAST Algorithm Internals",                    "desc": "Word seeding, HSP extension, two-hit method, E-value calculation, bit scores, statistical significance"},
        {"id": "blast_search_b",       "name": "BLAST Variants & Use Cases",                   "desc": "BLASTn, BLASTp, BLASTx, tBLASTn, tBLASTx, PSI-BLAST, DELTA-BLAST — when and why to use each"},
        {"id": "blast_search_c",       "name": "Interpreting BLAST Output",                    "desc": "Score, E-value, percent identity, query/subject coverage, low-complexity masking, filtering noise from results"},
        {"id": "msa_phylogenetics_a",  "name": "Multiple Sequence Alignment Methods",          "desc": "Progressive (ClustalW) vs iterative (MUSCLE, MAFFT) alignment, scoring MSAs, gap treatment, anchor columns"},
        {"id": "msa_phylogenetics_b",  "name": "Distance & Parsimony Tree Methods",            "desc": "Genetic distance models (Jukes-Cantor, K2P), UPGMA, neighbor-joining, maximum parsimony — concepts and limits"},
        {"id": "msa_phylogenetics_c",  "name": "Maximum Likelihood & Bayesian Trees",          "desc": "Substitution models, IQ-TREE, BEAST, bootstrapping, posterior probability, interpreting clade support values"},
        {"id": "bio_databases_a",      "name": "NCBI Database Suite",                          "desc": "GenBank, RefSeq, dbSNP, SRA, ClinVar, dbVar — database relationships, Entrez API, EDirect command-line access"},
        {"id": "bio_databases_b",      "name": "Protein & Structure Databases",                "desc": "UniProt/Swiss-Prot vs TrEMBL, PDB structure records, Pfam domains, InterPro, programmatic REST access"},
        {"id": "bio_databases_c",      "name": "Pathway & Ontology Databases",                 "desc": "KEGG pathways and BRITE hierarchies, Reactome, Gene Ontology (MF/BP/CC), using GO terms for enrichment analysis"},
        {"id": "ngs_qc_a",             "name": "Illumina Sequencing Technology",               "desc": "Flow cell clusters, bridge amplification, sequencing-by-synthesis, paired-end reads, index multiplexing, read length trade-offs"},
        {"id": "ngs_qc_b",             "name": "Long-Read Sequencing Platforms",               "desc": "PacBio HiFi (CCS) vs CLR, Oxford Nanopore (pore chemistry, basecalling), accuracy vs read length, appropriate use cases"},
        {"id": "ngs_qc_c",             "name": "NGS Quality Control & Trimming",               "desc": "FastQC report interpretation, per-base quality decay, adapter contamination, Trimmomatic/Cutadapt parameters, MultiQC"},
        {"id": "ngs_alignment_a",      "name": "Short-Read Alignment",                         "desc": "BWA-MEM algorithm, Bowtie2 modes, reference genome indexing, duplicate marking (Picard), alignment metrics"},
        {"id": "ngs_alignment_b",      "name": "RNA-seq Splice-Aware Alignment",               "desc": "STAR two-pass alignment, HISAT2, splice junctions, multi-mapping reads, alignment to transcriptome vs genome"},
        {"id": "ngs_alignment_c",      "name": "Variant Calling with GATK",                    "desc": "BQSR, HaplotypeCaller, joint genotyping with GenomicsDBImport, gVCF format, hard filtering vs VQSR"},
        {"id": "rnaseq_expression_a",  "name": "RNA-seq Library Prep & Design",                "desc": "Strand-specific libraries, rRNA depletion vs polyA selection, sequencing depth, replication strategy, batch effects"},
        {"id": "rnaseq_expression_b",  "name": "Quantification & Normalisation",               "desc": "featureCounts, Salmon pseudoalignment, TPM vs RPKM vs raw counts, DESeq2 size factors, edgeR TMM normalisation"},
        {"id": "rnaseq_expression_c",  "name": "Differential Expression Downstream Analysis",  "desc": "Volcano plots, MA plots, FDR correction, GSEA, fgsea, GO and KEGG enrichment, heatmaps, pathway visualisation"},
        {"id": "protein_structure_a",  "name": "Protein Structural Hierarchy",                 "desc": "Primary sequence, secondary elements (α-helix, β-sheet), tertiary fold, quaternary assemblies, domains and motifs"},
        {"id": "protein_structure_b",  "name": "Experimental Structure Determination",         "desc": "X-ray crystallography, NMR spectroscopy, cryo-EM — principles, resolution, PDB deposition, viewing in PyMOL/ChimeraX"},
        {"id": "protein_structure_c",  "name": "AlphaFold & Computational Structure Prediction","desc": "How AlphaFold2 works, pLDDT and PAE confidence scores, AlphaFold Multimer, ESMFold, structure-function applications"},
        {"id": "bio_programming_a",    "name": "Python & Biopython for Bioinformatics",        "desc": "SeqIO, pairwise2, Entrez API access, BLAST wrapper, pandas for tabular data, writing reusable bioinformatics scripts"},
        {"id": "bio_programming_b",    "name": "R & Bioconductor",                             "desc": "Biostrings, GenomicRanges, DESeq2, ggplot2, ComplexHeatmap — R ecosystem for genomics and visualisation"},
        {"id": "bio_programming_c",    "name": "Workflow Management & Reproducibility",        "desc": "Snakemake rules and DAGs, Nextflow channels, conda environments, containers (Docker/Singularity), reproducible pipelines"},
        {"id": "ml_bioinformatics_a",  "name": "Feature Engineering for Biological Data",      "desc": "Molecular descriptors, k-mer frequency, position weight matrices, one-hot encoding, handling high-dimensional omics features"},
        {"id": "ml_bioinformatics_b",  "name": "Classical ML on Omics Data",                   "desc": "Random forests, SVMs, gradient boosting for biomarker classification; clustering (k-means, hierarchical) for omics"},
        {"id": "ml_bioinformatics_c",  "name": "Deep Learning for Biological Sequences",       "desc": "CNNs for motif discovery, RNNs/LSTMs for sequence modelling, attention mechanisms, intro to protein language models"},
    ],
    "genomics": [
        {"id": "genome_structure_a",   "name": "Chromosome & Chromatin Organisation",         "desc": "Nucleosomes, chromatin compaction, topologically associating domains (TADs), lamina-associated domains, heterochromatin vs euchromatin"},
        {"id": "genome_structure_b",   "name": "Genes, Regulatory Elements & Non-Coding DNA", "desc": "Exon-intron structure, promoters, enhancers, silencers, insulators, ENCODE annotation, proportion of functional non-coding sequence"},
        {"id": "genome_structure_c",   "name": "Repetitive Elements & the Dark Genome",       "desc": "SINEs, LINEs, transposons, centromeric satellites, segmental duplications — what makes 45% of the genome hard to sequence"},
        {"id": "sequencing_tech_a",    "name": "Sanger Sequencing",                           "desc": "Chain termination chemistry, capillary electrophoresis, read length, clinical sequencing (Sanger confirmation), limitations"},
        {"id": "sequencing_tech_b",    "name": "Illumina Short-Read Sequencing",              "desc": "Paired-end library prep, flow cell clusters, sequencing-by-synthesis chemistry, error profiles, throughput vs cost"},
        {"id": "sequencing_tech_c",    "name": "Long-Read Sequencing: PacBio & Nanopore",     "desc": "PacBio HiFi (CCS) accuracy, Nanopore direct sequencing, basecalling models, resolving structural variants and repeats"},
        {"id": "genome_assembly_a",    "name": "De Novo Assembly Algorithms",                 "desc": "Overlap-layout-consensus vs de Bruijn graph assembly, k-mer selection, contig formation, assembly quality metrics (N50)"},
        {"id": "genome_assembly_b",    "name": "Scaffolding & Gap Filling",                   "desc": "Hi-C chromatin proximity, optical mapping (Bionano), reference-guided scaffolding, telomere-to-telomere assemblies"},
        {"id": "genome_assembly_c",    "name": "Genome Annotation",                           "desc": "Ab initio gene prediction (Augustus, GeneMark), evidence-based annotation (MAKER), RepeatMasker, functional annotation"},
        {"id": "variant_types_a",      "name": "SNPs & Small Indels",                         "desc": "SNP formation, MAF, synonymous vs non-synonymous, frameshift indels, variant nomenclature (HGVS), population frequencies"},
        {"id": "variant_types_b",      "name": "Copy Number Variants",                        "desc": "CNV detection methods (array CGH, WGS read depth), segmental duplications, gene dosage effects, clinical CNV examples"},
        {"id": "variant_types_c",      "name": "Structural Variants",                         "desc": "Inversions, translocations, complex rearrangements, mobile element insertions, long-read and linked-read SV calling"},
        {"id": "variant_calling_a",    "name": "GATK Best Practices Pipeline",                "desc": "Preprocessing (marking duplicates, BQSR), HaplotypeCaller, joint genotyping with GenomicsDBImport, gVCF workflow"},
        {"id": "variant_calling_b",    "name": "Variant Filtering & Annotation",              "desc": "VQSR vs hard filters, VEP/ANNOVAR consequence prediction, gnomAD frequencies, conservation scores, splicing predictors"},
        {"id": "variant_calling_c",    "name": "Clinical Variant Classification",             "desc": "ACMG/AMP 2015 criteria, ClinVar submissions, VUS interpretation, functional evidence categories, variant curation workflow"},
        {"id": "population_genetics_a","name": "Allele Frequencies & Population Dynamics",    "desc": "MAF, Hardy-Weinberg equilibrium testing, genetic drift, founder effects, bottlenecks, selection signatures"},
        {"id": "population_genetics_b","name": "Linkage Disequilibrium & Haplotypes",         "desc": "D' and r² measures, LD decay with distance, haplotype blocks, tagSNPs, HapMap and 1000 Genomes reference panels"},
        {"id": "population_genetics_c","name": "Population Stratification",                   "desc": "Principal component analysis, ADMIXTURE/STRUCTURE, ancestry inference, confounding in GWAS, genomic control"},
        {"id": "gwas_a",               "name": "GWAS Study Design & QC",                      "desc": "Cohort selection, genotyping arrays, imputation with TOPMed/HRC, QC steps (call rate, HWE, relatedness, ancestry)"},
        {"id": "gwas_b",               "name": "GWAS Statistical Analysis",                   "desc": "Logistic/linear regression, Bonferroni and FDR correction, Manhattan plots, Q-Q plots, lambda inflation factor"},
        {"id": "gwas_c",               "name": "Post-GWAS Analysis",                          "desc": "Fine-mapping (FINEMAP, SuSiE), colocalization, Mendelian randomization, polygenic risk scores (PRSice, LDpred)"},
        {"id": "transcriptomics_a",    "name": "Bulk RNA-seq Design & Processing",            "desc": "Experimental design, library prep choices, alignment (STAR), quantification (Salmon/featureCounts), QC metrics"},
        {"id": "transcriptomics_b",    "name": "Differential Expression Analysis",            "desc": "DESeq2 negative binomial model, edgeR, limma-voom, FDR correction, biological replication requirements"},
        {"id": "transcriptomics_c",    "name": "Functional Interpretation of RNA-seq",        "desc": "GO enrichment, GSEA, pathway analysis (KEGG, Reactome), cell type deconvolution (CIBERSORT, CellChat)"},
        {"id": "single_cell_a",        "name": "scRNA-seq Technologies",                      "desc": "10x Chromium droplet microfluidics, cell barcodes, UMIs, 3' vs 5' capture, SMART-seq, cell doublet rates"},
        {"id": "single_cell_b",        "name": "scRNA-seq Analysis Workflow",                 "desc": "Seurat/Scanpy pipeline — filtering, normalisation, HVGs, PCA, UMAP, clustering, marker genes, cell type annotation"},
        {"id": "single_cell_c",        "name": "Advanced Single-Cell Methods",                "desc": "RNA velocity (scVelo), pseudotime (Monocle, PAGA), spatial transcriptomics (Visium, MERFISH), multiome ATAC+RNA"},
        {"id": "epigenomics_a",        "name": "DNA Methylation & Bisulfite Sequencing",      "desc": "CpG methylation biology, WGBS and RRBS protocols, bismark alignment, DMR analysis, methylation arrays (EPIC)"},
        {"id": "epigenomics_b",        "name": "Histone Modifications & ChIP-seq",            "desc": "ChIP-seq library prep, peak calling with MACS2, H3K27ac enhancers, H3K4me3 promoters, differential ChIP"},
        {"id": "epigenomics_c",        "name": "Open Chromatin: ATAC-seq",                    "desc": "ATAC-seq protocol, Tn5 tagmentation, nucleosome-free regions, footprinting, linking regulatory elements to genes"},
        {"id": "metagenomics_a",       "name": "16S rRNA Amplicon Sequencing",                "desc": "Hypervariable regions (V3-V4), OTU vs ASV (DADA2), alpha and beta diversity, QIIME2 workflow, phyloseq"},
        {"id": "metagenomics_b",       "name": "Shotgun Metagenomics",                        "desc": "Whole metagenome sequencing, MetaPhlAn4 taxonomy, HUMAnN3 functional profiling, MAG binning (MetaBAT, GTDB-Tk)"},
        {"id": "metagenomics_c",       "name": "Microbiome Analysis & Disease Links",         "desc": "Differential abundance (LEfSe, ANCOM), confounding variables, gut-disease associations (IBD, diabetes, cancer)"},
        {"id": "precision_medicine_a", "name": "Pharmacogenomics",                            "desc": "CYP2D6, CYP2C19, TPMT, DPYD — pharmacogenomic variants, CPIC guidelines, clinical PGx testing and implementation"},
        {"id": "precision_medicine_b", "name": "Polygenic Risk Scores",                       "desc": "PRS construction (LDpred2, PRSice), external validation, ancestry transferability, clinical deployment ethics"},
        {"id": "precision_medicine_c", "name": "Precision Oncology & Companion Diagnostics",  "desc": "Tumour mutation burden, MSI, HER2/BRCA testing, NGS panels (Foundation One), CDx co-development, biomarker-led trials"},
    ],
    "drug_discovery": [
        {"id": "pipeline_overview_a",  "name": "Target to IND: Discovery Stages",             "desc": "Target → hit → lead → development candidate; timelines (12-15 years), costs ($2B+), attrition rates at each stage"},
        {"id": "pipeline_overview_b",  "name": "Clinical Phases & Regulatory Milestones",     "desc": "Phase I/II/III/IV overview, IND filing, NDA/BLA submission, probability of success by phase and therapeutic area"},
        {"id": "pipeline_overview_c",  "name": "Portfolio Management & Value Creation",       "desc": "Risk-adjusted NPV, pipeline diversification, go/no-go decision frameworks, partnering vs in-house development strategy"},
        {"id": "target_id_a",          "name": "Disease Biology for Target Identification",   "desc": "Genetics (GWAS, Mendelian disease), proteomics, pathway analysis, phenotypic screening as target-agnostic approaches"},
        {"id": "target_id_b",          "name": "Target Classes & Druggability",               "desc": "GPCRs, kinases, ion channels, nuclear receptors, PPIs, RNA targets — binding pocket properties, druggability scoring tools"},
        {"id": "target_id_c",          "name": "Target Validation Strategies",                "desc": "RNAi/CRISPR knockdown, patient genetics as human genetic validation, mouse models, biomarker evidence, clinical proof-of-concept"},
        {"id": "hit_discovery_a",      "name": "Compound Libraries & Screening Collections", "desc": "Diversity sets, fragment libraries (FBDD), DNA-encoded libraries, natural products, virtual screening as alternative to physical HTS"},
        {"id": "hit_discovery_b",      "name": "High-Throughput Screening",                   "desc": "Assay formats (biochemical, cell-based), miniaturisation (384/1536-well), Z'-factor, hit rate expectations, false positive sources"},
        {"id": "hit_discovery_c",      "name": "Hit Characterisation & Triage",               "desc": "Dose-response confirmation, selectivity counter-screens, mechanism of action, physicochemical properties, hit-to-lead criteria"},
        {"id": "lead_optimization_a",  "name": "Structure-Activity Relationships",            "desc": "SAR principles, analogue synthesis, matched molecular pair analysis, scaffold hopping, bioisosteric replacements"},
        {"id": "lead_optimization_b",  "name": "ADMET-Guided Medicinal Chemistry",            "desc": "Lipinski Ro5, multiparameter optimisation, metabolic soft spots, P-gp efflux, hERG liability in lead optimisation"},
        {"id": "lead_optimization_c",  "name": "Selectivity & Polypharmacology",              "desc": "Kinome selectivity profiling (Eurofins), off-target panels, designed polypharmacology, selectivity windows and safety margins"},
        {"id": "admet_a",              "name": "Absorption & Bioavailability",                "desc": "Solubility assays, Caco-2 permeability, PAMPA, first-pass hepatic metabolism, oral bioavailability calculation and prediction"},
        {"id": "admet_b",              "name": "Distribution & Metabolism",                   "desc": "Plasma protein binding, volume of distribution, blood-brain barrier penetration, CYP reaction phenotyping, metabolite ID"},
        {"id": "admet_c",              "name": "Excretion, Toxicity & In Silico ADMET",       "desc": "Renal clearance, biliary excretion, hERG patch-clamp, DILI prediction, in silico tools (pkCSM, SwissADME, Derek Nexus)"},
        {"id": "pk_pd_a",              "name": "Core PK Parameters",                          "desc": "Cmax, AUC, t½, clearance (CL), volume of distribution (Vd) — one and two-compartment models, non-compartmental analysis"},
        {"id": "pk_pd_b",              "name": "Pharmacodynamic Models",                      "desc": "Emax model, EC50, Hill coefficient, direct vs indirect response models, hysteresis, PD biomarkers in drug development"},
        {"id": "pk_pd_c",              "name": "PK/PD Integration & Dose Selection",          "desc": "Exposure-response relationships, PK/PD-driven dose selection, translational PK/PD from animal to human, PKPD modelling tools"},
        {"id": "preclinical_a",        "name": "In Vitro Safety Assessment",                  "desc": "Genotoxicity (Ames test, micronucleus), hERG inhibition assay, in vitro hepatotoxicity, reactive metabolite trapping"},
        {"id": "preclinical_b",        "name": "In Vivo Toxicology Studies",                  "desc": "GLP repeat-dose tox, MTD, NOAEL, LOAEL, species selection rationale, pathology, clinical observations, recovery groups"},
        {"id": "preclinical_c",        "name": "IND-Enabling Package",                        "desc": "Safety pharmacology (core battery), reproductive toxicology, impurity qualification, manufacturing readiness, IND content requirements"},
        {"id": "biologics_a",          "name": "Monoclonal Antibody Structure",               "desc": "IgG subclasses (IgG1-4), Fab/Fc regions, CDR loops, Fc effector functions (ADCC, CDC, FcRn half-life extension)"},
        {"id": "biologics_b",          "name": "mAb Engineering & Advanced Formats",          "desc": "Humanisation (CDR grafting), affinity maturation (phage display), ADCs (linker/payload), bispecifics (CrossMAb, BiTE), nanobodies"},
        {"id": "biologics_c",          "name": "Biosimilars",                                 "desc": "Analytical similarity (fingerprint-like), clinical extrapolation rationale, regulatory pathway (351(k) FDA, Article 10 EMA), interchangeability"},
        {"id": "cgt_dd_a",             "name": "Viral Vectors in Drug Discovery Programs",   "desc": "AAV serotype selection for in vivo gene therapy, lentiviral transduction for ex vivo programs, vector engineering for specificity"},
        {"id": "cgt_dd_b",             "name": "CAR-T in Drug Discovery",                    "desc": "Target antigen selection (safety, tumour expression), CAR construct design decisions, autologous vs allogeneic manufacturing trade-offs"},
        {"id": "cgt_dd_c",             "name": "CRISPR in Drug Discovery",                   "desc": "Genome-wide loss-of-function screens, target validation with CRISPR KO, base editing for disease modelling, in vivo CRISPR therapies"},
        {"id": "comp_drug_disc_a",     "name": "Molecular Docking & Virtual Screening",      "desc": "Receptor preparation, grid generation, scoring functions, virtual screening workflow, enrichment metrics, docking pitfalls"},
        {"id": "comp_drug_disc_b",     "name": "QSAR & ML for Property Prediction",          "desc": "Molecular descriptor selection, QSAR model building, applicability domain, uncertainty quantification, free energy perturbation"},
        {"id": "comp_drug_disc_c",     "name": "Generative AI for Molecules",                "desc": "CVAE, junction tree VAE, diffusion-based molecular design (DiffSBDD), multi-parameter optimisation, wet-lab validation loop"},
        {"id": "biomarkers_dd_a",      "name": "Biomarker Types & Validation",               "desc": "Predictive, prognostic, PD, safety, and susceptibility biomarkers; fit-for-purpose analytical validation (FDA guidance)"},
        {"id": "biomarkers_dd_b",      "name": "Companion Diagnostic Development",           "desc": "CDx co-development strategy, IVD analytical validation (pre-analytic, analytic, clinical), regulatory submission alongside NDA/BLA"},
        {"id": "biomarkers_dd_c",      "name": "Patient Stratification & Biomarker-Led Trials","desc": "Biomarker-enriched designs, basket and umbrella trials, master protocols, adaptive enrichment, genomic prescreening logistics"},
        {"id": "cmc_formulation_a",    "name": "API Synthesis & Process Chemistry",          "desc": "Chemical synthetic routes, process chemistry optimisation, polymorphism and salt screening, impurity control strategy"},
        {"id": "cmc_formulation_b",    "name": "Drug Product Formulation & Stability",       "desc": "Dosage form selection, excipient roles, ICH Q1 stability studies, forced degradation, packaging and storage requirements"},
        {"id": "cmc_formulation_c",    "name": "CMC Regulatory Requirements & Scale-Up",    "desc": "ICH Q8 (pharmaceutical development), Q9 (risk management), Q10 (PQS), QbD design space, tech transfer to CMO/CDMO"},
    ],
    "clinical_trials": [
        {"id": "trial_basics_a",       "name": "Why Clinical Trials Exist",                   "desc": "Evidence hierarchy (RCT vs observational), regulatory mandate for efficacy and safety, historical context (thalidomide, Kefauver-Harris)"},
        {"id": "trial_basics_b",       "name": "The Clinical Development Roadmap",            "desc": "IND filing → Phase I → II → III → NDA/BLA → Phase IV; typical timelines, costs, and probability of success at each stage"},
        {"id": "trial_basics_c",       "name": "Key Stakeholders in Clinical Trials",         "desc": "Sponsor, CRO, investigative site, IRB/IEC, DSMB, FDA/EMA — roles, responsibilities, and contractual relationships"},
        {"id": "phase1_a",             "name": "Phase I Objectives & First-in-Human Ethics",  "desc": "Safety, tolerability, and PK as primary goals; healthy volunteer vs patient studies; MRSD determination (NOAEL/HED/MABEL)"},
        {"id": "phase1_b",             "name": "Dose Escalation Designs",                     "desc": "3+3 rule-based, accelerated titration, mTPI, CRM, BOIN — Bayesian vs rule-based trade-offs, DLT definition, MTD and RP2D"},
        {"id": "phase1_c",             "name": "PK/PD Integration in Phase I",                "desc": "PK sampling strategy, PK/PD modelling for dose selection, biomarker integration (PD endpoints), food effect and DDI studies"},
        {"id": "phase2_3_a",           "name": "Phase II: Proof of Concept & Dose Selection", "desc": "Phase IIa vs IIb, PoC objectives, signal-seeking designs, dose-response, go/no-go criteria, seamless Phase II/III"},
        {"id": "phase2_3_b",           "name": "Phase III: Confirmatory Trial Design",        "desc": "Randomisation methods (stratified, minimisation), double-blind designs, parallel vs crossover, control arm rationale"},
        {"id": "phase2_3_c",           "name": "Endpoint Selection Strategy",                 "desc": "Primary, secondary, PRO endpoints; FDA endpoint qualification, surrogate vs clinical endpoints, patient-relevant outcomes"},
        {"id": "trial_design_stats_a", "name": "Hypothesis Testing in Clinical Trials",       "desc": "Null vs alternative hypothesis, Type I error (α, two-sided vs one-sided), Type II error (β), power — regulatory conventions"},
        {"id": "trial_design_stats_b", "name": "Sample Size Calculation",                     "desc": "Effect size assumptions, variance estimates, dropout/withdrawal allowance, power simulations, sample size inflation strategies"},
        {"id": "trial_design_stats_c", "name": "Adaptive & Bayesian Designs",                 "desc": "Interim analyses, futility stopping (O'Brien-Fleming), sample size re-estimation, alpha spending (Lan-DeMets), platform trials"},
        {"id": "regulatory_bodies_a",  "name": "FDA Structure & Meeting Types",               "desc": "CDER/CBER/CDRH divisions, review divisions by therapeutic area, Type A/B/C meeting requests, pre-IND, end-of-Phase II meetings"},
        {"id": "regulatory_bodies_b",  "name": "EMA, PMDA & Global Agencies",                "desc": "EMA CHMP procedure, centralised vs decentralised authorisation, PMDA consultations, ANVISA, NMPA — regional differences"},
        {"id": "regulatory_bodies_c",  "name": "ICH Guidelines for Clinical Development",     "desc": "ICH E6 GCP, E8 general considerations, E9 statistical principles, E10 control group choice — how these shape protocol design"},
        {"id": "submissions_a",        "name": "IND Application",                             "desc": "IND content (pharmacology, tox, CMC, clinical protocol), investigator IND vs commercial IND, annual reports, protocol amendments"},
        {"id": "submissions_b",        "name": "NDA & BLA Submissions",                       "desc": "CTD format (Modules 1-5), NDA vs BLA distinction, 505(b)(1) vs 505(b)(2), PDUFA user fees, standard vs priority review timelines"},
        {"id": "submissions_c",        "name": "Post-Submission Interactions",                "desc": "Discipline review letters, information requests, advisory committee prep, complete response letters (CRL), resubmission strategies"},
        {"id": "gcp_ethics_a",         "name": "GCP Principles & Responsibilities",           "desc": "ICH E6(R2) framework, sponsor quality systems, investigator obligations, monitor (CRA) roles, essential document management"},
        {"id": "gcp_ethics_b",         "name": "Informed Consent Process",                   "desc": "8 required elements (21 CFR 50.25), process (not just form), vulnerable populations (prisoners, minors), re-consent triggers"},
        {"id": "gcp_ethics_c",         "name": "IRB/IEC & Research Ethics",                  "desc": "IRB composition and review types (expedited, full board), Declaration of Helsinki principles, global harmonisation challenges"},
        {"id": "special_pathways_a",   "name": "FDA Expedited Programs",                      "desc": "Breakthrough Therapy Designation (intensive FDA guidance), Fast Track (rolling review), Priority Review (6-month PDUFA goal)"},
        {"id": "special_pathways_b",   "name": "Accelerated Approval",                        "desc": "Surrogate and intermediate endpoints, post-approval confirmatory trial requirements, FDORA reforms, withdrawal precedents"},
        {"id": "special_pathways_c",   "name": "Global Expedited Pathways",                   "desc": "EMA PRIME scheme, conditional marketing authorisation, exceptional circumstances, SAKIGAKE in Japan, Health Canada Priority Review"},
        {"id": "phase4_pv_a",          "name": "Phase IV Commitments & Post-Approval Studies","desc": "REMS requirements, PMC vs PMR commitments, label expansion studies, paediatric investigation plans (EU), PREA/BPCA (US)"},
        {"id": "phase4_pv_b",          "name": "Pharmacovigilance & Adverse Event Reporting", "desc": "Spontaneous reporting systems (FAERS, EudraVigilance), MedWatch, CIOMS I/II forms, expedited vs periodic reporting"},
        {"id": "phase4_pv_c",          "name": "Signal Detection & Risk Management",          "desc": "PRR, ROR disproportionality methods, PBRER/PSUR aggregate reports, EU risk minimisation measures, REMS effectiveness assessments"},
        {"id": "dct_adaptive_a",       "name": "Decentralised Trial Technologies",            "desc": "eConsent, wearables for digital endpoints, home nursing, telehealth visits, direct-to-patient drug shipment, data integrity challenges"},
        {"id": "dct_adaptive_b",       "name": "Real-World Evidence in Drug Development",    "desc": "RWD sources (EHR, claims, registries), FDA RWE framework, study design for RWE, limitations vs RCT, Sentinal system"},
        {"id": "dct_adaptive_c",       "name": "Platform & Master Protocol Designs",         "desc": "Basket, umbrella, and platform trials, RECOVERY/REMAP-CAP as examples, shared control arm, biomarker-defined subpopulations"},
        {"id": "labeling_postmarket_a","name": "Prescribing Information Structure",           "desc": "Highlights, full PI sections (indication, dosage, warnings, clinical studies), labelling regulations (21 CFR 201), SPL format"},
        {"id": "labeling_postmarket_b","name": "Label Negotiation & FDA Review",              "desc": "Draft label submission, FDA proposed changes, sponsor response, disputed sections, label as commercial and clinical asset"},
        {"id": "labeling_postmarket_c","name": "Lifecycle Management & Exclusivity",         "desc": "New indication filings, line extensions, paediatric exclusivity, patent cliff planning, reference product strategies"},
        {"id": "patient_recruitment_a","name": "Site Selection & Feasibility",               "desc": "Enrolment feasibility assessment, site selection criteria, country and region strategy, site performance metrics and risk"},
        {"id": "patient_recruitment_b","name": "Patient Recruitment Strategies",             "desc": "Disease registries, social media campaigns, digital outreach, patient advocacy partnerships, electronic health record screening"},
        {"id": "patient_recruitment_c","name": "Retention, Adherence & Protocol Deviations", "desc": "Dropout prediction, retention strategies (patient stipends, convenience), protocol deviation classification and impact on data integrity"},
    ],
    "genai_ml": [
        {"id": "ml_foundations_a",     "name": "Supervised & Unsupervised Learning",          "desc": "Regression, classification, clustering, dimensionality reduction — core paradigms, loss functions, gradient descent optimisation"},
        {"id": "ml_foundations_b",     "name": "Model Evaluation & Validation",               "desc": "Train/val/test splits, k-fold cross-validation, ROC/AUC, precision-recall, calibration curves for biological datasets"},
        {"id": "ml_foundations_c",     "name": "Overfitting, Regularisation & Hyperparameters","desc": "Bias-variance trade-off, L1/L2 regularisation, dropout, early stopping, hyperparameter search (grid, random, Bayesian)"},
        {"id": "bio_feature_eng_a",    "name": "Molecular Descriptors & Fingerprints",        "desc": "Morgan/ECFP fingerprints, RDKit descriptors, pharmacophore features — encoding small molecules for ML models"},
        {"id": "bio_feature_eng_b",    "name": "Sequence Encoding Strategies",                "desc": "One-hot encoding, k-mer frequency, PSS matrices, learned embeddings — representing DNA, RNA, and protein sequences"},
        {"id": "bio_feature_eng_c",    "name": "Graph & Multi-Modal Representations",         "desc": "Molecular graphs, protein contact maps, knowledge graphs, combining sequence + structure + omics in multi-modal models"},
        {"id": "classical_ml_lifesci_a","name": "Ensemble Methods for Life Science Data",    "desc": "Random forests, XGBoost, LightGBM applied to ADMET prediction, gene expression classifiers, biomarker selection"},
        {"id": "classical_ml_lifesci_b","name": "SVMs & Logistic Regression in Biology",     "desc": "Kernel trick for molecular data, regularised logistic regression for omics, handling class imbalance in clinical datasets"},
        {"id": "classical_ml_lifesci_c","name": "Survival Analysis & Patient Stratification","desc": "Kaplan-Meier curves, Cox proportional hazards, time-varying covariates, clustering patients for precision medicine"},
        {"id": "deep_learning_fund_a", "name": "Neural Network Fundamentals",                 "desc": "Layers, activation functions, backpropagation, SGD/Adam, batch normalisation — building and training simple networks"},
        {"id": "deep_learning_fund_b", "name": "CNNs & RNNs for Biological Data",            "desc": "CNNs for sequence motif discovery and microscopy images, RNNs/LSTMs for sequential biological data, vanishing gradients"},
        {"id": "deep_learning_fund_c", "name": "Attention Mechanisms & Transformers",        "desc": "Self-attention, multi-head attention, positional encoding, the transformer architecture — foundation of modern sequence AI"},
        {"id": "protein_lang_models_a","name": "Protein Language Model Architecture",        "desc": "BERT-style masked language models for amino acids, tokenisation, pre-training objectives, transfer learning for protein tasks"},
        {"id": "protein_lang_models_b","name": "ESM, ProtTrans & ProteinBERT",              "desc": "ESM-2 embeddings, ProtTrans models, zero-shot mutation effect prediction, using PLM representations in downstream tasks"},
        {"id": "protein_lang_models_c","name": "AlphaFold2 & AF3: How They Work",           "desc": "MSA-based Evoformer, structure module, pLDDT/PAE confidence, AlphaFold3 diffusion head, practical limitations"},
        {"id": "gnn_drug_disc_a",      "name": "Graph Theory for Molecules",                 "desc": "Atoms as nodes, bonds as edges, atom/bond features, molecular graph construction — why graphs suit chemistry better than SMILES"},
        {"id": "gnn_drug_disc_b",      "name": "GNN Architectures",                         "desc": "Message passing neural networks (MPNN), SchNet, DimeNet, AttentiveFP — how 3D geometry improves molecular property prediction"},
        {"id": "gnn_drug_disc_c",      "name": "GNNs in Drug Discovery Applications",       "desc": "Molecular property prediction (ADMET, activity), drug-target interaction prediction, reaction outcome prediction, retrosynthesis"},
        {"id": "gen_molecules_a",      "name": "VAEs & GANs for Molecular Design",          "desc": "Variational autoencoders for latent space molecular optimisation, junction tree VAE, GAN training instability and mode collapse"},
        {"id": "gen_molecules_b",      "name": "Diffusion Models for Molecules",            "desc": "Score-based and DDPM diffusion, 3D molecular generation (EDM, GeoDiff), structure-based drug design (DiffSBDD, DiffDock)"},
        {"id": "gen_molecules_c",      "name": "Multi-Parameter Optimisation in Generative Chemistry","desc": "Pareto optimisation for potency+selectivity+ADMET, REINFORCE and RL for molecular generation, closed-loop design-make-test"},
        {"id": "ai_genomics_omics_a",  "name": "Variant Effect Prediction",                 "desc": "Deep learning for splicing (SpliceAI), regulatory effects (Enformer), missense pathogenicity (AlphaMissense), zero-shot with PLMs"},
        {"id": "ai_genomics_omics_b",  "name": "Gene Expression & Single-Cell Foundation Models","desc": "scGPT, Geneformer, Universal Cell Embeddings — pre-training on cell atlases, downstream tasks, zero-shot cell type transfer"},
        {"id": "ai_genomics_omics_c",  "name": "Multi-Omics Integration",                   "desc": "MOFA+, CITE-seq analysis, multi-modal VAEs, graph-based integration, finding regulatory programs across omics layers"},
        {"id": "ai_clinical_rwe_a",    "name": "Clinical NLP & EHR Mining",                 "desc": "Named entity recognition for clinical text, ICD code prediction, BERT-based clinical models (BioBERT, ClinicalBERT, Med-PaLM)"},
        {"id": "ai_clinical_rwe_b",    "name": "AI for Patient Recruitment & Digital Biomarkers","desc": "Trial eligibility matching (TriNetX, Veeva Vault), wearable data modelling, passive digital biomarkers, FDA DDT program"},
        {"id": "ai_clinical_rwe_c",    "name": "AI-Driven Real-World Evidence",             "desc": "Observational study design with AI, propensity scoring, confounding control, synthetic control arms, FDA RWE pilots"},
        {"id": "responsible_ai_a",     "name": "Bias & Fairness in Medical AI",             "desc": "Training data demographic gaps, performance disparities across subgroups, fairness metrics, bias auditing frameworks"},
        {"id": "responsible_ai_b",     "name": "Explainability in Healthcare AI",           "desc": "SHAP values, LIME, attention visualisation, model cards, clinician trust, explainability vs performance trade-offs"},
        {"id": "responsible_ai_c",     "name": "FDA AI/ML Regulatory Framework",            "desc": "Predetermined change control plan (PCCP), SaMD risk classification, continuous learning, IEC 62304, validation standards"},
        {"id": "ai_dd_platforms_a",    "name": "Recursion & Phenomics-Based AI",            "desc": "Morphological profiling (Cell Painting), Recursion OS, phenomics-guided target ID, dataset scale and model architecture"},
        {"id": "ai_dd_platforms_b",    "name": "Insilico Medicine & Schrödinger",           "desc": "Insilico PandaOmics + Chemistry42 generative platform, INS018_055 IND milestone; Schrödinger FEP+, WaterMap, Glide workflow"},
        {"id": "ai_dd_platforms_c",    "name": "Isomorphic Labs & Next-Gen Platforms",      "desc": "AlphaFold3 in drug design, protein-ligand structure prediction, Isomorphic's Eli Lilly/Novartis deals, next-generation AI pipeline companies"},
        {"id": "ml_pipelines_a",       "name": "MLOps for Life Sciences",                   "desc": "Experiment tracking (MLflow, W&B), data versioning (DVC), model registry, CI/CD for ML, reproducibility requirements"},
        {"id": "ml_pipelines_b",       "name": "Cloud Infrastructure & Data Governance",    "desc": "AWS/GCP/Azure life sciences architectures, HIPAA/GDPR in ML systems, data access controls, federated learning concepts"},
        {"id": "ml_pipelines_c",       "name": "Production ML in Regulated Environments",  "desc": "FDA SaMD guidance, audit trails, model validation documentation, IQ/OQ/PQ for ML systems, change control post-deployment"},
    ],
    "biotech_business": [
        {"id": "biotech_biz_model_a",  "name": "Biotech Company Structures & Revenue Models", "desc": "Pipeline vs platform vs service company models, royalty and milestone revenue, the fully integrated vs virtual biotech spectrum"},
        {"id": "biotech_biz_model_b",  "name": "Startup vs Big Pharma Economics",            "desc": "Burn rate, runway, headcount efficiency, cost per IND, how venture-backed biotechs differ from large pharma in resource allocation"},
        {"id": "biotech_biz_model_c",  "name": "The Biotech Ecosystem",                      "desc": "VC firms (a16z bio, OrbiMed, Atlas, Flagship), academic spin-outs, biotech hubs (Kendall Sq, Mission Bay, Stevenage), CRO/CDMO ecosystem"},
        {"id": "biotech_financing_a",  "name": "Seed & Series A Financing",                  "desc": "What seed-stage investors look for (founder/team, target validation), typical seed terms, pre-money valuation, Series A readiness"},
        {"id": "biotech_financing_b",  "name": "Series B/C, Crossover & Late-Stage Financing","desc": "Later-stage milestone packages, crossover investor role, bridge rounds, venture debt (Hercules, Oxford Finance), dilution management"},
        {"id": "biotech_financing_c",  "name": "IPO & Public Market Lifecycle",              "desc": "S-1 anatomy, NASDAQ/NYSE listing, lock-up periods, institutional vs retail investor base, post-IPO stock performance patterns"},
        {"id": "ls_valuation_a",       "name": "Risk-Adjusted NPV (rNPV)",                   "desc": "Probability of success by phase, discount rate selection (10-15% for biotech), cash flow modelling, terminal value approaches"},
        {"id": "ls_valuation_b",       "name": "Comparable Transactions & Market Multiples", "desc": "Precedent deal database (EvaluatePharma, BioCentury), upfront vs milestone vs royalty benchmarks, peak sales multiples"},
        {"id": "ls_valuation_c",       "name": "Communicating Pipeline Value to Investors",  "desc": "Investor presentation anatomy, pipeline table with catalysts, data read-out timelines, translating science into financial narrative"},
        {"id": "bd_licensing_a",       "name": "Deal Structures in Biotech",                 "desc": "Option deals, co-development/co-commercialisation, full license, collaboration agreements — economics of each structure"},
        {"id": "bd_licensing_b",       "name": "Term Sheets & Deal Economics",               "desc": "Upfront payment, milestones (development, regulatory, commercial), royalty tiers, sublicensing rights, diligence obligations"},
        {"id": "bd_licensing_c",       "name": "Due Diligence in BD Deals",                 "desc": "IP due diligence, clinical data package review, CMC/manufacturing diligence, commercial diligence, typical timeline and red flags"},
        {"id": "market_strategy_a",    "name": "Patient Population Sizing",                  "desc": "Epidemiology → diagnosed population → treatment-eligible → accessible market; bottom-up vs top-down market sizing"},
        {"id": "market_strategy_b",    "name": "Competitive Landscape Analysis",             "desc": "Approved products, pipeline competitors, differentiation (efficacy, safety, convenience), SWOT, indication priority"},
        {"id": "market_strategy_c",    "name": "Launch Strategy & Go-to-Market",             "desc": "Geography sequencing (US-first vs EU), indication prioritisation, KOL mapping, pre-launch activities, formulary access strategy"},
        {"id": "market_access_heor_a", "name": "The Global Payer Landscape",                 "desc": "US commercial payers, Medicare/Medicaid, EU national payers, formulary tiers, P&T committee dynamics, prior authorisation"},
        {"id": "market_access_heor_b", "name": "Health Economics & HTA",                    "desc": "QALY, ICER thresholds, cost-effectiveness models, NICE/G-BA/HAS/AIFA appraisal processes, HTA-aligned trial design"},
        {"id": "market_access_heor_c", "name": "Value-Based Contracts & Pricing Strategy",  "desc": "Outcomes-based contracts, annuity payment models for gene therapy, reference pricing, parallel trade, net price negotiations"},
        {"id": "ip_biotech_a",         "name": "Patent Types in Life Sciences",              "desc": "Composition of matter, method of use, formulation, process patents — scope, strength, and litigation value of each type"},
        {"id": "ip_biotech_b",         "name": "Patent Strategy & Lifecycle",               "desc": "Filing timing relative to publication, continuation and CIP strategy, Orange Book listing, patent term extension, patent cliffs"},
        {"id": "ip_biotech_c",         "name": "FTO, Licensing & Trade Secrets",            "desc": "Freedom-to-operate analysis, in-licensing technology IP, trade secrets as alternative to patents, IP in partnership agreements"},
        {"id": "mfg_ops_a",            "name": "GMP & Quality Systems",                     "desc": "FDA 21 CFR Part 211, EMA GMP Annex 1, GMP audit preparation, quality agreements, change control in manufacturing"},
        {"id": "mfg_ops_b",            "name": "CMO & CDMO Strategy",                       "desc": "CMO vs CDMO distinction, selection criteria, QAA scope, tech transfer packages, dual-sourcing for supply security"},
        {"id": "mfg_ops_c",            "name": "Supply Chain & Cold Chain Logistics",       "desc": "Cold chain requirements for biologics, serialisation, track-and-trace, demand forecasting, supply chain risk management"},
        {"id": "reg_strategy_biz_a",   "name": "Regulatory Risk in Financial Models",       "desc": "How probability of approval by pathway affects rNPV, regulatory risk events (CRL), modelling regulatory timelines in valuations"},
        {"id": "reg_strategy_biz_b",   "name": "Approval Pathways as Business Value Drivers","desc": "Breakthrough designation premium, label breadth vs narrow indication trade-offs, regulatory strategy shaping competitive position"},
        {"id": "reg_strategy_biz_c",   "name": "Post-Approval Commercial Lifecycle",        "desc": "REMS commercial impact, label update strategies, line extension economics, loss of exclusivity (LOE) planning and defensive moves"},
        {"id": "people_culture_a",     "name": "Biotech Org Design & Cross-Functional Teams","desc": "Programme team structures, matrix vs functional org, cross-functional team dynamics, governance frameworks (steering committees)"},
        {"id": "people_culture_b",     "name": "Recruiting & Retaining Scientists",         "desc": "Academic-to-industry transition, equity compensation (options vs RSUs), culture building in high-uncertainty environments"},
        {"id": "people_culture_c",     "name": "Board Governance & Investor Relations",     "desc": "Board composition (independent directors, investors, management), fiduciary duties, investor communication cadence, proxy advisory firms"},
        {"id": "digital_health_biz_a", "name": "Digital Therapeutics & SaMD",              "desc": "DTx definition and reimbursement challenges (Pear Therapeutics lessons), FDA De Novo/510(k) for SaMD, prescription vs OTC DTx"},
        {"id": "digital_health_biz_b", "name": "Health Data as a Business Asset",          "desc": "Real-world data platforms, data partnerships, privacy regulations (HIPAA, GDPR), data monetisation models, synthetic data"},
        {"id": "digital_health_biz_c", "name": "AI Company Business Models in Life Sciences","desc": "Software-as-a-service vs milestone deals, partnership economics with pharma, build-vs-buy decisions, recurring revenue vs one-time"},
        {"id": "building_biotech_a",   "name": "Spinning Out from Academia",               "desc": "IP assignment agreements, university TTO relationships, founder equity, conflict-of-interest management, lab-to-company transition"},
        {"id": "building_biotech_b",   "name": "Founding Team & Seed Round",               "desc": "Ideal founding team composition (scientist + operator), equity splits, SAFE vs priced round, what seed investors evaluate"},
        {"id": "building_biotech_c",   "name": "Series A Readiness",                       "desc": "Data package for Series A (what's sufficient), narrative construction, lead investor identification, milestones that drive value inflection"},
    ],
    "cell_gene_therapy": [
        {"id": "cgt_foundations_a",    "name": "What Are Cell & Gene Therapies?",             "desc": "How CGTs differ from small molecules and biologics, types (gene addition, silencing, editing, cell therapy), approved products landscape"},
        {"id": "cgt_foundations_b",    "name": "Approved CGT Products Deep Dive",             "desc": "Zolgensma (AAV9-SMN1), Luxturna (RPE65), Casgevy (CRISPR-SCD/β-thal), Kymriah/Yescarta (CAR-T) — mechanisms and clinical results"},
        {"id": "cgt_foundations_c",    "name": "ATMP Regulatory Category",                    "desc": "EU ATMP classification (somatic CT, gene therapy, TEP), CBER vs CDER jurisdiction, RMAT and PRIME designations"},
        {"id": "viral_vectors_a",      "name": "AAV Biology & Serotype Selection",            "desc": "Capsid structure, receptor interactions, tissue tropism by serotype (AAV9 CNS/muscle, AAV8 liver, AAV5 eye), packaging capacity (~4.7 kb)"},
        {"id": "viral_vectors_b",      "name": "Lentiviral & Retroviral Vectors",             "desc": "LV integration mechanism, SIN design, insertional mutagenesis history, γ-retrovirus vs lentivirus safety profile, ex vivo use cases"},
        {"id": "viral_vectors_c",      "name": "Adenovirus & Next-Gen Vectors",               "desc": "Adenovirus immunogenicity, transient expression, vaccine applications (ChAdOx1), helper-dependent AdV, AAV capsid engineering approaches"},
        {"id": "nonviral_delivery_a",  "name": "Lipid Nanoparticles for Gene Delivery",      "desc": "LNP ionisable lipid design, endosomal escape mechanism, organ tropism (MC3 liver vs 9A1P1 lung), LNP stability and immunogenicity"},
        {"id": "nonviral_delivery_b",  "name": "Electroporation & Physical Delivery",        "desc": "Electroporation for ex vivo cell transfection (MaxCyte), hydrodynamic injection, sonoporation, nucleofection for T cells and HSCs"},
        {"id": "nonviral_delivery_c",  "name": "Polymer Nanoparticles & Emerging Delivery",  "desc": "PEI, PLGA, lipid-polymer hybrids, GalNAc conjugates for hepatocyte targeting, VLPs, limitations vs viral vectors"},
        {"id": "crispr_mechanisms_a",  "name": "Cas9 Mechanism & Guide RNA Design",          "desc": "SpCas9 RuvC/HNH domains, NGG PAM recognition, spacer design rules, guide RNA secondary structure, efficacy prediction tools"},
        {"id": "crispr_mechanisms_b",  "name": "Off-Target Effects & Minimisation",          "desc": "Off-target prediction (CRISPOR, Cas-OFFinder), unbiased detection (GUIDE-seq, CIRCLE-seq), high-fidelity Cas9 variants (eSpCas9, HiFi)"},
        {"id": "crispr_mechanisms_c",  "name": "Variant Cas Systems",                        "desc": "Cas12a (staggered cuts, T-rich PAM), Cas13 (RNA targeting), CasRx, nickases (D10A) — clinical and research applications"},
        {"id": "base_prime_editing_a", "name": "Cytosine & Adenine Base Editors",            "desc": "CBE mechanism (cytidine deaminase + Cas9-D10A), C→T editing, ABE mechanism (adenosine deaminase), A→G conversions, activity window"},
        {"id": "base_prime_editing_b", "name": "Prime Editing",                              "desc": "pegRNA design (spacer + RT template + PBS), PE2/PE3/PE3b systems, small insertions/deletions/all 12 base changes, efficiency vs CBE/ABE"},
        {"id": "base_prime_editing_c", "name": "Clinical Applications of Precision Editing", "desc": "BE4max for SCD (Beam Therapeutics), ABE8e for TTR amyloidosis, prime editing for PRNP — current IND filings and clinical status"},
        {"id": "cart_therapy_a",       "name": "CAR Construct Architecture",                 "desc": "scFv antigen-binding domain, hinge and transmembrane regions, CD28 vs 4-1BB costimulatory signalling, CD3ζ, armoured CARs"},
        {"id": "cart_therapy_b",       "name": "T Cell Manufacturing Process",               "desc": "Leukapheresis, T cell activation (CD3/CD28 beads), lentiviral transduction, expansion (G-Rex), harvest, QC, cryopreservation"},
        {"id": "cart_therapy_c",       "name": "Autologous vs Allogeneic CAR-T",             "desc": "Autologous limitations (manufacturing time, cost, vein-to-vein), allogeneic off-the-shelf approaches, TALEN/CRISPR for TCR/HLA knockout"},
        {"id": "other_cell_therapies_a","name": "NK Cell & iPSC-Derived Therapies",         "desc": "NK cell advantages (no GvHD, off-the-shelf), FT596 iPSC-derived NK, CD16 engineering, NK cell activation and persistence challenges"},
        {"id": "other_cell_therapies_b","name": "TCR-T Cell Therapy",                        "desc": "Endogenous TCR knockdown, HLA restriction, neoantigen vs shared antigen targets, Adaptimmune (SPEAR T cells), afami-cel"},
        {"id": "other_cell_therapies_c","name": "HSC Gene Correction & TIL Therapy",        "desc": "HSC mobilisation/collection, lentiviral correction (SCD, ADA-SCID, CGD), TIL therapy for solid tumours (Lifileucel), manufacturing scale"},
        {"id": "invivo_exvivo_a",      "name": "Liver & Eye In Vivo Gene Therapy",           "desc": "AAV8/9 hepatic tropism (Hemgenix, BioMarin valoctocogene), subretinal vs intravitreal delivery, dose, immunosuppression needs"},
        {"id": "invivo_exvivo_b",      "name": "CNS, Muscle & Systemic In Vivo Delivery",   "desc": "Intrathecal/intracerebroventricular AAV, Zolgensma systemic AAV9, Sarepta DMD programs, dose-immunogenicity trade-offs"},
        {"id": "invivo_exvivo_c",      "name": "Ex Vivo HSC Editing Workflow",              "desc": "G-CSF mobilisation, apheresis, electroporation-based editing, myeloablative conditioning, infusion, engraftment monitoring"},
        {"id": "cgt_immunogenicity_a", "name": "Pre-Existing AAV Immunity",                 "desc": "NAb prevalence by serotype and geography, patient screening assays, NAb exclusion criteria, strategies for re-dosing or switching"},
        {"id": "cgt_immunogenicity_b", "name": "Insertional Mutagenesis & Genotoxicity",    "desc": "Integration site analysis (INSPIIRED), γ-retrovirus safety incidents (X-SCID), LV safety improvements, monitoring for clonal expansion"},
        {"id": "cgt_immunogenicity_c", "name": "Immune Tolerance Strategies",               "desc": "Transient immunosuppression (prednisolone, rituximab, bortezomib), capsid engineering to evade immune detection, empty capsid depletion"},
        {"id": "cgt_manufacturing_a",  "name": "AAV Vector Production",                     "desc": "Triple transfection HEK293 vs baculovirus/Sf9 system, upstream optimisation, downstream purification (CsCl vs affinity), titer and purity specs"},
        {"id": "cgt_manufacturing_b",  "name": "Cell Therapy Vein-to-Vein Workflow",        "desc": "Apheresis scheduling, closed-system leukapheresis, GMP transduction and expansion, cryopreservation, cold chain logistics, vein-to-vein time"},
        {"id": "cgt_manufacturing_c",  "name": "Critical Quality Attributes for CGTs",      "desc": "AAV: capsid full/empty ratio, residual DNA/protein; Cell therapy: viability, potency assay (cytotoxicity), identity (flow), transduction efficiency"},
        {"id": "cgt_regulatory_a",     "name": "FDA CBER & RMAT Designation",               "desc": "RMAT criteria and benefits (intensive FDA interaction), pre-BLA meetings, 15-year long-term follow-up requirement, CBER guidance documents"},
        {"id": "cgt_regulatory_b",     "name": "EMA CAT & ATMP Regulation",                "desc": "CAT scientific review, PRIME scheme for ATMPs, hospital exemption, conditional marketing authorisation, EMA compassionate use"},
        {"id": "cgt_regulatory_c",     "name": "CMC Challenges for CGTs",                  "desc": "Comparability without traditional analytical similarity, adventitious agent testing, lot release assays, potency challenges, container closure"},
        {"id": "cgt_clinical_a",       "name": "Phase I/II Design for CGTs",               "desc": "Modified 3+3 and mTPI for gene therapy, patient selection (no prior gene therapy), long-term follow-up cohorts, endpoint selection"},
        {"id": "cgt_clinical_b",       "name": "Long-Term Follow-Up Requirements",         "desc": "FDA 15-year LTFU requirement, patient registry design, late-onset adverse events (insertional mutagenesis, immune reactions), data challenges"},
        {"id": "cgt_clinical_c",       "name": "CGT Economics & Access",                   "desc": "One-time curative pricing rationale, outcomes-based annuity payments, payer challenges, Zolgensma at $2.1M, global access equity"},
    ],
    "protein_engineering": [
        {"id": "protein_eng_found_a",  "name": "Structure Determines Function",               "desc": "How active sites, binding interfaces, allosteric pockets, and flexible loops define what a protein does — and can be engineered to do"},
        {"id": "protein_eng_found_b",  "name": "Sequence-Structure-Function Relationships",  "desc": "How single mutations propagate structurally, epistasis in protein fitness landscapes, deep mutational scanning as empirical mapping"},
        {"id": "protein_eng_found_c",  "name": "Engineering Objectives & Trade-Offs",        "desc": "Stability vs activity trade-off, thermostabilisation strategies, expression yield as engineering target, half-life extension considerations"},
        {"id": "directed_evolution_a", "name": "Diversity Generation Methods",               "desc": "Error-prone PCR (epPCR), DNA shuffling, StEP, OmniChange, chemical mutagenesis — how to create large, random and semi-random libraries"},
        {"id": "directed_evolution_b", "name": "Display & Selection Technologies",           "desc": "Phage display, yeast surface display, ribosome display, mRNA display — genotype-phenotype linkage strategies and selection pressure"},
        {"id": "directed_evolution_c", "name": "SELEX & In Vitro Evolution",                 "desc": "Systematic evolution of ligands by exponential enrichment, aptamer selection, continuous directed evolution (PACE), machine learning-guided DE"},
        {"id": "rational_design_a",    "name": "Structure-Based Mutagenesis",                "desc": "Reading electron density maps for active site engineering, FoldX and Rosetta ΔΔG prediction, thermostabilising mutations from structure"},
        {"id": "rational_design_b",    "name": "Computational Alanine Scanning",             "desc": "Hot spot identification, Robetta alanine scanning, energy decomposition, experimental validation of predicted hot spots"},
        {"id": "rational_design_c",    "name": "Semi-Rational Design Strategies",            "desc": "Combining structural insight with focused library screening (ISM, CAST), consensus sequence design, ancestral sequence reconstruction"},
        {"id": "alphafold_practical_a","name": "How AlphaFold2 Works",                      "desc": "MSA depth requirements, Evoformer architecture, triangle updates, structure module, recycling iterations — understanding the model"},
        {"id": "alphafold_practical_b","name": "Interpreting AlphaFold Confidence Scores",  "desc": "pLDDT per-residue confidence, PAE for domain orientations, predicted TM-score, reliable vs uncertain regions in engineering use"},
        {"id": "alphafold_practical_c","name": "AlphaFold Limitations for Protein Engineering","desc": "Conformational states problem, ligand-bound vs apo structures, novel backbone accuracy, MSA scarcity effects, AF3 improvements"},
        {"id": "rfdiffusion_a",        "name": "Diffusion Models for Protein Backbone Design","desc": "Forward noise process, reverse denoising, RFdiffusion architecture, conditioning on motifs/constraints, symmetric protein design"},
        {"id": "rfdiffusion_b",        "name": "RFdiffusion Applications",                   "desc": "De novo binder design, enzyme active site scaffolding, cyclic peptide design, protein-protein interface design, experimental success rates"},
        {"id": "rfdiffusion_c",        "name": "From In Silico to In Vitro: Validation Pipeline","desc": "Rosetta energy filtering, ProteinMPNN sequence design, AlphaFold2 structure prediction filter, expression screening, wet-lab hit rate"},
        {"id": "proteinmpnn_a",        "name": "Inverse Folding Concept",                   "desc": "Designing amino acid sequences that fold into a given backbone — why this is hard, how graph neural networks solve it, training data"},
        {"id": "proteinmpnn_b",        "name": "ProteinMPNN Architecture",                  "desc": "Graph encoding of backbone geometry, edge features (Cα-Cα distances, dihedral angles), autoregressive decoding, tied design for multimers"},
        {"id": "proteinmpnn_c",        "name": "ProteinMPNN + RFdiffusion Design Pipelines","desc": "Practical workflow: RFdiffusion backbone → ProteinMPNN sequences → AF2 filter → expression → biophysical characterisation"},
        {"id": "antibody_engineering_a","name": "mAb Structure & CDR Engineering",          "desc": "VH/VL domain organisation, CDR-H3 length distribution, germline selection impact, structural basis of antigen recognition"},
        {"id": "antibody_engineering_b","name": "Humanisation & Affinity Maturation",       "desc": "CDR grafting, vernier position back-mutations, phage display affinity maturation, yeast display for de novo discovery"},
        {"id": "antibody_engineering_c","name": "Bispecific Formats & Fc Engineering",      "desc": "CrossMAb, DART, BiTE, DuoBody, IgG-like bispecifics; Fc engineering for ADCC/CDC modulation, FcRn-extended half-life, YTE/LS variants"},
        {"id": "enzyme_engineering_a", "name": "Thermostability & Expression Engineering",  "desc": "Consensus mutagenesis, disulfide introduction, proline substitution, salt bridges — systematic approaches to thermostabilisation"},
        {"id": "enzyme_engineering_b", "name": "Activity & Selectivity Engineering",        "desc": "Active site mutagenesis for substrate scope, cofactor engineering, substrate tunnel design, enantioselectivity improvement"},
        {"id": "enzyme_engineering_c", "name": "Industrial Biocatalysis",                   "desc": "Directed evolution for process conditions (organic solvents, extreme pH), Codexis and Arzeda approaches, cascade enzyme design"},
        {"id": "ppi_design_a",         "name": "PPI Hot Spot Analysis",                     "desc": "Experimental (alanine scanning) and computational (Rosetta, FoldX) hot spot mapping, structural biology of binding interfaces"},
        {"id": "ppi_design_b",         "name": "Designing PPI Inhibitors",                  "desc": "α-helix mimetics, stapled peptides, constrained peptides, macrocycles — strategies to disrupt hot spot interactions therapeutically"},
        {"id": "ppi_design_c",         "name": "Miniproteins & Peptide Binders",            "desc": "Lumazine synthase binders, WORM scaffold, RFdiffusion-designed miniprotein binders, peptide therapeutics, oral delivery challenges"},
        {"id": "developability_a",     "name": "Aggregation & Colloidal Stability",         "desc": "Hydrophobic patch analysis, AC-SINS, DLS, SEC-MALS, thermal denaturation — predicting and reducing aggregation propensity"},
        {"id": "developability_b",     "name": "Chemical Degradation & Sequence Liabilities","desc": "Deamidation (NG, NS), oxidation (Met, Trp), isomerisation (DG), fragmentation (DP, DS) — identification and mitigation strategies"},
        {"id": "developability_c",     "name": "Immunogenicity Prediction & Mitigation",   "desc": "In silico T-cell epitope prediction (EpiMatrix, iTope), MHC-II binding assessment, immunogenicity risk scoring, deimmunisation"},
        {"id": "therapeutic_formats_a","name": "Half-Life Extension Strategies",           "desc": "Fc fusion proteins, PEGylation, albumin binding domains, XTEN fusion, FcRn engineering (YTE, LS, Halozyme ENHANZE) — pros and cons"},
        {"id": "therapeutic_formats_b","name": "ADC Design Principles",                    "desc": "Antibody selection, linker chemistry (cleavable vs non-cleavable), payload selection (MMAE, DM1, PBD), DAR, site-specific conjugation"},
        {"id": "therapeutic_formats_c","name": "Multispecific & Novel Protein Formats",    "desc": "Trispecifics, nanobodies (single-domain VHH), DARPins, affibodies, Centyrins, monobodies — when novel formats beat conventional mAbs"},
        {"id": "protein_validation_a", "name": "Biophysical Characterisation Methods",     "desc": "SPR (KD, kon, koff), ITC (thermodynamics), DSF/nanoDSF (Tm), MST (KD in solution) — matching method to question"},
        {"id": "protein_validation_b", "name": "Structural Validation Techniques",         "desc": "X-ray co-crystallography, cryo-EM for complexes, HDX-MS for epitope mapping, NMR for conformational dynamics, SAXS"},
        {"id": "protein_validation_c", "name": "Cell & In Vivo Efficacy Assays",           "desc": "Target engagement assays (NanoBRET, CETSA), cell-based potency, MOA confirmation, PK/PD in mouse models, translational decision-making"},
    ],
    "rna_therapeutics": [
        {"id": "rna_bio_found_a",      "name": "RNA Classes & Their Functions",               "desc": "mRNA, tRNA, rRNA, lncRNA, miRNA, siRNA, circRNA, piRNA — biogenesis, subcellular localisation, and functional roles"},
        {"id": "rna_bio_found_b",      "name": "RNA Secondary & Tertiary Structure",          "desc": "Stem-loops, hairpins, pseudoknots, G-quadruplexes, riboswitches, SHAPE probing — RNA folds as drug targets"},
        {"id": "rna_bio_found_c",      "name": "Why RNA Expands the Druggable Space",         "desc": "Undruggable protein targets, RAS transcripts, pre-mRNA splicing intervention, transient expression control, quantitative target modulation"},
        {"id": "mrna_design_a",        "name": "5' Cap Structures & Translation Initiation",  "desc": "Cap-0 vs cap-1 methylation, CleanCap AG co-transcriptional capping, cap analogue effect on translation efficiency and innate immune evasion"},
        {"id": "mrna_design_b",        "name": "UTR Engineering & ORF Optimisation",          "desc": "5'/3' UTR stability elements, Kozak context, secondary structure near start codon, codon optimisation algorithms (CAI, tAI, Codon Tools)"},
        {"id": "mrna_design_c",        "name": "Poly-A Tail & mRNA Stability",               "desc": "Enzymatic vs encoded poly-A, optimal tail length (120-150 A), 3' UTR regulatory elements, circular mRNA as alternative for stability"},
        {"id": "rna_delivery_lnp_a",   "name": "LNP Component Roles",                        "desc": "Ionisable lipid (pKa <6.5 for endosomal escape), DSPC helper lipid, cholesterol for membrane fluidity, PEG-lipid for stability and stealth"},
        {"id": "rna_delivery_lnp_b",   "name": "LNP Formulation & Characterisation",         "desc": "Microfluidic mixing, particle size (PDI), encapsulation efficiency (RiboGreen), cryogenic storage, analytical methods for lot release"},
        {"id": "rna_delivery_lnp_c",   "name": "Organ Tropism Engineering",                  "desc": "MC3/DLin-MC3 liver tropism via ApoE, 9A1P1 lung targeting, spleen-targeting LNPs for immune cells, selective organ targeting (SORT)"},
        {"id": "sirna_rnai_a",         "name": "RNAi Mechanism & RISC Loading",              "desc": "Dicer processing, RISC assembly (AGO2), guide strand thermodynamic asymmetry rules, seed region off-targets, mismatch tolerance"},
        {"id": "sirna_rnai_b",         "name": "Chemical Modifications for Stability",       "desc": "2'-OMe and 2'-F for nuclease resistance, phosphorothioate backbone, end caps, GalNAc-siRNA conjugates for hepatocyte targeting"},
        {"id": "sirna_rnai_c",         "name": "Approved siRNA Drugs",                       "desc": "Onpattro (LNP-siRNA, TTR), Givlaari (GalNAc-siRNA, AHP), Inclisiran (PCSK9, twice-yearly dosing), Vutrisiran — mechanism and clinical data"},
        {"id": "aso_therapeutics_a",   "name": "RNase H Gapmers",                           "desc": "DNA gap flanked by 2'-modified wings (2'-MOE, LNA, cEt), RNase H recruitment mechanism, hepatic accumulation, naked ASO delivery"},
        {"id": "aso_therapeutics_b",   "name": "Steric-Block & Splice-Switching ASOs",      "desc": "Exon skipping for DMD (eteplirsen, golodirsen), SMN2 exon inclusion (nusinersen), exon exclusion for progeria (lonafarnib comparison)"},
        {"id": "aso_therapeutics_c",   "name": "CNS Delivery & Clinical Success Stories",   "desc": "Intrathecal delivery (nusinersen, tofersen for SOD1-ALS), CSF distribution, repeat dosing by LP, Huntingtin-targeting ASOs in trials"},
        {"id": "mirna_therapeutics_a", "name": "miRNA Biogenesis & Function",               "desc": "Drosha/DGCR8 pri-miRNA processing, Dicer pre-miRNA cleavage, RISC-mediated translational repression, one miRNA hundreds of targets"},
        {"id": "mirna_therapeutics_b", "name": "miRNA Mimics & AntagomiRs",                 "desc": "miRNA replacement for downregulated tumour suppressors, antimiRs for upregulated oncomiRs, miravirsen (miR-122), cobomarsen (miR-155)"},
        {"id": "mirna_therapeutics_c", "name": "Pleiotropic Targeting Challenges",          "desc": "Off-target effects of miRNA modulation, biomarker development for miRNA therapeutics, delivery bottleneck for mimics, clinical development status"},
        {"id": "mrna_vaccines_a",      "name": "Vaccine Antigen Design",                    "desc": "Spike protein optimisation (2P mutations, furin cleavage abolition), antigen display on nanoparticles, signal peptide selection"},
        {"id": "mrna_vaccines_b",      "name": "Immune Response to mRNA Vaccines",         "desc": "Innate sensing balance, TLR-mediated adjuvanticity, T follicular helper cells, germinal centre reaction, durability of antibody response"},
        {"id": "mrna_vaccines_c",      "name": "BNT162b2 & mRNA-1273 Case Studies",        "desc": "Key design decisions, clinical trial outcomes, variant adaptations (bivalent boosters), manufacturing at scale, global deployment lessons"},
        {"id": "chemical_mods_a",      "name": "Pseudouridine: The Karikó & Weissman Discovery","desc": "How Ψ substitution suppresses TLR7/8 activation, effect on translation efficiency, the Nobel Prize-winning insight and its development"},
        {"id": "chemical_mods_b",      "name": "N1-Methylpseudouridine (m1Ψ)",             "desc": "Superior immunosuppression vs Ψ, enhanced ribosome engagement, why BNT162b2 and mRNA-1273 use m1Ψ, impact on protein yield"},
        {"id": "chemical_mods_c",      "name": "Backbone Modifications: 2'-OMe, 2'-F, PS", "desc": "2'-OMe and 2'-F stability, nuclease resistance, effect on RISC loading, phosphorothioate backbone in ASOs vs RNA, modification interplay"},
        {"id": "circular_sarna_a",     "name": "Circular RNA Therapeutics",                "desc": "Back-splicing mechanism, PIE strategy for production, IRES-driven translation, exonuclease resistance, Orna Therapeutics, Laronde Obi platform"},
        {"id": "circular_sarna_b",     "name": "Self-Amplifying RNA",                      "desc": "Alphavirus replicon design, nsP1-4 replicase, sub-genomic promoter for antigen, saRNA dose-sparing, LUNAR LNP delivery, clinical data"},
        {"id": "circular_sarna_c",     "name": "Next-Generation mRNA Platforms",           "desc": "trans-amplifying RNA, circular-saRNA hybrids, in vivo base editing mRNA, mRNA-encoded gene editors, Laronde eRNA technology"},
        {"id": "rna_immunostim_a",     "name": "Innate Immune Sensing of RNA",             "desc": "TLR3 (dsRNA), TLR7/8 (ssRNA), RIG-I (5'-triphosphate RNA), MDA5 (long dsRNA) — how different RNA features trigger immune activation"},
        {"id": "rna_immunostim_b",     "name": "Suppressing Immunogenicity for Therapeutics","desc": "Modified nucleosides, sequence engineering (AU-rich element removal), dsRNA removal by HPLC, innate sensing and IFN response control"},
        {"id": "rna_immunostim_c",     "name": "Leveraging Immunostimulation for Vaccines","desc": "Adjuvant-free mRNA vaccines, self-adjuvanting saRNA, innate immune activation as an asset for immunisation, mucosal mRNA delivery"},
        {"id": "rna_clinical_dev_a",   "name": "Phase I Design for RNA Therapeutics",      "desc": "Dose escalation in oligonucleotide trials, tissue accumulation and hepatotoxicity monitoring, renal accumulation of ASOs, PK sampling"},
        {"id": "rna_clinical_dev_b",   "name": "Extrahepatic Delivery Challenges",         "desc": "CNS, lung, muscle, tumour — delivery bottlenecks beyond liver, conjugate strategies (GalNAc, folate, antibody), progress in each tissue"},
        {"id": "rna_clinical_dev_c",   "name": "Regulatory Precedents in RNA Drugs",       "desc": "Alnylam NDA (Onpattro), Ionis NDA (nusinersen), Moderna BLA (mRNA-1273) — CMC, clinical, and regulatory novelty each had to resolve"},
        {"id": "rna_platforms_a",      "name": "Moderna: Platform Breadth & Strategy",     "desc": "Investigational mRNA pipeline (personalised cancer vaccines, CMV, HIV), manufacturing platform, LNP technology, revenue diversification"},
        {"id": "rna_platforms_b",      "name": "Alnylam & Ionis: GalNAc & ASO Platforms", "desc": "Alnylam GalNAc-siRNA franchise (ATTR, PH1, hATTR), Ionis CNS-focused ASO pipeline, business models and delivery differentiation"},
        {"id": "rna_platforms_c",      "name": "Emerging RNA Platform Companies",          "desc": "Arrowhead (AREG), Silence Therapeutics (mRNAi GOLD), Laronde (eRNA), Orna Therapeutics (oRNA), Wave Life Sciences — differentiation"},
    ],
    "biomanufacturing": [
        {"id": "biomanuf_intro_a",     "name": "The Biologics Manufacturing Landscape",       "desc": "Biologics product types (mAbs, enzymes, vaccines, CGTs), market size, global manufacturing capacity, the biologics supply chain"},
        {"id": "biomanuf_intro_b",     "name": "GMP as Regulatory Framework",                "desc": "GMP vs GLP vs GCP distinctions, 21 CFR Part 211 (FDA) and EU GMP Annex 1/2, the quality system model, inspection consequences"},
        {"id": "biomanuf_intro_c",     "name": "Manufacturing Process as Part of the Drug",  "desc": "Process and product are inseparable for biologics, why process changes require comparability, CQA concept introduction"},
        {"id": "cell_line_dev_a",      "name": "Host Cell Selection",                        "desc": "CHO (glycosylation, productivity), HEK293 (transient expression, viral vectors), E. coli (no glycosylation, IBs), yeast (P. pastoris, secretion)"},
        {"id": "cell_line_dev_b",      "name": "Stable Cell Line Generation",               "desc": "Stable transfection (linearised plasmid, PiggyBac), selection (MTX amplification, GS system), single-cell cloning by FACS or limiting dilution"},
        {"id": "cell_line_dev_c",      "name": "Clone Screening & Cell Bank Establishment", "desc": "High-throughput mini-bioreactor screening, product quality analytics (CIEX, SEC), MCB/WCB establishment, ICH Q5B characterisation"},
        {"id": "upstream_biopro_a",    "name": "Bioreactor Modes & Selection",              "desc": "Batch vs fed-batch vs perfusion (TFF, ATF) — volumetric productivity, product quality trade-offs, single-use vs stainless steel"},
        {"id": "upstream_biopro_b",    "name": "Critical Process Parameters",               "desc": "Dissolved oxygen (kLa), pH, temperature, agitation, dissolved CO2 — setpoints, control strategies, sensitivity to process conditions"},
        {"id": "upstream_biopro_c",    "name": "Metabolic Monitoring & Scale-Up",           "desc": "Online metabolite monitoring (glucose, lactate, amino acids), metabolic shift, off-gas analysis, geometric similarity rules for scale-up"},
        {"id": "media_feed_a",         "name": "Chemically Defined Media Development",      "desc": "CDM components, supplier qualification, hydrolysate vs CDM trade-offs, DOE-driven media development, proprietary media platforms"},
        {"id": "media_feed_b",         "name": "Fed-Batch Feeding Strategies",              "desc": "Glucose-controlled feeding (exponential, constant, feedback), amino acid bolus vs continuous feeds, cell-specific consumption rates"},
        {"id": "media_feed_c",         "name": "Metabolic Profiling & Quality Trade-Offs",  "desc": "Lactate accumulation and pH effects, ammonia toxicity, galactose-shifted feeding for glycosylation control, titer vs product quality optimisation"},
        {"id": "downstream_proc_a",    "name": "Protein A Affinity Capture",               "desc": "Protein A resin selection (MabSelect, Eshmuno A), loading, wash, low-pH elution, CIP with NaOH, resin lifetime qualification"},
        {"id": "downstream_proc_b",    "name": "Polishing Chromatography Steps",           "desc": "AEX flow-through for HCPs and DNA, CEX for charge variants, HIC for aggregates and variants — bind-and-elute vs flow-through modes"},
        {"id": "downstream_proc_c",    "name": "Viral Clearance & Final Filtration",       "desc": "Low-pH viral inactivation (≥60 min, pH 3.5), nanofiltration (Planova 20N), UF/DF for buffer exchange and concentration, sterile filtration"},
        {"id": "analytical_qc_a",      "name": "Critical Quality Attributes for mAbs",     "desc": "Glycosylation (G0F, G1F, afucosylation), aggregation (HMWS), charge variants (acidic/basic species), potency — ICH Q6B specs"},
        {"id": "analytical_qc_b",      "name": "Analytical Method Development & Validation","desc": "CIEX for charge variants, SEC for aggregation, CEX-MS for intact mass, potency bioassay design, ICH Q2(R1) validation parameters"},
        {"id": "analytical_qc_c",      "name": "Comparability Testing Principles",         "desc": "When comparability is needed (process changes, scale-up, site transfer), extended characterisation panel, clinical bridging decision criteria"},
        {"id": "gmp_quality_a",        "name": "Quality Management System Elements",       "desc": "Change control (CCF, RCC), deviation management (minor, major, critical), CAPA effectiveness, document control, batch record review"},
        {"id": "gmp_quality_b",        "name": "Quality by Design",                        "desc": "ICH Q8 design space, ICH Q9 risk assessment (FMEA, Ishikawa), ICH Q10 PQS, control strategy linking CQAs to CPPs/CMAs"},
        {"id": "gmp_quality_c",        "name": "Regulatory Inspections & Warning Letters", "desc": "FDA PAI/EIR process, EMA inspection, 483 observations vs warning letters, data integrity (Alcoa+), remediation and CAPA commitments"},
        {"id": "scaleup_transfer_a",   "name": "Engineering Challenges in Scale-Up",       "desc": "Mixing time, impeller tip speed, oxygen transfer coefficient (kLa), CO2 stripping, shear stress on cells — 1L to 2,000L engineering principles"},
        {"id": "scaleup_transfer_b",   "name": "Process Validation Stages",               "desc": "Stage 1 (process design), Stage 2 (process qualification — PPQ), Stage 3 (continued process verification) — FDA process validation guidance"},
        {"id": "scaleup_transfer_c",   "name": "Technology Transfer to CMOs",             "desc": "Tech transfer package content, QAA scope, comparability protocol design, tech transfer batch outcomes, oversight of CMO quality systems"},
        {"id": "cell_therapy_mfg_a",   "name": "Autologous Cell Therapy Workflow",        "desc": "Scheduled leukapheresis, fresh vs cryopreserved starting material, vein-to-vein time, product variability, manufacturing slot scheduling"},
        {"id": "cell_therapy_mfg_b",   "name": "Allogeneic Cell Therapy Manufacturing",   "desc": "Donor bank strategy, master cell bank, editing steps, large-scale T cell or NK cell expansion, inventory management, QC release testing"},
        {"id": "cell_therapy_mfg_c",   "name": "Closed-System & Automated Manufacturing","desc": "CliniMACS Prodigy, G-Rex for expansion, Miltenyi automated platforms, aseptic processing in grade A, environmental monitoring"},
        {"id": "mrna_oligo_mfg_a",     "name": "In Vitro Transcription Process",          "desc": "Template preparation (linearised plasmid vs PCR), T7 RNA polymerase reaction, NTP ratios, capping strategy (co-transcriptional vs enzymatic)"},
        {"id": "mrna_oligo_mfg_b",     "name": "mRNA Purification & Quality",             "desc": "Tangential flow filtration (TFF), HPLC for dsRNA removal, integrity by capillary electrophoresis, RiboGreen quantitation, lot release specs"},
        {"id": "mrna_oligo_mfg_c",     "name": "LNP Formulation at Scale & Fill-Finish",  "desc": "Scale-up from microfluidics to impingement jet mixing, LNP size consistency, frozen drug substance, fill-finish for low-temperature RNA products"},
        {"id": "pat_continuous_a",     "name": "Process Analytical Technology",           "desc": "Raman spectroscopy for in-line metabolite monitoring, NIR for dissolved oxygen and biomass, soft sensors, real-time release testing concept"},
        {"id": "pat_continuous_b",     "name": "Automated Feedback Control",              "desc": "PID controllers for DO, pH, glucose, cascade control, model predictive control in bioprocessing, closed-loop automated feeding"},
        {"id": "pat_continuous_c",     "name": "Continuous Bioprocessing",               "desc": "Perfusion upstream + periodic counter-current chromatography (PCCC), end-to-end continuous manufacturing advantages, regulatory status (FDA guidance)"},
        {"id": "biosimilars_lifecycle_a","name": "Biosimilar Development Pathway",        "desc": "351(k) FDA pathway (stepwise approach), EMA Article 10 pathway, totality of evidence framework, reference product characterisation"},
        {"id": "biosimilars_lifecycle_b","name": "Analytical & Clinical Similarity",      "desc": "Fingerprint-like analytical similarity, PK bridging study, efficacy/safety extrapolation rationale, immunogenicity equivalence"},
        {"id": "biosimilars_lifecycle_c","name": "Biosimilar Commercial Strategy",        "desc": "Interchangeability designation, substitution pharmacist level, global launch sequencing, biosimilar-to-biosimilar competition, pricing dynamics"},
    ],
    "longevity_science": [
        {"id": "hallmarks_aging_a",    "name": "Primary Hallmarks of Aging",                  "desc": "Genomic instability (DSB accumulation, somatic mutations), telomere attrition (replicative senescence trigger), epigenetic alterations (methylation drift, chromatin remodelling)"},
        {"id": "hallmarks_aging_b",    "name": "Integrative & Antagonistic Hallmarks",        "desc": "Mitochondrial dysfunction, cellular senescence, stem cell exhaustion, altered intercellular communication — how these amplify each other"},
        {"id": "hallmarks_aging_c",    "name": "Enabling Hallmarks & Systems View",           "desc": "Disabled macroautophagy, deregulated nutrient sensing, dysbiosis, chronic inflammation — the López-Otín 2023 updated framework"},
        {"id": "senescence_senolytics_a","name": "Cellular Senescence Biology",               "desc": "p16INK4a and p21CIP1 CDK inhibitor upregulation, SASP components (IL-6, IL-8, MMPs), triggers (replicative, oncogene-induced, stress-induced)"},
        {"id": "senescence_senolytics_b","name": "Senolytic Drug Development",                "desc": "Dasatinib + quercetin (D+Q) mechanism, navitoclax (BCL-2/XL inhibitor), ABT-263, UBX0101 — target rationale and safety considerations"},
        {"id": "senescence_senolytics_c","name": "Clinical Trials of Senolytics",             "desc": "UNITY Biotechnology (UBX0101 Phase II failure, UBX1325 eye trial), D+Q in IPF and frailty studies, senescent cell burden measurement challenges"},
        {"id": "epigenetic_aging_a",   "name": "Epigenetic Clocks",                          "desc": "Horvath (multi-tissue), Hannum (blood), GrimAge (mortality predictor), DunedinPACE (pace of aging) — how clocks are built and validated"},
        {"id": "epigenetic_aging_b",   "name": "Epigenetic Drift as an Aging Driver",        "desc": "Loss of methylation at CpG shores, gain at bivalent gene promoters, heterochromatin dissolution, H3K27me3 and H3K9me3 changes with age"},
        {"id": "epigenetic_aging_c",   "name": "Partial Epigenetic Reprogramming",           "desc": "Yamanaka factors (OSKM) risks, cyclic vs partial expression, Altos Labs, NewLimit, AgeX Therapeutics — in vivo reprogramming evidence and safety"},
        {"id": "telomere_biology_a",   "name": "Telomere Structure & Shortening",            "desc": "TTAGGG repeats, shelterin complex (TRF1/TRF2/POT1), T-loop structure, end-replication problem, telomere attrition as mitotic clock"},
        {"id": "telomere_biology_b",   "name": "Telomerase & ALT Pathway",                  "desc": "TERT/TERC complex, telomerase expression in stem cells vs somatic cells, alternative lengthening of telomeres (ALT) in 10-15% of cancers"},
        {"id": "telomere_biology_c",   "name": "Telomere Therapeutics & Progeroid Syndromes","desc": "Werner syndrome, Hutchinson-Gilford progeria (HGPS), dyskeratosis congenita — telomere biology as model; lonafarnib, imetelstat"},
        {"id": "mitochondria_aging_a", "name": "Mitochondrial Dysfunction with Age",         "desc": "ETC complex I/IV decline, mtDNA somatic mutation accumulation, mitochondrial network fragmentation, ROS production vs antioxidant defence"},
        {"id": "mitochondria_aging_b", "name": "Mitophagy & Biogenesis",                    "desc": "PINK1/Parkin pathway for damaged mitochondrial clearance, PGC-1α for biogenesis, mitophagy decline with age, exercise as activator"},
        {"id": "mitochondria_aging_c", "name": "NAD+ Metabolism & Supplementation",         "desc": "NAD+ biosynthesis (NAMPT bottleneck), salvage pathway, decline with age, NMN vs NR absorption and efficacy, clinical trial evidence (ELYSIUM, Metro)"},
        {"id": "longevity_pathways_a", "name": "mTOR Signalling & Rapamycin",               "desc": "mTORC1 nutrient sensing (Rheb, AMPK inputs), rapamycin mechanism (FKBP12-rapamycin-mTOR), ITP longevity studies across 4 inbred strains"},
        {"id": "longevity_pathways_b", "name": "AMPK, Metformin & the TAME Trial",          "desc": "AMPK as energy sensor, metformin mechanism (Complex I inhibition → AMPK), TAME trial design (FDA geroscience pilot), primary endpoint"},
        {"id": "longevity_pathways_c", "name": "Sirtuins & IGF-1/Insulin Signalling",       "desc": "SIRT1-7 NAD+-dependent deacylases, caloric restriction mimetics, DAF-16/FOXO signalling in C. elegans, GH/IGF-1 axis and centenarian genetics"},
        {"id": "proteostasis_aging_a", "name": "Chaperone Network Decline",                 "desc": "HSP70/HSP90 function, small HSPs (αB-crystallin), Hsp90 as aging chaperone, heat shock response attenuation with age"},
        {"id": "proteostasis_aging_b", "name": "Ubiquitin-Proteasome System",               "desc": "26S proteasome structure, polyubiquitin chain recognition, 20S vs 19S regulatory particle, UPS impairment in Parkinson's and Alzheimer's"},
        {"id": "proteostasis_aging_c", "name": "Autophagy & Longevity",                    "desc": "Macroautophagy initiation (ULK1, Beclin1, ATG5/7/12), selective autophagy (mitophagy, aggrephagy), spermidine induction, autophagy in longevity"},
        {"id": "inflammaging_a",       "name": "Molecular Drivers of Inflammaging",         "desc": "NF-κB chronic activation, NLRP3 inflammasome, cGAS-STING from cytoplasmic DNA, IL-6 and TNF-α as age-related inflammatory drivers"},
        {"id": "inflammaging_b",       "name": "SASP as Inflammaging Driver",               "desc": "Paracrine SASP effects on neighbouring cells, systemic SASP spread, senomorphic strategies (JAK inhibitors, rapamycin), SASP attenuation"},
        {"id": "inflammaging_c",       "name": "Gut-Inflammation-Brain Axis",               "desc": "Microbiome dysbiosis with age, increased intestinal permeability, LPS translocation, microbiome-brain axis, faecal microbiota transplantation"},
        {"id": "stem_cell_aging_a",    "name": "Haematopoietic & Tissue Stem Cell Decline", "desc": "HSC myeloid skewing with age, clonal haematopoiesis of indeterminate potential (CHIP), satellite cell loss in muscle, intestinal crypt degeneration"},
        {"id": "stem_cell_aging_b",    "name": "Parabiosis & Young Blood Factors",          "desc": "Heterochronic parabiosis experiments (Conboy, Rando labs), GDF11 controversy, GPLD1 pro-cognitive factor, young plasma clinical trials"},
        {"id": "stem_cell_aging_c",    "name": "Plasma Dilution & Systemic Rejuvenation",   "desc": "Isochronic vs heterochronic parabiosis, plasma dilution (Conboy) as alternative to transfusion, apheresis, Alkahest GDF11, clinical evidence"},
        {"id": "longevity_biomarkers_a","name": "Biological Age Concepts",                  "desc": "Why chronological age is insufficient, biological age definition, multi-omic aging clocks vs single-modality, composite biomarker panels"},
        {"id": "longevity_biomarkers_b","name": "Proteomic & Metabolomic Aging Clocks",    "desc": "SomaScan proteomics (Levine PhenoAge), metabolomic clocks, combination clocks, DOSI (dynamic organism state indicator) concept"},
        {"id": "longevity_biomarkers_c","name": "Trial Endpoint Qualification Challenges", "desc": "FDA biomarker qualification process, geroscience endpoints vs disease endpoints, p16/SASP as senescent cell burden markers, TAME endpoint lessons"},
        {"id": "longevity_clinical_a", "name": "TAME Trial & FDA Geroscience Pilot",        "desc": "TAME trial design (3,000 participants, 6 sites, composite endpoint), metformin as geroprotective drug, FDA's position on aging as indication"},
        {"id": "longevity_clinical_b", "name": "Senolytic & Reprogramming Clinical Trials", "desc": "UNITY Biotechnology trial outcomes, D+Q in IPF/frailty, first partial reprogramming IND status, clinical readiness of longevity interventions"},
        {"id": "longevity_clinical_c", "name": "Ethics & Access in Longevity Medicine",    "desc": "Compassionate use in longevity, DIY biohackers (Bryan Johnson, Josiah Zayner), equity in life extension, regulatory uncertainty and hype cycle"},
        {"id": "longevity_industry_a", "name": "The Longevity Company Landscape",          "desc": "Calico (Google), Unity Biotechnology, Altos Labs ($3B AstraZeneca/Bezos), NewLimit (Andreessen), Retro Biosciences (Altman) — science and status"},
        {"id": "longevity_industry_b", "name": "VC Capital & the Hype Cycle",              "desc": "Longevity VC wave ($5B+ deployed), investor expectations vs clinical timelines, failure of Unity's first senolytic (UBX0101), managing the hype cycle"},
        {"id": "longevity_industry_c", "name": "Which Hallmarks Are Closest to Clinical Translation","desc": "Evidence quality by hallmark — senolytics, NAD+ augmentation, mTOR inhibition, epigenetic reprogramming — realistic translation timelines"},
    ],
}

# ── Subjects ──────────────────────────────────────────────────────────────────

SUBJECTS = {
    "bioinformatics": {
        "id": "bioinformatics", "name": "Bioinformatics",
        "tutor_name": "Dr. Priya Nair", "tutor_role": "Senior Bioinformatics Scientist", "tutor_org": "Broad Institute of MIT and Harvard",
        "color": "#00A896", "icon": "🧬",
        "description": "Sequence analysis, BLAST, NGS pipelines, protein structure, and ML in bioinformatics",
        "system_prompt": """You are Dr. Priya Nair, Senior Bioinformatics Scientist at the Broad Institute of MIT and Harvard, and a faculty mentor at Bversity. PhD in computational biology from Stanford, postdoc at EMBL-EBI, now building large-scale genomic analysis pipelines at the Broad. You mentor undergrads because you remember exactly how overwhelming this field felt at the start.

Your knowledge: DNA/RNA/protein sequence analysis, pairwise and multiple alignment, BLAST, phylogenetics, NCBI/UniProt/Ensembl/PDB/KEGG, NGS (Illumina/PacBio/Nanopore), GATK, RNA-seq, protein structure and AlphaFold, Python/Biopython, R/Bioconductor, and ML on omics data.

How you teach: you think out loud, build understanding piece by piece, use analogies constantly. A sequence alignment is like lining two sentences up to find matching words. You ask more than you tell. When a student gets something wrong, you ask a question that leads them to see it themselves.""",
    },
    "genomics": {
        "id": "genomics", "name": "Genomics",
        "tutor_name": "Dr. Marcus Webb", "tutor_role": "Director of Genomics Research", "tutor_org": "Illumina",
        "color": "#7B2D8B", "icon": "🔬",
        "description": "Genome structure, sequencing technologies, variant analysis, GWAS, single-cell, and precision medicine",
        "system_prompt": """You are Dr. Marcus Webb, Director of Genomics Research at Illumina, and a faculty mentor at Bversity. Six years at Genomics England on the 100,000 Genomes Project — interpreting whole-genome sequences from rare disease and cancer patients in MDT meetings where genomic data changed treatment decisions. Now at Illumina developing clinical sequencing applications.

Your knowledge: genome structure, Sanger to long-read Nanopore sequencing, genome assembly and annotation, SNPs/indels/CNVs/SVs, GATK variant calling, ACMG variant classification, population genetics and LD, GWAS, RNA-seq, single-cell genomics, epigenomics, metagenomics, and precision medicine/PGx.

How you teach: every concept gets grounded in a real disease story. When you explain GWAS, you talk about the 2007 Wellcome Trust studies and what finding those Crohn's disease variants meant for patients. Students should feel the stakes, not just understand the tool.""",
    },
    "drug_discovery": {
        "id": "drug_discovery", "name": "Drug Discovery & Development",
        "tutor_name": "Dr. Kavya Reddy", "tutor_role": "Principal Scientist, Drug Discovery", "tutor_org": "Genentech",
        "color": "#E05C00", "icon": "💊",
        "description": "Target identification, lead optimisation, ADMET, biologics, cell & gene therapy, and the full development pipeline",
        "system_prompt": """You are Dr. Kavya Reddy, Principal Scientist in Drug Discovery at Genentech in South San Francisco, and a faculty mentor at Bversity. PhD in medicinal chemistry from Cambridge. Seven years at Genentech on small molecule oncology programs — two compounds you contributed to are currently in Phase II. You've watched drugs fail at every pipeline stage and know exactly why each step exists.

Your knowledge: the full pipeline from target ID to IND, HTS, medicinal chemistry and SAR, ADMET, PK/PD, preclinical development, mAbs and ADCs, CAR-T and CRISPR gene therapy, computational drug discovery including molecular docking and generative AI, biomarkers and companion diagnostics, CMC and formulation.

How you teach: every concept gets a real drug. Imatinib for target ID, thalidomide for ADMET, trastuzumab for biologics. You explain why each pipeline stage exists — what catastrophe you'd invite by skipping it. You push back when students oversimplify.""",
    },
    "clinical_trials": {
        "id": "clinical_trials", "name": "Clinical Trials & Regulatory Affairs",
        "tutor_name": "Dr. Elena Vasquez", "tutor_role": "Head of Regulatory Affairs", "tutor_org": "Novartis",
        "color": "#0066CC", "icon": "📋",
        "description": "Trial phases, biostatistics, FDA/EMA submissions, GCP, pharmacovigilance, and adaptive trial designs",
        "system_prompt": """You are Dr. Elena Vasquez, Head of Regulatory Affairs at Novartis, and a faculty mentor at Bversity. A decade at FDA as an NDA reviewer in the Office of Oncology Products before moving to industry. You've sat on both sides of the table. You know what makes a reviewer approve, reject, or issue a Complete Response Letter.

Your knowledge: clinical trial phases I–IV, RCT and adaptive trial design, biostatistics, FDA/EMA/PMDA and ICH guidelines, GCP and ethics, IND/NDA/BLA/MAA submissions, special pathways, pharmacovigilance, decentralised trials, and drug labelling.

How you teach: you help students inhabit the regulator's mindset. What does FDA need to see, and why does every requirement exist? Thalidomide created modern drug regulation. Aduhelm reignited the Accelerated Approval debate. COVID vaccines showed what EUAs look like under pressure. Regulations are hard-won lessons, not paperwork.""",
    },
    "genai_ml": {
        "id": "genai_ml", "name": "Gen AI & Machine Learning for Life Sciences",
        "tutor_name": "Dr. Aisha Okonkwo", "tutor_role": "Director of Machine Learning", "tutor_org": "Recursion Pharmaceuticals",
        "color": "#6B3FA0", "icon": "🤖",
        "description": "ML foundations, deep learning, protein language models, generative AI for molecules, and responsible AI in healthcare",
        "system_prompt": """You are Dr. Aisha Okonkwo, Director of Machine Learning at Recursion Pharmaceuticals in Salt Lake City, and a faculty mentor at Bversity. PhD in computational biology from MIT. Worked at Google DeepMind contributing to AlphaFold2 validation before joining Recursion, where your team builds ML systems at the intersection of high-content imaging, transcriptomics, and molecular design. You have seen both the academic frontier and the industrial reality of getting models into drug discovery pipelines.

Your knowledge: supervised and unsupervised ML, deep learning (CNNs, RNNs, transformers, GNNs), generative models for molecules, protein language models (ESM, AlphaFold), AI for genomics and multi-omics, responsible AI in healthcare and FDA frameworks, and MLOps for regulated life sciences environments.

How you teach: intuition before equations, always. Before explaining backpropagation, you make sure students understand what a neural network is actually trying to do. You are honest about where AI in life sciences is useful and where it is overhyped. You use specific examples — AlphaFold's proteome coverage, Recursion's phenomics platform, Insilico's first AI-designed compound in Phase II. You push students to think critically about model validation and the gap between benchmark performance and real-world utility.""",
    },
    "biotech_business": {
        "id": "biotech_business", "name": "Biotech Business & Management",
        "tutor_name": "Rohan Mehta", "tutor_role": "VP of Corporate Strategy & Business Development", "tutor_org": "AstraZeneca",
        "color": "#B5451B", "icon": "💼",
        "description": "Biotech financing, valuation, BD & licensing, market access, IP strategy, and building a life sciences company",
        "system_prompt": """You are Rohan Mehta, VP of Corporate Strategy and Business Development at AstraZeneca, and a faculty mentor at Bversity. BSc Biochemistry from King's College London, MBA from INSEAD. Six years at McKinsey's global pharma and medical products practice before joining AstraZeneca, where you have led due diligence on over fifteen licensing deals and M&A transactions. You deliberately don't have a PhD — most of what this subject covers is learned in boardrooms and deal rooms, not labs, and you want students to know that.

Your knowledge: biotech business models and capital structure, Series A through IPO financing, life sciences valuation (rNPV, comparables), BD and licensing deal structures, market access and HEOR, IP strategy, GMP manufacturing and supply chain, regulatory strategy as a business decision, and building a biotech from scratch.

How you teach: direct and practical. Theory that doesn't translate to a decision is wasted time. When you explain rNPV, you build the model together using real numbers from a real deal. When you explain market access, you use a drug that had strong Phase III data but still got rejected by NICE because the cost per QALY was too high. You push students to think like investors and operators. You are honest about what goes wrong.""",
    },
    "cell_gene_therapy": {
        "id": "cell_gene_therapy", "name": "Cell & Gene Therapy",
        "tutor_name": "Dr. James Okonkwo", "tutor_role": "Director of Vector Development", "tutor_org": "bluebird bio",
        "color": "#0891B2", "icon": "✂️",
        "description": "Viral vectors, CRISPR genome editing, CAR-T, ex vivo and in vivo gene therapy, CGT manufacturing and regulatory pathways",
        "system_prompt": """You are Dr. James Okonkwo, Director of Vector Development at bluebird bio, and a faculty mentor at Bversity. PhD in molecular virology from Johns Hopkins. You joined bluebird after a postdoc at the Children's Hospital of Philadelphia gene therapy programme — one of the places that built the modern field. You have been involved in three IND filings for AAV and lentiviral vector products, and have watched gene therapy go from theoretical to curative for diseases like SCD and beta-thalassaemia.

Your knowledge: viral vector biology (AAV serotypes, lentivirus, adenovirus), CRISPR-Cas9 mechanisms and guide RNA design, base editing and prime editing, CAR-T cell engineering and manufacturing, ex vivo HSC correction, in vivo liver and CNS gene therapy, non-viral delivery (LNPs for gene therapy), immunogenicity and genotoxicity risk, GMP manufacturing of viral vectors and cell therapies, and the FDA/EMA regulatory framework for ATMPs.

How you teach: you make the stakes visceral. A child with SMA getting a single AAV injection and meeting motor milestones for the first time. A sickle cell patient who hasn't had a pain crisis in two years. You explain the biology through the clinical story, and you do not hide the failures — Jesse Gelsinger, the early SCID-X1 insertional mutagenesis cases. Those failures built the safety framework we have today and students need to understand why every precaution exists.""",
    },
    "protein_engineering": {
        "id": "protein_engineering", "name": "Protein Engineering & Design",
        "tutor_name": "Dr. Sophie Laurent", "tutor_role": "Lead, Computational Protein Design", "tutor_org": "Genentech",
        "color": "#BE185D", "icon": "🔩",
        "description": "Directed evolution, rational design, AlphaFold, RFdiffusion, antibody engineering, and therapeutic protein formats",
        "system_prompt": """You are Dr. Sophie Laurent, Lead of Computational Protein Design at Genentech in South San Francisco, and a faculty mentor at Bversity. PhD in structural biology from ETH Zurich, postdoc with the Baker lab at the University of Washington where you worked on early RFdiffusion projects before moving to industry. You sit at the exact intersection of computation and experiment — you design proteins on a computer on Monday and get binding data back by Friday.

Your knowledge: protein structure (primary through quaternary), directed evolution methods (error-prone PCR, phage display, yeast display), rational design, AlphaFold2/3 practical use and limitations, RFdiffusion for de novo backbone design, ProteinMPNN for sequence design, antibody engineering and humanisation, bispecific formats, enzyme engineering, PPI design and miniproteins, developability assessment, therapeutic protein formats, and experimental validation methods (SPR, ITC, cryo-EM).

How you teach: you build physical intuition. A protein isn't a 2D sequence — it's a three-dimensional machine shaped by billions of years of selection. Before students touch AlphaFold, they understand what a beta-sheet is and why hydrophobic cores fold inward. You are direct about the gap between computational predictions and experimental reality — the field is extraordinary but overhyped in some corners. You use your own work as examples when appropriate, and you push students to think about what validation they'd need before trusting a prediction.""",
    },
    "rna_therapeutics": {
        "id": "rna_therapeutics", "name": "RNA Therapeutics",
        "tutor_name": "Dr. Amira Hassan", "tutor_role": "VP RNA Platform Sciences", "tutor_org": "Moderna",
        "color": "#B91C1C", "icon": "🧪",
        "description": "mRNA design, siRNA, ASOs, LNP delivery, RNA vaccines, chemical modifications, and the RNA drug pipeline",
        "system_prompt": """You are Dr. Amira Hassan, VP of RNA Platform Sciences at Moderna in Cambridge, Massachusetts, and a faculty mentor at Bversity. PhD in RNA biochemistry from UCSF. You joined Moderna in 2018, two years before COVID-19 changed the world, and you were part of the team that designed and optimised the mRNA-1273 vaccine sequence. You have watched RNA therapeutics go from a niche field that most pharma companies ignored to the most exciting modality in medicine.

Your knowledge: RNA biology and secondary structure, mRNA therapeutic design (cap, UTR, codon optimisation, poly-A), LNP formulation and organ tropism, siRNA and the RISC pathway, ASO mechanisms (RNase H, steric block, splice-switching), miRNA therapeutics, mRNA vaccine design and immunology, chemical modifications (pseudouridine, m1Ψ, 2'-F, 2'-OMe), circular RNA and self-amplifying mRNA, innate immune sensing of RNA (TLR7/8, RIG-I), and the clinical development landscape for RNA drugs.

How you teach: you start with 'why RNA?' every time, because if students don't feel the excitement of what was unlocked — every protein the human genome encodes now potentially reachable — they're just memorising chemistry. You use the COVID vaccine as a case study throughout the course because it's the most compressed drug development story in history and it touches almost everything in the curriculum. You are honest about what RNA still can't do well — CNS delivery, oral dosing, very large proteins — and you frame those as the open problems your students could one day solve.""",
    },
    "biomanufacturing": {
        "id": "biomanufacturing", "name": "Biomanufacturing & Bioprocessing",
        "tutor_name": "Dr. Carlos Reyes", "tutor_role": "VP Bioprocess Development", "tutor_org": "Lonza",
        "color": "#047857", "icon": "⚗️",
        "description": "Upstream and downstream bioprocessing, GMP, cell line development, scale-up, cell therapy manufacturing, and biosimilars",
        "system_prompt": """You are Dr. Carlos Reyes, VP of Bioprocess Development at Lonza in Basel, Switzerland, and a faculty mentor at Bversity. PhD in chemical engineering from MIT with a focus on bioreactor design. You have overseen the tech transfer and scale-up of eleven biologics programmes — six of which are now on the market. You manage teams running 2,000L stirred-tank bioreactors on three continents, and you have personally been on-site for three FDA pre-approval inspections.

Your knowledge: the full biomanufacturing value chain — cell line development (CHO, HEK293, microbial), upstream bioprocessing (fed-batch, perfusion, bioreactor engineering), media and feed development, downstream purification (Protein A, IEX, HIC, SEC, viral clearance), analytical characterisation and CQAs, GMP and quality systems (ICH Q7/Q10, QbD, FDA 21 CFR), scale-up and technology transfer, cell therapy manufacturing (autologous and allogeneic), mRNA and oligonucleotide manufacturing, PAT, and biosimilars.

How you teach: manufacturing is where science meets reality. A molecule that can't be manufactured consistently isn't a drug — it's a paper. You use specific failure modes as teaching moments: aggregation killing a programme in scale-up, a contamination event shutting down a plant, a comparability gap delaying a filing. You want students to respect manufacturing as a scientific discipline, not a downstream afterthought. And you always ask: what's the cost of goods, and does this business model make sense?""",
    },
    "longevity_science": {
        "id": "longevity_science", "name": "Longevity Science",
        "tutor_name": "Dr. Yuki Tanaka", "tutor_role": "Senior Research Scientist", "tutor_org": "Calico Life Sciences",
        "color": "#4338CA", "icon": "⏳",
        "description": "Hallmarks of aging, cellular senescence, epigenetic clocks, longevity pathways, proteostasis, and the geroscience clinical pipeline",
        "system_prompt": """You are Dr. Yuki Tanaka, Senior Research Scientist at Calico Life Sciences (Google's longevity R&D company) in South San Francisco, and a faculty mentor at Bversity. PhD in molecular biology of aging from the Salk Institute, postdoc at the Buck Institute for Research on Aging. You have published on epigenetic aging clocks and mTOR signalling, and you work at a company whose single research question is: why do we age, and can we change it?

Your knowledge: the 12 hallmarks of aging (López-Otín 2023 framework), cellular senescence and senolytics/senomorphics, epigenetic aging clocks (Horvath, DunedinPACE) and partial reprogramming with Yamanaka factors, telomere biology, mitochondrial dysfunction and NAD+ metabolism, longevity signalling pathways (mTOR, AMPK, sirtuins, IGF-1), proteostasis and autophagy, inflammaging and the SASP, stem cell exhaustion and parabiosis experiments, longevity biomarkers and multi-omic aging clocks, clinical trial design in geroscience (TAME trial), and the longevity industry landscape.

How you teach: you hold the tension between scientific rigor and extraordinary possibility. Aging research has had a credibility problem — too much hype, too many supplements, too many claims not backed by human data. You help students distinguish what is mechanism (solid), what is correlation (interesting but uncertain), and what is intervention (where the real gaps are). You ground everything in data. You also convey genuine excitement — partial reprogramming experiments where old mice show regenerated tissues are some of the most striking biology of the last decade, and your students should feel that.""",
    },
}

# ── Careers ───────────────────────────────────────────────────────────────────

CAREERS = {
    "bioinformatics_scientist": {
        "id": "bioinformatics_scientist", "title": "Bioinformatics Scientist",
        "cluster": "Science & Technical", "icon": "🧬",
        "description": "Design and run computational pipelines to analyse genomic, transcriptomic, and proteomic data.",
        "day_in_life": "Build NGS analysis pipelines, run BLAST searches, perform differential expression analysis, and present insights to biology teams.",
        "salary_range": "$80K–$145K",
        "progression": ["Research Assistant", "Bioinformatics Scientist I/II", "Senior Bioinformatics Scientist", "Principal Scientist", "Director of Bioinformatics"],
        "industries": ["Biotech", "Pharma", "Clinical genomics", "CROs", "Academia"],
        "key_concepts": ["central_dogma", "seq_formats", "pairwise_alignment", "blast_search", "msa_phylogenetics", "bio_databases", "ngs_qc", "ngs_alignment", "rnaseq_expression", "protein_structure", "bio_programming", "ml_bioinformatics"],
        "relevant_subjects": ["bioinformatics", "genomics", "genai_ml", "protein_engineering"],
        "min_qualification": "BTech / BSc",
    },
    "genomics_data_analyst": {
        "id": "genomics_data_analyst", "title": "Genomics Data Analyst",
        "cluster": "Science & Technical", "icon": "🔬",
        "description": "Analyse large-scale genomic datasets to uncover variants, gene expression patterns, and population-level insights.",
        "day_in_life": "Process VCFs, run GWAS pipelines, build visualisations, and collaborate with clinical teams to interpret results.",
        "salary_range": "$75K–$130K",
        "progression": ["Data Analyst", "Genomics Data Analyst", "Senior Analyst", "Genomics Data Scientist", "Head of Genomics Analytics"],
        "industries": ["Genomics companies", "Precision medicine startups", "Pharma", "Digital health", "Biobanks"],
        "key_concepts": ["genome_structure", "sequencing_tech", "variant_types", "variant_calling", "population_genetics", "gwas", "transcriptomics", "single_cell", "precision_medicine", "ngs_alignment", "bio_programming"],
        "relevant_subjects": ["genomics", "bioinformatics", "genai_ml", "clinical_trials"],
        "min_qualification": "BTech / BSc",
    },
    "drug_discovery_scientist": {
        "id": "drug_discovery_scientist", "title": "Drug Discovery Scientist",
        "cluster": "Science & Technical", "icon": "💊",
        "description": "Identify and validate drug targets, screen compound libraries, and advance hits through lead optimisation.",
        "day_in_life": "Run target validation assays, analyse HTS data, collaborate with medicinal chemists on SAR, and write scientific reports.",
        "salary_range": "$85K–$150K",
        "progression": ["Research Associate", "Research Scientist", "Drug Discovery Scientist", "Senior Scientist", "Research Director"],
        "industries": ["Big Pharma", "Biotech", "CROs", "Academia (translational)"],
        "key_concepts": ["pipeline_overview", "target_id", "hit_discovery", "lead_optimization", "admet", "pk_pd", "preclinical", "biologics", "cell_gene_therapy", "comp_drug_disc", "biomarkers_dd"],
        "relevant_subjects": ["drug_discovery", "protein_engineering", "cell_gene_therapy", "rna_therapeutics", "biomanufacturing"],
        "min_qualification": "MSc / MTech",
    },
    "clinical_research_associate": {
        "id": "clinical_research_associate", "title": "Clinical Research Associate (CRA)",
        "cluster": "Science & Technical", "icon": "📋",
        "description": "Monitor clinical trial sites to ensure data quality, patient safety, and regulatory compliance.",
        "day_in_life": "Audit clinical sites, review source documents, train site staff on protocols, and file monitoring visit reports.",
        "salary_range": "$60K–$110K",
        "progression": ["Junior CRA", "CRA II", "Senior CRA", "Lead CRA / Clinical Trial Manager", "Director of Clinical Operations"],
        "industries": ["CROs", "Pharma", "Biotech", "Medical devices"],
        "key_concepts": ["trial_basics", "phase1", "phase2_3", "trial_design_stats", "phase4_pv", "gcp_ethics", "regulatory_bodies", "submissions"],
        "relevant_subjects": ["clinical_trials", "drug_discovery"],
        "min_qualification": "BTech / BSc",
    },
    "regulatory_affairs_associate": {
        "id": "regulatory_affairs_associate", "title": "Regulatory Affairs Associate",
        "cluster": "Science & Technical", "icon": "📑",
        "description": "Prepare and submit regulatory dossiers (IND, NDA, BLA, MAA) and liaise with agencies like FDA and EMA.",
        "day_in_life": "Compile CTD modules, review labelling, track agency correspondence, and advise teams on regulatory strategy.",
        "salary_range": "$70K–$130K",
        "progression": ["Regulatory Associate", "RA Specialist", "Senior Specialist", "RA Manager", "Director of Regulatory Affairs"],
        "industries": ["Pharma", "Biotech", "Medical devices", "CROs", "Consultancies"],
        "key_concepts": ["regulatory_bodies", "submissions", "gcp_ethics", "special_pathways", "trial_basics", "phase1", "phase2_3", "admet", "pk_pd", "labeling_postmarket", "dct_adaptive"],
        "relevant_subjects": ["clinical_trials", "drug_discovery", "cell_gene_therapy", "rna_therapeutics"],
        "min_qualification": "BTech / BSc",
    },
    "computational_biologist": {
        "id": "computational_biologist", "title": "Computational Biologist",
        "cluster": "Science & Technical", "icon": "💻",
        "description": "Build mathematical models and computational tools to understand biological systems at a molecular or systems level.",
        "day_in_life": "Develop algorithms for sequence analysis, model gene regulatory networks, build ML models on omics data, and publish research.",
        "salary_range": "$85K–$155K",
        "progression": ["Research Associate", "Computational Biologist", "Senior Computational Biologist", "Principal Scientist", "Director of Computational Biology"],
        "industries": ["Pharma R&D", "Biotech", "AI-in-bio startups", "Academia"],
        "key_concepts": ["central_dogma", "seq_formats", "pairwise_alignment", "blast_search", "bio_programming", "genome_structure", "transcriptomics", "epigenomics", "comp_drug_disc", "ml_bioinformatics", "protein_structure", "ml_foundations"],
        "relevant_subjects": ["bioinformatics", "genomics", "genai_ml", "protein_engineering"],
        "min_qualification": "BTech / BSc",
    },
    "pharmacovigilance_scientist": {
        "id": "pharmacovigilance_scientist", "title": "Pharmacovigilance Scientist",
        "cluster": "Science & Technical", "icon": "🔍",
        "description": "Monitor drug safety signals in post-market data and manage adverse event reporting to regulators.",
        "day_in_life": "Review case safety reports, perform signal detection, prepare PSURs, and liaise with regulatory agencies.",
        "salary_range": "$65K–$120K",
        "progression": ["PV Associate", "Safety Scientist", "Senior PV Scientist", "PV Manager", "Head of Drug Safety"],
        "industries": ["Pharma", "Biotech", "CROs", "Regulatory agencies"],
        "key_concepts": ["phase4_pv", "gcp_ethics", "trial_basics", "admet", "pk_pd", "regulatory_bodies", "submissions", "labeling_postmarket"],
        "relevant_subjects": ["clinical_trials", "drug_discovery"],
        "min_qualification": "BTech / BSc",
    },
    "medical_science_liaison": {
        "id": "medical_science_liaison", "title": "Medical Science Liaison (MSL)",
        "cluster": "Science & Technical", "icon": "🤝",
        "description": "Bridge scientific knowledge between your company's pipeline and key opinion leaders, physicians, and payers.",
        "day_in_life": "Meet with oncologists, present clinical trial data, answer medical questions, gather HCP insights.",
        "salary_range": "$120K–$180K",
        "progression": ["Associate MSL", "MSL", "Senior MSL", "Regional MSL Manager", "Director of Medical Affairs"],
        "industries": ["Pharma", "Biotech", "Medical devices"],
        "key_concepts": ["pipeline_overview", "biologics", "pk_pd", "trial_basics", "phase1", "phase2_3", "phase4_pv", "precision_medicine", "regulatory_bodies"],
        "relevant_subjects": ["clinical_trials", "drug_discovery", "cell_gene_therapy", "rna_therapeutics"],
        "min_qualification": "MSc / MD / PharmD",
    },
    "biomarker_scientist": {
        "id": "biomarker_scientist", "title": "Biomarker & Translational Scientist",
        "cluster": "Science & Technical", "icon": "🎯",
        "description": "Discover and validate biomarkers that stratify patients, predict drug response, or serve as clinical endpoints.",
        "day_in_life": "Analyse multi-omics datasets, run assay validation, and collaborate with clinical teams to embed biomarkers into trial protocols.",
        "salary_range": "$85K–$150K",
        "progression": ["Translational Scientist I", "Biomarker Scientist", "Senior Scientist", "Principal Translational Scientist", "Head of Biomarkers"],
        "industries": ["Pharma", "Biotech", "Diagnostics companies", "Precision medicine startups"],
        "key_concepts": ["central_dogma", "genome_structure", "variant_types", "transcriptomics", "epigenomics", "single_cell", "precision_medicine", "ngs_alignment", "target_id", "admet", "biomarkers_dd"],
        "relevant_subjects": ["genomics", "bioinformatics", "drug_discovery", "genai_ml", "clinical_trials"],
        "min_qualification": "MSc / MTech",
    },
    "clinical_data_manager": {
        "id": "clinical_data_manager", "title": "Clinical Data Manager",
        "cluster": "Science & Technical", "icon": "📊",
        "description": "Oversee the collection, cleaning, and integrity of clinical trial data to support regulatory submissions.",
        "day_in_life": "Build EDC systems, write data validation rules, run edit checks, reconcile SAE data, and prepare clean database lock.",
        "salary_range": "$65K–$115K",
        "progression": ["Data Coordinator", "Clinical Data Manager", "Senior CDM", "Data Management Lead", "Head of Data Management"],
        "industries": ["CROs", "Pharma", "Biotech", "Academic medical centers"],
        "key_concepts": ["trial_basics", "trial_design_stats", "phase1", "phase2_3", "gcp_ethics", "bio_programming"],
        "relevant_subjects": ["clinical_trials", "drug_discovery"],
        "min_qualification": "BTech / BSc",
    },
    "biotech_bd_associate": {
        "id": "biotech_bd_associate", "title": "Biotech Business Development Associate",
        "cluster": "Business & Commercial", "icon": "🤝",
        "description": "Identify partnering, licensing, and M&A opportunities to advance a biotech's pipeline and commercial strategy.",
        "day_in_life": "Screen deal opportunities, build financial models, draft term sheets, and coordinate due diligence.",
        "salary_range": "$80K–$140K",
        "progression": ["BD Analyst", "BD Associate", "Senior Associate", "Director of BD", "VP of Business Development"],
        "industries": ["Biotech", "Pharma", "VC-backed startups"],
        "key_concepts": ["pipeline_overview", "target_id", "biologics", "trial_basics", "phase1", "phase2_3", "regulatory_bodies", "submissions", "special_pathways", "bd_licensing", "ls_valuation"],
        "relevant_subjects": ["biotech_business", "drug_discovery", "clinical_trials", "cell_gene_therapy", "rna_therapeutics"],
        "min_qualification": "BTech / BSc",
    },
    "market_access_analyst": {
        "id": "market_access_analyst", "title": "Market Access & HEOR Analyst",
        "cluster": "Business & Commercial", "icon": "📈",
        "description": "Build the evidence and economic case for payer reimbursement of new drugs, devices, or diagnostics.",
        "day_in_life": "Develop cost-effectiveness models, write HEOR publications, prepare payer dossiers, engage with HTA bodies.",
        "salary_range": "$75K–$130K",
        "progression": ["HEOR Analyst", "Market Access Analyst", "Senior Analyst", "Manager", "Director of Market Access"],
        "industries": ["Pharma", "Biotech", "Consultancies", "Payer organisations"],
        "key_concepts": ["pipeline_overview", "pk_pd", "admet", "phase4_pv", "regulatory_bodies", "submissions", "special_pathways", "trial_design_stats", "market_access_heor"],
        "relevant_subjects": ["biotech_business", "clinical_trials", "drug_discovery"],
        "min_qualification": "BTech / BSc",
    },
    "medical_affairs_associate": {
        "id": "medical_affairs_associate", "title": "Medical Affairs Associate",
        "cluster": "Business & Commercial", "icon": "🏥",
        "description": "Support the scientific and clinical activities that connect a drug to the medical community after approval.",
        "day_in_life": "Develop medical education programmes, review promotional materials for accuracy, respond to unsolicited medical information requests.",
        "salary_range": "$70K–$125K",
        "progression": ["Medical Affairs Associate", "Specialist", "Manager", "Senior Manager", "Director of Medical Affairs"],
        "industries": ["Pharma", "Biotech", "Medical devices"],
        "key_concepts": ["pipeline_overview", "biologics", "pk_pd", "trial_basics", "phase1", "phase2_3", "phase4_pv", "gcp_ethics", "regulatory_bodies", "labeling_postmarket"],
        "relevant_subjects": ["clinical_trials", "drug_discovery", "cell_gene_therapy"],
        "min_qualification": "MSc / PharmD",
    },
    "genomics_commercial_specialist": {
        "id": "genomics_commercial_specialist", "title": "Genomics Commercial Specialist",
        "cluster": "Business & Commercial", "icon": "💹",
        "description": "Sell or support the commercial deployment of genomics platforms, sequencing instruments, and bioinformatics software.",
        "day_in_life": "Demo NGS instruments to hospital genomics labs, support grant applications, train lab staff, track competitive landscape.",
        "salary_range": "$80K–$160K (base + commission)",
        "progression": ["Sales Representative", "Commercial Specialist", "Senior Specialist", "Field Application Scientist", "Regional Sales Manager"],
        "industries": ["Genomics companies", "NGS instrument makers", "Biotech tools & reagents"],
        "key_concepts": ["genome_structure", "sequencing_tech", "variant_types", "gwas", "precision_medicine", "single_cell", "population_genetics", "ngs_qc", "pipeline_overview"],
        "relevant_subjects": ["genomics", "bioinformatics", "clinical_trials"],
        "min_qualification": "BTech / BSc",
    },
    "biotech_product_manager": {
        "id": "biotech_product_manager", "title": "Biotech Product Manager",
        "cluster": "Business & Commercial", "icon": "🗂️",
        "description": "Own the strategic roadmap for a drug, platform, or diagnostic product from launch through lifecycle management.",
        "day_in_life": "Write the product strategy, coordinate cross-functional teams, manage launch plans, track market share.",
        "salary_range": "$100K–$170K",
        "progression": ["Associate PM", "Product Manager", "Senior PM", "Director of Product", "VP of Product / CMO"],
        "industries": ["Pharma", "Biotech", "Genomics", "Diagnostics", "Digital health"],
        "key_concepts": ["pipeline_overview", "target_id", "admet", "pk_pd", "trial_basics", "regulatory_bodies", "submissions", "special_pathways", "precision_medicine", "market_strategy", "market_access_heor"],
        "relevant_subjects": ["biotech_business", "drug_discovery", "clinical_trials", "cell_gene_therapy", "rna_therapeutics"],
        "min_qualification": "BTech / BSc",
    },
    "life_sciences_consultant": {
        "id": "life_sciences_consultant", "title": "Life Sciences Consultant",
        "cluster": "Business & Commercial", "icon": "💼",
        "description": "Advise pharma, biotech, and health-system clients on strategy, commercial excellence, and R&D productivity.",
        "day_in_life": "Build strategy decks and financial models, interview subject matter experts, present findings to C-suite executives.",
        "salary_range": "$90K–$160K",
        "progression": ["Analyst", "Consultant", "Senior Consultant", "Manager", "Principal / Partner"],
        "industries": ["McKinsey / BCG / Bain", "IQVIA / ZS / Huron", "Big4 life sciences"],
        "key_concepts": ["pipeline_overview", "target_id", "admet", "trial_basics", "regulatory_bodies", "submissions", "genome_structure", "precision_medicine", "market_strategy", "ls_valuation", "market_access_heor"],
        "relevant_subjects": ["biotech_business", "drug_discovery", "clinical_trials", "genomics"],
        "min_qualification": "BTech / BSc",
    },
    "biotech_venture_analyst": {
        "id": "biotech_venture_analyst", "title": "Biotech Venture Analyst",
        "cluster": "Business & Commercial", "icon": "💰",
        "description": "Evaluate early-stage biotech investment opportunities and support portfolio companies in raising capital.",
        "day_in_life": "Read scientific papers to assess platform novelty, model company valuations, attend pitch meetings, write investment memos.",
        "salary_range": "$100K–$160K",
        "progression": ["Analyst", "Associate", "Senior Associate", "Principal", "Partner"],
        "industries": ["VC firms", "Corporate venture arms", "Family offices with healthcare focus"],
        "key_concepts": ["pipeline_overview", "target_id", "biologics", "comp_drug_disc", "trial_basics", "phase1", "phase2_3", "regulatory_bodies", "submissions", "special_pathways", "ls_valuation", "biotech_financing", "biotech_biz_model"],
        "relevant_subjects": ["biotech_business", "drug_discovery", "clinical_trials", "cell_gene_therapy", "rna_therapeutics", "genai_ml"],
        "min_qualification": "BTech / BSc",
    },
    "licensing_partnerships": {
        "id": "licensing_partnerships", "title": "Licensing & Partnerships Associate",
        "cluster": "Business & Commercial", "icon": "📝",
        "description": "Structure and negotiate licensing agreements, co-development deals, and research collaborations.",
        "day_in_life": "Review deal precedents, prepare term sheet analysis, coordinate IP due diligence, support contract negotiations.",
        "salary_range": "$75K–$135K",
        "progression": ["Analyst / Paralegal", "Licensing Associate", "Senior Associate", "Manager / Director", "VP of Licensing"],
        "industries": ["Pharma", "Biotech", "Technology transfer offices", "IP law firms"],
        "key_concepts": ["pipeline_overview", "target_id", "biologics", "trial_basics", "regulatory_bodies", "submissions", "special_pathways", "bd_licensing", "ip_biotech", "ls_valuation"],
        "relevant_subjects": ["biotech_business", "drug_discovery", "clinical_trials"],
        "min_qualification": "BTech / BSc",
    },
    "ai_drug_discovery": {
        "id": "ai_drug_discovery", "title": "AI in Drug Discovery Specialist",
        "cluster": "Emerging & Hybrid", "icon": "🤖",
        "description": "Apply machine learning, deep learning, and generative AI to accelerate target identification, virtual screening, and molecular design.",
        "day_in_life": "Train GNNs on molecular data, run AlphaFold structure predictions, build QSAR models, collaborate with wet-lab scientists.",
        "salary_range": "$110K–$200K",
        "progression": ["ML Engineer / Research Scientist", "AI Drug Discovery Scientist", "Senior Scientist", "Principal Scientist", "VP of AI/ML"],
        "industries": ["AI-driven biotech (Recursion, Insilico Medicine, Schrödinger)", "Pharma AI divisions", "Startups"],
        "key_concepts": ["comp_drug_disc", "target_id", "hit_discovery", "lead_optimization", "admet", "seq_formats", "bio_programming", "genome_structure", "central_dogma", "ml_foundations", "deep_learning_fund", "gnn_drug_disc", "gen_molecules", "protein_lang_models"],
        "relevant_subjects": ["genai_ml", "drug_discovery", "protein_engineering", "bioinformatics", "genomics"],
        "min_qualification": "BTech / BSc",
    },
    "precision_medicine_specialist": {
        "id": "precision_medicine_specialist", "title": "Precision Medicine & Genomics Specialist",
        "cluster": "Emerging & Hybrid", "icon": "🎯",
        "description": "Translate genomic insights into clinically actionable, patient-specific treatment decisions.",
        "day_in_life": "Interpret clinical genomics reports, integrate multi-omics data, advise oncologists on companion diagnostic use.",
        "salary_range": "$90K–$160K",
        "progression": ["Genomics Specialist", "Precision Medicine Associate", "Senior Specialist", "Director of Precision Medicine", "Chief Scientific Officer"],
        "industries": ["Precision medicine companies", "Academic medical centers", "Pharma genomic medicine divisions", "Diagnostics"],
        "key_concepts": ["genome_structure", "sequencing_tech", "variant_types", "gwas", "precision_medicine", "transcriptomics", "epigenomics", "single_cell", "population_genetics", "central_dogma", "ngs_alignment", "admet", "pk_pd", "biologics", "biomarkers_dd"],
        "relevant_subjects": ["genomics", "bioinformatics", "clinical_trials", "genai_ml", "cell_gene_therapy"],
        "min_qualification": "MSc / MTech",
    },
    "biotech_founder": {
        "id": "biotech_founder", "title": "Biotech Entrepreneur & Founder",
        "cluster": "Emerging & Hybrid", "icon": "🚀",
        "description": "Start and build a biotech company — from scientific hypothesis to VC funding, IND filing, and clinical proof-of-concept.",
        "day_in_life": "Pitch investors, recruit a scientific board, design company strategy, manage burn rate, and keep a hand in the science.",
        "salary_range": "$0–$500K+ (equity-driven)",
        "progression": ["Junior Scientist / Associate", "Co-founder / CTO / CSO", "CEO", "Public Company Executive", "Serial Founder"],
        "industries": ["Therapeutics", "Genomics", "Diagnostics", "Digital health", "Ag-bio"],
        "key_concepts": ["pipeline_overview", "target_id", "biologics", "comp_drug_disc", "admet", "trial_basics", "regulatory_bodies", "submissions", "special_pathways", "genome_structure", "precision_medicine", "bio_programming", "biotech_biz_model", "biotech_financing", "ls_valuation", "building_biotech"],
        "relevant_subjects": ["biotech_business", "drug_discovery", "clinical_trials", "cell_gene_therapy", "rna_therapeutics", "genai_ml"],
        "min_qualification": "Any background",
    },
}

# ── Capstones ─────────────────────────────────────────────────────────────────

CAPSTONES = {
    "bioinformatics": {
        "subject_id": "bioinformatics",
        "title": "From Sequence to Insight: A Cancer Mutational Landscape Analysis",
        "problem_statement": "You have been given access to a publicly available tumour sequencing dataset from TCGA (The Cancer Genome Atlas). Your task is to build a variant annotation and analysis pipeline, identify driver mutations, classify their functional significance using ClinVar and OncoKB, and produce an analysis report as if presenting findings to an oncology multidisciplinary team.",
        "instructions": "1. Download a TCGA cancer dataset of your choice (BRCA, LUAD, or COAD recommended) from the GDC Data Portal.\n2. Run variant annotation using a tool of your choice (ANNOVAR, VEP, or SnpEff).\n3. Cross-reference significant variants against ClinVar and OncoKB.\n4. Identify the top 5–10 driver mutations and classify each by functional significance.\n5. Write your analysis report (2,000–2,500 words) covering: dataset overview, methodology, key findings, clinical interpretation, and limitations.\n6. Include your annotated code as a Jupyter notebook or R Markdown file with all outputs saved.",
        "deliverable": "ZIP file containing: (1) PDF report (2,000–2,500 words), (2) Jupyter notebook or R Markdown file with saved outputs. Max 50MB.",
        "rubric": [
            {"criterion": "Data handling and pipeline setup", "marks": 20},
            {"criterion": "Variant annotation and filtering", "marks": 20},
            {"criterion": "Driver mutation identification and classification", "marks": 25},
            {"criterion": "Clinical interpretation and reasoning", "marks": 20},
            {"criterion": "Code quality and reproducibility", "marks": 15},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["zip"], "max_size_mb": 50,
    },
    "genomics": {
        "subject_id": "genomics",
        "title": "Clinical Variant Interpretation: A Patient Case Report",
        "problem_statement": "You are a genomics scientist at a clinical genomics laboratory. A patient has been referred with a suspected hereditary cancer syndrome. You have been provided with a set of genomic variants from a simulated whole-genome sequence, a family history, and a clinical summary. Your task is to classify each variant using ACMG/AMP guidelines, identify the most likely pathogenic finding, and write a clinical genomics report suitable for an MDT meeting.",
        "instructions": "1. Download the patient case file (provided with this brief — synthetic data only).\n2. Look up each variant in ClinVar, OMIM, and gnomAD.\n3. Apply ACMG/AMP variant classification criteria to each variant (Pathogenic / Likely Pathogenic / VUS / Likely Benign / Benign).\n4. Identify the primary finding most likely explaining the patient's phenotype.\n5. Write a clinical genomics report following the structure used by NHS Genomic Medicine Service or a comparable lab: patient details (synthetic), variant summary table, clinical interpretation, recommendations.\n6. Include a one-page methods note describing your classification process.",
        "deliverable": "PDF report following the provided clinical report template. Max 20MB.",
        "rubric": [
            {"criterion": "ACMG/AMP variant classification accuracy", "marks": 30},
            {"criterion": "Database evidence sourcing and interpretation", "marks": 20},
            {"criterion": "Clinical reasoning and primary finding identification", "marks": 25},
            {"criterion": "Report structure, clarity, and professionalism", "marks": 15},
            {"criterion": "Methods note completeness", "marks": 10},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["pdf", "zip"], "max_size_mb": 20,
    },
    "drug_discovery": {
        "subject_id": "drug_discovery",
        "title": "Drug Discovery Strategy Memo: Targeting an Unmet Need",
        "problem_statement": "You are a drug discovery scientist presenting to Genentech's R&D strategy committee. Select a disease from the provided shortlist (ALS, Huntington's disease, triple-negative breast cancer, or idiopathic pulmonary fibrosis) and develop a complete drug discovery strategy memo — from target identification through to an IND-ready preclinical plan.",
        "instructions": "1. Choose one disease from the shortlist and identify a validated biological target using OpenTargets, UniProt, and the published literature.\n2. Justify your target choice: mechanism of disease relevance, genetic validation evidence, druggability score.\n3. Propose a hit discovery strategy (HTS, fragment-based, virtual screening, or phenotypic — justify your choice).\n4. Run a basic in silico docking analysis using AutoDock Vina or SwissDock with a PDB structure for your target. Include at least one screenshot of your docking result with interpretation.\n5. Outline your lead optimisation priorities (key ADMET liabilities to address, selectivity concerns).\n6. Describe the minimum preclinical package needed to file an IND.\n7. Write the memo (2,000–2,500 words) plus docking results as appendices.",
        "deliverable": "PDF memo (2,000–2,500 words) with docking screenshots and supporting data as appendices. Max 30MB.",
        "rubric": [
            {"criterion": "Target identification and validation quality", "marks": 25},
            {"criterion": "Hit discovery strategy justification", "marks": 20},
            {"criterion": "In silico docking — execution and interpretation", "marks": 20},
            {"criterion": "Lead optimisation and ADMET reasoning", "marks": 20},
            {"criterion": "Preclinical IND plan and overall scientific rigour", "marks": 15},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["pdf", "zip"], "max_size_mb": 30,
    },
    "clinical_trials": {
        "subject_id": "clinical_trials",
        "title": "Design a Phase II Trial & Regulatory Strategy",
        "problem_statement": "A novel small molecule kinase inhibitor has completed Phase I in patients with advanced solid tumours. It demonstrated acceptable tolerability at 200mg QD, with preliminary PK data showing t½ of 8 hours and dose-proportional exposure. One confirmed partial response was seen in a KRAS-mutant pancreatic cancer patient. Your task is to design the Phase II programme and regulatory strategy that will take this compound toward a potential NDA.",
        "instructions": "1. Define your Phase II patient population, including biomarker selection strategy (KRAS-mutant enriched vs all-comers — justify).\n2. Choose your primary endpoint and justify why it is appropriate and acceptable to FDA/EMA.\n3. Design the trial: phase II design (single-arm, randomised, adaptive?), sample size calculation with assumptions stated, control arm if applicable.\n4. Write a two-page trial synopsis in ICH format.\n5. Write a one-page regulatory strategy memo: which pathway (standard, Breakthrough Therapy, Fast Track?), key FDA/EMA interactions needed, estimated timeline from Phase II start to NDA submission.\n6. Identify the three biggest regulatory risks and how you would mitigate them.",
        "deliverable": "PDF document comprising trial synopsis (2 pages) and regulatory strategy memo (1–2 pages). Total 2,500–3,000 words. Max 20MB.",
        "rubric": [
            {"criterion": "Patient population and biomarker strategy", "marks": 20},
            {"criterion": "Endpoint selection and statistical design", "marks": 25},
            {"criterion": "Trial synopsis completeness and ICH compliance", "marks": 20},
            {"criterion": "Regulatory strategy and pathway choice", "marks": 20},
            {"criterion": "Risk identification and mitigation", "marks": 15},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["pdf"], "max_size_mb": 20,
    },
    "genai_ml": {
        "subject_id": "genai_ml",
        "title": "Build and Validate an ADMET Prediction Model",
        "problem_statement": "You are an AI scientist at a drug discovery company. Your team needs a reliable machine learning model to predict one ADMET property for early compound triage. Using publicly available data from ChEMBL, build, evaluate, and document a model that could realistically be used to prioritise compounds before expensive in vitro testing.",
        "instructions": "1. Choose one ADMET property: blood-brain barrier penetration, hERG cardiotoxicity, or aqueous solubility.\n2. Download a suitable labelled dataset from ChEMBL (minimum 1,000 compounds).\n3. Engineer molecular features (Morgan fingerprints, RDKit descriptors, or both).\n4. Train at least two model architectures (e.g. random forest + a GNN or random forest + XGBoost) and compare performance.\n5. Evaluate rigorously: ROC-AUC, precision-recall curve, and performance on a held-out test set (do not touch the test set until final evaluation).\n6. Write a model card (1,000–1,500 words) covering: data source and curation, features, model choices and trade-offs, evaluation results, known limitations, and regulatory considerations for using this model in a real drug discovery setting.\n7. Include your Jupyter notebook with all outputs saved.",
        "deliverable": "ZIP file containing: (1) Jupyter notebook with all outputs saved, (2) PDF model card (1,000–1,500 words). Max 50MB.",
        "rubric": [
            {"criterion": "Data curation and feature engineering", "marks": 20},
            {"criterion": "Model implementation and training", "marks": 20},
            {"criterion": "Evaluation rigour (test set discipline, metrics)", "marks": 25},
            {"criterion": "Model card quality — limitations and regulatory thinking", "marks": 20},
            {"criterion": "Code quality and reproducibility", "marks": 15},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["zip"], "max_size_mb": 50,
    },
    "biotech_business": {
        "subject_id": "biotech_business",
        "title": "Series B Pitch: Build the Business Case for a Biotech Asset",
        "problem_statement": "You are co-founder and CEO of a Series A biotech. Your lead asset is a first-in-class oral PCSK9 inhibitor for hypercholesterolaemia in patients intolerant to statins. Phase I showed clean safety and PK consistent with QD dosing. You are now raising a $75M Series B to fund a Phase II/III pivotal trial and build out your commercial team. Build the investor pitch deck and financial model.",
        "instructions": "1. Build a 12-slide pitch deck (PowerPoint or PDF) covering: cover slide, problem / unmet need, your solution and MOA, clinical data to date (Phase I summary), Phase II/III development plan, market opportunity and patient sizing, competitive landscape, regulatory strategy, IP position and exclusivity runway, team, financial projections (3-year pro forma), and Series B ask with use of proceeds.\n2. Build an rNPV model in Excel or Google Sheets. Assumptions must include: probability of success by phase (use industry benchmarks), peak year sales estimate, royalty or net margin assumption, discount rate, and development timeline. Show your working.\n3. Write a one-page investment thesis (why this asset, why now, why this team) to accompany the deck.\n4. Identify the three biggest investor objections you expect and how you would respond.",
        "deliverable": "ZIP file containing: (1) PDF pitch deck (12 slides), (2) Excel/Google Sheets rNPV model, (3) PDF investment thesis and objection responses (1–2 pages). Max 30MB.",
        "rubric": [
            {"criterion": "Market opportunity sizing and commercial strategy", "marks": 20},
            {"criterion": "rNPV model construction and assumptions", "marks": 25},
            {"criterion": "Clinical and regulatory strategy in the deck", "marks": 20},
            {"criterion": "Pitch deck narrative, structure, and clarity", "marks": 20},
            {"criterion": "Investment thesis and objection handling", "marks": 15},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["zip"], "max_size_mb": 30,
    },
    "cell_gene_therapy": {
        "subject_id": "cell_gene_therapy",
        "title": "Design a Gene Therapy Programme for a Monogenic Disease",
        "problem_statement": "You are a gene therapy scientist at a clinical-stage biotech. Select one monogenic disease from the shortlist (sickle cell disease, haemophilia A, Duchenne muscular dystrophy, or a rare inherited retinal dystrophy) and design a complete gene therapy programme — from vector selection through to an IND-ready development plan.",
        "instructions": "1. Choose your disease and justify it: unmet need, patient population size, genetic target, and why gene therapy is the right modality.\n2. Select your therapeutic approach (AAV in vivo, lentiviral ex vivo HSC correction, CRISPR base editing, or other) and justify the choice over alternatives.\n3. Vector/edit design: serotype or vector selection, transgene cassette or guide RNA design, anticipated tropism, packaging capacity considerations.\n4. Safety assessment plan: immunogenicity mitigation strategy, genotoxicity monitoring plan (for integrating vectors), off-target analysis approach.\n5. Manufacturing strategy: production platform, scale, key analytical release assays, critical quality attributes.\n6. Regulatory pathway memo (1 page): which FDA/EMA pathway, RMAT or PRIME eligibility, key data packages needed for IND/CTA filing.\n7. Write the full programme document (2,500–3,000 words) plus a one-page regulatory memo.",
        "deliverable": "PDF document: programme plan (2,500–3,000 words) plus regulatory memo (1 page). Max 20MB.",
        "rubric": [
            {"criterion": "Disease selection rationale and unmet need", "marks": 15},
            {"criterion": "Therapeutic approach and vector/edit design", "marks": 25},
            {"criterion": "Safety strategy depth and scientific reasoning", "marks": 25},
            {"criterion": "Manufacturing and analytical plan", "marks": 20},
            {"criterion": "Regulatory pathway memo", "marks": 15},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["pdf", "zip"], "max_size_mb": 20,
    },
    "protein_engineering": {
        "subject_id": "protein_engineering",
        "title": "Computational Design of a Therapeutic Protein",
        "problem_statement": "You are a protein design scientist. Using available computational tools, design an improved or novel therapeutic protein for a target of your choice. Your submission should demonstrate end-to-end thinking from design rationale through to experimental validation strategy.",
        "instructions": "1. Choose a therapeutic application: an improved enzyme replacement therapy, a de novo binder to a target of your choice, a bispecific antibody format, or an engineered cytokine with improved selectivity.\n2. Describe the design strategy: which approach (directed evolution, rational design, AlphaFold-guided, RFdiffusion de novo, or hybrid), and why it is appropriate for your target.\n3. Run at least one computational step and include outputs: use AlphaFold2 (ColabFold) to predict a structure, or use ProteinMPNN to generate sequences for a backbone, or document a directed evolution selection strategy with specific library design.\n4. Developability assessment: predict and address at least three developability liabilities (aggregation, immunogenicity, solubility, viscosity).\n5. Experimental validation plan: what assays would you run to confirm function, binding affinity, and stability? What would a go/no-go decision look like?\n6. Write the design report (2,000–2,500 words) with computational outputs included as figures.",
        "deliverable": "PDF report (2,000–2,500 words) with computational output figures (AlphaFold structure, ProteinMPNN outputs, or library design schematic). Max 30MB.",
        "rubric": [
            {"criterion": "Design rationale and therapeutic application choice", "marks": 20},
            {"criterion": "Computational workflow execution and interpretation", "marks": 30},
            {"criterion": "Developability analysis", "marks": 20},
            {"criterion": "Experimental validation plan", "marks": 20},
            {"criterion": "Scientific writing and figure quality", "marks": 10},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["pdf", "zip"], "max_size_mb": 30,
    },
    "rna_therapeutics": {
        "subject_id": "rna_therapeutics",
        "title": "Design an mRNA Therapeutic or siRNA Drug",
        "problem_statement": "You are an RNA drug designer. Choose one of two tracks: (A) design an mRNA therapeutic or vaccine for a disease of your choice, or (B) design a siRNA or ASO programme targeting a gene of therapeutic interest. Produce a complete design and development document.",
        "instructions": "Track A (mRNA): 1. Choose your disease and therapeutic goal (vaccine antigen, protein replacement, or gene editing mRNA). 2. Design the mRNA molecule: cap selection, 5' UTR (use literature or UTR design tools), codon-optimised ORF (use a codon optimisation tool and show before/after), 3' UTR, poly-A tail length. 3. Choose and justify your delivery system (LNP formulation, organ targeting). 4. Address immunogenicity: which modified nucleosides, how you would measure innate immune activation in vitro. 5. Outline the IND-enabling CMC package.\n\nTrack B (siRNA/ASO): 1. Choose your target gene and disease indication. 2. Design 3 candidate siRNA duplexes or an ASO sequence (use siRNA design tools or mfold; include sequences). 3. Select and justify chemical modifications. 4. Choose a delivery approach (GalNAc conjugate, LNP, naked ASO for CNS). 5. Describe your in vitro knockdown validation plan and lead selection criteria.\n\nBoth tracks: write a 2,000–2,500 word design report with sequences and justification for all design choices.",
        "deliverable": "PDF design report (2,000–2,500 words) including all sequences, modification tables, and design rationale. Max 20MB.",
        "rubric": [
            {"criterion": "Target and indication selection rationale", "marks": 15},
            {"criterion": "Molecular design decisions (sequences, modifications)", "marks": 30},
            {"criterion": "Delivery system selection and justification", "marks": 20},
            {"criterion": "Immunogenicity or off-target strategy", "marks": 20},
            {"criterion": "CMC/development plan or validation plan", "marks": 15},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["pdf", "zip"], "max_size_mb": 20,
    },
    "biomanufacturing": {
        "subject_id": "biomanufacturing",
        "title": "Bioprocess Development Plan for a Biologic",
        "problem_statement": "You are a bioprocess development scientist. A research team has handed you a new monoclonal antibody candidate (or, if you prefer, a cell therapy product) and asked you to develop the manufacturing process from cell line to drug substance. Build a complete bioprocess development plan.",
        "instructions": "Choose either a monoclonal antibody OR a CAR-T cell therapy product. Then:\n1. Cell line / starting material: select and justify your host cell system (CHO for mAb; primary T cells for CAR-T). Describe the cell line development or starting material qualification steps.\n2. Upstream process: propose a bioreactor mode (fed-batch vs perfusion for mAb; G-REX or stirred tank for CAR-T). Define your key process parameters and acceptable ranges for at least 4 critical parameters.\n3. Downstream process (mAb) or cell processing (CAR-T): map the full purification train or manufacturing workflow with justification for each step.\n4. Critical Quality Attributes: list the 5 most important CQAs for your product and the analytical method for each.\n5. Scale-up plan: describe how you would scale from lab-scale to clinical manufacturing, including tech transfer considerations.\n6. GMP readiness checklist: what quality systems must be in place before first human dose?\n7. Write the plan (2,500–3,000 words) with process flow diagrams as figures.",
        "deliverable": "PDF document (2,500–3,000 words) with process flow diagram(s). Max 25MB.",
        "rubric": [
            {"criterion": "Cell line / starting material strategy", "marks": 15},
            {"criterion": "Upstream process design and parameter rationale", "marks": 25},
            {"criterion": "Downstream / cell processing workflow", "marks": 25},
            {"criterion": "CQA identification and analytical methods", "marks": 20},
            {"criterion": "Scale-up and GMP readiness plan", "marks": 15},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["pdf", "zip"], "max_size_mb": 25,
    },
    "longevity_science": {
        "subject_id": "longevity_science",
        "title": "Design a Longevity Intervention Programme",
        "problem_statement": "You are a scientist at a longevity biotech. Design a therapeutic intervention strategy targeting one or more hallmarks of aging. Your programme should have a credible path to a clinical trial, not just a theoretical mechanism.",
        "instructions": "1. Select your target hallmark(s) of aging and justify the choice based on: strength of mechanistic evidence, reversibility, druggability, and existing clinical precedent.\n2. Propose a specific intervention: a senolytic compound, an epigenetic reprogramming approach, a metabolic intervention (rapamycin analogue, NAD+ precursor, etc.), or a cell therapy. If it is an existing molecule, propose a new indication or regimen; if novel, describe the drug class.\n3. Biomarker strategy: which aging clocks or biomarkers would you use to measure efficacy? Justify your choice of primary biological age endpoint and at least two secondary biomarkers. Address the FDA's current position on biological age as an endpoint.\n4. Clinical trial design: propose a Phase II trial design. Who is the patient population (what age, what health status)? What is the primary endpoint and how long is the follow-up? What safety signals would stop the trial?\n5. Risk and ethics section: address the key scientific risks (is the hallmark causative or correlative in humans?), regulatory risks, and the ethical questions around longevity interventions and access.\n6. Write the programme document (2,500–3,000 words).",
        "deliverable": "PDF programme document (2,500–3,000 words). Max 20MB.",
        "rubric": [
            {"criterion": "Hallmark selection and mechanistic rationale", "marks": 20},
            {"criterion": "Intervention design and scientific credibility", "marks": 25},
            {"criterion": "Biomarker strategy and endpoint justification", "marks": 20},
            {"criterion": "Clinical trial design", "marks": 20},
            {"criterion": "Risk, regulatory, and ethics analysis", "marks": 15},
        ],
        "total_marks": 100, "unlock_threshold": 24, "accepted_formats": ["pdf"], "max_size_mb": 20,
    },
}

# ── Career-filtered curriculum helper ────────────────────────────────────────

def effective_curriculum(subject_id: str, career: dict = None) -> list:
    return CURRICULUM[subject_id]

# ── RAG helpers ───────────────────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = 700, overlap: int = 120) -> list:
    text = re.sub(r'\s+', ' ', text).strip()
    chunks, start = [], 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if len(chunk) > 60:
            chunks.append(chunk)
        start = end - overlap
    return chunks


def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.rsplit('.', 1)[-1].lower()
    if ext == 'pdf':
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            return "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")
    elif ext == 'docx':
        try:
            from docx import Document as DocxDoc
            doc = DocxDoc(io.BytesIO(file_bytes))
            return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read DOCX: {e}")
    elif ext == 'txt':
        return file_bytes.decode('utf-8', errors='ignore')
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, DOCX, or TXT.")


def fts_query(text: str) -> str:
    words = re.sub(r'[^\w\s]', ' ', text).split()
    meaningful = [w for w in words if len(w) > 3][:12]
    if not meaningful:
        return '""'
    return ' OR '.join(f'"{w}"' for w in meaningful)


def retrieve_context(subject_id: str, query: str, conn, top_k: int = 4) -> str:
    try:
        q = fts_query(query)
        rows = conn.execute(
            "SELECT content FROM doc_chunks_fts WHERE subject_id = ? AND doc_chunks_fts MATCH ? ORDER BY bm25(doc_chunks_fts) LIMIT ?",
            (subject_id, q, top_k),
        ).fetchall()
        if not rows:
            return ""
        return "\n\n---\n\n".join(r["content"] for r in rows)
    except Exception:
        return ""


def has_materials(subject_id: str, conn) -> bool:
    row = conn.execute("SELECT COUNT(*) as n FROM materials WHERE subject_id = ?", (subject_id,)).fetchone()
    return row["n"] > 0

# ── Prompt builders ───────────────────────────────────────────────────────────

def build_system_prompt(subject: dict, student_name: str, is_first_visit: bool,
                        covered_ids: list, mastered_ids: list, rag_context: str = "",
                        career: dict = None) -> str:
    base = subject["system_prompt"]

    voice_block = f"""

━━ HOW TO SPEAK TO {student_name} ━━
You are in a live one-on-one conversation. Speak like a human tutor, not a content generator.

FORMATTING RULES — follow strictly:
- No markdown headers (##, ###). No emojis.
- NEVER use em dashes (—) or long dashes anywhere in your response. Use a comma, colon, or rewrite the sentence instead.
- Never open with filler: not "Great question!", not "Absolutely!", not "Sure!" — just answer.
- Default to bullet points over prose paragraphs. If you are explaining something, list it. If you are describing a process, list it. Only write prose when it's a direct personal remark to {student_name} or a single-sentence answer.
- Format content bullets as: - **Key term or idea**: explanation. Bold the key term.
- For important points that {student_name} must remember, bold the whole phrase, not just the term: e.g. **This is the most important thing to understand here.**
- Numbered lists only for strict sequences (protocol steps, ordered processes). Bullets for everything else.
- Keep individual bullet points concise: one to two sentences max.
- End most responses with one question that moves {student_name} forward.
- Code blocks for actual code or CLI. Inline backticks for technical names.

PERSONALISATION RULES:
- Use {student_name}'s name naturally in your responses — not every sentence, but often enough that it feels like a real conversation. E.g. "So {student_name}, here's what makes this tricky..." or "The key insight for you, {student_name}, is..."
- Make it feel like you are talking directly to one person, not broadcasting to a class."""

    curriculum = effective_curriculum(subject["id"], career)
    covered_set = set(covered_ids)
    mastered_set = set(mastered_ids)

    curriculum_lines, next_concept = [], None
    for i, c in enumerate(curriculum, 1):
        if c["id"] in mastered_set:    status = "✓✓"
        elif c["id"] in covered_set:   status = "✓ "
        else:                          status = "○ "
        curriculum_lines.append(f"  {status} {i}. {c['name']}: {c['desc']}")
        if next_concept is None and c["id"] not in covered_set:
            next_concept = c

    covered_count  = len(covered_set)
    mastered_count = len(mastered_set)
    total = len(curriculum)

    curriculum_block = f"""

━━ CURRICULUM TRACKER for {student_name} ━━
Progress: {covered_count}/{total} covered, {mastered_count}/{total} mastered

{chr(10).join(curriculum_lines)}
(✓✓ = mastered   ✓ = covered   ○ = not yet covered)"""

    if is_first_visit:
        teaching_note = f"\n\nThis is {student_name}'s very first session. Greet them warmly by name, ask 2–3 questions about their background and goals, then naturally guide them toward concept 1: \"{curriculum[0]['name']}\". Keep it conversational."
    elif next_concept:
        teaching_note = f"\n\n{student_name} is returning. Build on what they know. Guide them toward \"{next_concept['name']}\" — {next_concept['desc']}. Reference prior concepts to reinforce connections."
    else:
        teaching_note = f"\n\n{student_name} has covered the full curriculum. Help them synthesise concepts, suggest advanced topics, and challenge them with integrative questions."

    career_block = ""
    if career:
        career_block = f"""

━━ STUDENT'S CAREER DESTINATION ━━
{student_name} is aiming for: {career['title']} ({career['cluster']})
{career['description']}
Their day-to-day will look like: {career['day_in_life']}

Connect every concept you teach to how a {career['title']} uses it in real work. One sentence of career relevance per concept is powerful — make it specific."""

    rag_block = ""
    if rag_context:
        rag_block = f"""

━━ BVERSITY COURSE MATERIALS ━━
The following excerpts are from Bversity's official course materials for {subject['name']}.
Prioritise this content when relevant. Reference it naturally. Do not cite it when not relevant.

{rag_context}
━━ END COURSE MATERIALS ━━"""

    concept_ids_list = ", ".join(c["id"] for c in curriculum)
    tagging = f"""

━━ CONCEPT TAGGING (required) ━━
End every response with (on its own line):
<<<CONCEPTS:concept_id1,concept_id2>>>
Valid IDs: {concept_ids_list}
Only tag concepts SUBSTANTIVELY taught in THIS response. If none: <<<CONCEPTS:>>>
This line is stripped before {student_name} sees the response."""

    career_tagging = ""
    if not career:
        career_tagging = f"""
If {student_name} mentions a career interest or aspiration, identify the closest match and append:
<<<CAREER:career_id>>>
Valid career IDs: {" | ".join(CAREERS.keys())}
Only tag when the student clearly states a career aspiration. Tag at most once per response."""

    return base + voice_block + curriculum_block + teaching_note + career_block + rag_block + tagging + career_tagging


def build_quiz_prompt(subject: dict, student_name: str, covered_ids: list, mastered_ids: list, career: dict = None) -> str:
    curriculum = effective_curriculum(subject["id"], career)
    covered_set, mastered_set = set(covered_ids), set(mastered_ids)
    to_quiz = [c for c in curriculum if c["id"] in covered_set and c["id"] not in mastered_set]

    voice_rules = "Speak like a human tutor — no markdown headers, no bullet lists, no emojis, no filler openers. Short prose paragraphs. Bold a term only when introducing it. Sound like a person.\n\n"

    if not to_quiz:
        return voice_rules + f"""You are {subject['tutor_name']} at Bversity. {student_name} has mastered everything they've covered. Tell them directly, then suggest the next concept to move on to. One short paragraph.\n\nEnd with: <<<MASTERED:>>>"""

    quiz_concepts = to_quiz[:3]
    concept_list  = "\n".join(f"  - {c['name']}: {c['desc']}" for c in quiz_concepts)
    valid_ids     = ", ".join(c["id"] for c in quiz_concepts)

    return voice_rules + f"""You are {subject['tutor_name']} at Bversity, checking {student_name}'s understanding.

Test them on these concepts:
{concept_list}

Ask two or three questions that probe real understanding — not recall. Use "explain why", "walk me through", or "what would happen if" style questions. Write them as a tutor would ask in conversation, not as a formatted list.

After {student_name} responds: evaluate honestly. If they show solid understanding, affirm it and mark mastery. If there are gaps, explain the gap directly and ask one follow-up — do not mark mastery yet.

End your response with (hidden from student):
<<<MASTERED:concept_id1,concept_id2>>>
Valid IDs for this quiz: {valid_ids}
If none mastered: <<<MASTERED:>>>"""

# ── Mock responses ────────────────────────────────────────────────────────────

MOCK_RESPONSES = {
    "bioinformatics":  "In bioinformatics we use computational methods to analyse biological sequences and other molecular data.\n\n**[Mock mode — add ANTHROPIC_API_KEY to .env for live AI tutoring]**",
    "genomics":        "The genome is the complete set of genetic instructions in an organism.\n\n**[Mock mode — add ANTHROPIC_API_KEY to .env for live AI tutoring]**",
    "drug_discovery":  "The drug development pipeline from target to approval takes roughly 12 years on average.\n\n**[Mock mode — add ANTHROPIC_API_KEY to .env for live AI tutoring]**",
    "clinical_trials": "Phase I trials focus on safety and dose-finding in 20–80 participants before advancing to efficacy testing.\n\n**[Mock mode — add ANTHROPIC_API_KEY to .env for live AI tutoring]**",
    "genai_ml":        "Machine learning in life sciences is transforming how we predict molecular properties and design new drugs.\n\n**[Mock mode — add ANTHROPIC_API_KEY to .env for live AI tutoring]**",
    "biotech_business":"Understanding biotech business models is as important as understanding the science behind the drugs.\n\n**[Mock mode — add ANTHROPIC_API_KEY to .env for live AI tutoring]**",
}

# ── Request models ────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str

class ChatRequest(BaseModel):
    student_id: str
    subject_id: str
    message: str
    quiz_mode: bool = False

class ProfileRequest(BaseModel):
    career_id: str

class MarkRequest(BaseModel):
    score: int
    feedback: str

class RequestCodeRequest(BaseModel):
    email: str
    name: str

class VerifyCodeRequest(BaseModel):
    email: str
    name: str
    code: str

class AddEmailRequest(BaseModel):
    email: str

# ── Email ─────────────────────────────────────────────────────────────────────

def _email_wrap(body: str) -> str:
    return f"""<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#F6F8FB;padding:40px 0">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E8EDF4">
        <div style="background:#07142A;padding:22px 32px">
          <p style="margin:0;font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px">Bversity</p>
          <p style="margin:0;font-size:11px;color:#72CFC0;letter-spacing:0.4px">School of Bioscience</p>
        </div>
        <div style="padding:32px">{body}</div>
        <div style="background:#F6F8FB;padding:18px 32px;border-top:1px solid #E8EDF4">
          <p style="margin:0;font-size:11px;color:#9EABBE;text-align:center">
            Bversity School of Bioscience &middot; An initiative by TABS Learning Pvt Ltd<br>
            You're receiving this because you're a registered learner at Bversity.
          </p>
        </div>
      </div>
    </div>"""

def _heading(text: str) -> str:
    return f'<h2 style="font-size:22px;font-weight:800;color:#07142A;margin:0 0 8px">{text}</h2>'

def _para(text: str) -> str:
    return f'<p style="color:#3D5166;font-size:15px;line-height:1.6;margin:0 0 20px">{text}</p>'

def _btn(text: str, url: str, color: str = "#00A896") -> str:
    return f'<a href="{url}" style="display:inline-block;background:{color};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:8px 0 20px">{text}</a>'

def _divider() -> str:
    return '<hr style="border:none;border-top:1px solid #E8EDF4;margin:24px 0">'

def _small(text: str) -> str:
    return f'<p style="color:#9EABBE;font-size:12px;margin:0">{text}</p>'

async def _send_email(to_email: str, subject: str, html: str) -> bool:
    api_key    = os.environ.get("RESEND_API_KEY", "")
    from_email = os.environ.get("RESEND_FROM_EMAIL", "noreply@bversity.io")
    if not api_key:
        print(f"\n[DEV] Email → {to_email} | {subject}\n")
        return True
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"from": f"Bversity <{from_email}>", "to": [to_email], "subject": subject, "html": html},
                timeout=10.0,
            )
        if res.status_code not in (200, 201):
            print(f"Resend error {res.status_code}: {res.text}")
        return res.status_code in (200, 201)
    except Exception as e:
        print(f"Email error: {e}")
        return False

async def send_welcome_email(to_email: str, name: str) -> bool:
    first = name.split()[0]
    body = (
        _heading(f"Welcome to Bversity, {first}!") +
        _para("You've just joined India's first AI Native University for Biotech &amp; Life Sciences. "
              "Your personal AI tutor is ready — pick a subject and start your first conversation.") +
        _btn("Open Bversity →", "https://bversity.io") +
        _divider() +
        _para("<strong>What to do first:</strong><br>"
              "1. Head to <em>Career Path</em> and tell your tutor what you want to become.<br>"
              "2. Open any subject — Genomics, Drug Discovery, Bioinformatics — and say hello.<br>"
              "3. Your 30-day personalised study plan will be ready once you pick a career.") +
        _small("Questions? Reply to this email — we read every one.")
    )
    return await _send_email(to_email, f"Welcome to Bversity, {first}! 🎉", _email_wrap(body))

async def send_completion_email(to_email: str, name: str, subject_name: str, credential_id: str) -> bool:
    first = name.split()[0]
    body = (
        _heading(f"You completed {subject_name}!") +
        _para(f"Congratulations {first} — you've covered every concept in <strong>{subject_name}</strong>. "
              "Your certificate is now available in your dashboard.") +
        _btn("View Certificate →", "https://bversity.io") +
        _divider() +
        _para(f'<strong>Credential ID:</strong> BVG-{credential_id}<br>'
              'Share this on LinkedIn to let the world know.') +
        _small("Keep going — more subjects await. Each one sharpens your edge in the biotech job market.")
    )
    return await _send_email(to_email, f"Certificate earned: {subject_name} 🎓", _email_wrap(body))

async def send_lag_nudge_email(to_email: str, name: str, lag_days: int, lag_concepts: int) -> bool:
    first = name.split()[0]
    body = (
        _heading(f"Hey {first}, you're {lag_days} day{'s' if lag_days != 1 else ''} behind") +
        _para(f"Your study plan has <strong>{lag_concepts} concept{'s' if lag_concepts != 1 else ''}</strong> overdue. "
              "A short session today can get you back on track — even 20 minutes covers 1–2 concepts.") +
        _btn("Continue Learning →", "https://bversity.io") +
        _divider() +
        _para("Consistency is more powerful than intensity. Log in, pick up where you left off, and let your tutor guide you.") +
        _small("You can adjust your plan any time from the Dashboard.")
    )
    return await _send_email(to_email, f"Your study plan needs attention, {first}", _email_wrap(body))

async def send_weekly_digest_email(to_email: str, name: str, covered: int, mastered: int, streak_subjects: list) -> bool:
    first = name.split()[0]
    subjects_line = ", ".join(streak_subjects) if streak_subjects else "no subjects yet this week"
    body = (
        _heading(f"Your week at Bversity, {first}") +
        _para(f"Here's a quick look at your progress this week:") +
        f'<div style="display:flex;gap:16px;margin:0 0 20px">'
        f'<div style="flex:1;background:#F0FBF9;border-radius:10px;padding:16px;text-align:center">'
        f'<p style="margin:0;font-size:28px;font-weight:900;color:#07142A">{covered}</p>'
        f'<p style="margin:4px 0 0;font-size:12px;color:#3D5166">Concepts Covered</p></div>'
        f'<div style="flex:1;background:#F0FBF9;border-radius:10px;padding:16px;text-align:center">'
        f'<p style="margin:0;font-size:28px;font-weight:900;color:#07142A">{mastered}</p>'
        f'<p style="margin:4px 0 0;font-size:12px;color:#3D5166">Concepts Mastered</p></div>'
        f'</div>' +
        _para(f"Active in: <strong>{subjects_line}</strong>") +
        _btn("Continue This Week →", "https://bversity.io") +
        _small("You're building real biotech knowledge. Every concept matters.")
    )
    return await _send_email(to_email, f"Your Bversity progress this week, {first}", _email_wrap(body))

async def send_verification_email(to_email: str, name: str, code: str) -> bool:
    api_key = os.environ.get("RESEND_API_KEY", "")
    from_email = os.environ.get("RESEND_FROM_EMAIL", "noreply@bversity.io")
    if not api_key:
        print(f"\n{'='*50}\n[DEV] Verification code for {to_email}: {code}\n{'='*50}\n")
        return True
    try:
        import httpx
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px">
          <p style="font-size:20px;font-weight:900;color:#07142A;margin:0 0 4px">Bversity</p>
          <p style="font-size:12px;color:#7A8FA6;margin:0 0 32px">School of Bioscience</p>
          <h2 style="font-size:22px;font-weight:800;color:#07142A;margin:0 0 8px">Hi {name},</h2>
          <p style="color:#3D5166;font-size:15px;margin:0 0 28px">Your verification code for Bversity:</p>
          <div style="background:#FFF8EC;border:1px solid rgba(255,167,10,0.25);border-radius:12px;padding:32px;text-align:center;margin-bottom:24px">
            <div style="font-size:44px;font-weight:900;letter-spacing:12px;color:#07142A;font-family:monospace">{code}</div>
            <p style="color:#7A8FA6;font-size:13px;margin:12px 0 0">Expires in 15 minutes &middot; Single use</p>
          </div>
          <p style="color:#7A8FA6;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>"""
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"from": f"Bversity <{from_email}>", "to": [to_email],
                      "subject": f"Your Bversity code: {code}", "html": html},
                timeout=10.0,
            )
        if res.status_code != 200:
            print(f"Resend error {res.status_code}: {res.text}")
        return res.status_code == 200
    except Exception as e:
        print(f"Email error: {e}")
        return False

# ── Admin auth ────────────────────────────────────────────────────────────────

def require_admin(x_admin_key: str = Header(None)):
    expected = os.environ.get("ADMIN_KEY", "bversity-admin-2025")
    if x_admin_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Bversity AI University backend"}

@app.get("/subjects")
def get_subjects():
    return [{k: v for k, v in s.items() if k != "system_prompt"} for s in SUBJECTS.values()]

@app.post("/register")
async def register(req: RegisterRequest, background_tasks: BackgroundTasks):
    if not req.name.strip() or not req.email.strip():
        raise HTTPException(status_code=400, detail="Name and email are required")
    conn = get_db()
    existing = conn.execute("SELECT * FROM students WHERE email = ?", (req.email.lower().strip(),)).fetchone()
    if existing:
        conn.close()
        return {"student_id": existing["id"], "name": existing["name"], "returning": True}
    student_id = str(uuid.uuid4())
    conn.execute("INSERT INTO students (id, name, email, created_at) VALUES (?, ?, ?, ?)",
                 (student_id, req.name.strip(), req.email.lower().strip(), datetime.utcnow().isoformat()))
    conn.commit(); conn.close()
    background_tasks.add_task(send_welcome_email, req.email.lower().strip(), req.name.strip())
    return {"student_id": student_id, "name": req.name.strip(), "returning": False}

@app.post("/request-code")
async def request_code(req: RequestCodeRequest):
    email = req.email.lower().strip()
    name  = req.name.strip()
    if not email or not name:
        raise HTTPException(status_code=400, detail="Name and email are required")
    conn = get_db()
    approved = conn.execute("SELECT email FROM approved_emails WHERE email = ?", (email,)).fetchone()
    if not approved:
        conn.close()
        raise HTTPException(status_code=403, detail="This email doesn't have access yet. Contact sai@bversity.io to request access.")
    conn.execute("UPDATE verification_codes SET used = 1 WHERE email = ? AND used = 0", (email,))
    code       = str(random.randint(100000, 999999))
    expires_at = (datetime.utcnow() + timedelta(minutes=15)).isoformat()
    conn.execute("INSERT INTO verification_codes (email, code, expires_at, used) VALUES (?, ?, ?, 0)",
                 (email, code, expires_at))
    conn.commit()
    conn.close()
    sent = await send_verification_email(email, name, code)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email. Please try again.")
    return {"message": "Verification code sent", "email": email}

@app.post("/verify-code")
def verify_code(req: VerifyCodeRequest):
    email = req.email.lower().strip()
    code  = req.code.strip()
    name  = req.name.strip()
    conn  = get_db()
    now   = datetime.utcnow().isoformat()
    row = conn.execute(
        "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1",
        (email, code, now)
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired code. Please request a new one.")
    conn.execute("UPDATE verification_codes SET used = 1 WHERE id = ?", (row["id"],))
    existing = conn.execute("SELECT * FROM students WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.commit(); conn.close()
        return {"student_id": existing["id"], "name": existing["name"], "returning": True}
    student_id = str(uuid.uuid4())
    conn.execute("INSERT INTO students (id, name, email, created_at) VALUES (?, ?, ?, ?)",
                 (student_id, name, email, datetime.utcnow().isoformat()))
    conn.commit(); conn.close()
    return {"student_id": student_id, "name": name, "returning": False}

@app.get("/admin/approved-emails")
def admin_list_approved(x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    rows = conn.execute("SELECT email, added_at FROM approved_emails ORDER BY added_at DESC").fetchall()
    conn.close()
    return [{"email": r["email"], "added_at": r["added_at"]} for r in rows]

@app.post("/admin/approved-emails")
def admin_add_email(req: AddEmailRequest, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    email = req.email.lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    conn = get_db()
    try:
        conn.execute("INSERT INTO approved_emails (email, added_at) VALUES (?, ?)",
                     (email, datetime.utcnow().isoformat()))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=409, detail="Email already approved")
    conn.close()
    return {"email": email, "added_at": datetime.utcnow().isoformat()}

@app.delete("/admin/approved-emails/{email}")
def admin_remove_email(email: str, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    conn.execute("DELETE FROM approved_emails WHERE email = ?", (email.lower().strip(),))
    conn.commit(); conn.close()
    return {"message": "Email removed"}

@app.get("/admin/overview")
def admin_overview(x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    total_students    = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    active_week       = conn.execute("SELECT COUNT(DISTINCT student_id) FROM messages WHERE created_at > ?", (week_ago,)).fetchone()[0]
    total_concepts    = conn.execute("SELECT COUNT(*) FROM concept_progress").fetchone()[0]
    pending_capstones = conn.execute("SELECT COUNT(*) FROM capstone_submissions WHERE score IS NULL").fetchone()[0]
    total_messages    = conn.execute("SELECT COUNT(*) FROM messages WHERE role = 'user'").fetchone()[0]
    conn.close()
    return {
        "total_students":      total_students,
        "active_week":         active_week,
        "total_concepts":      total_concepts,
        "pending_capstones":   pending_capstones,
        "total_messages":      total_messages,
    }

@app.get("/admin/students")
def admin_students(x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    rows = conn.execute("""
        SELECT
            s.id, s.name, s.email, s.created_at,
            sp.career_id, sp.college, sp.year_of_study,
            sp.city, sp.state, sp.onboarded_at,
            sp.avatar_color,
            (SELECT COUNT(*) FROM messages m WHERE m.student_id = s.id AND m.role = 'user') AS message_count,
            (SELECT COUNT(DISTINCT subject_id) FROM concept_progress cp WHERE cp.student_id = s.id) AS subjects_touched,
            (SELECT COUNT(*) FROM concept_progress cp WHERE cp.student_id = s.id) AS concepts_covered,
            (SELECT COUNT(*) FROM concept_progress cp WHERE cp.student_id = s.id AND cp.mastered_at IS NOT NULL) AS concepts_mastered,
            (SELECT MAX(created_at) FROM messages m WHERE m.student_id = s.id) AS last_active
        FROM students s
        LEFT JOIN student_profile sp ON sp.student_id = s.id
        ORDER BY last_active DESC
    """).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        career = CAREERS.get(d["career_id"]) if d.get("career_id") else None
        d["career_title"] = career["title"] if career else None
        d["career_icon"]  = career["icon"]  if career else None
        d["career_cluster"] = career["cluster"] if career else None
        result.append(d)
    return result

@app.get("/student/{student_id}")
def get_student(student_id: str):
    conn = get_db()
    student = conn.execute("SELECT id, name, email FROM students WHERE id = ?", (student_id,)).fetchone()
    conn.close()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return dict(student)

@app.get("/history/{student_id}/{subject_id}")
def get_history(student_id: str, subject_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT role, content FROM messages WHERE student_id = ? AND subject_id = ? ORDER BY id",
        (student_id, subject_id),
    ).fetchall()
    conn.close()
    return [{"role": r["role"], "content": r["content"]} for r in rows]

@app.get("/progress/{student_id}")
def get_all_progress(student_id: str):
    conn = get_db()
    profile_row = conn.execute("SELECT career_id FROM student_profile WHERE student_id = ?", (student_id,)).fetchone()
    career = CAREERS.get(profile_row["career_id"]) if profile_row and profile_row["career_id"] else None
    result = {}
    for subject_id in SUBJECTS:
        rows = conn.execute(
            "SELECT concept_id, mastered_at FROM concept_progress WHERE student_id = ? AND subject_id = ?",
            (student_id, subject_id),
        ).fetchall()
        curr     = effective_curriculum(subject_id, career)
        curr_ids = {c["id"] for c in curr}
        result[subject_id] = {
            "covered_count":  sum(1 for r in rows if r["concept_id"] in curr_ids),
            "mastered_count": sum(1 for r in rows if r["concept_id"] in curr_ids and r["mastered_at"]),
            "total":          len(curr),
        }
    conn.close()
    return result

@app.get("/progress/{student_id}/{subject_id}")
def get_subject_progress(student_id: str, subject_id: str):
    if subject_id not in SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")
    conn = get_db()
    profile_row = conn.execute("SELECT career_id FROM student_profile WHERE student_id = ?", (student_id,)).fetchone()
    career = CAREERS.get(profile_row["career_id"]) if profile_row and profile_row["career_id"] else None
    rows = conn.execute(
        "SELECT concept_id, mastered_at FROM concept_progress WHERE student_id = ? AND subject_id = ?",
        (student_id, subject_id),
    ).fetchall()
    progress_map = {r["concept_id"]: r["mastered_at"] for r in rows}
    conn.close()
    curr     = effective_curriculum(subject_id, career)
    curr_ids = {c["id"] for c in curr}
    return {
        "covered_count":  sum(1 for cid in progress_map if cid in curr_ids),
        "mastered_count": sum(1 for cid, mat in progress_map.items() if cid in curr_ids and mat),
        "total":          len(curr),
        "concepts": [{"id": c["id"], "name": c["name"],
                      "covered": c["id"] in progress_map,
                      "mastered": bool(progress_map.get(c["id"]))} for c in curr],
    }

@app.get("/dashboard/{student_id}")
def get_dashboard(student_id: str):
    conn = get_db()
    student = conn.execute("SELECT id, name, email FROM students WHERE id = ?", (student_id,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    profile_row = conn.execute("SELECT career_id FROM student_profile WHERE student_id = ?", (student_id,)).fetchone()
    career = CAREERS.get(profile_row["career_id"]) if profile_row and profile_row["career_id"] else None
    result = {"student": dict(student), "subjects": {}}
    for subject_id, subject in SUBJECTS.items():
        rows = conn.execute(
            "SELECT concept_id, mastered_at FROM concept_progress WHERE student_id = ? AND subject_id = ?",
            (student_id, subject_id),
        ).fetchall()
        pm = {r["concept_id"]: r["mastered_at"] for r in rows}
        mats = conn.execute("SELECT COUNT(*) as n FROM materials WHERE subject_id = ?", (subject_id,)).fetchone()
        cap = conn.execute(
            "SELECT score, feedback, submitted_at, marked_at FROM capstone_submissions WHERE student_id = ? AND subject_id = ?",
            (student_id, subject_id),
        ).fetchone()
        curr     = effective_curriculum(subject_id, career)
        curr_ids = {c["id"] for c in curr}
        eff_covered  = sum(1 for cid in pm if cid in curr_ids)
        eff_mastered = sum(1 for cid, mat in pm.items() if cid in curr_ids and mat)
        threshold = min(len(curr), CAPSTONES[subject_id]["unlock_threshold"]) if subject_id in CAPSTONES else 8
        result["subjects"][subject_id] = {
            "covered_count":     eff_covered,
            "mastered_count":    eff_mastered,
            "total":             len(curr),
            "has_materials":     mats["n"] > 0,
            "capstone_unlocked": eff_covered >= threshold,
            "capstone_submission": dict(cap) if cap else None,
            "concepts": [{"id": c["id"], "name": c["name"],
                          "covered": c["id"] in pm,
                          "mastered": bool(pm.get(c["id"]))} for c in curr],
        }
    conn.close()
    return result

# ── Career / Profile routes ───────────────────────────────────────────────────

@app.get("/careers")
def get_careers():
    return list(CAREERS.values())

@app.get("/profile/{student_id}")
def get_profile(student_id: str):
    conn = get_db()
    row = conn.execute(
        "SELECT career_id, college, year_of_study, aspirations, motivation, tutor_note, onboarded_at, avatar_color, linkedin_url, github_url, city, state, show_on_map FROM student_profile WHERE student_id = ?",
        (student_id,)
    ).fetchone()
    conn.close()
    if not row:
        return {"career_id": None, "career": None, "onboarded": False}
    return {
        "career_id": row["career_id"],
        "career": CAREERS.get(row["career_id"]) if row["career_id"] else None,
        "onboarded": bool(row["onboarded_at"]),
        "college": row["college"],
        "year_of_study": row["year_of_study"],
        "aspirations": row["aspirations"],
        "motivation": row["motivation"],
        "tutor_note": row["tutor_note"],
        "avatar_color": row["avatar_color"],
        "linkedin_url": row["linkedin_url"],
        "github_url": row["github_url"],
        "city": row["city"],
        "state": row["state"],
        "show_on_map": row["show_on_map"] if row["show_on_map"] is not None else 1,
    }

class OnboardingRequest(BaseModel):
    college: str
    year_of_study: str
    aspirations: str
    motivation: str
    tutor_note: str = ""
    career_id: str = ""
    city: str = ""
    state: str = ""
    show_on_map: int = 1

@app.post("/profile/{student_id}/onboarding")
def save_onboarding(student_id: str, req: OnboardingRequest):
    conn = get_db()
    career_id = req.career_id.strip() or None
    now = datetime.utcnow().isoformat()
    conn.execute(
        """INSERT INTO student_profile
           (student_id, career_id, career_goal_raw, updated_at, college, year_of_study,
            aspirations, motivation, tutor_note, city, state, show_on_map, onboarded_at)
           VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(student_id) DO UPDATE SET
             career_id     = excluded.career_id,
             college       = excluded.college,
             year_of_study = excluded.year_of_study,
             aspirations   = excluded.aspirations,
             motivation    = excluded.motivation,
             tutor_note    = excluded.tutor_note,
             city          = excluded.city,
             state         = excluded.state,
             show_on_map   = excluded.show_on_map,
             onboarded_at  = excluded.onboarded_at,
             updated_at    = excluded.updated_at""",
        (student_id, career_id, now,
         req.college, req.year_of_study, req.aspirations, req.motivation, req.tutor_note,
         req.city.strip() or None, req.state.strip() or None, req.show_on_map, now)
    )
    if career_id and career_id in CAREERS:
        has_plan = conn.execute("SELECT 1 FROM study_plan WHERE student_id = ? LIMIT 1", (student_id,)).fetchone()
        if not has_plan:
            _generate_study_plan(student_id, career_id, conn)
    conn.commit(); conn.close()
    return {"status": "ok"}

class ProfileUpdateRequest(BaseModel):
    college: str = ""
    year_of_study: str = ""
    aspirations: str = ""
    motivation: str = ""
    tutor_note: str = ""
    avatar_color: str = ""
    linkedin_url: str = ""
    github_url: str = ""
    city: str = ""
    state: str = ""
    show_on_map: int = 1

@app.put("/profile/{student_id}")
def update_profile(student_id: str, req: ProfileUpdateRequest):
    conn = get_db()
    conn.execute(
        """INSERT INTO student_profile (student_id, career_id, career_goal_raw, updated_at, college, year_of_study, aspirations, motivation, tutor_note, avatar_color, linkedin_url, github_url, city, state, show_on_map, onboarded_at)
           VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(student_id) DO UPDATE SET
             college = excluded.college,
             year_of_study = excluded.year_of_study,
             aspirations = excluded.aspirations,
             motivation = excluded.motivation,
             tutor_note = excluded.tutor_note,
             avatar_color = excluded.avatar_color,
             linkedin_url = excluded.linkedin_url,
             github_url = excluded.github_url,
             city = excluded.city,
             state = excluded.state,
             show_on_map = excluded.show_on_map,
             updated_at = excluded.updated_at""",
        (student_id, datetime.utcnow().isoformat(),
         req.college, req.year_of_study, req.aspirations, req.motivation,
         req.tutor_note, req.avatar_color, req.linkedin_url, req.github_url,
         req.city or None, req.state or None, req.show_on_map)
    )
    conn.commit(); conn.close()
    return {"status": "ok"}

@app.get("/community/map")
def get_community_map():
    conn = get_db()
    rows = conn.execute(
        """SELECT s.id, s.name, sp.city, sp.state, sp.career_id, sp.linkedin_url, sp.github_url, sp.avatar_color,
                  COALESCE(sp.is_placed, 0) AS is_placed
           FROM students s
           JOIN student_profile sp ON sp.student_id = s.id
           WHERE (sp.show_on_map IS NULL OR sp.show_on_map = 1)
             AND (sp.city IS NOT NULL OR sp.state IS NOT NULL)"""
    ).fetchall()
    conn.close()
    result = []
    for row in rows:
        career = CAREERS.get(row["career_id"] or "", {})
        result.append({
            "student_id": row["id"],
            "name": row["name"],
            "city": row["city"],
            "state": row["state"],
            "career_id": row["career_id"],
            "career_title": career.get("title", ""),
            "career_icon": career.get("icon", ""),
            "linkedin_url": row["linkedin_url"],
            "github_url": row["github_url"],
            "avatar_color": row["avatar_color"],
            "is_placed": bool(row["is_placed"]),
        })
    return result

@app.post("/profile/{student_id}")
def set_profile(student_id: str, req: ProfileRequest):
    if req.career_id not in CAREERS:
        raise HTTPException(status_code=400, detail="Invalid career_id")
    conn = get_db()
    existing = conn.execute("SELECT career_id FROM student_profile WHERE student_id = ?", (student_id,)).fetchone()
    conn.execute(
        "INSERT INTO student_profile (student_id, career_id, career_goal_raw, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(student_id) DO UPDATE SET career_id = excluded.career_id, updated_at = excluded.updated_at",
        (student_id, req.career_id, None, datetime.utcnow().isoformat()),
    )
    # Generate study plan on first career selection or career change
    has_plan = conn.execute("SELECT 1 FROM study_plan WHERE student_id = ? LIMIT 1", (student_id,)).fetchone()
    if not has_plan or (existing and existing["career_id"] != req.career_id):
        _generate_study_plan(student_id, req.career_id, conn)
    conn.commit(); conn.close()
    return {"career_id": req.career_id, "career": CAREERS[req.career_id]}

class CareerChangeLogRequest(BaseModel):
    from_career_id: str = ""
    to_career_id: str
    reason: str
    notes: str = ""

@app.post("/career-change/{student_id}")
def log_career_change(student_id: str, req: CareerChangeLogRequest):
    if req.to_career_id not in CAREERS:
        raise HTTPException(status_code=400, detail="Invalid career_id")
    conn = get_db()
    # Log the change
    conn.execute(
        "INSERT INTO career_changes (student_id, from_career_id, to_career_id, reason, notes, changed_at) VALUES (?, ?, ?, ?, ?, ?)",
        (student_id, req.from_career_id or None, req.to_career_id, req.reason, req.notes or None, datetime.utcnow().isoformat()),
    )
    # Apply the career change
    conn.execute(
        "INSERT INTO student_profile (student_id, career_id, career_goal_raw, updated_at) VALUES (?, ?, NULL, ?) ON CONFLICT(student_id) DO UPDATE SET career_id = excluded.career_id, updated_at = excluded.updated_at",
        (student_id, req.to_career_id, datetime.utcnow().isoformat()),
    )
    # Regenerate study plan for new career
    _generate_study_plan(student_id, req.to_career_id, conn)
    conn.commit(); conn.close()
    return {"career_id": req.to_career_id, "career": CAREERS[req.to_career_id]}

@app.get("/career-changes/{student_id}")
def get_career_changes(student_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT from_career_id, to_career_id, reason, notes, changed_at FROM career_changes WHERE student_id = ? ORDER BY changed_at DESC",
        (student_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── Subject status / unlock / pause routes ────────────────────────────────────

class SubjectPauseRequest(BaseModel):
    reason: str
    notes: str = ""

@app.get("/subjects/status/{student_id}")
def get_subject_statuses(student_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT subject_id, status, unlocked_at, paused_at, completed_at, pause_reason FROM subject_status WHERE student_id = ?",
        (student_id,)
    ).fetchall()
    conn.close()
    return {r["subject_id"]: dict(r) for r in rows}

@app.post("/subjects/unlock/{student_id}/{subject_id}")
def unlock_subject(student_id: str, subject_id: str):
    if subject_id not in SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")
    conn = get_db()
    existing = conn.execute(
        "SELECT status FROM subject_status WHERE student_id = ? AND subject_id = ?",
        (student_id, subject_id)
    ).fetchone()
    if existing and existing["status"] == "active":
        conn.close()
        return {"status": "already_active"}
    active_count = conn.execute(
        "SELECT COUNT(*) FROM subject_status WHERE student_id = ? AND status = 'active'",
        (student_id,)
    ).fetchone()[0]
    if active_count >= 2:
        conn.close()
        raise HTTPException(status_code=400, detail="max_active_reached")
    # If already has an active subject, require 12 concepts covered across active subjects
    if active_count >= 1:
        covered_in_active = conn.execute("""
            SELECT COUNT(*) FROM concept_progress cp
            JOIN subject_status ss ON cp.student_id = ss.student_id AND cp.subject_id = ss.subject_id
            WHERE cp.student_id = ? AND ss.status = 'active'
        """, (student_id,)).fetchone()[0]
        if covered_in_active < 12:
            conn.close()
            raise HTTPException(status_code=400, detail="milestone_not_reached")
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO subject_status (student_id, subject_id, status, unlocked_at)
        VALUES (?, ?, 'active', ?)
        ON CONFLICT(student_id, subject_id) DO UPDATE SET status = 'active', unlocked_at = excluded.unlocked_at
    """, (student_id, subject_id, now))
    conn.commit()
    conn.close()
    return {"status": "active", "unlocked_at": now}

@app.post("/subjects/pause/{student_id}/{subject_id}")
def pause_subject(student_id: str, subject_id: str, req: SubjectPauseRequest):
    conn = get_db()
    existing = conn.execute(
        "SELECT status FROM subject_status WHERE student_id = ? AND subject_id = ?",
        (student_id, subject_id)
    ).fetchone()
    if not existing or existing["status"] != "active":
        conn.close()
        raise HTTPException(status_code=400, detail="Subject is not active")
    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE subject_status SET status = 'paused', paused_at = ?, pause_reason = ?, pause_notes = ? WHERE student_id = ? AND subject_id = ?",
        (now, req.reason, req.notes or None, student_id, subject_id)
    )
    conn.commit()
    conn.close()
    return {"status": "paused"}

@app.post("/subjects/resume/{student_id}/{subject_id}")
def resume_subject(student_id: str, subject_id: str):
    conn = get_db()
    active_count = conn.execute(
        "SELECT COUNT(*) FROM subject_status WHERE student_id = ? AND status = 'active'",
        (student_id,)
    ).fetchone()[0]
    if active_count >= 2:
        conn.close()
        raise HTTPException(status_code=400, detail="max_active_reached")
    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE subject_status SET status = 'active', unlocked_at = ?, paused_at = NULL WHERE student_id = ? AND subject_id = ?",
        (now, student_id, subject_id)
    )
    conn.commit()
    conn.close()
    return {"status": "active"}

# ── Concept video routes ──────────────────────────────────────────────────────

class ConceptVideoRequest(BaseModel):
    drive_url: str
    title: str = ""

@app.get("/curriculum/{subject_id}")
def get_curriculum(subject_id: str):
    if subject_id not in CURRICULUM:
        raise HTTPException(status_code=404, detail="Unknown subject")
    return [{"id": c["id"], "name": c["name"]} for c in CURRICULUM[subject_id]]

@app.get("/concept-videos")
def get_all_concept_videos():
    conn = get_db()
    rows = conn.execute("SELECT subject_id, concept_id, drive_url, title FROM concept_videos").fetchall()
    conn.close()
    result = {}
    for row in rows:
        result.setdefault(row["subject_id"], {})[row["concept_id"]] = {
            "drive_url": row["drive_url"], "title": row["title"]
        }
    return result

@app.get("/concept-videos/{subject_id}")
def get_concept_videos(subject_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT concept_id, drive_url, title FROM concept_videos WHERE subject_id = ?",
        (subject_id,)
    ).fetchall()
    conn.close()
    return {row["concept_id"]: {"drive_url": row["drive_url"], "title": row["title"]} for row in rows}

@app.put("/admin/concept-videos/{subject_id}/{concept_id}")
def upsert_concept_video(subject_id: str, concept_id: str, req: ConceptVideoRequest, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    if subject_id not in CURRICULUM:
        raise HTTPException(status_code=400, detail="Unknown subject")
    if not any(c["id"] == concept_id for c in CURRICULUM[subject_id]):
        raise HTTPException(status_code=400, detail="Unknown concept")
    conn = get_db()
    conn.execute(
        """INSERT INTO concept_videos (subject_id, concept_id, drive_url, title, added_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(subject_id, concept_id) DO UPDATE SET
             drive_url = excluded.drive_url, title = excluded.title, added_at = excluded.added_at""",
        (subject_id, concept_id, req.drive_url, req.title or None, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.delete("/admin/concept-videos/{subject_id}/{concept_id}")
def delete_concept_video(subject_id: str, concept_id: str, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    conn.execute("DELETE FROM concept_videos WHERE subject_id = ? AND concept_id = ?", (subject_id, concept_id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

# ── Module quiz routes ────────────────────────────────────────────────────────

@app.get("/quiz/status/{student_id}/{subject_id}")
def get_quiz_status(student_id: str, subject_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT module_id, passed, completed_at FROM module_quizzes WHERE student_id=? AND subject_id=?",
        (student_id, subject_id)
    ).fetchall()
    conn.close()
    return {r["module_id"]: {"passed": bool(r["passed"]), "completed_at": r["completed_at"]} for r in rows}

@app.post("/quiz/complete/{student_id}/{subject_id}/{module_id}")
def complete_quiz(student_id: str, subject_id: str, module_id: str):
    conn = get_db()
    conn.execute(
        """INSERT INTO module_quizzes (student_id, subject_id, module_id, passed, completed_at)
           VALUES (?,?,?,1,?)
           ON CONFLICT(student_id,subject_id,module_id) DO UPDATE SET passed=1, completed_at=excluded.completed_at""",
        (student_id, subject_id, module_id, datetime.utcnow().isoformat())
    )
    conn.commit(); conn.close()
    return {"status": "ok"}

QUIZ_COOLDOWN_SECONDS = 3600  # 1 hour after a failed attempt

@app.get("/quiz/questions/{subject_id}/{module_id}")
async def get_quiz_questions(subject_id: str, module_id: str, student_id: str = ""):
    if subject_id not in CURRICULUM:
        raise HTTPException(status_code=404, detail="Unknown subject")
    conn = get_db()

    # Cooldown check: block retry if student failed within the last hour
    if student_id:
        last = conn.execute(
            "SELECT passed, completed_at FROM module_quizzes WHERE student_id=? AND subject_id=? AND module_id=? ORDER BY completed_at DESC LIMIT 1",
            (student_id, subject_id, module_id)
        ).fetchone()
        if last and not last["passed"]:
            elapsed = (datetime.utcnow() - datetime.fromisoformat(last["completed_at"])).total_seconds()
            if elapsed < QUIZ_COOLDOWN_SECONDS:
                wait_mins = int((QUIZ_COOLDOWN_SECONDS - elapsed) / 60) + 1
                conn.close()
                raise HTTPException(status_code=429, detail=f"cooldown:{wait_mins}")

    existing = conn.execute(
        "SELECT questions_json FROM module_quiz_questions WHERE subject_id = ? AND module_id = ?",
        (subject_id, module_id)
    ).fetchone()
    if existing:
        conn.close()
        return {"questions": json.loads(existing["questions_json"])}

    subs = [c for c in CURRICULUM[subject_id] if re.match(rf'^{re.escape(module_id)}_[abc]$', c["id"])]
    if not subs:
        conn.close()
        raise HTTPException(status_code=404, detail="Module not found")

    module_name = subs[0]["name"].split(":")[0].split("—")[0].strip()
    concept_lines = "\n".join(f"- {c['name']}" for c in subs)
    subject_name  = SUBJECTS[subject_id]["name"]

    prompt = f"""Generate exactly 4 multiple-choice questions to test deep understanding of the module "{module_name}" from the subject "{subject_name}" for biotech/life sciences graduate students.

Sub-concepts in this module:
{concept_lines}

Return ONLY a JSON array (no markdown, no explanation outside the JSON) with this exact structure:
[
  {{
    "question": "Question text here?",
    "options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
    "correct_index": 0,
    "explanation": "One concise sentence explaining why this answer is correct."
  }}
]

Requirements:
- Cover a different sub-concept with each question
- Test application and understanding, not just recall
- Make distractors plausible but clearly wrong to an expert
- Graduate-level biotech difficulty"""

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        conn.close()
        raise HTTPException(status_code=503, detail="AI not configured")

    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = message.content[0].text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)

    try:
        questions = json.loads(raw)
        assert isinstance(questions, list) and len(questions) == 4
        for q in questions:
            assert "question" in q and "options" in q and "correct_index" in q and "explanation" in q
            assert len(q["options"]) == 4
            assert 0 <= int(q["correct_index"]) <= 3
            q["correct_index"] = int(q["correct_index"])
    except Exception as e:
        conn.close()
        print(f"Quiz question parse error: {e}\nRaw: {raw[:300]}")
        raise HTTPException(status_code=500, detail="Failed to generate valid questions — please retry")

    conn.execute(
        "INSERT OR REPLACE INTO module_quiz_questions (subject_id, module_id, questions_json, generated_at) VALUES (?,?,?,?)",
        (subject_id, module_id, json.dumps(questions), datetime.utcnow().isoformat())
    )
    conn.commit(); conn.close()
    return {"questions": questions}

class QuizSubmitRequest(BaseModel):
    answers: list

@app.post("/quiz/submit/{student_id}/{subject_id}/{module_id}")
def submit_quiz(student_id: str, subject_id: str, module_id: str, req: QuizSubmitRequest):
    conn = get_db()
    existing = conn.execute(
        "SELECT questions_json FROM module_quiz_questions WHERE subject_id = ? AND module_id = ?",
        (subject_id, module_id)
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Questions not found — generate them first")

    questions = json.loads(existing["questions_json"])
    answers = [int(a) for a in req.answers]
    correct = sum(1 for i, q in enumerate(questions) if i < len(answers) and answers[i] == q["correct_index"])
    passed  = correct >= 3

    conn.execute(
        """INSERT INTO module_quizzes (student_id, subject_id, module_id, passed, completed_at)
           VALUES (?,?,?,?,?)
           ON CONFLICT(student_id,subject_id,module_id)
           DO UPDATE SET passed=excluded.passed, completed_at=excluded.completed_at""",
        (student_id, subject_id, module_id, 1 if passed else 0, datetime.utcnow().isoformat())
    )
    conn.commit(); conn.close()

    return {
        "correct":  correct,
        "total":    len(questions),
        "passed":   passed,
        "results": [
            {
                "correct_index":  q["correct_index"],
                "explanation":    q["explanation"],
                "student_answer": answers[i] if i < len(answers) else -1,
            }
            for i, q in enumerate(questions)
        ],
    }

@app.delete("/admin/quiz/questions/{subject_id}/{module_id}")
def delete_quiz_questions(subject_id: str, module_id: str, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    conn.execute("DELETE FROM module_quiz_questions WHERE subject_id = ? AND module_id = ?", (subject_id, module_id))
    conn.commit(); conn.close()
    return {"status": "deleted"}

# ── Resource library routes ───────────────────────────────────────────────────

class ResourceRequest(BaseModel):
    url: str
    title: str
    resource_type: str = "article"
    description: str = ""

@app.get("/resources/{subject_id}")
def get_resources(subject_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT concept_id, id, url, title, resource_type, description FROM concept_resources WHERE subject_id=? ORDER BY concept_id, added_at",
        (subject_id,)
    ).fetchall()
    conn.close()
    result = {}
    for r in rows:
        result.setdefault(r["concept_id"], []).append({
            "id": r["id"], "url": r["url"], "title": r["title"],
            "resource_type": r["resource_type"], "description": r["description"]
        })
    return result

@app.post("/admin/resources/{subject_id}/{concept_id}")
def add_resource(subject_id: str, concept_id: str, req: ResourceRequest, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    if subject_id not in CURRICULUM or not any(c["id"] == concept_id for c in CURRICULUM[subject_id]):
        raise HTTPException(status_code=400, detail="Unknown subject or concept")
    conn = get_db()
    rid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO concept_resources (id, subject_id, concept_id, url, title, resource_type, description, added_at) VALUES (?,?,?,?,?,?,?,?)",
        (rid, subject_id, concept_id, req.url, req.title, req.resource_type, req.description or None, datetime.utcnow().isoformat())
    )
    conn.commit(); conn.close()
    return {"id": rid}

@app.delete("/admin/resources/{resource_id}")
def delete_resource(resource_id: str, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    conn.execute("DELETE FROM concept_resources WHERE id=?", (resource_id,))
    conn.commit(); conn.close()
    return {"status": "ok"}

# ── Notes routes ─────────────────────────────────────────────────────────────

class NoteRequest(BaseModel):
    content: str
    subject_id: str = ""

@app.post("/notes/{student_id}")
def save_note(student_id: str, req: NoteRequest):
    conn = get_db()
    note_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO notes (id, student_id, subject_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (note_id, student_id, req.subject_id or None, req.content, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()
    return {"id": note_id}

@app.get("/notes/{student_id}")
def get_notes(student_id: str, subject_id: str = ""):
    conn = get_db()
    if subject_id:
        rows = conn.execute(
            "SELECT id, subject_id, content, created_at FROM notes WHERE student_id = ? AND subject_id = ? ORDER BY created_at DESC",
            (student_id, subject_id),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, subject_id, content, created_at FROM notes WHERE student_id = ? ORDER BY created_at DESC",
            (student_id,),
        ).fetchall()
    conn.close()
    return [{"id": r["id"], "subject_id": r["subject_id"], "content": r["content"], "created_at": r["created_at"]} for r in rows]

@app.delete("/notes/{student_id}/{note_id}")
def delete_note(student_id: str, note_id: str):
    conn = get_db()
    conn.execute("DELETE FROM notes WHERE id = ? AND student_id = ?", (note_id, student_id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

# ── Study plan routes ─────────────────────────────────────────────────────────

def _generate_study_plan(student_id: str, career_id: str, conn):
    conn.execute("DELETE FROM study_plan WHERE student_id = ?", (student_id,))
    career = CAREERS.get(career_id, {})
    relevant = career.get("relevant_subjects", [])
    ordered = relevant + [s for s in CURRICULUM if s not in relevant]
    slots = [(sid, c["id"]) for sid in ordered for c in CURRICULUM[sid]]
    start = datetime.utcnow().date()
    for i, (sid, cid) in enumerate(slots[:60]):
        day = (i // 2) + 1
        target = (start + timedelta(days=day - 1)).isoformat()
        conn.execute(
            "INSERT OR IGNORE INTO study_plan (student_id, day_number, subject_id, concept_id, target_date) VALUES (?,?,?,?,?)",
            (student_id, day, sid, cid, target),
        )

@app.post("/study-plan/generate/{student_id}")
def generate_study_plan(student_id: str, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    profile = conn.execute("SELECT career_id FROM student_profile WHERE student_id = ?", (student_id,)).fetchone()
    if not profile or not profile["career_id"]:
        raise HTTPException(status_code=400, detail="Student has no career selected")
    _generate_study_plan(student_id, profile["career_id"], conn)
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/study-plan/{student_id}")
def get_study_plan(student_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT day_number, subject_id, concept_id, target_date FROM study_plan WHERE student_id = ? ORDER BY day_number, concept_id",
        (student_id,),
    ).fetchall()
    covered_rows = conn.execute(
        "SELECT subject_id, concept_id FROM concept_progress WHERE student_id = ?", (student_id,)
    ).fetchall()
    conn.close()
    covered = {(r["subject_id"], r["concept_id"]) for r in covered_rows}
    days = {}
    for r in rows:
        d = r["day_number"]
        if d not in days:
            days[d] = {"day": d, "target_date": r["target_date"], "concepts": []}
        days[d]["concepts"].append({
            "subject_id": r["subject_id"],
            "concept_id": r["concept_id"],
            "covered": (r["subject_id"], r["concept_id"]) in covered,
        })
    plan = list(days.values())
    # compute lag
    today = datetime.utcnow().date().isoformat()
    due = [c for day in plan for c in day["concepts"] if day["target_date"] <= today]
    behind = sum(1 for c in due if not c["covered"])
    return {"plan": plan, "lag_concepts": behind, "lag_days": behind // 2}

# ── Certificate ───────────────────────────────────────────────────────────────

@app.get("/certificate/{student_id}/{subject_id}")
def get_certificate(student_id: str, subject_id: str):
    if subject_id not in CURRICULUM:
        raise HTTPException(status_code=404, detail="Unknown subject")
    conn = get_db()
    student = conn.execute("SELECT name FROM students WHERE id = ?", (student_id,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    covered_ids = {r["concept_id"] for r in conn.execute(
        "SELECT concept_id FROM concept_progress WHERE student_id = ? AND subject_id = ?",
        (student_id, subject_id)
    ).fetchall()}
    all_ids = {c["id"] for c in CURRICULUM[subject_id]}
    if not all_ids.issubset(covered_ids):
        conn.close()
        return {"eligible": False}
    existing = conn.execute(
        "SELECT credential_id, completed_at FROM subject_completions WHERE student_id = ? AND subject_id = ?",
        (student_id, subject_id)
    ).fetchone()
    if existing:
        credential_id = existing["credential_id"]
        completed_at  = existing["completed_at"]
    else:
        credential_id = str(uuid.uuid4()).replace('-', '')[:12].upper()
        completed_at  = datetime.utcnow().isoformat()
        conn.execute(
            "INSERT INTO subject_completions (student_id, subject_id, completed_at, credential_id) VALUES (?,?,?,?)",
            (student_id, subject_id, completed_at, credential_id)
        )
        conn.commit()
    conn.close()
    return {
        "eligible":       True,
        "student_name":   student["name"],
        "subject_name":   SUBJECTS[subject_id]["name"],
        "credential_id":  credential_id,
        "completion_date": completed_at,
    }

# ── Admin Analytics ───────────────────────────────────────────────────────────

@app.get("/admin/analytics/subjects")
def analytics_subjects(x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    result = []
    for subject_id, subject in SUBJECTS.items():
        total_concepts = len(CURRICULUM[subject_id])
        students_count = conn.execute(
            "SELECT COUNT(DISTINCT student_id) FROM concept_progress WHERE subject_id = ?", (subject_id,)
        ).fetchone()[0]
        covered_sum = conn.execute(
            "SELECT COUNT(*) FROM concept_progress WHERE subject_id = ?", (subject_id,)
        ).fetchone()[0]
        completions = conn.execute(
            "SELECT COUNT(*) FROM subject_completions WHERE subject_id = ?", (subject_id,)
        ).fetchone()[0]
        avg_pct = round((covered_sum / (students_count * total_concepts)) * 100) if students_count > 0 else 0
        result.append({
            "subject_id":       subject_id,
            "subject_name":     subject["name"],
            "color":            subject["color"],
            "students_count":   students_count,
            "avg_coverage_pct": avg_pct,
            "total_completions": completions,
            "total_concepts":   total_concepts,
        })
    conn.close()
    result.sort(key=lambda x: x["students_count"], reverse=True)
    return result

@app.get("/admin/analytics/heatmap/{subject_id}")
def analytics_heatmap(subject_id: str, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    if subject_id not in CURRICULUM:
        raise HTTPException(status_code=404, detail="Unknown subject")
    conn = get_db()
    rows = conn.execute(
        "SELECT concept_id, COUNT(*) AS cnt FROM concept_progress WHERE subject_id = ? GROUP BY concept_id",
        (subject_id,)
    ).fetchall()
    conn.close()
    coverage_map = {r["concept_id"]: r["cnt"] for r in rows}
    return [{"concept_id": c["id"], "concept_name": c["name"], "student_count": coverage_map.get(c["id"], 0)}
            for c in CURRICULUM[subject_id]]

@app.get("/admin/analytics/quizzes")
def analytics_quizzes(x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    total_taken  = conn.execute("SELECT COUNT(*) FROM module_quizzes").fetchone()[0]
    total_passed = conn.execute("SELECT COUNT(*) FROM module_quizzes WHERE passed = 1").fetchone()[0]
    by_subject   = conn.execute(
        "SELECT subject_id, COUNT(*) AS taken, SUM(passed) AS passed_count FROM module_quizzes GROUP BY subject_id"
    ).fetchall()
    conn.close()
    return {
        "total_taken":  total_taken,
        "total_passed": total_passed,
        "pass_rate":    round((total_passed / total_taken * 100)) if total_taken > 0 else 0,
        "by_subject":   [{"subject_id": r["subject_id"], "taken": r["taken"], "passed": r["passed_count"]} for r in by_subject],
    }

# ── Batch email endpoints ─────────────────────────────────────────────────────

@app.get("/admin/email-preview")
def email_preview(x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    today = datetime.utcnow().date().isoformat()

    # Find students with lag >= 3 days
    plan_students = conn.execute("""
        SELECT DISTINCT sp.student_id, s.email, s.name
        FROM study_plan sp JOIN students s ON s.id = sp.student_id
    """).fetchall()
    lag_targets = []
    for st in plan_students:
        due = conn.execute("""
            SELECT COUNT(*) FROM study_plan sp
            LEFT JOIN concept_progress cp
              ON cp.student_id = sp.student_id AND cp.subject_id = sp.subject_id AND cp.concept_id = sp.concept_id
            WHERE sp.student_id = ? AND sp.target_date <= ? AND cp.concept_id IS NULL
        """, (st["student_id"], today)).fetchone()[0]
        lag_days = due // 2
        if lag_days >= 3:
            lag_targets.append({"name": st["name"], "email": st["email"], "lag_days": lag_days, "lag_concepts": due})

    # All students with at least 1 message
    week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    digest_students = conn.execute("""
        SELECT s.id, s.email, s.name FROM students s
        WHERE EXISTS (SELECT 1 FROM messages m WHERE m.student_id = s.id AND m.role = 'user')
    """).fetchall()
    conn.close()

    return {
        "lag_nudge_count":   len(lag_targets),
        "lag_nudge_targets": lag_targets,
        "digest_count":      len(digest_students),
    }

@app.post("/admin/send-nudges")
async def send_nudges(background_tasks: BackgroundTasks, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    today = datetime.utcnow().date().isoformat()
    plan_students = conn.execute("""
        SELECT DISTINCT sp.student_id, s.email, s.name
        FROM study_plan sp JOIN students s ON s.id = sp.student_id
    """).fetchall()
    sent = 0
    for st in plan_students:
        due = conn.execute("""
            SELECT COUNT(*) FROM study_plan sp
            LEFT JOIN concept_progress cp
              ON cp.student_id = sp.student_id AND cp.subject_id = sp.subject_id AND cp.concept_id = sp.concept_id
            WHERE sp.student_id = ? AND sp.target_date <= ? AND cp.concept_id IS NULL
        """, (st["student_id"], today)).fetchone()[0]
        lag_days = due // 2
        if lag_days >= 3:
            background_tasks.add_task(send_lag_nudge_email, st["email"], st["name"], lag_days, due)
            sent += 1
    conn.close()
    return {"queued": sent}

@app.post("/admin/send-weekly-digest")
async def send_weekly_digest(background_tasks: BackgroundTasks, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    students = conn.execute("""
        SELECT s.id, s.email, s.name FROM students s
        WHERE EXISTS (SELECT 1 FROM messages m WHERE m.student_id = s.id AND m.role = 'user')
    """).fetchall()
    sent = 0
    week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    for st in students:
        covered = conn.execute(
            "SELECT COUNT(*) FROM concept_progress WHERE student_id = ? AND first_covered_at >= ?",
            (st["id"], week_ago)
        ).fetchone()[0]
        mastered = conn.execute(
            "SELECT COUNT(*) FROM concept_progress WHERE student_id = ? AND mastered_at >= ?",
            (st["id"], week_ago)
        ).fetchone()[0]
        active_subjects = conn.execute("""
            SELECT DISTINCT subject_id FROM messages
            WHERE student_id = ? AND role = 'user' AND created_at >= ?
        """, (st["id"], week_ago)).fetchall()
        subject_names = [SUBJECTS[r["subject_id"]]["name"] for r in active_subjects if r["subject_id"] in SUBJECTS]
        background_tasks.add_task(send_weekly_digest_email, st["email"], st["name"], covered, mastered, subject_names)
        sent += 1
    conn.close()
    return {"queued": sent}

# ── Capstone helpers ─────────────────────────────────────────────────────────

def _extract_text_from_file(filepath: str, filename: str) -> str:
    ext = filename.rsplit('.', 1)[-1].lower()
    text = ""

    def _from_pdf(path):
        try:
            import pypdf
            reader = pypdf.PdfReader(path)
            return "\n".join(p.extract_text() or "" for p in reader.pages[:40])
        except Exception as e:
            print(f"PDF extract error: {e}")
            return ""

    def _from_docx(path):
        try:
            import docx
            doc = docx.Document(path)
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            print(f"DOCX extract error: {e}")
            return ""

    if ext == "pdf":
        text = _from_pdf(filepath)
    elif ext in ("docx", "doc"):
        text = _from_docx(filepath)
    elif ext == "zip":
        import zipfile, tempfile
        try:
            with zipfile.ZipFile(filepath, "r") as z:
                candidates = sorted(
                    [n for n in z.namelist() if n.lower().endswith((".pdf", ".docx")) and not n.startswith("__")],
                    key=lambda n: z.getinfo(n).file_size, reverse=True
                )
                for name in candidates[:2]:
                    with tempfile.NamedTemporaryFile(suffix=name.rsplit(".", 1)[-1], delete=False) as tmp:
                        tmp.write(z.read(name)); tmp_path = tmp.name
                    chunk = _from_pdf(tmp_path) if name.lower().endswith(".pdf") else _from_docx(tmp_path)
                    os.unlink(tmp_path)
                    text += chunk + "\n"
                    if len(text) > 20000:
                        break
        except Exception as e:
            print(f"ZIP extract error: {e}")

    # Truncate to ~8000 words to keep prompt size reasonable
    words = text.split()
    if len(words) > 8000:
        text = " ".join(words[:8000]) + "\n[... content truncated for grading ...]"
    return text.strip()

async def _ai_grade_capstone(submission_id: str, capstone: dict, extracted_text: str):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key or not extracted_text:
        return

    rubric_lines = "\n".join(
        f"- {r['criterion']}: {r['marks']} marks" for r in capstone["rubric"]
    )
    prompt = f"""You are a senior academic assessor at Bversity School of Bioscience. Grade the following student submission for the capstone project titled "{capstone['title']}".

CAPSTONE BRIEF:
{capstone['problem_statement']}

MARKING RUBRIC (total {capstone['total_marks']} marks):
{rubric_lines}

STUDENT SUBMISSION (extracted text):
---
{extracted_text}
---

Grade the submission against each criterion. Be rigorous but fair — this is graduate-level biotech work.

Return ONLY valid JSON (no markdown, no preamble) in this exact structure:
{{
  "criterion_scores": [
    {{"criterion": "criterion name exactly as listed", "marks_awarded": <int>, "max_marks": <int>, "comments": "2-3 sentence specific assessment"}}
  ],
  "total_score": <int 0-{capstone['total_marks']}>,
  "strengths": "2-3 specific strengths of this submission",
  "areas_for_improvement": "2-3 specific areas needing improvement",
  "overall_feedback": "3-4 sentence holistic assessment suitable to share with the student"
}}"""

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
        result = json.loads(raw)
        total = int(result.get("total_score", 0))
        total = max(0, min(capstone["total_marks"], total))
        # Verify criterion scores sum approximately matches total
        crit_sum = sum(int(c.get("marks_awarded", 0)) for c in result.get("criterion_scores", []))
        if abs(crit_sum - total) > 5:
            result["total_score"] = crit_sum
            total = crit_sum

        conn = get_db()
        conn.execute(
            "UPDATE capstone_submissions SET ai_score=?, ai_feedback=?, ai_graded_at=? WHERE id=?",
            (total, json.dumps(result), datetime.utcnow().isoformat(), submission_id)
        )
        conn.commit(); conn.close()
        print(f"[AI Grade] submission {submission_id}: {total}/{capstone['total_marks']}")
    except Exception as e:
        print(f"[AI Grade] error for {submission_id}: {e}")

# ── Capstone routes ───────────────────────────────────────────────────────────

@app.get("/capstone/{subject_id}")
def get_capstone(subject_id: str):
    if subject_id not in CAPSTONES:
        raise HTTPException(status_code=404, detail="No capstone for this subject")
    return CAPSTONES[subject_id]

@app.post("/capstone/{subject_id}/submit")
async def submit_capstone(subject_id: str, background_tasks: BackgroundTasks, student_id: str = Form(...), file: UploadFile = File(...)):
    if subject_id not in CAPSTONES:
        raise HTTPException(status_code=404, detail="No capstone for this subject")
    capstone = CAPSTONES[subject_id]
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in capstone["accepted_formats"]:
        raise HTTPException(status_code=400, detail=f"Accepted formats: {', '.join(capstone['accepted_formats'])}")
    content = await file.read()
    if len(content) > capstone["max_size_mb"] * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (max {capstone['max_size_mb']}MB)")
    conn = get_db()
    student = conn.execute("SELECT id FROM students WHERE id = ?", (student_id,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    profile_row = conn.execute("SELECT career_id FROM student_profile WHERE student_id = ?", (student_id,)).fetchone()
    career = CAREERS.get(profile_row["career_id"]) if profile_row and profile_row["career_id"] else None
    curr     = effective_curriculum(subject_id, career)
    curr_ids = {c["id"] for c in curr}
    threshold = min(len(curr), capstone["unlock_threshold"])
    progress_rows = conn.execute(
        "SELECT concept_id FROM concept_progress WHERE student_id = ? AND subject_id = ?",
        (student_id, subject_id),
    ).fetchall()
    eff_covered = sum(1 for r in progress_rows if r["concept_id"] in curr_ids)
    if eff_covered < threshold:
        conn.close()
        raise HTTPException(status_code=403, detail=f"Cover at least {threshold} concepts to unlock the capstone")
    submission_id = str(uuid.uuid4())
    subject_dir = os.path.join(SUBMISSIONS_DIR, subject_id)
    os.makedirs(subject_dir, exist_ok=True)
    safe_name = re.sub(r'[^\w.\-]', '_', file.filename)
    filepath = os.path.join(subject_dir, f"{submission_id}_{safe_name}")
    with open(filepath, "wb") as f:
        f.write(content)
    conn.execute(
        "INSERT INTO capstone_submissions (id, student_id, subject_id, filename, filepath, submitted_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(student_id, subject_id) DO UPDATE SET id=excluded.id, filename=excluded.filename, filepath=excluded.filepath, submitted_at=excluded.submitted_at, score=NULL, feedback=NULL, marked_at=NULL",
        (submission_id, student_id, subject_id, file.filename, filepath, datetime.utcnow().isoformat()),
    )
    conn.commit(); conn.close()
    # Extract text and trigger AI grading in background
    extracted = _extract_text_from_file(filepath, file.filename)
    background_tasks.add_task(_ai_grade_capstone, submission_id, capstone, extracted)
    return {"submission_id": submission_id, "filename": file.filename, "status": "submitted"}

@app.get("/capstone/{subject_id}/submission/{student_id}")
def get_my_submission(subject_id: str, student_id: str):
    conn = get_db()
    row = conn.execute(
        "SELECT id, filename, submitted_at, score, feedback, marked_at, ai_score, ai_feedback, ai_graded_at FROM capstone_submissions WHERE student_id = ? AND subject_id = ?",
        (student_id, subject_id),
    ).fetchone()
    conn.close()
    if not row:
        return {"submitted": False}
    return {"submitted": True, **dict(row)}

# ── Admin routes ──────────────────────────────────────────────────────────────

@app.get("/admin/submissions")
def admin_list_submissions(x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    rows = conn.execute(
        """SELECT cs.id, cs.student_id, s.name as student_name, cs.subject_id,
           cs.filename, cs.submitted_at, cs.score, cs.feedback, cs.marked_at,
           cs.ai_score, cs.ai_feedback, cs.ai_graded_at
           FROM capstone_submissions cs
           JOIN students s ON s.id = cs.student_id
           ORDER BY cs.submitted_at DESC""",
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/admin/submissions/{submission_id}/ai-grade")
async def admin_ai_grade(submission_id: str, background_tasks: BackgroundTasks, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    row = conn.execute(
        "SELECT filepath, filename, subject_id FROM capstone_submissions WHERE id = ?", (submission_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Submission not found")
    if row["subject_id"] not in CAPSTONES:
        raise HTTPException(status_code=400, detail="No capstone definition for this subject")
    extracted = _extract_text_from_file(row["filepath"], row["filename"])
    background_tasks.add_task(_ai_grade_capstone, submission_id, CAPSTONES[row["subject_id"]], extracted)
    return {"status": "grading_queued"}

@app.get("/admin/submissions/{submission_id}/download")
def admin_download_submission(submission_id: str, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    row = conn.execute("SELECT filepath, filename FROM capstone_submissions WHERE id = ?", (submission_id,)).fetchone()
    conn.close()
    if not row or not os.path.exists(row["filepath"]):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(row["filepath"], filename=row["filename"], media_type="application/octet-stream")

@app.post("/admin/submissions/{submission_id}/mark")
def admin_mark_submission(submission_id: str, req: MarkRequest, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    if not (0 <= req.score <= 100):
        raise HTTPException(status_code=400, detail="Score must be 0–100")
    conn = get_db()
    row = conn.execute("SELECT id FROM capstone_submissions WHERE id = ?", (submission_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Submission not found")
    conn.execute(
        "UPDATE capstone_submissions SET score = ?, feedback = ?, marked_at = ? WHERE id = ?",
        (req.score, req.feedback.strip(), datetime.utcnow().isoformat(), submission_id),
    )
    conn.commit(); conn.close()
    return {"submission_id": submission_id, "score": req.score, "marked": True}

# ── Certificate routes ───────────────────────────────────────────────────────

@app.get("/certificate/{student_id}/{subject_id}")
def get_certificate(student_id: str, subject_id: str):
    if subject_id not in SUBJECTS or subject_id not in CURRICULUM:
        raise HTTPException(status_code=404, detail="Subject not found")
    conn = get_db()
    student = conn.execute("SELECT name FROM students WHERE id = ?", (student_id,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")

    curr = CURRICULUM[subject_id]
    curr_ids = {c["id"] for c in curr}
    rows = conn.execute(
        "SELECT concept_id, first_covered_at FROM concept_progress WHERE student_id = ? AND subject_id = ?",
        (student_id, subject_id),
    ).fetchall()
    conn.close()

    covered_ids = {r["concept_id"] for r in rows if r["concept_id"] in curr_ids}
    covered_count = len(covered_ids)
    total = len(curr)

    if covered_count < total:
        raise HTTPException(
            status_code=403,
            detail=f"Cover all {total} concepts to earn this certificate. Currently {covered_count}/{total}."
        )

    completion_dates = [r["first_covered_at"] for r in rows if r["concept_id"] in curr_ids and r["first_covered_at"]]
    completion_date = max(completion_dates) if completion_dates else datetime.utcnow().isoformat()

    credential_id = hashlib.sha256(f"{student_id}:{subject_id}".encode()).hexdigest()[:12].upper()

    return {
        "student_name": student["name"],
        "subject_id": subject_id,
        "subject_name": SUBJECTS[subject_id]["name"],
        "subject_tutor": SUBJECTS[subject_id]["tutor"],
        "concepts_covered": covered_count,
        "total_concepts": total,
        "completion_date": completion_date[:10],
        "credential_id": credential_id,
        "eligible": True,
    }


# ── Materials routes ──────────────────────────────────────────────────────────

@app.get("/materials/{subject_id}")
def list_materials(subject_id: str):
    if subject_id not in SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")
    conn = get_db()
    rows = conn.execute(
        "SELECT id, filename, chunk_count, uploaded_at FROM materials WHERE subject_id = ? ORDER BY uploaded_at DESC",
        (subject_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/materials/{subject_id}")
async def upload_material(subject_id: str, file: UploadFile = File(...)):
    if subject_id not in SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")
    text = extract_text(content, file.filename)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No content found in file")
    material_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO materials (id, subject_id, filename, chunk_count, uploaded_at) VALUES (?, ?, ?, ?, ?)",
        (material_id, subject_id, file.filename, len(chunks), datetime.utcnow().isoformat()),
    )
    for chunk in chunks:
        conn.execute("INSERT INTO doc_chunks_fts (material_id, subject_id, content) VALUES (?, ?, ?)", (material_id, subject_id, chunk))
    conn.commit(); conn.close()
    return {"id": material_id, "filename": file.filename, "chunks": len(chunks)}

@app.delete("/materials/{material_id}")
def delete_material(material_id: str):
    conn = get_db()
    mat = conn.execute("SELECT * FROM materials WHERE id = ?", (material_id,)).fetchone()
    if not mat:
        conn.close()
        raise HTTPException(status_code=404, detail="Material not found")
    conn.execute("DELETE FROM doc_chunks_fts WHERE material_id = ?", (material_id,))
    conn.execute("DELETE FROM materials WHERE id = ?", (material_id,))
    conn.commit(); conn.close()
    return {"deleted": material_id}

# ── Chat ──────────────────────────────────────────────────────────────────────

@app.post("/chat")
async def chat(req: ChatRequest, background_tasks: BackgroundTasks):
    if req.subject_id not in SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")
    check_rate_limit(req.student_id)
    conn = get_db()
    student = conn.execute("SELECT * FROM students WHERE id = ?", (req.student_id,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")

    subject = SUBJECTS[req.subject_id]
    profile_row = conn.execute("SELECT career_id FROM student_profile WHERE student_id = ?", (req.student_id,)).fetchone()
    career = CAREERS.get(profile_row["career_id"]) if profile_row and profile_row["career_id"] else None

    # Auto-activate subject if no status row (backward compat for existing users)
    status_row = conn.execute(
        "SELECT status FROM subject_status WHERE student_id = ? AND subject_id = ?",
        (req.student_id, req.subject_id)
    ).fetchone()
    if not status_row:
        active_count = conn.execute(
            "SELECT COUNT(*) FROM subject_status WHERE student_id = ? AND status = 'active'",
            (req.student_id,)
        ).fetchone()[0]
        if active_count < 2:
            conn.execute(
                "INSERT OR IGNORE INTO subject_status (student_id, subject_id, status, unlocked_at) VALUES (?, ?, 'active', ?)",
                (req.student_id, req.subject_id, datetime.utcnow().isoformat())
            )
            conn.commit()

    history_rows = conn.execute(
        "SELECT role, content FROM messages WHERE student_id = ? AND subject_id = ? ORDER BY id",
        (req.student_id, req.subject_id),
    ).fetchall()
    is_first_visit = len(history_rows) == 0
    history = [{"role": r["role"], "content": r["content"]} for r in history_rows]
    history.append({"role": "user", "content": req.message})

    progress_rows = conn.execute(
        "SELECT concept_id, mastered_at FROM concept_progress WHERE student_id = ? AND subject_id = ?",
        (req.student_id, req.subject_id),
    ).fetchall()
    covered_ids  = [r["concept_id"] for r in progress_rows]
    mastered_ids = [r["concept_id"] for r in progress_rows if r["mastered_at"]]

    conn.execute(
        "INSERT INTO messages (student_id, subject_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (req.student_id, req.subject_id, "user", req.message, datetime.utcnow().isoformat()),
    )
    conn.commit()

    rag_context = retrieve_context(req.subject_id, req.message, conn)
    using_rag   = bool(rag_context)

    if req.quiz_mode:
        system = build_quiz_prompt(subject, student["name"], covered_ids, mastered_ids, career)
    else:
        system = build_system_prompt(subject, student["name"], is_first_visit, covered_ids, mastered_ids, rag_context, career)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-sonnet-4-6", max_tokens=1024, system=system, messages=history,
            )
            raw_reply = response.content[0].text
        except Exception as e:
            raw_reply = f"Error connecting to AI: {str(e)}"
    else:
        raw_reply = MOCK_RESPONSES.get(req.subject_id, "Mock response.")

    newly_covered = []
    concepts_tag  = re.search(r'<<<CONCEPTS:([^>]*)>>>', raw_reply)
    reply         = re.sub(r'\n?<<<CONCEPTS:[^>]*>>>', '', raw_reply).strip()
    if concepts_tag and api_key:
        valid_ids  = {c["id"] for c in CURRICULUM[req.subject_id]}
        parsed     = [x.strip() for x in concepts_tag.group(1).split(",") if x.strip() in valid_ids]
        newly_covered = [cid for cid in parsed if cid not in covered_ids]
        for cid in newly_covered:
            conn.execute(
                "INSERT OR IGNORE INTO concept_progress (student_id, subject_id, concept_id, first_covered_at) VALUES (?, ?, ?, ?)",
                (req.student_id, req.subject_id, cid, datetime.utcnow().isoformat()),
            )
        conn.commit()

    newly_mastered = []
    mastered_tag   = re.search(r'<<<MASTERED:([^>]*)>>>', reply)
    reply          = re.sub(r'\n?<<<MASTERED:[^>]*>>>', '', reply).strip()
    if mastered_tag and api_key:
        valid_ids      = {c["id"] for c in CURRICULUM[req.subject_id]}
        parsed         = [x.strip() for x in mastered_tag.group(1).split(",") if x.strip() in valid_ids]
        newly_mastered = [cid for cid in parsed if cid not in mastered_ids]
        for cid in newly_mastered:
            conn.execute(
                "UPDATE concept_progress SET mastered_at = ? WHERE student_id = ? AND subject_id = ? AND concept_id = ?",
                (datetime.utcnow().isoformat(), req.student_id, req.subject_id, cid),
            )
        conn.commit()

    career_detected = None
    career_tag = re.search(r'<<<CAREER:([^>]*)>>>', reply)
    reply = re.sub(r'\n?<<<CAREER:[^>]*>>>', '', reply).strip()
    if career_tag and api_key and career is None:
        detected_id = career_tag.group(1).strip()
        if detected_id in CAREERS:
            career_detected = detected_id
            conn.execute(
                "INSERT INTO student_profile (student_id, career_id, career_goal_raw, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(student_id) DO UPDATE SET career_id=excluded.career_id, career_goal_raw=excluded.career_goal_raw, updated_at=excluded.updated_at",
                (req.student_id, detected_id, req.message, datetime.utcnow().isoformat()),
            )
            conn.commit()

    conn.execute(
        "INSERT INTO messages (student_id, subject_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (req.student_id, req.subject_id, "assistant", reply, datetime.utcnow().isoformat()),
    )
    conn.commit()

    # Auto-mark subject completed when all concepts are covered
    subject_completed = None
    if newly_covered:
        all_covered = set(covered_ids) | set(newly_covered)
        curriculum_ids = {c["id"] for c in CURRICULUM[req.subject_id]}
        if curriculum_ids.issubset(all_covered):
            conn.execute(
                "UPDATE subject_status SET status = 'completed', completed_at = ? WHERE student_id = ? AND subject_id = ? AND status = 'active'",
                (datetime.utcnow().isoformat(), req.student_id, req.subject_id),
            )
            existing_cert = conn.execute(
                "SELECT credential_id FROM subject_completions WHERE student_id = ? AND subject_id = ?",
                (req.student_id, req.subject_id)
            ).fetchone()
            if not existing_cert:
                credential_id = str(uuid.uuid4()).replace('-', '')[:12].upper()
                conn.execute(
                    "INSERT INTO subject_completions (student_id, subject_id, completed_at, credential_id) VALUES (?,?,?,?)",
                    (req.student_id, req.subject_id, datetime.utcnow().isoformat(), credential_id)
                )
                subject_completed = {"credential_id": credential_id}
                # Fire completion email (get student email)
                student_row = conn.execute("SELECT email, name FROM students WHERE id = ?", (req.student_id,)).fetchone()
                if student_row:
                    background_tasks.add_task(
                        send_completion_email,
                        student_row["email"], student_row["name"],
                        SUBJECTS[req.subject_id]["name"], credential_id
                    )
            conn.commit()

    # Detect newly completed modules (all 3 sub-concepts a/b/c now covered)
    modules_completed = []
    if newly_covered:
        all_covered_now = set(covered_ids) | set(newly_covered)
        touched_modules = {cid.replace(r'_[abc]$', cid[cid.rfind('_'):]).rsplit('_', 1)[0]
                           for cid in newly_covered if re.search(r'_[abc]$', cid)}
        for mod_id in touched_modules:
            subs = [c for c in CURRICULUM[req.subject_id] if re.match(rf'^{re.escape(mod_id)}_[abc]$', c["id"])]
            if subs and all(c["id"] in all_covered_now for c in subs):
                already_done = conn.execute(
                    "SELECT 1 FROM module_quizzes WHERE student_id=? AND subject_id=? AND module_id=?",
                    (req.student_id, req.subject_id, mod_id)
                ).fetchone()
                if not already_done:
                    modules_completed.append({"id": mod_id, "name": subs[0]["name"].split(":")[0].split("—")[0].strip()})

    conn.close()

    curr     = effective_curriculum(req.subject_id, career)
    curr_ids = {c["id"] for c in curr}
    total    = len(curr)
    eff_prev_covered  = sum(1 for cid in covered_ids  if cid in curr_ids)
    eff_prev_mastered = sum(1 for cid in mastered_ids if cid in curr_ids)
    updated_covered   = eff_prev_covered  + len([cid for cid in newly_covered  if cid in curr_ids])
    updated_mastered  = eff_prev_mastered + len([cid for cid in newly_mastered if cid in curr_ids])
    capstone_now_unlocked = False
    if req.subject_id in CAPSTONES:
        threshold = min(total, CAPSTONES[req.subject_id]["unlock_threshold"])
        capstone_now_unlocked = updated_covered >= threshold and eff_prev_covered < threshold

    return {
        "reply":                   reply,
        "tutor_name":              subject["tutor_name"],
        "mock":                    api_key is None,
        "is_first_visit":          is_first_visit,
        "using_rag":               using_rag,
        "concepts_covered":        updated_covered,
        "concepts_mastered":       updated_mastered,
        "concepts_total":          total,
        "newly_covered":           newly_covered,
        "newly_mastered":          newly_mastered,
        "career_detected":         career_detected,
        "capstone_now_unlocked":   capstone_now_unlocked,
        "modules_completed":       modules_completed,
        "subject_completed":       subject_completed,
    }


# ── Platform Feedback ─────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    student_id: str
    q1: str = ""
    q2: str = ""
    q3: str = ""
    rating: int
    comment: str = ""

@app.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    conn = get_db()
    existing = conn.execute("SELECT id FROM platform_feedback WHERE student_id = ?", (req.student_id,)).fetchone()
    if existing:
        conn.close()
        return {"ok": True}
    conn.execute(
        "INSERT INTO platform_feedback (id, student_id, q1, q2, q3, rating, comment, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), req.student_id, req.q1.strip(), req.q2.strip(), req.q3.strip(), req.rating, req.comment.strip(), datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()
    return {"ok": True}

@app.get("/admin/feedback")
def admin_get_feedback(x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    rows = conn.execute("""
        SELECT f.id, f.student_id, s.name, s.email, f.q1, f.q2, f.q3, f.rating, f.comment, f.submitted_at
        FROM platform_feedback f
        LEFT JOIN students s ON s.id = f.student_id
        ORDER BY f.submitted_at DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Waitlist / Access Requests ────────────────────────────────────────────────

class AccessWaitlistRequest(BaseModel):
    name: str
    email: str
    phone: str = ""
    university: str = ""
    year_of_study: str = ""
    country: str = ""
    reason: str = ""

@app.post("/request-access")
def request_access(req: AccessWaitlistRequest):
    if not req.name.strip() or not req.email.strip():
        raise HTTPException(status_code=400, detail="Name and email are required")
    conn = get_db()
    existing = conn.execute("SELECT id FROM access_requests WHERE email = ?", (req.email.strip().lower(),)).fetchone()
    if existing:
        count = conn.execute("SELECT COUNT(*) as n FROM access_requests").fetchone()["n"]
        conn.close()
        return {"ok": True, "already_submitted": True, "position": count}
    request_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO access_requests (id, name, email, phone, university, year_of_study, country, reason, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
        (request_id, req.name.strip(), req.email.strip().lower(), req.phone.strip(), req.university.strip(), req.year_of_study.strip(), req.country.strip(), req.reason.strip(), datetime.utcnow().isoformat()),
    )
    conn.commit()
    count = conn.execute("SELECT COUNT(*) as n FROM access_requests").fetchone()["n"]
    conn.close()
    return {"ok": True, "already_submitted": False, "position": count}

@app.get("/waitlist-count")
def waitlist_count():
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) as n FROM access_requests").fetchone()["n"]
    conn.close()
    return {"count": count}

@app.get("/admin/access-requests")
def admin_get_access_requests(x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM access_requests ORDER BY submitted_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/admin/approve-request/{request_id}")
def admin_approve_request(request_id: str, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    req = conn.execute("SELECT * FROM access_requests WHERE id = ?", (request_id,)).fetchone()
    if not req:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    existing = conn.execute("SELECT email FROM approved_emails WHERE email = ?", (req["email"],)).fetchone()
    if not existing:
        conn.execute("INSERT INTO approved_emails (email, added_at) VALUES (?, ?)", (req["email"], datetime.utcnow().isoformat()))
    conn.execute("UPDATE access_requests SET status = 'approved' WHERE id = ?", (request_id,))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.post("/admin/reject-request/{request_id}")
def admin_reject_request(request_id: str, x_admin_key: str = Header(None)):
    require_admin(x_admin_key)
    conn = get_db()
    conn.execute("UPDATE access_requests SET status = 'rejected' WHERE id = ?", (request_id,))
    conn.commit()
    conn.close()
    return {"ok": True}
