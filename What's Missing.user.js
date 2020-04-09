// ==UserScript==
// @name         What's Missing
// @version      1.3.2
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

//Global Vars
var BOOTSTRAP_ID = "WMBootstrap";
var WHATS_MISSING_ID = "whats_missing";

//Verifies if the presented playlist is saved in GreaseMonkey memory
function containsPL() {
    var url = new URL(window.location.href);
    return GM_getValue(url.searchParams.get('list')) !== undefined;
}

//Generate a list of titles from the current playlist (playlist page)
//event - catcher parameter for when the method is called through the listenner
//returnRes - wether the result should be returned or saved. (0 = save result; 1 = return result)
function getList(event = null, returnRes = 0){
    //get a list of all the videos
    var list = document.getElementsByClassName('style-scope ytd-playlist-video-list-renderer').contents.querySelectorAll("[id='video-title']");
    //retrieve name from videos and escape "
	list = Array.from(list, i => i.getAttribute("title").replace(/"/g, '\\"'));

    var url = new URL(window.location.href);
    var pl_id = url.searchParams.get('list');
    var saved = GM_getValue(pl_id);

    //check if playlist was saved and confirm user intension
    if(saved !== undefined && returnRes !== 1){
        var c = Object.keys(JSON.parse(saved)).length;
        if(!window.confirm("This playlist has been saved before and it had " + c +
                          " items. Do you want to overide your previous save?\n" +
                          "New save will store " + list.length + " items.")){
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
    GM_setValue(pl_id, json);

    //update visible buttons
    document.getElementById('savePL').innerHTML = 'Saved!';
    document.getElementById('checkPL').style.visibility = 'visible';
    document.getElementById('deletePL').style.visibility = 'visible';
}

//Check if there have been any changes to the playlist
//event - catcher parameter for when the method is called through the listenner
function checkPL(event = null){

    //check if playlist was saved previously and retrieve data

    var url = new URL(window.location.href);
    var save = GM_getValue(url.searchParams.get('list'));
    if(save === undefined){
        window.alert('You haven\'t saved this playlist yet.');
        return;
    }
    save = JSON.parse(save);
    var current = getList(null, 1);
    var size = Math.min(Object.keys(save).length, Object.keys(current).length);

	//Check if videos in current playlist were deleted or made private. Log on the console any changes
	var msg = "The removed videos are:\n";
	var count = 0;
    for(var i = 0; i < size; i++){
        if(current[i+1] === "[Private video]" || current[i+1] === "[Deleted video]"){
            if(save[i+1] === "[Private video]" || save[i+1] === "[Deleted video]"){
				msg += (i+1) + ": Removed before last save\n";
				count++;
            }else{
				msg += (i+1) + ": " + save[i+1] + "\n";
				count++;
            }
        }
	}
	if(count == 0){
		window.alert("No removed videos found");
	}else{
		window.alert("Total count: " + count + " videos removed\n" + msg);
	}

    //Warn user of mismatch in current/saved playlist sizes
    if(Object.keys(save).length > Object.keys(current).length){
		var msg2 = "The playlist has less videos than the save. If no changes have been made, make sure you have scrolled down to the last video.\n" +
			"If videos have been removed from the middle of the playlist all indeces have shifted and" +
			" you will get mismatches between the removed videos and it's suggested name.\n" +
			"If videos have been removed at the end they were:\n";
		for(var j = size; j < Object.keys(save).length; j++){
			if(save[j+1] === "[Private video]" || save[j+1] === "[Deleted video]"){continue;}
			msg2 += (j+1) + ": " + save[j+1] + "\n";
		}
		window.alert(msg2);
    }else if(Object.keys(save).length < Object.keys(current).length){
		window.alert("Changes to the playlist size have been detected. The current playlist has " + (Object.keys(current).length - size) +
			" more videos than the save. Please save your current playlist in order to find missing videos in the future.");
    }
}

//Delete a playlist from storage
//event - catcher parameter for when the method is called through the listenner
function deletePL(event = null){
    var url = new URL(window.location.href);
    var pl_id = url.searchParams.get('list');

    //Check if the playlist was saved previously
    if(GM_getValue(pl_id) === undefined){
        window.alert('You haven\'t saved this playlist yet.');
        return;
    }
    //confirm playlist save deletion
    if(window.confirm("Are you sure you want to remove this from your saved playlists?")){
        GM_deleteValue(pl_id);

        //update visible buttons
        document.getElementById('savePL').innerHTML = 'Save Playlist';
        document.getElementById('checkPL').style.visibility = 'hidden';
        document.getElementById('deletePL').style.visibility = 'hidden';
    }
}

//Set up the button for user interaction
function setup(){
	//include bootstrap style if it's not presente yet
	var style = document.getElementById(BOOTSTRAP_ID);
	if(style === null){
		style = document.createElement('link');
		style.id = BOOTSTRAP_ID;
		style.rel = 'stylesheet';
		style.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css';
		style.integrity = 'sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh';
		style.crossOrigin = 'anonymous';
		document.head.appendChild(style);
	}
    
	//button creation
	var whats_missing = document.getElementById(WHATS_MISSING_ID);
	if(whats_missing === null){
		var buttons_div = document.createElement('div');
		buttons_div.id = WHATS_MISSING_ID;
		buttons_div.style = 'margin-top:10px;margin-bottom:10px;padding-top:5px;padding-bottom:5px;';
		buttons_div.classList = 'border-top border-bottom';

		var save = document.createElement('button');
		save.id = 'savePL';
		save.classList = 'btn btn-success btn-lg';
		save.style = 'margin:5px;';
		save.innerHTML = 'Update Save';

		var check = document.createElement('button');
		check.id = 'checkPL';
		check.classList = 'btn btn-info btn-lg';
		check.style = 'margin:5px;';
		check.innerHTML = 'Check';

		var del = document.createElement('button');
		del.id = 'deletePL';
		del.classList = 'btn btn-danger btn-lg';
		del.style = 'margin:5px;';
		del.innerHTML = 'Delete Save';

		check.addEventListener("click", checkPL);
		del.addEventListener("click", deletePL);
		save.addEventListener("click", getList);

		var end_text = document.createElement('h5');
		end_text.style = 'margin:5px;color:var(--yt-live-chat-primary-text-color)';
		end_text.innerHTML = "by What's Missing";

		buttons_div.appendChild(save);
		buttons_div.appendChild(check);
		buttons_div.appendChild(del);

		//if playlist isn't saved, only save button is displayed
		if(!containsPL()) {
			save.innerHTML = 'Save Playlist';
			check.style.visibility = 'hidden';
			del.style.visibility = 'hidden'
		}

		buttons_div.appendChild(end_text);

		document.getElementsByClassName('style-scope ytd-playlist-sidebar-primary-info-renderer').menu.appendChild(buttons_div);
	}
}

//DOM event listener to fix the bug where buttons are removed when a video is removed from playlist
var mutationObserver = new MutationObserver(function(mutations) {
    if (!document.getElementById(WHATS_MISSING_ID)) {
        setup()
    }
});

//wait for page to load before loading buttons
window.addEventListener('load', function () {
    if(window.location.href.includes('/playlist')){
       setup();
       mutationObserver.observe(document.getElementsByClassName('style-scope ytd-playlist-sidebar-primary-info-renderer').menu, {childList: true, subtree: true})
    }
})
//reload button when moving between youtube 'pages'
window.addEventListener('yt-navigate-finish', function () {
    var style = document.getElementById(BOOTSTRAP_ID);
	while(style !== null){
		style.parentNode.removeChild(style);
	}
	var whats_missing = document.getElementById(WHATS_MISSING_ID);
	while(whats_missing !== null){
		whats_missing.parentNode.removeChild(whats_missing);
	}
    if(window.location.href.includes('/playlist')){
       setup();
       mutationObserver.observe(document.getElementsByClassName('style-scope ytd-playlist-sidebar-primary-info-renderer').menu, {childList: true, subtree: true})
    }
})
