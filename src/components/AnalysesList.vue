<script>
import AnalysisItem from './AnalysisItem.vue'
export default {
  components: {
    AnalysisItem
  },
  data() {
    return {
      workspaces: []
    }
  },
  methods: {  
    loadFiles: function() {
      for (const f of event.target.files) { 
        this.readFile(f);
      };
    },
    readFile: function(file) {
      const vm = this;
      const reader = new FileReader();
      reader.onload = function() {
        let workspace = {};
        try {
          workspace = JSON.parse(reader.result);
        }
        catch (e) {
          console.log(e);
          return;
        }
        vm.workspaces.push({name: file.name, workspace: workspace});
      }
      reader.readAsText(file);
    },
    deleteWorkspace: function(index) {
      this.workspaces.splice(index,1);
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
            Add New Workspaces
        </label>
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