"""
One-off migration: moves the PV Module 1 pilot's subject/module metadata from the
hardcoded SUBJECTS["clinical_research_foundations"] / CURRICULUM["clinical_research_foundations"]
dict entries into the new courses / course_modules DB tables, so it's the first course
proven through the generalized Course Creator machinery instead of a hardcoded special case.

Does NOT touch existing learning_items / learning_item_progress rows -- they already use
subject_id='clinical_research_foundations', module_id='pv_module1', which this migration
reuses as the courses.id / course_modules.id values, so no content changes at all.

Run manually against the local dev DB: python3 -m migrate_pv_pilot_to_courses
(from the backend/ directory, with DB_PATH set the same as the local uvicorn server).
"""
import json
import os
import sqlite3
from datetime import datetime

from app.main import DB_PATH, SUBJECTS

COURSE_ID = "clinical_research_foundations"
MODULE_ID = "pv_module1"
ITEM_TYPE_SEQUENCE = ["video", "reading", "screen_capture", "practice_assignment", "dialogue", "graded_assessment"]


def main():
    conn = sqlite3.connect(DB_PATH)
    now = datetime.utcnow().isoformat()
    subject = SUBJECTS[COURSE_ID]

    conn.execute(
        """INSERT INTO courses (id, name, tutor_name, tutor_role, tutor_org, color, description, popular, region, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'india', 'published', ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name=excluded.name, tutor_name=excluded.tutor_name, tutor_role=excluded.tutor_role, tutor_org=excluded.tutor_org,
             color=excluded.color, description=excluded.description, status='published', updated_at=excluded.updated_at""",
        (COURSE_ID, subject["name"], subject["tutor_name"], subject["tutor_role"], subject["tutor_org"],
         subject["color"], subject["description"], now, now),
    )
    conn.execute(
        """INSERT INTO course_modules (id, course_id, order_index, title, topics_desc, target_hours, item_type_sequence, status, created_at, updated_at)
           VALUES (?, ?, 1, ?, ?, ?, ?, 'frozen', ?, ?)
           ON CONFLICT(id) DO UPDATE SET status='frozen', item_type_sequence=excluded.item_type_sequence, updated_at=excluded.updated_at""",
        (MODULE_ID, COURSE_ID, "Module 1: Pharmacovigilance",
         "Pharmacovigilance fundamentals: adverse event reporting frameworks, safety-database workflows, patient intake practice, and a graded assessment.",
         1.0, json.dumps(ITEM_TYPE_SEQUENCE), now, now),
    )
    conn.commit()

    item_count = conn.execute(
        "SELECT COUNT(*) FROM learning_items WHERE subject_id=? AND module_id=?", (COURSE_ID, MODULE_ID)
    ).fetchone()[0]
    conn.close()
    print(f"Migrated course '{COURSE_ID}' with module '{MODULE_ID}' ({item_count} existing learning_items preserved, unchanged).")


if __name__ == "__main__":
    main()
