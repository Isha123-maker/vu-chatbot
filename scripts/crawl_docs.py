import os
import re
import time
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.robotparser import RobotFileParser

import requests
import urllib3
from bs4 import BeautifulSoup

DATA_DIR = "data"
MAX_PAGES = 15       # hard cap per start URL
MAX_DEPTH = 1        # 0 = only the start page, 1 = start page + pages it links to
MIN_CHARS = 300
DELAY_SECONDS = 1
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
SKIP_EXT = (".pdf", ".jpg", ".jpeg", ".png", ".gif", ".zip", ".doc", ".docx", ".xls", ".xlsx", ".mp4")

START_URLS = [
    {"url": "https://handbook.vu.edu.pk/", "folder": "handbook"},
    {"url": "https://www.vu.edu.pk/admissions/admissionprocedure", "folder": "admissions"},
    {"url": "https://www.vu.edu.pk/StudyScheme/StudyScheme", "folder": "academics"},
    {"url": "https://www.vu.edu.pk/faqs/faqs", "folder": "support"},
]


def get_page(url):
    try:
        return requests.get(url, headers=HEADERS, timeout=20)
    except requests.exceptions.SSLError:
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        return requests.get(url, headers=HEADERS, timeout=20, verify=False)


def load_robots(start_url):
    parts = urlparse(start_url)
    robots_url = f"{parts.scheme}://{parts.netloc}/robots.txt"
    rp = RobotFileParser()
    try:
        r = get_page(robots_url)
        if r.status_code == 200:
            rp.parse(r.text.splitlines())
        else:
            rp.parse([])  # no robots.txt = everything allowed
    except requests.exceptions.RequestException:
        print("  Could not read robots.txt, continuing carefully.")
        rp.parse([])
    return rp


def clean_html(soup):
    for tag in soup(["script", "style", "noscript", "nav", "header", "footer"]):
        tag.decompose()
    lines = [l.strip() for l in soup.get_text(separator="\n").splitlines() if l.strip()]
    out = []
    for line in lines:
        if not out or line != out[-1]:
            out.append(line)
    return "\n".join(out)


def make_filename(url):
    path = urlparse(url).path.strip("/") or "home"
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", path).strip("_").lower()
    return (slug[:80] or "page") + ".txt"


def crawl(start_url, folder):
    domain = urlparse(start_url).netloc
    rp = load_robots(start_url)
    out_dir = os.path.join(DATA_DIR, folder)
    os.makedirs(out_dir, exist_ok=True)

    queue = [(start_url, 0)]
    seen = {start_url}
    saved = 0

    while queue and saved < MAX_PAGES:
        url, depth = queue.pop(0)

        if not rp.can_fetch(HEADERS["User-Agent"], url):
            print(f"  Blocked by robots.txt, skipping: {url}")
            continue

        print(f"  Fetching (depth {depth}): {url}")
        try:
            resp = get_page(url)
            resp.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"    Failed: {e}")
            continue

        if "text/html" not in resp.headers.get("Content-Type", ""):
            continue
        if resp.encoding is None or resp.encoding.lower() == "iso-8859-1":
            resp.encoding = resp.apparent_encoding

        soup = BeautifulSoup(resp.text, "html.parser")

        # collect links BEFORE clean_html removes nav/menus
        if depth < MAX_DEPTH:
            for a in soup.find_all("a", href=True):
                link, _ = urldefrag(urljoin(url, a["href"]))
                if (urlparse(link).netloc == domain
                        and link not in seen
                        and not link.lower().endswith(SKIP_EXT)
                        and link.startswith("http")):
                    seen.add(link)
                    queue.append((link, depth + 1))

        text = clean_html(soup)
        if len(text) >= MIN_CHARS:
            path = os.path.join(out_dir, make_filename(url))
            with open(path, "w", encoding="utf-8") as f:
                f.write(f"Source: {url}\n\n{text}\n")
            saved += 1
            print(f"    Saved {len(text)} chars -> {path}")
        else:
            print("    Too little text, not saved.")

        time.sleep(DELAY_SECONDS)

    return saved


if __name__ == "__main__":
    total = 0
    for item in START_URLS:
        print(f"\nStarting: {item['url']}")
        total += crawl(item["url"], item["folder"])
    print(f"\nDone. Saved {total} pages in total.")