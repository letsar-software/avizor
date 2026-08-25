from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3512"
CATEGORIES = {
    "heladas": ("Heladas", "Condiciones favorables", "Evolución de temperatura mínima"),
    "enfermedades_foliares": ("Enfermedades foliares", "Condiciones parcialmente favorables", "Evolución de humedad relativa"),
    "estres_hidrico": ("Estrés hídrico", "Condiciones desfavorables", "Evolución de precipitación acumulada"),
    "exceso_hidrico": ("Exceso hídrico", "Condiciones favorables", "Evolución de precipitación acumulada"),
}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for route, (title, state, chart) in CATEGORIES.items():
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(f"{BASE}/resultado/{route}", wait_until="networkidle")
        assert page.get_by_role("heading", name=title, exact=True).is_visible()
        assert page.get_by_text(state, exact=True).first.is_visible()
        assert page.get_by_role("heading", name=chart, exact=True).is_visible()
        assert page.get_by_role("heading", name="Comparación con la regla", exact=True).is_visible()
        assert page.get_by_role("navigation", name="Categorías evaluadas").is_visible()
        assert page.get_by_text("Información", exact=True).last.is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        page.screenshot(path=f"docs/screenshots/result-{route}-mobile.png", full_page=True)
        page.close()
    browser.close()

print("category result screens mobile: ok")
