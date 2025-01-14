import time
from selenium.webdriver.remote.webdriver import By
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait

from selenium import webdriver
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options as ChromeOptions

Query = "Meet Bhingradiya"
TargetDomainORLink = "meetbhingradiya.tech"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

def init():
    options = ChromeOptions()
    options.add_argument(f"--user-agent={USER_AGENT}")
    options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--log-level=3')
    options.add_argument("--start-maximized")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    return driver

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
            if "meetbhingradiya.tech" in link:
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