/**
 * Additional functions available on the jQuery object ($)
 *
 * up: same as Prototype Element.up()
 *
 * down: same as Prototype Element.down()
 *
 * imgload: assign a function to be called when an image has loaded.
 *   NOTE: The argument passed to the callback function is the IMG element itself, NOT an event object (and not a jQuery objec)
 */

/*jshint jquery: true */
/*global NgFormValidator: false, enableSelectFacades: false, LinkWatcher: false, FlashWriter: false */

(function ($) {
	var clone = function(obj) {
		var obj2 = {};

		$.each(obj, function(key, val) {
			obj2[key] = val;
		});

		return obj2;
	};

	var set = function(obj, key, val) {
		var obj2 = clone(obj);
		obj2[key] = val;

		return obj2;
	};

	$.fn.down = function (selector) {
		if (typeof selector === 'undefined') return this.children(':eq(0)');
		else return this.find(selector + ':first');
	};

	// shorter name; similar in functionality to Prototype
	$.fn.up = $.fn.closest;

	// passes element as first argument to function, instead of second
	$.fn.Each = function (callback) {
		this.each(function () {
			callback(this);
		});
	};

	// flips $.each
	$.Each = function (arr, callback) {
		return $.each(arr, function (index, value) {
			callback(value, index);
		});
	};

	// Extract a method, for passing as an argument for example
	$.method = function(obj, name) {
		return function() {
			obj[name].apply(obj, arguments);
		};
	};

	$.invoke = function(obj, method, args) {
		var f;
		if (args && args.length) {
			f = function(x) { return x[method].apply(x, args); };
		} else {
			f = function(x) { return x[method](); };
		}

		return $.map(obj, f);
	};

	$.endsWith = function(haystack, needle) {
		return haystack.substr(haystack.length - needle.length) === needle;
	};

	$.beginsWith = function(haystack, needle) {
		return haystack.substr(0, needle.length) === needle;
	};

	// this is the same as the $ function, only it takes a "true" argument, like in Prototype
	$.fn.serialize = function(as_array) {
		if (as_array) return this.serializeArray();
		else return $.param(this.serializeArray());
	};

	// whether this element and all of its children have loaded - mostly useful for IMG elements
	$.fn.isLoaded  = function (value) {
		var is_loaded = true;

		this.find('img').each(function() {
			// custom member "fail" indicates we have given up on this image
			if (this.fail) return;

			if (this.tagName === 'IMG') {
				if (typeof(this.naturalWidth) !== 'undefined') { // Gecko
					is_loaded = is_loaded && this.complete;
				} else if (typeof(this.complete) === 'boolean') { // IE
					is_loaded = is_loaded && this.naturalWidth;
				} else { // this will always be true, unless the img has no width attr., in which case it's only true when the img is loaded
					is_loaded = is_loaded && this.width;
				}
			} else { /* do nothing; assume is loaded */ }
		});

		return is_loaded;
	};

	/**
	 * define a function to call when element is loaded (see isLoaded above)
	 * data - (all params are optional): {
	 *   period: time between checks, in milliseconds, default 100
	 *   timeout: when to stop checking, in milliseconds, default 5000
	 */
	$.fn.loaded = function (handler, data) {
		var total_time = 0;

		if (!data) data = {};
		if (data.period === undefined) data.period = 100;
		if (data.timeout === undefined) data.timeout = 5000;

		var that = this;

		var doWaiting = function () {
			if ($(that).isLoaded() || total_time > data.timeout) { // if we timeout, call event handler anyway
				handler(that);
				if (that._loaded_timer) {
					clearTimeout(that._loaded_timer);
				}
			} else {
				total_time += data.period;
				that._loaded_timer = setTimeout(doWaiting, data.period); // FIXME: use this to remove the listener
			}
		};

		doWaiting();
	};

	/* FORMS */

	/**
	 * Enable a form element, or all of the elements in a form
	 * OR pseudo-enable an <a> tag.
	 */
	$.fn.enable = function () {
		var that = $(this);
		if (that.is('form')) {
			that.find('input, textarea, select, button').enable();
		} else if (that.is('a')) {
			that.css({
				'cursor': that.data('cursor') || 'pointer',
				'pointer-events': that.data('pointer_events') || 'auto'
			});
		} else {
			that.each(function () {
				that.prop('disabled',false);
			});
		}

		return this;
	};

	/**
	 * Disable a form element, or all of the elements in a form
	 * OR pseudo-enable an <a> tag.
	 */
	$.fn.disable = function () {
		var that = $(this);
		if (that.is('form')) {
			that.find('input, textarea, select, button').disable();
		} else if (that.is('a')) {
			that.data('cursor', that.css('cursor'));
			that.data('pointer_events', that.css('pointer-events'));

			that.css({
				'pointer-events': 'none',
				'cursor': 'default'
			});
		} else {
			that.prop('disabled', true);
		}

		return this;
	};

	/**
	 * Enables (or disables if false is passed) detection of click events outside this element
	 */
	$.fn.enableClickOutside = function(enable) {
		var self = this;
		enable = enable === false ? false:true;

		this.__click_outside_enabled = enable;

		if (!this.__document_ref) {
			this.__document_ref = $(document);
		}

		// detects if a click on the document happened outside of this element
		if (!this.__clickOutside_function) {
			this.__clickOutside_function = function(event) {
				if (!$(event.target).closest(self).length) {
					self.trigger('clickOutside');
				}
			};
		}

		// clean up reference to this element in the document-level events
		if (enable) {
			this.__document_ref.on('click', this.__clickOutside_function);
		} else {
			this.__document_ref.off('click', this.__clickOutside_function);
		}

		return this;
	};

	/**
	 * Disables detection of click events outside this element
	 */
	$.fn.disableClickOutside = function() {
		return this.enableClickOutside(false);
	};

	/**
	 * Makes sure detection of click events outside this element are enabled, and creates a 'clickOutside' event handler
	 */
	$.fn.clickOutside = function(handler) {
		if (!this.__click_outside_enabled) this.enableClickOutside(true);
		return this.on('clickOutside', handler);
	};

	/**
	 * Set value of file input on corresponding text input "facade"
	 * Change this if method of facade changes
	 */
	$.fn.setUploadVal = function (val) {
		if (typeof val === 'undefined') {
			val = this.val();
		}

		if (this.is('input[type="file"]')) {
			// this.nextAll('input:first').val(this.val());
			this.next().next().val(this.val());
		}

		return this;
	};

	$.fn.validate = function (validations) {
		if (this.is('form')) {
			this.bindValidator(new NgFormValidator(this, validations));
		}

		return this;
	};

	// put the cursor at the end of a textarea
	// http://stackoverflow.com/a/11756980
	$.fn.focusToEnd = function() {
		return this.each(function() {
			var v = $(this).val();
			$(this).focus().val("").val(v);
		});
	};

	// double submit handling
	(function() {
		var getSubmitButtons = function(elem) {
			return $(elem).find('button[type!="reset"][type!="button"], input[type="submit"]');
		};

		$.fn.disableSubmit = function() {
			getSubmitButtons(this).disable();
		};
		$.fn.enableSubmit = function() {
			getSubmitButtons(this).enable();
		};
	})();

	$.fn.preventDoubleSubmit = function () {
		this.submit(this.disableSubmit);
	};
	$.fn.allowDoubleSubmit = function () {
		//this.unbind('submit', this.disableSubmit);

		// updated for jquery 3
		this.off('submit', this.disableSubmit);
	};

	(function () {
		var
			validation_str = 'validation',
			getValidationFunction = function (validator) {
				if (validator) {
					return function (e) {
						validator.validate();

						if (!validator.isValid()) {
							// tell user about errors
							validator.inform();

							// don't do other handlers
							e.stopImmediatePropagation();

							return false;
						}
					};

				}
			}
		;

		/**
		 * Bind the validation function to the submit event
		 */
		$.fn.bindValidator = function (validator) {
			var validation = getValidationFunction(validator);
			this.data(validation_str, validation);
			this.data('validator', validator);

			return this.submit(validation);
		};

		$.fn.unbindValidator = function () {
			//return this.unbind('submit', this.data(validation_str));

			// updated for jquery 3
			return this.off('submit', this.data(validation_str));
		};

	})();

	// Checks to see whether an element actually exists (for cases when checkboxes
	// are in place in some instances as per user agreements and when they're not
	// etcetra)
	$.fn.exists = function () {
		return this.length > 0;
	};

	// same as .text(), but returns an array
	$.fn.Text = function () {
		return $.map(function () {
			return $(this).text();
		}).get();
	};

	// for adding callbacks to $.ajax options like success, error, etc.
	var addFunction = function(func_list, func) {
		if (typeof func_list === 'function') {
			return [func_list, func];
		} else if (typeof func_list === 'object') {
			// assume is an array
			return func_list.concat([func]);
		} else {
			return func;
		}
	};

	/**
	 * success_func - runs on success
	 * element - element to set the waiting animation on; optional
	 * options - parameters to $.ajaxWait
	 */
	$.fn.ajaxSubmit = function (success_func, options) {
		var that = this;
		options = options || {};

		var originator, action, method = 'post';

		// only if it's a form, or a button of type submit
		// (check further credentials)
		if (this.is('form') || (this.is('button') && this.attr('type') === 'submit')) {

			if (this.is('form')) {
				originator = 'form';
				action = this.attr('action');
			} else {
				if (!this.attr('formaction') || !this.attr('formmethod')) {
					throw "Must get form action and method";
				}

				originator = 'button';
				action = this.attr('formaction');
				method = this.attr('formmethod');
			}
			// "this" is the form. Use set() to avoid modifying function argument
			options = set(options, originator, this);

			return $.ajaxWait(method, action, null, success_func, options);
		}
	};

	/**
	 * see argument documentation for $.fn.ajaxSubmit above
	 */
	$.fn.ajaxify = function (success_func, options) {
		if (this.is('form')) {
			var that = this;
			options = options || {};
			options.form = options && options.form || this;

			// add submit button data to the data we send, to mimic a real submission
			// this.delegate('button, input[type="submit"]', 'click', function () {
			//this.delegate('button', 'click', function () {

			// updated for jquery 3
			this.on('click', 'button', function () {
				options.data = that.serializeArray();
				options.data.push({ name: this.name, value: this.value });
				$(that).ajaxSubmit(success_func, options);
				return false;
			});

			return this.submit(function () {
				$(this).ajaxSubmit(success_func, options);
				return false;
			});
		}
	};

	/**
	 * NOTE: it is no longer necessary to pass userkey, it will be set automatically
	 * if omitted
	 *
	 * Examples:
	 * $('.somehref').ajaxifyLink({ data: { userkey: 'parp' }});
	 * $('.somehref').ajaxifyLink({ success_func: function() { } });
	 * will take the link, submit as post, the idea here is to pass any sensitive
	 * info through data, rather than passing it as a url param
	 *
	 * if confirmation is present and a string, pass through confirm() to present
	 * the user with a choice
	 */
	$.fn.ajaxifyLink = function(options, confirmation) {
		if (typeof options === 'string' && typeof confirmation === 'function') {
			var temp = options;
			options = {success_func: confirmation};
			confirmation = temp;
		} else if ((typeof options === 'string' || typeof options === 'function') && typeof confirmation === typeof undefined) {
			confirmation = options;
			options = true;
		} else if (typeof options === 'function') {
			confirmation = options;
			options = true;
		}

		options = options || {};
		confirmation = confirmation ? confirmation : false;

		// simple redirect on completion
		if (true === options) {
			options = {};
			options.success_func = true;
		}

		if (typeof options.data === typeof undefined) {
			options.data = {};
		}


		// pass userkey by default
		if (typeof options.data.userkey === typeof undefined) {
			options.data.userkey = PHP.get('uek');
		}

		// allow confirmation to be passed as options
		if (false === confirmation && options.confirmation) {
			confirmation = options.confirmation;
		}

		$(this).off().on('click', function(e) {
			e.preventDefault();

			// provide a means of calling back
			if (undefined !== options.onclick) {
				options.onclick(this);
			}

			if (confirmation) {
				// ask the user if this is what they want to do
				if (typeof confirmation === 'string') {
					if (!confirm(confirmation)) {
						return false;
					}
				// do something more intricate
				} else if (typeof confirmation === 'function') {
					var ret;

					// false means no dice, whatever this function does
					if (false === (ret = confirmation(this))) {
						return false;
					}

					// do this if we're successful
					if (ret) {
						if (true === ret) {
							options.success_func = true;
						} else if (undefined !== ret.success_func) {
							options.success_func = ret.success_func;
						}
					}

					// and this if we're not
					if (ret && undefined !== ret.error) {
						options.error = ret.error;
					}
				}

			}

			var url;
			if ($(this).is('a')) {
				url = this.href;
			} else if ($(this).is('button') && $(this).attr('formaction')) {
				url = $(this).attr('formaction');
			} else {
				throw "Don't know how to get URL from this?";
			}

			$.ajaxWait('post', url, null, null, options);

			return false;
		});
	};

	// expects either a button with name/value OR a link with a rel or id attribute in the format:
	// id_name_XXX, where name will become id_name and XXX corresponds to an id.
	$.fn.ajaxClick = function (url, success_func, options) {
		var that = $(this);

		var attrs_from_el = function (which) {
			var parts = that.attr(which).split('_');
			var val = parts.pop();

			return [parts.join('_'), val];
		};

		var attr_name = that.attr('name') || attrs_from_el('rel')[0] || attrs_from_el('id')[0];
		var val = that.attr('value') || attrs_from_el('rel')[1] || attrs_from_el('id')[1];

		var data = [{name: attr_name, value: val}];

		$.ajaxWait('post', url, data, success_func, options);

		return false;
	};

	$.fn.ajaxKeyup = function(url, success_func, options) {
		var data = [{name: $(this).attr('name'), value: $(this).attr('value')}];

		$.ajaxWait('get', url, data, success_func, options);

		return false;
	};

	/**
	 *	Makes a link function as a POST method form.
	 * Optional params may be passed as an object of key/value pairs, or a function that returns such an object.
	 * Values withing a params object may also be functions that return a scalar value.
	 */
	$.fn.formifyLink = function(params) {
		if (!this.is('a')) {
			console.error("formifyLink can only be used on <a> tags.");
			return false;
		}

		if (typeof(params) == 'function') params = params($(this));
		else if (typeof(params) != 'object') params = {};
		// pass userkey by default
		if (!params.userkey) {
			params.userkey = PHP.get('uek');
		}

		var action = $(this).attr('href');
		var $form = $('<form>').attr('action',action).attr('method','post');
		$('body').prepend($form);
		for (var i in params) {
			var val = typeof(params[i]) == 'function' ? params[i]($(this)) : params[i];
			var $input = $('<input>');
			$input.attr('type','hidden').attr('name',i).val(val);
			$form.append($input);
		}

		this.attr('href','#'); // prevent loading in new window
		this.click(function() { $form.submit(); return false; });

		return $form;
	};

	$.fn.getSelected = function () {
		if (this.is('select')) {
			var select = this.get(0);
			if (select) {
				if (!select.selectedIndex) select.selectedIndex = 0;
				return $(select.options[select.selectedIndex]);
			} else {
				return $();
			}
		}
	};

	$.fn.scrollTo = function (options) {
		var destination = this.offset().top;

		options = options || {};
		options.duration = options.duration || 500;

		$('html:not(:animated), body:not(:animated)').animate({
			scrollTop: destination - 20
		}, options );
	};

	// For doing old-style fade-n-slide animations
	(function () {
		var slide_duration = 600, fade_duration = 600;

		var fadeMeIn = function () {
			$(this).animate({ opacity: 1 }, fade_duration);
		};

		var scrollMeUp = function () {
			$(this).slideUp(slide_duration);
		};

		$.fn.appear = function () {
			return this.css('opacity', 0).slideDown(slide_duration, fadeMeIn);
		};

		$.fn.disappear = function () {
			return this.animate({opacity: 0}, {duration: fade_duration, complete: scrollMeUp});
		};

		$.fn.animatedSwitch = function() {
			if (this.is(':visible')) return this.disappear();
			else return this.appear();
		};
	})();

	(function () {
		var
			fading_menus = [],
			count_showing = 0,

			// fade all menus. If excluded is passed, the menu with that index will not be faded
			fade_all = function (excluded) {
				var i;
				for (i = 0; i < fading_menus.length; ++i) {
					if (i !== excluded && fading_menus[i].is(':visible')) fading_menus[i].fadeOut();
					--count_showing;
				}
			}
		;

		$.fn.fadeable = function () {
			// attaching this event here, because for some reason it doesn't work when defined outside fadeable()
			if (!fading_menus.length) {
				$(document.body).click(function () {
					if (count_showing) {
						fade_all();
					}
				});
			}

			// add each menu separately
			this.each(function () {
			var select, menu;

				var me = $(this);

				// allow the div.select, or any element inside it
				select = me.is('div.select') ? me : me.up('div.select');
				menu = select.down('ul.filtermenu');

				// if we found a menu and we don't already have this one, make it fadeable
				if (menu.length && $.inArray(menu, fading_menus) < 0) {

					// add this to the list of menus to fade when the user clicks anywhere
					fading_menus.push(menu);
					menu
						.data('fading_index', fading_menus.length - 1)
						// style menu correctly
						.hide().css('overflow', 'visible')
					;

					select.click(function (e) {
						if (e.target.tagName.toLowerCase() !== 'a') {
							// toggle menu
							if (menu.is(':hidden')) {
								++count_showing;
								menu.fadeIn(300, function () { $(this).show(); });

								// hide all other menus
								fade_all(menu.data('fading_index'));
							} else {
								menu.fadeOut();
								--count_showing;
							}

							// stop the event, or the body element will try hiding the menus again
							return false;
						}
					});
				}
			});

		};

	})();

	$.isString = function (obj) {
		return typeof obj === 'string' || obj instanceof String;
	};

	$.reverseString = function (str) {
		return str.split('').reverse().join('');
	};

	// Inverse of $.param
	$.unparam = function (str) {
		var obj = {};

		str.split('&').Each(function (equality) {
			var parts = equality.split('=');
			obj[parts[0]] = parts[1];
		});

		return obj;
	};

	$.isInteger = function(obj) {
		return typeof obj === 'number' && parseInt(obj, 10) === obj;
	};

	// similar (but not identical) to PHP's function, range() - give it two integers
	// or set of letters and it'll return an array of of numbers in that range.
	// letters are returned as their respective charcode, for example, 'a'
	// is 97
	$.range = function(low, high, step) {
		var
			reversal,
			quickstep = 1,
			arr = [],
			i
		;

		if ((!$.isInteger(low) && !$.isString(low)) || (typeof low !== typeof high)) {
			return arr;
		}

		// just use for integers for the time being
		if (typeof step !== undefined && $.isInteger(step) && $.isInteger(low)) {
			quickstep = step;
		}

		if ($.isString(low)) {
			low = parseInt(low.charCodeAt(0), 10);
			high = parseInt(high.charCodeAt(0), 10);
		}

		if (low > high) {
			reversal = low;
			low = high;
			high = reversal;
		}

		for (i = low; i <= high; i+= quickstep) {
			arr.push(i);
		}

		return arr;
	};

	$.strip_text = function(s, lower) {
		if (typeof lower === 'undefined') {
			lower = true;
		}

		if (lower) {
			s = s.toLowerCase();
		}

		return s
			.replace(/[^a-z0-9]/gi, ' ')
			.replace(/\s+/g, '-')
			.replace(/(^-+|-+$)/, '')
			;
	};

	// jQuery returns $.inArray as either -1 or index, which I didn't find particularly
	// helpful
	$.rInArray = function(value, arr) {
		return $.inArray(value, arr) !== -1;
	};

	$.any = function (arr, f) {
		var len = arr.length;
		for (var i = 0; i < len; i++) {
			if (f(arr[i])) return true;
		}
		return false;
	};

	$.all = function (arr, f) {
		return !$.any(arr, function (x) {
			return !f(x);
		});
	};

	// reduce array to its unique elements. $.unique only works on DOM elements
	$.nub = function (arr) {
		var new_arr = [], len = arr.length, i, j, found_dup;

		for (i = 0; i < len; ++i) {
			found_dup = false;

			for (j = i + 1; j < len && !found_dup; ++j) {
				found_dup = arr[j] == arr[i];
			}

			// unshift so they elements appear in location of first occurrence
			if (! found_dup) new_arr.unshift(arr[i]);
		}

		return new_arr;
	};

	// works like Prototype $ function - accepts element ID or DOM element or jQuery element
	$.$ = function (elem_or_id) {
		if ($.isString(elem_or_id)) return $('#' + elem_or_id);
		else return $(elem_or_id);
	};

	$.windowHeight = function () {
		return window.innerHeight ? window.innerHeight : $(window).height();
	};

	$(document).ajaxError(function (e, xhr, options, exception) {
		var silence_error = (PHP && PHP.get('silence_ajax_errors'));
		if (xhr.status === 403 && !silence_error) {
			$.showAjaxError(JSON.parse(xhr.responseText));
		}
	});

	$.showAjaxError = function (content) {
		if (content && content.error) {
			if (typeof(ngutils) !== typeof(undefined) && typeof(ngutils.blackout) === 'function') {
				var blackout = new ngutils.blackout({"remove_on_hide": true});
				blackout.show($(content.error));
				return;
			} else {
				// fallback to alert
				content.errors = [content.error];
			}

		}

		if (content && content.errors && content.errors.join) {
			var msg = content.errors.join("\n");
			if (content.selector) { // path to element for our error message
				$(content.selector).html(msg);
			} else {
				alert(msg);
			}
		} else {
			var server_error = 'Server error.  Please wait a moment and try again.';
			alert(server_error);
		}
	};

	// Check our old-style XML response for errors
	// Returns true if valid response (i.e., no errors)
	$.checkAjaxErrorOld = function (xml) {
		var server_error = 'Server error.  Please wait a moment and try again.';
		// Expand on this to show the output when in debug???
		// For instance, if the output was previously HTML rather than XML, this returned
		// true, but it would be useful to see the output if, for example, there's some
		// parse error with the script handling the call or whatever

		if (!xml) {
			alert(server_error);
			return false;
		} else {
			var errors = $(xml).find('errormsg');
			if (errors.length) {
				// I couldn't get this to work correctly - maybe just return the message
				// as there will only ever be one node with the old stuff here?
				//$.showAjaxError({ errors: errors });
				alert(errors.text());
				return false;
			} else {
				return true;
			}
		}
	};

	/**
	 * Stop waiting animation when ajax is done, allow clickables
	 */
	$(document).ajaxComplete(function(e, xhr, options) {
		if (xhr.uid) {
			$.ajax.stopWaiting(xhr.uid);
		}

		if (window.QUnit) {
			window.QUnit.ajaxing = false;
		}

		// select menu hack
		enableSelectFacades();

		$('a').each(function () {
			$(this).data('clicked', false);
		});
	});

	(function () {
		var
			waiters = {},
			waitheres = {};

		/**
		 * start waiting animation on element,
		 * waitin for XMLHttpRequest xhr
		 */
		$.ajax.startWaiting = function (xhr, form, element) {
			/* add a unique identifier to our XMLHttpRequest object
			 * so we can stop waiting when the time comes */
			xhr.uid = $.now();

			if (form) {
				form = $(form);
				waiters[xhr.uid] = form
					.find('.waiter')
					.removeClass('waiter')
					.addClass('waiter_on');
			}

			if (element) {
				element = $(element);
				waiters[xhr.uid] = element;
				element.addClass('waithere');
			}
		};

		/**
		 * stop waiting animation for XMLHttpRequest with uid xhr_uid
		 */
		$.ajax.stopWaiting = function(xhr_uid) {
			if (waiters[xhr_uid]) {
				waiters[xhr_uid]
					.removeClass('waiter_on')
					.addClass('waiter');
				delete waiters[xhr_uid];
			}

			if (waitheres[xhr_uid]) {
				waitheres[xhr_uid].removeClass('waithere');
				delete waitheres[xhr_uid];
			}
		};

	})();

	/**
	 * start a waiting animation and send AJAX request
	 *
	 * element - the element to set the waiting animation on
	 * all other args are options for $.ajax, see jQuery API docs
	 *
	 * ARG = NAME IN JQUERY API
	 * type = type
	 * url = url
	 * data = data
	 * success_func = success
	 * optons - anything $.ajax would accept, and also:
     *   - form: the form we are submitting
     *   - element: waiting animation element (not needed if options.form is given,
     *              and form has a ".waiter" element)
     *   - preventDouble: defaults to TRUE
	 *   - XD: set to true to allow cross-domain use. (auto-sets the xhrFields option and isAjaxRequest parameter)
	 */
	$.ajaxWait = function(type, url, data, success_func, options) {
		options = options || {};
		var cross_domain = false;

		if (options.form || options.button) {
			// prevent doubles submitting, unless options.preventDouble is set to FALSE
			if (false !== options.preventDouble) {
				// add reenabling as an error function
				options.error = addFunction(options.error, function() {
					if (options.form) {
						options.form.enableSubmit();
					} else {
						options.button.enable();
					}
				});

				if (options.form) {
					options.form.disableSubmit();
				} else {
					options.button.disable();
				}
			}

			// allow caller to supply custom data to send to the server, or use form data
			if (! data) {
				if (options.data) {
					data = options.data;
				} else if (options.form) {
					data = options.form.serializeArray();
				}
			}
		// if data is present in options, allow that to pass
		} else if (! data && options.data) {
			data = options.data;
		}

		// allow the programmer to pass additional parameters to data without
		// wiping out what's in the form already (if options.data is populating
		// data in the first place)
		if (options.additional_data && options.form) {
			if (!$.isArray(options.additional_data)) {
				data.push(options.additional_data);
			} else {
				$.merge(data, options.additional_data);
			}
		}

		if (options.XD) {
			options.xhrFields = { withCredentials: true };
		}

		if (options.xhrFields && options.xhrFields.withCredentials === true) {
			cross_domain = true;
		}

		// if data is not set at this point, it must be converted to an object
		if (null === data) {
			data = {};
		}

		if (PHP && PHP.get('ng_design',null)) {
			$.merge(data, [{name:'___ng_design', value:PHP.get('ng_design')}]);
		}

		// allow this to be passed as part of options, too
		if (! success_func && options.success_func) {
			success_func = options.success_func;
		}

		// just report the success to the user
		if (true === success_func) {
			success_func = function(response) {
				if (response && response.success) {
					alert(response.success);
				}

				if (response && response.url) {
					window.location.href = response.url;
					return true;
				}

				// fallthrough
				window.location.href = window.location.href;
			};
		}

		if (cross_domain) {
			if (!data) data = [];
			data.push({name: 'isAjaxRequest', value:1});
		}

		var ajax_options = $.extend({
				type: type,
				url: url,
				data: data,
				success: success_func
			}, options);

		return $.ajax.startWaiting(
			$.ajax(ajax_options),
			options.form,
			options.element
		);
	};

	// replace a set of elements in the page with corresponding elements from AJAX response
	$.ajax.replace = function (response_html, selectors) {
		var i = 0;

		for (i = 0; i < selectors.length; i++) {
			$(selectors[i]).replaceWith($(selectors[i], response_html));
		}
	};

	/**
	 * Find element that 1.) contains the event target, 2.) is contained by "this", and 3.) matches the selector.
	 * This is useful for event delegation, when, for example, there might be a SPAN inside an A tag, and you
	 * want the HREF of the A tag. Then [e.closest('a').href] will get what you need, without searching all the way
	 * up to the document root
	 */
	$.Event.prototype.closest = function (selector) {
		var me = this.target;
		while (me && !$(me).is(selector)) {
			// return undefined if we could not find a matching element
			if (me == this.currentTarget) return;

			me = me.parentNode;
		}

		return me;
	};

	$.fn.insertRoundCaret = function (tagName) {
		var
			strStart, strEnd, stringBefore, stringAfter, sel, insertstring,
			fullinsertstring, range, numlines, i, j, startPos, endPos, scrollTop;
		return this.each(function(){
			strStart = '['+tagName+']';
			strEnd = '[/'+tagName+']';
			if (document.selection) {
				//IE support
				stringBefore = this.value;
				this.focus();
				sel = document.selection.createRange();
				insertstring = sel.text;
				fullinsertstring = strStart + sel.text + strEnd;
				sel.text = fullinsertstring;
				document.selection.empty();
				this.focus();
				stringAfter = this.value;
				i = stringAfter.lastIndexOf(fullinsertstring);
				range = this.createTextRange();
				numlines = stringBefore.substring(0,i).split("\n").length;
				i = i+3-numlines+tagName.length;
				j = insertstring.length;
				range.move("character",i);
				range.moveEnd("character",j);
				range.select();
			} else if (this.selectionStart || this.selectionStart == '0') {
				//MOZILLA/NETSCAPE support
				startPos = this.selectionStart;
				endPos = this.selectionEnd;
				scrollTop = this.scrollTop;
				this.value = this.value.substring(0, startPos) + strStart + this.value.substring(startPos,endPos) + strEnd + this.value.substring(endPos,this.value.length);
				this.focus();
				this.selectionStart = startPos + strStart.length ;
				this.selectionEnd = endPos + strStart.length;
				this.scrollTop = scrollTop;
			} else {
				this.value += strStart + strEnd;
				this.focus();
			}
		});
	};

	// expects to be called on an input element or elements, which might have an id of 'password'
	// and then shows/hides an element with the same id appended with '_caps' if the
	// caps key is on as they're typing
	(function() {

		var
			upper_ranges = $.range('A', 'Z'),
			lower_ranges = $.range('a', 'z'),
			all_letters = upper_ranges.concat(lower_ranges),
			wrap_element,
			type,
			shift_key,
			which
		;

		$.fn.checkCapsLock = function(e) {
			wrap_element = $('#' + $(this).attr('id') + '_caps');

			return (function(event) {

				type = event.type;
				shift_key = event.shiftKey;
				which = event.which;

				if (type === 'blur') {
					// close it and come back to it when they next type here
					wrap_element.hide();
				} else if (
						($.rInArray(which, upper_ranges) && !shift_key) ||
						($.rInArray(which, lower_ranges) && shift_key)
				) {
					// CAPS is on and the user has entered a lower case letter OR they have held shift with a letter
					// they expect the letter to be upper case whilst CAPS is on
					wrap_element.show();
				} else if ($.rInArray(which, all_letters) && wrap_element.is(':visible')) {
					// only if this is a letter do we then hide the display if it's visible
					wrap_element.hide();
				}

			})(e);
		};

	})();

	/*

		Handles <select> options (specifically with respect to removing/replacing options
		in any select).

		I haven't done much yet with respect to anything but set(), which expects
		a hash table: { 'val' : 'text', 'val2' : 'text2' }

	*/
	(function() {
		$.fn.selectBoxOptions = function () {
			var
				that = this,
				i = 0,
				key,
				options = document.getElementById(this.attr('id')).options
			;

			return {
				size: function () {
					return $(options).size();
				},

				set: function (new_options) {
					// reset i first
					i = 0;

					for (var key in new_options) {
						++i;
					}

					// reset the length of the select options
					options.length = i;

					i = 0;

					// and then assign the new values and text
					for (key in new_options) {
						options[i].value = key;
						options[i].text = new_options[key];
						++i;
					}
				}
			};
		};
	})();

	// put site advisories on links and also bring embedded objects below links to media
	(function() {

		$.fn.watchLinks = function(settings) {

			// merge any overrides in here
			settings = $.extend({
				// .sitenote needs to be the last div in this node
				parentNode: '.podcontent',
				trustedDomains: [],
				spamDomains: []

			}, settings);

			var link_watcher = new LinkWatcher();
			link_watcher.setParentNode(settings.parentNode);
			link_watcher.setTrustedDomains(settings.trustedDomains);
			link_watcher.setSpamDomains(settings.spamDomains);
			link_watcher.pushElements($(this));
			link_watcher.watch();

			return this;
		};

		/**
		 * Watch a set of links - when clicked, if they contain youtube, vimeo or other embeds we support,
		 * attach a div after its parent with the embed in it, and show the embed. Subsequent
		 * clicks toggle the visibility of the element.
		 *
		 * Some of these calls trigger an API. Youtube's oEmbed isn't reliable, it's ultra slow
		 * and requirs CORS work, but it does allow you to use /embed/ easily enough.
		 *
		 * Sample usage: $('div.pod-body a').watchEmbeds();
		 */
		$.fn.watchEmbeds = function() {
			var redesign = false;
			var mobile = false;

			var MAX_WIDTH = 590;
			var MAX_HEIGHT = 332;


			if (PHP && PHP.get && PHP.get('ng_design','2012') != '2012') {
				redesign = true;
				mobile = PHP.get('ismobile',false);
			}

			var
				watchable_links = [],
				result,
				mylink,
				mydiv,
				href,

				sites = {
					youtube: [/^https?:\/\/(www\.)?((youtube\.com\/(.*?v=|embed\/))|youtu\.be\/)([a-zA-Z0-9_\-]+).*$/, 5, 'video'],
					vimeo: [/^https?:\/\/(www\.)?vimeo\.com\/([0-9]+)\/?$/, 2, 'video'],
					//,
					soundcloud: [/^https?:\/\/(www\.)?(soundcloud\.com\/[^\/]+\/?([^\/]+\/?)?).*$/, 2, 'audio']
				},

				addClickContext = function(context) {
					context.off('click').on('click', function() {
						$(this).next().toggle();
						return false;
					});
				},

				getYouTubeDivContent = function(url, full_url) {
					var result, time = null, iframe_attr;

					if (null !== (result = full_url.match(/(\?|#)t=((\d+)m(\d+)s)/))) {
						time = (parseInt(result[3], 10) * 60) + parseInt(result[4], 10);

					} else if (null !== (result = full_url.match(/t=(\d+)/))) {
						time = result[1];
					}

					if (null !== time) {
						url = url + '?start=' + time.toString();
					}

					if (false && redesign) {
						iframe_attr = 'data-smart-scale="590,332" data-smartload-src="' + url + '" width="400" height="300" frameborder="0" allowfullscreen';
					} else {
						iframe_attr = 'width="' + MAX_WIDTH + '" height="' + MAX_HEIGHT + '" src="' + url + '" frameborder="0" allowfullscreen';
					}

					return $('<div style="display:none; margin-top: 10px; width: 100%; height: auto;"><iframe '+iframe_attr+'></iframe></div>');
				},

				// update to use this instead
				//https://developer.vimeo.com/apis/oembed
				getVimeoDivContent = function(content) {
					var d = $('<div style="display:none; margin-top: 10px; width: 100%; height: auto;"></div>');
					d[0].innerHTML = content;
					return d;
				},

				getSoundCloudDivContent = function(content) {
					//return $('<div style="display:none; margin-top: 10px; width: 100%; height: ' + height + 'px;">' + content + '</div>');

					var d = $('<div style="display:none; margin-top: 10px; width: 100%; height: auto;"></div>');
					d[0].innerHTML = content;
					return d;
				},

				throwIEDebugDiv = function(xhr, statusText, errorText) {
					return $('<div style="display:none;">' + errorText + '</div>');
				},

				insertDiv = function(key, identifier, mycontext, regexp_result, index) {
					mycontext.css('cursor', 'wait');

					var resetCursor = function() {
						mycontext.css('cursor', 'pointer');
					};

					var onFail = function() {
						mycontext.off('click');
						resetCursor();

						// just open the URL in a new window and have done
						window.open(mycontext.attr('href'));
					};

					var renderContent = function(contentFunc, maybe_json, other) {
						if (typeof other !== typeof undefined) {
							mydiv = contentFunc(maybe_json, other);
						} else {
							mydiv = contentFunc(maybe_json.html);
						}

						mycontext.after(mydiv);
						mydiv.slideDown(function() {

							addClickContext(mycontext);
							resetCursor();
						});
					};

					mydiv = null;
					switch(key) {
						case 'youtube':
							renderContent(getYouTubeDivContent, 'https://www.youtube.com/embed/' + identifier, mycontext.attr('href'));

							break;

						case 'vimeo':
							var url = "https://vimeo.com/" + identifier;

							//https://vimeo.com/api/oembed.json
							$.get('https://vimeo.com/api/oembed.json', {
								'url': url,
								'maxwidth': MAX_WIDTH,
								'maxheight': MAX_HEIGHT
							}, function(response) {
								renderContent(getVimeoDivContent, response);
							}, 'json').fail(onFail);


							break;

						case 'soundcloud':
							// the third index of the match is the track, and it must
							// be present - without it, it's a userpage URL for SC.
							$.get('https://soundcloud.com/oembed', {
								'url': 'https://' + identifier,
								'format': 'json',
								'maxwidth': MAX_WIDTH,
								'maxheight': MAX_HEIGHT,
								'iframe': true
							},

							function(response) {
								renderContent(getVimeoDivContent, response);
							},

							'json').fail(onFail);

							break;

						default:
							console.log('Bad site');
							return;
					}

					return mydiv;
				}
			;

			// store argument lists for insertDiv() - apply them once the target hrefs
			// are clicked
			var to_load = {};

			$(this).each(function(index) {
				mylink = $(this);
				href = mylink.attr('href');
				// no attribute, this could be an image delete in blog
				// posts or whatever
				if (typeof href === typeof undefined || href === false) {
					return this;
				}

				for (var key in sites) {
					if (sites.hasOwnProperty(key)) {
						result = href.match(sites[key][0]);

						if (result) {
							// key is the site, the second param is the part of the regexp match
							// we need
							// mylink is the jQuery element itself
							// result is the full regexp
							// index is the position of the link within the selector
							to_load[index] = [key.toString(), result[sites[key][1]], mylink, result, index];

						}
					}
				}

			});

			// we're back looking at all of these items again,
			// now that we have stored params
			// to act upon when clicked
			var items = $(this);

			$(items).click(function() {
				var index = items.index(this);

				// okay, this <a> tag has a match that we stored and are waiting for, now...
				if (to_load.hasOwnProperty(index)) {
					// create the new div based on the stored arguments
					insertDiv.apply(this, to_load[index]);

					// scrap this from memory
					delete to_load[index];

					return false;
				}

				// all other clicks fall through
				$(this).off('click');
			});

			/*$(this).on('click', function(e) {
				console.log(e);
				return false;
			});*/

			//console.log(to_load);

			return this;

		};

	})();


	(function() {
		/*
		 * Date Format 1.2.3
		 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
		 * MIT license
		 *
		 * Includes enhancements by Scott Trenda <scott.trenda.net>
		 * and Kris Kowal <cixar.com/~kris.kowal/>
		 *
		 * Accepts a date, a mask, or a date and a mask.
		 * Returns a formatted version of the given date.
		 * The date defaults to the current date/time.
		 * The mask defaults to dateFormat.masks.default.
		 */

		var dateFormat = function () {
			var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
			timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
			timezoneClip = /[^-+\dA-Z]/g,
			pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
				return val;
			};

			// Regexes and supporting functions are cached through closure
			return function (date, mask, utc) {
				var dF = dateFormat;

				// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
				if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
					mask = date;
					date = undefined;
				}

				// Passing date through Date applies Date.parse, if necessary
				date = date ? new Date(date) : new Date();
				if (isNaN(date)) throw SyntaxError("invalid date");

				mask = String(dF.masks[mask] || mask || dF.masks["default"]);

				// Allow setting the utc argument via the mask
				if (mask.slice(0, 4) == "UTC:") {
					mask = mask.slice(4);
					utc = true;
				}

				var _ = utc ? "getUTC" : "get",
				d = date[_ + "Date"](),
				D = date[_ + "Day"](),
				m = date[_ + "Month"](),
				y = date[_ + "FullYear"](),
				H = date[_ + "Hours"](),
				M = date[_ + "Minutes"](),
				s = date[_ + "Seconds"](),
				L = date[_ + "Milliseconds"](),
				o = utc ? 0 : date.getTimezoneOffset(),
				flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

			return mask.replace(token, function ($0) {
					return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
				});
			};
		}();

		// Some common format strings
		dateFormat.masks = {
			"default":      "ddd mmm dd yyyy HH:MM:ss",
			shortDate:      "m/d/yy",
			mediumDate:     "mmm d, yyyy",
			longDate:       "mmmm d, yyyy",
			fullDate:       "dddd, mmmm d, yyyy",
			shortTime:      "h:MM TT",
			mediumTime:     "h:MM:ss TT",
			longTime:       "h:MM:ss TT Z",
			isoDate:        "yyyy-mm-dd",
			isoTime:        "HH:MM:ss",
			isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
			isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
		};

		// Internationalization strings
		dateFormat.i18n = {
			dayNames: [
				"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
				"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
			],
			monthNames: [
				"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
				"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
			]
		};

		// For convenience...
		Date.prototype.format = function (mask, utc) {
			return dateFormat(this, mask, utc);
		};
	})();

	/**
	 * countdown timers....
	 *
	 * Call via var instance = new $.couNtinGDate(start, end, options)
	 * instance.doWhatever()
	 *
	 * Or via $(element).couNtinGDate(start, end, options);
	 * TODO: ? at the moment, this only goes up to 24 hours before just outputing
	 * the date in the given format (rather than x hours ago or whatever)
	 */
	(function() {

		var fromDateTime = function(datetime) {
			var a = $.map(datetime.split(/[^0-9]/), function(s) { return parseInt(s, 10); });
			return new Date(a[0], a[1]-1 || 0, a[2] || 1, a[3] || 0, a[4] || 0, a[5] || 0, a[6] || 0);
		};

		var couNtinGDate = function(start_datetime, end_datetime, options) {
			var DOWN = 'down',
			UP = 'up';

			options = options || {};

			var that = this, start = fromDateTime( start_datetime ),
			end = fromDateTime( end_datetime );

			var to = null;

			var params = $.extend({
				format: 				'fullDate',
				html_element: 			null,
				interval: 				10,
				direction: 				DOWN,
				timeup_message: 		null,
				timeup_callback: 		null,
				writing_output: 		true,
				writing_output_method: 	null,
				verbose:  				false,
				ucfirst:				false
			}, options);

			var formatOutput = function(diff, hours, minutes, seconds) {
				var really, output, is_short;

				is_short = params.format === 'shortDate';

				if (hours) {
					really = Math.round(diff / 3600);

					if (really === 1) {
						if (is_short) {
							output = '1 hr';
						} else {
							output = 'an hour';
						}
					} else {
						if (is_short) {
							output = really + ' hr';
						} else {
							output = really + ' hours';
						}
					}

					if (!is_short) {
						output = 'about ' + output;
					}
				} else if (minutes) {
					really = minutes;

					if (!is_short) {
						if (really === 1) {
							output = 'a minute';
						} else {
							output = really + ' minutes';
						}
					} else {
						output = really + ' min';
					}
				} else {
					if (!is_short) {
						output = 'a few seconds';
					} else {
						output = '&lt; 1 min';
					}
				}

				if (!is_short) {
					if (params.direction === DOWN) {
						output = output + ' ago';
					} else {
						output = output + ' left';
					}
				}

				if (params.ucfirst) {
					output = output.charAt(0).toUpperCase() + output.substr(1);
				}

				return output;
			};

			var doCounting = function(diff, hours, minutes, seconds) {
				var output = [];

				hours = parseInt(hours, 10);
				minutes = parseInt(minutes, 10);
				seconds = parseInt(seconds, 10);

				var found_prev = false;

				var pluralize = function(unit, label) {
					var str = label;

					if (1 !== unit) {
						label = label + 's';
					}

					return unit + ' ' + label;

				};

				// come back to this
				if (hours > 24) {
					return '';
				}

				if (hours > 0 || params.verbose) {
					found_prev = true;

					output.push(pluralize(hours, 'hour'));
				}

				if (minutes > 0 || params.verbose || found_prev) {
					found_prev = true;

					output.push(pluralize(minutes, 'minute'));
				}

				if (seconds > 0 || params.verbose || found_prev) {
					output.push(pluralize(seconds, 'second'));
				}

				var last = output.pop();

				if (output.length) {
					return output.join(', ') + ' and ' + last;
				} else {
					return last;
				}
			};

			var handleOutputWriting = function(diff) {
				var hours = Math.floor(diff / 3600);
				var minutes = Math.floor((diff - (hours * 3600)) / 60);
				var seconds = diff - (hours * 3600) - (minutes * 60);

				// we have been given a custom handler
				if (null !== params.writing_output_method) {
					// we want a countdown/count
					if (true === params.writing_output_method) {

						params.html_element.html(
							doCounting(diff, hours, minutes, seconds)
						);

					} else if (typeof '' === typeof params.writing_output_method) {
						throw 'Did you forget something?';
					} else {
						params.html_element.html(
							params.writing_output_method(diff, hours, minutes, seconds)
						);
					}
				} else {
					params.html_element.html(formatOutput(diff, hours, minutes, seconds));
				}

			};

			var run = function() {
				var diff = Math.round(end - start) / 1000;

				if (
					// up is down... we're counting up the amount of time to something
					(params.direction === UP && start > end) ||
					(diff <= 0 && params.direction === UP) ||
					(params.direction === DOWN && start > end) ||
					(diff >= 86400 && params.direction === DOWN)
				) {
					if (null !== params.timeup_callback) {
						params.timeup_callback();
					} else if (null !== params.timeup_message && params.writing_output) {
						params.html_element.html(params.timeup_message);
					} else if (params.writing_output) {
						params.html_element.html(start.format(params.format));
					}

					if (to) {
						window.clearTimeout(to);
					}
				} else {

					// only output text if we're told to. Edit button in the bbs
					// doesn't have any text.
					if (params.writing_output) {
						handleOutputWriting(diff);
					}

					to = window.setTimeout(function() {

						if (params.direction === DOWN) {
							end.setSeconds(end.getSeconds() + params.interval);
						} else {
							start.setSeconds(start.getSeconds() + params.interval);
						}

						run();
					}, 1000 * params.interval);
				}
			};

			return {
				// set the refresh rate
				setOurInterval: function(seconds) {
					params.interval = seconds;
				},

				// feed the beast (give it an element to output to)
				// if this doesn't exist, this instance is redundant
				begin: function(element) {
					params.html_element = $(element);

					if (params.html_element) {
						run();
					}

					return that;
				},

				// set the date/time format.
				// quick options are above, but we'll stick to
				// fullDate and mediumDate in most places
				setFormat: function(new_format) {
					params.format = new_format;
				},

				// common format we use around the site..
				setDateAtTimeFormat: function() {
					params.format = 'mm/dd/yy @ hh:MM TT';
				},

				// whether we're counting down (e.g. posts made in the past, down)
				// or up (time left of edit)
				setDirection: function(new_direction) {
					if (!$.rInArray(new_direction, [UP, DOWN])) {
						throw 'Invalid direction.';
					}

					params.direction = new_direction;
				},

				// message to display to user in the element, when time is up
				setTimeupMessage: function(message) {
					params.timeup_message = message;
				},

				// set a callback - e.g. remove the element that this is for.
				// best example of this so far is the edit button in the forums - once
				// their edit window is gone, remove the link.
				setTimeupCallback: function(callback) {
					params.timeup_callback = callback;
				},

				// if we don't want the output of the message, disable this
				setWritingOutput: function(bool) {
					params.writing_output = bool;
				},

				setWritingOutputMethod: function(method) {
					params.writing_output_method = method;
				}
			};
		};


		$.couNtinGDate = couNtinGDate;

		/**
		 * params are optional
		 */
		$.fn.couNtinGDate = function(start_datetime, end_datetime, options) {
			// nothing specified, or it could be options {}
			if (typeof start_datetime === typeof undefined || typeof start_datetime === 'object') {
				if (typeof start_datetime === 'object') {
					options = start_datetime;
				}

				// attempt to use the element's html as the datetime
				start_datetime = $(this).html().trim();
			}

			if (typeof end_datetime === typeof undefined) {
				end_datetime = PHP.get('datetime', false);
			}

			options = options || {};

			var instance = new $.couNtinGDate(start_datetime, end_datetime, options);
			return instance.begin( $(this) );
		};

		/**
		 * Apply to a whole bunch of stuff at the same time.
		 * Make sure that all elements have one part of text - the date time
		 * itself. E.g:
		 * <span id="datetime_n">2014-12-05 15:34:15</span>
		 * then call with:
		 * $.couNtinGManyDatesFromNow($('span[id^="datetime"]'), {});
		 *
		 */
		$.couNtinGManyDatesFromNow = function(selector, options) {
			var end_datetime = PHP.get('datetime', false);

			if (!end_datetime) {
				return false;
			}

			var elements = $(selector);

			if (elements) {
				elements.each(function() {
					var html = $(this).html().trim();

					// only datetimes
					if (html.match(/^\d+-\d+-\d+ \d+:\d+:\d+$/)) {
						$(this).couNtinGDate(html, end_datetime, options);
					}
				});
			}

			return elements;
		};
	})();

	/** Url parsing. **/
	(function() {
		var getRegexForName = function(name) {
			return new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
		};

		var tidyName = function(name) {
			name = name.replace(/[\[\]]/g, '\\$&');

			return name;
		};

		var getParameterByName = function(name, url) {
			url = url || window.location.href;
			name = tidyName(name);
			var regex = getRegexForName(name);
			var results = regex.exec(url);

			if (!results) {
				return null;
			}

			if (!results[2]) {
				return '';
			}

			return decodeURIComponent(results[2].replace(/\+/g, ' '));
		};

		var getAllUrlParams = function(url) {
			var name, value, bits = null;
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

		var replaceParameterByName = function(name, url, replacement) {
			var params = getAllUrlParams(url);

			var parts = [], replace_with, found = false;

			var addReplacement = function(name, replacement) {
				if (undefined !== replacement && null !== replacement) {
					parts.push(name + '=' + decodeURIComponent(replacement.replace(/\+/g, ' ')));
				}
			};

			for (var n in params) {
				replace_with = params[n];

				if (n === name) {
					found = true;
					replace_with = replacement;
				}

				addReplacement(n, replace_with);
			}

			if (!found) {
				addReplacement(name, replacement);
			}

			return url.split('?')[0] + '?' + parts.join('&');
		};

		$.getUrlParameterByName = function(name, url) {
			return getParameterByName(name, url);
		};

		$.fn.getUrlParameterByName = function(name) {
			var $el = $(this);

			if ($el.is('a')) {
				return getParameterByName(name, $el.attr('href'));
			} else if ($el.is('form')) {
				return getParameterByName(name, $el.attr('action'));
			} else {
				throw "Not sure how to getUrlParameterByName for this.";
			}
		};

		$.replaceUrlParameterByName = function(name, url, replacement) {
			return replaceParameterByName(name, url, replacement);
		};

		$.fn.replaceUrlParameterByName = function(name, replacement) {
			var $el = $(this);
			var replaced;

			if ($el.is('a')) {
				if (!$el.attr('href')) {
					return;
				}

				replaced = replaceParameterByName(name, $el.attr('href'), replacement);
				$el.attr('href', replaced);
			} else if ($el.is('form')) {
				replaced = replaceParameterByName(name, $el.attr('action'), replacement);
				$el.attr('action', replaced);
			} else {
				throw "Don't know how to replace this.";
			}
		};

	})();


	/******** ANIMATIONS ***********/
	(function() {

		// use this when you want a menu to follow the page scroll, for example
		$.fn.scrollWithPage = function(options) {
			options = options || {};

			options = $.extend({
				duration: 	200, 		// scroll animation time
				easing: 	'swing'		// linear or swing
			}, options);

			var element = $(this), element_height = element.outerHeight(), element_offset_top = element.offset().top, win_height, doc_height, scroll_to, previous_scroll = 0, original_css_position = element.css('position'), opened_once = null, topper;

			doc_height = $(document).height();

			$(window).resize(function() {
				// recalculate this
				opened_once = null;
			});

			$(document).on('scroll', function() {
				// menu height can change
				element_height = element.outerHeight();

				if ($(this).scrollTop() > ($(window).height() - element_height)) {
					scroll_to = $(this).scrollTop() - element_offset_top;

					// if scrolling down, then make sure the BOTTOM of the
					// menu is in view, as they scroll up, the top will come
					// into view. This is for people with miniscule browsers.
					if ($(window).height() < element_height && previous_scroll < $(this).scrollTop()) {
						scroll_to -= (element_height - $(window).height());
					}
				} else {
					scroll_to = 0;
				}

				// keep a record of this, so we can monitor its direction
				previous_scroll = $(this).scrollTop();

				if (undefined === options.animate || false !== options.animate) {
					//  bottom of the page
					if (($(document).scrollTop() + element_height) > doc_height) {
						scroll_to -= element_height;
					}
					element.animate({ marginTop: scroll_to }, options.duration, options.easing);
				} else {

					// set this now, if it's not already set
					if (null === opened_once && $(window).height() > element_height) {
						opened_once = true;
					}

					// only attempt this for browsers that are at least
					// as tall as the element to scroll
					//
					if (($(this).scrollTop() > element_offset_top) && (true === opened_once || $(window).height() > element_height)) {

						if ($(window).height() < element_height) {
							// should be a minus figure
							// they have scrolled down, but the menu is now
							// bigger than the window, so we want the bottom
							// half of the menu to be in view here
							topper = $(window).height() - element_height;
						} else {
							// they've scrolled down, and the menu is in full
							// view
							topper = 0;
						}

						element.css({ position: 'fixed', top: topper });
					} else {
						// back to beginning
						element.css({ position: original_css_position });
					}
				}

				// not set...
				if (null === opened_once) {
					opened_once = false;
				}
			});
		};


	})();

	/**
	 * Prevent double clicking. This should only bite us if there's some conflict with ajax
	 * based methods. I've enabled all clicking in ajaxComplete, so hopefully that'll cover it.
	 */
	$(document).ready(function() {
		$('a').on('click', function () {
			var that = $(this), clickdata = that.data('clicked');

			// moderation links and dimming the lights don't get hit by this
			var ignore = that.hasClass('mod') || that.hasClass('dim');

			if (clickdata && parseInt($.now() - clickdata, 10) < 1000 && !ignore) {
				return false;
			} else if (!ignore) {
				// reset to start with
				that.data('clicked', null);
			}

			if (!that.attr('target')) {
				that.data('clicked', $.now());
			}
		});
	});

	// FastClick for mobile browsers
	/*$(document).ready(function() {
		$(function() {
			window.FastClick.attach(document.body);
		});
	});*/

})(jQuery);

/* from https://github.com/javierjulio/textarea-autosize */
/*
	Copyright (c) 2012 Javier Julio

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
;(function ($, window, document, undefined) {

  var pluginName = "textareaAutoSize";
  var pluginDataName = "plugin_" + pluginName;

  var containsText = function (value) {
    return (value.replace(/\s/g, '').length > 0);
  };

  function Plugin(element, options) {
    this.element = element;
    this.$element = $(element);
    this.init();
  }

  Plugin.prototype = {
    init: function() {
      var diff = parseInt(this.$element.css('paddingBottom')) +
                 parseInt(this.$element.css('paddingTop')) +
                 parseInt(this.$element.css('borderTopWidth')) +
                 parseInt(this.$element.css('borderBottomWidth')) || 0;

      if (containsText(this.element.value)) {
        this.$element.height(this.element.scrollHeight - diff);
      }

      // keyup is required for IE to properly reset height when deleting text
      this.$element.on('input keyup', function(event) {
        var $window = $(window);
        var currentScrollPosition = $window.scrollTop();

        $(this)
          .height(0)
          .height(this.scrollHeight - diff);

        $window.scrollTop(currentScrollPosition);
      });
    }
  };

  $.fn[pluginName] = function (options) {
    this.each(function() {
      if (!$.data(this, pluginDataName)) {
        $.data(this, pluginDataName, new Plugin(this, options));
      }
    });
    return this;
  };

  // copied jQuery.get/post and injected xhrFields and isAjaxRequest=1 param
  $.each( [ "get", "post" ], function( i, method ) {
	$[ method + "XD"] = function(url, data, callback, type) {
		// Shift arguments if data argument was omitted
		if ( $.isFunction( data ) ) {
		type = type || callback;
		callback = data;
		data = {};
		}

		if (!data) data = {};

		if (typeof(data) == 'string') {
			data += "&isAjaxRequest=1";
		} else {
			data.isAjaxRequest = 1;
		}

		// The url can be an options object (which then must have .url)
		return $.ajax( $.extend( {
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback,
			xhrFields: { withCredentials: true }
		}, $.isPlainObject( url ) && url ) );
	};
  });

	$.getJSONXD = function( url, data, callback ) {
		return $.getXD( url, data, callback, "json" );
	};

	$.getScriptXD = function( url, callback ) {
		return $.getXD( url, undefined, callback, "script" );
	};

})(jQuery, window, document);

// 45 fps - tweak this to strike a balance between smooth animations and performance
jQuery.fx.interval = 1 / 45 * 1000;

jQuery.noConflict();

// Adds progress event to AJAX uploads
// source: https://github.com/englercj/jquery-ajax-progress
/*
    
The MIT License

Copyright (c) 2012-2018 Chad Engler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function($, window, undefined) {
    //is onprogress supported by browser?
    var hasOnProgress = ("onprogress" in $.ajaxSettings.xhr());

    //If not supported, do nothing
    if (!hasOnProgress) {
        return;
    }
    
    //patch ajax settings to call a progress callback
    var oldXHR = $.ajaxSettings.xhr;
    $.ajaxSettings.xhr = function() {
        var xhr = oldXHR.apply(this, arguments);
        if(xhr instanceof window.XMLHttpRequest) {
            xhr.addEventListener('progress', this.progress, false);
        }
        
        if(xhr.upload) {
            xhr.upload.addEventListener('progress', this.progress, false);
        }
        
        return xhr;
    };
})(jQuery, window);