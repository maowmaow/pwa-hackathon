

(function(window, navigator) {
	
	function registerServiceWorker() {
		console.log('begin: register service worker');
		if ('serviceWorker' in navigator) {
		  window.addEventListener('load', function() {
		    navigator.serviceWorker
		    	.register('/service-worker.js')
		    	.then(function(registration) {
		    		console.log('ServiceWorker registration successful with scope: ', registration.scope);
		    	}, function(err) {
		    		console.log('ServiceWorker registration failed: ', err);
		    	});
		  });
		}
	}
	
	registerServiceWorker();
	
})(window, navigator);

$(".button-collapse").sideNav();
$(document).ready(function(){
  // the "href" attribute of the modal trigger must specify the modal ID that wants to be triggered
$('.modal').modal();
$('input.autocomplete').autocomplete({
  data: {"Apple": null, "Microsoft": null, "Google": 'http://placehold.it/250x250'},
});
});

$('.datepicker').pickadate({
selectMonths: true, // Creates a dropdown to control month
selectYears: 15 // Creates a dropdown of 15 years to control year
});