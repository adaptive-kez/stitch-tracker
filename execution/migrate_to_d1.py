#!/usr/bin/env python3
"""
Data Migration Script: Supabase → Cloudflare D1
Exports data from Supabase PostgreSQL and imports into D1 via Worker API.

Key mapping: Supabase users.id (UUID) → users.telegram_id (number → string)
The new system uses telegram_id.toString() as user_id everywhere.
"""

import json
import os
import sys
import time
from urllib import request as urllib_request

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mektzrsvpdjleanblpas.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_IfRO370wyTbY2MXM5JXGNg_97JIboKl")
WORKER_URL = os.getenv("WORKER_URL", "https://stitch-tracker-api.stitch-tracker-api.workers.dev")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), ".tmp")


def supabase_get(table: str) -> list:
    """Fetch all rows from a Supabase table."""
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    req = urllib_request.Request(url, headers=headers)
    with urllib_request.urlopen(req) as response:
        return json.loads(response.read().decode())


def worker_request(method: str, path: str, user_id: str, data=None) -> dict:
    """Make a request to the Worker API."""
    url = f"{WORKER_URL}{path}"
    headers = {
        "Content-Type": "application/json",
        "X-User-Id": user_id,
        "User-Agent": "StitchTracker-Migration/1.0",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib_request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib_request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"  ❌ Error {method} {path}: {e}")
        return {}


