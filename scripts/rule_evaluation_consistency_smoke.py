import json

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:3521"
RESULT = {
    "estado_general": "Atención recomendada",
    "confianza": "Alta",
    "dias_datos": 14,
    "categorias": [
        {
            "nombre": "enfermedades_foliares",
            "condicion": "moderada",
            "causas": [],
            "recomendacion": "Monitorear el lote.",
            "regla_version": "v1.0",
        }
    ],
    "share_token": "smoke",
}


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE_URL}/resultado", wait_until="networkidle")
    page.evaluate("value => sessionStorage.setItem('avizor_resultado', value)", json.dumps(RESULT))
    page.reload(wait_until="networkidle")

    summary_section = page.get_by_role("heading", name="¿Cómo evaluó Avizor esta regla?").locator("xpath=..")
    summary_card = summary_section.locator("article").first
    summary_style = summary_card.evaluate(
        "element => ({fontSize:getComputedStyle(element).fontSize, padding:getComputedStyle(element).padding})"
    )

    detail = browser.new_page(viewport={"width": 1440, "height": 1000})
    detail.goto(f"{BASE_URL}/resultado/enfermedades_foliares", wait_until="networkidle")
    detail_section = detail.get_by_role("heading", name="¿Cómo evaluó Avizor esta regla?").locator("xpath=..")
    detail_card = detail_section.locator("article").first
    detail_style = detail_card.evaluate(
        "element => ({fontSize:getComputedStyle(element).fontSize, padding:getComputedStyle(element).padding})"
    )

    assert summary_style == detail_style, (summary_style, detail_style)
    assert summary_section.get_by_text("+", exact=True).count() == 2
    assert summary_section.get_by_text("=", exact=True).count() == 1
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    browser.close()

print("Rule evaluation styles match category detail")
