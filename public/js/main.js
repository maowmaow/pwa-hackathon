'use strict';
var filename = window.location.pathname;
var temp_id
// alert(filename);
// Initializes DebtRemind.
function DebtRemind() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.messageList = document.getElementById('messages');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');
  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');

  // Saves message on form submit.

  // Toggle for the button.
  


  if(filename == '/chatroom.html'){
    this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
    var buttonTogglingHandler = this.toggleButton.bind(this);
    this.messageInput.addEventListener('keyup', buttonTogglingHandler);
    this.messageInput.addEventListener('change', buttonTogglingHandler);
    // Events for image upload.
    this.submitImageButton.addEventListener('click', function(e) {
      e.preventDefault();
      this.mediaCapture.click();
    }.bind(this));
    this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));
  }

  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
DebtRemind.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

DebtRemind.prototype.removeMessages = function(){
  $( ".container" ).empty();
};

// Loads chat messages history and listens for upcoming ones.
DebtRemind.prototype.loadMessages = function() {
  // Reference to the /messages/ database path.
  if(filename == '/index.html' || filename == '/'){
    this.messagesRef = this.database.ref('messages');
  }
  if(filename == '/chatroom.html'){
    var param1var = getQueryVariable("id");//id of card
    this.messagesRef = this.database.ref('messagesChat/'+param1var);
  }
  // Make sure we remove all previous listeners.
  this.messagesRef.off();

  // Loads the last 12 messages and listen for new ones.
  var setMessage = function(data) {
    var val = data.val();
    // console.log('K' + this.messagesRef);
    // if(this.messagesRef.key == "messages") {
    //   console.log('Load messages');
    // 	this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl, val.time);;
    // }
    // else if(this.messagesRef.key == ("messagesChat/"+param1var)){
    	this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl, val.time);
    // }
  }.bind(this);
  // Edited by IQ - No Limit
  this.messagesRef.on('child_added', setMessage);
  this.messagesRef.on('child_changed', setMessage);
};

function getQueryVariable(variable){
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

//Saves a new message on the Firebase DB.
DebtRemind.prototype.saveMessage = function(e) {
  if(filename == '/chatroom.html'){
    var param1var = getQueryVariable("id");//id of card
    this.messagesRef = this.database.ref('messagesChat/'+param1var);
  }
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (this.messageInput.value && this.checkSignedInWithMessage()) {
    var currentUser = this.auth.currentUser;
    // Add a new message entry to the Firebase Database.
    var inputText = this.messageInput.value; //Added by IQ - use InputText
    this.messagesRef.push({
      name: currentUser.displayName,
      text: inputText, //Edited by IQ - use InputText instead
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
      time: getCurrentTime()
    }).then(function( newMsg ) { // Edit by IQ - Add newMsg parameter
    // Clear message text field and SEND button state.
    DebtRemind.resetMaterialTextfield(this.messageInput);
    this.toggleButton();
    }.bind(this)).catch(function(error) {
      console.error('Error writing new message to Firebase Database', error);
    });
  }
};

function getCurrentTime(){
  var d = new Date();
  return d.toString()
}

// Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
DebtRemind.prototype.setImageUrl = function(imageUri, imgElement) {
  // If the image is a Cloud Storage URI we fetch the URL.
  if (imageUri.startsWith('gs://')) {
    imgElement.src = DebtRemind.LOADING_IMAGE_URL; // Display a loading image first.
    this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
      imgElement.src = metadata.downloadURLs[0];
    });
  } else {
    imgElement.src = imageUri;
  }
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
DebtRemind.prototype.saveImageMessage = function(event) {
  event.preventDefault();
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  this.imageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (this.checkSignedInWithMessage()) {

    // We add a message with a loading icon that will get updated with the shared image.
    var currentUser = this.auth.currentUser;
    this.messagesRef.push({
      name: currentUser.displayName,
      imageUrl: DebtRemind.LOADING_IMAGE_URL,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
      time: getCurrentTime()
    }).then(function(data) {

      // Upload the image to Cloud Storage.
      var filePath = currentUser.uid + '/' + data.key + '/' + file.name;
      return this.storage.ref(filePath).put(file).then(function(snapshot) {

        // Get the file's Storage URI and update the chat message placeholder.
        var fullPath = snapshot.metadata.fullPath;
        return data.update({imageUrl: this.storage.ref(fullPath).toString()});
      }.bind(this));
    }.bind(this)).catch(function(error) {
      console.error('There was an error uploading a file to Cloud Storage:', error);
    });
  }
};

