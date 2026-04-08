import sqlite3

def find_completed_session():
    conn = sqlite3.connect('seekright.db')
    cursor = conn.cursor()
    cursor.execute("SELECT session_id FROM sessions WHERE processing_status = 'COMPLETED' LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        print(row[0])
    else:
        print("None")

if __name__ == "__main__":
    find_completed_session()
