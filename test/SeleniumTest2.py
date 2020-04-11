
from selenium import webdriver
import time


browser = webdriver.Safari(executable_path = '/usr/bin/safaridriver')
browser.maximize_window()

def signup_test():
    signup_screen = browser.find_element_by_xpath("/html/body/nav/div/div/ul/li[3]/a")
    signup_screen.click()
    time.sleep(3)

    enter_firstName = browser.find_element_by_xpath('//*[@id="firstName"]')
    enter_lastName = browser.find_element_by_xpath('//*[@id="lastName"]')
    enter_email = browser.find_element_by_xpath('//*[@id="email"]')
    enter_phone = browser.find_element_by_xpath('//*[@id="phone"]')
    enter_password = browser.find_element_by_xpath('//*[@id="exampleInputPassword1"]')
    enter_confirm_password = browser.find_element_by_xpath('//*[@id="exampleInputPassword2"]')

    enter_firstName.send_keys("monkeyFirstName2")
    enter_lastName.send_keys("monkeyLastName")
    enter_email.send_keys("monkeyfirstname2@monkeys.com")
    enter_phone.send_keys("9957338512")
    enter_password.send_keys("monkeykapooristhebest")
    enter_confirm_password.send_keys("monkeykapooristhebest")

    time.sleep(3)
    signup_button = browser.find_element_by_xpath("/html/body/section/section/section/form/button")
    signup_button.click()

    time.sleep(4)

    lpn_one = browser.find_element_by_xpath('//*[@id="lpNum1"]')
    lpn_one.send_keys("CHF199")

    signup_button_two = browser.find_element_by_xpath('//*[@id="license-plate-add"]')
    signup_button_two.click()

    time.sleep(4)

    logout_button = browser.find_element_by_xpath("/html/body/nav/div/div/ul/li/a")
    logout_button.click()

    time.sleep(3)



if __name__ == "__main__":
    browser.get('http://localhost:5000')
    signup_test()
    browser.quit()
