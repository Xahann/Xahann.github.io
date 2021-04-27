/*jshint browser: true, prototypejs: true, boss: true, evil: true */

/*global
	PHP: true,
	NiGhtBox: true,
	CheckCharsRemaining: true,
	CheckCharsRemainingInElem: true,
	StopCharsRemaining: true,
	GetElement: true,
	StepAnimation: true,
	EndAnimation: true,
	SetElementHTML: true,
	MakeButtonsDead: true,
	MakeButtonsLive: true,
	GetButtons: true,
	GetHeader: true,
	NgXmlDom: true,
	console: false, ActiveXObject: false, ShockwaveFlash: false, cpmStar: false
*/

function begins_with(str, needle) {
	return str.substring(0, needle.length) === needle;
}

function ends_with(str, needle) {
	return str.substring(str.length - needle.length) === needle;
}

function NewWindow(url, height, width, myname) {
	if (typeof myname === typeof undefined) {
		myname = "newwin" + GetRandomNumber(1000000, 9999999);
	}

	var winprops = 'height=' + height + ',width=' + width + ',top=' + ((screen.height - height) / 2) + ',left=' + ((screen.width - width) / 2) + ',status=yes,scrollbars=yes,resizable=yes,toolbar=no,location=no,menubar=no';

	var win = window.open(url, myname, winprops);
	win.window.focus();
	return win;
}

function Reload() {
	// This is better than calling window.reload()
	window.location.href = window.location.href;
}

// Check whether a given number is an integer.
function IsValidInteger(num) {
	return num.length && !(/[^0-9]+/.exec(num));
}

// Takes a regular expression or regular string.
function CountOccurences(val, expr) {
	var parts = val.split(expr);
	return parts.length-1;
}

// Let's get rid of whitespace.
function Trim(text) {
	return String(text).replace(/(^\s*|\s*$)/g, "");
}

function Round(num, precision) {
	if (typeof precision === typeof undefined) {
		precision = 0;
	}

	var multiplier = Math.pow(10, precision);

	return Math.round(num * multiplier) / multiplier;
}

// Utility function to get the value of a <select> element
function SelectValue(select) {
	if(typeof select === "string") {		// Assume this is the id of the select object
		return SelectValue(document.getElementById(select));
	} else if(typeof select == "object") {	// Assume this is the select object itself
		return select.options[select.selectedIndex].value;
	} else {								// Eh... ?!?
		alert("Don't know how to do a SelectValue on " + select);
		return null;
	}
}

// This function has proved expensive for slow computers, so let's try unrolling it.
function FormatNumber(num) {
	num = num.toString();
	var len = num.length;

	if (len <= 3) {
		return num;
	} else if(len <= 6) {
		return num.substring(0, len - 3) + "," + num.substring(len - 3, len);
	} else if(len <= 9) {
		return num.substring(0, len - 6) + "," + num.substring(len - 6, len - 3) + "," + num.substring(len - 3, len);
	} else if(len <= 12) {
		return num.substring(0, len - 9) + "," + num.substring(len - 9, len - 6) + "," + num.substring(len - 6, len - 3) + "," + num.substring(len - 3, len);
	} else {	// We can only handle numbers up to 999,999,999,999
		return -1;
	}
}

function GetRandomNumber(low, high) {
	return Math.floor((Math.random() * (high - low + 1)) + low);
}

function GetPercentage(part, total) {
	if (!part) {
		return 0;
	}

	return FormatNumber( part/total * 100 );
}

function HandleClick(element_name) {
	var this_element = document.getElementById(element_name);
	if(this_element.disabled) {
		return;
	}

	if(this_element.type === "checkbox") {
		this_element.checked = !(this_element.checked);
	} else if(this_element.type === "radio") {
		this_element.checked = true;
	}
}

/* HTML FUNCTIONS */

// If remaining_char_count_elem is not given,
// Assumes there's a span/div id identical to that of the textarea, with the exception that its name has "_chars_remaining"
// appended to it. So, the textarea might be called 'body' and the span/div id would be called 'body_chars_remaining'
// Usage: <textarea ... onkeyup="CharactersRemaining(this);" onkeydown="CharactersRemaining(this);" onchange="CharactersRemaining(this);">
function CharactersRemaining(textarea, maxnum, remaining_char_count_elem) {
	if (PHP.get('DEBUG') && !textarea) {
		if (window.console && console.log){
			console.log("missing textarea for CharsRemaining() in ng.js");
		}
		return;
	}

	if (textarea) {
		var chars_remaining = maxnum - textarea.value.length;
		if(chars_remaining < 0)
		{
			textarea.value = textarea.value.substring(0, maxnum);
			chars_remaining = 0;
		}

		if (!remaining_char_count_elem) {
			remaining_char_count_elem = document.getElementById(textarea.id + "_chars_remaining");
		}

		remaining_char_count_elem.innerHTML = FormatNumber(chars_remaining);
	}
}

// Like above, but we have to have _chars_remaining_minus_html
function CharactersRemainingMinusHTML(textarea, maxnum, maxnumminushtml) {
	CharactersRemaining(textarea, maxnumminushtml);

	var chars_remaining = maxnum - textarea.value.replace(/<\/?(a|i(ns)?|b|u|em|strong).*?>/ig, '').length;
	if(chars_remaining < 0)
	{
		chars_remaining = 0;
	}

	document.getElementById(textarea.id + "_chars_remaining_minus_html").innerHTML = FormatNumber(chars_remaining);
}

(function () {

	// Use this to kick off our chars remaining stuff.  Recalculating on each keypress is too intensive.
	var chars_remaining_timeouts = [];

	CheckCharsRemaining = function (id, max_chars, max_chars_minus_html)
	{
		if(max_chars_minus_html > 0)
		{
			CharactersRemainingMinusHTML(document.getElementById(id), max_chars, max_chars_minus_html);
		}
		else
		{
			CharactersRemaining(document.getElementById(id), max_chars);
		}

		chars_remaining_timeouts[id] = setTimeout("CheckCharsRemaining('" + id + "', " + max_chars + ", " + max_chars_minus_html + ")", 1500);
	};

	CheckCharsRemainingInElem = function (id_or_elem, max_chars, max_chars_minus_html, remaining_char_count_elem)
	{
		var
			elem = $(id_or_elem),
			check_chars
		;

		if (max_chars_minus_html > 0) {
			check_chars = function () {
				CharactersRemainingMinusHTML(elem, max_chars, max_chars_minus_html);
			};
		} else {
			check_chars = function () {
				CharactersRemaining(elem, max_chars, remaining_char_count_elem, remaining_char_count_elem);
			};
		}

		check_chars();
		chars_remaining_timeouts[elem.identify()] = setInterval(check_chars, 1500);
	};

	StopCharsRemaining = function (id)
	{
		clearTimeout(chars_remaining_timeouts[id]);
	};

})();

function GetAge(month, day, year, nowmonth, nowday, nowyear)
{
	var age = nowyear-year;

	if(month<nowmonth) {
		age--;
	} else if(month == nowmonth && day > nowday)
	{
		age--;
	}

	return age;
}

function CheckDate(month, day, year)
{
	var test_date = new Date(month + "/" + day + "/" + year);
	if(test_date.getMonth() + 1 == month)
	{
		return true;
	}
	return false;
}

// Do we have an array element needle in haystack already?
function InArray(needle, haystack) {
	for (var i = 0, len = haystack.length; i < len; i++) {
		if (needle == haystack[i]) {
			return true;
		}
	}

	return false;
}

