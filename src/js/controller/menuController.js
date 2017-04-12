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

      switch($(this).text()) {

        case "Side Chain Class":
          /*Set the new coloring scheme */
          App.colorMapping = "side chain";

          /* Recolor the molecular viewers */
          App.leftMolecularViewer.recolor();
          App.rightMolecularViewer.recolor();

          break;

        case "Side Chain Polarity":
          /*Set the new coloring scheme */
          App.colorMapping = "polarity";

          /* Recolor the molecular viewers */
          App.leftMolecularViewer.recolor();
          App.rightMolecularViewer.recolor();

          break;
      }


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