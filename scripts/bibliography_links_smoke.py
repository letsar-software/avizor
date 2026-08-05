from playwright.sync_api import sync_playwright


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto("http://127.0.0.1:3522/bibliografia", wait_until="networkidle")

    cards = page.locator("main section article")
    assert cards.count() == 8
    links = cards.locator("a[target='_blank']")
    assert links.count() == 8
    hrefs = [links.nth(index).get_attribute("href") for index in range(links.count())]
    assert len(set(hrefs)) == 8

    page.get_by_role("tab", name="Fenología", exact=True).click()
    assert cards.count() == 2
    assert page.get_by_text("Stages of soybean development", exact=False).count() == 1

    page.get_by_role("tab", name="Enfermedades foliares", exact=True).click()
    assert cards.count() == 2
    assert page.get_by_text("Evolución de las enfermedades de la soja en Argentina", exact=False).count() == 1

    page.get_by_role("tab", name="Estrés hídrico", exact=True).click()
    assert cards.count() == 1
    assert page.get_by_text("Crop evapotranspiration", exact=False).count() == 1

    page.get_by_role("tab", name="Exceso hídrico", exact=True).click()
    assert cards.count() == 2
    assert page.get_by_text("Crop evapotranspiration", exact=False).count() == 1

    page.get_by_role("tab", name="Heladas", exact=True).click()
    assert cards.count() == 1
    assert page.get_by_text("Caracterización de las heladas", exact=False).count() == 1

    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    browser.close()

print("Bibliography source and filter checks passed")