function remove_value(needle, haystack) {
	var index = jQuery.inArray(needle, haystack);
	if (index >= 0) {
		haystack.splice(index, 1);
	}

	return haystack;
}

// Utility function to take some HTML in a string and give back its DOM representation
function DOMNodeFromHTML(html) {
	var holder_node = Builder.node("div");
	holder_node.innerHTML = html;

	for(var i=0; i<holder_node.childNodes.length; i++)
	{
		if(holder_node.childNodes[i].nodeType == 1)		// 1 = element/tag
		{
			return(holder_node.childNodes[i]);
		}
	}

	return(null);
}

// Function to scroll to an element within a page.
function ScrollToElement(elementid)
{
	new Effect.ScrollTo(elementid);
}

// These are strictly for opening/closing review mod windows.
var reviewmod_win;
function OpenReviewModWindow(url)
{
	reviewmod_win = window.open("http://redirect.ngfiles.com" + url);
}
function CloseReviewModWindow()
{
	reviewmod_win.close();
}

// Class to handle animating text when all we're doing is adding dots on the end (like "Deleting...")
function DotAnimatedText(element_name, animate_class)
{
	var
		// Constants
		NUM_ANIMATION_DOTS = 5,					// Max number of dots to animate
		ANIMATION_CYCLE_TIME = 0.5,				// How many seconds should it take to animate all the dots?

		// Private variables
		timeout_handle = null,					// Handle to the next animation step
		dot_count = 1,							// Used to increment the dots in our animation
		animation_text = "",					// Gets set when we kick off the animation
		original_animation_html = "",			// Store the text we're starting with
		add_class = (typeof animate_class == "string"),
		element = null
	;

	this.Start = function(text_to_animate)
	{
		original_animation_html = GetElement().innerHTML;
		animation_text = text_to_animate;
		StepAnimation();
	};

	this.Stop = function()
	{
		// Clear any pending animations
		EndAnimation();

		// Restore our original text
		SetElementHTML(original_animation_html);
	};

	function StepAnimation()
	{
		var newtext = "";

		if(add_class)
		{
			newtext += "<span class=\"" + animate_class + "\">";
		}

		newtext += animation_text;

		// Build the text with the correct number of dots
		for(var i=1; i<=dot_count; i++)
		{
			newtext += ".";
		}

		// Increment the dot counter
		dot_count++;
		if(dot_count > NUM_ANIMATION_DOTS)
		{
			dot_count = 1;
		}

		if(add_class)
		{
			newtext += "</span>";
		}

		// Stick the text back out there
		SetElementHTML(newtext);

		// Set a timer to call ourselves later
		timeout_handle = setTimeout(StepAnimation, (ANIMATION_CYCLE_TIME / NUM_ANIMATION_DOTS) * 1000);
	}

	function GetElement()
	{
		return $(element_name);
	}

	this.getElement = function ()
	{
		return GetElement();
	};

	function SetElementHTML(html)
	{
		var element = GetElement();
		if(element)
		{
			element.innerHTML = html;
		}
		else
		{
			// This means we tried to set the HTML of an element that's now gone.
			// Simply kill our animation (if necessary) and go home.
			EndAnimation();
		}
	}

	function EndAnimation()
	{
		if(timeout_handle)
		{
			clearTimeout(timeout_handle);
			timeout_handle = null;
		}
	}
}

// Class for doing "in progress" animations in box headers
function HeaderAnimator(element_id, animation_text)
{
	var
		// ================ CONSTANTS ================
		ANIMATION_CLASSNAME = "i-activity",		// The class we apply while the animation is happening

		// ================ PRIVATE variables ================
		animation_running = false,				// Is the "Leaving Comment..." animation running?
		button_link_html = [],			// The HTML from the link inside our button
		button_classes = [],			// All buttons don't have the same class
		animated_text = new DotAnimatedText(element_id + "_header"),

		GetHeader,

		// This is the original stuff (pre-animation) text that appears in the header
		original_text = GetHeader().firstChild.data,
		original_classname = GetHeader().className,

		// // Let's try to force a pre-load of the activity image that the CSS uses
		activity_image = new Image()
	;

	activity_image.src = "http://img.ngfiles.com/hicons/i67.gif";		// Referenced in the i-activity class

	// ================ PUBLIC functions ================
	this.Start = function(text_to_animate)
	{
		if(!(animation_running))
		{
			animation_running = true;

			// Let's see if they're passing in the text to animate here
			if(typeof text_to_animate == "string")
			{
				animation_text = text_to_animate;
			}

			// This kicks off our dot animation
			animated_text.Start(animation_text);

			// Swap in the hourglass image
			GetHeader().className = ANIMATION_CLASSNAME;

			// Deactivate the button
			MakeButtonsDead();
		}
	};

	this.Stop = function()
	{
		if(animation_running)
		{
			animation_running = false;

			// Stop any running animation
			animated_text.Stop();

			// Swap back in the original icon image
			GetHeader().className = original_classname;

			// Make the button clickable again
			MakeButtonsLive();
		}
	};

	// ================ PRIVATE functions ================
	function MakeButtonsLive()
	{
		var button_elements = GetButtons();
		var button;

		for(var i=0; i<button_elements.length; i++)
		{
			button = button_elements[i];

			// Replace the dead button guts with the live one
			button.innerHTML = button_link_html[i];
			button.className = button_classes[i];
		}
	}

	function MakeButtonsDead()
	{
		var button_elements = GetButtons();
		var button;

		for(var i=0; i<button_elements.length; i++)
		{
			button = button_elements[i];

			// Store the old button link
			button_link_html[i] = button.innerHTML;
			button_classes[i] = button.className;

			// Now replace the live button guts with the dead one
			button.innerHTML = "<span>" + button.firstChild.innerHTML + "</span>";
			button.className = "btn dead";
		}
	}

	GetHeader = function () {
		return document.getElementById(element_id + "_header");
	};

	function GetButtons()
	{
		var
			all_spans = GetHeader().parentNode.getElementsByTagName("span"),
			buttons = [],
			i
		;

		for(i=0; i<all_spans.length; i++)
		{
			if(/_button$/.test(all_spans[i].id))
			{
				buttons[buttons.length] = all_spans[i];
			}
		}

		return buttons;
	}
}

// Function for adding and immediately removing a space to some text.  Forces the browser to re-render stuff.
function AddRemoveSpace(element)
{
	if(typeof element.value == "string")	// For form elements
	{
		element.value += " ";
		element.value = element.value.substring(0, element.value.length - 1);
	}
	else					// Normal text embedded in the page
	{
		element.firstChild.data += " XYZ";
		element.firstChild.data = element.firstChild.data.substring(0, element.firstChild.data.length - 4);
	}
}

