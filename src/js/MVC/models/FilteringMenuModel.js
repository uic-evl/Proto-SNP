"use strict";

var App = App || {};

const FilteringMenuModel = (function() {

  function FilteringMenuModel(options) {
    let self = this;

    self._items = options.items;
    self._selectedElement = '';

    self.selectedElementChanged = new EventNotification(this);
  }

  FilteringMenuModel.prototype = {

    getItems : function () {
      return [].concat(this._items);
    },

    getSelectedIndex : function () {
      return this._selectedElement;
    },

    setSelectedElement : function (element) {
      let previousIndex;
      previousIndex = this._selectedElement;
      this._selectedElement = element;
      this.selectedElementChanged.notify({ previous : previousIndex });
    }
  };

  return FilteringMenuModel;
})();
