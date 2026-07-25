from playwright.sync_api import sync_playwright

ROUTES = ["/", "/metodologia", "/sobre-avizor", "/contacto", "/bibliografia"]

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    errors = []
    for width, height in [(360, 800), (1440, 900)]:
        for route in ROUTES:
            page = browser.new_page(viewport={"width": width, "height": height})
            page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
            response = page.goto(f"http://localhost:3501{route}", wait_until="networkidle", timeout=30000)
            assert response and response.ok, f"HTTP failure {route} at {width}px"
            assert page.locator("h1").count() == 1, f"Invalid h1 {route} at {width}px"
            assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), f"Horizontal scroll {route} at {width}px"
            page.close()
    browser.close()
    if errors:
        raise AssertionError("Console errors: " + " | ".join(errors))
    print("new public designs responsive smoke: OK")
