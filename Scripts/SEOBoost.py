import time
import shutil
from pathlib import Path
from selenium.webdriver.remote.webdriver import By
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait

from selenium import webdriver
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions

Query = "Meet Bhingradiya"
TargetDomainORLink = "meetbhingradiya.in"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"


def _find_chrome_binary() -> str | None:
    candidates = [
        shutil.which("chrome"),
        shutil.which("google-chrome"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]

    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)

    return None


def _find_edge_binary() -> str | None:
    candidates = [
        shutil.which("msedge"),
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    ]

    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)

    return None


def _build_common_options(options: ChromeOptions | EdgeOptions) -> None:
    options.add_argument(f"--user-agent={USER_AGENT}")
    options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--log-level=3')
    options.add_argument("--start-maximized")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")

def init():
    chrome_binary = _find_chrome_binary()
    if chrome_binary:
        options = ChromeOptions()
        options.binary_location = chrome_binary
        _build_common_options(options)
        return webdriver.Chrome(options=options)

    edge_binary = _find_edge_binary()
    if edge_binary:
        options = EdgeOptions()
        options.binary_location = edge_binary
        _build_common_options(options)
        return webdriver.Edge(options=options)

    raise FileNotFoundError(
        "No supported browser found. Install Google Chrome or Microsoft Edge."
    )

def main(ClickCount):
    sleep = time.sleep
    driver = init()
    driver.get("https://www.google.com")

    try:
        driver.find_elements(By.XPATH, '//*[contains(text(), "Reject all")]')[-1].click()
    except:
        pass

    inp_search = driver.find_element(By.NAME, 'q')
    inp_search.send_keys(f"{Query}\n")

    found = False

    for page in range(1, 4): 
        sleep(2)
        if found:
            break
        
        results_container = WebDriverWait(driver, timeout=5).until(
            EC.presence_of_element_located((By.ID, "rso"))
        )
        
        for idx, item in enumerate(results_container.find_elements(By.TAG_NAME, 'a')):
            link = item.get_attribute("href")
            if TargetDomainORLink in link:
                rank = idx
                print(f"Found link at rank {rank}: {link}")
                item.click() 
                sleep(2)
                driver.quit()
                found = True
                break

        if not found:
            next_page = driver.find_element(By.XPATH, f'//a[@aria-label="Page {page+1}"]')
            next_page.click()
            sleep(2)

    if not found:
        print("Link not found within the first 3 pages")

    if found:
        ClickCount += 1
        print(f"Link {ClickCount} times clicked, restarting process...")
        sleep(2)
        main(ClickCount)

if __name__ == "__main__":
    ClickCount = 0
    main(ClickCount)