var App = App || {};

const TrendImage = (function(options) {

  let self = {};

  /* Parse the incoming data into row, columns, and values */
  function map_trend_image_data() {
    return new Promise(function(resolve, reject) {
      let data = [], index = [], columns = [];
      /* Extract the rows and data */
     self.protein_family_data.forEach( (d,i) => {
        data.push(d.sequence);
        index.push(d.name);
      } );
      /* Extract the columns */
      data[0].forEach( (d,i) => { columns.push(["R", i]) } );

      resolve({ data: data, index : index, columns : columns });
    });

  }

})();