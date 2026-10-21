"""The tutor helper reads Learn-mode activity from progress.json."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "tutor"))
import gcse_tutor as T  # noqa: E402

p = {
    "markLog": [
        {"id": "learn:ratio:share:1", "date": "2026-10-20", "packId": "learn", "topics": ["R5"], "awarded": 2, "max": 2},
        {"id": "learn:ratio:share:2", "date": "2026-10-20", "packId": "learn", "topics": ["R5"], "awarded": 0, "max": 2},
        {"id": "learn:surds:simplify:3", "date": "2026-10-01", "packId": "learn", "topics": ["N8"], "awarded": 0, "max": 1},
        {"id": "L1#1:q1", "date": "2026-10-20", "packId": "L1", "topics": ["A1"], "awarded": 0, "max": 2},
    ],
    "retryQueue": [
        {"id": "ratio/share", "skill": "Sharing in a ratio", "topic": "R5", "misses": 1, "due": "2026-10-21", "cleared": False},
        {"id": "surds/simplify", "skill": "Simplifying surds", "topic": "N8", "misses": 2, "due": "2026-10-02", "cleared": True},
    ],
    "learnProgress": {"ratio": {"step": 3}, "surds": {"completed": True, "step": 9}},
}
s = T.learn_summary(p, day="2026-10-21")
assert s["questions"] == 2 and s["firstTime"] == 1, s
assert s["byTopic"] == {"R5": {"questions": 2, "firstTime": 1}}, s
assert s["lessonsCompleted"] == ["surds"] and s["lessonsInProgress"] == ["ratio"], s
assert [r["skill"] for r in s["openRetries"]] == ["Sharing in a ratio"], s

# Learn entries feed topic mastery like tutor-marked ones.
p2 = T.recompute_topics(json.loads(json.dumps({**p, "topics": {}})))
# 2 of 4 marks that day is under 2/3, so not yet a correct day (FORMAT.md 4.3).
assert p2["topics"]["R5"]["attempts"] == 2 and p2["topics"]["R5"]["correctDates"] == [] and p2["topics"]["R5"]["status"] == "amber", p2["topics"]["R5"]
print("  ✓ tutor helper: Learn summary, Learn entries in topic mastery")
