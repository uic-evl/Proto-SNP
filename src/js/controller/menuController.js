"use strict";

// global application variable
var App = App || {};

//  Menu Controller "Class"
const MenuController = function() {

  /* Class private variable */
  let self = {};

  function initOnClick() {

    self.menu.click(function(e){
      e.preventDefault();

      /* Set the color scheme depending on the option the user selected*/
      switch($(this).text()) {

        case "Side Chain Class":
          /*Set the new coloring scheme */
          App.colorMapping = "side chain";
          break;

        case "Side Chain Polarity":
          /*Set the new coloring scheme */
          App.colorMapping = "polarity";
          break;
      }

      /* Recolor the molecular viewers */
      App.leftMolecularViewer.recolor();
      App.rightMolecularViewer.recolor();

      /* Recolor the trend image*/
      App.trendImageViewer.recolor();
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