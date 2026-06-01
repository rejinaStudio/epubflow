import os
import shutil

# 환경변수 > shutil.which > 알려진 Windows 경로 순으로 탐색
_CANDIDATES = [
    os.environ.get("PANDOC_PATH"),
    shutil.which("pandoc"),
    os.path.join(
        os.environ.get("LOCALAPPDATA", ""),
        "Microsoft", "WinGet", "Packages",
        "JohnMacFarlane.Pandoc_Microsoft.Winget.Source_8wekyb3d8bbwe",
        "pandoc-3.9.0.2", "pandoc.exe",
    ),
    r"C:\Program Files\Pandoc\pandoc.exe",
]

PANDOC = next((p for p in _CANDIDATES if p and os.path.exists(p)), "pandoc")
