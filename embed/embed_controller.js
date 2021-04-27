function embedController(filedata, html, autoscale, use_ng_player_for_flash) {

	if (typeof(use_ng_player_for_flash) == typeof(undefined)) use_ng_player_for_flash = false;

	// these match constants in PortalItemRequirements
	var REQUIRE_FLASH = 1;
	var REQUIRE_UNITY = 2;
	var REQUIRE_JAVA = 3;
	var REQUIRE_OTHER_PLUGIN = 4;
	var TOUCH_FRIENDLY = 5;
	var SUPPORTS_GAMEPADS = 6;
	var USE_SECURE_URL = 7;
	var USE_INSECURE_URL = 8;
	var USE_FLASH_EMULATION = 9;

	var callback = null;
	var self = this;
	var file_used = filedata ? null : {width:520,height:220};

	this.compatible = false;
	this.use_ng_player_for_flash = use_ng_player_for_flash ? true:false

	this.isCompatible = function() {
		return this.compatible;
	};

	var window_loaded = false;

	var queued_functions = [];
	this.queueFunction = function(f) {
		queued_functions.push(f);
		if (window_loaded) executeQueuedFunctions();
	};

	function executeQueuedFunctions() {
		while(queued_functions.length > 0) {
			(queued_functions.pop())();
		}
	}

	this.skipBarrier = function(is_safe) {

		if (!is_safe) return false; // don't skip UJ or A-rated stuff

		getHTML(); // figures out the file we can show

		// don't put barriers on video, user has to click play anyway
		return !file_used || !file_used.description || file_used.description.indexOf('Video') > -1;
	};

	this.hasFlashPlugin = function(cb) {

		if (this.use_ng_player_for_flash) return true;

		var has_flash = false;
		// minimum version of flash NG requires
		if (typeof(swfobject) != 'undefined' && swfobject.hasFlashPlayerVersion("9.0.0")) has_flash = true;
		if (typeof(cb) == 'function') cb(has_flash);
		return has_flash;
	};

	this.hasJavaPlugin = function(cb) {
		var has_java = navigator.javaEnabled();
		if (typeof(cb) == 'function') cb(has_java);
		return has_java;
	};

	// add other plugin detection functions here as needed

	// gets the appropriate html code for embedding on the user's device
	function getHTML() {
		if (html === null) {

			var requirements;
			for(var i=0; i<filedata.length; i++) {
				// check for required plugins
				requirements = filedata[i].portal_item_requirements;
				var compatible = true;

				if (requirements.indexOf(REQUIRE_FLASH) >= 0 && !self.hasFlashPlugin()) compatible = false;
				if (compatible && requirements.indexOf(REQUIRE_UNITY) >= 0) compatible = false;
				if (compatible && requirements.indexOf(REQUIRE_JAVA) >= 0 && !self.hasJavaPlugin()) compatible = false;

				// add other plugin checks here as needed

				// if the file works with the user's device, grab the html for the embed and kill the loop
				if (compatible) {
					self.compatible = true;
					file_used = filedata[i];
					html = filedata[i].html;
					callback = typeof(filedata[i].callback) == "undefined" ? null : filedata[i].callback;
					break;
				}
			}

			// if we have no html at this point, grab the default html
			if (html === null && filedata.length > 0) {
				file_used = filedata[0];
				html = filedata[0].html;
				callback = typeof(filedata[0].callback) == "undefined" ? null : filedata[0].callback;
			}

			// clear some memory
			filedata = null;

			if (autoscale) {
				if (file_used.width > window.innerWidth) file_used.width = window.innerWidth;
				if (file_used.height > window.innerHeight) file_used.height = window.innerHeight;
			}
		}

		return html ? html : "Error: Could not embed this media.";
	}

	this.getFormattedFilesize = function() {

		var size = parseInt( this.getFilesize() );
		if (isNaN(size)) size = 0;
		var measurements = ["b","kb","mb"];
		var measurement = 0;
		var highest = measurements.length - 1;
		while (size > 1024 && measurement < highest) {
			size = size/1024;
			measurement++;
		}
		size = Math.round(size * 100)/100;
		return [size,measurements[measurement]];
	};

	this.getFileID = function() {
		getHTML();
		return file_used.file_id;
	};

	this.getDescription = function() {
		getHTML();
		return file_used.description;
	};

	this.getFilesize = function() {
		getHTML();
		return file_used.filesize;
	};

	this.getWidth = function() {
		getHTML();
		return file_used.width;
	};

	this.getHeight = function(min) {
		getHTML();
		if (typeof(min) == 'undefined') min = file_used.height;
		return file_used.height > min ? file_used.height : min;
	};

	this.getFileURL = function() {
		getHTML();
		return file_used.url;
	};

	// for drawing embed code into a dom element
	function drawInto(element_id) {
		var element = document.getElementById(element_id);
		if (element) {
			element.innerHTML = getHTML();
			doCallback();
		}
	}

	// if the file has any callback code to execute, run it here
	function doCallback() {
		if (callback) callback();
	}

	// use this to render the embed code into your page
	this.draw = function(element_id) {
		self.queueFunction(function () { drawInto(element_id); });
	};

	// this will post a catchable message to the top window
	this.reportSuccess = function(success) {
		file_used.callback = null; // prevent execution loops
		var values = [];
		var file_object;

		for (var key in file_used) {
			var value = null;
			if (typeof(file_used[key]) == 'string' && key != 'html' && key != 'url') {
				value = "'"+ (file_used[key].replace("'", "\\'")) +"'";
			} else if (typeof(file_used[key]) == 'boolean') {
				value = file_used[key] ? 'true':'false';
			} else if (typeof(file_used[key]) == 'number') {
				value = file_used[key];
			}

			if (value !== null) values.push(key+":"+value);
		}
		if (typeof(jQuery) != 'undefined') {
			file_object = "{"+values.join(",")+"}";
		} else {
			file_object = "{"+values.join(",")+"}";
		}

		var message = "{'event':'newgrounds_content_embedded','file':"+file_object+",'success':"+(success?'true':'false')+"}";
		window.postMessage(message,'*');
	};

	// if there is already an onload function, queue it before overriding window.onload again
	if (typeof(window.onload) == 'function') self.queueFunction(window.onload);

	window.onload = function() {
		window_loaded = true;
		executeQueuedFunctions();
	};
}
