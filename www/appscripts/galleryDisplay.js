define(
    ["config", "../utils/utils", "../utils/phaseTrigger"],
    function (config, utils, phaseTrigger) {
		var static_xmlns = "http://www.w3.org/2000/svg";

		var msgbox = document.getElementById("msg");

        return function (i_svgelmt, player){  // input arg is the dom element to use as parent

        var ptrigger = phaseTrigger(0);

        var k_expiretime=Number.MAX_SAFE_INTEGER; // turn off vactor drawing after this number of ms

		var svgelmt=i_svgelmt;
    	var m_width, m_height;

    	var bgColor="black";
    	var m_myColor={};

    	var k_numStates=Object.keys(config.mvt).length;

    	// SVG elements
		var circ;
		var tick=[];
		var tri;
		//var phaseLine;
		var bullseye;
		var perimeter;

		var stateNumbers=[];

		var bgrect;

		// basiclly the bigest centered circle possibly on the display - used as a referene for components of the display/interface
		var referenceCircle={
			"cx": 0,
			"cy": 0,
			"r": 0
		};

		var myTri={
			"x": 0,
			"y": 0,
			"base": .07 // in units of referenceCircle radii
		}

		var lastAngle=0; // degrees in [0,360]

		//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    	var makePhaseVector=function(iParent, id, ilen, iang, irate){

			var phaseLine = document.createElementNS(static_xmlns,"line");
			phaseLine.setAttributeNS(null, "id", ""+id);
			iParent.appendChild(phaseLine);

			phaseLine.maxRate = .001;
			phaseLine.minRate = 0;
			//phaseLine.accel = 0;

    		phaseLine.rate = irate;//(-1+2*Math.random())/(1000*10),
    		phaseLine.color = "white";
    		phaseLine.lastTick = performance.now();
    		phaseLine.normlen=ilen;//referenceCircle.r/2;
    		phaseLine.angle=iang;//0;

    		phaseLine.setAttributeNS(null, "stroke", phaseLine.color);
			phaseLine.setAttributeNS(null, "stroke-width", 1);

			phaseLine.startTime=performance.now();



    		phaseLine.tick =  function(itime){
    				//this.rate+=this.accel;
    				//this.rate=Math.max(Math.min(this.rate,phaseLine.maxRate),phaseLine.minRate);
    				//console.log('rate = ' + this.rate);
    				//console.log("--- old angle = " + this.angle + ", and timestep = " + (itime-this.lastTick))
    				this.angle = (this.angle+(itime-this.lastTick)*this.rate*2*Math.PI)%(2*Math.PI);
    				//console.log("draw vector with angle " + this.angle);
    				this.lastTick=itime;
    				
    				ptrigger.tick(this.angle);
    		}

    		phaseLine.draw=function(){
					var len=(.25+.75*phaseLine.normlen)*referenceCircle.r;
 					this.setAttribute("x1",  referenceCircle.cx);
					this.setAttribute("y1",  referenceCircle.cy);
					this.setAttribute("x2",  referenceCircle.cx + len*Math.cos(-Math.PI/2 + this.angle));
					this.setAttribute("y2",  referenceCircle.cy + len*Math.sin(-Math.PI/2 + this.angle)); 				  			
    		}


    		phaseLine.setRate=function(ir){
    			phaseLine.rate=ir;
    		}

    		phaseLine.setRateNorm=function(ir){
    			phaseLine.rate=ir*phaseLine.maxRate;
    		}

    		phaseLine.setAccel=function(a){
    			//phaseLine.accel=a;
    		}

    		return(phaseLine);
    	}

    	var m_vectors = { // ID:vector pairs
    		"list": {},

    		"addMember": function(i_id, ilen, iang, irate){
    			m_vectors.list[i_id] = makePhaseVector(svgelmt, i_id, ilen, iang, irate);
    		},

   			"removeMember": function(i_id){
   				var elmt;
   				//console.log("about to delete vector with source " + i_id);
   				while ((elmt=document.getElementById(""+i_id)) != null){ // sometimes a vector fails to get removed...
   					svgelmt.removeChild(elmt);
   				}
    			delete m_vectors.list[i_id];
    			//console.log("vector deleted with source " + i_id);
    		},

    		"tick": function (i_time){
    			for (var property in m_vectors.list) {
				    if (m_vectors.list.hasOwnProperty(property)) {
				        m_vectors.list[property].tick(i_time);
				    }
				}
    		},

    		"draw": function(){
    			var now = performance.now();
    			for (var property in m_vectors.list) {
				    if (m_vectors.list.hasOwnProperty(property)) {
				    	//console.log ("age is " + (performance.now()-m_vectors.list[property].startTime));

				    	if ((now-m_vectors.list[property].startTime)>k_expiretime){ // expire
				    		this.removeMember(property);
				    	}else{
				        	m_vectors.list[property].draw();
				        }					    
				    }
				}

    		},

    		"rateChange": function(id, val){
    			if (m_vectors.list.hasOwnProperty(id)) {
				        m_vectors.list[id].setRate(val);
				}
    		},

    		"devicePitch": function(id, val){
    			if (m_vectors.list.hasOwnProperty(id)) {
				    //m_phaseBalls.list[id].setAccel(-val/9000000.);
				    val=Math.min(45, Math.max(-45,val))
				    m_vectors.list[id].setRateNorm((-val+45)/90);
				}
			}

    	}; 

		//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    	var makePhaseBall=function(iParent, id, ilen, iang, irate){

    		console.log('MAKE PHASE BALL ' + id)

			var phaseBall = document.createElementNS(static_xmlns,"circle");
			phaseBall.setAttributeNS(null, "id", ""+id);
			iParent.appendChild(phaseBall);

			phaseBall.maxRate = .001;
			phaseBall.minRate = 0;
			phaseBall.accel = 0;


    		phaseBall.rate = irate;//(-1+2*Math.random())/(1000*10),
    		phaseBall.color = "white";
    		phaseBall.lastTick = performance.now();
    		phaseBall.normlen=ilen; // radius of its orbit 
    		phaseBall.angle=iang;//0;


    		phaseBall.r.baseVal.value=.05*referenceCircle.r;
    		phaseBall.style.fill=m_myColor[id];//utils.hslToRgb(Math.random(), 1, .5);// "DarkGreen";
    		phaseBall.setAttributeNS(null, "stroke", phaseBall.color);
			phaseBall.setAttributeNS(null, "stroke-width", 1);


    		phaseBall.tick =  function(itime){
    				//this.rate+=this.accel;
    				//this.rate=Math.max(Math.min(this.rate,phaseBall.maxRate),phaseBall.minRate);

    				//console.log("--- old angle = " + this.angle + ", and timestep = " + (itime-this.lastTick))
    				this.angle = (this.angle+(itime-this.lastTick)*this.rate*2*Math.PI)%(2*Math.PI);
    				//console.log("draw vector with angle " + this.angle);
    				this.lastTick=itime;
    		}

				bullseye.cx.baseVal.value=referenceCircle.cx;
				bullseye.cy.baseVal.value=referenceCircle.cy;

    		phaseBall.draw=function(){
					var len=(.25+.75*phaseBall.normlen)*referenceCircle.r;
					phaseBall.r.baseVal.value=.05*referenceCircle.r;

					phaseBall.cx.baseVal.value=referenceCircle.cx + len*Math.cos(-Math.PI/2 + this.angle);
					phaseBall.cy.baseVal.value=referenceCircle.cy + len*Math.sin(-Math.PI/2 + this.angle); 
					//this.setAttribute("cx",  referenceCircle.cx + len*Math.cos(-Math.PI/2 + this.angle));
					//this.setAttribute("cy",  referenceCircle.cy + len*Math.sin(-Math.PI/2 + this.angle)); 				  			
    		}

    		phaseBall.setRate=function(ir){
    			phaseBall.rate=ir;
    		}

    		phaseBall.setRateNorm=function(ir){
    			phaseBall.rate=ir*phaseBall.maxRate;
    		}


    		phaseBall.setAccel=function(a){
    			//phaseBall.accel=a;
    		}


    		return(phaseBall);
    	}

    	var m_phaseBalls = { // ID:vector pairs
    		"list": {},

    		"addMember": function(i_id, ilen, iang, irate){
    			m_phaseBalls.list[i_id] = makePhaseBall(svgelmt, i_id, ilen, iang, irate);
    		},

   			"removeMember": function(i_id){
   				var elmt;
   				//console.log("about to delete phaseball with source " + i_id);
   				while ((elmt=document.getElementById(""+i_id)) != null){ // sometimes a vector fails to get removed...
   					svgelmt.removeChild(elmt);
   				}
    			delete m_phaseBalls.list[i_id];
    			//console.log("phaseball deleted with source " + i_id);
    		},

    		"tick": function (i_time){
    			for (var property in m_phaseBalls.list) {
				    if (m_phaseBalls.list.hasOwnProperty(property)) {
				        m_phaseBalls.list[property].tick(i_time);
				    }
				}
    		},

    		"draw": function(){
    			for (var property in m_phaseBalls.list) {
				    if (m_phaseBalls.list.hasOwnProperty(property)) {
				        m_phaseBalls.list[property].draw();
				    }
				}

    		},

    		"rateChange": function(id, val){
    			if (m_phaseBalls.list.hasOwnProperty(id)) {
				        m_phaseBalls.list[id].setRate(val);
				}
    		},

    		"devicePitch": function(id, val){
    			if (m_phaseBalls.list.hasOwnProperty(id)) {
				    //m_phaseBalls.list[id].setAccel(-val/9000000.);
				    val=Math.min(45, Math.max(-45,val))
				    m_phaseBalls.list[id].setRateNorm((-val+45)/90);
				}
    		}


    	}; 

		//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

		

        	// ---------- utils --------------------------
        	rotateSVG=function(obj, ang, cx, cy){
        		obj.setAttribute("transform", "rotate(" + ang + " " + cx + " " + cy + ")");       		
        	}

			var toRadians = function(angle) {
				 //m_msg.value="angle " + angle + " is " + angle * (Math.PI / 180) + " rads";
                return angle * (Math.PI / 180);
            }
            //-------------------------------------


 			var setTicks = function(i_circle,i_a){
				for (var i=0;i<6;i++){
					tick[i].len=referenceCircle.r/8;
					tick[i].setAttribute("x1",  referenceCircle.cx + (.4*referenceCircle.r-tick[i].len/2)*Math.cos(toRadians(i*60-90)));
					tick[i].setAttribute("y1",  referenceCircle.cy + (.4*referenceCircle.r-tick[i].len/2)*Math.sin(toRadians(i*60-90)));
					tick[i].setAttribute("x2",  referenceCircle.cx + (.4*referenceCircle.r+tick[i].len/2)*Math.cos(toRadians(i*60-90)));
					tick[i].setAttribute("y2",  referenceCircle.cy + (.4*referenceCircle.r+tick[i].len/2)*Math.sin(toRadians(i*60-90)));
				} 				
 			}



 			var setStateNumbers = function (){
 				var rangle;

 				for (var i=0;i<k_numStates;i++){

					rangle = -Math.PI/2 + i*2*Math.PI/k_numStates;
					stateNumbers[i].setAttributeNS(null,"x",referenceCircle.cx + .85*referenceCircle.r*Math.cos(rangle));
					stateNumbers[i].setAttributeNS(null,"y",referenceCircle.cy + .85*referenceCircle.r*Math.sin(rangle));
 				}
 			}




			// Listeners ----------------------------------------------------------

			svgelmt.onresize = function(e){
				console.log("resize");

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
				referenceCircle.cx=m_width/2;
				referenceCircle.cy=m_height/2;
				referenceCircle.r =Math.min(m_width,m_height)/2;
				//console.log("referenceCircle.cx=" + referenceCircle.cx + ", and referenceCircle.cy=" + referenceCircle.cy);

				circ.r.baseVal.value=.4*referenceCircle.r;
				circ.cx.baseVal.value=referenceCircle.cx;
				circ.cy.baseVal.value=referenceCircle.cy;


				bullseye.r.baseVal.value=.05*referenceCircle.r;
				bullseye.cx.baseVal.value=referenceCircle.cx;
				bullseye.cy.baseVal.value=referenceCircle.cy;

				perimeter.r.baseVal.value=.85*referenceCircle.r;
				perimeter.cx.baseVal.value=referenceCircle.cx;
				perimeter.cy.baseVal.value=referenceCircle.cy;

				// triange
				tri.angle=0;


				setStateNumbers();

				m_vectors.draw();
				m_phaseBalls.draw();

				setTicks(referenceCircle, lastAngle);

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

       		// perimeter ----------
        		perimeter=document.createElementNS(static_xmlns,"circle");
				perimeter.style.fill="black";
				perimeter.setAttributeNS(null, "fill", "none");
    			perimeter.setAttributeNS(null, "stroke", "blue");
    			perimeter.setAttributeNS(null, "stroke-width", 2);
				svgelmt.appendChild(perimeter);

        		// circle ----------
        		circ=document.createElementNS(static_xmlns,"circle");
				circ.style.fill="black";
				circ.setAttributeNS(null, "fill", "none");
    			circ.setAttributeNS(null, "stroke", "blue");
    			circ.setAttributeNS(null, "stroke-width", 2);
				svgelmt.appendChild(circ);


       		// bullseye ----------
        		bullseye=document.createElementNS(static_xmlns,"circle");
				bullseye.style.fill="GoldenRod";
				//bullseye.setAttributeNS(null, "fill", "none");
    			bullseye.setAttributeNS(null, "stroke", "GoldenRod");
    			bullseye.setAttributeNS(null, "stroke-width", 2);
				svgelmt.appendChild(bullseye);


 				// stateNumbers
 				for (var i=0;i<k_numStates;i++){
 					stateNumbers[i]=document.createElementNS(static_xmlns,"text");
					stateNumbers[i].style.fill="white";
					stateNumbers[i].setAttributeNS(null,"font-size",20);
					stateNumbers[i].setAttributeNS(null,"text-anchor","middle");
					stateNumbers[i].setAttributeNS(null,"alignment-baseline","middle");
					stateNumbers[i].setAttributeNS(null,"pointer-events","none");
					stateNumbers[i].txt=document.createTextNode(i);
					//stateNumbers[i].appendChild(stateNumbers[i].txt);
					//svgelmt.appendChild(stateNumbers[i]);
 				}
				

				// triangle ----------
				tri=document.createElementNS(static_xmlns,"polygon");
				tri.setAttributeNS(null, "fill", "none");
    			tri.setAttributeNS(null, "stroke", "green");
    			tri.setAttributeNS(null, "stroke-width", 2);
				//svgelmt.appendChild(tri);


				// ticks ----------
	        	for (var i=0;i<6;i++){
					tick[i]=document.createElementNS(static_xmlns,"line");
					tick[i].len=0;
   					tick[i].setAttributeNS(null, "stroke", "white");
    				tick[i].setAttributeNS(null, "stroke-width", 2);
					svgelmt.appendChild(tick[i]);
				}



        		svgelmt.onresize();
				setTicks(referenceCircle, lastAngle);

				// doesn't seem to work, even if we get a match on one of the if statements...
				utils.launchFullscreen(document.documentElement);

        	})();

			var gParamX=.5
			var gParamY=.5
			window.onmousemove=function(e){
				gParamX = e.clientX/window.innerWidth;
				gParamY = e.clientY/window.innerHeight;

			};

            // Risset
        	ptrigger.addEvent(0, function(ph){
        		msgbox.value=gParamX.toFixed(2);
                player.setParam(0,1, .3+.1*gParamY);
                player.setParam(0,3, .1, .6*gParamY);
        		player.play(0);
        		setTimeout(function(){
        			player.release(0)
        		}, gParamX*400);
        	}, 0);

            // Drone
			ptrigger.addEvent(Math.PI/3, function(ph){
        		msgbox.value=gParamX.toFixed(2);
                player.setParam(1,2, .5+.5*gParamY);
        		player.play(1);
        		setTimeout(function(){
        			player.release(1)
        		}, gParamX*400);
        	}, 1);

            // NoisyFM
			ptrigger.addEvent(2*Math.PI/3, function(ph){
        		msgbox.value=gParamX.toFixed(2);
                player.setParam(2,1, .0001 + .05*gParamY);
        		player.play(2);
        		setTimeout(function(){
        			player.release(2)
        		}, gParamX*400);
        	}, 2);

            //Dragster
			ptrigger.addEvent(Math.PI, function(ph){
        		msgbox.value=gParamX.toFixed(2);
                player.setParam(3,1, .05*gParamY);
                player.setParam(3,2, .5+.4*gParamY);
        		player.play(3);
        		setTimeout(function(){
        			player.release(3)
        		}, gParamX*400);
        	}, 3);

            //PeeperSyllable
			ptrigger.addEvent(4*Math.PI/3, function(ph){
        		msgbox.value=gParamX.toFixed(2);
                player.setParam(4,1, .75+.05*gParamY);
                player.setParam(4,2, .5+.25*gParamY);
        		player.play(4);
        		setTimeout(function(){
        			player.release(4)
        		}, gParamX*400);
        	}, 4);

            // doesn'tmatter
			ptrigger.addEvent(5*Math.PI/3, function(ph){
        		msgbox.value=gParamX.toFixed(2);
                player.setParam(5,3, .1+.8*gParamY);
        		player.play(5);
        		setTimeout(function(){
        			player.release(5)
        		}, gParamX*400);
        	}, 5);



        	// Interface -----------------------------------------------
        	var  me = {};

        	me.addVector=function(id, len, ang, rate){
					m_vectors.addMember(id, len, ang, rate); 
					m_phaseBalls.addMember(id, len, ang, rate); 
                    ptrigger.resetlastphase(-.000001);

					//player.play();
			}

        	me.removeVector=function(id){
					m_vectors.removeMember(id); 
					m_phaseBalls.removeMember(id);

					//player.release();
			}

			//function
			me.rateChange=function(id, val){
				m_vectors.rateChange(id, val);
				m_phaseBalls.rateChange(id, val);
			}

			me.devicePitch=function(id, val){
				m_vectors.devicePitch(id, val);
				m_phaseBalls.devicePitch(id, val);				
			}

    		me.setColor= function(id, val){
    			//console.log("setting m_myColor["+id+"] to " + val)
    			m_myColor[id]=val;
    		}

    		me.rmColor=function(id){
    			//console.log("removing colorID " + id);
    			delete(m_myColor[id]);
    		}


        	me.tick=function(i_time){
        		m_vectors.tick(i_time);
        		m_vectors.draw();
       			m_phaseBalls.tick(i_time);
        		m_phaseBalls.draw();
			}

         	me.setState=function(num){
         		tri.angle=(num*2*Math.PI/k_numStates)*180/Math.PI;
         		rotateSVG(tri, tri.angle, referenceCircle.cx, referenceCircle.cy);	
         		me.tick(0);
         	}
 

 			function stateFunctionHelper(f, i){
 				return function(){f(i);};
 			}



            return me;
        }
    }
);
