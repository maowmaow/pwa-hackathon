

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
	var messaging = firebase.messaging();
	
	function watchLoginState(callback) {
		if (!callback)
			return;
		
		firebase.auth().onAuthStateChanged(function(user) {
			if (!user) {
				callback();
			} else {
				var userData = user.providerData[0];
				console.log('user', userData);
				
				addMember(userData)
				.then(function(profile) {
					console.log('profile:', profile);
					callback(profile);
					
					messaging.requestPermission()
						.then(function() {
							console.log('Notification permission granted Test ..');
				            return messaging.getToken();
						})
						.then(function(token){
				            console.log('fcm token:', token);
				            return updateFcmToken(profile.uid, token);
				        },function(err) {
				        	console.log('found error', err);
				        	callback(profile);
				        });
				});
			}
		});
	}
	
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
		
		return Q.all([
				database.ref('dashboard/' + debt.lender + '/' + key).set(debt),
				database.ref('dashboard/' + debt.borrower + '/' + key).set(debt)])
			.then(function() {
				return key;
			});
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
		return getDebt(debtId).then(function(debt) {
			return Q.all([
				database.ref('debts/' + debtId).remove(),
				database.ref('dashboard/' + debt.lender + '/' + debtId).remove(),
				database.ref('dashboard/' + debt.borrower + '/' + debtId).remove()
			])
		});
	}
	
	function addMember(user) {
		console.log('begin: add member');
		var deferred = Q.defer();
		
		getProfile(user.uid).then(function(profile) {

			if (profile != null) {
				console.log('profile already exists');
				updatePicture(user.uid, user.photoURL)
				.then(function() {
					return updateLastLogin(user.uid);
				})
				.then(function() {
					getLocation(function(location){
						updateLocation(user.uid,location);
					})
				})
				.then(function() {
					deferred.resolve(profile);
				})
				return;
			}
			
			console.log('profile not exists');
			getLocation(function(location){
				var newProfile = {
					displayName: user.displayName,
			    	email: user.email,
			    	photoURL: user.photoURL,
			    	lastLogin:  new Date().toLocaleString('en-GB', {timeZone: 'Asia/Jakarta'}),
			    	location : location
				};
				
				updateProfile(user.uid, newProfile).then(function() {
					deferred.resolve(newProfile);
				}, function(err) {
					deferred.reject(err);
				});
			})
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
		profile.uid = uid;
		return database.ref('member/' + uid).set(profile);
	}
	
	function updatePicture(uid, photoURL) {
		return database.ref('member/' + uid + '/photoURL').set(photoURL);
	}
	
	function updateLastLogin(uid) {
		return database.ref('member/' + uid + '/lastLogin').set(new Date().toLocaleString('en-GB', {timeZone: 'Asia/Jakarta'}));
	}
	
	function updateFcmToken(uid, token) {
		return database.ref('member/' + uid + '/fcmToken').set(token);
	}
	
	function updateLocation(uid, location) {
		return database.ref('member/' + uid + '/location').set(location);
	}

	return {
		watchLoginState: watchLoginState,
		watchDashboard: watchDashboard,
		watchProfile: watchProfile,
		addDebt: addDebt,
		addMember: addMember,
		getProfile: getProfile,
		updateProfile: updateProfile,
		getDebt: getDebt,
		updateDebtStatus: updateDebtStatus,
		deleteDebt: deleteDebt,
		updateLastLogin: updateLastLogin,
		updateFcmToken: updateFcmToken
	}
	
})(firebase);

var helper = (function() {

	function getQueryVariable(variable){
	       var query = window.location.search.substring(1);
	       var vars = query.split("&");
	       for (var i=0;i<vars.length;i++) {
	               var pair = vars[i].split("=");
	               if(pair[0] == variable){return pair[1];}
	       }
	       return(false);
	}
	function sendMessage(token, data) {
		var deferred = Q.defer();
		
		var xmlhttp = new XMLHttpRequest(); 
        xmlhttp.open('POST', '//fcm.googleapis.com/fcm/send', true);
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.setRequestHeader("Authorization", "key=AIzaSyBPn3P3AiGxfg9MCNQiGczFC5QArpG56-w");
        xmlhttp.send(JSON.stringify({
        	notification: data,
        	to: token
        }));
        xmlhttp.onload = function() {
        	deferred.resolve();
        }
        
        return deferred.promise;
	}
	
	return {
		getQueryVariable:getQueryVariable,
		sendMessage: sendMessage
	};
})();

function getLocation(callback) {
	console.log("location function");
	if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
        	showPosition(position,callback);
        },showError);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}
function showPosition(position,callback) {
	console.log("Latitude: " + position.coords.latitude + "Longitude: " + position.coords.longitude);
	url = "//maps.googleapis.com/maps/api/geocode/json";
	data = {latlng : position.coords.latitude + ","+ position.coords.longitude ,sensor:false},
	$.ajax({
	  type: "GET",
	  url: url,
	  data : data,
	  cache: false,
	  success: function(results){
 		var results = results.results[0];
	      if (results) {
          	for (var i=0; i<results.address_components.length; i++) {
                if (results.address_components[i].types[0] == "country") {
                    country = results.address_components[i].short_name;
                }
                if (results.address_components[i].types[0] == "locality") {
                    locality = results.address_components[i].short_name;
                }
                if (results.address_components[i].types[0] == "political") {
                    political = results.address_components[i].short_name;
                }
    		}
    		address = results.formatted_address;
		    var location = {
		    	address : address,
		    	country : country,
		    	locality : locality,
		    	political : political
		    }
		    console.log("userLocation : "+ JSON.stringify(location));
		    if(callback){
		    	callback(location);
		    }
        } else {
      	  console.log("No Location found");
        }
	  }
	});
}
function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
            break;
    }
}
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