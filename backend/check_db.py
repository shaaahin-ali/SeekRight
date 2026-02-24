import sqlite3

def check_db():
    try:
        conn = sqlite3.connect('seekright.db')
        cursor = conn.cursor()
        
        # Check columns of SESSIONS table
        cursor.execute("PRAGMA table_info(SESSIONS)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Columns in SESSIONS: {columns}")
        
        if 'processing_status' not in columns:
            print("Missing processing_status. Dropping and recreating tables...")
            cursor.execute("DROP TABLE IF EXISTS TRANSCRIPT_CHUNKS")
            cursor.execute("DROP TABLE IF EXISTS TRANSCRIPTS")
            cursor.execute("DROP TABLE IF EXISTS SESSIONS")
            cursor.execute("DROP TABLE IF EXISTS SUBJECTS")
            cursor.execute("DROP TABLE IF EXISTS USERS")
            conn.commit()
            print("Tables dropped. Restarting app will recreate them.")
        else:
            print("Schema is correct.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
