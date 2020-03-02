// ==UserScript==
// @name         What's Missing-test
// @version      1.2.4
// @description  Save playlist videos in order to remember what video got removed
// @license      MIT
// @author       fletcher
// @include      *.youtube.*
// @homepage     https://github.com/fletcher97/userScripts
// @homepageURL  https://github.com/fletcher97/userScripts
// @updateURL    https://openuserjs.org/meta/fletcher/Whats_Missing.meta.js
// @supportURL   https://github.com/fletcher97/userScripts/issues
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

//
//  This program was made in a day and may contain bugs. It's not been optimized and could
//  be much better but at least it gets the job done. Feel free to change it any way you see fit.
//
//  To use this programe make sure you are in a playlist's page and not a video page watching a playlist.
//  The buttons should appear above the discription. (They haven't been styled and should be obvious).
//  If they don't appear refresh the page. Make sure the script is installed correctly and active.
//
//Intructions:
//  SAVE:
//    1. Open youtube and navigate to the desired playlist you wish to save.
//    2. Load the full playlist (scroll down to the last video on the playlist).
//       If you don't scroll down only the visible video will be saved (increments of 100)
//    3. Click save/update button and confirm.
//  DELETE:
//    1. Open youtube and navigate to the playlist you wish to remove from storage
//    2. click delete and confirm
//  CHECK:
//    1. Open youtube and navigate to the desired playlist you wish to save.
//    2. Load the full playlist (scroll down to the last video on the playlist).
//       If you don't scroll down only the visible video will be checked (increments of 100)
//    3. Click the check button and confirm.
//    4. To view the results press F12, ctrl+shift+i or right-click and select inspect
//    5. Select the tab 'Console' at the top and you should see the output.
//       If you only see 'Check end' no changes were detected
//  TIPS:
//    When removing videos from a playlist the buttons will disapear.
//    To make them come back refresh the page.



function getPlName(p = null){
    var pl;
    //try getting playlist name in 2 ways. if failed and no name was given in parameter it will promp user for the name
    try{
        pl = document.getElementById("title").firstChild.firstChild.innerHTML;
    }catch(error){
        try{
            pl = document.getElementById("display-dialog").childNodes[1].innerHTML;
        }catch(error){
            if(p !== null){
                pl = p;
            }else{
                pl = window.prompt('The title of this playlist could not be read. Please insert it\'s name','Playlist name');
            }
        }
    }
    return pl;
}

