
/// app animations

$( document ).ready(function() {

var divElement='<div style="display:flex;justify-content: center;    pointer-events: none;"><img id="animation" style="    pointer-events: none;position:absolute; z-index:1;max-width: 50%;"></div>';
$("body").prepend(divElement);

});

function preloadAnimation(pathToAnimationsFolder,animationName) // only once
{
    var src=pathToAnimationsFolder+"/"+animationName+".gif";
    $('<img />').attr('src',src).appendTo('body').css('display','none');
}

function playAnimation(pathToAnimationsFolder,animationName,animationTime,position)
{
    if (parseInt(animationTime)>0)
    {
        setTimeout(function(){
            $("#animation").slideUp(500);
        }  ,animationTime);
    }
    var src=pathToAnimationsFolder+"/"+animationName+".gif";

    if (position=="bottom")
    {
        $("#animation").parent().css({
            "position": "fixed",
            "bottom": "0",
            "width": "100%",
            "justify-content": "center",
            "padding": "0",  // Remove padding from the parent div
            "z-index": "9999", // Ensure it stays on top of other content
        });
        $("#animation").css({
            "padding-top": "0", // Reset padding to ensure proper alignment
            "position": "relative", // Ensure it remains positioned within the parent div
            "top": "5.5vw" // Adjust the top position based on your desired spacing
        });
    }

    $("#animation").attr("src",src);
}

function getAbsPathToParentFolder(path, parentFolder) {
    var search="/"+parentFolder+"/";
    var str=path.substr(path.indexOf(search)); // remove left part
    str = str.substr(0, str.lastIndexOf("/")); // remove all after last /
    console.log("x="+str);
    if (str[str.length-1]=="/") str=str.slice(0, -1); //remove last char if /
    if (str[0]=="/") str=str.substring(1); //remove first char if /
    var path="";
    for (var i=0;i<str.length;i++)
    {
        if (str[i]=="/") path+="../";
    }
    console.log(path);
    return (path);
}
