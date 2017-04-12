"use strict";

// global application variable
var App = App || {};

//  Menu Controller "Class"
const MenuController = function() {

  /* Class private variable */
  let self = {};

  function initOnClick() {

    self.menu.click(function(e){
      //do something
      e.preventDefault();

      console.log(e);


    });
  }

  function initialize(id){

    /* Save the menu element*/
    self.menu = $(id);
    initOnClick();
  }

  return {
    init: initialize
  }

};