
var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
  '/index.html',
  '/chatroom.html',
  '/confirmDebt.html',
  '/profile.html',
  '/css/materialize.min.css',
  '/css/app.css',
  '/fonts/roboto/Roboto-Bold.woff',
  '/fonts/roboto/Roboto-Bold.woff2',
  '/fonts/roboto/Roboto-Light.woff',
  '/fonts/roboto/Roboto-Light.woff2',
  '/fonts/roboto/Roboto-Medium.woff',
  '/fonts/roboto/Roboto-Medium.woff2',
  '/fonts/roboto/Roboto-Regular.woff',
  '/fonts/roboto/Roboto-Regular.woff2',
  '/fonts/roboto/Roboto-Thin.woff',
  '/fonts/roboto/Roboto-Thin.woff2',
  '/js/firebase.js',
  '/js/jquery-3.2.1.min.js',
  '/js/materialize.min.js',
  '/js/app.js',
  '/js/vue.min.js',
  '/js/q.js',
  '/js/main.js',
  '/img/ic_launcher_c512.png',
  '/img/ic_launcher.png',
  '/img/ic_launcher2.png'
];

self.addEventListener('install', function(event) {
	console.log('service: installing');
	event.waitUntil(
		caches.open(CACHE_NAME)
			  .then(function(cache) {
				  return cache.addAll(urlsToCache);
		      })
	);	
});


self.addEventListener('fetch', function(event) {
	console.log('service: fetch');
	event.respondWith(
		caches
			.match(event.request)
			.then(function(response) {
				if (response) {
					return response;
				}
				return fetch(event.request);
			})
	);
});