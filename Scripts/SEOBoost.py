from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import time

# Create a new instance of the Chrome driver
driver = webdriver.Chrome()

try:
    while True:
        # Open Google
        driver.get("https://www.google.com")

        # Find the search input element and enter "Meet Bhingradiya"
        search_input = driver.find_element_by_name("q")
        search_input.send_keys("Meet Bhingradiya")
        search_input.send_keys(Keys.RETURN)

        # Wait for the search results to load
        time.sleep(2)

        # Find the search result link and click on it
        search_result_link = driver.find_element_by_partial_link_text("https://meetbhingradiya.vercel.app")
        search_result_link.click()

        # Wait for the page to load
        time.sleep(2)

except KeyboardInterrupt:
    # Terminate the program when Ctrl+C is pressed
    driver.quit()