// Signs-in Friendly Chat.
DebtRemind.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of Friendly Chat.
DebtRemind.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
DebtRemind.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;  

    // We load currently existing messages.
    this.loadMessages();

    // We save the Firebase Messaging Device token and enable notifications.
    this.saveMessagingDeviceToken();
  } else { // User is signed out!
    //We remove currently existing messages.
    this.removeMessages();
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
DebtRemind.prototype.checkSignedInWithMessage = function() {
  /* TODO(DEVELOPER): Check if user is signed-in Firebase. */
   if (this.auth.currentUser) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Saves the messaging device token to the datastore.
DebtRemind.prototype.saveMessagingDeviceToken = function() {
  // TODO(DEVELOPER): Save the device token in the realtime datastore
};

// Requests permissions to show notifications.
DebtRemind.prototype.requestNotificationsPermissions = function() {
  // TODO(DEVELOPER): Request permissions to send notifications.
};

// Resets the given MaterialTextField.
DebtRemind.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// // Template for messages.
// if(filename == '/'){
//   DebtRemind.MESSAGE_TEMPLATE =
//     '<a class="message-container">' +
//       '<div class="spacing"><div class="pic"></div></div>' +
//       '<div class="message"></div>' +
//       '<div class="name"></div>' +
//       '<div class="timeago" style="float: right;"></div>' +
//       // '<div class="timeago" datetime="2008-07-17T09:24:17Z">July 17, 2008</div>' +
//     '</a>';
// }
if(filename == '/chatroom.html'){
  DebtRemind.MESSAGE_TEMPLATE =
    '<div class="message-container comment">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="message"></div>' +
      '<div class="name"></div>' +
      // '<div class="timeago" style="float: right;"></div>' +
    '</div>';
}


// A loading image URL.
DebtRemind.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Displays a Message in the UI.
// Edited by IQ - Add newMessage Parameter
DebtRemind.prototype.displayMessage = function(key, name, text, picUrl, imageUri, time, newMessage=0) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = DebtRemind.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    if(filename == '/'){
      div.setAttribute('href','chatroom.html?id='+key)  
    }
    if(filename == '/'){
      this.messageList.prepend(div);
    }
    if(filename == '/chatroom.html'){
      this.messageList.appendChild(div);
    }
  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.name').textContent = name;
  
  var messageElement = div.querySelector('.message');
  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');

    //Added by IQ - Auto Link
    var urlRegex = /(?![^<]*>|[^<>]*<\/)((https?:)\/\/[a-z0-9&#=.\/\-?_]+)/gi; 
	  var link = '<a href="$1" target="_blank">$1</a>'; 
	  messageElement.innerHTML = messageElement.innerHTML.replace(urlRegex, link);

  } else if (imageUri) { // If the message is an image.
    var modal_image = document.createElement('img');
    var act_image = document.createElement('img');
    var modal = document.createElement('div')
    var bg = document.createElement('div')
    var con = document.createElement('div')
    var button = document.createElement('button')
    modal.setAttribute('class', 'modal');
    modal_image.setAttribute('style','max-width: 100%;max-height: 100%;');
    bg.setAttribute('class', 'modal-background');
    con.setAttribute('class', 'modal-content');
    button.setAttribute('class', 'modal-close');

    act_image.addEventListener("click", function(){
      $("#" + key + " > .message > .modal").addClass('is-active')
    });
    button.addEventListener("click", function(){
      $("#" + key + " > .message > .modal").removeClass('is-active')
    });

    act_image.addEventListener('load', function() {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }.bind(this));
    modal_image.addEventListener('load', function() {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, act_image);
    this.setImageUrl(imageUri, modal_image);
    messageElement.innerHTML = '';

    con.appendChild(modal_image)
    modal.appendChild(bg)
    modal.appendChild(con)
    modal.appendChild(button)
    messageElement.appendChild(modal)
    messageElement.appendChild(act_image)
  }

  // Set time
  // var d = new Date(time).toISOString()
  // $("#" + key + " > .timeago").attr('datetime', d).timeago()

  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);

  // Added by IQ - Scroll to bottom when in comment page
  if(this.messagesRef.key == "messagesChat") {
  	this.messageList.scrollTop = this.messageList.scrollHeight; 
  }
  else{
  	this.messageList.scrollTop = this.messageList.scrollHeight - this.messageList.scrollTop - this.messageList.scrollHeight;
  }
  this.messageInput.focus();
};

// Enables or disables the submit button depending on the values of the input fields.
DebtRemind.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
DebtRemind.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
};

window.onload = function() {
  window.debtRemind = new DebtRemind();
};