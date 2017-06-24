

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
	
	function watchDashboard(uid, callback) {
		console.log('begin: load dashboard for user', uid);
		
		database.ref('dashboard/' + uid).on('value', function(snapshot) {
			if (callback) {
				callback(snapshot.val());
			}
		});
	}
	
	function addDebt(debt) {
		debt.status = 'pending';
		console.log('adding debt', debt);
		var key = database.ref('debts').push(debt).key;
		
		database.ref('dashboard/' + debt.lender + '/' + key).set(debt);
		database.ref('dashboard/' + debt.borrower + '/' + key).set(debt);
	}
	
	function getDebt(debtId) {
		return database.ref('debts/' + debtId).once('value').then(function(snapshot) {
			return snapshot.val();
		});
	}
	
	function updateDebtStatus(debtId, newStatus) {
		return getDebt(debtId).then(function(debt) {
			return Q.all([
				database.ref('debts/' + debtId + '/status').set(newStatus),
				database.ref('dashboard/' + debt.lender + '/' + debtId + '/status').set(newStatus),
				database.ref('dashboard/' + debt.borrower + '/' + debtId + '/status').set(newStatus)
			]);
		});
	}
	
	function deleteDebt(debtId) {
		return database.ref('debts/' + debtId).remove();
	}
	
	function addMember(user) {
		console.log('begin: add member');
		var deferred = Q.defer();
		
		getProfile(user.uid).then(function(profile) {

			if (profile != null) {
				console.log('profile already exists');
				updatePicture(user.uid, user.photoURL).then(function() {
					deferred.resolve(profile);
				})
				return;
			}
			
			console.log('profile not exists');
			var newProfile = {
					displayName: user.displayName,
			    	email: user.email,
			    	photoURL: user.photoURL
				};
			
			updateProfile(user.uid, newProfile).then(function() {
				deferred.resolve(newProfile);
			}, function(err) {
				deferred.reject(err);
			});
		})
		
		return deferred.promise;
	}
	
	function watchProfile(callback) {
		return database.ref('member').on('value', function(snapshot) {
			if (callback) {
				callback(snapshot.val());
			}
		});
	}
	
	// return promise
	function getProfile(uid) {
		return database.ref('member/' + uid).once('value').then(function(snapshot) {
			return snapshot.val();
		});
	}
	
	// uid = string, profile = { displayName, email, bankAccount }
	function updateProfile(uid, profile) {
		return database.ref('member/' + uid).set(profile);
	}
	
	function updatePicture(uid, photoURL) {
		return database.ref('member/' + uid + '/photoURL').set(photoURL);
	}
	
	return {
		watchDashboard: watchDashboard,
		watchProfile: watchProfile,
		addDebt: addDebt,
		addMember: addMember,
		getProfile: getProfile,
		updateProfile: updateProfile,
		getDebt: getDebt,
		updateDebtStatus: updateDebtStatus,
		deleteDebt: deleteDebt
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