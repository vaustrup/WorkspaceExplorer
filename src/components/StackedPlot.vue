<template>
  <svg :height="350">
    <g transform="translate(50, 300)">
      <template v-for="bin in bins" :key="bin">
        <template v-for="(process, processindex) in processNames" :key="process">
          <rect :height="yScale(stackedData[processindex][bin][1])-yScale(stackedData[processindex][bin][0])"
            :x="xScale(bin)"
            :y="yScale(stackedData[processindex][bin][0])-yScale(stackedData[stackedData.length-1][bin][1])"
            :width="xScale.bandwidth()"
            :fill="color(process)"/>
        </template>
        <rect :height="yScale(uncertainty_up[bin])-yScale(uncertainty_down[bin])"
          :width="xScale.bandwidth()"
          :x="xScale(bin)"
          :y="yScale(stackedData[0][bin][0])-yScale(uncertainty_up[bin])"
          fill="black"
          :opacity="0.5" />
        <circle :cx="xScale(bin)+0.5*xScale.bandwidth()"
          :cy="Math.abs(yScale(observations.data[bin]))-200"
          :r="5" />
        <line :x1="xScale(bin)+0.5*xScale.bandwidth()"
          :y1="Math.abs(yScale(observations.data[bin]-observations.data[bin]**0.5))-200"
          :x2="xScale(bin)+0.5*xScale.bandwidth()"
          :y2="Math.abs(yScale(observations.data[bin]+observations.data[bin]**0.5))-200"
          stroke="black"/>
      </template>
      <path fill="none" stroke="#000" :d="pathStringX"></path>
      <path fill="none" stroke="#000" :d="pathStringY"></path>
      <text v-for="bin in bins" :key="bin" :x="25" :y="-xScale(bin)-0.5*xScale.bandwidth()" transform="rotate(90)" dominant-baseline="middle" text-anchor="middle">bin {{bin}}</text>
      <text v-for="tick in yScale.ticks(5)" :key="tick" :x="-10" :y="-200-yScale(tick)" dominant-baseline="middle" text-anchor="end">{{tick}}</text>
    </g>
  </svg>
</template>

<script>
import * as d3 from 'd3'
export default {
  props: {
    workspace: Object,
    observations: Object,
    systNames: Array,
    processNames: Array
  },
  data () {
    return {
      ticklength: 5
    }
  },
  computed: {
    color () {
      return d3.scaleOrdinal(d3.schemeSet1).domain(this.processNames)
    },
    stackedData () {
      const length = this.workspace.samples[0].data.length
      // create array of independent objects (NOT REFERENCES!)
      const stackedArray = Array.from({ length }, u => ({}))
      for (const sample of this.workspace.samples) {
        for (let bin = 0; bin < sample.data.length; bin++) {
          stackedArray[bin][sample.name] = sample.data[bin]
        }
      }
      for (const processName of this.processNames) {
        if (!Object.prototype.hasOwnProperty.call(stackedArray[0], processName)) {
          for (const bin of this.bins) {
            stackedArray[bin][processName] = 0
          }
        }
      }
      const data = d3.stack()
        .keys(this.processNames)(stackedArray)
      return data
    },
    // uncertainty band currently implemented as flat 20 percent error band
    uncertainty_up () {
      const length = this.workspace.samples[0].data.length
      const absUnc = Array.from({ length }, u => (0))
      for (const bin of this.bins) {
        absUnc[bin] = this.stackedData[this.processNames.length - 1][bin][1] * 1.2
      }
      return absUnc
    },
    uncertainty_down () {
      const length = this.workspace.samples[0].data.length
      const absUnc = Array.from({ length }, u => (0))
      for (const bin of this.bins) {
        absUnc[bin] = this.stackedData[this.processNames.length - 1][bin][1] * 0.8
      }
      return absUnc
    },
    maximumYields () {
      const data = this.stackedData
      const observed = this.observations.data
      const maximumData = d3.max(data[data.length - 1], d => d[1])
      const maximumObserved = d3.max(observed, d => d + d ** 0.5)
      return Math.max(maximumData, maximumObserved)
    },
    bins () {
      const length = this.workspace.samples[0].data.length
      const domain = Array.from({ length }, (e, i) => i)
      return domain
    },
    xScale () {
      return d3.scaleBand()
        .domain(this.bins)
        .range([0, 200])
        .padding(0)
    },
    yScale () {
      const scale = d3.scaleLinear()
        .domain([0, 1.2 * this.maximumYields])
        .range([-200, 0])
      return scale
    },
    pathStringX () {
      let string = 'M' + 0 + ',' + 0
      for (const i of this.bins) {
        string += 'H' + this.xScale(i)
        string += 'V' + (-this.ticklength)
        string += 'M' + this.xScale(i) + ',' + 0
        string += 'H' + this.xScale(i)
      }
      string += 'H200,0'
      string += 'V' + (-this.ticklength)
      return string
    },
    pathStringY () {
      let string = 'M' + 0 + ',' + 0
      const ticks = this.yScale.ticks(5)
      for (const tick of ticks) {
        string += 'V' + -(this.yScale(tick) + 200)
        string += 'H' + (-this.ticklength)
        string += 'M' + 0 + ',' + -(this.yScale(tick) + 200)
      }
      string += 'V' + '-225'
      return string
    }
  }
}
</script>
