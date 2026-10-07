#!/usr/bin/env python3
"""Социальная карточка репозитория (og:image для GitHub и при шаринге).

Запуск: python3 scripts/social-preview.py
Результат: assets/social-preview.png — 1280×640, это рекомендованный размер GitHub.
Загружается вручную: репозиторий → Settings → Social preview.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 640
PAD = 72

BG = (13, 17, 23)
WHITE = (240, 246, 252)
GREY = (139, 148, 158)
ACCENT = (88, 166, 255)
GREEN = (63, 185, 80)
CHIP_BG = (22, 27, 34)
CHIP_BORDER = (48, 54, 61)

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
OUT = Path(__file__).resolve().parent.parent / "assets" / "social-preview.png"

CHIPS = ["web_search", "read_url", "map", "crawl", "extract", "verify_claim"]


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_DIR / name
    if not path.exists():  # запасной вариант, если DejaVu нет
        for candidate in (
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        ):
            if Path(candidate).exists():
                return ImageFont.truetype(candidate, size)
        return ImageFont.load_default(size)
    return ImageFont.truetype(str(path), size)


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, 8], fill=ACCENT)
    draw.rectangle([0, H - 4, W, H], fill=(22, 27, 34))

    kicker_font = font("DejaVuSans.ttf", 24)
    title = font("DejaVuSans-Bold.ttf", 68)
    sub_font = font("DejaVuSans.ttf", 30)
    chip_font = font("DejaVuSans.ttf", 24)
    foot_font = font("DejaVuSans.ttf", 24)

    kicker = "MCP SERVER  ·  SKILL  ·  AGENT-FIRST"
    line1 = "Web access for agents,"
    line2 = "Runet first."
    subtitle = "Search, read, crawl, extract by schema, verify with quotes."
    footer = "12 tools  ·  1 credit = 0.10 ₽  ·  Apache-2.0  ·  github.com/srezai-team/srezai-skill"

    draw.text((PAD, 74), kicker, font=kicker_font, fill=ACCENT)
    draw.text((PAD, 124), line1, font=title, fill=WHITE)
    draw.text((PAD, 214), line2, font=title, fill=WHITE)
    draw.text((PAD, 322), subtitle, font=sub_font, fill=GREY)

    # Чипы с именами инструментов — конкретика вместо слоганов.
    boxes = []
    x, y = PAD, 398
    for chip in CHIPS:
        width = int(draw.textlength(chip, font=chip_font)) + 44
        if x + width > W - PAD:
            x, y = PAD, y + 60
        draw.rounded_rectangle([x, y, x + width, y + 46], radius=23, fill=CHIP_BG, outline=CHIP_BORDER)
        draw.text((x + 22, y + 10), chip, font=chip_font, fill=GREEN)
        boxes.append((chip, x, y, x + width, y + 46))
        x += width + 14

    foot_y = H - 74
    draw.text((PAD, foot_y), footer, font=foot_font, fill=GREY)

    # Проверка вёрстки: картинку я не вижу, поэтому геометрия проверяется кодом.
    problems = []
    for label, text_value, f, top in (
        ("кикер", kicker, kicker_font, 74),
        ("строка 1", line1, title, 124),
        ("строка 2", line2, title, 214),
        ("подзаголовок", subtitle, sub_font, 322),
        ("подвал", footer, foot_font, foot_y),
    ):
        left, top_bbox, right, bottom = draw.textbbox((PAD, top), text_value, font=f)
        if right > W - PAD:
            problems.append(f"{label}: вылезает за правый край ({right} > {W - PAD})")
        if bottom > H - 8:
            problems.append(f"{label}: вылезает за нижний край ({bottom} > {H - 8})")
        if left < 0 or top_bbox < 0:
            problems.append(f"{label}: уходит за левый/верхний край")
    chips_bottom = max((b[4] for b in boxes), default=0)
    if chips_bottom > foot_y - 12:
        problems.append(f"чипы налезают на подвал ({chips_bottom} > {foot_y - 12})")
    if len(boxes) != len(CHIPS):
        problems.append("не все чипы нарисованы")
    title_bottom = draw.textbbox((PAD, 214), line2, font=title)[3]
    sub_top = draw.textbbox((PAD, 322), subtitle, font=sub_font)[1]
    if sub_top < title_bottom:
        problems.append(f"подзаголовок налезает на заголовок ({sub_top} < {title_bottom})")
    if problems:
        raise SystemExit("вёрстка карточки: " + "; ".join(problems))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"{OUT.relative_to(OUT.parent.parent)} — {W}×{H}, {OUT.stat().st_size // 1024} КБ")
    print(f"вёрстка ок: {len(boxes)} чипов, низ чипов {chips_bottom}, подвал начинается {foot_y}")


if __name__ == "__main__":
    main()
