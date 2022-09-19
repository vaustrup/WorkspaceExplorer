<script setup>
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import AnalysesList from './components/AnalysesList.vue'
</script>

<template>
  <header>
    <div>
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      	<a class="navbar-brand" href="#" style="padding-left:1em">WorkSpaceX</a>
      </nav>
    </div>
  </header>

  <main>
  	<div style="padding-top:5em">
    	<AnalysesList />
   	</div> 
  </main>
</template>

<style scoped>

</style>
