<template>
  <h2>{{this.systname}}</h2>
  <svg :height="350">
    <g transform="translate(50, 300)">
      <template v-for="bin in bins">
        <line :x1="xScale(bin)" :x2="xScale(bin)+xScale.bandwidth()" :y1="Math.abs(yScale(totalYields[bin]))-200" :y2="Math.abs(yScale(totalYields[bin]))-200" stroke="black" />
        <line :x1="xScale(bin)" :x2="xScale(bin)+xScale.bandwidth()" :y1="Math.abs(yScale(totalSystYields[bin][0]))-200" :y2="Math.abs(yScale(totalSystYields[bin][0]))-200" stroke="red" />
        <line :x1="xScale(bin)" :x2="xScale(bin)+xScale.bandwidth()" :y1="Math.abs(yScale(totalSystYields[bin][1]))-200" :y2="Math.abs(yScale(totalSystYields[bin][1]))-200" stroke="blue" />
        <circle :cx="xScale(bin)+0.5*xScale.bandwidth()" :cy="Math.abs(yScale(observations.data[bin]))-200" :r="5" />
        <line :x1="xScale(bin)+0.5*xScale.bandwidth()" :y1="Math.abs(yScale(observations.data[bin]-observations.data[bin]**0.5))-200" :x2="xScale(bin)+0.5*xScale.bandwidth()" :y2="Math.abs(yScale(observations.data[bin]+observations.data[bin]**0.5))-200" stroke="black"/>
        <text :x="25" :y="-xScale(bin)-0.5*xScale.bandwidth()" transform="rotate(90)" dominant-baseline="middle" text-anchor="middle">bin {{bin}}</text>
      </template>
      <path fill="none" stroke="#000" :d="pathStringX"></path>
      <path fill="none" stroke="#000" :d="pathStringY"></path>
      <text v-for="tick in yScale.ticks(5)" :x="-10" :y="-200-yScale(tick)" dominant-baseline="middle" text-anchor="end">{{tick}}</text>
    </g>
  </svg>
</template>


<script>
import * as d3 from 'd3';
  export default {
  	props: {
      workspace: Object,
      observations: Object,
      systname: String,
  	},
    data() {
      return {
        ticklength: 5,
      }
    },
    computed: {
      totalYields() {
        const length = this.workspace.samples[0].data.length;
        let tot = Array.from({length:length}, u => (0));
        for (var bin = 0; bin < length; bin++) {
          for(const sample of this.workspace.samples) {
            tot[bin] += sample.data[bin];
          }
        }
        return tot;
      },
      totalSystYields() {
        const length = this.workspace.samples[0].data.length;
        let tot = Array.from({length:length}, u => ([0,0]));
        for(const sample of this.workspace.samples) {
          var result = sample.modifiers.find(obj=> {
              return obj.name === this.systname
          });
          if(typeof result === "undefined"){
            for (var bin = 0; bin < length; bin++){
              tot[bin][1] += sample.data[bin];
              tot[bin][0] += sample.data[bin];
            }
          }
          else{
            if(result.type==="normsys"){
              for (var bin = 0; bin < length; bin++){
                tot[bin][1] += result.data.hi * sample.data[bin];
                tot[bin][0] += result.data.lo * sample.data[bin];
              }
            }
            else {
              for (var bin = 0; bin < length; bin++){
                tot[bin][1] += result.data.hi_data[bin];
                tot[bin][0] += result.data.lo_data[bin];
              }
            }
          }
        }
        return tot;
      },
      maximumYields() {
        return Math.max(...this.totalYields);
      },
      bins() {
        const length = this.workspace.samples[0].data.length;
        const domain = Array.from({length: length}, (e, i)=> i);
        return domain;
      },
      xScale() {
        return d3.scaleBand()
                 .domain(this.bins)
                 .range([0,200])
                 .padding(0);
      },
      yScale() {
        const scale = d3.scaleLinear()
                .domain([0,1.2*this.maximumYields])
                .range([-200,0]);
        return scale;
      },
      pathStringX() {
        const ticklength = this.ticklength;
        let string = "M" + 0 + "," + 0;
        for (const i of this.bins) {
          string += "H"+this.xScale(i);
          string += "V"+(-ticklength);
          string += "M"+this.xScale(i)+","+0;
          string += "H"+this.xScale(i);
        }
        string += "H200,0";
        string += "V"+(-ticklength);
        return string;
      },
      pathStringY() {
        let string = "M" + 0 + "," + 0;
        const ticks = this.yScale.ticks(5);
        for (const tick of ticks) {
          string += "V" + -(this.yScale(tick)+200);
          string += "H" + (-this.ticklength);
          string += "M" + 0 + "," + -(this.yScale(tick)+200);
        }
        string    += "V" + "-225";
        return string;
      }
    },  
  }
</script>