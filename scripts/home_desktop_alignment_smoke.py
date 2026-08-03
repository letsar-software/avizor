from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3516"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width":1146,"height":900})
    page.goto(BASE, wait_until="networkidle")

    nav = page.get_by_role("navigation", name="Navegación principal")
    links = nav.get_by_role("link").all()
    assert len(links) == 4
    weights = [int(link.evaluate("el => getComputedStyle(el).fontWeight")) for link in links]
    assert min(weights) >= 700

    process = page.get_by_role("heading", name="¿Cómo funciona Avizor?").locator("xpath=following-sibling::div[2]")
    assert process.is_visible()
    arrows = process.locator("svg")
    assert arrows.count() == 3
    arrow_centers = [arrows.nth(i).bounding_box()["y"] + arrows.nth(i).bounding_box()["height"] / 2 for i in range(3)]
    assert max(arrow_centers) - min(arrow_centers) < 2

    technology = page.get_by_role("heading", name="Tecnología + conocimiento agronómico")
    paragraph = technology.locator("xpath=following-sibling::p")
    line_height = float(paragraph.evaluate("el => parseFloat(getComputedStyle(el).lineHeight)"))
    assert paragraph.bounding_box()["height"] <= line_height * 1.15

    footer_logo = page.locator("footer img[src*='logo-mod-avizor.png']").first
    assert footer_logo.is_visible()
    assert footer_logo.evaluate("el => getComputedStyle(el).mixBlendMode") == "screen"
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    page.screenshot(path="screenshots/home-desktop-aligned.png", full_page=True)
    browser.close()

print("home desktop alignment: ok")
