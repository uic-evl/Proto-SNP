"use strict";

var App = App || {};

const ProteinModel = (function() {

  function ProteinModel() {

    this.proteinData = null;
    this.proteinAdded = new EventNotification(this);

  }

  ProteinModel.prototype = {

    getProtein : function () {
      return [].concat(this._items);
    },

    addProtein : function(protein) {
      this.proteinAdded.notify(protein);

    },

    isEmpty : function() {
      return !!this.proteinData;
    }

  };

  return ProteinModel;
})();
