
from selenium import webdriver
import time


browser = webdriver.Safari(executable_path = '/usr/bin/safaridriver')
browser.maximize_window()

def login_no_transactions(email, password):
    login_screen = browser.find_element_by_xpath("/html/body/nav/div/div/ul/li[2]/a")
    login_screen.click()
    time.sleep(1)
    enter_username = browser.find_element_by_id('exampleInputEmail1')
    enter_password = browser.find_element_by_id('exampleInputPassword1')
    login_button = browser.find_element_by_xpath("/html/body/section/section/section/form/button")

    enter_username.send_keys(email)
    enter_password.send_keys(password)
    time.sleep(1)
    login_button.click()

    time.sleep(3)
    logout_button = browser.find_element_by_xpath("/html/body/nav/div/div/ul/li/a")
    logout_button.click()

    time.sleep(3)



if __name__ == "__main__":
    browser.get('http://localhost:5000')
    login_no_transactions("usertest8@gmail.com", "abc123")
    time.sleep(3)
    login_no_transactions("skyline@nissan.ca", "password123")
    time.sleep(3)
    login_no_transactions("gtr@nissan.ca", "password123")
    browser.quit()
