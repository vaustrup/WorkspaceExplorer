import { defineStore } from 'pinia';
import { useStoreIDStore } from 'src/stores/storeid';
import { useChannelStore } from 'src/stores/channel';
import {
  IAnalysis,
  IFitResults,
  ITaskResults,
  IWorkspace,
  IWorkspaceState,
  IChannel,
} from '../interfaces';
import { color_scheme } from '../utils/colors';
import { Notify } from 'quasar';

export const useWorkspaceStore = function (id: number) {
  return defineStore('workspace' + id, {
    state: () =>
      ({
        workspace: {} as IWorkspace,
        name: '' as string,
        process_title_index: {} as { [key: string]: string },
        process_color_index: {} as { [key: string]: string },
        download_urls: {} as { [key: string]: string },
        loading: true as boolean,
        fitresults: {} as IFitResults,
        fitted: false as boolean,
        fitting: false as boolean,
        result_id: '',
        channels: [] as IChannel[],
      } as IWorkspaceState),
    getters: {
      process_names(): string[] {
        // sort processes by yield across all channels
        // we first need to convert the Object {name: yield} into an Array of [name, yield]
        // afterwards we can sort and push the sorted list of names to the store
        const yields_per_process = this.total_yield_per_process;
        const items: [string, number][] = Object.keys(yields_per_process).map(
          (key) => {
            return [key, yields_per_process[key]];
          }
        );
        items.sort((first, second) => {
          return second[1] - first[1];
        });
        const process_names: string[] = items.map((e) => {
          return e[0];
        });
        return process_names;
      },
      process_titles(state): { [key: string]: string } {
        const process_titles: { [key: string]: string } = {};
        for (const process_name of this.process_names) {
          if (process_name in state.process_title_index) {
            process_titles[process_name] =
              state.process_title_index[process_name];
          } else {
            process_titles[process_name] = process_name;
          }
        }
        return process_titles;
      },
      total_yield_per_process(state): { [key: string]: number } {
        const process_yields: { [key: string]: number } = {};
        for (const c of state.channels) {
          for (const p of c.samples) {
            // set initial yields to zero if key does not exist yet
            process_yields[p.name] =
              (process_yields[p.name] || 0) + c.yield_of_process(p.name);
          }
        }
        return process_yields;
      },
      normfactors(state) {
        let normfactor_names = [];
        for (const channel of state.channels) {
          normfactor_names.push(...channel.normfactor_names);
        }
        normfactor_names = [...new Set(normfactor_names)];

        const factors = [];
        for (const normfactor_name of normfactor_names) {
          const parameter =
            state.workspace.measurements[0].config.parameters.find((p) => {
              return p.name === normfactor_name;
            });
          if (!parameter) {
            console.log(
              'Could not find normalisation factor with name ' + normfactor_name
            );
            continue;
          }
          const factor = {
            name: normfactor_name,
            fixed: parameter.fixed !== undefined && parameter.fixed,
          };
          factors.push(factor);
        }
        return factors;
      },
      colors(): { [key: string]: string } {
        const color_per_process: { [key: string]: string } = {};
        for (
          let process_index = 0;
          process_index < this.process_names.length;
          process_index++
        ) {
          const process_name = this.process_names[process_index];
          if (process_name in this.process_color_index) {
            color_per_process[process_name] =
              this.process_color_index[process_name];
          } else {
            color_per_process[process_name] =
              color_scheme[process_index % color_scheme.length];
          }
        }
        return color_per_process;
      },
      modifier_names(): string[] {
        const names = [] as string[];
        for (const channel of this.channels) {
          names.push(...channel.modifier_names);
        }
        return [...new Set(names)];
      },
      number_of_processes(): number {
        return this.process_names.length;
      },
    },
    actions: {
      load_workspace_from_local_file(file: File): void {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result === null) {
            return;
          }
          try {
            const workspace: IWorkspace = JSON.parse(reader.result.toString());
            this.workspace = workspace;
            this.name = file.name;
          } catch (e) {
            console.log(e);
            Notify.create({
              message:
                'Error when parsing workspace. Is this an actual JSON file?',
              color: 'negative',
              icon: 'report_problem',
              position: 'top',
            });
            return;
          }
        };
        reader.readAsText(file);
        this.loading = false;
        this.create_channel_stores(this.workspace);
      },
      async load_workspace_from_url(url: string, name?: string): Promise<void> {
        const response = await (await fetch(url)).json();
        this.workspace = response;
        if (name === undefined) {
          this.name = url;
        } else {
          this.name = name;
        }
        this.loading = false;
        this.create_channel_stores(this.workspace);
      },
      async load_workspace_from_HEPdata(analysis: IAnalysis): Promise<void> {
        const response = await (
          await fetch(
            analysis.url.replace('landing_page=true', 'format=json&light=true')
          )
        ).json();
        const workspace = JSON.parse(response.file_contents);
        this.workspace = workspace;
        this.name = analysis.name;
        this.loading = false;
        this.create_channel_stores(this.workspace);
      },
      create_channel_stores(workspace: IWorkspace): void {
        let channel_index = 0;
        for (const channel of workspace.channels) {
          const channel_store = useChannelStore(id, channel.name)();
          channel_store.name = channel.name;
          channel_store.samples = channel.samples;
          channel_store.observations =
            workspace.observations[channel_index].data;
          this.channels.push(channel_store);
          channel_index += 1;
        }
      },
      delete_workspace(): void {
        const storeid = useStoreIDStore();
        storeid.remove_store_with_id(id);
        this.workspace = {} as IWorkspace;
        this.name = '';
        this.loading = true;
        this.fitted = false;
        this.fitting = false;
        this.result_id = '';
        this.fitresults = {} as IFitResults;
        this.process_title_index = {} as { [key: string]: string };
        this.process_color_index = {} as { [key: string]: string };
        this.download_urls = {} as { [key: string]: string };
        for (const channel of this.channels) {
          channel.cleanup();
        }
        this.channels = [];
      },
      async get_fit_results(): Promise<void> {
        this.fitting = true;
        const url =
          'https://workspaceexplorerbackend-workspaceexplorerbackend.app.cern.ch/api/v1/workspace';
        const postRequestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace: this.workspace }),
        };
        await fetch(url, postRequestOptions)
          .then((response) => response.json())
          .then((data) => {
            this.result_id = data.result_id;
          });
        const getRequestOptions = {
          method: 'GET',
        };
        await (async () => {
          const poll = () => {
            setTimeout(async () => {
              let response_data = {} as ITaskResults;
              await fetch(url + '/' + this.result_id, getRequestOptions)
                .then((response) => response.json())
                .then((data) => (response_data = data));
              if (response_data.ready) {
                this.fitresults = response_data.value;
                this.fitted = true;
                this.fitting = false;
              } else {
                return poll();
              }
            }, 10000);
          };
          return poll();
        })();
      },
      set_svg_url(svg_id: string): void {
        const svg = document.getElementById('svg_' + svg_id);
        if (svg === null) {
          this.download_urls[svg_id] = '';
          return;
        }
        const xml = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([xml], { type: 'image/svg+xml' });
        const url = window.URL.createObjectURL(blob);
        this.download_urls[svg_id] = url;
      },
      update_all_svg_urls(): void {
        for (const svg_id in this.download_urls) {
          this.set_svg_url(svg_id);
        }
      },
    },
  });
};
