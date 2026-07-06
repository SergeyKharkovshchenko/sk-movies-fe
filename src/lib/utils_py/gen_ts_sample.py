"""
Plain text → TypeScript string-constant generator.

Purpose
-------
Takes a plain-text file (typically produced by extract_wiki.py) and wraps its
content in an exported TypeScript template-literal constant, ready to be
imported into a Svelte/TS frontend.

This is a transitional helper: once text extraction moves to the BE, the
frontend will fetch the sample text via an API endpoint instead.

Dependencies
------------
    None (stdlib only)

Usage — as a standalone script
-------------------------------
    python gen_ts_sample.py \
        --input  /path/to/combined.txt \
        --output /path/to/src/lib/data/mySample.ts \
        --export-name mySampleText

    Produces:
        export const mySampleText = `...content...`;

Usage — as a library
---------------------
    from gen_ts_sample import text_to_ts_const

    ts_code = text_to_ts_const(plain_text, export_name="napoleonSampleText")
    with open("napoleonSample.ts", "w", encoding="utf-8") as f:
        f.write(ts_code)

Planned BE migration
--------------------
When extraction moves to the BE, this script becomes unnecessary for runtime
use.  The BE would expose an endpoint like:

    GET /knowledge/sample?name=napoleon

that returns the plain text directly.  The frontend's "Load sample" button
would then call that endpoint instead of importing a TS constant.

Until then, re-run this script whenever the source HTML files are updated:

    python extract_wiki.py --input-dir ./napoleon --output combined.txt
    python gen_ts_sample.py --input combined.txt \
        --output ../../src/lib/data/napoleonSample.ts \
        --export-name napoleonSampleText
"""

import argparse
import sys


def text_to_ts_const(text: str, export_name: str = "sampleText") -> str:
    """
    Wrap *text* in a TypeScript exported template-literal constant.

    Escapes backticks and `${` sequences so the string is safe inside a
    JS/TS template literal.

    Args:
        text:        The raw plain-text content.
        export_name: The name of the exported TS constant.

    Returns:
        A string containing the full TypeScript source (no trailing newline
        beyond the closing backtick line).
    """
    escaped = (
        text
        .replace("\\", "\\\\")   # backslash first to avoid double-escaping
        .replace("`", "\\`")      # backtick would close the template literal
        .replace("${", "\\${")   # template expression opener
    )
    return f"export const {export_name} = `{escaped}`;\n"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert a plain-text file into a TypeScript string constant."
    )
    parser.add_argument("--input", required=True, help="Path to the .txt source file")
    parser.add_argument("--output", required=True, help="Path to write the .ts output file")
    parser.add_argument(
        "--export-name",
        default="sampleText",
        help="Name of the exported TS constant (default: sampleText)",
    )
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        text = f.read()

    ts_code = text_to_ts_const(text, export_name=args.export_name)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(ts_code)

    print(f"Written {len(ts_code):,} chars → {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
