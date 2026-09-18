from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3512"
CATEGORIES = {
    "heladas": "Heladas",
    "enfermedades_foliares": "Enfermedades foliares",
    "estres_hidrico": "Estrés hídrico",
    "exceso_hidrico": "Exceso hídrico",
}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for index, (route, title) in enumerate(CATEGORIES.items(), start=2):
        page = browser.new_page(viewport={"width": 390, "height": 844}, extra_http_headers={"x-real-ip": f"127.0.0.{index}"})
        page.goto(f"{BASE}/consultar", wait_until="networkidle")
        status = page.evaluate("""async () => {
            const response = await fetch("/api/public/consultas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ localidad: "Tandil, Buenos Aires", cultivo: "soja", canal: "web" }),
            });
            const payload = await response.json();
            if (response.ok) sessionStorage.setItem("avizor_resultado", JSON.stringify(payload.data));
            return response.status;
        }""")
        assert status == 201, status
        page.goto(f"{BASE}/resultado/{route}", wait_until="networkidle")
        assert page.get_by_role("heading", name=title, exact=True).is_visible()
        assert page.get_by_role("heading", name="Evolución de datos observados", exact=True).is_visible()
        assert page.get_by_role("heading", name="Comparación con la regla", exact=True).is_visible()
        assert page.get_by_role("navigation").is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        page.screenshot(path=f"docs/screenshots/result-{route}-mobile.png", full_page=True)
        page.close()
    browser.close()

print("category result screens mobile: ok")
