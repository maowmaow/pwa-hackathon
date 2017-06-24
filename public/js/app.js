

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
	
	//registerServiceWorker();
})(window, navigator);


var datastore = (function(firebase) {
	
	var config = {
		apiKey : "AIzaSyBRsvqmdTtGtTp4cEuGefHx_1x3tuuuG5U",
		authDomain : "pwa-hackathon-af0ad.firebaseapp.com",
		databaseURL : "https://pwa-hackathon-af0ad.firebaseio.com",
		projectId : "pwa-hackathon-af0ad",
		storageBucket : "pwa-hackathon-af0ad.appspot.com",
		messagingSenderId : "514074065594"
	};
	
	firebase.initializeApp(config);
	var database = firebase.database();
	
	function loadDashboard() {
		var currentUser = firebase.auth().currentUser;
		if (currentUser == null) {
			console.log('load dashboard failed. unauthenticated user.')
			return;
		}
		
		var uid = currentUser.providerData.uid;
		console.log('begin: load dashboard for user', uid);
		
		var dashboard = database.ref('dashboard/' + uid);
		dashboard.on('value', function(snapshot) {
			console.log(snapshot.val());
		});
	}
	
	function addDebt(lender, borrower, amount) {
		var debt = { lender: lender, borrower: borrower, amount: amount, paid: false };
		console.log('adding debt', debt);
		var key = database.ref('debts').push(debt).key;
		
		firebase.database().ref('dashboard/' + lender)
	}
	
	function addMember(user) {
		console.log('begin: add member');
		var deferred = Q.defer();
		
		var memberRef = database.ref('member/' + user.uid);
		memberRef.once('value').then(function(snapshot) {
			if (snapshot.val() != null) {
				console.log('hello');
				deferred.reject(new Error("user already exists"));
				return;
			}
			console.log('begin: _add member');
			return _addMember(user);
		}).then(function() {
			deferred.resolve('success');
		});
		
		return deferred.promise;
	}
	
	function _addMember(user) {
		return database.ref('member/' + user.uid).set({
	    	name: user.displayName,
	    	email: user.email
	    });
	}
	
	return {
		loadDashboard: loadDashboard,
		addDebt: addDebt,
		addMember: addMember
	}
	
})(firebase);


$(document).ready(function(){
  // the "href" attribute of the modal trigger must specify the modal ID that wants to be triggered
	$('.modal').modal();
	$('input.autocomplete').autocomplete({
	  data: {"Apple": null, "Microsoft": null, "Google": 'http://placehold.it/250x250'},
	});
	$(".button-collapse").sideNav();
	$('.datepicker').pickadate({
		selectMonths: true, // Creates a dropdown to control month
		selectYears: 15 // Creates a dropdown of 15 years to control year
	});
});