// Use this to properly write out the HTML for any Flash.
function FlashWriter(url, width, height)
{
	var
		LookForFlashPlugin = function () {
			var flash_versions = 12, x;

			// Code swiped from http://www.dangrossman.info/2007/01/03/detecting-flash-and-java-with-javascript/
			if (navigator.plugins && navigator.plugins.length) {
				// Netscape style plugin detection
				for (x = 0; x <navigator.plugins.length; x++) {
					if (navigator.plugins[x].name.indexOf('Shockwave Flash') != -1) {
						return(true);
					}
				}
			} else if (window.ActiveXObject) {
				// ActiveX style plugin detection
				for (x = 2; x <= flash_versions; x++) {
					try {
						// oFlash = eval("new ActiveXObject('ShockwaveFlash.ShockwaveFlash." + x + "');");
						var oFlash = new ActiveXObject(ShockwaveFlash.ShockwaveFlash[x]);
						if (oFlash) {
							return true;
						}
					}
					catch(e) { }
				}
			}

			return(false);
		},

		// Options here are "window", "opaque", and "transparent"
		DEFAULT_WINDOW_SETTING = "window",

		// Defaults for optional stuff below
		quality = "high",
		id = "flash" + GetRandomNumber(1000000, 9999999),
		wmode = DEFAULT_WINDOW_SETTING,
		script_access = "sameDomain",
		allow_fullscreen = "false",
		fullscreen_on_selection = "false",

		params = null,
		has_flash = LookForFlashPlugin()
	;

	this.SetQuality = function (new_quality) {
		quality = new_quality;
	};

	this.SetID = function (new_id) {
		id = new_id;
	};

	this.SetTransparent = function (is_transparent) {
		wmode = is_transparent ? "transparent" : DEFAULT_WINDOW_SETTING;
	};

	this.SetOpaque = function (is_opaque) {
		wmode = is_opaque ? "opaque" : DEFAULT_WINDOW_SETTING;
	};

	this.SetDirect = function (is_direct) {
		wmode = is_direct ? 'direct' : DEFAULT_WINDOW_SETTING;
	};

	this.SetFullScreen = function (fullscreen) {
		allow_fullscreen = fullscreen ? "true" : "false";
	};

	this.SetFullScreenOnSelection = function (fullscreen) {
		fullscreen_on_selection = fullscreen ? "true" : "false";
	};

	this.SetScriptAccess = function (new_script_access) {
		script_access = new_script_access;
	};

	this.SetParams = function (new_params) {
		params = new_params;
	};

	this.ToString = function() {
		var str = "";

		if (has_flash) {
			// join is supposedly faster than repeated concats, and it takes fewer characters
			str = [
				str,
				'<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="' + width + '" height="' + height + '" id="' + id + '">',
				'<param name="allowScriptAccess" value="' + script_access + '" />',
				'<param name="allowFullScreen" value="' + allow_fullscreen + '" />',
				'<param name="movie" value="' + url + '" /><param name="quality" value="' + quality + '" />',
				'<param name="wmode" value="' + wmode + '" />',
				'<param name="fullScreenOnSelection" value="' + fullscreen_on_selection + '" />'
			].join('');

			if (params) {
				// IE needs this
				str += '<param name="flashvars" value="' + params + '" />';
			}

			str += '<embed src="' + url + '" quality="' + quality + '" ';

			if (params) {
				// Non-IE browsers need this
				str += 'flashvars="' + params + '" ';
			}

			str = [
				str,
				'wmode="' + wmode + '" width="' + width + '" height="' + height + '" name="' + id + '" allowScriptAccess="' + script_access +'" ',
				'fullScreenOnSelection="' + fullscreen_on_selection + '" ',
				'allowFullScreen="' + allow_fullscreen + '" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />',
				'</object>'
			].join('');
		} else {
			str += '<p style="text-align: center; margin-top: 2em; margin-bottom: 2em; padding-top: 3em; padding-bottom: 3em; background: #333333">You don\'t appear to have <a target="_blank" href="http://getflash.ngfiles.com">Flash</a> installed. <a target="_blank" href="http://getflash.ngfiles.com">Click here</a> to get it (it\'s free).</p>';
		}

		return str;
	};

	this.Print = function () {
		document.write(this.ToString());
	};
}

/*
Class to handle checkbox items for our checkbox element controls.
Assumes that the checkboxes have ids of prefix + NUM, where NUM is 0 through
total elements.
*/

// There's really no reason to have to pass in total here - rewrite this at some point
// FIXME: this can probably go away forever, double check first - JH
function CheckboxItems(total, prefix) {
	var ids = [], keys = [];

	// Returns a checkbox element, with the given id.
	function GetElement(id) {
		return document.getElementById(prefix +  id);
	}

	// Sets any checked boxes to unchecked and vice-versa
	this.ToggleAll = function() {
		// Clear out the ids
		ids = [];
		keys = [];

		// Set out temporary values.
		var is_checked,
			is_disabled,
			element;

		for (var i = 0; i < total; i++) {
			element = GetElement(i);

			is_checked = element.checked;
			is_disabled = element.disabled;

			if (!is_checked && !is_disabled) {
				// We add it into our list of ids (and keys), since it is about to get checked.
				keys[keys.length] = i;
				ids[ids.length] = element.value;
			}

			if (!is_disabled) {
				element.checked = !is_checked;
			}
		}
	};

	// We need this for our global list of ids, so if it's checked then we
	// need to know about it.
	this.Toggle = function(id)
	{
		var element = GetElement(id), i;

		if (element.checked && !InArray(element.value, ids)) {
			// We bang it straight in here.
			keys[keys.length] = id;
			ids[ids.length] = element.value;
		} else if (!element.checked && InArray(element.value, ids)) {
			// We were previously checked by our toggle button.
			for (i = 0; i < total; i++) {
				if (element.value == ids[i]) {
					keys.splice(i, 1);
					ids.splice(i, 1);
					break;
				}
			}
		}
	};

	// Clears all checkbox elements, even if previously unchecked.
	this.ClearAll = function() {
		ids = [];
		keys = [];

		for (var i = 0; i < total; i++) {
			GetElement(i).checked = false;
		}
	};

	// Selects all checkbox elements, whether previously checked or not.
	this.SelectAll = function() {
		ids = [];
		keys = [];

		for (var i = 0; i < total; i++) {
			GetElement(i).checked = true;
			keys[keys.length] = i;
			ids[ids.length] = GetElement(i).value;
		}
	};

	this.Enable = function() {
		for (var i=0; i<total; i++) {
			GetElement(i).disabled = false;
		}
	};

	this.Disable = function() {
		for (var i = 0; i < total; i++) {
			GetElement(i).disabled = true;
		}
	};

	this.GetKey = function(num) {
		return keys[num];
	};

	this.GetKeys = function() {
		return keys;
	};

	this.GetID = function(num) {
		return ids[num];
	};

	this.GetIDS = function() {
		return ids;
	};

	this.IsToggled = function() {
		return ids.length > 0;
	};

	this.GetNumChecked = function() {
		return ids.length;
	};
}

// instantiate holder for PHP variables
var PHP = (function () {
	var vars = {};

	return {
		get : function (var_name, default_value) {
			return PHP.has(var_name) ? vars[var_name] : default_value;
		},

		set : function (var_name, value) {
			return (vars[var_name] = value);
		},

		has : function (var_name) {
			return typeof vars[var_name] !== 'undefined';
		},

		req : function (var_name) {
			if (!PHP.has(var_name)) {
				alert(var_name + " must be set, but it isn't.");
			}

			return PHP.get(var_name);
		},

		// var_name is an array, and we'return pushing value onto it
		add : function (var_name, value) {
			if (!PHP.has(var_name)) {
				PHP.set(var_name, []);
			}

			return vars[var_name].push(value);
		},

		// takes a list of key => value pairs, in the form of { key1: value1, key2: value2, ... }
		// wanted to call it "import", but that is an obscure keyword in javascript
		merge : function (obj) {
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					PHP.set(key, obj[key]);
				}
			}
		}
	};
})();

