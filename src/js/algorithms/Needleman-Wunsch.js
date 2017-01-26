"use strict";

// Global Application variable
var App = App || {};

(function() {

  /* Needleman-Wunsch Pairwise Alignment Algorithm */
  App.align = function(seq1, seq2, options){

    let sp = options.skipPenalty || 1;
    let gp = options.gapPenalty  || -1;
    let gc = "-";

    // swapped flag
    let swap = false;

    /* Check which sequence is longer */
    if(seq2.length > seq1.length){
      /* Swap the two arrays */
      let temp = seq2;
      seq2 = seq1;
      seq1 = temp;

      // set the flag
      swap = true;
    }

    //generate grid array
    let arr = [];

    for(let i=0;i<=seq2.length;i++) {
      arr[i] = [];

      for(let j=0;j<=seq1.length;j++) {
        arr[i][j] = null;
      }
    }

    arr[0][0] = 0;

    for(let i=1;i<=seq2.length;i++) {
      arr[0][i] = arr[i][0] = -1 * i;
    }

    for(let i=1;i<=seq2.length;i++) {
      for(let j=1;j<=seq1.length;j++) {
        arr[i][j] = Math.max(
            arr[i-1][j-1] + (seq2[i-1] === seq1[j-1] ? sp : gp),
            arr[i-1][j] + gp,
            arr[i][j-1] + gp
        );
      }
    }

    let i = seq2.length,
        j = seq1.length,
        sq1 = [],
        sq2 = [];

    return new Promise(function(resolve, reject) {

      do {

        let t = arr[i-1][j],
            d = arr[i-1][j-1],
            l = arr[i][j-1],
            max = Math.max(t, d, l);

        switch(max) {
          case t:
            i--;
            sq1.push(gc);
            sq2.push(seq2[i]);
            break;
          case d:
            j--;
            i--;
            sq1.push(seq1[j]);
            sq2.push(seq2[i]);
            break;
          case l:
            j--;
            sq1.push(seq1[j]);
            sq2.push(gc);
            break;
        }

      } while(i>0 && j>0);

      /* return the two aligned sequences */
      resolve({
        leftSequence:  (swap) ? sq2.reverse() :  sq1.reverse(),
        rightSequence: (swap) ? sq1.reverse() :  sq2.reverse()
      });

    });



  };

})();
