import os
os.system("pip install pyautogui")
os.system("pip install keyboard")

import random
import pyautogui as auto
import time
import keyboard
auto.FAILSAFE = False
print("starting in 10 seconds...")
time.sleep(10)
tempk = 0; tempm=0
globaltime =0
logs = []
keyboardtime=0
mousetime=0
keyboardlogs=[]
mouselogs=[]

# Functions
timevar = 0
mousevar=0
keyboardvar =0

mouseinputs =[]
keyboardinputs =[]

def sleep(startlimit,limit):
    global keyboardtime,mousetime,logs,globaltime,timevar,tempk,tempm
    sleeptime = random.uniform(startlimit,limit)
    l={}
    l['logs']=globaltime
    if mousevar!=tempm:
        l['mouselogs']=globaltime
    if keyboardvar!=tempk:
        l['keyboardlogs']=globaltime
    l['total mouselogs']=len(mouselogs)
    l['total keyboardlogs']=len(keyboardlogs)
    with open('logs.txt', 'a') as file:
        file.write(str(l))
        file.write("\n")
    if globaltime>600:
        print("\nlogs:",logs)
        print("mouselogs:",mouselogs)
        print("keyboardlogs:",keyboardlogs)
        print("Mouse events:",len(mouselogs))
        print("Keyboard events:",len(keyboardlogs))
        raise KeyboardInterrupt
    while sleeptime>0:
        
        sleeptime -= 0.01
        time.sleep(0.01)
        timevar += timevar
        globaltime += 0.01
        if keyboard.is_pressed('esc'):
            print("\nlogs:",logs)
            print("mouselogs:",mouselogs)
            print("keyboardlogs:",keyboardlogs)
            print("Mouse events:",len(mouselogs))
            print("Keyboard events:",len(keyboardlogs))
            raise KeyboardInterrupt
    round(globaltime, 2)
    print(globaltime)
    logs.append(globaltime)
    if mousevar!=tempm:
        mouselogs.append(globaltime)
    if keyboardvar!=tempk:
        keyboardlogs.append(globaltime)
    tempk = keyboardvar
    tempm = mousevar

def rest():
    global globaltime
    global timevar
    rng = random.choice([1,2,3])
    if rng == 1:
        sleep(550,650)
        totaltime = 0
    if rng == 2:
        totaltime -= 200
    if rng == 3:
        totaltime -= 100
    timevar = 0


def press_up():
    global globaltime
    global keyboardvar
    keyboardvar += 1
    auto.press('up')

def press_down():
    global globaltime
    global keyboardvar
    keyboardvar += 1
    auto.press('down')

def press_page_up():
    global globaltime
    global keyboardvar
    keyboardvar += 1
    auto.press('pageup')

def press_page_down():
    global globaltime
    global keyboardvar
    keyboardvar += 1
    auto.press('pagedown')

def press_alt_tab():
    global globaltime
    global keyboardvar
    keyboardvar += 1
    auto.hotkey('alt','tab')

def press_ctrl_tab():
    global globaltime
    global keyboardvar
    keyboardvar += 1
    auto.hotkey('ctrl','tab')


def move_pointer():
    global globaltime
    global mousevar
    mousevar += 1
    global mousecount
    xres,yres=auto.size()
    x=int(random.randrange(0,xres))
    y=int(random.randrange(0,yres))
    auto.moveTo(x, y, duration=0.2)


def up_down():
    global globaltime
    global keyboardvar
    randint = random.uniform(1,5)
    keyboardvar += randint
    up = random.randint(0, 1)
    while randint>0:
        randint -= 1 
        if up == 1:
            auto.press('up')
        else:
            auto.press('down')

def select():
    global globaltime
    global mousevar
    mousevar += 2
    xres,yres=auto.size()
    x=int(random.randrange(0,xres))
    y=int(random.randrange(0,yres))
    auto.moveTo(x, y, duration=0.2)
    auto.click()
    auto.click()

def mouse_click_head():
    global globaltime
    global mousevar
    mousevar += 1
    xres,yres=auto.size()
    x=int(random.randrange(0,xres))
    y=int(random.randrange(0,yres))
    auto.moveTo(x, y, duration=0.2)
    auto.click()


def mouse_click():
    global globaltime
    global mousevar
    mousevar += 1
    x,y=auto.size()
    auto.moveTo(x/2, 10, duration=0.2)
    auto.click()

def scroll():
    global globaltime
    global mousevar
    up = random.randint(0, 1)
    randint = random.uniform(1,10)
    mousevar += randint
    if up == 1 :
        while randint>0:
            randint -= 1
            auto.scroll(int(random.uniform(2,3)))
            sleep(0.2,0.4)
    else:
        while randint>0:
            randint -= 1
            auto.scroll(int(random.uniform(-2,-3)))
            sleep(0.2,0.4)

def main():
    print("main")
    global globaltime
    global mousevar
    global keyboardvar
    globaltime = 0

    while(True):
        a_list=[scroll,scroll,scroll,press_up, press_down, press_page_up, press_page_down, press_ctrl_tab,up_down,up_down,up_down]    
        
        # a_list=[up_down,select,press_up,press_down,press_page_up,press_page_down,press_ctrl_tab]
        random.choice(a_list)()     
        sleep(0.23,0.3)
        if globaltime > 60:
            break
        
def main_slow():
    print("main_slow")
    global globaltime
    global mousevar
    global keyboardvar
    globaltime = 0
    mousevar=0
    keyboardvar =0
    while(True):
        a_list=[scroll,scroll,press_up, press_down, press_page_up, press_page_down,press_ctrl_tab,up_down,up_down,up_down]    
        
        # a_list=[up_down,select,press_up,press_down,press_page_up,press_page_down,press_ctrl_tab]
        random.choice(a_list)()     
        sleep(4,5)
        if globaltime > 60:
            break

while True:
    random_number = random.randint(1, 20)
    if random_number == 1:
        main_slow()
    elif random_number == 2:
        print("idle time")
        sleep(15, 20)
        up_down()
        up_down()
        sleep(15, 20)
        random.choice([press_up, press_down, press_page_up, press_page_down, press_ctrl_tab, up_down, up_down, up_down])()
        sleep(15, 20)
    elif random_number == 3:
        print("idle time")
        sleep(15, 20)
        scroll()
        scroll()
        sleep(15, 20)
        scroll()
        sleep(15, 20)
    else:
        main()

