"use strict";

var App = App || {};

const jQueryContextUtils = function (self) {
  return {
    createContextMenu: function (context) {
      let clickCB = function (item) {
        /* Save the selection */
        self._menuSelection = item;
        /* Launch the modal */
        $("#viewerModal").modal("show");
        return false;
      };

      let populateMenu = function() {
          let dfd = jQuery.Deferred();
          self._model.getProteinMappings()
              .then(function (PDBs) {
                  /* Get the current protein name*/
                  let protein = self._model.getSelectedProtein().name, menu = {};
                  /* load the pdb names into the menu */
                  PDBs[protein].forEach(function (p, i) {
                      menu[p] = {
                          name: p, className: "protein_entry",
                          callback: clickCB
                      }
                  });
                  /* If no pdbs are found, tell the user*/
                  if (_.keys(menu).length === 0) {
                      menu['sub1'] = {name: "No assoc. proteins", disabled: true}
                  }
                  dfd.resolve(menu);
              });
          return dfd.promise();
      };

      $.contextMenu({
        selector: context,
        reposition: false,
        className: 'protein_context',
        build: function ($trigger, e) {
          return {
            items: {
              "fold1a": {
                "name": "Load Structure",
                "items": {
                  "status": {
                    name: "Associated PDBs",
                    icon: "add",
                    items: populateMenu(),
                    className: 'pdb_names',
                  },
                  sep1: "---------",
                  name: {
                    name: "Associate a PDB:",
                    type: 'text',
                    value: "",
                    events: {
                      keyup: function (e) {
                        /* Check for the enter key and if the string is of length 4*/
                        if (e.keyCode === 13 && this.value.length === 4) {
                          App.dataUtilities.checkPDBs(this.value).then(function (protein) {
                            let current_protein = self._model.getSelectedProtein().name;
                            /* If the protein exists, add it to the model */
                            if (protein[0].status !== "UNKNOWN") {
                              /* update the menu if the item was added */
                              if (self._model.addProteinMapping(current_protein, protein[0])) {
                                /* Add the new protein to the list */
                                // $('.context-menu-list').trigger('contextmenu:hide');
                              }
                            }
                          });
                          /* Reset the value */
                          this.value = "";
                        }
                      }
                    }
                  }
                }
              },
            }
          }
        }
      })
    }
  }
};