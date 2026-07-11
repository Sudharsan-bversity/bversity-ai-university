"""
One-off local seed script for the Module 1: Pharmacovigilance pilot.
Run manually against the local dev DB: python3 -m seed_pv_module1
(from the backend/ directory, with the same env vars the local uvicorn server uses).

Creates 6 learning_items rows for subject_id='clinical_research_foundations',
module_id='pv_module1'. Safe to re-run — deletes any existing rows for this
module first.
"""
import json
import os
import sqlite3
import uuid
from datetime import datetime

from app.main import DB_PATH, VIDEOS_DIR, SUBJECTS
from app import video_gen

SUBJECT_ID = "clinical_research_foundations"
MODULE_ID = "pv_module1"


def upsert_item(conn, order_index, item_type, title, duration_min, content):
    item_id = f"{MODULE_ID}_{order_index}"
    now = datetime.utcnow().isoformat()
    conn.execute(
        """INSERT INTO learning_items (id, subject_id, module_id, section_id, order_index, type, title, duration_min, content_json, created_at, updated_at)
           VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             type=excluded.type, title=excluded.title, duration_min=excluded.duration_min,
             content_json=excluded.content_json, updated_at=excluded.updated_at""",
        (item_id, SUBJECT_ID, MODULE_ID, order_index, item_type, title, duration_min, json.dumps(content), now, now),
    )
    conn.commit()
    print(f"  [{order_index}] {item_type:20s} {title}")
    return item_id


