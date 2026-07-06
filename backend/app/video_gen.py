"""
Admin-only pipeline: auto-generate a short narrated video for a curriculum concept.

Gemini free tier (script) -> Piper TTS, self-hosted (narration) -> Pillow (slides)
-> ffmpeg (assembly). Deliberately avoids any paid API and any headless-browser
rendering (e.g. Playwright/Chromium) since the production host is a single
1 vCPU / ~1GB RAM droplet that also runs the live student-facing app.

Runs as a FastAPI background task (see main.py), but has no FastAPI dependency
itself and can be run standalone for testing:

    GEMINI_API_KEY=... python3 -m app.video_gen bioinformatics central_dogma_a
"""
import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import wave
from datetime import datetime

from PIL import Image, ImageDraw, ImageFont

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
PIPER_VOICE_MODEL = os.environ.get("PIPER_VOICE_MODEL", "/opt/piper-voices/en_US-lessac-medium.onnx")
FONT_BOLD = os.environ.get("VIDEO_FONT_BOLD", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
FONT_REGULAR = os.environ.get("VIDEO_FONT_REGULAR", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")

SLIDE_W, SLIDE_H = 1280, 720
PAD_SEC = 0.4
MAX_SLIDES = 6
SUBPROCESS_TIMEOUT = 120
MIN_FREE_DISK_BYTES = 1_500_000_000  # 1.5GB safety margin on a mostly-full disk

# Only one generation job at a time — the app runs as a single uvicorn worker
# (no --workers flag), so an in-memory flag is sufficient. Piper/ffmpeg are
# CPU-bound and the box has 1 vCPU; running two jobs concurrently, or running
# generation alongside heavy request traffic, is exactly the resource
# contention pattern that has already caused a real outage on this host once.
video_gen_lock = False


class VideoGenError(Exception):
    pass


def has_enough_disk_space():
    return shutil.disk_usage("/").free >= MIN_FREE_DISK_BYTES


def _gemini_script(concept_name, concept_desc, subject_name):
    if not GEMINI_API_KEY:
        raise VideoGenError("GEMINI_API_KEY not configured")
    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)
    prompt = f"""You are writing a short narrated lecture slide script for a university-level course on {subject_name}.

Concept: {concept_name}
Key points to cover: {concept_desc}

Produce 4 to 6 slides. Each slide has:
- "heading": a short slide title (max 6 words)
- "bullet": one short supporting phrase (max 10 words), can be empty string
- "narration": 1-2 sentences a narrator would say for this slide (max 40 words), conversational but precise, for an undergraduate audience

Return ONLY strict JSON, no markdown fences, no commentary, in this exact shape:
{{"slides": [{{"heading": "...", "bullet": "...", "narration": "..."}}]}}
"""
    try:
        resp = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        text = resp.text.strip()
    except Exception as e:
        raise VideoGenError(f"Gemini request failed: {e}")

    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise VideoGenError(f"Gemini returned invalid JSON: {e}\nRaw: {text[:300]}")

    slides = data.get("slides", [])
    if not slides:
        raise VideoGenError("Gemini returned no slides")
    return slides[:MAX_SLIDES]


def _piper_narrate(text, out_wav_path):
    text = text.strip() or "."
    try:
        result = subprocess.run(
            ["piper", "-m", PIPER_VOICE_MODEL, "-f", out_wav_path],
            input=text.encode("utf-8"),
            capture_output=True,
            timeout=SUBPROCESS_TIMEOUT,
        )
    except subprocess.TimeoutExpired:
        raise VideoGenError("Piper timed out")
    if result.returncode != 0:
        raise VideoGenError(f"Piper failed: {result.stderr.decode(errors='ignore')[:300]}")
    if not os.path.exists(out_wav_path):
        raise VideoGenError("Piper did not produce an output file")


def _wav_duration(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / float(w.getframerate())


def _make_silence(path, seconds):
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono", "-t", str(seconds), path],
        check=True, capture_output=True, timeout=SUBPROCESS_TIMEOUT,
    )


def _load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def _wrap_lines(draw, text, font, max_width):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        bbox = draw.textbbox((0, 0), trial, font=font)
        if bbox[2] - bbox[0] > max_width and cur:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines


def _render_slide(heading, bullet, subject_color, subject_name, idx, total, out_png):
    img = Image.new("RGB", (SLIDE_W, SLIDE_H), "#0f172a")
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, SLIDE_W, 14], fill=subject_color)

    heading_font = _load_font(FONT_BOLD, 56)
    bullet_font = _load_font(FONT_REGULAR, 32)
    label_font = _load_font(FONT_REGULAR, 24)

    draw.text((60, 50), subject_name.upper(), font=label_font, fill="#94a3b8")
    draw.text((SLIDE_W - 160, 50), f"{idx + 1}/{total}", font=label_font, fill="#64748b")

    lines = _wrap_lines(draw, heading, heading_font, SLIDE_W - 120)
    y = SLIDE_H // 2 - (len(lines) * 68) // 2 - 40
    for line in lines:
        draw.text((60, y), line, font=heading_font, fill="#f1f5f9")
        y += 68

    if bullet:
        y += 20
        for line in _wrap_lines(draw, bullet, bullet_font, SLIDE_W - 120):
            draw.text((60, y), f"•  {line}", font=bullet_font, fill=subject_color)
            y += 42

    img.save(out_png)


