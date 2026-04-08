import os

def create_report():
    base_dir = r"c:\Users\shahi\SeekRight"
    files_to_include = [
        ("Database config", r"backend\app\database.py", "python"),
        ("Models", r"backend\app\models.py", "python"),
        ("Schemas", r"backend\app\schemas.py", "python"),
        ("Main Application", r"backend\app\main.py", "python"),
        ("Auth Router", r"backend\app\routers\auth.py", "python"),
        ("Query Router", r"backend\app\routers\query.py", "python"),
        ("Session Router", r"backend\app\routers\session.py", "python"),
        ("Session Service", r"backend\app\services\session_service.py", "python"),
        ("Subject Service", r"backend\app\services\subject_service.py", "python"),
        ("Alembic Config", r"backend\alembic.ini", "ini"),
        ("Alembic Env", r"backend\alembic\env.py", "python"),
        ("Frontend Strict UI", r"frontend\index.html", "html")
    ]
    
    import subprocess
    try:
        tree_output = subprocess.check_output('tree /A /F', shell=True, cwd=base_dir, stderr=subprocess.STDOUT).decode('utf-8')
    except Exception as e:
        tree_output = str(e)
        
    md_content = "# SeekRight - Hardened Ingestion Engine Handover Report\n\n"
    md_content += "## 1. Directory Structure\n```text\n" + tree_output + "\n```\n\n"
    
    plan_path = r"C:\Users\shahi\.gemini\antigravity\brain\21b84520-1b99-495f-a9f3-31f62da38d05\implementation_plan.md"
    if os.path.exists(plan_path):
        with open(plan_path, 'r', encoding='utf-8') as f:
            md_content += "## 2. Implemented Hardening Plans\n\n" + f.read() + "\n\n"
            
    walk_path = r"C:\Users\shahi\.gemini\antigravity\brain\21b84520-1b99-495f-a9f3-31f62da38d05\walkthrough.md"
    if os.path.exists(walk_path):
        with open(walk_path, 'r', encoding='utf-8') as f:
            md_content += "## 3. Verification & Work Completed\n\n" + f.read() + "\n\n"
            
    md_content += "## 4. Full Hardened Source Code\n\n"
    for title, rel_path, lang in files_to_include:
        full_path = os.path.join(base_dir, rel_path)
        if os.path.exists(full_path):
            with open(full_path, 'r', encoding='utf-8') as f:
                code = f.read()
            md_content += f"### {title} (`{rel_path}`)\n"
            if lang:
                md_content += f"```{lang}\n{code}\n```\n\n"
            else:
                md_content += f"{code}\n\n"
        else:
            md_content += f"### {title}\n*File {rel_path} not found*\n\n"

    output_md = r"C:\Users\shahi\.gemini\antigravity\brain\21b84520-1b99-495f-a9f3-31f62da38d05\final_handover_report.md"
    with open(output_md, "w", encoding='utf-8') as f:
        f.write(md_content)
        
    print(f"Text report generated successfully at {output_md}")

if __name__ == "__main__":
    create_report()
