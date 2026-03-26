import importlib
import sys

required = [
    "fastapi",
    "uvicorn",
    "sqlalchemy",
    "sentence_transformers",
    "faiss",
    "whisper",
    "yt_dlp",
    "numpy",
    "watchfiles",
    "pydantic"
]

missing = []

for lib in required:
    try:
        importlib.import_module(lib)
        print(f"✅ {lib} is installed")
    except ImportError:
        missing.append(lib)
        print(f"❌ {lib} is NOT installed")

if missing:
    print(f"\nMissing packages: {', '.join(missing)}")
    print(f"Run: venv\\Scripts\\pip install {' '.join(missing)}")
    sys.exit(1)
else:
    print("\nAll required packages are installed.")
    sys.exit(0)
