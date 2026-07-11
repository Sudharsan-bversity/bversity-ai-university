"""
Admin-only pipeline: draft-generate structured-course content for the Course Creator
(curriculum outline, reading passages, assessment questions, dialogue personas).

Gemini free tier only, same constraint as video_gen.py -- no paid APIs, no Claude.
Every function here returns a *draft* for the admin to review/edit before saving;
nothing here writes to the database.
"""
import json
import os
import re

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")


class CourseGenError(Exception):
    pass


def _gemini_json(prompt: str) -> dict:
    if not GEMINI_API_KEY:
        raise CourseGenError("GEMINI_API_KEY not configured")
    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)
    try:
        resp = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        text = resp.text.strip()
    except Exception as e:
        raise CourseGenError(f"Gemini request failed: {e}")

    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise CourseGenError(f"Gemini returned invalid JSON: {e}\nRaw: {text[:300]}")


def generate_curriculum_draft(topic: str, target_hours: float, num_modules: int) -> list:
    """Returns a draft list of modules: [{"title", "topics_desc", "target_hours"}]."""
    prompt = f"""You are designing a curriculum outline for a university-level course on "{topic}".

Target total length: about {target_hours} hours, split across {num_modules} modules.

For each module, provide:
- "title": a short, clear module title (e.g. "Module 1: Pharmacovigilance")
- "topics_desc": 1-2 sentences on exactly what this module teaches -- specific topics/skills, not vague filler
- "target_hours": a realistic hour estimate for this module (they should roughly sum to {target_hours})

Order modules so foundational material comes first and later modules build on earlier ones.

Return ONLY strict JSON, no markdown fences, no commentary, in this exact shape:
{{"modules": [{{"title": "...", "topics_desc": "...", "target_hours": 0}}]}}
"""
    data = _gemini_json(prompt)
    modules = data.get("modules", [])
    if not modules:
        raise CourseGenError("Gemini returned no modules")
    return modules[:max(num_modules, 1) + 2]  # small buffer, admin can delete extras


def generate_reading_draft(module_title: str, item_topic: str) -> dict:
    """Returns {"body_markdown": "..."}."""
    prompt = f"""You are writing a reading passage for the module "{module_title}", specifically on: {item_topic}.

Write a well-structured reading in markdown: a short intro, clear ## subheadings, bullet points for
lists/definitions, bold for key terms. Aim for genuine depth an undergraduate/professional learner would need --
several hundred words, not a stub. Conversational but precise tone.

Return ONLY strict JSON, no markdown fences, no commentary, in this exact shape:
{{"body_markdown": "..."}}
"""
    data = _gemini_json(prompt)
    if not data.get("body_markdown"):
        raise CourseGenError("Gemini returned no reading content")
    return data


def generate_assessment_draft(module_title: str, item_topic: str, num_questions: int) -> dict:
    """Returns {"questions": [{"question","options"(4),"correct_index","explanation"}]}."""
    prompt = f"""You are writing {num_questions} multiple-choice questions for the module "{module_title}",
testing understanding of: {item_topic}.

Each question needs real understanding, not trivia -- test application and reasoning where possible, not just recall.
Each question has exactly 4 options, one correct.

Return ONLY strict JSON, no markdown fences, no commentary, in this exact shape:
{{"questions": [{{"question": "...", "options": ["...", "...", "...", "..."], "correct_index": 0, "explanation": "..."}}]}}
"""
    data = _gemini_json(prompt)
    questions = data.get("questions", [])
    if not questions:
        raise CourseGenError("Gemini returned no questions")
    return {"questions": questions[:num_questions]}


def generate_dialogue_draft(module_title: str, item_topic: str) -> dict:
    """Returns the persona fields used by build_structured_course_prompt's dialogue branch."""
    prompt = f"""You are designing a roleplay practice exercise for the module "{module_title}", on: {item_topic}.

Design a realistic persona the student will practice handling in conversation (e.g. a patient, a colleague, a
stakeholder -- whatever fits the topic). Provide:
- "persona_name": the persona's first name
- "persona_situation": 2-3 sentences setting up who they are and their situation
- "persona_tone": how they should come across (emotional state, communication style)
- "resolution_criteria": a specific, checkable description of what the student needs to do/ask/say for the
  exercise to be considered complete
- "opening_line": the persona's first line of dialogue, in character

Return ONLY strict JSON, no markdown fences, no commentary, in this exact shape:
{{"persona_name": "...", "persona_situation": "...", "persona_tone": "...", "resolution_criteria": "...", "opening_line": "..."}}
"""
    data = _gemini_json(prompt)
    if not data.get("persona_name"):
        raise CourseGenError("Gemini returned no persona")
    return data
