#!/usr/bin/env python3
"""Convert a scrollmapper-format Bible JSON file into the per-book files the app loads.

Usage: python3 scripts/build-bible.py [path/to/KJV.json]
If no path is given, the KJV is downloaded from the scrollmapper/bible_databases repository.

Output: public/bible/kjv/books.json plus one file per book (GEN.json ... REV.json).
"""
import json, os, re, sys, tempfile, urllib.request

SOURCE_URL = "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/KJV.json"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "bible", "kjv")

# id, display name, abbreviation shown when the full name would wrap, spoken name for the voice
BOOKS = [
    ("GEN", "Genesis", "Gen.", None), ("EXO", "Exodus", "Exod.", None), ("LEV", "Leviticus", "Lev.", None),
    ("NUM", "Numbers", "Num.", None), ("DEU", "Deuteronomy", "Deut.", None), ("JOS", "Joshua", "Josh.", None),
    ("JDG", "Judges", "Judg.", None), ("RUT", "Ruth", "Ruth", None), ("1SA", "1 Samuel", "1 Sam.", None),
    ("2SA", "2 Samuel", "2 Sam.", None), ("1KI", "1 Kings", "1 Kings", None), ("2KI", "2 Kings", "2 Kings", None),
    ("1CH", "1 Chronicles", "1 Chron.", None), ("2CH", "2 Chronicles", "2 Chron.", None), ("EZR", "Ezra", "Ezra", None),
    ("NEH", "Nehemiah", "Neh.", None), ("EST", "Esther", "Esth.", None), ("JOB", "Job", "Job", "Jobe"),
    ("PSA", "Psalms", "Psalms", None), ("PRO", "Proverbs", "Prov.", None), ("ECC", "Ecclesiastes", "Eccles.", None),
    ("SNG", "Song of Solomon", "Song of Sol.", None), ("ISA", "Isaiah", "Isa.", None), ("JER", "Jeremiah", "Jer.", None),
    ("LAM", "Lamentations", "Lament.", None), ("EZK", "Ezekiel", "Ezek.", None), ("DAN", "Daniel", "Dan.", None),
    ("HOS", "Hosea", "Hos.", None), ("JOL", "Joel", "Joel", None), ("AMO", "Amos", "Amos", None),
    ("OBA", "Obadiah", "Obad.", None), ("JON", "Jonah", "Jonah", None), ("MIC", "Micah", "Micah", None),
    ("NAM", "Nahum", "Nahum", None), ("HAB", "Habakkuk", "Hab.", None), ("ZEP", "Zephaniah", "Zeph.", None),
    ("HAG", "Haggai", "Hag.", None), ("ZEC", "Zechariah", "Zech.", None), ("MAL", "Malachi", "Mal.", None),
    ("MAT", "Matthew", "Matt.", None), ("MRK", "Mark", "Mark", None), ("LUK", "Luke", "Luke", None),
    ("JHN", "John", "John", None), ("ACT", "Acts", "Acts", None), ("ROM", "Romans", "Rom.", None),
    ("1CO", "1 Corinthians", "1 Cor.", None), ("2CO", "2 Corinthians", "2 Cor.", None), ("GAL", "Galatians", "Gal.", None),
    ("EPH", "Ephesians", "Eph.", None), ("PHP", "Philippians", "Phil.", None), ("COL", "Colossians", "Col.", None),
    ("1TH", "1 Thessalonians", "1 Thess.", None), ("2TH", "2 Thessalonians", "2 Thess.", None), ("1TI", "1 Timothy", "1 Tim.", None),
    ("2TI", "2 Timothy", "2 Tim.", None), ("TIT", "Titus", "Titus", None), ("PHM", "Philemon", "Philem.", None),
    ("HEB", "Hebrews", "Heb.", None), ("JAS", "James", "James", None), ("1PE", "1 Peter", "1 Pet.", None),
    ("2PE", "2 Peter", "2 Pet.", None), ("1JN", "1 John", "1 John", None), ("2JN", "2 John", "2 John", None),
    ("3JN", "3 John", "3 John", None), ("JUD", "Jude", "Jude", None), ("REV", "Revelation", "Rev.", None),
]

def clean(text):
    text = text.replace("¶", " ")            # pilcrow paragraph marks
    text = re.sub(r"\{[^}]*\}", "", text)          # Strong's numbers or notes in braces, if present
    text = re.sub(r"[\[\]]", "", text)             # italics brackets
    text = re.sub(r"\s+", " ", text).strip()
    return text

def main():
    if len(sys.argv) > 1:
        src = sys.argv[1]
    else:
        src = os.path.join(tempfile.gettempdir(), "KJV.json")
        if not os.path.exists(src):
            print("downloading", SOURCE_URL)
            urllib.request.urlretrieve(SOURCE_URL, src)
    data = json.load(open(src, encoding="utf-8"))
    books = data["books"]
    assert len(books) == 66, "expected 66 books, got %d" % len(books)
    os.makedirs(OUT_DIR, exist_ok=True)
    meta = []
    for (bid, name, short, spoken), book in zip(BOOKS, books):
        chapters = []
        for ch in book["chapters"]:
            verses = [clean(v["text"]) for v in ch["verses"]]
            assert all(verses), "empty verse in %s %s" % (name, ch["chapter"])
            chapters.append(verses)
        with open(os.path.join(OUT_DIR, bid + ".json"), "w", encoding="utf-8") as f:
            json.dump({"id": bid, "name": name, "chapters": chapters}, f, ensure_ascii=False, separators=(",", ":"))
        meta.append({"id": bid, "name": name, "short": short, "spoken": spoken or name,
                     "testament": "OT" if len(meta) < 39 else "NT", "chapters": len(chapters)})
    with open(os.path.join(OUT_DIR, "books.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))
    total = sum(b["chapters"] for b in meta)
    print("wrote %d books, %d chapters to %s" % (len(meta), total, os.path.normpath(OUT_DIR)))

if __name__ == "__main__":
    main()
