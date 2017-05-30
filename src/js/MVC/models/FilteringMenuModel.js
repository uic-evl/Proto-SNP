"use strict";

var App = App || {};

const FilteringMenuModel = (function() {

  function FilteringMenuModel(items) {

    this._items = items;
    this._selectedIndex = -1;

    this.selectedIndexChanged = new EventNotification(this);
  }

  FilteringMenuModel.prototype = {

    getItems : function () {
      return [].concat(this._items);
    },

    getSelectedIndex : function () {
      return this._selectedIndex;
    },

    setSelectedIndex : function (index) {
      let previousIndex;
      console.log("selected");
      previousIndex = this._selectedIndex;
      this._selectedIndex = index;
      this.selectedIndexChanged.notify({ previous : previousIndex });
    }
  };

  return FilteringMenuModel;
})();
