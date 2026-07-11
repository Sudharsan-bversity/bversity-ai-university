"""
Seed script for the Philippines government platform's Allied Health content:
- the ph_gov tenant record + competency framework (PRC licensure areas, including
  prc_area_4_mental_health -- the specific, documented NLE weak spot from research)
- two Allied Health modules with the full Miller's-Pyramid item sequence (video, reading,
  screen_capture walkthrough, practice_assignment, dialogue, graded_assessment), each
  graded_assessment tagged with a competency_area so results feed the Skill Passport
- two multi-step, Philippines-specific practice-lab scenarios, each gated behind
  completing its module's practice_assignment (required_item_id)
- Software Engineering course/module left as a lighter placeholder (CS 102, unchanged) --
  same pattern applies to it in a later pass, not part of this content push

Run manually against the local dev DB: python3 -m seed_ph_gov_tenant
(from the backend/ directory, with the same env vars the local uvicorn server uses,
including GEMINI_API_KEY/PIPER_VOICE_MODEL for the two video items).
"""
import json
import sqlite3
from datetime import datetime

from app.main import DB_PATH, VIDEOS_DIR
from app import video_gen

TENANT_ID = "ph_gov"


def _connect():
    # Busy timeout well beyond sqlite3's 5s default -- ffmpeg/piper subprocess I/O right
    # before this connects has occasionally left the file transiently locked in testing.
    return sqlite3.connect(DB_PATH, timeout=30)


def generate_video(course_id, subject_meta, concept_id, name, desc):
    """Reuses the existing video_gen pipeline as-is (same one used for Bversity's PV pilot
    and the admin video-gen feature) -- generate_concept_video only UPDATEs concept_videos,
    so pre-insert a row the same way seed_pv_module1.py does."""
    import time
    now = datetime.utcnow().isoformat()
    for attempt in range(12):
        conn = _connect()
        try:
            conn.execute(
                """INSERT INTO concept_videos (subject_id, concept_id, drive_url, title, added_at)
                   VALUES (?, ?, '', ?, ?)
                   ON CONFLICT(subject_id, concept_id) DO NOTHING""",
                (course_id, concept_id, name, now),
            )
            conn.commit()
            break
        except sqlite3.OperationalError as e:
            print(f"  [retry {attempt+1}/12] pre-insert locked ({e}), waiting 5s...")
            if attempt == 11:
                raise
            time.sleep(5)
        finally:
            conn.close()

    concept = {"id": concept_id, "name": name, "desc": desc}
    video_gen.generate_concept_video(course_id, concept_id, concept, subject_meta, VIDEOS_DIR, DB_PATH)
    conn = _connect()
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT gen_status, gen_error, local_video_path, gen_duration_sec FROM concept_videos WHERE subject_id=? AND concept_id=?",
        (course_id, concept_id),
    ).fetchone()
    conn.close()
    if not row or row["gen_status"] != "done":
        raise RuntimeError(f"Video generation failed for {concept_id}: {row['gen_error'] if row else 'no row'}")
    return row["local_video_path"], row["gen_duration_sec"]


