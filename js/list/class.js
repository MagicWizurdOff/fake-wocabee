
 var class_id="";
 
 var check_cv=1;
 
 var refreshRankingOn=1;
 var userIsActive = 1;
 var inactivityTimeout;

 var runPlannedTestSecInterval=1;

 var debounceTimer;


$( document ).ready(function() {

    $(document).on("mousemove keydown keyup touchstart scroll click", resetActivityTimer);

    $('#packageNameFilter').on('keyup change', function () {
        clearTimeout(debounceTimer);
        if ($('#showMorePackagesBtn').is(':visible')) $("#showMorePackagesBtn").click();
        debounceTimer = setTimeout(function () {
          var filterText = normalizeText($('#packageNameFilter').val());
          $('.pTableRow').each(function () {
            var firstColText = normalizeText($(this).find('td:first').text());
            $(this).toggle(firstColText.indexOf(filterText) !== -1);
          });
        }, 150);
      });


    var currentValue = 1;
    setInterval(function() {
      document.getElementById('beeDaysCounterHelpIcon').textContent = currentValue;
      currentValue = currentValue % 9 + 1; // This will cycle the value from 1 to 9
    }, 1000); // Update every 1000 milliseconds (1 second)


    $("#showMorePackagesBtn").click(function(e) {
        $(".pTableRow").fadeIn(500);
        $(this).fadeOut(250);
    });

    $("#mainHexagon").click(function(e) {
        var hexaFill = document.querySelector('.hexaProgress.hexaOrange .hexaFill');

        // Calculate the stroke-dashoffset based on the target percentage
        var totalLength = 2160; // Total length of the stroke
        var offset = totalLength - (totalLength * parseInt($(".hexaValue").text()) / 100);
    
        // Ensure the transition is smooth
        hexaFill.style.transition = 'none';
    
        // Reset the stroke-dashoffset to trigger the reflow
        hexaFill.style.strokeDashoffset = totalLength;
    
        // Use setTimeout to allow the browser to render the reset before applying the calculated offset
        setTimeout(function() {
            hexaFill.style.transition = 'stroke-dashoffset 1s';
            hexaFill.style.strokeDashoffset = offset.toString();
        }, 50); // A short delay
    });

    
    
    $("#myBeeDaysPictureDownloadBtn").click(function(e) {
        window.open(beeDaysPictureURL); 
    });


    $("#beeDaysBtn").click(function(e) {
        if ($("#beeDaysChevron").hasClass("fa-chevron-up")) 
        {
            $("#beeDaysChevron").removeClass("fa-chevron-up").addClass("fa-chevron-down");
            $("#beeDaysWrapper").slideUp(200);
            saveBeeDaysVisibility(0);
        }
        else 
        {
            $("#beeDaysChevron").removeClass("fa-chevron-down").addClass("fa-chevron-up");
            $("#beeDaysWrapper").slideDown(200);
            saveBeeDaysVisibility(1);
        }
    });
    
	$.each($('.hexaProgress'), function( index, value ){
       // console.log("val = "+$(this).attr('data-progress')); 
		var percent =$(this).attr('data-progress');  //$(value).data('hexaProgress');
		$(value).children($('.hexaFill')).attr('style', 'stroke-dashoffset: ' + ((100 - percent) / 100) * 2160);
		// $(value).children($('.hexaValue')).text(percent + '%'); 
        $(value).children($('.hexaValue')).html(percent + ' %'); 

        if (percent=="100") $(this).closest("#hexaWrapper").find(".hexaCompleted").fadeIn(500);

	});

    

 console.log("Current CV: "+cv);

 sendMyBrowserData();

 
 if (window.performance && window.performance.navigation.type == window.performance.navigation.TYPE_BACK_FORWARD) {
    //alert('Got here using the browser "Back" or "Forward" button.');
    window.location.reload();
 }

 var now = new Date(parseInt($("#now_timestamp").val()));

 class_id=getURLParameter("class_id");


 refreshRanking();
 window.setInterval( refreshRanking , 15000);


window.setInterval(function () {
         now.setSeconds(now.getSeconds()+1);   
        }, 1000);

window.setInterval(function () {
         if (check_cv) 
          {
             checkCV();
             console.log("CV check run");
          }
         }, cvcf);

      var currentDatetime=new Date(($("#plannedTestsStartTimes").attr("currentTimestamp")*1000)-2000); // 3 secs tolerance

      window.setInterval(function(){
            $(".plannedTestStartTime").each(function( index ) {
                var timestamp=$(this).attr("timestamp");
                var startDate=new Date(timestamp*1000);
                if (currentDatetime>startDate) {
                     window.location.reload();
                }
           });  
           currentDatetime.setSeconds(currentDatetime.getSeconds() + runPlannedTestSecInterval); 
          }, runPlannedTestSecInterval*1000);



 $(".package[is_locked='1']").each(function( index ) {
  
   var locked_till_timestamp=$(this).attr("locked_till_timestamp");
   var locked_till=new Date(parseInt(locked_till_timestamp));
   var countdownElementID="#countdown"+$(this).attr("package_id");
   var btnRunID="#btnRun"+$(this).attr("package_id");
          
   window.setInterval(function () {
               if (locked_till>now) { 
                   $(countdownElementID).text(timeBetweenDates(now,locked_till));
            }
            else 
            {
                $(countdownElementID).hide();
                $(btnRunID).show();
            }
        }, 1000);
    });  

    
});

