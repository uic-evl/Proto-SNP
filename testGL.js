(function(){

  // https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

  let sequence = "L Q L A E P S E E P T N L I K Q K M D E L I K H L N Q K I V S L K R E Q Q T I S E E C S A N D R L G Q D L F A K L A E K V R P S E A S K F R T H V D A V G N I T S L L L S L S E R L A Q T E S S L E T R Q Q E R G . . . . . . A L E S K R D L L Y E Q M E E A Q R L K S D I E R R G V S I A G L L A K N L S A D M C A D Y D Y F I N M K A K L I A D A R D L A V R I K G S E E Q L S S L S D A L V Q S D C ~ ~ ~ ~ A E N S E D E L G Q N L S E K K Q E L I D S I S K K L Q V L R D A K E T L L E D V Q C N N A L G E E V E I I V K E V C K P N E F D K F R M F I G D L E K I V N L L L S L S G R L A R V E N A L N N L D E T V S P E E R K T . L L E K R K L L T R Q H E D A K E L K E N L D R R E R T V Y E I L A N Y L N E E N L A D Y E H F V K M K S A L I L E Q R E L E D K I K L R E S Q L K C L T D S L P L D R I K ~ ~ ~ E E Y S A G D L D H D L S V K K Q E L I D S I S R K L Q V L R E A R E S L L E D I Q A N N A L G D E V E A I V K D V C K P N E F D K F R M F I G D L D K V V N L L L S L S G R L A R V E N A L N N L D D N P S P G D R Q S . L L E K Q R V L T Q Q H E D A K E L K E N L D R R E R I V F D I L A T Y L S E E N L A D Y E H F V K M K S A L I I E Q R E L E D K I H L G E E Q L K C L F D S L Q P E R S K ~ ~ ~ ~ G L G E E E V D H E L A Q K K I Q L I E S I S R K L S V L R E A Q R G L L E D I N A N S A L G E E V E A N L K A V C K S N E F E K Y H L F V G D L D K V V N L L L S L S G R L A R V E N A L N S I D S E A N Q . . E K L V L I E K K Q Q L T G Q L A D A K E L K E H V D R R E K L V F G M V S R Y L P Q D Q L Q D Y Q H F V K M K S A L I I E Q R E L E E K I K L G E E Q L K C L R E S L L L G P S N F ~ ~ E E Y S A G D L D H D L S I K K Q E L I D S I S R K L Q V L R E A R E S L L E D I Q A N N A L G D E V E A I V K D V C K P N E F D K F R M F I G D L D K V V N L L L S L S G R L A R V E N A L N N L D D S P S P G D R Q S . L L E K Q R V L T Q Q H E D A K E L K E N L D R R E R I V F D I L A T Y L S E E N L A D Y E H F V K M K S A L I I E Q R E L E D K I H L G E E Q L K C L F D S L Q P E R S K ~ ~ H E E D S G S D L D H D L S V K K Q E L I E S I S R K L Q V L R E A R E S L L E D V Q A N T V L G A E V E A I V K G V C K P S E F D K F R M F I G D L D K V V N L L L S L S G R L A R V E N A L N N L D D G A S P G D R Q S . L L E K Q R V L I Q Q H E D A K E L K E N L D R R E R I V F D I L A N Y L S E E S L A D Y E H F V K M K S A L I I E Q R E L E D K I H L G E E Q L K C L L D S L Q P E R G K ~ ~ ~ ~ ~ V N E E E E Q A D V N E K K A E L I G S L T H K L E T L Q E A K G S L L T D I K L N N A L G E E V E A L I S E L C K P N E F D K Y R M F I G D L D K V V N L L L S L S G R L A R V E N V L S G L G E D A S N E E R S S . L Y E K R K I L A G Q H E D A R E L K E N L D R R E R V V L G I L A N Y L S E E Q L Q D Y Q H F V K M K S T L L I E Q R K L D D K I K L G Q E Q V K C L L E S L P S D F I P K ~ ~ ~ ~ L Q E E E G Q E D V N E K K A E L I G S L T H K L E S L Q E A K G S L L T D I K L N N A L G E E V E A L I S E L C K P N E F D K Y K M F I G D L D K V V N L L L S L S G R L A R V E N V L R G L G E D A S K E E R S S . L N E K R K V L A G Q H E D A R E L K E N L D R R E R V V L D I L A N Y L S A E Q L Q D Y Q H F V K M K S T L L I E Q R K L D D K I K L G Q E Q V R C L L E S L P S D F R P K ~ ~ ~ G L G E E G V D Y E L A Q K K I Q L I E S I S R K L S V L R E A Q R G L L D D I N A N A A L G E E V E A N L K A V C K S N E F E K Y H L F I G D L D K V V N L L L S L S G R L A R V E N A L N S I D S E S N Q . . E K L V L I E K K Q Q L T N Q L A D A K E L K E H V D G R E K L V F G M V S R Y L P Q D Q L Q D Y Q H F V K M K S A L I I E Q R E L E E K I K L G E E Q L K C L K E S L H L G P S N F ~ G I D P F T E E P T N L I K Q K M D E L I K H L N Q K I V S L K R E Q Q T I S E E C S A N D R L G Q D L F A K L A E K V R P S E A S K F R T H V D A V G N I T S L L L S L S E R L A Q T E S S L E T R Q Q E R G . . . . . . A L E S K R D L L Y E Q M E E A Q R L K S D I E R R G V S I A G L L A K N L S A D M C A D Y D Y F I N M K A K L I A D A R D L A V R I K G S E E Q L S S L S D A L V Q S D C ~ ~ ~ ~ ~ ~ L N E E E E Q V D V N E K K A E L I G S L T H K L E T L Q E A K G S L L M D I K L N N A L G E E V E A L I S E L C K P N E F D K Y K M F I G D L D K V V N L L L S L S G R L A R V E N V L S G L G E D A S N E E R S S . L N E K K K V L A G Q H E D A R E L K E N L D R R E R V V L D I L A N Y L S E E Q L Q D Y Q H F V K M K S T L L I E Q R K L D D K I K L G Q E Q V K C L L E S L P S D F I P K ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ A I Q L I K S I S R K L S V L R E A Q R G L L E D I N A N S A L G E E V E A N L K A V C K S N E F E K Y H L F V G D L D K V V N L L L S L S G R L A R V E N A L N S I D S E A N Q . . E K L V L I E K K Q Q L T G Q L A D A K E L K E H V D R R E K L V F G M V S R Y L P Q D Q L Q D Y Q H F V K M K S A L I I E Q R E L E E K I K L G E E Q L K C L T E S L L L G P S N F ~ K E E D S E D E L D H D L S E K K Q E L I D S I S R K L Q V L R E A R E T L L E D I Q A N N L L G D E V E S L V K E V C K P N E F D K F R M F I G D L D K V V N L L L S L S G R L A R V E N A I N N L D E N A S A E E R E K M L Y E K Q K L L T Q Q H E D A K E L K E N L D R R E R I V F D I L A N Y L N D D S L A D Y E H F V K M K S A L I I E Q R E L E D K I K L G E E Q L K C L T D S L Q P E R P K ~ ~ ~ ~ ~ D S E D E L T T D L S S K K Q E L M D S L S K K L Q V L R E A R E S L Q E D V Q D N N A L G E E V E A T V Q S V C R A N E L E K F R M F V G D L D K V V S L L L S L S G R L A R V E N A L D N L E E G T S A D E K Q T . L T E K R R L L I G Q H E D A K E L K E N L D R R E R V V Y E I L T G Y F R E E Q L A D Y R H F V K M K S A L I I E Q R K L E D K I K L G E E Q L K C L K E S L P L E Q R L L Q P C G Q G L P A P N N S I Q G K K V E L A A R L Q K M L Q D L H T E Q E R L Q G E A Q A W A R R Q A A L E A A V R Q A C A P Q E L E R F S R F M A D L E R V L G L L L L L G S R L A R V R R A L A R A A S D S D P D E Q A S . L L Q R L R L L Q R Q E E D A K E L K E H V A R R E R A V R E V L V R A L P V E E L R V Y C A L L A G K A A V L A Q Q R N L D E R I R L L Q D Q L D A I R D D L G H H A P S P";

  let canvas = document.getElementById("c");
  let gl = canvas.getContext("webgl");



})();