var NiGhtBox = (function ($) {

	var
		blackout_class = 'blackout-on',
		no_dimming_class = 'nodimming',
		no_dim_class = 'nodim',
		visibility = 'visibility',
		KEY_ESC = 27, // key code for escape
		elem, height, loading,
		no_dim_elem,
		ads, blackout, blackout_center,
		visible = false,
		hide_on_esc = true,

		stored_content = null,

		getAds = function () {
			if (!ads) ads = $('.adunit');

			return ads;
		},

		hideAds = function () {
			getAds().css(visibility, 'hidden');
		},

		showAds = function () {
			getAds().css(visibility, 'visible');
		},

		escHandler, // putting this here for jshint's benefit

		updateEscListener = function () {
			if (hide_on_esc && visible) {
				$('body').keydown(escHandler);
			} else {
				//$('body').unbind('keydown', escHandler);

				// updated for jquery 3
				$('body').off('keydown', escHandler);
			}
		}
	;

	escHandler = function (e) {
		if (e.which == KEY_ESC) {

			if (!NiGhtBox.onClosed || NiGhtBox.onClosed() !== false) {
				NiGhtBox.hide();
				updateEscListener();
			}
			return false;
		}
	};

	return {
		// if true, blackouts will hide when the background is clicked
		autohide: true,

		// you can set this to a callback for when ESC his hit, or a background is clicked.  Return false to cancel close.
		onClosed: null,

		init: function () {
			blackout = $('#blackout');
			blackout_center = $('#blackout_center');
			blackout_hover = $('#blackout_hover');

			$blackout_bg = $('#blackout-bg');

			$blackout_bg.click(function() {
				if (NiGhtBox.autohide && PHP.get('ng_design',2012) != 2012 &&  (!NiGhtBox.onClosed || NiGhtBox.onClosed() !== false)) {
					NiGhtBox.hide();
				}
				return false;
			});

			var c = blackout_center.html().trim();

			// store any original content in case we need it back
			// currently, the flags are using this in the art portal view page -
			// which loads the large view into a nightbox slot. Flagging
			// wipes the contents of the slot and we need it back after they
			// have flagged, so js/global/flag.js uses NiGhtBox.restore() in its
			// close method
			if (c.length) {
				stored_content = c;
			}

			return NiGhtBox;
		},

		load: function (elem, elem_height, afterLoad) {
			if (!blackout || !blackout_center) {
				NiGhtBox.init();
			}

			loading = true;
			elem.detach();

			// .loaded() is a custom function in jquery_extensions.js
			blackout_center.append(elem).loaded(function () {
				// if passed a function for the height, evaluate it now
				if (typeof elem_height === 'function') {
					height = elem_height(blackout_center, blackout);
				} else if (typeof elem_height === typeof undefined) {
					elem_height = elem.height();
				} else {
					height = elem_height;
				}

				loading = false;

				if (afterLoad) {
					afterLoad();
				}
			});

			return NiGhtBox;
		},

		replace: function(elem, elem_height, afterLoad) {
			if (!blackout || !blackout_center) {
				NiGhtBox.init();
			}

			blackout_center.down().remove();

			// there's a timeout in the loaded() event handling function that (in
			// NiGhtBox.load()) that causes height to set to 0 in certain
			// circumstances.
			// If we get  the height here, assume it's good and don't rely on the
			// fallback of checking the element's height in the load() function
			if (typeof elem_height !== typeof undefined) {
				height = elem_height;
			}

			NiGhtBox.load(elem, elem_height, afterLoad);

			return NiGhtBox;
		},

		// if the page loaded with content in the nightbox slot, using this will
		// return that content to the slot
		restore: function() {
			if (!blackout || !blackout_center) {
				NiGhtBox.init();
			}

			// put the initial content back
			if (stored_content) {
				blackout_center.html(stored_content);

				// reset the height
				height = blackout_center.down().height();
			}

			return NiGhtBox;
		},

		show: function (element) {
			if (!blackout || !blackout_center) {
				NiGhtBox.init();
			}

			var nodim = element ? true:false;
			element = element ? $.$(element) : blackout_center.down();

			var win_height, scroll;

			// center element
			if (element) {
				setTimeout(function() {
					// try to find height
					if (!height) {
						height = element.height();
					}

					if (height) {
						scroll = Math.max($('html').scrollTop(), $(window).scrollTop());
						win_height = $(window).height();

						var $notification_bar = $('#notification-bar');
						if ($notification_bar.outerHeight()) win_height -= $notification_bar.outerHeight();

						// don't show top of box above top of screen
						if (height > win_height) {
							blackout_center.css('margin-top', scroll + 'px');
						} else {
							blackout_center.css('margin-top', scroll + (win_height - height) / 2 + 'px');
						}
					} else {
						$(element).addClass();
					}
				},1);
			}

			hideAds();

			// show it
			blackout.addClass(blackout_class);
			blackout.show();
			blackout_hover.show();

			if (element && nodim) element.addClass(no_dim_class);

			if (element) {
				element.show();
			}

			visible = true;

			if (hide_on_esc) {
				updateEscListener();
			}

			$(document).trigger('NiGhtBox:on');
			return NiGhtBox;
		},

		hide: function (element) {

			var nodim = element ? true:false;
			if (!blackout || !blackout_center) {
				NiGhtBox.init();
			}

			element = element ? $.$(element) : blackout_center.down();

			showAds();
			blackout.removeClass(blackout_class);
			blackout.hide();
			blackout_hover.hide();

			if (element && nodim) element.removeClass(no_dim_class);
			visible = false;

			if (hide_on_esc) {
				updateEscListener();
			}

			$(document).trigger('NiGhtBox:off');
			return NiGhtBox;
		},

		toggle: function (element) {
			if (!blackout || !blackout_center) {
				NiGhtBox.init();
			}

			if (blackout.hasClass(blackout_class)) {
				return NiGhtBox.hide(element);
			} else {
				return NiGhtBox.show(element);
			}
		},

		// return boolean
		visible: function () {
			return visible;
		},

		// control whether ESC backs out of NiGhtBox
		hideOnEsc: function (bool) {
			hide_on_esc = bool;
			updateEscListener();

			return NiGhtBox;
		}
	};

})(jQuery);

/**
 * Validate form fields
 *
 * @param form mixed The form element, or a selector to it
 * @param validations object See examples
 *
 * Here is an example:
 *
 * {
 *   require: [
 *     { name: 'review_body', msg: 'Bad body' },
 *     { name: 'review_stars', msg: 'Give stars!' }
 *   ],
 *
 *   regex: [
 *     { name: 'review_body', regex: /^[^<>#\\]*$/, msg: 'Bad body' }
 *   ]
 * }
 *
 * Here is the same example, with the alternate, more concise syntax:
 *
 * {
 *   require: [
 *     ['review_body', 'Bad body' ],
 *     ['review_stars', 'Give stars!']
 *   ],
 *
 *   regex: [
 *     ['review_body', /^[^<>#\\]*$/, 'Bad body']
 *   ]
 * }
 *
 * Expanded to include 'require', 'regex', 'min_length', 'max_length',
 * 'checked' and 'equals'.
 *
 */
