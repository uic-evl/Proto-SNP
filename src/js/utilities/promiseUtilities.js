"use strict";

// global application variable
var App = App || {};

// Utilities class for mapping protein names
App.promiseUtilities = function(){

  function MakeQueryablePromise(promise) {
    // Don't modify any promise that has been already modified.
    if (promise.isResolved) return promise;

    // Set initial state
    let isPending = true;
    let isRejected = false;
    let isFulfilled = false;

    // Observe the promise, saving the fulfillment in a closure scope.
    let result = promise.then(
      function(v) {
        isFulfilled = true;
        isPending = false;
        return v;
      },
      function(e) {
        isRejected = true;
        isPending = false;
        throw e;
      }
    );

    result.isFulfilled = function() { return isFulfilled; };
    result.isPending = function() { return isPending; };
    result.isRejected = function() { return isRejected; };

    return result;
  }

  return {
    makeQueryablePromise : MakeQueryablePromise
  }
}();