import sqlite3
from datetime import datetime

def seed_raw():
    try:
        conn = sqlite3.connect('seekright.db')
        cursor = conn.cursor()
        
        # Insert User 123 if not exists
        cursor.execute("INSERT OR IGNORE INTO USERS (user_id, name, role, email, created_at) VALUES (?, ?, ?, ?, ?)",
                       (123, "Test Developer", "teacher", "dev@example.com", datetime.utcnow().isoformat()))
        
        # Insert User 1 if not exists (for user's testing)
        cursor.execute("INSERT OR IGNORE INTO USERS (user_id, name, role, email, created_at) VALUES (?, ?, ?, ?, ?)",
                       (1, "Default Teacher", "teacher", "teacher1@example.com", datetime.utcnow().isoformat()))
        
        # Insert Subject if not exists
        cursor.execute("INSERT OR IGNORE INTO SUBJECTS (subject_id, subject_name, description, created_at) VALUES (?, ?, ?, ?)",
                       (1, "Deep Learning", "CS50 AI", datetime.utcnow().isoformat()))
        
        conn.commit()
        print("Raw Seed Success: User 123 and Subject 1 created.")
        conn.close()
    except Exception as e:
        print(f"Error seeding: {e}")

if __name__ == "__main__":
    seed_raw()
