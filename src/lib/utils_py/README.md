# utils_py

Python utility scripts for text extraction and data preparation.
These live here temporarily — the plan is to move them to the BE once the
extraction pipeline is implemented server-side.

## Scripts

### `extract_wiki.py`

Strips Wikipedia HTML files down to clean article text (headings + paragraphs).

**Requires:** `pip install beautifulsoup4`

```bash
# Extract all .html files in a directory → combined .txt
python extract_wiki.py \
  --input-dir "/path/to/html/files" \
  --output combined.txt
```

```python
# Or import the function directly
from extract_wiki import extract_wiki_text, extract_wiki_dir

text = extract_wiki_text("Napoleon.html")
combined = extract_wiki_dir("/path/to/html/files")
```

---

### `gen_ts_sample.py`

Wraps a plain-text file in a TypeScript exported template-literal constant.
Used to produce `src/lib/data/napoleonSample.ts` from the extracted text.

**Requires:** stdlib only

```bash
python gen_ts_sample.py \
  --input combined.txt \
  --output ../../lib/data/napoleonSample.ts \
  --export-name napoleonSampleText
```

```python
from gen_ts_sample import text_to_ts_const

ts_code = text_to_ts_const(plain_text, export_name="napoleonSampleText")
```

---

## Full pipeline (re-run when source HTML changes)

```bash
cd src/lib/utils_py

python extract_wiki.py \
  --input-dir "/path/to/napoleon/html" \
  --output /tmp/wiki_combined.txt

python gen_ts_sample.py \
  --input /tmp/wiki_combined.txt \
  --output ../data/napoleonSample.ts \
  --export-name napoleonSampleText
```

## BE migration path

When extraction moves to the backend:

1. Copy `extract_wiki.py` into the BE codebase (works as-is for FastAPI/Flask).
2. Expose an endpoint e.g. `GET /knowledge/sample?name=napoleon` that returns
   the plain text.
3. Replace the "Load sample ↓" button in `KnowledgeWizard.svelte` with a fetch
   call to that endpoint.
4. Delete `gen_ts_sample.py` and `src/lib/data/napoleonSample.ts` — they are
   only needed while the data is baked into the frontend bundle.
