

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
    
    /*  notify */
     const messaging = firebase.messaging();
    
    messaging.requestPermission()
        .then(function() {
          console.log('Notification permission granted11 ..');
             return messaging.getToken();
        })
         .then(function(token){
               console.log(token);
        })
        .catch(function(err) {
          console.log('Unable to get permission to notify.', err);
        });

    
     /*  notify */
    
    
    
	var database = firebase.database();
	
	function watchDashboard(uid, callback) {
		console.log('begin: load dashboard for user', uid);
		
		database.ref('dashboard/' + uid).on('value', function(snapshot) {
			if (callback) {
				callback(snapshot.val());
			}
		});
	}
	
	function addDebt(debt) {
		debt.paid = false;
		console.log('adding debt', debt);
		var key = database.ref('debts').push(debt).key;
		
		database.ref('dashboard/' + debt.lender + '/' + key).set(debt);
		database.ref('dashboard/' + debt.borrower + '/' + key).set(debt);
	}
	
	function addMember(user) {
		console.log('begin: add member');
		var deferred = Q.defer();
		
		getProfile(user.uid).then(function(snapshot) {
			
			var profile = snapshot.val();
			if (profile != null) {
				console.log('profile already exists');
				deferred.resolve(profile);
				return;
			}
			
			console.log('profile not exists');
			var newProfile = {
					displayName: user.displayName,
			    	email: user.email
				};
			
			updateProfile(user.uid, newProfile).then(function() {
				deferred.resolve(newProfile);
			}, function(err) {
				deferred.reject(err);
			});
		})
		
		return deferred.promise;
	}
	
	// return promise
	function getProfile(uid) {
		return database.ref('member/' + uid).once('value');
	}
	
	// uid = string, profile = { displayName, email, bankAccount }
	function updateProfile(uid, profile) {
		return database.ref('member/' + uid).set(profile);
	}
	
	return {
		watchDashboard: watchDashboard,
		addDebt: addDebt,
		addMember: addMember,
		getProfile: getProfile,
		updateProfile: updateProfile
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