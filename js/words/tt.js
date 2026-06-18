// security
var globalSecondsLeft=0;
var runCountdown=0;
var firstRun=0;

var firstPostDone=0;
var ended=0;

$( document ).ready(function() {

    var t_int=3000;

    // console.log("t_int="+t_int+" and tt_int="+tt_int); // tt_int is primary


    if ($("#timeLeft").length)
    {
        globalSecondsLeft=$("#timeLeft").attr("seconds");
        
        //globalSecondsLeft=(globalSecondsLeft>=2)?parseInt(globalSecondsLeft+1):globalSecondsLeft; // to prevent disp sync issues

        if (globalSecondsLeft==0)
        {
            dispEnd(); //tt(); // start
        }
        else runCountdown=1;
        setInterval(tt, tt_int);
        setInterval(st, 1000); // refresh
    }

   function tt()
    {
        if (!runCountdown) return;
        if (!firstRun) firstRun=1;

        //var url=getPathUpToAppFolder(window.location.href)+"shared/trackPracticeTime.php";
        var url="index.php";

        var classId = getCustURLParameter("class_id");
        var packageId = getCustURLParameter("package_id");

        // Initialize data object with class_id
        var dataToSend = {
            action: "saveTrackingTime",
            class_id: classId
        };

        // Conditionally add package_id if it's defined
        if (packageId !== null && packageId !== undefined && packageId !== "") {
            dataToSend.package_id = packageId;
        }



        console.log("TT"+url);
        $.post(url,dataToSend,
        function(data){
           
            console.log(data);
            var response=JSON.parse(data);
            var secLeft=response.secondsLeft>0?response.secondsLeft:0;
            var timeLeft=secondsToHMS(secLeft);
            $("#timeLeft").text(timeLeft);
            globalSecondsLeft=secLeft;
            if (secLeft) runCountdown=1; // GUI refresh
            else
            { 
                dispEnd();
                runCountdown=0;
            }
        });
    }

    function dispEnd()
    {
        if (ended) return;
        ended=1;
        var containerStart='<div class="container text-center col-lg-6 col-md-8 col-xs-12">';
        var mainDiv='<div class="alert alert-success" style="margin-top:100px">Jazykový WocaBee šampionát<br>Dnes: '+$("#timeLeft").attr("hourLimit")+' hod ✅<br> 😊</div>';
        var backBtn='<div class="btn btn-block btn-warning" onclick="history.back()"><i class="fa-solid fa-door-open"></i> </div>';
        var containerEnd='</div>';

        $("body").html(containerStart+mainDiv+backBtn+containerEnd);
    }

   function st()
   {
       if (!runCountdown) return;
       
       //if (globalSecondsLeft==1 && mode=="practice" || mode=="practiceAll") $("#backBtn").click(); 
       if (globalSecondsLeft==1)
       {
        runCountdown=0;
        setTimeout(function(){ 
            $("#backBtn").click();  // only for practice / practiceAll (!)
            setTimeout(function(){ dispEnd() },250);
        }, 1000);
       }

       if (globalSecondsLeft>0) globalSecondsLeft--;
       
       var timeLeft=secondsToHMS(globalSecondsLeft);
       $("#timeLeft").text(timeLeft);
   }

});


function secondsToHMS(seconds) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remainingSeconds = seconds % 60;

    // Pad each value with leading zeros if less than 10
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    remainingSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

    return hours + ':' + minutes + ':' + remainingSeconds;
}


function getPathUpToAppFolder(url) {
    // Create a new URL object (for parsing)
    var parsedUrl = new URL(url);

    // Get the protocol and hostname
    var protocolAndHost = parsedUrl.origin;

    // Get the pathname from the URL
    var path = parsedUrl.pathname;

    // Find the position of "app/"
    var appPos = path.indexOf('app/');

    // Check if "app/" is found and construct the full URL
    if (appPos !== -1) {
        return protocolAndHost + path.substring(0, appPos + 4); // "+ 4" to include "app/"
    } else {
        return protocolAndHost + path; // Return the full URL if "app/" is not found
    }
}

function getCustURLParameter(paramName)
{
    var sURL = window.document.URL.toString();
    if (sURL.indexOf("?") > 0)
    {
        var arrParams = sURL.split("?");
        var arrURLParams = arrParams[1].split("&");
        var arrParamNames = new Array(arrURLParams.length);
        var arrParamValues = new Array(arrURLParams.length);

        var i = 0;
        for (i = 0; i<arrURLParams.length; i++)
        {
            var sParam =  arrURLParams[i].split("=");
            arrParamNames[i] = sParam[0];
            if (sParam[1] != "")
                arrParamValues[i] = unescape(sParam[1]);
            else
                arrParamValues[i] = "No Value";
        }

        for (i=0; i<arrURLParams.length; i++)
        {
            if (arrParamNames[i] == paramName)
            {
                //alert("Parameter:" + arrParamValues[i]);
                return arrParamValues[i];
            }
        }
        return "";
    }
}