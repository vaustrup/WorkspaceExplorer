<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar class="bg-blue-grey-8">
        <q-toolbar-title> WorkspaceExplorer </q-toolbar-title>

        <a href="https://github.com/vaustrup/WorkspaceExplorer">
          <q-img
            src="/icons/github-mark-white.svg"
            style="height: 2.5em; width: 2.5em"
          />
        </a>
      </q-toolbar>
    </q-header>

    <q-page-container class="bg-blue-grey-1">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts"></script>