def generate_video(concept_id, name, desc):
    """Reuses the existing video_gen pipeline as-is. Writes into concept_videos
    (keyed by subject_id/concept_id) as a side effect; we read the resulting
    local_video_path back out for our own learning_items content_json.
    generate_concept_video only UPDATEs concept_videos (the FastAPI endpoint
    normally pre-inserts a row) -- do that pre-insert ourselves here."""
    now = datetime.utcnow().isoformat()
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """INSERT INTO concept_videos (subject_id, concept_id, drive_url, title, added_at)
           VALUES (?, ?, '', ?, ?)
           ON CONFLICT(subject_id, concept_id) DO NOTHING""",
        (SUBJECT_ID, concept_id, name, now),
    )
    conn.commit()
    conn.close()

    concept = {"id": concept_id, "name": name, "desc": desc}
    video_gen.generate_concept_video(SUBJECT_ID, concept_id, concept, SUBJECTS[SUBJECT_ID], VIDEOS_DIR, DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT gen_status, gen_error, local_video_path, gen_duration_sec FROM concept_videos WHERE subject_id=? AND concept_id=?",
        (SUBJECT_ID, concept_id),
    ).fetchone()
    conn.close()
    if not row or row["gen_status"] != "done":
        raise RuntimeError(f"Video generation failed for {concept_id}: {row['gen_error'] if row else 'no row'}")
    return row["local_video_path"], row["gen_duration_sec"]


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM learning_items WHERE subject_id = ? AND module_id = ?", (SUBJECT_ID, MODULE_ID))
    conn.commit()
    print(f"Seeding {MODULE_ID} for {SUBJECT_ID}...")

    # 1. Video
    print("Generating video (Gemini + Piper + Pillow + ffmpeg)...")
    video_path, video_dur = generate_video(
        "pv_intro",
        "What Is Pharmacovigilance?",
        "Definition of pharmacovigilance, its role across the drug lifecycle, why safety monitoring "
        "continues after regulatory approval, key stakeholders (WHO, national regulators, sponsors, "
        "healthcare providers) in the global drug safety system",
    )
    upsert_item(conn, 1, "video", "What Is Pharmacovigilance?", round(video_dur / 60, 1),
                {"video_url": video_path, "duration_sec": video_dur})

    # 2. Reading
    upsert_item(conn, 2, "reading", "Adverse Event Reporting Frameworks", 6, {
        "body_markdown": """## Adverse Event Reporting Frameworks

When a patient experiences an unwanted effect from a medicine, that event needs to be captured, assessed, and — in many cases — reported to regulators within a strict timeline. Here's the core framework every PV professional works within.

### Key definitions

- **Adverse Event (AE)** — any untoward medical occurrence in a patient given a drug, regardless of whether it's thought to be caused by the drug.
- **Adverse Drug Reaction (ADR)** — an AE where a causal relationship to the drug is at least suspected.
- **Serious Adverse Event (SAE)** — an AE that results in death, is life-threatening, requires hospitalization, causes persistent disability, involves a congenital anomaly, or is otherwise medically significant.

### Reporting timelines (ICH E2A)

The ICH E2A guideline sets the global standard for expedited safety reporting:

- **15 calendar days** — for adverse events that are *serious*, *unexpected* (not listed in the product's existing safety profile), and *at least possibly related* to the drug.
- **7 calendar days** — for fatal or life-threatening unexpected reactions, with a follow-up report due within 8 additional days.
- **Periodic Safety Update Reports (PSURs)** — aggregate safety data submitted on a regular schedule throughout a product's lifecycle, not just triggered by a single case.

### Key systems and frameworks

- **ICH E2A/E2B** — define what counts as reportable and the standardized electronic format (E2B) case reports are submitted in.
- **FAERS** (FDA Adverse Event Reporting System) — the US database where reports are collected and screened for safety signals.
- **EudraVigilance** — the EU equivalent, feeding into a shared European safety database.
- **VigiBase** (WHO / Uppsala Monitoring Centre) — the largest global individual case safety report database, pooling data from over 150 countries.

### Causality assessment

Before a case can be properly categorized, someone has to ask: *did the drug actually cause this?* Causality assessment considers factors like timing (did the event start after the drug was taken?), dechallenge/rechallenge (did it improve when the drug was stopped, recur if restarted?), and alternative explanations (could something else — another condition, another medication — explain it?). This judgment call is central to nearly everything else in the reporting pipeline.
""",
    })

    # 4. Screen-capture (reuses the same slideshow pipeline, framed as a walkthrough)
    print("Generating screen-capture walkthrough (same pipeline as video, framed as steps)...")
    sc_path, sc_dur = generate_video(
        "pv_screen_capture",
        "Logging an AE in a Safety Database",
        "Step-by-step walkthrough of logging an adverse event case in a pharmacovigilance safety database: "
        "opening a new case, entering patient and reporter demographics, writing the event narrative and "
        "assigning a MedDRA code, assessing seriousness and causality, and submitting the case for QC review",
    )
    upsert_item(conn, 3, "screen_capture", "Walkthrough: Logging an AE in a Safety Database", round(sc_dur / 60, 1),
                {"video_url": sc_path, "duration_sec": sc_dur, "framing_note": "walkthrough"})

    # 4. Practice Assignment (graded, 10 questions, covers video + reading + walkthrough)
    upsert_item(conn, 4, "practice_assignment", "Practice Assignment: Pharmacovigilance Fundamentals", 15, {
        "is_graded": True,
        "pass_threshold": 7,
        "questions": [
            {
                "question": "What does \"AE\" stand for in pharmacovigilance?",
                "options": ["Approved Estimate", "Adverse Event", "Analysis Endpoint", "Active Enrollment"],
                "correct_index": 1,
                "explanation": "AE stands for Adverse Event — any untoward medical occurrence in a patient given a medicinal product, whether or not it's considered related to the drug.",
            },
            {
                "question": "Which of these would typically NOT be classified as a Serious Adverse Event (SAE)?",
                "options": [
                    "Hospitalization due to the reaction",
                    "A mild, transient headache that resolves on its own",
                    "A life-threatening reaction",
                    "Persistent or significant disability",
                ],
                "correct_index": 1,
                "explanation": "A mild, self-resolving headache lacks the severity criteria (death, life-threatening, hospitalization, disability, congenital anomaly, or other medically important event) that define \"serious\" in PV.",
            },
            {
                "question": "Why does adverse event monitoring continue after a drug is approved, not just during clinical trials?",
                "options": [
                    "Trials are too small and short to catch every rare or long-term effect",
                    "It's a formality with no real safety value",
                    "Only for marketing purposes",
                    "Regulators require it but don't review the data",
                ],
                "correct_index": 0,
                "explanation": "Clinical trials involve a limited number of patients for a limited time — rare side effects or long-term risks often only surface once a drug reaches a much larger, more diverse real-world population.",
            },
            {
                "question": "What is the key difference between an Adverse Event (AE) and an Adverse Drug Reaction (ADR)?",
                "options": [
                    "There is no difference, the terms are interchangeable",
                    "An ADR requires at least a suspected causal link to the drug; an AE does not",
                    "An AE is always serious, an ADR is always mild",
                    "An ADR only applies to vaccines",
                ],
                "correct_index": 1,
                "explanation": "An AE is any untoward medical occurrence regardless of suspected cause, while an ADR specifically implies a suspected causal relationship to the drug.",
            },
            {
                "question": "Under ICH E2A, what is the expedited reporting timeline for a serious, unexpected, and at least possibly drug-related adverse reaction?",
                "options": ["24 hours", "7 calendar days", "15 calendar days", "30 calendar days"],
                "correct_index": 2,
                "explanation": "15 calendar days is the standard expedited timeline for serious, unexpected, and at least possibly related reactions (7 days applies specifically to fatal/life-threatening unexpected cases).",
            },
            {
                "question": "Which database is the US FDA's system for collecting and screening adverse event reports?",
                "options": ["EudraVigilance", "VigiBase", "FAERS", "MedDRA"],
                "correct_index": 2,
                "explanation": "FAERS (FDA Adverse Event Reporting System) is the US database where reports are collected and screened for safety signals.",
            },
            {
                "question": "What role does \"dechallenge/rechallenge\" play in causality assessment?",
                "options": [
                    "It determines the patient's insurance eligibility",
                    "It checks whether the event improved when the drug was stopped and recurred if restarted",
                    "It decides which regulator receives the report",
                    "It is only relevant for vaccine safety",
                ],
                "correct_index": 1,
                "explanation": "Dechallenge (symptom improves on stopping the drug) and rechallenge (symptom recurs if the drug is restarted) are classic evidence used to judge whether a drug likely caused an event.",
            },
            {
                "question": "In the safety-database walkthrough, what should be assigned to the event narrative to standardize how it's categorized?",
                "options": ["A MedDRA code", "A billing code", "A patient ID barcode", "A marketing tag"],
                "correct_index": 0,
                "explanation": "MedDRA (Medical Dictionary for Regulatory Activities) coding standardizes how adverse event terms are categorized across the safety database.",
            },
            {
                "question": "What is the purpose of a Periodic Safety Update Report (PSUR)?",
                "options": [
                    "A one-time report filed only at drug launch",
                    "Aggregate safety data submitted on a regular schedule throughout a product's lifecycle",
                    "A report filed only when a drug is withdrawn",
                    "An internal marketing performance report",
                ],
                "correct_index": 1,
                "explanation": "PSURs aggregate safety data on a regular schedule across a product's lifecycle, not just in response to individual case reports.",
            },
            {
                "question": "After a case is entered in the safety database, what typically happens before it is finalized?",
                "options": [
                    "It is submitted for QC review",
                    "It is immediately deleted",
                    "It is sent directly to the patient for approval",
                    "Nothing further happens",
                ],
                "correct_index": 0,
                "explanation": "Cases go through a quality-control review step after entry to catch errors before the report is finalized and submitted.",
            },
        ],
    })

    # 5. Dialogue
    upsert_item(conn, 5, "dialogue", "Practice: Intaking a Patient-Reported Side Effect", 8, {
        "persona_name": "Rajesh",
        "persona_situation": (
            "Rajesh is a 52-year-old patient who started a new blood pressure medication five days ago. "
            "He's calling in to report that he's been feeling dizzy and nauseous since yesterday, and he's "
            "worried something is seriously wrong."
        ),
        "persona_tone": "Anxious, a little scattered, seeking reassurance. Gives vague answers at first (e.g. "
                        "\"I just feel off\") and needs gentle, specific follow-up questions to draw out details.",
        "resolution_criteria": (
            "The student has asked about (1) the name of the medication and when it was started, (2) exactly "
            "when the dizziness/nausea began and how severe it is, and (3) has calmly explained what happens "
            "next — that the report will be reviewed, and that Rajesh should contact his doctor promptly if "
            "symptoms worsen or he feels faint."
        ),
        "opening_line": "Hi... um, I hope this is the right number. I started a new medicine a few days ago and I've been feeling really dizzy and sick to my stomach. I don't know if this is normal or if I should be worried.",
    })

    # 6. Graded Assessment
    upsert_item(conn, 6, "graded_assessment", "Module 1 Assessment: Pharmacovigilance", 10, {
        "is_graded": True,
        "pass_threshold": 3,
        "questions": [
            {
                "question": "Which ICH guideline governs definitions and standards for expedited clinical safety reporting?",
                "options": ["ICH E2A", "ICH Q1A", "ICH M4", "ICH E6"],
                "correct_index": 0,
                "explanation": "ICH E2A is the guideline that defines clinical safety data management terms and expedited reporting requirements.",
            },
            {
                "question": "A patient reports a reaction that requires hospitalization. How should this be classified?",
                "options": ["Minor Adverse Event", "Serious Adverse Event (SAE)", "Unrelated Event", "Protocol Deviation"],
                "correct_index": 1,
                "explanation": "Hospitalization is one of the defining criteria for a Serious Adverse Event, regardless of whether the underlying symptom seems mild in isolation.",
            },
            {
                "question": "Which organization maintains VigiBase, the largest global individual case safety report database?",
                "options": ["FDA", "European Medicines Agency", "WHO / Uppsala Monitoring Centre", "CDC"],
                "correct_index": 2,
                "explanation": "VigiBase is maintained by the Uppsala Monitoring Centre on behalf of the WHO Programme for International Drug Monitoring.",
            },
            {
                "question": "What is the primary purpose of causality assessment in an AE report?",
                "options": [
                    "To determine how much the patient should be compensated",
                    "To determine how likely it is that the drug caused the event",
                    "To decide whether to bill the patient's insurance",
                    "To assign the case to a specific regulator",
                ],
                "correct_index": 1,
                "explanation": "Causality assessment evaluates the likelihood that the suspected drug is responsible for the adverse event, using factors like timing, dechallenge/rechallenge, and alternative explanations.",
            },
            {
                "question": "Under ICH E2A, what is the standard expedited reporting timeline for a serious, unexpected, and at least possibly drug-related adverse reaction?",
                "options": ["24 hours", "7 calendar days", "15 calendar days", "30 calendar days"],
                "correct_index": 2,
                "explanation": "15 calendar days is the standard expedited timeline for serious, unexpected, and at least possibly related adverse reactions under ICH E2A (7 days applies specifically to fatal/life-threatening unexpected cases).",
            },
        ],
    })

    conn.close()
    print("\nDone. 6 learning items seeded for clinical_research_foundations / pv_module1.")


if __name__ == "__main__":
    main()
