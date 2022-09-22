<script>
import * as d3 from 'd3'
import VueMathjax from 'vue-mathjax-next'
export default {
  props: {
    inputData: Object,
    processNames: Array
  },
  components: {
    VueMathjax
  },
  data () {
    return {
      barHeight: 40,
      ticks: 6,
      ticklength: 5,
      xlabeloffset: 15,
      xtitleoffset: 40,
      highlightedProcess: '',
      processTitles: this.processNames
    }
  },
  computed: {
    channelNames () {
      const channelNameList = []
      for (const c of this.inputData) {
        channelNameList.push(c.name)
      }
      return channelNameList
    },
    color () {
      return d3.scaleOrdinal(d3.schemeSet1).domain(this.processNames)
    },
    normalizeInputData () {
      const normalizedInputData = this.inputData
      const processNames = this.processNames
      normalizedInputData.forEach(function (d) {
        let tot = 0
        for (const p of processNames) { tot += d[p] }
        for (const p of processNames) { d[p] = d[p] / tot * 100 }
      })
      return normalizedInputData
    },
    stackedData () {
      const stackedData = d3.stack()
        .keys(this.processNames)(this.normalizeInputData)
      return stackedData
    },
    xScale () {
      return d3.scaleLinear()
        .domain([0, 100])
        .range([0, 500])
    },
    yScale () {
      return d3.scaleBand()
        .domain(this.channelNames)
        .range([0, this.channelNames.length * this.barHeight])
        .padding(0.05)
    },
    pathStringX () {
      const ypos = this.yScale(this.channelNames[this.channelNames.length - 1]) + this.barHeight
      const ticklength = this.ticklength
      const ticks = this.ticks
      let string = 'M' + this.xScale(0) + ',' + (ypos + ticklength)
      string += 'V' + ypos
      for (let i = 1; i < ticks; i++) {
        string += 'H' + this.xScale(i * 20)
        string += 'V' + (ypos + ticklength)
        string += 'M' + this.xScale(i * 20) + ',' + ypos
      }
      return string
    },
    pathStringY () {
      const ticklength = this.ticklength
      let string = 'M' + this.xScale(0) + ',' + (this.yScale(this.channelNames[this.channelNames.length - 1]) + this.barHeight)
      for (let i = 0; i < this.channelNames.length; i++) {
        string += 'V' + (this.yScale(this.channelNames[this.channelNames.length - 1]) - (2 * i - 1) * 20)
        string += 'H' + (this.xScale(0) - ticklength)
        string += 'M' + this.xScale(0) + ',' + (this.yScale(this.channelNames[this.channelNames.length - 1]) - (2 * i - 1) * 20)
        string += 'V' + (this.yScale(this.channelNames[this.channelNames.length - 1]) - 2 * i * 20)
      }
      return string
    },
    processisHighlighted () {
      return (index) => {
        return (this.highlightedProcess === '' || this.highlightedProcess === this.processNames[index])
      }
    },
    processTitle () {
      return (index) => {
        return this.processTitles[index]
      }
    }
  },
  methods: {
    highlight (index) {
      this.highlightedProcess = this.processNames[index]
    },
    unhighlight () {
      this.highlightedProcess = ''
    }
  }
}
</script>

<template>
  <svg :width="1000" :height="channelNames.length*50+50">
    <g transform="translate(250, 10)">
      <template v-for="(process, processindex) in stackedData">
        <rect v-for="(channel, channelindex) in process" :key="channelNames[channelindex]" :height="yScale.bandwidth()" :x="xScale(channel[0])" :y="yScale(channelNames[channelindex])" :width="xScale(channel[1])-xScale(channel[0])" :fill="color(processNames[processindex])" :class="{ isnothighlighted: !processisHighlighted(processindex) }" @mouseover="highlight(processindex)" @mouseleave="unhighlight"/>
      </template>
      <path fill="none" stroke="#000"
            :d="pathStringX"></path>
      <text v-for="tick in parseInt(ticks)" :key="tick" :y="yScale(channelNames[channelNames.length-1])+barHeight+xlabeloffset" :x="xScale((tick-1)*20)" dominant-baseline="middle" text-anchor="middle">{{(tick-1)*20}}</text>
      <text :y="yScale(channelNames[channelNames.length-1])+barHeight+xtitleoffset" :x="xScale(50)" dominant-baseline="middle" text-anchor="middle">Relative Contributions in %</text>
      <path fill="none" stroke="#000"
            :d="pathStringY"></path>
      <text v-for="channel in channelNames" :key="channel" :x="-10" :y="yScale(channel)+barHeight/2" dominant-baseline="middle" text-anchor="end">{{channel}}</text>
      <template v-for="(process, processindex) in stackedData" :key="processNames[processindex]">
        <rect height="20" width="20" :fill="color(processNames[processindex])" x="550" :y="25*processindex" :id="processNames[processindex]" :class="{ isnothighlighted: !processisHighlighted(processindex) }" @mouseover="highlight(processindex)" @mouseleave="unhighlight"/>
        <text x="580" :y="15+25*processindex" :id="processNames[processindex]" :class="{ isnothighlighted: !processisHighlighted(processindex) }" @mouseover="highlight(processindex)" @mouseleave="unhighlight">{{processNames[processindex]}}</text>
      </template>
    </g>
  </svg>
</template>

<style>
rect.isnothighlighted{
  fill-opacity:0.5;
  transition: fill-opacity 0.5s ease;
}
text.isnothighlighted{
  fill: grey;
  transition: fill 0.5s ease;
}
</style>
