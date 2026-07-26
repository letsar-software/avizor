from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for width, height in [(360, 800), (1440, 900)]:
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto("http://localhost:3502/sobre-avizor", wait_until="networkidle")
        header = page.locator("header").first
        assert header.is_visible()
        assert header.evaluate("el => getComputedStyle(el).position") == "fixed"
        page.evaluate("window.scrollTo(0, 900)")
        page.wait_for_timeout(250)
        assert abs(header.bounding_box()["y"]) < 1
        page.close()
    browser.close()
    print("fixed translucent header smoke: OK")
