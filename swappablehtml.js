/*jshint evil: true, ng: true */

var addSwappableElement, addSwappableHTML, drawSwappableElement, fillSwappableElements, clearSwappableElements;

(function () {
	// we will load in another js file afterthis one that will set this to false unless it's blocked by an ad-blocker
	var
		user_is_a_leech = true,
		swappable_names = {},
		swappable_code = []
	;

	// modify / break apart/ignore, as needed
	var get_substitution = function (ending, width, height) {
		return '<iframe src="http://www.newgrounds.com/promo/store_promo' + ending + '.html" height="' + height + '" width="' + width + '" scrolling="no" frameborder="0"></iframe>';
	};

	var substitute_codes = {
		'728x90':	get_substitution('_wide', 728, 90),
		'630x90':	get_substitution('630x90', 630, 90),
		'125x600': get_substitution('125x600', 600, 125),
		'200x200': get_substitution('200x200', 200, 200),
		'300x250': get_substitution('300x250', 250, 300)
	};

	// aliases
	substitute_codes.wide		= substitute_codes['728x90'];
	substitute_codes.sky		= substitute_codes['125x600'];
	substitute_codes.square		= substitute_codes['200x200'];
	substitute_codes.box		= substitute_codes['300x250'];

	addSwappableElement = function (base_code, code_type, element_id) {
		element_id = addSwappableHTML(base_code, code_type, element_id);
		drawSwappableElement(element_id);
	};

	addSwappableHTML = function(base_code, code_type, element_id) {
		if (!element_id) {
			element_id = 'swappable_html';
		}
		if (swappable_names[element_id] !== undefined) {
			swappable_names[element_id]++;
			element_id = element_id + '_duplicate_'+ swappable_names[element_id];
		} else {
			swappable_names[element_id] = 0;
		}

		if (code_type === undefined) {
			code_type = null;
		}

		swappable_code.push({
			element_id: element_id,
			base_code: base_code,
			code_type: code_type
		});

		return element_id;
	};

	drawSwappableElement = function(element_id) {
		document.write('<div id="' + element_id + '"></div>');
	};

	fillSwappableElements = function() {
		var i, element, code_type;

		for (i = 0; i < swappable_code.length; i++) {
			element = $('#' + swappable_code[i].element_id);

			if (element.length) {

				code_type = swappable_code[i].code_type;

				// if an ad blocker is running and this code has a code type, use subsititue code
				if (user_is_a_leech && code_type !== null) {

					// if we aren't using a freset substitute, we will just use whatever was passed
					if (substitute_codes[code_type] === undefined) {
						element.html(code_type);

					// if we're using a prefab, we'll plop it in
					} else {
						element.html(substitute_codes[code_type]);
					}

				// if there is no blocker or no code type, just use the code provided
				} else {
					element.html(swappable_code[i].base_code);
				}
			}
		}
	};

	clearSwappableElements = function() {
		for (var i = 0; i < swappable_code.length; i++) {
			$('#' + swappable_code[i].element_id).html('');
		}
	};

	(function () {
		var delayed_load = PHP.get('delayed_load'), id;

		if (delayed_load) {
			for (id in delayed_load) {
				if (delayed_load.hasOwnProperty(id)) {
					$('#' + id).html(delayed_load[id]);
				}
			}
		}
	})();

})();

