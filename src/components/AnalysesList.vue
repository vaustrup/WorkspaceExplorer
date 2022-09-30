<script>
import AnalysisItem from './AnalysisItem.vue'
export default {
  components: {
    AnalysisItem
  },
  data () {
    return {
      workspaces: [],
      hepdataid: ''
    }
  },
  methods: {
    loadFiles: function () {
      for (const f of event.target.files) {
        this.readFile(f)
      };
    },
    readFile: function (file) {
      const vm = this
      const reader = new FileReader()
      reader.onload = function () {
        let workspace = {}
        try {
          workspace = JSON.parse(reader.result)
        } catch (e) {
          console.log(e)
          return
        }
        vm.workspaces.push({ name: file.name, workspace })
      }
      reader.readAsText(file)
    },
    readFileFromHEPData: async function () {
      if (this.hepdataid === '') { return }
      const hepdataurl = 'https://www.hepdata.net/record/ins' + this.hepdataid + '?format=json'
      const hepdataentry = await (await fetch(hepdataurl)).json()
      console.log(hepdataentry)
      const analyses = hepdataentry.record.analyses.filter(analysis => analysis.type === 'HistFactory')
      let hepdataIndex = 1
      for (const analysis of analyses) {
        const response = await (await fetch(analysis.analysis.replace('landing_page=true', 'format=json'))).json()
        const workspace = JSON.parse(response.file_contents)
        console.log(workspace)
        this.workspaces.push({ name: 'HEPdata ID: ' + this.hepdataid + ', workspace: ' + hepdataIndex, workspace })
        hepdataIndex++
      }
    },
    deleteWorkspace: function (index) {
      this.workspaces.splice(index, 1)
    }
  }
}
</script>

<template>
  <div class="card">
    <div class="card-body overview">
      <div class="card-text">
        <span v-if="workspaces.length!==0">Currently exploring {{this.workspaces.length}} workspace<span v-if="workspaces.length!==1">s</span>:</span>
        <span v-if="workspaces.length===0">No workspaces loaded yet. Add some to start exploring!</span>
      </div>
      <ul class="list-group">
        <li class="list-group-item" v-for="(workspace, workspaceindex) in workspaces" :key="workspace.name">{{workspace.name}} <span class="deletebutton" @click="deleteWorkspace(workspaceindex)">&#x1f5d1;</span></li>
      </ul>
      <div class="addbutton">
        <label class="btn btn-outline-primary btn-lg">
            <input type="file" @change="loadFiles" multiple/>
            Add From Local Input
        </label>
      </div>
      <span>or</span>
      <div class="input-group mb-3">
        <input type="text" class="form-control" v-model="hepdataid" placeholder="HEPdata ID" aria-label="HEPdata ID" aria-describedby="button-addon2">
        <div class="addbutton">
          <button class="btn btn-outline-primary btn-lg" type="button" id="button-addon2" @click="readFileFromHEPData">Add From HEPdata</button>
        </div>
      </div>
    </div>
  </div>
  <div class="card">
    <template v-for="workspace in this.workspaces" :key="workspace.name">
      <hr style="color:rgb(137,186,23)">
      <AnalysisItem :workspace="workspace" />
    </template>
  </div>
</template>

<style>
  /* https://stackoverflow.com/questions/572768/styling-an-input-type-file-button */
  input[type="file"] {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap; /* 1 */
    clip-path: inset(50%);
    border: 0;
  }

  .overview {
    text-align: center;
  }

  .deletebutton {
    font-size:2em;
  }

  .addbutton {
    padding:1em;
  }
  /* When the visually hidden child input has focus, style the parent.
  label:focus-within {
      outline: 5px solid;
  } */

</style>