function saveBeeDaysVisibility(visible)
{
    $.post("index.php",
    {
        action: "saveBeeDaysVisibility",
        class_id: getURLParameter("class_id"),
        visible: visible
    },
    function(data){
        console.log(data);

      var response=JSON.parse(data);
      console.log(response);
    });  
}


function resetActivityTimer() {
    userIsActive = true;
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(function () {
        userIsActive = false; // Mark user as inactive after 1 minute
    }, 60000); // 1 minute (60000 ms)
}

function refreshRanking()
{

    if (refreshRankingOn==0 || document.hidden || !userIsActive ) return;
  // a) POST
  $.post("./index.php",
  {
      action: "getClassRanking",
      class_id: getURLParameter("class_id")
  },

  function(data){
      var wp_total = data["wp_total"];

      $("#tbody").html(data["html"]);


      var noOfStudents=data["students_count"];


      if (noOfStudents==0)
      {
        $("#soFarNoStudentsMsg").show();
        $("#listOfStudentsWrapper").hide();
      }
      if (noOfStudents>=1)
      {
        $("#listOfStudentsWrapper").show();
      }
      if (noOfStudents>=2) $("#sendMessageToAll").show();

  }, "json");

}

function timeBetweenDates(now,locked_till) {
  
  var difference = locked_till.getTime() - now.getTime();

  if (difference <= 0) {
  
  } else {
    
    var seconds = Math.floor(difference / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    hours %= 24;
    minutes %= 60;
    seconds %= 60;

    $("#days").text(days);
    $("#hours").text(hours);
    $("#minutes").text(minutes);
    $("#seconds").text(seconds);
    if (hours>0) return zeroFill(hours,2)+":"+zeroFill(minutes,2)+":"+zeroFill(seconds,2);
    else return zeroFill(minutes,2)+":"+zeroFill(seconds,2);
  }
}

function zeroFill( number, width )
{
  width -= number.toString().length;
  if ( width > 0 )
  {
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number + ""; // always return a string
}


function checkCV()
{
  $.post("index.php",
  {
      get_cv: "get_cv",
      class_id: class_id
  },
  function(data){
    var response=JSON.parse(data);
    console.log(response);
    if (response.msg=="loggedOut")
    {
        check_cv=0;
        confirm(youHaveBeenLoggedOut);
        location.reload(); // refresh >> login screen
    }
    else 
    {
     var server_cv=response.cv;
     if (server_cv!=cv)
     {
       location.reload();
     }
    }
  });  
}


function sendMyBrowserData()
{

    var sBrowser, sUsrAg = navigator.userAgent;

    if (sUsrAg.indexOf("Firefox") > -1) {
        sBrowser = "Mozilla Firefox";
        //"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
    } else if (sUsrAg.indexOf("Opera") > -1) {
        sBrowser = "Opera";
    } else if (sUsrAg.indexOf("Trident") > -1) {
        sBrowser = "Microsoft Internet Explorer";
        //"Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; Zoom 3.6.0; wbx 1.0.0; rv:11.0) like Gecko"
    } else if (sUsrAg.indexOf("Edge") > -1) {
        sBrowser = "Microsoft Edge";
        //"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299"
    } else if (sUsrAg.indexOf("Chrome") > -1) {
        sBrowser = "Google Chrome or Chromium";
        //"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36"
    } else if (sUsrAg.indexOf("Safari") > -1) {
        sBrowser = "Apple Safari";
        //"Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1 980x1306"
    } else {
        sBrowser = "unknown";
    }

    var speechAvailable=( 'speechSynthesis' in window )?1:0;
    var isMobile=('ontouchstart' in document.documentElement)?1:0;

    $.post("myBrowserData.php",
    {
        browser: sBrowser,
        speechAvailable: speechAvailable,
        isMobile: isMobile
    },
    function(data){
       console.log("data sent");
    });     
}

function getURLParameter(paramName)
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
        return "No Parameters Found";
    }
}


function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD') // Decompose accented letters
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  }