var NgFormValidator = function (the_form, validations) {
	var
		inputs,
		errors = [],
		$ = jQuery,
		form,
		callback
	;

	form = $(the_form);

	if (!form.length) {
		throw 'Form not found in NgFormValidator()';
	}

	var
		failed = function (validation) {
			errors.push({
				name: validation.name || validation[0],
				msg: validation.msg || validation[validation.length - 1]
			});
		},

		hasError = function (name) {
			return $.any(errors, function (err) {
				return name == err.name;
			});
		},

		checkValidation = function (type, validation, inputs) {
			// find input by name
			var
				name = validation.name || validation[0],
				input = inputs.filter("[name='" + name + "']"),
				val,
				passed,
				i,
				len
			;

			// disabled or nonexistent field automatically validates
			if (input.length === 0) {
				return true;
			} else if (input.length === 1) {
				if (input.attr('type') === 'checkbox') {
					val = input.filter(':checked').val();
				} else {
					val = input.val();
				}
			} else {
				val = input.filter(':checked').first().val();
			}

			// handle error if input does not exist
			// FIXME: some checkboxes are only available when the user has
			// not agreed to something in the past.
			if (PHP.get('DEBUG') && !input.exists() && type !== 'checked') {
				throw 'Required input does not exist: ' + name;
			}

			switch (type) {
			case 'require':
				passed = val && val.length;
				break;
			case 'regex':
				passed = !val || val.match(validation.regex || validation[1]);
				break;
			case 'min_length':
				passed = val && val.length >= (validation.length_requirement || validation[1]);
				break;
			case 'max_length':
				passed = !val || val.length <= (validation.length_requirement || validation[1]);
				break;
			case 'checked':
				passed = !input.exists() || input.is(':checked');
				break;
			// checks to see whether one input is the same value as the one specified
			case 'equals':
				passed = !val || val === inputs.filter("[name='" + (validation.second_value || validation[1]) + "']").val();
				break;

			case 'one_of':
				others = validation;
				passed = val && val.length;

				for (i = 1, len = others.length - 1; i < len; ++i) {
					val = inputs.filter("[name='" + (others[i]) + "']").val();
					passed = passed || val && val.length;
				}

				break;

			case 'greater_than':
				passed = val && parseInt(val, 10) > parseInt((validation.min || validation[1]), 10);
				break;

			default:
				throw 'Unknown validation type: ' + type;
			}

			if (!passed) {
				failed(validation);
			}
		},

		dependenciesValid = function (validator) {
			if (validator.depends && !$.isArray(validator.depends)) {
				throw "'depends' property of validator must be an array";
			}

			return !validator.depends || !$.any(validator.depends, function (name) {
				return hasError(name);
			});
		},

		doCallback = function() {
			if (callback) {
				callback();
			}
		}
	;

	this.validate = function () {
		errors = []; // discard errors from previous attempt
		inputs = form.find('input:enabled, textarea:enabled, select:enabled');

		if (inputs && inputs.length) {
			$.each(validations, function (type, validation_list) {
				var len = validation_list.length;

				for (var i = 0; i < len; ++i) {
					if (dependenciesValid(validation_list[i])) {
						checkValidation(type, validation_list[i], inputs);
					}
				}
			});
		} else if (PHP.get('DEBUG')) {
			if (window.console && console.log){
				console.log('no inputs found');
			}
		}

		var is_valid = errors.length === 0;

		if (!is_valid) {
			doCallback();
		}

		return is_valid;
	};

	this.getErrors = function () {
		return errors;
	};

	this.isValid = function () {
		return errors.length === 0;
	};

	this.getErrorMessages = function () {
		var msgs = [];
		for (var i = errors.length - 1; i >= 0; --i) {
			msgs.push(errors[i].msg);
		}

		return $.nub(msgs);
	};

	this.getFailedInputs = function () {
		var failures = [];

		for (var i = errors.length - 1; i >= 0; --i) {
			failures.push(errors[i].name);
		}

		return failures;
	};

	// gets the first field that failed to focus (useful on big forms, where
	// the page is scrolled down to the submit button and the error occured
	// much further up the page) OR to a specified input
	this.sendFocusTo = function (input_name) {
		if (typeof input_name === 'undefined') {
			inputs.filter("[name='" + (errors.pop().name) + "']").focus();
		} else {
			if (PHP.get('DEBUG') && !inputs.filter("[name='" + input_name + "']").exists()) {
				throw 'Cannot focus on this, as it does not exist: ' + input_name;
			}

			inputs.filter("[name='" + input_name + "']").focus();
		}
	};

	this.setCallback = function (call_backable) {
		callback = call_backable;
	};

};


NgFormValidator.prototype.inform = function () {
	// tell user about errors
	// this should be overriden, or rewritten, to create different methods of informing user
	alert(this.getErrorMessages().join("\n"));
};

/**
 * Loosely coupled version of some code in AjaxHandler
 */
NgXmlDom = function(response) {
	this._xml = response;
};
NgXmlDom.prototype = {
	isValidDom: function () {
		if (this._is_valid_dom === undefined) {
			this._is_valid_dom = this._xml && this._xml.documentElement;
		}

		return this._is_valid_dom;
	},

	getXml: function () {
		return this._xml;
	},

	getField: function (tag_name) {
		if (this.isValidDom()) {
			// Now check for this specific field
			var node_list = this._xml.documentElement.getElementsByTagName(tag_name);
			if (node_list && node_list.length == 1 && node_list[0].firstChild) {
				return node_list[0].firstChild.data;
			}
		}
	},

	hasField: function (tag_name) {
		if (this.isValidDom()) {
			var node_list = this._xml.documentElement.getElementsByTagName(tag_name);
			return node_list && node_list.length == 1 && node_list[0].firstChild;
		}
	},

	STATUS_ERROR        : 0,
	STATUS_SUCCESS      : 1,
	STATUS_ERROR_SILENT : 2,

	validate: function(error_handler) {
		var response_status = this.getField('status');

		if (!response_status && 0 !== response_status) {
			alert('Server error.  Please wait a moment and try again.');

			if (error_handler) {
				error_handler(this);
			}

			return false;
		} else {
			switch (parseInt(response_status, 10)) {
			case this.STATUS_SUCCESS:
				return true;
			case this.STATUS_ERROR:
				alert('Error - ' + this.getField('errormsg'));

				if (error_handler) {
					error_handler(this);
				}

				return false;
			case this.STATUS_ERROR_SILENT:
				return false;
			}
		}
	}
};

// select box styles require JS to update their "facade" element
function enableSelectFacades() {

	var $ = jQuery;

	var has_select_facades = $('div.select select').off;
	if (has_select_facades === undefined) return;

	var
		showSelected = function (select) {
			var $select = $(select);
			$select.prev().text($select.getSelected().text());
			// more reliable, maybe: jQuery(search_type_select).parent().find('span.fakeselecttext').text(selected_option.text());
		},
		select_event_handler = function () {
			showSelected(this);
		}
	;

	// onchange, update the facade span with the new text
	$('div.select select')
		.off('change', select_event_handler)
		.on('change', select_event_handler)
		.off('keyup', select_event_handler)
		.on('keyup', select_event_handler)
		// keydown is necessary for auto-repeat, when you hold the arrow key down
		.off('keydown', select_event_handler)
		.on('keydown', select_event_handler)
		// initialize facade spans
		.Each(showSelected)
		;
}

