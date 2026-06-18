/**
 * Created by Michal on 20/01/2018.
 */
var fadeTime=2000;

$( document ).ready(function() {

    // playAnimation(getAbsPathToParentFolder(window.location.href, "app")+"./data/animations/" ,"SmileFromBottomLine",4500,"bottom");

    $('#custHeader').textillate();
    //$("#formParts").html("<h4>23:00-23:15<br> údržba aplikácie<br>údržba aplikace<br>system maintenance </h4>");

    $("#loginForm").submit(function() {

      var overlayStart = Date.now();
      $("#loginOverlay").addClass("active");

      $.post("index.php",
      {
          login: $("#login").val(),
          password: $("#password").val()
      },
      function(data, status){
          console.log("'"+$.trim(data)+"'");
          var response = JSON.parse(data);
          var elapsed = Date.now() - overlayStart;
          var remaining = Math.max(0, 1200 - elapsed);

          setTimeout(function() {
              $("#loginOverlay").removeClass("active");

              if (response.result == "OK")
              {
                 console.log("ok, reloading");
                 location.reload();
              }
              else if (response.result == "NOK")
              {
                if (!response.banned_till)
                {
                    console.log("wrong credentials");
                    $("#incorrectLogin").fadeIn(fadeTime/2, function(){
                      $("#incorrectLogin").fadeOut(fadeTime);
                    });
                }
                else
                {
                    $("#bannedTill").text(response.banned_till);
                    $("#banAlert").fadeIn(fadeTime, function(){});
                }
              }
          }, remaining);
      });

      return false;
    });

    $("#singUpButton").click(function() {
         
        if (newUserLogin!="")
        {
            return confirm(signupConfirm);
        }
      });
    
    
    $("#submitBtn").click(function() {

        //if (!$("#loginForm").submit()) return;

        console.log("asd");

       

            //event.preventDefault();
            //event.stopPropogation();
    });



    
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


});