def _assemble(work_dir, wavs, pngs, durations, out_mp4):
    silence_path = os.path.join(work_dir, "silence.wav")
    _make_silence(silence_path, PAD_SEC)

    audio_list_path = os.path.join(work_dir, "audio_list.txt")
    with open(audio_list_path, "w") as f:
        for wav in wavs:
            f.write(f"file '{wav}'\n")
            f.write(f"file '{silence_path}'\n")
    narration_path = os.path.join(work_dir, "narration.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", audio_list_path, "-c", "copy", narration_path],
        check=True, capture_output=True, timeout=SUBPROCESS_TIMEOUT,
    )

    # Image display duration = its own narration length + pad, so image
    # switches stay in sync with the (narration + matching silence) audio
    # track built above rather than drifting slide-over-slide.
    images_list_path = os.path.join(work_dir, "images_list.txt")
    with open(images_list_path, "w") as f:
        for png, dur in zip(pngs, durations):
            f.write(f"file '{png}'\n")
            f.write(f"duration {dur + PAD_SEC:.3f}\n")
        f.write(f"file '{pngs[-1]}'\n")  # concat demuxer quirk: last duration is ignored otherwise

    subprocess.run(
        [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", images_list_path,
            "-i", narration_path,
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "96k",
            "-shortest",
            out_mp4,
        ],
        check=True, capture_output=True, timeout=SUBPROCESS_TIMEOUT * 2,
    )


def _update_status(db_path, subject_id, concept_id, **fields):
    conn = sqlite3.connect(db_path)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    conn.execute(
        f"UPDATE concept_videos SET {set_clause} WHERE subject_id = ? AND concept_id = ?",
        (*fields.values(), subject_id, concept_id),
    )
    conn.commit()
    conn.close()


def generate_concept_video(subject_id, concept_id, concept, subject_meta, videos_dir, db_path):
    """Background-task entry point. Never raises — always records gen_status."""
    global video_gen_lock
    if video_gen_lock:
        return  # caller (the API endpoint) should already have rejected this via 409
    video_gen_lock = True

    work_dir = tempfile.mkdtemp(dir=videos_dir)
    try:
        if not has_enough_disk_space():
            raise VideoGenError("Not enough free disk space to generate a video")

        slides = _gemini_script(concept["name"], concept["desc"], subject_meta["name"])

        wavs, durations = [], []
        for i, s in enumerate(slides):
            wav_path = os.path.join(work_dir, f"slide_{i}.wav")
            _piper_narrate(s["narration"], wav_path)
            wavs.append(wav_path)
            durations.append(_wav_duration(wav_path))

        pngs = []
        for i, s in enumerate(slides):
            png_path = os.path.join(work_dir, f"slide_{i}.png")
            _render_slide(s["heading"], s.get("bullet", ""), subject_meta["color"], subject_meta["name"], i, len(slides), png_path)
            pngs.append(png_path)

        tmp_mp4 = os.path.join(work_dir, "out.mp4")
        _assemble(work_dir, wavs, pngs, durations, tmp_mp4)

        subject_dir = os.path.join(videos_dir, subject_id)
        os.makedirs(subject_dir, exist_ok=True)
        final_path = os.path.join(subject_dir, f"{concept_id}.mp4")
        shutil.move(tmp_mp4, final_path)  # only replace the "current" video after a fully successful run

        total_duration = sum(durations) + PAD_SEC * len(durations)
        _update_status(
            db_path, subject_id, concept_id,
            gen_status="done", gen_error=None,
            gen_completed_at=datetime.utcnow().isoformat(),
            local_video_path=f"{subject_id}/{concept_id}.mp4",
            gen_duration_sec=total_duration,
        )
    except Exception as e:
        _update_status(
            db_path, subject_id, concept_id,
            gen_status="error", gen_error=str(e)[:500],
            gen_completed_at=datetime.utcnow().isoformat(),
        )
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
        video_gen_lock = False


if __name__ == "__main__":
    # Standalone test: python3 -m app.video_gen <subject_id> <concept_id>
    # Reads CURRICULUM/SUBJECTS from main.py so the test uses real curriculum data.
    from app.main import CURRICULUM, SUBJECTS

    subject_id, concept_id = sys.argv[1], sys.argv[2]
    concept = next(c for c in CURRICULUM[subject_id] if c["id"] == concept_id)
    out_dir = os.environ.get("VIDEOS_DIR", "/tmp/video_gen_standalone")
    os.makedirs(out_dir, exist_ok=True)
    db_path = os.environ.get("DB_PATH", "/tmp/video_gen_standalone/test.db")
    # Minimal throwaway table so _update_status has somewhere to write during a standalone run.
    conn = sqlite3.connect(db_path)
    conn.execute("""CREATE TABLE IF NOT EXISTS concept_videos (
        subject_id TEXT, concept_id TEXT, drive_url TEXT, title TEXT, added_at TEXT,
        gen_status TEXT, gen_error TEXT, gen_started_at TEXT, gen_completed_at TEXT,
        local_video_path TEXT, gen_duration_sec REAL,
        PRIMARY KEY (subject_id, concept_id))""")
    conn.execute(
        "INSERT OR IGNORE INTO concept_videos (subject_id, concept_id, drive_url, title, added_at) VALUES (?, ?, '', ?, ?)",
        (subject_id, concept_id, concept["name"], datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()

    print(f"Generating video for {subject_id}/{concept_id} -> {out_dir}")
    generate_concept_video(subject_id, concept_id, concept, SUBJECTS[subject_id], out_dir, db_path)

    row = sqlite3.connect(db_path).execute(
        "SELECT gen_status, gen_error, local_video_path, gen_duration_sec FROM concept_videos WHERE subject_id=? AND concept_id=?",
        (subject_id, concept_id),
    ).fetchone()
    print("Result:", row)
