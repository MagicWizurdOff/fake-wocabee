function playSound(path,sound,soundsOn,delay)
{
    if (soundsOn===undefined) soundsOn=1; // default
    if (delay===undefined) delay=250; // default

   // console.log("Delay"+delay);

   // TODO TRY CATCH !
    if (soundsOn)
    {
        console.log("Sounds enabled, playing audio:"+sound);
        setTimeout(function(){
            var myAudio = new Audio(path+sound+".mp3");
            $(myAudio).on("canplay",function(){
                myAudio.play();
                });

        }, delay);
    }
   
}

