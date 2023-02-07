# WorkspaceExplorer

[![Netlify Status](https://api.netlify.com/api/v1/badges/9f218a2a-d9b9-44ee-b5dc-49a18cc059a1/deploy-status)](https://app.netlify.com/sites/workspaceexplorer/deploys)

WorkspaceExplorer is a browser-based tool to quickly gather insight of the contents of statistical workspaces in JSON format as used in pyhf.
It gives an overview of the samples and the channels involved, as well as the normalisation parameters for the likelihood fit.
Contents of the different channels are shown as stacked plots.
In addition, systematic variations are visualised in the form of systematic-data control plots, which show the impact of up and down variations on the total expected yields compared to data.

The latest version is deployed via Netlify and can be accessed via the following link: [https://workspaceexplorer.netlify.app/](https://workspaceexplorer.netlify.app/).

You can, however, also run the tool locally. Simply clone this repository and inside the directory first install the necessary dependencies with

```sh
npm install
```

and then compile and run in development mode with

```sh
quasar dev
```
