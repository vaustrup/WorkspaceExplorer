<template>
  <div class="card-title">
    <p class="analysistitle">
      <span v-show="!showField()" class="workspace-title" data-text="Click to edit">
        <vue-mathjax :formula="workspaceTitle" @click="focusField"></vue-mathjax>
      </span>
      <span><input class="workspace-title" v-model="workspacetitle" v-show="showField()" type="text" @focus="focusField" @blur="blurField"></span>
    </p>
  </div>
  <div class="card-body">
    <div class="details">
      <div class="detail">
        <h2>Regions</h2>
        <ul class="list-group">
          <li class="list-group-item" v-for="channel in inputData" :key="channel.name">{{channel.name}}</li>
        </ul>
      </div>
      <div class="detail">
        <h2>Processes</h2>
        <ul class="list-group">
          <li class="list-group-item" v-for="processName in processNames" :key="processName">{{processName}}</li>
        </ul>
      </div>
      <div class="detail">
        <h2>Normalisation Factors</h2>
        <ul class="list-group">
          <li class="list-group-item" v-for="nf in normfactornames" :key="nf[0]">{{nf[0]}} (<span v-if="nf[1]">fixed</span><span v-else>floating</span>)</li>
        </ul>
      </div>
    </div>
    <div class="normalizedbarchart">
      <NormalizedBarChart :processNames="processNames" :inputData="inputData"/>
    </div>
    <span class="detailbutton" @click="toggleDetailedView()"><h2 v-if="!isDetailedView()">Show Details</h2><h2 v-if="isDetailedView()">Hide Details</h2></span>
    <Transition>
      <span v-if="isDetailedView()">
        <AnalysisDetails :processNames="processNames" :inputData="inputData" :workspace="workspace" :observations="observations"/>
      </span>
    </Transition>
  </div>
</template>

<script>
import AnalysisDetails from './AnalysisDetails.vue'
import NormalizedBarChart from './NormalizedBarChart.vue'
import VueMathjax from 'vue-mathjax-next'
export default {
  components: {
    NormalizedBarChart,
    AnalysisDetails,
    VueMathjax
  },
  props: {
    workspace: Object
  },
  data () {
    return {
      isActive: false,
      detailView: false,
      workspacetitle: this.workspace.name
    }
  },
  computed: {
    workspaceTitle () {
      return this.workspacetitle
    },
    processNames () {
      // sort processes by their total yield across all regions
      const items = Object.keys(this.processes).map((key) => { return [key, this.processes[key]] })
      items.sort((first, second) => { return second[1] - first[1] })
      const processNameList = items.map((e) => { return e[0] })
      return processNameList
    },
    inputData () { // list of all regions and the corresponding yields
      const ws = this.workspace.workspace
      const channels = []
      for (const c of ws.channels) {
        const channeldict = { 'name': c.name }
        for (const p of c.samples) {
          const yields = p.data.reduce((pv, cv) => pv + cv, 0)
          channeldict[p.name] = yields
        }
        channels.push(channeldict)
      }
      for (const c of channels) {
        for (const p in this.processes) {
          if (!(p in c)) {
            c[p] = 0
          }
        }
      }
      return channels
    },
    normfactornames () {
      const names = []
      const tempNames = []
      for (const channel of this.workspace.workspace.channels) {
        for (const sample of channel.samples) {
          for (const modifier of sample.modifiers) {
            if (modifier.type !== 'normfactor') { continue }
            if (tempNames.includes(modifier.name)) { continue }
            name = modifier.name
            let fixed = false
            for (const parameter of this.workspace.workspace.measurements[0].config.parameters) {
              if (parameter.name !== name) { continue }
              fixed = parameter.fixed
            }
            names.push([name, fixed])
            tempNames.push(name)
          }
        }
      }
      names.sort()
      return names
    },
    observations () {
      const ws = this.workspace.workspace
      const observed = []
      for (const c of ws.channels) {
        const datadict = { 'name': c.name }
        for (const d of ws.observations) {
          if (d.name !== c.name) { continue }
          datadict["observed"] = d.data.reduce((pv, cv) => pv + cv, 0)
        }
        observed.push(datadict)
      }
      return observed
    },
    // total yield per process across all regions
    processes () {
      const processDict = {};
      const ws = this.workspace.workspace
      for (const c of ws.channels) {
        for (const p of c.samples) {
          const yields = p.data.reduce((pv, cv) => pv + cv, 0)
          if (processDict.hasOwnProperty(p.name)) {
            processDict[p.name] += yields
          } else {
            processDict[p.name] = yields
          }
        }
      }
      return processDict
    }
  },
  methods: {
    focusField () {
      this.isActive = true
    },
    blurField () {
      this.isActive = false
    },
    showField () {
      return this.isActive
    },
    toggleDetailedView () {
      this.detailView = !this.detailView
    },
    isDetailedView () {
      return this.detailView
    }
  }
}
</script>

<style>
.workspace-title {
  font-weight: bold;
  font-size: 2rem;
}
.workspace-edit {
  color: rgb(137,186,23);
}

.details {
  display: flex;
  flex-direction: row;
}

.details > div {
  flex: 1;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.analysistitle {
  text-align: center;
}

.detailbutton {
  text-align: center;
}
.tooltip {
  position: relative;
}

.tooltip:before {
  content: attr(data-text); /* here's the magic */
  position:absolute;

  /* vertically center */
  top:50%;
  transform:translateY(-50%);

  /* move to right */
  left:100%;
  margin-left:15px; /* and add a small left margin */

  /* basic styles */
  width:200px;
  padding:10px;
  border-radius:10px;
  background: white;
  color: rgb(137,186,23);
  text-align:center;
  border:1px solid rgb(137,186,23);
  display:none; /* hide by default */
  font-size:0.5em;
}

.tooltip:hover:before {
  display:block;
}

.normalizedbarchart {
  text-align: center;
}

</style>
