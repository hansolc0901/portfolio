# -*- coding: utf-8 -*-
"""frontend/ 의 화면 파일과 data/portfolio.json 을 하나의 index.html 로 합칩니다.

이 파일이 하는 일은 두 가지입니다.

  1) 인쇄용 판넬 원본(31MB, CMYK)을 웹용으로 줄여 frontend/assets/ 에 저장
     → 백엔드를 켜고 볼 때 이 파일들을 그대로 내보냅니다.

  2) HTML·CSS·JS·데이터·그림을 전부 합쳐 index.html 한 개로 저장
     → 서버 없이 파일 하나만으로도 페이지가 열립니다.

수정은 frontend/ 와 data/portfolio.json 을 고친 뒤 `python build.py` 를 다시 실행하세요.
"""
import base64
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).parent
FRONTEND = ROOT / "frontend"
ASSETS = FRONTEND / "assets"
DATA_FILE = ROOT / "data" / "portfolio.json"
PANEL = ROOT / "도시숲_품앗이_최종판넬.jpg"

# 쓰임새별로 다른 해상도를 만든다.
# (같은 이미지를 원본 해상도로 여러 번 심으면 파일이 불필요하게 커진다)
PANEL_VARIANTS = [
    ("panel-card.jpg", 900, 80),   # 작업물 카드 썸네일
    ("panel-full.jpg", 2000, 80),  # 확대 뷰어
]

# frontend/index.html 안에서 바꿔 끼울 자리들이다.
# 이 문자열이 정확히 한 번씩 나와야 한다.
CSS_TAG = '<link rel="stylesheet" href="styles.css">'
DATA_TAG = '<script type="application/json" id="portfolioData">null</script>'
SCRIPT_TAGS = (
    '<script src="js/api.js"></script>\n'
    '<script src="js/render.js"></script>\n'
    '<script src="js/ui.js"></script>\n'
    '<script src="js/main.js"></script>'
)

# 합칠 때 이 순서를 지켜야 한다. (api → render → ui → main)
JS_FILES = ["api.js", "render.js", "ui.js", "main.js"]


def build_panel_assets():
    """인쇄용 판넬 원본을 웹용 크기로 줄여 frontend/assets/ 에 저장한다.

    인쇄용 CMYK 원본은 브라우저가 렌더링하지 못하므로 RGB 로 변환한다.
    """
    ASSETS.mkdir(parents=True, exist_ok=True)
    panel = Image.open(PANEL).convert("RGB")

    for filename, max_px, quality in PANEL_VARIANTS:
        resized = panel.copy()
        resized.thumbnail((max_px, max_px), Image.LANCZOS)
        resized.save(
            ASSETS / filename, "JPEG", quality=quality, optimize=True, progressive=True
        )
        print("  %s (%d px)" % (filename, max_px))


def data_uri(path):
    """그림 파일을 HTML 안에 넣을 수 있는 글자로 바꾼다."""
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return "data:image/jpeg;base64," + b64


def only_published(data):
    """초안(draft)을 빼고 공개된 작업물만 남긴 사본을 돌려준다.

    배포용 파일에는 초안이 들어가면 안 된다.
    파일을 받은 사람이 열어 보면 내용이 그대로 보이기 때문이다.
    원본 data/portfolio.json 은 건드리지 않는다.
    """
    copied = json.loads(json.dumps(data))
    projects = copied.get("projects", [])
    copied["projects"] = [p for p in projects if p.get("status") == "published"]

    hidden = len(projects) - len(copied["projects"])
    if hidden:
        print("  초안 %d건은 배포용 파일에서 제외했습니다." % hidden)

    return copied


def inline_images(data):
    """작업물 데이터의 그림 주소를 data URI 로 바꾼다.

    이 함수는 only_published 가 만든 사본을 그대로 고친다.
    """
    copied = data

    for project in copied.get("projects", []):
        media = project.get("media", {})
        for key in ("thumbSrc", "fullSrc"):
            src = media.get(key)
            if not src:
                continue
            path = FRONTEND / src
            if not path.exists():
                raise SystemExit("그림 파일이 없습니다: %s" % path)
            media[key] = data_uri(path)

    return copied


def embed_json(data):
    """데이터를 <script> 안에 안전하게 넣는다.

    내용에 </script> 가 들어 있으면 HTML 이 거기서 끊기므로 < 를 escape 한다.
    """
    text = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")
    return '<script type="application/json" id="portfolioData">%s</script>' % text


def replace_once(html, old, new, label):
    count = html.count(old)
    if count != 1:
        raise SystemExit(
            "치환 대상을 %d번 찾았습니다 (1번이어야 함): %s" % (count, label)
        )
    return html.replace(old, new)


def main():
    print("1) 판넬 이미지를 웹용으로 줄이는 중...")
    build_panel_assets()

    print("2) 단일 index.html 을 만드는 중...")
    html = (FRONTEND / "index.html").read_text(encoding="utf-8")
    css = (FRONTEND / "styles.css").read_text(encoding="utf-8")
    js = "\n\n".join(
        (FRONTEND / "js" / name).read_text(encoding="utf-8") for name in JS_FILES
    )
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))

    html = replace_once(html, CSS_TAG, "<style>\n" + css + "\n  </style>", "CSS")
    html = replace_once(html, SCRIPT_TAGS, "<script>\n" + js + "\n  </script>", "JS")
    html = replace_once(
        html, DATA_TAG, embed_json(inline_images(only_published(data))), "데이터"
    )

    out = ROOT / "index.html"
    out.write_text(html, encoding="utf-8")
    print("완료: index.html (%.2f MB)" % (out.stat().st_size / 1024 / 1024))


if __name__ == "__main__":
    main()
