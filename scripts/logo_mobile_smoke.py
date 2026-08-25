from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3513"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(BASE, wait_until="networkidle")
    logos = page.locator('img[src*="logo-avizor.png"]')
    assert logos.count() >= 2
    assert logos.first.is_visible()
    page.screenshot(path="docs/screenshots/logo-new-mobile.png", full_page=True)

    desktop = browser.new_page(viewport={"width": 1440, "height": 900})
    desktop.goto(BASE, wait_until="networkidle")
    assert desktop.locator('img[src*="logo-avizor.png"]').first.is_visible()
    desktop.screenshot(path="docs/screenshots/logo-new-desktop.png", full_page=True)
    browser.close()

print("new logo smoke: ok")
