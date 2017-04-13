define(
    ["../utils/utils"],
    function (utils) {
		var static_xmlns = "http://www.w3.org/2000/svg";

        return function (i_svgelmt){  // input arg is the dom element to use as parent

        	// Returned interface
        	var  me = {};


			var svgelmt=i_svgelmt;
        	var m_width, m_height;

        	var bgColor="black";
        	var m_myColor="green" // This will get set differently for each client


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

			//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	 		var playText=document.createElementNS(static_xmlns,"text");
			playText.style.fill="black";
			playText.setAttributeNS(null,"font-size",18);
			playText.setAttributeNS(null,"text-anchor","middle");
			playText.setAttributeNS(null,"alignment-baseline","middle");
			playText.setAttributeNS(null,"pointer-events","none");
			playText.txt=document.createTextNode("PLAY");
			playText.appendChild(playText.txt);

			var playButton=document.createElementNS(static_xmlns,"circle");
			//playButton.cx.baseVal.value=ix;
			//playButton.cy.baseVal.value=iy;
			//playButton.r.baseVal.value=ir;
     		playButton.mycolor = "black";
			playButton.style.fill="gray";
			playButton.setAttributeNS(null, "stroke", playButton.mycolor);
			playButton.setAttributeNS(null, "stroke-width", 1);

			playButton.pushedP=false;
			playButton.resize=function(ix, iy, ir){
    			playButton.cx.baseVal.value=ix;
				playButton.cy.baseVal.value=iy;
				playButton.r.baseVal.value=ir/4;

				playText.setAttributeNS(null,"x",ix );
				playText.setAttributeNS(null,"y",iy );

    		}
    		playButton.addEventListener("mousedown", function(){
				playButton.style.fill="blue";
				playButton.pushedP=true;
				me.fire("play");
			});
			playButton.addEventListener("touchstart", function(e){
				playButton.style.fill="blue";
				playButton.pushedP=true;
				me.fire("play");
				e.preventDefault();
			});

			playButton.addEventListener("mouseup", function(){
				playButton.pushedP=false;
				me.fire("release");
				playButton.style.fill="gray";
			});
			playButton.addEventListener("touchend", function(){
				playButton.pushedP=false;
				me.fire("release");
				playButton.style.fill="gray";
			});

			// (need this to prevent touchcancel events from firing with held buttons)
			playButton.addEventListener("touchmove", function(e){
				e.preventDefault();
			});

			


			
			//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

			var phaseLine=document.createElementNS(static_xmlns,"line");
			phaseLine.radius=0;
			phaseLine.angle=0;
			phaseLine.rate=0//(-1+2*Math.random())/(1000*10);
			phaseLine.color="white";
			phaseLine.lastTick=0;
			phaseLine.tick=function(itime){
				//console.log("--- old angle = " + this.angle + ", and timestep = " + (itime-this.lastTick))
				phaseLine.angle = (phaseLine.angle+(itime-phaseLine.lastTick)*phaseLine.rate*2*Math.PI)%(2*Math.PI);
				//console.log("draw vector with angle " + this.angle);
				phaseLine.lastTick=itime;
			}
			phaseLine.draw=function(){
				phaseLine.setAttribute("x1",  myCirc.cx);
				phaseLine.setAttribute("y1",  myCirc.cy);
				var foo = phaseLine.radius*Math.cos(-Math.PI/2 + phaseLine.angle);
				phaseLine.setAttribute("x2",  myCirc.cx + phaseLine.radius*Math.cos(-Math.PI/2 + phaseLine.angle));
				phaseLine.setAttribute("y2",  myCirc.cy + phaseLine.radius*Math.sin(-Math.PI/2 + phaseLine.angle)); 				  			
			}

			phaseLine.setRate=function(i_a){
				phaseLine.rate=i_a*.000005;//(-1+2*Math.random())/(1000*10);
			}

			phaseLine.setColor=function(c){
				phaseLine.color=c;
				phaseLine.setAttributeNS(null, "stroke", phaseLine.color);
			}


			phaseLine.setAttributeNS(null, "stroke-width", 2);


			var maxPitch=45;
			var minPitch=-15;
			var lastPitch=30; // degrees in [-90, 90]
			var lastAngle=0; // degrees in [0,360]

			var m_msg = window.document.getElementById("msg");


    	var makeCircle=function(ix,iy,ir,iParent){

    		//console.log("making new circle of radius " + ir)
			var c = document.createElementNS(static_xmlns,"circle");
			iParent.appendChild(c);

			c.cx.baseVal.value=ix;
			c.cy.baseVal.value=iy;
			c.r.baseVal.value=ir;

     		c.mycolor = "gray";

			c.style.fill="black";
			//c.setAttributeNS(null, "fill", "none");
			c.setAttributeNS(null, "stroke", c.mycolor);
			c.setAttributeNS(null, "stroke-width", 1);

    		return(c);
    	}

    	var k_numNoteCircles=9; // one more than the number of pitches since the innermost circle is a button
    	var m_annulusSize=1;

    	var m_noteCircles=[];
    	m_noteCircles.resize=function(ix, iy, ir){
    		for (i=0;i<k_numNoteCircles;i++){
    			m_annulusSize=(ir-ir/4)/k_numNoteCircles;
    			m_noteCircles[i].cx.baseVal.value=ix;
				m_noteCircles[i].cy.baseVal.value=iy;
				m_noteCircles[i].r.baseVal.value=ir/4 + (i+1)*m_annulusSize;
    		}
    	}

    	m_noteCircles.active=4;
    	m_noteCircles.setPitchCircle=function(ir){
    		var foo;
    		if (playButton.pushedP) return; // note only changes when not playing
    		m_noteCircles[m_noteCircles.active].style.fill="black";

 			foo = (ir-(circ.r.baseVal.value/4))/(3*circ.r.baseVal.value/4);
 			m_noteCircles.active=Math.min(k_numNoteCircles-1, Math.floor(foo*k_numNoteCircles));
    		m_noteCircles[m_noteCircles.active].style.fill=m_myColor;
    		
    	}




			var toRadians = function(angle) {
				 //m_msg.value="angle " + angle + " is " + angle * (Math.PI / 180) + " rads";
                return angle * (Math.PI / 180);
            }

 			var setDot = function(i_circle,i_a){
 				i_a-=90;
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

				m_noteCircles.resize(myCirc.cx, myCirc.cy, myCirc.r);


				circ.cx.baseVal.value=myCirc.cx;
				circ.cy.baseVal.value=myCirc.cy;

				phaseLine.pitch2Radius = utils.makeMap(minPitch, maxPitch, circ.r.baseVal.value/4,  circ.r.baseVal.value);


				playButton.resize(myCirc.cx, myCirc.cy, myCirc.r);

				setTicks(myCirc, 0);
				setDot(myCirc, lastAngle);

				//triangle -----------------------------
				myTri.x=m_width/2;
				myTri.y=m_height/2 - circ.r.baseVal.value*lastPitch/maxPitch;

    			tri.setAttributeNS(null, "points",  m_width/2-myTri.base*circ.r.baseVal.value +"," + m_height/2 + " " + myTri.x + "," + myTri.y + " " + ((m_width/2)+myTri.base*circ.r.baseVal.value) + "," + m_height/2 );

    			phaseLine.radius=phaseLine.pitch2Radius(lastPitch);
    			phaseLine.draw();

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


        		// circle ----------
				circ.style.fill="black";
				circ.setAttributeNS(null, "fill", "none");
    			circ.setAttributeNS(null, "stroke", "white");
    			circ.setAttributeNS(null, "stroke-width", 2);

				svgelmt.appendChild(circ);

				m_noteCircles[k_numNoteCircles-1] = makeCircle(myCirc.cx, myCirc.cy, myCirc.r, svgelmt);
				for (var i=k_numNoteCircles-2;i>=0;i--){
																					// (i+1) so biggest circles fills the whole reference circle
					m_noteCircles[i]=makeCircle(myCirc.cx, myCirc.cy, myCirc.r/4 + (i+1)*(myCirc.r-myCirc.r/4)/k_numNoteCircles, svgelmt)
				}
				
				// phaseLine
				svgelmt.appendChild(phaseLine);

				// play button
				svgelmt.appendChild(playButton);
				svgelmt.appendChild(playText);


				svgelmt.onresize();

				for (var i=0;i<4;i++){
   					tick[i].setAttributeNS(null, "stroke", "white");
    				tick[i].setAttributeNS(null, "stroke-width", 2);
					svgelmt.appendChild(tick[i]);
				}

				// triangle ----------
				tri.setAttributeNS(null, "fill", "none");
    			tri.setAttributeNS(null, "stroke", "green");
    			tri.setAttributeNS(null, "stroke-width", 2);
				//svgelmt.appendChild(tri);


				// dot ----------
				dot.style.fill="red";
				dot.r.baseVal.value = circ.r.baseVal.value/25;
				svgelmt.appendChild(dot);

				setTicks(myCirc, 0);
				setDot(myCirc, lastAngle);
				//console.log("svg width is " + svgelmt.width.baseVal.value);



				// doesn't seem to work, even if we get a match on one of the if statements...
				utils.launchFullscreen(document.documentElement);



        	})();

        	// Interface -----------------------------------------------


        	me.tick=function(i_time){
        		phaseLine.tick(i_time);
        		phaseLine.draw();
			}

			me.setColor=function(col){
				m_myColor=col;
				phaseLine.setColor(col);
			}
			me.getColor=function(){
				return m_myColor;
			}

        	me.setBackground=function(col){
        		bgColor=col;
				bgrect.setAttributeNS(null,"fill",col);
        	}
 
 			me.setPitch = function (i_pitch){
				lastPitch=Math.max(minPitch, Math.min(maxPitch,i_pitch));
				myTri.y=m_height/2 - circ.r.baseVal.value*lastPitch/maxPitch;
				tri.setAttributeNS(null, "points",  m_width/2-myTri.base*circ.r.baseVal.value +"," + m_height/2 + " " + myTri.x + "," + myTri.y + " " + ((m_width/2)+myTri.base*circ.r.baseVal.value) + "," + m_height/2 );

    			phaseLine.radius=phaseLine.pitch2Radius(lastPitch); //circ.r.baseVal.value*lastPitch/maxPitch;
    			m_noteCircles.setPitchCircle(phaseLine.radius);
    			phaseLine.draw();

 			}

 			me.setAngle=function(i_ang){
				lastAngle=i_ang;
				setDot(myCirc, lastAngle);
				//setTicks(myCirc, 0);
				phaseLine.setRate(i_ang);
 			}


 			me.getRingIndex = function(){
 				return m_noteCircles.active;
 			}

 			me.getNormedRadius = function(){
 				return m_noteCircles.active/(k_numNoteCircles-1);
 			}

 			me.getAngle = function(){
 				return phaseLine.angle;
 			}

 			me.getRate = function(){
 				return phaseLine.rate;
 			}


 			utils.eventuality(me);
            return me;
        }
    }
);
