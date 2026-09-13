import pathlib, re
roots = ["resources/js", "app/Http/Controllers"]
patterns = []
for root_str in roots:
    root = pathlib.Path(root_str)
    for p in root.rglob("*.tsx"):
        text = p.read_text(encoding="utf-8", errors="ignore")
        for i, line in enumerate(text.splitlines(), 1):
            if re.search(r"\bMapel\b", line):
                # check if inside quoted string with UI
                has_quoted_ui = False
                for m in re.finditer(r"""(['"`])(.*?)\1""", line):
                    q = m.group(2)
                    if re.search(r"\bMapel\b", q):
                        # skip if quoted is exactly code param like 'mapel_ids[]' or 'mapel_id' or 'nama_mapel' -> those contain underscore, \bMapel\b would not match, so already skipped
                        # But if quoted is 'Mapel' word standalone, it's UI
                        # filter out false positives where quoted is code like "mapel" alone lowercase? but \bMapel\b capital won't match
                        has_quoted_ui = True
                        break
                has_jsx_ui = bool(re.search(r">[^<]*\bMapel\b[^<]*<", line))
                if has_quoted_ui or has_jsx_ui:
                    print(f"UI {p}:{i}: {line.strip()}")
                elif "placeholder" in line.lower() and "mapel" in line.lower():
                    if re.search(r"\bMapel\b", line):
                        print(f"PLACE {p}:{i}: {line.strip()}")
for p in pathlib.Path("app").rglob("*.php"):
    text = p.read_text(encoding="utf-8", errors="ignore")
    for i, line in enumerate(text.splitlines(), 1):
        if re.search(r"\bMapel\b", line):
            has_quoted_ui = False
            for m in re.finditer(r"""(['"`])(.*?)\1""", line):
                q = m.group(2)
                if re.search(r"\bMapel\b", q):
                    has_quoted_ui = True
                    break
            has_html_ui = bool(re.search(r">[^<]*\bMapel\b[^<]*<", line))
            if has_quoted_ui or has_html_ui:
                print(f"PHP_UI {p}:{i}: {line.strip()}")

# also check lower case mapel UI patterns like "mapel dipilih", "mapel relevan", "Cari mapel"
for root_str in roots:
    root = pathlib.Path(root_str)
    for p in root.rglob("*.tsx"):
        text = p.read_text(encoding="utf-8", errors="ignore")
        for i, line in enumerate(text.splitlines(), 1):
            if re.search(r"\bmapel\b", line):
                # lower case UI usually inside quoted or jsx
                has_quoted = False
                for m in re.finditer(r"""(['"`])(.*?)\1""", line):
                    q = m.group(2)
                    if re.search(r"\bmapel\b", q, re.I):
                        # skip param strings like 'mapel_ids[]'
                        if re.search(r"mapel_", q):
                            continue
                        if q.strip().lower() in ["mapel"]:
                            has_quoted = True
                        elif "mapel" in q.lower() and re.search(r"\bmapel\b", q, re.I):
                            # check if q contains UI phrase like "mapel dipilih" or "Cari mapel"
                            if re.search(r"mapel dipilih|Cari mapel|Belum ada mapel", q, re.I):
                                has_quoted = True
                has_jsx = bool(re.search(r">[^<]*\bmapel\b[^<]*<", line, re.I))
                if has_quoted or ("mapel" in line.lower() and has_jsx):
                    # already captured capital, skip duplicate
                    if re.search(r"\bMapel\b", line):
                        continue
                    print(f"UI_low {p}:{i}: {line.strip()}")
