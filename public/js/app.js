

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