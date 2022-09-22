<template>
  <div class="region">
	<h2><span class="regionname">{{inputData.name}}</span></h2>
	<svg :width="2*radius" :height="2*radius">
		<path v-for="process in processNames" :key="process" :d="pieChartPath[process]" :fill="color(process)"/>
	</svg>
  </div>
</template>

<script>
import * as d3 from 'd3';
  export default {
  	props: {
  	  processNames: Array,
  	  inputData: Object,
  	},
  	data() {
  	  return {
  	  	color: d3.scaleOrdinal(d3.schemeSet1).domain(this.processNames),
  	  	radius: 100,
  	  }
  	},
  	computed: {
      normalizeInputData() {
        let normalizedInputData = {};
        let tot = 0;
  	    for(const p of this.processNames){ tot += this.inputData[p]; }
  	    for(const p of this.processNames){ normalizedInputData[p] = this.inputData[p] / tot; }
  	    return normalizedInputData;
      },
      pieChartPath() {
        let pathstrings = {};
        let offset = 0;
        for(const p of this.processNames){
          let pathstring = this.describeArc(this.radius, this.radius, this.radius, offset, offset+360*this.normalizeInputData[p]);
          offset = offset + 360*this.normalizeInputData[p];
          pathstrings[p] = pathstring;
        }
      	return pathstrings;
      }
    },
    methods: {
      polarToCartesian(centerX, centerY, radius, angleInDegrees) {
	    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

	    return {
	      x: centerX + (radius * Math.cos(angleInRadians)),
	      y: centerY + (radius * Math.sin(angleInRadians))
	    };
	  },
      describeArc(x, y, radius, startAngle, endAngle){
	    var start = this.polarToCartesian(x, y, radius, endAngle);
	    var end = this.polarToCartesian(x, y, radius, startAngle);
	    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
	    var d = [
	    	"M", this.radius, this.radius,
	        "L", start.x, start.y, 
	        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
	    ].join(" ");
        return d;       
	  }
  	},
  }
</script>

<style>
  .region {
  	width: 300px;
  	display: flex;
  	flex-direction: column;
    text-align:center;
  }

  .regionname {
    display: block;
    width: 300px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
</style>