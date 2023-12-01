![WorkspaceExplorer Logo](public/logo_text_white_on_gray.png)
Logo created by Johanna Kraus

[![Netlify Status](https://api.netlify.com/api/v1/badges/9f218a2a-d9b9-44ee-b5dc-49a18cc059a1/deploy-status)](https://app.netlify.com/sites/workspaceexplorer/deploys)

WorkspaceExplorer is a browser-based tool to quickly gather insight of the contents of statistical workspaces in JSON format as used in pyhf.
It gives an overview of the samples and the channels involved, as well as the normalisation parameters for the likelihood fit.
Contents of the different channels are shown as stacked plots.
In addition, the modifier structure for the various channels and processes is visualised.

The latest version is deployed on CERN under [https://workspaceexplorer.app.cern.ch](https://workspaceexplorer.app.cern.ch) and can also be accessed on Netlify via the following link: [https://workspaceexplorer.netlify.app/](https://workspaceexplorer.netlify.app/).

You can, however, also run the tool locally. Simply clone this repository and inside the directory first install the necessary dependencies with

```sh
npm install
```

and then compile and run in development mode with

```sh
quasar dev
```
