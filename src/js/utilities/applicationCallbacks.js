"use strict";

// global application variable
var App = App || {};

// Application-wide callback handler
App.ApplicationCallbackListener = (function() {

  let self = {};
  let registeredKeys = {};

  function addKeyboardCallback(key, cb) {
    registeredKeys[key] = cb;
  }

  function initialize(){
    /* Add a listener on the key press for the entire application*/
    document.addEventListener('keypress', function(ev) {

      /* iterate over all of the added callbacks and perform their action if the key was pressed*/
      _.toPairs(registeredKeys).forEach(function(pair){
        if(parseInt(pair[0]) === ev.keyCode) { pair[1](ev); }
      })

    });
  }

  initialize();

  return {
    addKeyboardCallback : addKeyboardCallback
  }

})();