//Generate a list of titles from the current playlist (playlist page)
//event - catcher parameter for when the method is called through the listenner
//returnRes - wether the result should be returned or saved. (0 = save result; 1 = return result)
//p - playlist name .The pprogram will try to check the playlist name but if it can't find it will use this value
//    if specified so that the user only has to enter the name of the playlist once per operation.
function getList(event = null, returnRes = 0, p = null){
    //get a list of all the videos
    var list = document.getElementsByClassName('style-scope ytd-playlist-video-list-renderer').contents.querySelectorAll("[id='video-title']");
    //get the playlist name
    var pl = getPlName(p);
    if(pl === null){return;}
    //retrieve name from videos and escape "
    list = Array.from(list, i => i.getAttribute("title").replace(/"/g, '\\"'));

    var saved = GM_getValue(pl);

    //check if playlist was saved and confirm user intension
    if(saved === undefined && returnRes !== 1){
        if(!window.confirm("This playlist hasn't been saved yet. Do you want to save it for the first time?")){
            console.log('canceled');
            return;
        }
    }else if(returnRes !== 1){
        var c = Object.keys(JSON.parse(saved)).length;
        if(!window.confirm("This playlist has been saved before and it had " + c +
                          " items. Do you want to overide your previous save?\n" +
                          "New save will store " + list.length + " items.")){
            console.log('canceled');
            return;
        }
    }

    //parse list of titles into a json string
    var json = '{';
    for(var i = 0; i < list.length; i++){
        json += '"' + (i+1) + '":"' + list[i] + '",';
    }
    json = json.slice(0, -1) + '}';

    //return result without saving if specified in parameters
    if(returnRes){
        return JSON.parse(json);
    }
    //save playlist
    GM_setValue(pl, json);
    console.log('saved');
}

//Check if there have been any changes to the playlist
//event - catcher parameter for when the method is called through the listenner
//p - playlist name .The pprogram will try to check the playlist name but if it can't find it will use this value
//    if specified so that the user only has to enter the name of the playlist once per operation.
function checkPL(event = null, p = null){
    //get the playlist name
    var pl = getPlName(p);
    if(pl === null){return;}

    //check if playlist was saved previously and retrieve data
    var save = GM_getValue(pl);
    if(save === undefined){
        window.alert('You haven\'t saved this playlist yet.');
        return;
    }
    window.alert('Check console for a list of changes');
    save = JSON.parse(save);
    var current = getList(null, 1, pl);
    var size = Math.min(Object.keys(save).length, Object.keys(current).length);

    //Check if videos in current playlist were deleted or made private. Log on the console any changes
    for(var i = 0; i < size; i++){
        if(current[i+1] === "[Private video]" || current[i+1] === "[Deleted video]"){
            if(save[i+1] === "[Private video]" || save[i+1] === "[Deleted video]"){
                console.log("The video at the position " + (i+1) +
                            " was removed before last save and can't be identified");
            }else{
                console.log("The video at the position " + (i+1) +
                            " has been removed. The video was \"" + save[i+1] + "\"");
            }
        }
    }

    //Warn user of mismatch in current/saved playlist sizes
    if(Object.keys(save).length > Object.keys(current).length){
       console.log("Only the first " + size + " were checked. Some videos were deleted or could not be found." +
                   " Plz update the save. The last videos on the saved playlist are:");
       for(var j = size; j < Object.keys(save).length; j++){
           if(save[j+1] === "[Private video]" || save[j+1] === "[Deleted video]"){continue;}
           console.log((j+1) + ": \"" + save[j+1] + "\"");
       }
    }else if(Object.keys(save).length < Object.keys(current).length){
        console.log("A total of " + (size - Object.keys(current).length) +
                    " new videos were added since last save starting at position " + size + ".");
    }

    console.log('Check end');
}

//Delete a playlist from storage
//event - catcher parameter for when the method is called through the listenner
//p - playlist name .The pprogram will try to check the playlist name but if it can't find it will use this value
//    if specified so that the user only has to enter the name of the playlist once per operation.
function deletePL(event = null, p = null){
    //get the playlist name
    var pl = getPlName(p);
    if(pl === null){return;}

    //Check if the playlist was saved previously
    console.log(pl);
    if(GM_getValue(pl) === undefined){
        window.alert('You haven\'t saved this playlist yet.');
        return;
    }
    //confirm playlist save deletion
    if(window.confirm("Are you sure you want to remove \"" + pl + "\" from your saved playlists?")){
        console.log("deleting:" + pl);
        GM_deleteValue(pl);
    }
}

//Set up the button for user interaction
function setup(){
    //include bootstrap style
    var style = document.createElement('link')
    style.setAttribute('rel', 'stylesheet')
    style.setAttribute('href', 'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css')
    style.setAttribute('integrity', 'sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh')
    style.setAttribute('crossorigin', 'anonymous')
    document.head.appendChild(style)

    // button creation
    var buttons_div = document.createElement('div');
    //buttons_div.setAttribute('style','background-color:#ededed;')
    buttons_div.setAttribute('class','border-top border-bottom')
    buttons_div.setAttribute('style','margin-top:10px;margin-bottom:10px;'
    + 'padding-top:5px;padding-bottom:5px;');

    var save = document.createElement('button');
    save.setAttribute('id','savePL')
    save.setAttribute('class','btn btn-success btn-lg')
    save.setAttribute('style','margin:5px;')
    save.innerHTML = 'Save/Update';

    var check = document.createElement('button');
    check.setAttribute('id','checkPL')
    check.setAttribute('class','btn btn-info btn-lg')
    check.setAttribute('style','margin:5px;')
    check.innerHTML = 'Check';

    var del = document.createElement('button');
    del.setAttribute('id','deletePL')
    del.setAttribute('class','btn btn-danger btn-lg')
    del.setAttribute('style','margin:5px;')
    del.innerHTML = 'Delete save';

    save.addEventListener("click", getList);
    check.addEventListener("click", checkPL);
    del.addEventListener("click", deletePL);

    var end_text = document.createElement('h5');
    end_text.setAttribute('style','margin:5px;')
    end_text.innerHTML = "by What's Missing";

    buttons_div.appendChild(save);
    buttons_div.appendChild(check);
    buttons_div.appendChild(del);
    buttons_div.appendChild(end_text);

    document.getElementsByClassName('style-scope ytd-playlist-sidebar-primary-info-renderer').menu.appendChild(buttons_div);
}

//wait for page to load before loading buttons
window.addEventListener('load', function () {
    console.log('load');
    if(window.location.href.includes('/playlist')){
       setup();
    }
})
//reload button when moving between youtube 'pages'
window.addEventListener('yt-navigate-finish', function () {
    console.log('nav end');
    if(window.location.href.includes('/playlist')){
       setup();
    }
})