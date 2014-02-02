#!/usr/bin/python
import time
import logging
#logging.basicConfig(level=logging.DEBUG)

def reading(sensor):
    import time   
    import RPi.GPIO as GPIO 
    echopin = 27
    triggerpin = 22
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(triggerpin,GPIO.OUT)
    GPIO.setup(echopin,GPIO.IN)
    if sensor == 0:
        
        GPIO.output(triggerpin, GPIO.LOW)
        
        time.sleep(0.2)

        GPIO.output(triggerpin, True)
        
        time.sleep(0.00001)
        
        GPIO.output(triggerpin, False)

        while GPIO.input(echopin) == 0:
            signaloff = time.time()
        
        while GPIO.input(echopin) == 1:
            signalon = time.time()
        
        timepassed = signalon - signaloff
        
        distance = timepassed * 17000
        
        GPIO.cleanup()
        
        return distance
        
    else:
        print "Incorrect usonic() function varible."

def get_distance():
    from socketIO_client import SocketIO
    with SocketIO('localhost', 2013) as socketIO:
        distance = reading(0)
        socketIO.emit('distanceCm',distance)

from socketIO_client import SocketIO
with SocketIO('localhost', 2013) as socketIO:	
    socketIO.on('get_distance', get_distance)
    socketIO.wait(seconds=1)
    #while True:
        #socketIO.emit('distanceCm', {"distance":reading(0)})
        #distance = reading(0)
        #socketIO.emit('distanceCm',distance)
        #print distance

while True:
	#necsinaljon semmit
	asd = False;