def main():
    conn = sqlite3.connect(DB_PATH)
    now = datetime.utcnow().isoformat()

    # ── Tenant ─────────────────────────────────────────────────────────────
    conn.execute(
        """INSERT INTO tenants (id, name, domain, compliance_body, licensure_body, academic_mandates, color, logo_url, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, compliance_body=excluded.compliance_body,
             licensure_body=excluded.licensure_body, academic_mandates=excluded.academic_mandates""",
        (TENANT_ID, "Philippines AI University", None,
         "Commission on Higher Education (CHED)", "Professional Regulation Commission (PRC)",
         "Outcomes-Based Education (OBE) Syllabi logs", "#0038A8", None, now),
    )
    conn.commit()

    # ── Competency framework ─────────────────────────────────────────────
    # prc_area_4_mental_health added: Psychiatric/Mental Health Nursing (NP4) is the
    # specifically documented weak spot in real PNLE performance data (see research).
    competency_areas = [
        ("prc_area_1", "PRC Area 1: Safe & Quality Care", 1),
        ("prc_area_3", "PRC Area 3: Health Education", 2),
        ("prc_area_4_mental_health", "PRC Area 4: Psychiatric & Mental Health Nursing", 3),
        ("prc_area_6", "PRC Area 6: Therapeutics & Pharmacology", 4),
        ("swe_code_quality", "Code Quality & Reasoning", 5),
    ]
    conn.execute("DELETE FROM competency_areas WHERE tenant_id=?", (TENANT_ID,))
    for code, label, order_index in competency_areas:
        conn.execute(
            "INSERT INTO competency_areas (id, tenant_id, code, label, order_index) VALUES (?, ?, ?, ?, ?)",
            (f"{TENANT_ID}_{code}", TENANT_ID, code, label, order_index),
        )
    conn.commit()

    # ── Courses ───────────────────────────────────────────────────────────
    def upsert_course(course_id, name, tutor_name, tutor_role, tutor_org, color, description):
        conn.execute(
            """INSERT INTO courses (id, name, tutor_name, tutor_role, tutor_org, color, description, popular, region, tenant_id, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'ph', ?, 'published', ?, ?)
               ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at""",
            (course_id, name, tutor_name, tutor_role, tutor_org, color, description, TENANT_ID, now, now),
        )
        conn.commit()  # commit immediately -- generate_video() opens separate connections later
        # in main(), which would otherwise collide with this connection's still-open transaction

    allied_health_meta = {"id": "ph_allied_health", "name": "College of Allied Health & Nursing", "color": "#0038A8"}
    upsert_course(
        "ph_allied_health", allied_health_meta["name"],
        "Dr. Corazon Reyes", "Nursing Faculty Lead", "Philippines AI University",
        allied_health_meta["color"], "BSN core curriculum mapped to CHED NCM series and the PRC Nursing Licensure Exam competency areas.",
    )
    upsert_course(
        "ph_software_eng", "College of Information Technology & Engineering",
        "Engr. Miguel Santos", "Computer Science Faculty Lead", "Philippines AI University",
        "#CE1126", "BSCS core curriculum mapped to CHED CMO 25 s. 2015 and global technical interview standards.",
    )

    def upsert_module(module_id, course_id, order_index, title, topics_desc, item_type_sequence):
        conn.execute(
            """INSERT INTO course_modules (id, course_id, order_index, title, topics_desc, target_hours, item_type_sequence, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'frozen', ?, ?)
               ON CONFLICT(id) DO UPDATE SET status='frozen', item_type_sequence=excluded.item_type_sequence, updated_at=excluded.updated_at""",
            (module_id, course_id, order_index, title, topics_desc, 4.0, json.dumps(item_type_sequence), now, now),
        )
        conn.commit()

    FULL_SEQUENCE = ["video", "reading", "screen_capture", "practice_assignment", "dialogue", "graded_assessment"]

    upsert_module(
        "ph_allied_health_ncm100", "ph_allied_health", 1,
        "NCM 100: Fundamentals of Nursing Practice",
        "Core nursing fundamentals: hand hygiene and aseptic technique, vital signs, patient safety principles.",
        FULL_SEQUENCE,
    )
    upsert_module(
        "ph_allied_health_ncm_mh", "ph_allied_health", 2,
        "NCM 101: Psychosocial & Mental Health Nursing",
        "Recognizing acute psychological distress, Psychological First Aid, and de-escalation -- "
        "the documented weakest area (NP4) in national licensure exam performance.",
        FULL_SEQUENCE,
    )
    upsert_module(
        "ph_allied_health_ncm104", "ph_allied_health", 3,
        "NCM 104: Community Health Nursing & Communicable Diseases",
        "TB DOTS (Directly Observed Treatment, Short-course) principles and treatment adherence "
        "counseling -- feeds PRC Area 3 (Health Education), grounded in the Philippines' TB burden, "
        "one of the highest in the world.",
        FULL_SEQUENCE,
    )
    upsert_module(
        "ph_software_eng_cs102", "ph_software_eng", 1,
        "CS 102: Computer Programming 1 & 2",
        "Programming fundamentals: control flow, functions, boundary conditions, and debugging discipline.",
        ["reading", "practice_assignment"],
    )

    def upsert_item(item_id, subject_id, module_id, order_index, item_type, title, duration_min, content):
        conn.execute(
            """INSERT INTO learning_items (id, subject_id, module_id, section_id, order_index, type, title, duration_min, content_json, created_at, updated_at)
               VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET type=excluded.type, title=excluded.title, duration_min=excluded.duration_min,
                 content_json=excluded.content_json, updated_at=excluded.updated_at""",
            (item_id, subject_id, module_id, order_index, item_type, title, duration_min, json.dumps(content), now, now),
        )
        conn.commit()

    conn.execute("DELETE FROM learning_items WHERE subject_id='ph_allied_health' AND module_id IN ('ph_allied_health_ncm100','ph_allied_health_ncm_mh','ph_allied_health_ncm104')")
    conn.commit()

    # ── Module 1: NCM 100 — Fundamentals of Nursing Practice ────────────────
    print("Generating video 1/2: The 5 Moments of Hand Hygiene ...")
    v1_path, v1_dur = generate_video(
        "ph_allied_health", allied_health_meta, "ncm100_hand_hygiene",
        "The 5 Moments of Hand Hygiene",
        "WHO's 5 Moments for Hand Hygiene framework in clinical nursing practice: before touching a "
        "patient, before a clean/aseptic procedure, after body fluid exposure risk, after touching a "
        "patient, and after touching patient surroundings -- and why skipping any moment is a "
        "structural patient-safety infraction regardless of outcome.",
    )
    upsert_item("ph_allied_health_ncm100_1", "ph_allied_health", "ph_allied_health_ncm100", 1, "video",
                "The 5 Moments of Hand Hygiene", round(v1_dur / 60, 1), {"video_url": v1_path, "duration_sec": v1_dur})

    upsert_item("ph_allied_health_ncm100_2", "ph_allied_health", "ph_allied_health_ncm100", 2, "reading",
                "Hand Hygiene & Aseptic Technique", 6, {"body_markdown": (
                    "## Hand Hygiene & Aseptic Technique\n\n"
                    "Hand hygiene is the single most effective way to prevent cross-contamination and "
                    "healthcare-associated infections. Under PRC Area 1 (Safe & Quality Care), every clinical "
                    "procedure -- from a routine vital-signs check to drawing blood -- must be preceded by "
                    "proper hand hygiene using the WHO's 5 Moments framework.\n\n"
                    "### Key points\n- Perform hand hygiene before touching a patient, before a clean/aseptic "
                    "procedure, after body fluid exposure risk, after touching a patient, and after touching "
                    "patient surroundings.\n- Skipping this step is a structural safety infraction, regardless "
                    "of the outcome of the procedure that follows.\n\n"
                    "### Philippine context\nIn Rural Health Units (RHUs) and Barangay Health Stations, "
                    "running water and alcohol-based sanitizer may be limited -- WHO guidance still applies, "
                    "and nurses are trained to prioritize hand hygiene supplies as essential, not optional, "
                    "stock even in resource-constrained GIDA (Geographically Isolated and Disadvantaged Area) settings."
                )})

    print("Generating video 2/2 (walkthrough): Documenting a Patient Safety Event ...")
    v2_path, v2_dur = generate_video(
        "ph_allied_health", allied_health_meta, "ncm100_safety_documentation",
        "Documenting a Patient Safety Event",
        "Step-by-step walkthrough of documenting a patient safety event or near-miss in a hospital "
        "incident reporting system: what to record, how to describe the event objectively without "
        "speculation, and why timely documentation protects both patient safety and the reporting nurse.",
    )
    upsert_item("ph_allied_health_ncm100_3", "ph_allied_health", "ph_allied_health_ncm100", 3, "screen_capture",
                "Walkthrough: Documenting a Patient Safety Event", round(v2_dur / 60, 1),
                {"video_url": v2_path, "duration_sec": v2_dur, "framing_note": "walkthrough"})

    upsert_item("ph_allied_health_ncm100_4", "ph_allied_health", "ph_allied_health_ncm100", 4, "practice_assignment",
                "Fundamentals Check", 8, {
                    "is_graded": True, "pass_threshold": 3,
                    "questions": [
                        {"question": "Which of the 5 Moments requires hand hygiene even if no procedure follows?",
                         "options": ["After touching patient surroundings", "Only before invasive procedures",
                                     "Only after visible soiling", "Never required if wearing gloves"],
                         "correct_index": 0,
                         "explanation": "The WHO 5 Moments framework requires hand hygiene after touching a patient's surroundings, not just before/after direct procedures."},
                        {"question": "A nurse skips hand hygiene before a procedure, but the patient has no adverse outcome. How should this be classified?",
                         "options": ["Not an infraction since there was no harm", "A structural safety infraction regardless of outcome",
                                     "Only a concern if it happens twice", "Acceptable if the nurse was rushed"],
                         "correct_index": 1,
                         "explanation": "Patient safety protocol violations are infractions based on the action taken, not the outcome -- near-misses matter as much as actual harm events."},
                        {"question": "In a resource-constrained Rural Health Unit with limited running water, what should a nurse prioritize?",
                         "options": ["Skip hand hygiene until water is available", "Treat hand hygiene supplies (e.g. alcohol-based sanitizer) as essential stock, not optional",
                                     "Only perform hand hygiene for surgical procedures", "Use hand hygiene only when visibly soiled"],
                         "correct_index": 1,
                         "explanation": "WHO guidance and Philippine RHU practice both treat hand hygiene supplies as essential, non-negotiable stock even in GIDA settings."},
                        {"question": "What is the primary purpose of documenting a patient safety event promptly?",
                         "options": ["To assign blame to the responsible staff member", "To protect the hospital from legal liability only",
                                     "To protect patient safety and support systemic learning, while also protecting the reporting nurse",
                                     "Documentation is optional for near-misses"],
                         "correct_index": 2,
                         "explanation": "Timely, objective incident documentation serves patient safety and systemic learning first -- and protects the reporting nurse when done factually."},
                    ],
                })

    upsert_item("ph_allied_health_ncm100_5", "ph_allied_health", "ph_allied_health_ncm100", 5, "dialogue",
                "Reassuring a First-Time Patient", 8, {
                    "persona_name": "Ramon",
                    "persona_situation": (
                        "Ramon is a 24-year-old first-time patient at a Rural Health Unit, visibly nervous "
                        "about getting a routine blood draw for a check-up. He has never had blood taken before "
                        "and is worried it will hurt or that something is seriously wrong with him."
                    ),
                    "persona_tone": "Anxious, fidgety, asks repetitive reassurance-seeking questions "
                                    "(\"Will it hurt?\", \"Is something wrong with me?\"). Responds well to calm, "
                                    "specific, honest reassurance -- not to being dismissed or rushed.",
                    "resolution_criteria": (
                        "The student has (1) acknowledged Ramon's nervousness directly rather than dismissing it, "
                        "(2) explained what will happen and why in plain, honest terms (including that mild discomfort "
                        "is normal but brief), and (3) confirmed his consent and comfort before proceeding."
                    ),
                    "opening_line": "Um, is this going to hurt a lot? I've never done this before... is something wrong with me? Why do you need my blood?",
                })

    upsert_item("ph_allied_health_ncm100_6", "ph_allied_health", "ph_allied_health_ncm100", 6, "graded_assessment",
                "Module Assessment: Fundamentals of Nursing Practice", 12, {
                    "is_graded": True, "pass_threshold": 3, "competency_area": "prc_area_1",
                    "questions": [
                        {"question": "Under the WHO 5 Moments framework, hand hygiene is required:",
                         "options": ["Only before invasive procedures", "At 5 specific moments regardless of procedure type",
                                     "Only when gloves are unavailable", "Once per shift is sufficient"],
                         "correct_index": 1,
                         "explanation": "The 5 Moments framework defines 5 specific triggers for hand hygiene throughout any patient interaction, not just before invasive procedures."},
                        {"question": "A patient safety near-miss with no actual harm should be documented:",
                         "options": ["No, only actual harm events require documentation", "Yes, with the same rigor as an actual harm event",
                                     "Only if a supervisor requests it", "Only if the patient complains"],
                         "correct_index": 1,
                         "explanation": "Near-misses are documented with the same rigor as harm events because they reveal systemic risks before real harm occurs."},
                        {"question": "When a first-time patient expresses anxiety about a procedure, the best initial response is to:",
                         "options": ["Proceed quickly to minimize their anxiety time", "Dismiss the concern as normal and unimportant",
                                     "Acknowledge the anxiety directly and explain the procedure honestly", "Refer them to a different nurse"],
                         "correct_index": 2,
                         "explanation": "Direct acknowledgment plus honest, plain-language explanation is the standard approach to patient anxiety -- dismissal or rushing undermines trust and consent."},
                        {"question": "In a GIDA (Geographically Isolated and Disadvantaged Area) setting with limited supplies, hand hygiene protocol should be:",
                         "options": ["Relaxed to match available resources", "Maintained as essential regardless of resource constraints",
                                     "Replaced entirely with glove use", "Applied only during disease outbreaks"],
                         "correct_index": 1,
                         "explanation": "Hand hygiene protocol is maintained as essential even in resource-constrained settings -- supplies for it are treated as non-negotiable stock."},
                    ],
                })

    # ── Module 2: NCM — Psychosocial & Mental Health Nursing ────────────────
    upsert_item("ph_allied_health_ncm_mh_1", "ph_allied_health", "ph_allied_health_ncm_mh", 1, "reading",
                "Recognizing Acute Psychological Distress", 7, {"body_markdown": (
                    "## Recognizing Acute Psychological Distress\n\n"
                    "Psychiatric and Mental Health Nursing (PRC Area 4) is consistently one of the weakest "
                    "areas in national licensure exam performance -- largely because clinical rotations give "
                    "students far less real exposure to psychiatric presentations than to physical-health "
                    "conditions. Recognizing acute distress early is a core, testable competency.\n\n"
                    "### Key signs of acute psychological distress\n- Disorganized or pressured speech\n"
                    "- Flat or blunted affect, or conversely extreme emotional lability\n- Disorientation to "
                    "time, place, or person beyond what's explained by physical illness\n- Expressions of "
                    "hopelessness or overwhelm disproportionate to the immediate situation\n\n"
                    "### Philippine context\nThe Philippines experiences roughly 20 tropical cyclones per year. "
                    "In evacuation centers after a typhoon, acute stress reactions -- not yet full PTSD -- are "
                    "extremely common and are frequently the *first* psychiatric presentation a new nurse will "
                    "actually encounter in practice, making this exactly the kind of scenario simulation can "
                    "safely prepare students for before they meet it in a real crisis."
                )})

    print("Generating video: Recognizing Acute Psychological Distress ...")
    v3_path, v3_dur = generate_video(
        "ph_allied_health", allied_health_meta, "ncm_mh_recognizing_distress",
        "Recognizing Acute Psychological Distress",
        "How to recognize the signs of acute psychological distress in a clinical or disaster-response "
        "setting: disorganized speech, blunted or labile affect, disorientation, and disproportionate "
        "hopelessness -- and why early recognition matters for triage and referral decisions.",
    )
    upsert_item("ph_allied_health_ncm_mh_2", "ph_allied_health", "ph_allied_health_ncm_mh", 2, "video",
                "Recognizing Acute Psychological Distress", round(v3_dur / 60, 1), {"video_url": v3_path, "duration_sec": v3_dur})

    upsert_item("ph_allied_health_ncm_mh_3", "ph_allied_health", "ph_allied_health_ncm_mh", 3, "screen_capture",
                "Walkthrough: De-escalating a Patient in Crisis", 6, {
                    # Reuses the recognizing-distress video as a stand-in visual walkthrough asset --
                    # same generated file, framed as a procedural walkthrough for this item.
                    "video_url": v3_path, "duration_sec": v3_dur, "framing_note": "walkthrough",
                })

    upsert_item("ph_allied_health_ncm_mh_4", "ph_allied_health", "ph_allied_health_ncm_mh", 4, "practice_assignment",
                "Psychosocial Care Check", 8, {
                    "is_graded": True, "pass_threshold": 3,
                    "questions": [
                        {"question": "Which is a sign of acute psychological distress rather than purely physical illness?",
                         "options": ["Elevated temperature", "Disorganized or pressured speech", "Localized pain", "Elevated blood pressure alone"],
                         "correct_index": 1,
                         "explanation": "Disorganized or pressured speech is a psychiatric/behavioral sign, distinct from vital-sign abnormalities alone."},
                        {"question": "In Psychological First Aid, what should a nurse prioritize first with a distressed evacuee?",
                         "options": ["Immediate detailed trauma history", "Safety, comfort, and calm, non-intrusive presence",
                                     "Referral to a psychiatrist regardless of severity", "Medication administration"],
                         "correct_index": 1,
                         "explanation": "Psychological First Aid prioritizes establishing safety and calm presence before any detailed history-taking or clinical intervention."},
                        {"question": "Why are evacuation centers after a typhoon a common setting for acute stress reactions?",
                         "options": ["They are not -- this is rare in the Philippines", "Displacement, loss, and uncertainty are acute stressors, and the Philippines experiences frequent typhoons",
                                     "Only pre-existing psychiatric patients are affected", "Acute stress reactions only occur in hospitals"],
                         "correct_index": 1,
                         "explanation": "The Philippines' high typhoon frequency means displacement-related acute stress reactions are a routine, not rare, presentation nurses encounter."},
                        {"question": "Premature reassurance (\"everything will be fine\") to a distressed patient is best described as:",
                         "options": ["Always the correct approach", "Potentially dismissive -- active listening should come first",
                                     "Required by protocol", "Only a concern in pediatric patients"],
                         "correct_index": 1,
                         "explanation": "Premature reassurance can feel dismissive; PFA principles favor active listening and validating the person's experience before offering reassurance."},
                    ],
                })

    upsert_item("ph_allied_health_ncm_mh_5", "ph_allied_health", "ph_allied_health_ncm_mh", 5, "dialogue",
                "Supporting a Typhoon-Displaced Patient", 10, {
                    "persona_name": "Nena",
                    "persona_situation": (
                        "Nena is a 38-year-old mother sheltering at an evacuation center three days after a "
                        "major typhoon destroyed her family's home. She is overwhelmed, has not slept properly, "
                        "and is struggling to cope with the uncertainty of what comes next."
                    ),
                    "persona_tone": "Overwhelmed, alternates between flat exhaustion and sudden tearfulness. "
                                    "Responds to calm, patient, non-judgmental listening; withdraws or gives short "
                                    "answers if she feels rushed or lectured.",
                    "resolution_criteria": (
                        "The student has (1) listened actively without rushing to premature reassurance, "
                        "(2) validated her experience as a normal reaction to an abnormal situation, and "
                        "(3) gently assessed whether she has support/safety needs and offered a concrete next step "
                        "(e.g. connecting her with camp health services) without being prescriptive or dismissive."
                    ),
                    "opening_line": "I don't even know where to start... we lost everything. I haven't slept. I don't know what we're supposed to do now.",
                })

    upsert_item("ph_allied_health_ncm_mh_6", "ph_allied_health", "ph_allied_health_ncm_mh", 6, "graded_assessment",
                "Module Assessment: Psychosocial & Mental Health Nursing", 14, {
                    "is_graded": True, "pass_threshold": 3, "competency_area": "prc_area_4_mental_health",
                    "questions": [
                        {"question": "Which best describes a sign of acute psychological distress?",
                         "options": ["Disorientation beyond what physical illness explains", "A single episode of mild sadness",
                                     "Normal fatigue after a long shift", "Requesting information about discharge"],
                         "correct_index": 0,
                         "explanation": "Disorientation not explained by physical illness is a specific, testable sign of acute psychological distress."},
                        {"question": "The first priority in Psychological First Aid is:",
                         "options": ["Detailed psychiatric diagnosis", "Establishing safety and calm presence",
                                     "Medication administration", "Referral paperwork"],
                         "correct_index": 1,
                         "explanation": "PFA is explicitly structured to prioritize safety and calm presence before diagnosis or intervention."},
                        {"question": "Why is Psychiatric/Mental Health Nursing (NP4) historically a weak area on the national licensure exam?",
                         "options": ["It is not tested", "Clinical rotations provide comparatively less real exposure to psychiatric presentations",
                                     "It is easier than other content areas", "Students are not interested in the topic"],
                         "correct_index": 1,
                         "explanation": "Limited real clinical exposure to psychiatric presentations during rotations is the documented driver of this gap -- exactly what simulation-based practice can help address."},
                        {"question": "When a distressed patient becomes tearful and gives short answers, the best response is to:",
                         "options": ["Push for more detail immediately", "Slow down, remain patient, and avoid rushing or lecturing",
                                     "End the conversation", "Change the subject to something unrelated"],
                         "correct_index": 1,
                         "explanation": "Slowing down and remaining patient respects the person's emotional state and is core to trauma-informed communication."},
                    ],
                })

    # ── Module 3: NCM 104 — Community Health Nursing & Communicable Diseases ─
    print("Generating video: TB DOTS Treatment Adherence ...")
    v4_path, v4_dur = generate_video(
        "ph_allied_health", allied_health_meta, "ncm104_tb_dots",
        "TB DOTS: Directly Observed Treatment, Short-course",
        "The DOTS strategy for tuberculosis treatment in the Philippines: directly observed dosing, "
        "the standard 6-month multi-drug regimen, why treatment interruption risks drug-resistant TB, "
        "and the community health nurse's role in adherence counseling and contact tracing.",
    )
    upsert_item("ph_allied_health_ncm104_1", "ph_allied_health", "ph_allied_health_ncm104", 1, "video",
                "TB DOTS: Directly Observed Treatment, Short-course", round(v4_dur / 60, 1), {"video_url": v4_path, "duration_sec": v4_dur})

    upsert_item("ph_allied_health_ncm104_2", "ph_allied_health", "ph_allied_health_ncm104", 2, "reading",
                "Understanding TB Treatment Adherence", 7, {"body_markdown": (
                    "## Understanding TB Treatment Adherence\n\n"
                    "The Philippines has one of the highest tuberculosis burdens in the world. The DOTS "
                    "(Directly Observed Treatment, Short-course) strategy -- a health worker or trained "
                    "treatment partner watching the patient take every dose -- is the WHO-recommended "
                    "approach, and PRC Area 3 (Health Education) tests a nurse's ability to counsel "
                    "patients toward completing it.\n\n"
                    "### Key points\n- The standard regimen runs about 6 months; stopping early -- even "
                    "when symptoms improve -- is the single biggest driver of multi-drug-resistant TB (MDR-TB).\n"
                    "- Patients often feel better within weeks and are tempted to stop; the nurse's role is "
                    "to explain *why* completion matters even after symptoms disappear, not just to instruct.\n"
                    "- Contact tracing (screening household members) is a core part of community TB control, "
                    "not an optional add-on.\n\n"
                    "### Philippine context\nDOTS is typically delivered through Rural Health Units and "
                    "barangay health stations, often relying on a trained treatment partner (a family member "
                    "or community health worker) when daily clinic visits aren't feasible -- adherence "
                    "counseling has to account for real transportation and livelihood constraints, not just "
                    "clinical ideals."
                )})

    upsert_item("ph_allied_health_ncm104_3", "ph_allied_health", "ph_allied_health_ncm104", 3, "screen_capture",
                "Walkthrough: TB DOTS Treatment Adherence", round(v4_dur / 60, 1),
                {"video_url": v4_path, "duration_sec": v4_dur, "framing_note": "walkthrough"})

    upsert_item("ph_allied_health_ncm104_4", "ph_allied_health", "ph_allied_health_ncm104", 4, "practice_assignment",
                "Community Health Check", 8, {
                    "is_graded": True, "pass_threshold": 3,
                    "questions": [
                        {"question": "What is the single biggest driver of multi-drug-resistant TB (MDR-TB)?",
                         "options": ["Taking medication with food", "Stopping treatment early once symptoms improve", "Attending follow-up visits", "Contact tracing"],
                         "correct_index": 1,
                         "explanation": "Early treatment interruption -- even when the patient feels better -- is the leading cause of drug-resistant TB."},
                        {"question": "Why is contact tracing considered a core part of TB control, not optional?",
                         "options": ["It is only for research purposes", "It identifies and screens people at risk of undiagnosed infection", "It is required only for MDR-TB cases", "It replaces the need for DOTS"],
                         "correct_index": 1,
                         "explanation": "Contact tracing finds other potentially infected household/close contacts early, before they spread the disease further."},
                        {"question": "In a resource-constrained setting where daily clinic visits aren't feasible, DOTS can be supported by:",
                         "options": ["Skipping observed dosing entirely", "A trained treatment partner (family member or community health worker)", "Reducing the treatment duration", "Only observing the first week of treatment"],
                         "correct_index": 1,
                         "explanation": "A trained treatment partner is the standard adaptation for DOTS when daily facility visits aren't practical."},
                        {"question": "What should a nurse emphasize to a patient who feels better after a few weeks of TB treatment?",
                         "options": ["They can stop taking medication now", "Feeling better does not mean the infection is fully treated -- completing the full course is essential", "They should double the dose to finish faster", "Only the doctor's opinion matters, not their own symptoms"],
                         "correct_index": 1,
                         "explanation": "Symptom improvement is expected mid-course but does not mean the bacteria are fully eliminated -- completing the full regimen is what prevents relapse and resistance."},
                    ],
                })

    upsert_item("ph_allied_health_ncm104_5", "ph_allied_health", "ph_allied_health_ncm104", 5, "dialogue",
                "Counseling a Patient Considering Stopping Treatment", 9, {
                    "persona_name": "Bert",
                    "persona_situation": (
                        "Bert is a 45-year-old construction worker, six weeks into his 6-month TB treatment. "
                        "He feels significantly better, is worried about missing paid work days for clinic visits, "
                        "and is considering stopping treatment early."
                    ),
                    "persona_tone": "Practical and a little defensive about his decision -- feels fine physically and "
                                    "sees the ongoing clinic visits as a burden on his ability to earn income. Responds to "
                                    "clear, respectful explanation rather than being told what to do.",
                    "resolution_criteria": (
                        "The student has (1) acknowledged his real financial/work concerns without dismissing them, "
                        "(2) clearly explained why stopping early risks drug-resistant TB even though he feels better, "
                        "and (3) explored a concrete way to support adherence given his constraints (e.g. a treatment "
                        "partner, adjusted visit timing) rather than just repeating \"you must continue.\""
                    ),
                    "opening_line": "Honestly, I feel fine now. I've got work I can't keep missing -- do I really need to keep coming in for this?",
                })

    upsert_item("ph_allied_health_ncm104_6", "ph_allied_health", "ph_allied_health_ncm104", 6, "graded_assessment",
                "Module Assessment: Community Health Nursing & Communicable Diseases", 12, {
                    "is_graded": True, "pass_threshold": 3, "competency_area": "prc_area_3",
                    "questions": [
                        {"question": "The DOTS strategy for TB treatment specifically requires:",
                         "options": ["Self-reported adherence only", "A health worker or treatment partner directly observing each dose", "Weekly check-ins by phone", "Treatment only during symptomatic periods"],
                         "correct_index": 1,
                         "explanation": "DOTS is defined by directly observed dosing, not self-report -- that's what distinguishes it from standard treatment."},
                        {"question": "A patient stops TB treatment after 6 weeks because symptoms resolved. The primary risk is:",
                         "options": ["No risk, since symptoms are gone", "Development of multi-drug-resistant TB", "Only a risk of mild relapse with no resistance", "Risk only if the patient is elderly"],
                         "correct_index": 1,
                         "explanation": "Early cessation is the primary driver of MDR-TB, regardless of symptom resolution."},
                        {"question": "When counseling a patient reluctant to continue treatment due to work constraints, the best approach is to:",
                         "options": ["Insist without addressing their concerns", "Acknowledge their constraints and problem-solve a concrete adherence plan together", "Tell them it's not the nurse's problem", "Reduce the treatment course to fit their schedule"],
                         "correct_index": 1,
                         "explanation": "Effective health education validates real constraints and collaboratively finds adherence solutions, rather than issuing directives."},
                        {"question": "Why is contact tracing part of standard TB case management?",
                         "options": ["To penalize the patient", "To identify and screen others who may have been exposed", "It is not part of standard case management", "Only relevant for hospital-based cases"],
                         "correct_index": 1,
                         "explanation": "Contact tracing identifies others potentially exposed, enabling early detection and reducing community transmission."},
                    ],
                })

    # ── Software Engineering (unchanged placeholder -- later pass) ──────────
    upsert_item("ph_software_eng_cs102_1", "ph_software_eng", "ph_software_eng_cs102", 1, "reading",
                "Boundary Conditions & Off-by-One Bugs", 6, {"body_markdown": (
                    "## Boundary Conditions & Off-by-One Bugs\n\n"
                    "A huge share of real-world production bugs come from boundary conditions: loops that run "
                    "one iteration too many or too few, tariff/pricing logic that breaks exactly at a threshold "
                    "value, or data types that silently overflow at scale.\n\n"
                    "### Key points\n- Always test the exact boundary value, not just values comfortably inside "
                    "or outside a range.\n- A function that works for typical inputs but breaks at the edge is "
                    "not correct -- it's untested."
                )})
    upsert_item("ph_software_eng_cs102_2", "ph_software_eng", "ph_software_eng_cs102", 2, "practice_assignment",
                "Programming Fundamentals Check", 5, {
                    "is_graded": True, "pass_threshold": 1,
                    "questions": [{
                        "question": "A fare calculator works correctly for distances under 50km but returns wrong values at exactly 50km. What kind of bug is this?",
                        "options": ["A boundary condition / off-by-one bug", "A syntax error", "A missing import", "A network timeout"],
                        "correct_index": 0,
                        "explanation": "Breaking exactly at a threshold value is the classic signature of a boundary-condition bug.",
                    }],
                })

    # ── Practice lab scenarios: multi-step, gated behind each module's practice_assignment ──
    conn.execute("DELETE FROM lab_scenarios WHERE tenant_id=?", (TENANT_ID,))

    conn.execute(
        """INSERT INTO lab_scenarios (id, tenant_id, course_id, discipline, title, context_profile, intro_message, scenario_json, required_item_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        ("ph_lab_dengue_intake", TENANT_ID, "ph_allied_health", "allied_healthcare",
         "Suspected Dengue Intake at a Rural Health Unit: Aling Maria",
         "Name: Aling Maria | Age: 52 | Location: Rural Health Unit, Samar (GIDA region)\n"
         "Chief Complaint: High fever for 3 days, distinct bleeding spots on skin (petechiae), and new abdominal pain.\n"
         "Setting: A single-nurse RHU with limited supplies -- the nearest hospital with inpatient capacity is 40km away.",
         "Aling Maria has just been brought in by her family. Awaiting your first step.",
         json.dumps({
             "steps": [
                 {
                     "prompt": "Step 1 of 3 — Infection Control",
                     "actions": [
                         {"id": "hand_hygiene", "label": "Perform Hand Hygiene", "trigger_type": "safe", "advance": True,
                          "response_message": "Hand hygiene performed. Safe to proceed with patient contact.",
                          "competency_area": "prc_area_1", "score_delta": 90},
                         {"id": "administer_paracetamol_early", "label": "Administer Paracetamol", "trigger_type": "infraction", "advance": False,
                          "response_message": "CRITICAL INFRACTION: Cross-contamination risk! You initiated clinical procedures without Hand Hygiene first. This has been written to your Skill Passport under PRC Area 1. Try again.",
                          "competency_area": "prc_area_1", "score_delta": 30},
                     ],
                 },
                 {
                     "prompt": "Step 2 of 3 — Danger-Sign History",
                     "actions": [
                         {"id": "ask_danger_signs", "label": "Ask About Warning Signs (abdominal pain, persistent vomiting, bleeding)", "trigger_type": "safe", "advance": True,
                          "response_message": "Aling Maria confirms abdominal pain and gum bleeding since this morning -- these are WHO dengue warning signs.",
                          "competency_area": "prc_area_1", "score_delta": 85},
                         {"id": "skip_to_treatment", "label": "Skip History, Proceed Straight to Treatment", "trigger_type": "infraction", "advance": False,
                          "response_message": "INFRACTION: Skipping danger-sign assessment risks missing signs of severe dengue. Ask about warning signs before proceeding.",
                          "competency_area": "prc_area_1", "score_delta": 35},
                     ],
                 },
                 {
                     "prompt": "Step 3 of 3 — Escalation Decision",
                     "actions": [
                         {"id": "refer_to_hospital", "label": "Refer to Hospital With Inpatient Capacity (warning signs present)", "trigger_type": "safe", "advance": True,
                          "response_message": "Correct. Warning signs present (abdominal pain, bleeding) mean this RHU case must be referred for inpatient monitoring -- exactly per WHO dengue triage protocol. Referral arranged.",
                          "competency_area": "prc_area_1", "score_delta": 95},
                         {"id": "treat_and_send_home", "label": "Treat Symptoms and Send Home", "trigger_type": "infraction", "advance": False,
                          "response_message": "CRITICAL INFRACTION: With warning signs present, sending this patient home risks progression to severe dengue. Refer to a facility with inpatient capacity.",
                          "competency_area": "prc_area_1", "score_delta": 20},
                     ],
                 },
             ],
         }),
         "ph_allied_health_ncm100_4"),
    )

    conn.execute(
        """INSERT INTO lab_scenarios (id, tenant_id, course_id, discipline, title, context_profile, intro_message, scenario_json, required_item_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        ("ph_lab_typhoon_pfa", TENANT_ID, "ph_allied_health", "allied_healthcare",
         "Psychosocial First Aid After Typhoon Landfall: Nena",
         "Name: Nena | Age: 38 | Location: Evacuation Center, 3 days after typhoon landfall\n"
         "Situation: Family home destroyed, sheltering with two children. Overwhelmed, hasn't slept, alternating "
         "between flat exhaustion and sudden tearfulness.",
         "Nena is sitting alone near the edge of the evacuation center, staring at the floor.",
         json.dumps({
             "steps": [
                 {
                     "prompt": "Step 1 of 3 — Initial Approach",
                     "actions": [
                         {"id": "calm_introduction", "label": "Approach Calmly and Introduce Yourself", "trigger_type": "safe", "advance": True,
                          "response_message": "Nena looks up slowly and nods. A calm, unhurried approach is the correct first step in Psychological First Aid.",
                          "competency_area": "prc_area_4_mental_health", "score_delta": 85},
                         {"id": "immediate_trauma_questions", "label": "Immediately Ask for Full Trauma History", "trigger_type": "infraction", "advance": False,
                          "response_message": "INFRACTION: Leading with detailed trauma questions before establishing safety and rapport can feel intrusive. Start by approaching calmly instead.",
                          "competency_area": "prc_area_4_mental_health", "score_delta": 30},
                     ],
                 },
                 {
                     "prompt": "Step 2 of 3 — Responding to Distress",
                     "actions": [
                         {"id": "active_listening", "label": "Listen Actively and Validate Her Experience", "trigger_type": "safe", "advance": True,
                          "response_message": "Nena begins to speak more openly after feeling heard. Active listening and validation are core Psychological First Aid principles.",
                          "competency_area": "prc_area_4_mental_health", "score_delta": 90},
                         {"id": "premature_reassurance", "label": "Tell Her \"Everything Will Be Fine\"", "trigger_type": "infraction", "advance": False,
                          "response_message": "INFRACTION: Premature reassurance can feel dismissive of real loss. Active listening should come first.",
                          "competency_area": "prc_area_4_mental_health", "score_delta": 40},
                     ],
                 },
                 {
                     "prompt": "Step 3 of 3 — Next Steps",
                     "actions": [
                         {"id": "connect_to_services", "label": "Gently Assess Needs and Connect Her to Camp Health Services", "trigger_type": "safe", "advance": True,
                          "response_message": "Correct. Assessing concrete needs and connecting her to available services -- without being prescriptive -- is the appropriate next step after establishing rapport.",
                          "competency_area": "prc_area_4_mental_health", "score_delta": 92},
                         {"id": "prescribe_solution", "label": "Tell Her Exactly What She Needs to Do Next", "trigger_type": "infraction", "advance": False,
                          "response_message": "INFRACTION: Being prescriptive undermines her sense of control at a moment when agency matters most. Offer options and support instead.",
                          "competency_area": "prc_area_4_mental_health", "score_delta": 35},
                     ],
                 },
             ],
         }),
         "ph_allied_health_ncm_mh_4"),
    )

    conn.execute(
        """INSERT INTO lab_scenarios (id, tenant_id, course_id, discipline, title, context_profile, intro_message, scenario_json, required_item_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        ("ph_lab_tb_dots", TENANT_ID, "ph_allied_health", "allied_healthcare",
         "TB Treatment Adherence Counseling: Bert",
         "Name: Bert | Age: 45 | Occupation: Construction worker | Week 6 of a 6-month TB treatment course\n"
         "Situation: Feeling significantly better, worried about lost wages from clinic visits, considering stopping treatment.",
         "Bert has just told you he's thinking about stopping his TB medication. Awaiting your first step.",
         json.dumps({
             "steps": [
                 {
                     "prompt": "Step 1 of 3 — Initial Response",
                     "actions": [
                         {"id": "acknowledge_concern", "label": "Acknowledge His Work & Financial Concerns", "trigger_type": "safe", "advance": True,
                          "response_message": "Bert relaxes slightly, feeling heard rather than lectured. Acknowledging real constraints first is the correct approach to health education.",
                          "competency_area": "prc_area_3", "score_delta": 88},
                         {"id": "insist_immediately", "label": "Immediately Insist He Must Continue", "trigger_type": "infraction", "advance": False,
                          "response_message": "INFRACTION: Leading with a directive before acknowledging his concerns tends to provoke defensiveness rather than cooperation. Try acknowledging his situation first.",
                          "competency_area": "prc_area_3", "score_delta": 35},
                     ],
                 },
                 {
                     "prompt": "Step 2 of 3 — Health Education",
                     "actions": [
                         {"id": "explain_resistance_risk", "label": "Explain Why Stopping Early Risks Drug-Resistant TB", "trigger_type": "safe", "advance": True,
                          "response_message": "Bert understands the resistance risk isn't just a formality. Clearly explaining the *why* -- not just the rule -- is the core of health education competency.",
                          "competency_area": "prc_area_3", "score_delta": 90},
                         {"id": "vague_warning", "label": "Just Say \"It's Important, Trust Me\"", "trigger_type": "infraction", "advance": False,
                          "response_message": "INFRACTION: A vague appeal to authority doesn't build genuine understanding. Explain the specific clinical reason (drug-resistant TB risk).",
                          "competency_area": "prc_area_3", "score_delta": 40},
                     ],
                 },
                 {
                     "prompt": "Step 3 of 3 — Adherence Plan",
                     "actions": [
                         {"id": "propose_treatment_partner", "label": "Propose a Treatment Partner or Adjusted Visit Schedule", "trigger_type": "safe", "advance": True,
                          "response_message": "Correct. Collaboratively problem-solving a concrete adherence plan -- not just repeating the rule -- is exactly what DOTS counseling requires in resource-constrained settings.",
                          "competency_area": "prc_area_3", "score_delta": 93},
                         {"id": "repeat_directive", "label": "Just Repeat That He Must Continue Attending", "trigger_type": "infraction", "advance": False,
                          "response_message": "INFRACTION: Repeating the directive without offering a practical solution leaves his real barrier (lost wages) unaddressed.",
                          "competency_area": "prc_area_3", "score_delta": 38},
                     ],
                 },
             ],
         }),
         "ph_allied_health_ncm104_4"),
    )

    conn.execute(
        """INSERT INTO lab_scenarios (id, tenant_id, course_id, discipline, title, context_profile, intro_message, scenario_json, required_item_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)""",
        ("ph_lab_jeepney_fare", TENANT_ID, "ph_software_eng", "software_engineering",
         "Jeepney/LRT Fare Calculator Bug",
         "Task: Complete the conditional logical pricing flow for a localized Jeepney/LRT Fare Calculator app "
         "adhering strictly to official LTFRB tariff mandates.",
         "Review the baseline code below, then submit your fix for oral defense.",
         json.dumps({
             "steps": [
                 {
                     "prompt": None,
                     "actions": [
                         {"id": "submit_code", "label": "Submit Code to Tech Lead", "trigger_type": "safe", "advance": True,
                          "response_message": "Code submitted for review. Prepare for your AI Oral Defense.",
                          "competency_area": "swe_code_quality", "score_delta": 70},
                     ],
                 },
             ],
             "baseline_code": "function calculateJeepneyFare(distance) {\n  let fare = 15;\n  // Bug inside boundary loops\n}",
             "viva_question": "Your algorithm returns correct calculations, but explain why your selected data type bounds on line 14 will generate structural runtime memory leaks if passenger distances scale over 50km?",
         })),
    )

    conn.commit()
    conn.close()
    print("Seeded ph_gov tenant: 5 competency areas, 3 full Allied Health modules (18 items, 3 videos), "
          "1 CS102 placeholder module, and 4 lab scenarios (3 multi-step Allied Health + 1 SWE).")


if __name__ == "__main__":
    main()
