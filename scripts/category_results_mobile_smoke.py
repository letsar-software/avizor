from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3512"
CATEGORIES = ["heladas", "enfermedades_foliares", "estres_hidrico", "exceso_hidrico"]

with sync_playwright() as p:
    browser = p.chromium.launch()
    for route in CATEGORIES:
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(f"{BASE}/resultado/{route}", wait_until="networkidle")
        assert page.get_by_role("heading", name="Necesitamos una consulta actualizada").is_visible()
        assert page.get_by_role("link", name="Realizar consulta").is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        page.screenshot(path=f"docs/screenshots/result-{route}-mobile.png", full_page=True)
        page.close()
    browser.close()

print("category result screens mobile: ok")
