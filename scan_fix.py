import pathlib, re
roots = [pathlib.Path("resources/js"), pathlib.Path("app")]
# patterns
for root in roots:
    for p in sorted(root.rglob("*.tsx")):
        text = p.read_text(encoding="utf-8", errors="ignore")
        for i, line in enumerate(text.splitlines(), 1):
            if re.search(r"\bMapel\b", line) or re.search(r"\bmapel\b", line):
                # check if line contains code identifiers only? We want UI
                # Consider UI if line has quotes or JSX text or label/placeholder/toast
                has_ui = False
                # quoted UI: contains '...Mapel...' with spaces
                for m in re.finditer(r"""(['"`])(.*?)\1""", line):
                    q = m.group(2)
                    if re.search(r"\bMapel\b", q) or re.search(r"\bmapel\b", q):
                        # skip pure param strings like 'mapel_ids[]' which is 'mapel_ids' with underscore -> \bMapel\b won't match, so skip
                        # But if quoted contains Mapel as standalone word, it's UI
                        if re.search(r"\bMapel\b", q) or re.search(r"\bmapel\b", q.lower()):
                            # Ensure not just code like "mapel" alone lower? But 'Pilih Mapel' should count
                            # Filter out exact 'mapel' with no spaces and length <10? Actually 'Pilih Mapel' length 12
                            # Keep all
                            has_ui = True
                if re.search(r">[^<]*\bMapel\b[^<]*<", line) or re.search(r">[^<]*\bmapel\b[^<]*<", line, re.IGNORECASE):
                    has_ui = True
                if "placeholder" in line.lower() and "mapel" in line.lower():
                    has_ui = True
                if "label" in line.lower() and "mapel" in line.lower():
                    has_ui = True
                if has_ui:
                    print(f"UI {p}:{i}: {line.strip()}")
                else:
                    # also print code for reference but mark
                    # print(f"CODE {p}:{i}: {line.strip()}")
                    pass
# check Export Excel
print("--- Export Excel ---")
for p in sorted(pathlib.Path("resources/js").rglob("*.tsx")):
    text = p.read_text(encoding="utf-8", errors="ignore")
    for i, line in enumerate(text.splitlines(), 1):
        if "Export Excel" in line or "Ekspor Excel" in line:
            print(f"{p}:{i}: {line.strip()}")
# check Belum ada mapel
print("--- belum ada ---")
for p in sorted(pathlib.Path("resources/js").rglob("*.tsx")):
    text = p.read_text(encoding="utf-8", errors="ignore")
    for i, line in enumerate(text.splitlines(), 1):
        if re.search(r"Belum ada.*mapel", line, re.I):
            print(f"{p}:{i}: {line.strip()}")
