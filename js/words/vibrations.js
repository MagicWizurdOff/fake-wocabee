function vibrate(type,vibrationsOn)
{
    
    if (vibrationsOn)
    {
        console.log("Vibrations on");

        // package_LOCAL
        if (type=="vibrationsOn") setTimeout(function(){ navigator.vibrate([150,50,250]);}, 200);
        if (type=="vibrationsOff") setTimeout(function(){ navigator.vibrate([75,50,75,50,75]);}, 200); 
        if (type=="short") setTimeout(function(){ navigator.vibrate(75);}, 100);

        if (type=="correctAnswer") setTimeout(function(){ navigator.vibrate([150]);}, 500); 
        if (type=="incorrectAnswer") setTimeout(function(){ navigator.vibrate([100,50,100]);}, 500); 
        if (type=="singleVibrationLong") setTimeout(function(){ navigator.vibrate([360]);}, 500); 
    }
    else 
    {
        console.log("Vibrations off");
    }
}