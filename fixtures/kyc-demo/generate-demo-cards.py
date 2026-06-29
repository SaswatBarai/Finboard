#!/usr/bin/env python3
"""Generate demo PAN and Aadhaar card PNGs for KYC testing."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = Path(__file__).resolve().parent

IDENTITIES = [
    {
        "slug": "rahul-sharma",
        "name": "Rahul Sharma",
        "father_name": "Rajesh Sharma",
        "dob": "15/08/1995",
        "pan": "ABCPS1234F",
        "aadhaar": "1112 2223 3344 45",
        "aadhaar_raw": "111222333445",
        "gender": "MALE",
        "address": "12 MG Road, Bengaluru, Karnataka - 560001",
    },
    {
        "slug": "priya-singh",
        "name": "Priya Singh",
        "father_name": "Amit Singh",
        "dob": "22/03/1998",
        "pan": "PQRPS6789K",
        "aadhaar": "2223 3344 4555 55",
        "aadhaar_raw": "222333444555",
        "gender": "FEMALE",
        "address": "45 Park Street, Mumbai, Maharashtra - 400001",
    },
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_pan_card(identity: dict, path: Path) -> None:
    width, height = 860, 540
    img = Image.new("RGB", (width, height), "#f3e6c8")
    draw = ImageDraw.Draw(img)

    title_font = load_font(28, bold=True)
    label_font = load_font(20)
    value_font = load_font(26, bold=True)
    pan_font = load_font(42, bold=True)
    small_font = load_font(16)

    draw.rectangle((0, 0, width, 72), fill="#1f3f7a")
    draw.text((28, 20), "INCOME TAX DEPARTMENT", fill="white", font=title_font)
    draw.text((28, 48), "GOVT. OF INDIA", fill="#d7e6ff", font=small_font)

    draw.text((28, 96), "Permanent Account Number Card", fill="#1f3f7a", font=label_font)
    draw.rectangle((28, 130, width - 28, 132), fill="#c9b27d")

    fields = [
        ("Name", identity["name"]),
        ("Father's Name", identity["father_name"]),
        ("Date of Birth", identity["dob"]),
    ]
    y = 150
    for label, value in fields:
        draw.text((28, y), label, fill="#5c4f38", font=label_font)
        draw.text((260, y), value, fill="#111111", font=value_font)
        y += 58

    draw.rectangle((28, 360, width - 28, 430), fill="#fff8ea", outline="#c9b27d", width=2)
    draw.text((42, 372), "PAN", fill="#5c4f38", font=label_font)
    draw.text((120, 365), identity["pan"], fill="#8b1f1f", font=pan_font)

    draw.text((28, 470), "DEMO ONLY - NOT A REAL PAN CARD", fill="#8b1f1f", font=small_font)
    draw.text((28, 498), "For Finboard KYC testing", fill="#5c4f38", font=small_font)

    img.save(path, format="PNG", optimize=True)


def draw_aadhaar_card(identity: dict, path: Path) -> None:
    width, height = 860, 540
    img = Image.new("RGB", (width, height), "#ffffff")
    draw = ImageDraw.Draw(img)

    title_font = load_font(30, bold=True)
    label_font = load_font(20)
    value_font = load_font(24, bold=True)
    aadhaar_font = load_font(40, bold=True)
    small_font = load_font(16)

    draw.rectangle((0, 0, width, 10), fill="#ff9933")
    draw.rectangle((0, 10, width, 20), fill="#ffffff")
    draw.rectangle((0, 20, width, 30), fill="#138808")

    draw.text((28, 48), "Government of India", fill="#111111", font=title_font)
    draw.text((28, 84), "Unique Identification Authority of India", fill="#444444", font=label_font)

    draw.rectangle((28, 120, 210, 280), fill="#e8edf5", outline="#9aa8bd", width=2)
    draw.text((52, 185), "PHOTO", fill="#6b7280", font=label_font)

    x = 240
    draw.text((x, 128), identity["name"], fill="#111111", font=value_font)
    draw.text((x, 168), f"DOB: {identity['dob']}", fill="#333333", font=label_font)
    draw.text((x, 202), f"Gender: {identity['gender']}", fill="#333333", font=label_font)
    draw.text((x, 236), identity["address"], fill="#333333", font=small_font)

    draw.rectangle((28, 300, width - 28, 390), fill="#f8fafc", outline="#cbd5e1", width=2)
    draw.text((42, 318), "Aadhaar No.", fill="#5c4f38", font=label_font)
    draw.text((42, 350), identity["aadhaar"], fill="#0f4c81", font=aadhaar_font)

    draw.text((28, 420), "DEMO ONLY - NOT A REAL AADHAAR CARD", fill="#8b1f1f", font=small_font)
    draw.text((28, 448), f"Raw number for form entry: {identity['aadhaar_raw']}", fill="#5c4f38", font=small_font)
    draw.text((28, 476), "For Finboard KYC testing", fill="#5c4f38", font=small_font)

    img.save(path, format="PNG", optimize=True)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for identity in IDENTITIES:
        slug = identity["slug"]
        pan_path = OUTPUT_DIR / f"{slug}-pan.png"
        aadhaar_path = OUTPUT_DIR / f"{slug}-aadhaar.png"
        draw_pan_card(identity, pan_path)
        draw_aadhaar_card(identity, aadhaar_path)
        print(f"Created {pan_path.name}")
        print(f"Created {aadhaar_path.name}")


if __name__ == "__main__":
    main()
