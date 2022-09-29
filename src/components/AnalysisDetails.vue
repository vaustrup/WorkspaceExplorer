<template>
  <h2 style="text-align:center">Regions</h2>
  <div class="regions">
    <template v-for="(channel, channelindex) in inputData" :key="channel.name">
      <div class="region">
        <PieChart :processNames="processNames" :inputData="channel" />
        <StackedPlot
          :processNames="processNames"
          :workspace="workspace.workspace.channels[channelindex]"
          :observations="workspace.workspace.observations[channelindex]"
          :systNames="systnames" />
      </div>
    </template>
  </div>
  <br>
  <div style="text-align:center;">
    <h2>Systematic Variations</h2>
  </div>
  <span class="detailbutton" @click="toggleModifierStructureView()">
    <h2 v-if="!modifierStructureView">Show Modifier Structure</h2>
    <h2 v-else>Hide Modifier Structure</h2>
  </span>
  <Transition>
    <span v-if="modifierStructureView">
      <ModifierStructurePlot :channels="workspace.workspace.channels" />
    </span>
  </Transition>
  <div style="text-align:center;">
    <input type="text" v-model="systFilter" placeholder="Filter Systematic Variations" />
    <input type="number" min=0 :max="parseInt(systnames.length/10)" v-model="systPage" placeholder="Switch systematics" />
  </div>
  <div class="regions">
    <template v-for="(channel, channelindex) in inputData" :key="channel.name">
      <div class="region">
        <template v-for="(systname, systindex) in systnames" :key="systname">
          <SystDataPlot
            v-if="parseInt(systindex/10)===systPage"
            :workspace="workspace.workspace.channels[channelindex]"
            :observations="workspace.workspace.observations[channelindex]"
            :systname="systname"/>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
import ModifierStructurePlot from './ModifierStructurePlot.vue'
import PieChart from './PieChart.vue'
import StackedPlot from './StackedPlot.vue'
import SystDataPlot from './SystDataPlot.vue'
export default {
  components: {
    PieChart,
    StackedPlot,
    SystDataPlot,
    ModifierStructurePlot
  },
  props: {
    processNames: Array,
    inputData: Object,
    observations: Array,
    workspace: Object
  },
  data () {
    return {
      systFilter: '',
      systPage: 0,
      channelNames: [],
      modifierStructureView: false
    }
  },
  computed: {
    systnames () {
      const names = []
      for (const channel of this.workspace.workspace.channels) {
        for (const sample of channel.samples) {
          for (const modifier of sample.modifiers) {
            if (modifier.type === 'lumi') { continue }
            if (modifier.type === 'staterror') { continue }
            if (modifier.type === 'normfactor') { continue }
            if (names.includes(modifier.name)) { continue }
            if (!modifier.name.includes(this.systFilter)) { continue }
            names.push(modifier.name)
          }
        }
      }
      names.sort()
      return names
    }
  },
  methods: {
    getChannelNames () {
      for (const c of this.inputData) {
        this.channelNames.push(c.name)
      }
    },
    toggleModifierStructureView () {
      this.modifierStructureView = !this.modifierStructureView
    }
  },
  beforeMount () {
    this.getChannelNames()
  }
}
</script>

<style>
  .regions {
    width: 100%;
    display: flex;
    flex-direction: row;
    overflow-x: scroll;
  }
  .region {
    display: flex;
    flex-direction: column;
    text-align:center;
    margin: 1em 5em;
  }
</style>
