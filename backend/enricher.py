import time
import requests

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"


def _parse_volume(item: dict) -> dict:
    info = item.get("volumeInfo", {})
    image_links = info.get("imageLinks", {})
    cover = image_links.get("thumbnail") or image_links.get("smallThumbnail")
    if cover:
        cover = cover.replace("http://", "https://")
    return {
        "description": info.get("description"),
        "genres": ", ".join(info.get("categories", [])) or None,
        "cover_url": cover,
        "page_count": info.get("pageCount"),
        "published_date": info.get("publishedDate"),
        "publisher": info.get("publisher"),
    }


def _get_with_retry(url: str, params: dict, max_retries: int = 3) -> dict | None:
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code == 429:
                wait = 2 ** attempt * 2
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()
        except requests.HTTPError:
            return None
        except Exception:
            return None
    return None


def fetch_by_isbn(isbn13: str) -> dict | None:
    if not isbn13:
        return None
    data = _get_with_retry(GOOGLE_BOOKS_URL, {"q": f"isbn:{isbn13}"})
    if data:
        items = data.get("items")
        if items:
            return _parse_volume(items[0])
    else:
        print(f"  Google Books ISBN lookup failed for {isbn13}")
    return None


def fetch_by_title_author(title: str, author: str) -> dict | None:
    data = _get_with_retry(GOOGLE_BOOKS_URL, {"q": f"{title}+inauthor:{author}"})
    if data:
        items = data.get("items")
        if items:
            return _parse_volume(items[0])
    else:
        print(f"  Google Books title/author lookup failed for {title}")
    return None


def enrich(isbn13: str | None, title: str, author: str, delay: float = 1.5) -> tuple[dict, bool]:
    """
    Returns (metadata_dict, used_fallback).
    metadata_dict may have None values if nothing was found.
    """
    time.sleep(delay)
    result = fetch_by_isbn(isbn13) if isbn13 else None
    used_fallback = False
    if not result:
        used_fallback = True
        time.sleep(delay)
        result = fetch_by_title_author(title, author)
    if not result:
        result = {
            "description": None,
            "genres": None,
            "cover_url": None,
            "page_count": None,
            "published_date": None,
            "publisher": None,
        }
    return result, used_fallback
