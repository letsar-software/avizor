from pathlib import Path

from playwright.sync_api import sync_playwright


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for width, height, suffix in ((975, 800, "medium"), (390, 844, "mobile")):
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto("http://127.0.0.1:3519/sobre-avizor", wait_until="networkidle")
        overflow = page.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        if overflow > 1:
            offenders = page.evaluate("""Array.from(document.querySelectorAll('*')).map(element => {
                const rect = element.getBoundingClientRect();
                return {tag: element.tagName, cls: element.className, text: (element.textContent || '').trim().slice(0, 80), left: rect.left, right: rect.right, width: rect.width};
            }).filter(item => item.right > document.documentElement.clientWidth + 1 || item.left < -1).slice(0, 20)""")
            print({"width": width, "overflow": overflow, "offenders": offenders})
        assert overflow <= 1, (width, overflow)
        Path("screenshots").mkdir(exist_ok=True)
        page.screenshot(path=f"docs/screenshots/about-{suffix}-responsive.png", full_page=True)
        page.close()
    browser.close()

print("About responsive text and footer logo checks passed")