// Initializations - these should go in another file probably
jQuery(function($) {
	var
		init_fp_web_features = function () {
			var feature_link = function (cpm) {
				return '<li><a href="' + cpm.getLink() +
					'"><img title="" alt="Ad Icon" src="' + cpm.getImageUrl(70,70) +
					'" width="70" height="39" /></a><div><div><div><a href="' + cpm.getLink() +
					'">' + cpm.getTitle() +
					'</a><span>' + cpm.getDescription(100) +
					'</span></div></div></div></li>'
				;
			};

			if (window.cpmStar) {
				var
					webfeature = $('div#webfeature'),
					cpm_list = $('<ul class="centeredblocks webfeature"></ul>'),
					num_ads = 8,
					i
				;

				// append ads
				for (i = num_ads - 1; i; --i) {
					cpm_list.append(feature_link(cpmStar));
					cpmStar.nextAd();
				}
				// this way we don't fetch an extra ad that we don't use
				cpm_list.append(feature_link(cpmStar));

				webfeature.append(cpm_list);
			}
		}
	;

	// generic jquery for adding nightbox and minimizing functionality to any pod on the page
	$('div.podtop a.min')
		.click(function(e) {
			if ($(this).hasClass('ignore')) return false;

			// using a single var statement reduces minified size
			var
				$this = $(this),
				pt = $this.parentsUntil('div.podtop').parent().parent(),
				podtop
			;

			podtop = $this.parents('div.podtop:first');
			if (!podtop.hasClass('minimized')) podtop.addClass('minimized');

			return false;
		});

	$('div.podtop a.max')
		.click(function(e) {
			if ($(this).hasClass('ignore')) return false;

			var podtop = $(this).parents('div.podtop:first');
			if (podtop.hasClass('minimized')) podtop.removeClass('minimized');

			return false;
		});

	$('input[type="reset"]').click(function (e) {
		return confirm('Are you sure you want to reset this form?');
	});

	/* FIXME: need to style select boxes, etc, on focus
	$('div.select select').focus(function (e) {
		$(this).up('div.select').css('border', '3px solid yellow');
	}).blur(function (e) {
		$(this).up('div.select').css('border', 'none');
	});
	*/

	$('input[type="file"]').change(function (e) {
		$(this).setUploadVal();
	});

	// disable submit buttons when form is submitted. Forms that need to re-enable
	// the submit buttons will have to do so manually
	// $('form').preventDoubleSubmit();

	// style alternating rows in tables. This will be obsolete in CSS3
	$('table.alternate tr:odd').addClass('alt');

	// make IE obey label click
	if (PHP.get('is_ie')) {
		$('label').click(function (e) {
			$('#' + e.closest('label').attr('for')).click();
			e.preventDefault();
		});
	}

	// header nav animations
	(function () {
		var
			currently_shown,
			animating = [],
			hovering = false,
			uniq = 0,
			unanimate = function (uniq_id) { animating = remove_value(uniq_id, animating); },
			not_animating = function (uniq_id) { return !InArray(uniq_id, animating); }
		;

		$('#header_nav > dl').each(function () {
			this.my_dds = $(this).children('dd');
			this.uniq = ++uniq;
		}).mouseenter(function(e) {
			var me = this.uniq, mine = this.my_dds;

			hovering = me;

			if (not_animating(me)) {
				animating.push(me);

				// currently_shown.slideUp('fast');
				currently_shown = { dds: mine, uniq: me };

				this.my_dds.slideDown(50, function () {
					unanimate(me);

					if (me !== hovering) {
						mine.hide();
					}
				});
			}

			return false;
		}).mouseleave(function(e) {
			var me = this.uniq, mine = this.my_dds;

			hovering = false;

			if (not_animating(me)) {
				animating.push(me);

				this.my_dds.slideUp('fast', function () {
					unanimate(me);

					if (me === hovering) {
						mine.show();
					}

				});
			}

			return false;
		});
	})();

	// search
	$('#topsearch').submit(function (e) {
		e.preventDefault();
		var search = $('#topsearch_text').val().replace('/', ' ');
		var url =
			PHP.get('search_urls')[$('#topsearch_type').getSelected().val()] + '/' +
			encodeURIComponent(search)
		;

		document.location = url;
	});

	var is_iphone_ipad_or_ipod = navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad)/);
	PHP.set('is_iphone_ipad_or_ipod', is_iphone_ipad_or_ipod);

	// default text for login boxes
	/*
	var defaultInput = function (elem, text) {
		elem.focus(function () {
			if (elem.val() == text) elem.val('');
		}).blur(function () {
			if (! elem.val() ) elem.val(text);
		}).blur();
	};

	defaultInput($('#username'), 'username');
	// defaultInput($('#password'), 'password');
	// this is a problem - the word "password" appears as bullets, not letters
	// need to do some trick to change this. Boo.
	*/

	// HERE'S THE TRICK :D - JT
	var label_username = $('#header_label_username');

	if (label_username.length) { // cheap way to skip this if the user is logged in

		var
			label_password = $('#header_label_password'),
			input_username = $('#username'),
			input_password = $('#password'),
			remember_me = $('#remember'),
			// attempt at hack for apple's stuff

			assignLabelAction = function(input, label) {
				label.click(function() {
					$(this).hide();
					input.focus();
				});
			},

			defaultLabel = function(input, label) {
				var defaultIfEmpty = function() {
					if (input.val()) {
						label.hide();
					} else {
						label.show();
					}
				};

				input
					.focus(function() { label.hide(); })
					.blur(defaultIfEmpty)
					.blur();

				// fix Chrome's broken autofill
				setTimeout(defaultIfEmpty, 100);
			};

		defaultLabel(input_username, label_username);
		defaultLabel(input_password, label_password);

		if (is_iphone_ipad_or_ipod) {
			assignLabelAction(input_username, label_username);
			assignLabelAction(input_password, label_password);
			remember_me.css('z-index', '9999');
		}

		remember_me.next('span').click(function() { remember_me.checked = !remember_me.checked; });
	}

	// for toggling banner ads on light dimming
	var adcode_html = {};
	var lights = true;

	// obj is not always defined, if coming from say, portal view
	var handleLights = function(obj) {
		var standalone = typeof undefined === typeof obj;
		obj = typeof undefined === typeof obj ? null : obj;

		NiGhtBox.toggle();

		if (lights) {
			lights = false;

			$('div[id^="adcode_iframe_"]').each(function() {
				var id = $(this).attr('id');
				var html = $(this).html();
				adcode_html[id] = html;
				$(this).html("");
			});

		} else {
			lights = true;

			$('div[id^="adcode_iframe_"]').each(function() {
				var id = $(this).attr('id');
				var html = adcode_html[id];
				$(this).html(html);
			});

			adcode_html = {};
		}

	};

	// art view
	/*$('#portal_item_view').on('click', function() {
		handleLights();
		return false;
	});*/

	/*$('#blackout_center').on('click', function() {
		var d = $(this).down();

		if ($(d).is('img')) {
			$(d).remove();
			handleLights();
		}
	});*/

	// generic jquery for adding nightbox and minimizing functionality to any pod on the page
	$('.podtop').on('click', function(e) {
		var link = $(e.closest('a'));

		if (link.length) {
			if (link.hasClass('dim')) {
				handleLights($(this).parent());
			} else if (link.hasClass('max')) {
				$(this).removeClass('minimized');
			} else if (link.hasClass('min')) {
				link.addClass('minimized');
			} else {
				return;
			}

			e.preventDefault();
		}
	});

	// pop out playlist forms in our view/listen pages
	(function() {
		var
			pl_add_form = $('#playlist_add'),
			pl_add_form_exists = pl_add_form.exists()
		;
		// this class is used in "back to playlists" links as well as in the view/listen pages
		$('.pl-add, .icon-playlist').click(function() {
			if (pl_add_form_exists) {
				pl_add_form.toggle();
				return false;
			}
		});
	})();

	// workaround for FF autocomplete radio tag bug. See http://www.ryancramer.com/journal/entries/radio_buttons_firefox/
	// $.browser is deprecated as of jQuery 1.9.  Mozilla supposedly fixed this bug on 2016-04-06 so we're skippping this functionality.
	//if ($.browser.mozilla) {
	//	$('input[type="radio"]').attr('autocomplete', 'off');
	//}

	enableSelectFacades();
	init_fp_web_features();

	// generic click checkboxes and radios to accommodate ipod/ipad/iphone users
	$(document).ready(function() {

		/*

		areas covered here:

			- generic GG login form
			- PM inbox/sentbox
			- user agreements (at least in the bbs, not tested elsewhere)
			- bbs moderation radios

		*/

		/*
		var
			prev,
			elements_to_inspect = $('ul.checkboxes li span, table.pmlist tr td span, table#pending_requests tr td span')
		;

		if (is_iphone_ipad_or_ipod) {

			elements_to_inspect.click(function() {
				alert('here');
				prev = $(this).prev('input');

				if (prev.is('input[type="checkbox"]') || prev.is('input[type="radio"]')) {
					//prev.get(0).checked = !prev.get(0).checked;
					//prev.get(0).focus();

					$(this).down().css('background-position',  prev.get(0).checked ? '0 0px' : '0 -17px');
				}

			});

		}
		*/

	});

});

