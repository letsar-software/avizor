from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:3517"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1374, "height": 900}, device_scale_factor=1)
    page.goto(f"{BASE_URL}/sobre-avizor", wait_until="networkidle")

    links = page.get_by_role("link", name="Ver perfil en LinkedIn")
    assert links.count() == 3
    link_tops = [links.nth(index).bounding_box()["y"] for index in range(3)]
    assert max(link_tops) - min(link_tops) <= 2, link_tops

    single_line_texts = [
        "Tecnología, desarrollo de producto y conocimiento agronómico trabajando juntos para transformar datos ambientales en información útil para el productor.",
        "Avizor es un proyecto en constante evolución. Combinamos datos climáticos, inteligencia artificial y reglas agronómicas validadas por especialistas para generar señales accionables que te ayuden a decidir mejor.",
    ]
    for content in single_line_texts:
        locator = page.get_by_text(content, exact=True)
        box = locator.bounding_box()
        line_height = float(locator.evaluate("element => getComputedStyle(element).lineHeight.replace('px', '')"))
        assert box["height"] <= line_height * 1.15, (content, box["height"], line_height)

    for value in ("2026", "+150", "1"):
        metric = page.get_by_text(value, exact=True).locator("xpath=../..").first
        border_width = metric.evaluate("element => getComputedStyle(element).borderLeftWidth")
        assert border_width == "0px", (value, border_width)

    overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    assert overflow <= 1, overflow

    Path("screenshots").mkdir(exist_ok=True)
    page.screenshot(path="docs/screenshots/about-desktop-aligned.png", full_page=True)
    print({"linkedin_y": link_tops, "horizontal_overflow": overflow})
    browser.close()
