define(
    ["../utils/utils"],
    function (utils) {
		var static_xmlns = "http://www.w3.org/2000/svg";

        return function (i_svgelmt){  // input arg is the dom element to use as parent

			var svgelmt=i_svgelmt;
        	var m_width, m_height;

        	var bgColor="black";


        	// SVG elements
			var circ;
			var tick=[];
			var tri;
			var dot;

			var bgrect;

			var myCirc={
				"cx": 0,
				"cy": 0,
				"r": 0
			};

			var myTri={
				"x": 0,
				"y": 0,
				"base": .1 // in units of circle radii
			}

			var maxPitch=45;
			var lastPitch=30; // degrees in [-90, 90]
			var lastAngle=0; // degrees in [0,360]

			//var m_msg = window.document.getElementById("msg");


			var toRadians = function(angle) {
				 //m_msg.value="angle " + angle + " is " + angle * (Math.PI / 180) + " rads";
                return angle * (Math.PI / 180);
            }

 			var setDot = function(i_circle,i_a){
				dot.cx.baseVal.value = i_circle.cx + i_circle.r*Math.cos(toRadians(i_a));
				dot.cy.baseVal.value = i_circle.cy + i_circle.r*Math.sin(toRadians(i_a)); 				
 			}

 			var setTicks = function(i_circle,i_a){
				for (var i=0;i<4;i++){
					tick[i].len=myCirc.r/8;
					tick[i].setAttribute("x1",  myCirc.cx + (myCirc.r-tick[i].len/2)*Math.cos(toRadians(lastAngle+i*90)));
					tick[i].setAttribute("y1",  myCirc.cy + (myCirc.r-tick[i].len/2)*Math.sin(toRadians(lastAngle+i*90)));
					tick[i].setAttribute("x2",  myCirc.cx + (myCirc.r+tick[i].len/2)*Math.cos(toRadians(lastAngle+i*90)));
					tick[i].setAttribute("y2",  myCirc.cy + (myCirc.r+tick[i].len/2)*Math.sin(toRadians(lastAngle+i*90)));
				} 				
 			}

			// Listeners ----------------------------------------------------------

			svgelmt.onresize = function(e){
				//console.log("resize");

				// This address a bug in iOs (only) where svgelmt.width.baseVal.value are not set by CSS styling
				svgelmt.setAttributeNS(null,"width",svgelmt.clientWidth);
				svgelmt.setAttributeNS(null,"height",svgelmt.clientHeight);

				m_width = svgelmt.width.baseVal.value;
				m_height = svgelmt.height.baseVal.value;

				//bgrect --------------------------
				bgrect.setAttributeNS(null, "x", 0);
				bgrect.setAttributeNS(null, "y", 0);
				bgrect.setAttributeNS(null, "width", m_width);
				bgrect.setAttributeNS(null, "height", m_height);

				//circle --------------------------
				myCirc.cx=m_width/2;
				myCirc.cy=m_height/2;
				//console.log("myCirc.cx=" + myCirc.cx + ", and myCirc.cy=" + myCirc.cy);
				circ.r.baseVal.value=.9*Math.min(m_width,m_height)/2;
				myCirc.r=circ.r.baseVal.value;

				circ.cx.baseVal.value=myCirc.cx;
				circ.cy.baseVal.value=myCirc.cy;

				setTicks(myCirc, lastAngle);
				setDot(myCirc, lastAngle);

				//triangle -----------------------------
				myTri.x=m_width/2;
				myTri.y=m_height/2 - circ.r.baseVal.value*lastPitch/maxPitch;

    			tri.setAttributeNS(null, "points",  m_width/2-myTri.base*circ.r.baseVal.value +"," + m_height/2 + " " + myTri.x + "," + myTri.y + " " + ((m_width/2)+myTri.base*circ.r.baseVal.value) + "," + m_height/2 );

			};

			svgelmt.addEventListener("SVGResize", svgelmt.onresize, false);
			
			try 
			 { 
			  //since neither svgelmt.resize nor  svgelmt.addEventListener("SVGResize" ... seem to work
			  window.addEventListener('resize', svgelmt.onresize, false); 
			  //console.log("adding resize event on window....")
			 } 
			 catch(er){
			 	alert("error in adding event listener for display resize")
			 }

			svgelmt.onmousedown = function(e){
				//console.log("svg element mouse down!");
			};


        	// Initialize  -----------------------------------------------
        	(function init(){
        		
        		bgrect=document.createElementNS(static_xmlns,"rect");
        		bgrect.setAttributeNS(null, "fill", bgColor);
				svgelmt.appendChild(bgrect);

				circ=document.createElementNS(static_xmlns,"circle");
				tri=document.createElementNS(static_xmlns,"polygon");
				dot=document.createElementNS(static_xmlns,"circle");
	        	for (var i=0;i<4;i++){
					tick[i]=document.createElementNS(static_xmlns,"line");
					tick[i].len=0;
				}


        		svgelmt.onresize();

        		// circle ----------
				circ.style.fill="black";
				circ.setAttributeNS(null, "fill", "none");
    			circ.setAttributeNS(null, "stroke", "white");
    			circ.setAttributeNS(null, "stroke-width", 2);

				svgelmt.appendChild(circ);

				for (var i=0;i<4;i++){
   					tick[i].setAttributeNS(null, "stroke", "white");
    				tick[i].setAttributeNS(null, "stroke-width", 2);
					svgelmt.appendChild(tick[i]);
				}

				// triangle ----------
				tri.setAttributeNS(null, "fill", "none");
    			tri.setAttributeNS(null, "stroke", "green");
    			tri.setAttributeNS(null, "stroke-width", 2);
				svgelmt.appendChild(tri);

				// dot ----------
				dot.style.fill="red";
				dot.r.baseVal.value = circ.r.baseVal.value/25;
				svgelmt.appendChild(dot);

				setTicks(myCirc, lastAngle);
				setDot(myCirc, lastAngle);
				//console.log("svg width is " + svgelmt.width.baseVal.value);



				// doesn't seem to work, even if we get a match on one of the if statements...
				utils.launchFullscreen(document.documentElement);



        	})();

        	// Interface -----------------------------------------------
        	var  me = {};

        	me.setBackground=function(col){
        		bgColor=col;
				bgrect.setAttributeNS(null,"fill",col);
        	}
 
 			me.setPitch = function (i_pitch){
				lastPitch=Math.max(-maxPitch, Math.min(maxPitch,i_pitch));
				myTri.y=m_height/2 - circ.r.baseVal.value*lastPitch/maxPitch;
				tri.setAttributeNS(null, "points",  m_width/2-myTri.base*circ.r.baseVal.value +"," + m_height/2 + " " + myTri.x + "," + myTri.y + " " + ((m_width/2)+myTri.base*circ.r.baseVal.value) + "," + m_height/2 );

 			}

 			me.setAngle=function(i_ang){
				lastAngle=i_ang;
				setDot(myCirc, lastAngle);
				setTicks(myCirc, lastAngle);
 			}

            return me;
        }
    }
);
