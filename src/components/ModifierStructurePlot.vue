<template>
  <div class="modifierstructure">
    <input type="checkbox" v-model="interactive" id="interactive" />
    <label for="interactive">Interactive modifier structure (may result in performance issues)</label>
    <svg :height="length+20" :width="horizontalOffset+Object.keys(colors).length*175">
      <g :transform="`translate(${horizontalOffset}, 0)`">
        <template v-for="(color, type, colorindex) in colors" :key="color">
          <rect :height="length" :width="length" :fill="color" stroke="black" :y="0" :x="colorindex*175"/>
          <text :y="0" :x="25+colorindex*175" dominant-baseline="hanging" text-anchor="begin">{{modifierStrings[type]}}</text>
        </template>
      </g>
    </svg>
    <template v-for="(channel, channelIndex) in channels" :key="channel.name">
      <h2>{{channel.name}}</h2>
      <svg :height="length*modifiertypes[channel.name].length" :width="horizontalOffset+length*modifiernames.length+50">
        <g :transform="`translate(${horizontalOffset}, 0)`">
          <template v-if="interactive">
            <template v-if="highlightedProcess!==-1">
              <rect v-if="highlightedChannel===channelIndex" :height="length" :width="length" :x="highlightedModifier*length" :y="highlightedProcess*length" stroke="red" :fill="colors[modifiertypes[channel.name][highlightedProcess].types[modifiernames[highlightedModifier]]]"/>
              <template v-for="(process, processIndex) in modifiertypes[channel.name]" :key="process.name">
                <rect :height="length" :width="length" :x="highlightedModifier*length" :y="processIndex*length" class="passive" />
              </template>
              <template v-for="(modifiername, modifierIndex) in modifiernames" :key="modifiername">
                <rect :height="length" :width="length" :y="highlightedProcess*length" :x="modifierIndex*length" class="passive" />
              </template>
            </template>
          </template>
          <template v-for="(process, processIndex) in modifiertypes[channel.name]" :key="process.name">
            <template v-for="(modifiername, modifierIndex) in modifiernames" :key="modifiername">
              <rect :fill-opacity="fillOpacity" :height="length" :width="length" :x="modifierIndex*length" :y="processIndex*length" :fill="colors[process.types[modifiername]]" @mouseover="highlight(processIndex, channelIndex, modifierIndex)" @mouseleave="unhighlight"/>
            </template>
          </template>
          <path fill="none" stroke="#000" :d="pathStringX[channelIndex]"></path>
          <path fill="none" stroke="#000" :d="pathStringY[channelIndex]"></path>
        </g>
        <text v-for="(process, processIndex) in modifiertypes[channel.name]" :key="process.name" :class="{ isnothighlighted: !processisHighlighted(processIndex, channelIndex) }" :x="0" :y="processIndex*length+0.8*length">{{process.name}}</text>
      </svg>
    </template>
    <svg height="300" :width="horizontalOffset+length*modifiernames.length+50">
      <g :transform="`translate(${horizontalOffset}, 0)`">
        <text v-for="(modifiername, modifierIndex) in modifiernames" :key="modifiername" :class="{ isnothighlighted: !modifierisHighlighted(modifierIndex) }" :x="0" :y="modifierIndex*length+0.5*length" transform="rotate(-90)" dominant-baseline="middle" text-anchor="end">{{modifiername}}</text>
    </g>
    </svg>
  </div>
</template>

