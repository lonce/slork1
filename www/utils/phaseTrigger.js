define(
    [],
    /*
    	This factory makes objects that keep a sorted list  of objects of the form 
    		{phase, callback, id}
    	and exposes a tick(t) method which calls the callback function if stored phase 
    	is between the time time of the last tick and the current tick. 
    */ 
    function(){
    	return function (initPhase) { // Factor function 
	        var pt = {};
	        pt.lastTickPhase=initPhase;
	    	pt.triggerList=[];

	        pt.tick=function(phase){
	        	if ((phase > pt.lastTickPhase) || ((pt.lastTickPhase-phase) > 0)) { // then were stricly going forward}
		        	for (i=0;i<pt.triggerList.length;i++){
		        		if ((pt.lastTickPhase <= pt.triggerList[i].phase) && pt.triggerList[i].phase < phase ) {
		        			pt.triggerList[i].cb(pt.triggerList[i].phase, pt.triggerList[i].id)
		        		}
		        		if (pt.lastTickPhase > phase) { // phase wrapped
		        			if ((pt.lastTickPhase <= pt.triggerList[i].phase) || pt.triggerList[i].phase < phase ) {
		        				pt.triggerList[i].cb(pt.triggerList[i].phase, pt.triggerList[i].id)
		        			}
		        		}
		        	}
		        } else { // were going backwards
	        		// todo
	        	}
	        	pt.lastTickPhase=phase;
	        }

	        pt.addEvent=function(phase, cb, id=null){
	        	i=0;
	        	while (i<pt.triggerList.length) {
	        		if (phase > pt.triggerList[i].phase){
	        			i+=1;
	    			}
	    		}
	    		pt.triggerList.splice(i, 0, {"phase": phase, "cb" : cb, "id" : id});
	    	}

	    	pt.resetlastphase=function(phase){
	    		pt.lastTickPhase=phase;
	    	}

	        return pt;
	    }
    }
);