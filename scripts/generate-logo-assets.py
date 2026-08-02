#!/usr/bin/env python3
"""Generate the Qualifyr web lockup, favicon set and Open Graph card.

The source is the cleaned, high-resolution black lockup exported from the supplied
brand visual. Pillow is intentionally a one-off tooling dependency and is not added
to the application runtime.
"""

from __future__ import annotations

import argparse
import base64
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw


INK = (23, 21, 19)
IVORY = (245, 240, 231)
SAND = (220, 207, 189)
BRASS = (176, 138, 82)
COPPER = (139, 69, 47)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    return parser.parse_args()


def extract_monochrome(source: Image.Image) -> Image.Image:
    """Turn the near-white preview background into a smooth alpha mask."""

    luminance = source.convert("L")
    alpha = luminance.point(lambda value: max(0, min(255, round((235 - value) * 255 / 190))))
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError("The supplied source does not contain a detectable logo.")
    alpha = alpha.crop(bbox)
    result = Image.new("RGBA", alpha.size, (*INK, 0))
    result.putalpha(alpha)
    return result


def split_mark(lockup: Image.Image) -> Image.Image:
    """Use the first large vertical gap to isolate the Q from the wordmark."""

    alpha = lockup.getchannel("A")
    width, height = alpha.size
    column_weight = [sum(alpha.getpixel((x, y)) for y in range(height)) for x in range(width)]
    runs: list[tuple[int, int]] = []
    start: int | None = None
    for index, weight in enumerate(column_weight):
        if weight < 50 and start is None:
            start = index
        elif weight >= 50 and start is not None:
            runs.append((start, index - 1))
            start = None
    if start is not None:
        runs.append((start, width - 1))

    candidates = [run for run in runs if width * 0.12 < run[0] < width * 0.35]
    if not candidates:
        raise RuntimeError("Unable to isolate the monogram from the supplied lockup.")
    gap_start, _ = max(candidates, key=lambda run: run[1] - run[0])
    mark = lockup.crop((0, 0, gap_start, height))
    bbox = mark.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError("The monogram crop is empty.")
    return mark.crop(bbox)


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    return copy


def recolor(image: Image.Image, color: tuple[int, int, int], opacity: float = 1.0) -> Image.Image:
    alpha = image.getchannel("A").point(lambda value: round(value * opacity))
    result = Image.new("RGBA", image.size, (*color, 0))
    result.putalpha(alpha)
    return result


def save_icon(mark: Image.Image, path: Path, size: int) -> None:
    canvas = Image.new("RGBA", (size, size), (*INK, 255))
    fitted = contain(recolor(mark, IVORY), (round(size * 0.7), round(size * 0.72)))
    canvas.alpha_composite(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
    canvas.convert("RGB").save(path, optimize=True)


def write_embedded_svg(mark: Image.Image, path: Path) -> None:
    buffer = BytesIO()
    recolor(mark, IVORY).save(buffer, format="PNG", optimize=True)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Qualifyr Agence">
  <rect width="512" height="512" fill="#171513"/>
  <image href="data:image/png;base64,{encoded}" x="76" y="71" width="360" height="370" preserveAspectRatio="xMidYMid meet"/>
</svg>
'''
    path.write_text(svg, encoding="utf-8")


def update_open_graph(lockup: Image.Image, mark: Image.Image, path: Path) -> None:
    card = Image.open(path).convert("RGBA")
    background = card.getpixel((12, 12))[:3]
    draw = ImageDraw.Draw(card)

    # Replace the former typographic wordmark while preserving the editorial card.
    draw.rectangle((48, 74, 520, 172), fill=(*background, 255))
    lockup_small = contain(lockup, (390, 84))
    card.alpha_composite(lockup_small, (68, 82))

    # Replace the former oversized Q with the new monogram.
    draw.rectangle((730, 0, 1200, 630), fill=(*background, 255))
    mark_large = contain(recolor(mark, SAND, 0.72), (520, 565))
    card.alpha_composite(mark_large, (800, 30))
    draw.line((727, 0, 727, 630), fill=(*BRASS, 255), width=2)
    draw.ellipse((719, 440, 735, 456), fill=(*COPPER, 255))
    card.convert("RGB").save(path, optimize=True)


def main() -> None:
    args = parse_args()
    root = args.root.resolve()
    brand_dir = root / "public/images/brand"
    icon_dir = root / "public/icons"
    brand_dir.mkdir(parents=True, exist_ok=True)
    icon_dir.mkdir(parents=True, exist_ok=True)

    source = Image.open(args.source).convert("RGB")
    lockup = extract_monochrome(source)
    mark = split_mark(lockup)

    lockup.save(brand_dir / "qualifyr-lockup.png", optimize=True)
    mark.save(brand_dir / "qualifyr-mark.png", optimize=True)

    save_icon(mark, icon_dir / "qualifyr-48.png", 48)
    save_icon(mark, icon_dir / "apple-touch-icon.png", 180)
    save_icon(mark, icon_dir / "qualifyr-192.png", 192)
    save_icon(mark, icon_dir / "qualifyr-512.png", 512)
    write_embedded_svg(mark, root / "src/app/icon.svg")
    open_graph_v2 = root / "public/images/og/qualifyr-og-v2.png"
    update_open_graph(lockup, mark, open_graph_v2)
    Image.open(open_graph_v2).save(root / "public/images/og/qualifyr-og-v3.png", optimize=True)

    print(f"lockup={lockup.size} mark={mark.size}")


if __name__ == "__main__":
    main()
