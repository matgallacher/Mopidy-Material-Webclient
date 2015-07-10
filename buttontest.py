import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)

GPIO.setup(5,GPIO.IN, pull_up_down = GPIO.PUD_UP)
GPIO.setup(6,GPIO.IN, pull_up_down = GPIO.PUD_UP)

pressed = 0

def click(channel):
	global pressed
	if pressed != channel:
		pressed = channel
		print("Switched to " + str(pressed))

GPIO.add_event_detect(5, GPIO.RISING, callback=click, bouncetime=300)
GPIO.add_event_detect(6, GPIO.RISING, callback=click, bouncetime=300)

while True:
	time.sleep(0.5)

GPIO.cleanup()