def migrate():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("Supabase → D1 Data Migration")
    print("=" * 60)

    # Step 1: Export from Supabase
    tables = ["users", "tasks", "habits", "habit_logs", "journal", "goals"]
    data = {}

    for table in tables:
        print(f"\n📥 Exporting {table}...")
        try:
            rows = supabase_get(table)
            data[table] = rows
            with open(os.path.join(OUTPUT_DIR, f"{table}.json"), "w") as f:
                json.dump(rows, f, indent=2, ensure_ascii=False)
            print(f"   ✅ {len(rows)} rows exported")
        except Exception as e:
            print(f"   ❌ Error: {e}")
            data[table] = []

    # Build user_id mapping: Supabase UUID → telegram_id string
    uuid_to_telegram = {}
    for user in data["users"]:
        supabase_uuid = user.get("id")
        telegram_id = str(user.get("telegram_id", ""))
        if supabase_uuid and telegram_id:
            uuid_to_telegram[supabase_uuid] = telegram_id

    print(f"\n🔗 User ID mapping ({len(uuid_to_telegram)} users):")
    for uuid, tg_id in uuid_to_telegram.items():
        print(f"   {uuid} → {tg_id}")

    # Step 2: Import to D1
    print("\n" + "=" * 60)
    print("📤 Importing to D1...")
    print("=" * 60)

    # 2a. Users (profiles)
    print(f"\n👤 Migrating {len(data['users'])} users...")
    for user in data["users"]:
        tg_id = str(user.get("telegram_id", ""))
        if not tg_id:
            print(f"   ⚠️ Skipping user without telegram_id")
            continue
        profile_data = {
            "username": user.get("username"),
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "avatar_url": user.get("avatar_url") or user.get("photo_url"),
            "email": user.get("email"),
            "timezone": user.get("timezone", "Europe/Moscow"),
        }
        result = worker_request("PUT", "/api/profile", tg_id, profile_data)
        if result:
            print(f"   ✅ User {tg_id}: {user.get('first_name', 'N/A')}")

    # 2b. Tasks
    print(f"\n📝 Migrating {len(data['tasks'])} tasks...")
    tasks_by_user = {}
    for task in data["tasks"]:
        supabase_uid = task["user_id"]
        tg_id = uuid_to_telegram.get(supabase_uid, supabase_uid)
        tasks_by_user.setdefault(tg_id, []).append(task)

    for tg_id, user_tasks in tasks_by_user.items():
        for i in range(0, len(user_tasks), 50):
            chunk = user_tasks[i:i + 50]
            api_tasks = []
            for t in chunk:
                rec_rule = t.get("recurrence_rule")
                # recurrence_rule may already be a dict or a JSON string
                if isinstance(rec_rule, str):
                    try:
                        rec_rule = json.loads(rec_rule)
                    except:
                        pass
                api_tasks.append({
                    "title": t["title"],
                    "date": t.get("date", ""),
                    "is_completed": 1 if t.get("is_completed") else 0,
                    "is_important": 1 if t.get("is_important") else 0,
                    "has_notification": 1 if t.get("has_notification") else 0,
                    "notification_time": t.get("notification_time"),
                    "recurrence_rule": rec_rule,
                })
            result = worker_request("POST", "/api/tasks", tg_id, api_tasks)
            if result:
                print(f"   ✅ User {tg_id}: {len(chunk)} tasks imported")
            time.sleep(0.1)

    # 2c. Habits — need to track old→new ID mapping for habit_logs
    print(f"\n🔁 Migrating {len(data['habits'])} habits...")
    old_habit_to_new = {}
    for habit in data["habits"]:
        supabase_uid = habit["user_id"]
        tg_id = uuid_to_telegram.get(supabase_uid, supabase_uid)
        rec_rule = habit.get("recurrence_rule")
        if isinstance(rec_rule, str):
            try:
                rec_rule = json.loads(rec_rule)
            except:
                pass
        habit_data = {
            "title": habit["title"],
            "icon": habit.get("icon", "⭐"),
            "color": habit.get("color", "#6366f1"),
            "start_date": habit.get("start_date"),
            "end_date": habit.get("end_date"),
            "has_notification": 1 if habit.get("has_notification") else 0,
            "notification_time": habit.get("notification_time"),
            "recurrence_rule": rec_rule,
        }
        result = worker_request("POST", "/api/habits", tg_id, habit_data)
        if result:
            new_id = result.get("id", "")
            old_id = habit.get("id", "")
            old_habit_to_new[old_id] = new_id
            print(f"   ✅ Habit: {habit['title']} ({old_id} → {new_id})")

    # 2d. Habit Logs (remap habit_ids)
    print(f"\n📊 Migrating {len(data['habit_logs'])} habit logs...")
    for log in data["habit_logs"]:
        supabase_uid = log["user_id"]
        tg_id = uuid_to_telegram.get(supabase_uid, supabase_uid)
        old_habit_id = log["habit_id"]
        new_habit_id = old_habit_to_new.get(old_habit_id)

        if not new_habit_id:
            print(f"   ⚠️ Skipping log: habit {old_habit_id} not found in mapping")
            continue

        log_data = {
            "habit_id": new_habit_id,
            "completed_at": log.get("completed_at", ""),
        }
        result = worker_request("POST", "/api/habit-logs", tg_id, log_data)
        if result:
            print(f"   ✅ Log: habit {new_habit_id} on {log.get('completed_at', 'N/A')}")

    # 2e. Journal Entries
    print(f"\n📔 Migrating {len(data['journal'])} journal entries...")
    for entry in data["journal"]:
        supabase_uid = entry["user_id"]
        tg_id = uuid_to_telegram.get(supabase_uid, supabase_uid)
        entry_data = {
            "type": entry["type"],
            "content": entry["content"],
            "date": entry.get("date", ""),
        }
        result = worker_request("POST", "/api/journal", tg_id, entry_data)
        if result:
            print(f"   ✅ Journal: {entry['type']} on {entry.get('date', 'N/A')}")

    # 2f. Goals
    print(f"\n🎯 Migrating {len(data['goals'])} goals...")
    for goal in data["goals"]:
        supabase_uid = goal["user_id"]
        tg_id = uuid_to_telegram.get(supabase_uid, supabase_uid)
        goal_data = {
            "title": goal["title"],
            "description": goal.get("description"),
            "year": goal.get("year", 2026),
            "deadline": goal.get("deadline"),
        }
        result = worker_request("POST", "/api/goals", tg_id, goal_data)
        if result:
            print(f"   ✅ Goal: {goal['title']}")

    # Save mapping for reference
    with open(os.path.join(OUTPUT_DIR, "_migration_mapping.json"), "w") as f:
        json.dump({
            "uuid_to_telegram": uuid_to_telegram,
            "old_habit_to_new": old_habit_to_new,
        }, f, indent=2)

    print("\n" + "=" * 60)
    print("✅ Migration complete!")
    print(f"📁 JSON backups in: {OUTPUT_DIR}")
    print(f"📁 ID mapping: {os.path.join(OUTPUT_DIR, '_migration_mapping.json')}")
    print("=" * 60)


if __name__ == "__main__":
    migrate()
