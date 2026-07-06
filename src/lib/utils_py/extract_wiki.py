"""
Wikipedia HTML → plain text extractor.

Purpose
-------
Strips Wikipedia page HTML down to readable article text (headings + paragraphs),
removing navigation, infoboxes, reference lists, navboxes, tables, etc.

Dependencies
------------
    pip install beautifulsoup4

Usage — as a standalone script
-------------------------------
    python extract_wiki.py --input-dir /path/to/html/files --output /path/to/output.txt

    The script reads every *.html file in --input-dir, extracts the article text
    from each one, and writes them concatenated (separated by "---") to --output.

Usage — as a library (import into a BE service)
------------------------------------------------
    from extract_wiki import extract_wiki_text, extract_wiki_dir

    # Single file
    text = extract_wiki_text("/path/to/Napoleon.html")

    # Whole directory
    combined = extract_wiki_dir("/path/to/html/files")

Planned BE migration
--------------------
This script is a preparation step before moving the extraction logic to the
backend.  On the BE side it can be called:
  - as a subprocess invoked per upload
  - imported directly into a Python BE (FastAPI/Flask)
  - rewritten to accept raw HTML bytes instead of file paths (swap
    `open(fpath)` for `BeautifulSoup(html_bytes, "html.parser")`)
"""

import os
import re
import sys
import argparse
from bs4 import BeautifulSoup, Comment

sys.stdout.reconfigure(encoding="utf-8")

# Classes that identify non-article content to remove
_SKIP_CLASSES = re.compile(
    r"navbox|reflist|reference|infobox|sidebar|hatnote|mw-editsection|"
    r"noprint|shortdescription|gallery|thumb|mw-references|catlinks|"
    r"toc|navigation-not-searchable|wikitable|ambox|tmbox"
)

# Leading phrases that indicate navigation noise rather than article text
_NAV_PREFIXES = ("Jump to", "Main menu", "move to sidebar", "hide", "Navigation")


def extract_wiki_text(fpath: str) -> str:
    """
    Extract plain article text from a saved Wikipedia HTML file.

    Wikipedia saves two divs with class "mw-parser-output": a small indicator
    div and the actual article div.  We pick the one with the most <p> children.

    Args:
        fpath: Absolute or relative path to the .html file.

    Returns:
        Clean plain text with == Section == headings and paragraph lines,
        or an empty string if no article content was found.
    """
    with open(fpath, "r", encoding="utf-8", errors="replace") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # Pick the content div with the most paragraph children (skips the small
    # indicator div that also carries the mw-parser-output class)
    candidates = soup.find_all("div", class_="mw-parser-output")
    content = max(candidates, key=lambda c: len(c.find_all("p")), default=None)

    if not content:
        content = soup.find("div", {"id": "mw-content-text"})
    if not content:
        return ""

    # Strip tags that contribute no article text
    for tag in content.find_all(["script", "style", "sup", "figure", "noscript"]):
        tag.decompose()

    for tag in content.find_all(attrs={"class": _SKIP_CLASSES}):
        tag.decompose()

    for tag in content.find_all("table"):
        tag.decompose()

    for comment in content.find_all(string=lambda t: isinstance(t, Comment)):
        comment.extract()

    # Walk headings and paragraphs in document order
    parts = []
    for tag in content.find_all(["h1", "h2", "h3", "h4", "p"]):
        text = tag.get_text(separator=" ", strip=True)
        text = re.sub(r"\[[\d\w]+\]", "", text)   # remove citation markers [1], [a]
        text = re.sub(r"\s+", " ", text).strip()
        if not text or len(text) < 15:
            continue
        if text.startswith(_NAV_PREFIXES):
            continue
        if tag.name in ("h1", "h2", "h3", "h4"):
            parts.append(f"\n\n== {text} ==\n")
        else:
            parts.append(text)

    return "\n".join(parts)


def extract_wiki_dir(directory: str) -> str:
    """
    Extract text from all *.html files in a directory and return them
    concatenated with "---" separators.

    Args:
        directory: Path to the directory containing Wikipedia HTML files.

    Returns:
        Combined plain text string.
    """
    outputs = []
    for fname in sorted(os.listdir(directory)):
        if not fname.endswith(".html"):
            continue
        fpath = os.path.join(directory, fname)
        title = fname.replace(".html", "")
        text = extract_wiki_text(fpath)
        outputs.append(f"# {title}\n\n{text.strip()}")
        print(f"  {title}: {len(text):,} chars", file=sys.stderr)

    return "\n\n---\n\n".join(outputs)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract plain text from Wikipedia HTML files.")
    parser.add_argument("--input-dir", required=True, help="Directory containing *.html files")
    parser.add_argument("--output", required=True, help="Path to write the combined .txt output")
    args = parser.parse_args()

    print(f"Extracting from: {args.input_dir}", file=sys.stderr)
    combined = extract_wiki_dir(args.input_dir)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(combined)

    print(f"Written {len(combined):,} chars → {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
