import random
time=1
while time!=0:
    a=input().split(" ")
    a.append(0)
    a.append(0)
    for i in range(int(a[2])):
        d=random.randint(int(a[0]),int(a[1]))
        print(d,end=" ")
    print()