// cross-browser event handling
function addEvent(elem, evnt, func) {
	if (elem.addEventListener)  {// W3C DOM
		elem.addEventListener(evnt,func,false);
		return true;
	} else if (elem.attachEvent) { // IE DOM
		elem.attachEvent("on"+evnt, func);
		return true;
	} else {
		console.log('Your browser does not support event listeners');
		return false;
	}
}

// hack for IE 9 and older
if (typeof(([]).indexOf) == "undefined") {
	Array.prototype.indexOf = function(o,i){
	var j = this.length;
	for(i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; i < j && this[i] !== o; i++);
		return j <= i ? - 1 : i;
	};
}

var SearchHelper = (function($) {
	var self = this;

	var conductSearch = function($form) {
		var new_params = [];
		var params = $form.serializeArray();

		for (var i = 0, len = params.length; i < len; ++i) {
			if (params[i].value.length) {
				if (params[i].name === 'advanced') {
					continue;
				}

				new_params.push(params[i].name + '=' + encodeURI(params[i].value));
			}
		}

		window.location.href = $form.attr('action') + '?' + new_params.join('&');
	};

	// utility function for populating results
	var populateSuggestion = function(object, values, $element) {

		// this has some callback relating specifically to the input field
		// - e.g. tag input in the portals, selecting a tag
		// populates this into the collection
		if (object.field && object.options.callbacks && object.options.callbacks.field) {
			object.options.callbacks.field($element, object.field);
		}

		for (var i in values) {
			$('[data-html="' + i + '"]', $element).html(values[i]);
			$('[data-src="' + i + '"]', $element).attr('src', values[i]);
			$('[data-href="' + i + '"]', $element).attr('href', values[i]);
			$('[data-hidden="' + i + '"]', $element).val(values[i]);
		}
	};

	var $focus = null;
	var onFocus = function(e, ui) {
		var label = ui.item.text || ui.item.title;

		if ($focus) {
			$focus.removeClass('selected');
		}

		$focus  = $('#' + ui.item.id);
		$focus.addClass('selected');

		return false;
	};

	var onSelect = function(e, ui) {
		if (ui.item.url) {
			window.location = ui.item.url;
			return false;
		}

		var label = ui.item.text;
		if (undefined === label || !label.length) {
			label = ui.item.title;
		}

		if (label.length) {
			field.val(label);

			var $f = $(e.target).parent('form');

			if ($f.length) {
				$f.submit();
			}
		}

		return false;
	};

	var getBeforeAfterDates = function(object) {
		if (typeof undefined === typeof object.prefix || null === object.prefix) {
			return null;
		}

		var prefix = object.prefix;

		var after = $('#' + prefix  + '_after');
		var before = $('#' + prefix  + '_before');

		if (!after.exists() || !before.exists()) {
			return null;
		}

		return [after, before];
	};

	var watchMobileDates = function(object) {
		var dates = getBeforeAfterDates(object);

		if (null === dates) {
			return;
		}

		// these dates can be handled via html5 elements for mobile devices
		ngutils.forms.registerDateInput(dates[0].attr('id'));
		ngutils.forms.registerDateInput(dates[1].attr('id'));
	};


	/*
	 * This is for before and after dates. Make sure that any dates input
	 * are valid.
	 * Adjust before and after dates if changing one puts the other at an invalid
	 * range.
	 */
	var watchDates = function(object) {
		if (PHP.get('ismobile')) {
			watchMobileDates(object);
			return;
		}

		var dates = getBeforeAfterDates(object);
		if (null === dates) {
			return;
		}

		var after = dates[0];
		var before = dates[1];

		var params = {
			'dateFormat': 'yy-mm-dd',
			'minDate': PHP.get(object.prefix + '_min_date'),
			'maxDate': PHP.get(object.prefix + '_max_date'),
			onSelect: function(str, obj) {
				var parts = obj.id.split('_');
				var which = parts[parts.length -  1];
				var d;

				var s = new Date(str);

				if (which === 'before' && after.val().length) {
					d = new Date(after.val());
					if (typeof(d) === typeof('') && d.indexOf('Invalid') === 0) {
						d = new Date();
					}

					if (d >= s) {
						d = s;
						d.setDate(d.getDate() - 1);

						if (d < new Date(obj.settings.minDate)) {
							after.val('');
						} else {
							after.val($.datepicker.formatDate('yy-mm-dd', d));
						}
					}
				} else if (which === 'after' && before.val().length) {
					d = new Date(before.val());

					if (typeof(d) === typeof('') && d.indexOf('Invalid') === 0) {
						d = new Date();
					}

					if (s >= d) {
						d = s;
						d.setDate(d.getDate() + 1);

						if (d > new Date(obj.settings.maxDate)) {
							before.val('');
						} else {
							before.val($.datepicker.formatDate('yy-mm-dd', d));
						}
					}
				}
			}
		};

		after.datepicker(params);
		before.datepicker(params);
	};

	var watchField = function(object) {
		var field = object.field;

		var form = object.form;
		var suggestion_endpoint = object.suggestion_endpoint;
		var template_id = object.template_id;
		var template = object.getTemplate();

		// this is called in two different ways - renderItem in the autocomplete
		// method and from within the lookup function
		var render = function($ul, item) {
			if (typeof(item.template) === typeof(undefined) || typeof(template[item.template]) === typeof(undefined)) {
				console.log('missing template for item', item);
				return;
			}

			var $li = template[item.template].clone();
			if (typeof(item.break) !== typeof( undefined) && item.break) {
				$li.addClass('ui-autocomplete-break');
			}

			$li.attr('id', item.id);
			populateSuggestion(object, item, $li);

			return $li.appendTo( $ul );

		};

		var lookup = function(_request, _render) {
			var search_params;

			if (object.options && object.options.search_params) {
				if (typeof object.options.search_params === 'function') {
					search_params = object.options.search_params();
				} else {
					throw "Untested";
					// search_params = object.search_params;
				}
			} else {
				if (true !== object.options.ignore_form) {
					search_params = form.serializeArray();
				} else {
					// at the very least, we need the form field
					// by its name
					search_params = [{
						name: object.options.field_name ? object.options.field_name : field[0].name,
						value: field[0].value
					}];
				}
			}

			$.post(suggestion_endpoint, search_params, function(response) {
				var i;
				var x = 0;
				var items = [];

				for (i in response.taglike_results) {
					x++;
					items.push({
						template: 'tags',
						text: response.taglike_results[i],
						id: template_id +"-"+x
					});
				}

				for (i in response.terms) {
					x++;
					items.push({
						template: 'terms',
						text: response.terms[i],
						id: template_id +"-"+x
					});
				}

				for (i in response.suggestions) {
					if (i === 0) {
						response.suggestions[i].break = true;
					}

					x++;

					response.suggestions[i].id = template_id + "-" + x;
					response.suggestions[i].template = 'content-' + response.suggestions[i].content_type;
					items.push(response.suggestions[i]);
				}

				for (i in response.more_links) {
					if (i === 0) {
						response.more_links[i].break = true;
					}

					x++;
					response.more_links[i].id = template_id + "-" + x;
					response.more_links[i].template = 'links';
					items.push(response.more_links[i]);
				}

				_render(items);
			});

			return false;
		};

		var getCallback = function(name, _default) {
			if (object.options.callbacks && object.options.callbacks[name]) {
				return object.options.callbacks[name];
			} else if (undefined !== _default) {
				return _default;
			} else {
				return null;
			}
		};

		var _onClose = null;
		if (object.options.callbacks && object.options.callbacks.close) {
			_onClose = object.options.callbacks.close;
		}

		var _onOpen = getCallback('open');

		var _onFocus = onFocus;
		if (object.options.callbacks && object.options.callbacks.focus) {
			_onFocus = object.options.callbacks.focus;
		}

		var _onSelect = onSelect;
		if (object.options.callbacks && object.options.callbacks.select) {
			_onSelect = object.options.callbacks.select;
		}

		object.field.autocomplete({
			delay: 300, // 300 is the default
			source: lookup,

			open: _onOpen,
			close: _onClose,
			focus: _onFocus,
			select: _onSelect
		}).data( 'ui-autocomplete' )._renderItem = render;
	};

	var watchForm = function(object) {
		var $form = object.form;
		var $advanced = $form.find('input[name="advanced"]');
		var $advanced_toggle = $form.find('a[data-toggle-advanced]');
		var $advanced_options = $form.find('div[data-advanced-options]');
		var is_advanced = PHP.get('is_advanced_search', false);

		if ($advanced.exists() && $advanced_options.exists() && $advanced_toggle.exists()) {
			$advanced_toggle.click(function() {
				is_advanced = !is_advanced;

				if (is_advanced) {
					$advanced_options.show();
					$advanced.val(1);
				} else {
					$advanced_options.hide();
					$advanced.val(0);
				}
				return false;
			});
		}

		$form.submit(function() {
			conductSearch($form);
			return false;
		});

	};

	// if a user starts entering data into the terms box, but then
	// clicks another subcategory, make the terms persist
	var watchSearchBar = function(object) {
		var $searchbar = object.form;
		var $nav = $searchbar.find('nav');

		if (!$searchbar.exists() || !$nav.exists()) {
			return;
		}

		var current = PHP.get(object.prefix + '_current_nav');

		if (current) {
			$('a:contains(' + current + ')', $nav).addClass('current');
		}

		var getSearchParams = function(url) {
			var name, value = null;
			url = url || window.location.href;
			parts = url.split('?');
			if (parts.length === 1) {
				return [];
			}

			parts = parts[1].split('&');
			params = {};
			for (i = 0, len = parts.length; i < len; ++i) {
				bits = parts[i].split('=');
				name = bits[0];

				if (typeof undefined !== typeof bits[1]) {
					value = decodeURIComponent(bits[1].replace(/\+/g, ' '));
				} else {
					value = null;
				}

				params[name] = value;
			}

			return params;
		};

		$nav.find('a').on('click', function() {
			var url = window.location.href;
			var params = getSearchParams(url);
			var new_params = ['terms=' + encodeURI($searchbar.find('input[name="terms"]').val())];

			for (var n in params) {
				if (n !== 'terms') {
					new_params.push(n + '=' + params[n]);
				}
			}

			var new_url = this.href.split('?')[0] + '?' + new_params.join('&');
			window.location.href = new_url;
			return false;
		});

	};

	// when a user clicks these, it posts data to a global suitabilities setting
	// and sets those everywhere for them
	var watchSuitabilities = function(object) {
		var inputs = object.form.find('[id^="suitabilities_opts"] input');

		if (!inputs.length) {
			return false;
		}

		// display a message to users when they're not permitted to look for
		// adult content
		inputs.filter(':disabled').each(function() {
			$('label[for="' + $(this).attr('id') + '"]').click(function() {
				if (typeof(PassportHandler) !== typeof(undefined)) {
					// attempt to open the login/registration form, when possible
					PassportHandler.open();
				} else {
					alert("You must be logged in to search for adult content.");
				}

				return false;
			});
		});

		inputs.click(function() {
			var checked = this.checked;
			var that = this;

			$.post('/suitabilities', inputs.serializeArray()).done(function() {
				// update the form once they've checked this, provided they're not
				// on mobile - because those options are in the advanced section
				// in the mobile layout
				if (!PHP.get('ismobile')) {
					conductSearch(object.form);
				}
			}).fail(function() {
				// in the event of some failure, reset to whatever it was initially
				that.checked = !checked;
			});
		});

	};

	var helper = function() {
		this.form = null;
		this.field = null;
		this.suggestion_endpoint = null;

		this.template = null;
		this.template_id = null;
		this.autocomplete = true;

		// this is the id of the div/script holding template
		this.DEFAULT_TEMPLATE = 'search_suggestion_template';

	};

	helper.prototype = {
		getField: function() {
			return this.field;
		},

		getTemplate: function() {
			if (null === this.template_id) {
				this.template_id = this.DEFAULT_TEMPLATE;
			}

			if (null === this.template || typeof(this.template[this.template_id]) === typeof undefined) {

				this.template[this.template_id] = {};

				var $template = $($.trim($("#" + this.template_id).html()));

				var that = this;

				$('li[class^="ui-autocomplete-"]', $template).each(function() {
					var key = $(this).attr('class').replace('ui-autocomplete-','');
					that.template[that.template_id][key] = $(this);
				});

				return;

			}

			return this.template[this.template_id];

		},

		initialize: function(_field, _suggestion_endpoint, _template_id, _autocomplete, _options) {
			var parts;
			this.template = this.template || {};

			// not all forms autocomplete (main search results don't), but default to true
			this.autocomplete = (typeof _autocomplete === 'undefined' ? true : _autocomplete);
			this.options = _options || {};

			if ($.type(_field) === 'string') {
				parts = _field.split('_');

				field = $('#' + _field);
			} else {
				field = _field;

				parts = field.attr('id').split('_');
			}

			var form = field.parents('form');

			if (!form) {
				throw "Can't find form for field.";
			}

			this.field = field;
			this.form = form;
			this.prefix = parts[0];


			if (this.autocomplete) {
				// allows us to explicitly set an endpoint
				if ((typeof(_suggestion_endpoint) !== typeof undefined) && (null !== _suggestion_endpoint)) {
					this.suggestion_endpoint = _suggestion_endpoint;
				} else {
					this.suggestion_endpoint = form.attr('action');
				}

				if (typeof(_template_id) !== typeof undefined && null !== _template_id) {
					this.template_id = _template_id;
				}

				// initialize for first use
				this.getTemplate();

				watchField(this);
			}

			// these will not be present in all instances
			watchDates(this);

			if (this.options.ignore_form === undefined || true !== this.options.ignore_form) {
				watchForm(this);
			} else {
				watchSearchBar(this);
			}

			return this;
		}
	};

	helper.init = function(_field, _suggestion_endpoint, _template_id, _autocomplete, _options) {
		var h = new helper();
		return h.initialize(_field, _suggestion_endpoint, _template_id, _autocomplete, _options);
	};

	return {
		init: helper.init
	};
})(jQuery);
