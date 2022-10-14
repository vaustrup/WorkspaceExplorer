<template>
  <div class="region">
    <h2><span class="regionname">{{inputData.name}}</span></h2>
    <svg :width="2*radius" :height="2*radius">
      <path v-for="process in processNames" :key="process" :d="pieChartPath[process]" :fill="color(process)"/>
    </svg>
  </div>
</template>

<script>
import * as plotting from '../utils/plotting'
export default {
  props: {
    processNames: Array,
    inputData: Object
  },
  data () {
    return {
      color: plotting.colorSchemeOrdinal(this.processNames),
      radius: 100
    }
  },
  computed: {
    normalizeInputData () {
      const normalizedInputData = {}
      let tot = 0
      for (const p of this.processNames) { tot += this.inputData[p] }
      for (const p of this.processNames) { normalizedInputData[p] = this.inputData[p] / tot }
      return normalizedInputData
    },
    pieChartPath () {
      const pathstrings = {}
      let offset = 0
      for (const p of this.processNames) {
        const pathstring = this.describeArc(this.radius, this.radius, this.radius, offset, offset + 360 * this.normalizeInputData[p])
        offset = offset + 360 * this.normalizeInputData[p]
        pathstrings[p] = pathstring
      }
      return pathstrings
    }
  },
  methods: {
    polarToCartesian (centerX, centerY, radius, angleInDegrees) {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0

      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      }
    },
    describeArc (x, y, radius, startAngle, endAngle) {
      const start = this.polarToCartesian(x, y, radius, endAngle)
      const end = this.polarToCartesian(x, y, radius, startAngle)
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
      const d = [
        'M', this.radius, this.radius,
        'L', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
      ].join(' ')
      return d
    }
  }
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
