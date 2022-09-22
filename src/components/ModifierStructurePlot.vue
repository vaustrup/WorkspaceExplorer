<template>
  <template v-for="channel in channels" :key="channel.name">
    <h2>{{channel.name}}</h2>
    <svg :height="length*modifiertypes[channel.name].length" :width="length*modifiernames.length">
      <template v-for="(process, processIndex) in modifiertypes[channel.name]" :key="process.name">
        <rect v-for="(modifiername, modifierIndex) in modifiernames" :key="modifiername" :height="length" :width="length" :x="modifierIndex*length" :y="processIndex*length" :fill="colors[process.types[modifiername]]"/>
      </template>
    </svg>
    <hr />
  </template>
</template>

<script>
export default {
  props: {
    channels: Array
  },
  data () {
    return {
      length: 20
    }
  },
  computed: {
    colors () {
      // use the same color scheme as cabinetry
      const modifierColor = {
        lumi: 'rgb(85,85,85)', // dark gray
        staterror: 'rgb(230,159,0)', // orange
        normsys: 'rgb(86,180,233)', // sky blue
        histosys: 'rgb(240,228,66)', // yellow
        none: 'rgb(255,255,255)', // white
        normhisto: 'rgb(0,158,115)', // blueish green
        shapesys: 'rgb(204,121,167)', // reddish purple
        normfactor: 'rgb(213,94,0)' // vermilion
      }
      return modifierColor
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
    }
  }
}
</script>
