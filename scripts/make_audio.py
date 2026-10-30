"""Build the original instrumental soundtrack without external dependencies."""
import math, wave, array
from pathlib import Path
RATE = 22050
notes = [('G',.5),('G',.5),('A',1),('G',1),('C',1),('B',2),('G',.5),('G',.5),('A',1),('G',1),('D',1),('C',2),('G',.5),('G',.5),('g',1),('E',1),('C',1),('B',1),('A',2),('F',.5),('F',.5),('E',1),('C',1),('D',1),('C',2)]
hz = dict(G=392,A=440,B=493.88,C=523.25,D=587.33,E=659.25,F=698.46,g=783.99)
length = 4.8 + sum(n[1] for n in notes)*.46 + .3
samples = [0.] * int((length+.5)*RATE)
def tone(f, start, duration, volume):
    for i in range(int(duration*RATE)):
        t=i/RATE
        envelope=min(t/.012,1)*math.exp(-3*t/duration)*min((duration-t)/.04,1)
        value=(math.sin(2*math.pi*f*t)+.22*math.sin(4*math.pi*f*t)+.08*math.sin(6*math.pi*f*t))*volume*envelope
        index=int(start*RATE)+i
        if index<len(samples): samples[index]+=value
for i in range(24):
    tone([261.63,329.63,392,523.25,392,329.63][i%6],i*.18,.25,.28)
    if i%2==0: tone(130.81 if i%4==0 else 196,i*.18,.25,.17)
elapsed=4.8
for pitch,beats in notes:
    tone(hz[pitch],elapsed,beats*.46*.95,.35)
    tone(hz[pitch]/2,elapsed,beats*.46*.9,.1)
    elapsed+=beats*.46
for i in range(math.ceil((length-4.8)/.46)):
    tone([130.81,164.81,196,164.81][(i//4)%4],4.8+i*.46,.3,.14)
output=Path(__file__).resolve().parents[1]/'assets'/'birthday-party.wav'
with wave.open(str(output),'wb') as wav:
    wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(RATE)
    wav.writeframes(array.array('h',(int(math.tanh(s)*28000) for s in samples)).tobytes())
print(f'{output.name}: {length:.2f}s')