<script>
export default {
  props: {
    channels: Array
  },
  data () {
    return {
      length: 20,
      ticklength: 5,
      horizontalOffset: 200,
      highlightedProcess: -1,
      highlightedChannel: -1,
      highlightedModifier: -1,
      interactive: false
    }
  },
  computed: {
    fillOpacity () {
      if (!this.interactive) { return 1.0 }
      if (this.highlightedChannel !== -1) { return 0.5 }
      return 1.0
    },
    colors () {
      // use the same color scheme as cabinetry
      const modifierColor = {
        lumi: 'rgb(85,85,85)', // dark gray
        staterror: 'rgb(230,159,0)', // orange
        normsys: 'rgb(86,180,233)', // sky blue
        histosys: 'rgb(240,228,66)', // yellow
        shapesys: 'rgb(204,121,167)', // reddish purple
        normhisto: 'rgb(0,158,115)', // blueish green
        normfactor: 'rgb(213,94,0)', // vermilion
        none: 'rgb(255,255,255)' // white
      }
      return modifierColor
    },
    modifierStrings () {
      return {
        lumi: 'lumi',
        staterror: 'staterror',
        normsys: 'normsys',
        histosys: 'histosys',
        shapesys: 'shapesys',
        normhisto: 'histosys+normsys',
        normfactor: 'normfactor',
        none: 'none'
      }
    },
    pathStringX () {
      const strings = Array.from({ length: this.channels.length }, u => (''))
      let channelIndex = 0
      for (const channel of this.channels) {
        const yCoordinate = this.length * channel.samples.length
        let string = 'M' + 0 + ',' + yCoordinate
        for (let i = 1; i <= this.modifiernames.length; i++) {
          string += 'H' + i * this.length
          string += 'V' + (yCoordinate - this.ticklength)
          string += 'M' + i * this.length + ',' + yCoordinate
        }
        strings[channelIndex] = string
        channelIndex++
      }
      return strings
    },
    pathStringY () {
      const strings = Array.from({ length: this.channels.length }, u => (''))
      let channelIndex = 0
      for (const channel of this.channels) {
        let string = 'M' + 0 + ',' + 0
        for (let i = 1; i <= channel.samples.length; i++) {
          string += 'V' + (this.length * i)
          string += 'H' + (this.ticklength)
          string += 'M' + 0 + ',' + (this.length * i)
        }
        strings[channelIndex] = string
        channelIndex++
      }
      return strings
    },
    modifiernames () {
      const names = []
      for (const channel of this.channels) {
        for (const sample of channel.samples) {
          for (const modifier of sample.modifiers) {
            if (names.includes(modifier.name)) { continue }
            names.push(modifier.name)
          }
        }
      }
      names.sort()
      return names
    },
    modifiertypes () {
      // for each region, we need a list of samples of the form [ {name=samplename, types={modifiername=modifiertype}}]
      // modifiertype is to be set to none if the modifier is not available for a specific process
      // an additional check is necessary for modifiers of type histo+normsys
      const regions = {}
      for (const channel of this.channels) {
        const samples = Array.from({ length: channel.samples.length }, u => ({}))
        let sampleindex = 0
        for (const sample of channel.samples) {
          const sampleObject = {}
          sampleObject.name = sample.name
          const types = {}
          // first, set all modifier types to 'none'
          for (const modifiername of this.modifiernames) {
            types[modifiername] = 'none'
          }
          // then, change those that do exist for a specific sample
          for (const modifier of sample.modifiers) {
            // need to be careful with modifiers that are both histosys and normsys
            if (types[modifier.name] === 'histosys' && modifier.type === 'normsys') {
              types[modifier.name] = 'normhisto'
              continue
            }
            if (types[modifier.name] === 'normsys' && modifier.type === 'histosys') {
              types[modifier.name] = 'normhisto'
              continue
            }
            // else everything can proceed as usual
            types[modifier.name] = modifier.type
          }
          sampleObject.types = types
          samples[sampleindex] = sampleObject
          sampleindex++
        }
        regions[channel.name] = samples
      }
      return regions
    },
    processisHighlighted () {
      return (processindex, channelindex) => {
        if (!this.interactive) { return true }
        return (
          this.highlightedChannel === -1 ||
          (this.highlightedProcess === processindex && this.highlightedChannel === channelindex))
      }
    },
    modifierisHighlighted () {
      return (modifierindex) => {
        if (!this.interactive) { return true }
        return (this.highlightedModifier === -1 || this.highlightedModifier === modifierindex)
      }
    }
  },
  methods: {
    highlight (processIndex, channelIndex, modifierIndex) {
      this.highlightedProcess = processIndex
      this.highlightedChannel = channelIndex
      this.highlightedModifier = modifierIndex
    },
    unhighlight () {
      this.highlightedProcess = -1
      this.highlightedChannel = -1
      this.highlightedModifier = -1
    }
  }
}
</script>

<style>
  rect{
    stroke-width: 2;
  }
  rect.passive{
    stroke: red;
    fill-opacity:0.0;
    stroke-opacity: 0.3;
    stroke-width: 1;
  }
  text.isnothighlighted{
    fill: grey;
  }
  .modifierstructure{
    overflow-x: scroll;
  }
</style>
