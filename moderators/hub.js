/* globals console, jQuery, ngutils, PHP */
var moderator_hub = {};

(function($) {

	moderator_hub.nuke_button = {};
	moderator_hub.nuke_button.items = {};

	moderator_hub.nuke_button.handle = function(element) {
		//console.log(element);
		var $element = $(element);
		var clicks = $element.data('clicks') || 0;

		clicks = clicks + 1;

		$element.data('clicks', clicks);

		var assignClass = function(clicks) {
			console.log("Clicks are " + clicks);

			$element.removeClass('amber red');

			if (clicks === 1) {
				$element.addClass('amber');
			} else if (clicks === 2) {
				$element.addClass('red');
			}
		};

		assignClass(clicks);

		if (clicks == 3) {
			// do something meaningful here
			$element.hide();

			window.clearInterval($element.data('timer'));

			var url = element.href;

			$.post(url, {
				userkey: PHP.get('uek')
			}, function(response) {
				if (response && response.success) {
					window.alert(response.success);
				}
			});

			return false;
		}

		var diminishClicks = function() {
			var clicks = $element.data('clicks');

			if (clicks === 0) {
				return;
			}

			clicks = clicks - 1;

			$element.data('clicks', clicks);

			assignClass(clicks);
		};

		if ($element.data('timer')) {
			window.clearInterval($element.data('timer'));
		}

		var interval = window.setInterval(diminishClicks, 2000);
		$element.data('timer', interval);

		return false;
	};

})(jQuery);