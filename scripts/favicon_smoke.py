from playwright.sync_api import sync_playwright


with sync_playwright() as playwright:
    request = playwright.request.new_context(base_url="http://127.0.0.1:3520")
    response = request.get("/icon.png")
    assert response.ok, response.status
    assert response.headers.get("content-type") == "image/png", response.headers
    assert len(response.body()) > 1000

    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://127.0.0.1:3520", wait_until="networkidle")
    icon = page.locator("link[rel~='icon']")
    assert icon.count() >= 1
    assert any("icon.png" in (icon.nth(index).get_attribute("href") or "") for index in range(icon.count()))
    browser.close()
    request.dispose()

print("Favicon checks passed")
