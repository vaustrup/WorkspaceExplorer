import { defineStore } from 'pinia';
import { useStoreIDStore } from 'src/stores/storeid';
//import { useChannelStore } from 'src/stores/channel';
import type {
  IAnalysis,
  IStackedChannel,
  IStackedChannelBinwise,
  IStackedProcess,
  IUncertaintyPerSystematic,
  IUncertaintySummary,
  IFitResults,
  ITaskResults,
  IWorkspace,
  INormFactor,
} from '../interfaces';
import { color_scheme } from '../utils/colors';
import { Notify } from 'quasar';

function get_normfactor(
  normfactors: { [key: string]: INormFactor },
  process_name: string,
  postfit: boolean,
  fitresults: IFitResults | undefined
): number {
  let factor = 1.0;
  for (const key in normfactors) {
    const normfactor = normfactors[key];
    if (!normfactor.processes.includes(process_name)) continue;
    if (!postfit) {
      factor = factor * normfactor.value;
    } else {
      const np_index: number = fitresults ? fitresults.labels.indexOf(key) : -1;
      factor = factor * (fitresults ? fitresults.bestfit[np_index] : 1);
    }
  }
  return factor;
}

function get_pulleffects(
  modifier_types: { [key: string]: string },
  fitresults: IFitResults
): number {
  let factor = 1.0;
  for (const modifier_name in fitresults.labels) {
    const modifier_type = modifier_types[modifier_name];
    if (modifier_type === 'undefined') continue;
    if (modifier_type === 'lumi') continue;
    if (modifier_type === 'staterror') continue;

    if (modifier_type !== 'normsys') continue;
    factor = factor * 1.0;
  }
  return factor;
}

export const useWorkspaceStore = function (id: number) {
  return defineStore('workspace' + id, {
    state: () => ({
      workspace: {} as IWorkspace,
      name: '' as string,
      process_title_index: {} as { [key: string]: string },
      channel_title_index: {} as { [key: string]: string },
      process_color_index: {} as { [key: string]: string },
      download_urls: {} as { [key: string]: string },
      loading: true as boolean,
      nps: {} as IFitResults,
      fitresults: {} as IFitResults,
      fitted: false as boolean,
      fitting: false as boolean,
      result_id: '',
    }),
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
          process_titles[process_name] =
            process_name in state.process_title_index
              ? state.process_title_index[process_name]
              : process_name;
        }
        return process_titles;
      },
      total_yield_per_process(state): { [key: string]: number } {
        const process_yields: { [key: string]: number } = {};
        for (const c of state.workspace.channels) {
          for (const p of c.samples) {
            const yields = p.data.reduce(
              (pv: number, cv: number) => pv + cv,
              0
            );
            // set initial yields to zero if key does not exist yet
            process_yields[p.name] =
              (process_yields[p.name] || 0) +
              yields *
                get_normfactor(this.normfactors, p.name, false, undefined);
          }
        }
        return process_yields;
      },
      channel_names(state): string[] {
        // return list of channel names
        return state.workspace.channels.map((a) => a.name);
      },
      channel_titles(state): { [key: string]: string } {
        const channel_titles: { [key: string]: string } = {};
        for (const channel_name of this.channel_names) {
          channel_titles[channel_name] =
            channel_name in state.channel_title_index
              ? state.channel_title_index[channel_name]
              : channel_name;
        }
        return channel_titles;
      },
      yield_of_process_in_channel(state) {
        const normfactors = this.normfactors;
        // returns the overall yield of a given process in a given channel
        return function (channel_name: string, process_name: string): number {
          for (const c of state.workspace.channels) {
            if (c.name !== channel_name) {
              continue;
            }
            let yields = 0;
            for (const p of c.samples) {
              if (p.name !== process_name) {
                continue;
              }
              yields = p.data.reduce((pv, cv) => pv + cv, 0);
            }
            return (
              yields *
              get_normfactor(normfactors, process_name, false, undefined)
            );
          }
          return 0;
        };
      },
      normfactors(state) {
        const factors = {} as { [key: string]: INormFactor };
        for (const channel of state.workspace.channels) {
          for (const sample of channel.samples) {
            for (const modifier of sample.modifiers) {
              if (modifier.type !== 'normfactor') {
                continue;
              }
              if (modifier.name in factors) {
                if (!factors[modifier.name].processes.includes(sample.name)) {
                  factors[modifier.name].processes.push(sample.name);
                }
                continue;
              }
              const parameter =
                state.workspace.measurements[0].config.parameters.find(
                  (obj) => {
                    return obj.name === modifier.name;
                  }
                );
              if (!parameter) {
                console.log(
                  'Could not find parameter with name ' + modifier.name
                );
                continue;
              }
              factors[modifier.name] = {
                name: modifier.name,
                fixed: parameter.fixed !== undefined && parameter.fixed,
                value: parameter.inits ? parameter.inits[0] : 1.0,
                processes: [sample.name],
              };
            }
          }
        }
        return factors;
      },
      stacked_data(state): IStackedChannel[] {
        // returns a stack of overall absolute yields of the different processes in the different channels
        const data = [] as IStackedChannel[];
        for (const c of state.workspace.channels) {
          const channel = {} as IStackedChannel;
          channel.name = c.name;
          const processes = [] as IStackedProcess[];
          let previous_high = 0;
          for (const process_name of this.process_names) {
            const process = {} as IStackedProcess;
            process.name = process_name;
            const yields = this.yield_of_process_in_channel(
              c.name,
              process_name
            );
            process.low = previous_high;
            process.high = previous_high + yields;
            processes.push(process);
            previous_high = process.high;
          }
          channel.processes = processes;
          data.push(channel);
        }
        return data;
      },
      normalized_stacked_data(): IStackedChannel[] {
        // returns a stack of overall relative yields of the different processes in the different channels
        const normalized = this.stacked_data;
        normalized.forEach(function (d) {
          let total_yield_per_channel = 0;
          for (const p of d.processes) {
            total_yield_per_channel += p.high - p.low;
          }
          for (const p of d.processes) {
            p.high = (p.high / total_yield_per_channel) * 100;
            p.low = (p.low / total_yield_per_channel) * 100;
          }
        });
        return normalized;
      },
      stacked_data_per_bin(state): IStackedChannelBinwise[] {
        const data = [] as IStackedChannelBinwise[];
        let channel_index = 0;
        for (const c of state.workspace.channels) {
          const channel = {} as IStackedChannelBinwise;
          channel.name = c.name;
          channel.data = state.workspace.observations[channel_index].data;
          channel.content = [];
          const bin_number = c.samples[0].data.length;
          for (let i_bin = 0; i_bin < bin_number; i_bin++) {
            const processes = [] as IStackedProcess[];
            let previous_high = 0;
            for (const process_name of this.process_names) {
              const process = {} as IStackedProcess;
              process.name = process_name;
              process.low = previous_high;
              // find process_index from name in channel.samples
              const process_index = c.samples
                .map(function (e) {
                  return e.name;
                })
                .indexOf(process_name);
              // in case a process is not available in a given channel, set yields to zero
              if (process_index === -1) {
                process.high = previous_high;
              } else {
                process.high =
                  previous_high +
                  c.samples[process_index].data[i_bin] *
                    get_normfactor(
                      this.normfactors,
                      process.name,
                      false,
                      undefined
                    );
              }
              processes.push(process);
              previous_high = process.high;
            }
            channel.content.push(processes);
          }
          data.push(channel);
          channel_index++;
        }
        return data;
      },
      stacked_data_per_bin_postfit(state): IStackedChannelBinwise[] {
        const data_prefit = this.stacked_data_per_bin;
        if (!state.fitted) return data_prefit;

        const data_postfit = [] as IStackedChannelBinwise[];
        for (const channel_prefit of data_prefit) {
          const channel = {} as IStackedChannelBinwise;
          channel.name = channel_prefit.name;
          channel.data = channel_prefit.data;
          channel.content = [];
          for (const bin of channel_prefit.content) {
            const processes = [];
            let previous_high = 0;
            for (const process of bin) {
              const process_postfit = {} as IStackedProcess;
              process_postfit.name = process.name;
              const prefit_yields = process.high - process.low;
              const norm_factor = get_normfactor(
                this.normfactors,
                process.name,
                true,
                state.nps
              );
              const pulls = get_pulleffects(
                this.modifier_types[channel.name][process.name],
                state.nps
              );
              process_postfit.low = previous_high;
              process_postfit.high =
                Math.max(0, prefit_yields * norm_factor * pulls) +
                previous_high;
              previous_high = process_postfit.high;
              processes.push(process_postfit);
            }
            channel.content.push(processes);
          }
          data_postfit.push(channel);
        }
        return data_postfit;
      },
      colors(): { [key: string]: string } {
        const color_per_process: { [key: string]: string } = {};
        for (
          let process_index = 0;
          process_index < this.process_names.length;
          process_index++
        ) {
          const process_name = this.process_names[process_index];
          color_per_process[process_name] =
            process_name in this.process_color_index
              ? this.process_color_index[process_name]
              : color_scheme[process_index % color_scheme.length];
        }
        return color_per_process;
      },
      modifier_names(state): string[] {
        const names = [] as string[];
        for (const channel of state.workspace.channels) {
          for (const sample of channel.samples) {
            for (const modifier of sample.modifiers) {
              if (names.includes(modifier.name)) {
                continue;
              }
              names.push(modifier.name);
            }
          }
        }
        return names;
      },
      modifier_types(state): {
        [key: string]: { [key: string]: { [key: string]: string } };
      } {
        // what we want
        // { channel_name1: {
        //      sample_name1: {
        //          modifier_name1: "normsys",
        //          modifier_name2: "histosys",
        //      }
        //      sample_name2: {...}
        //   },
        //   channel_name2: {...}
        // }
        const types: {
          [key: string]: { [key: string]: { [key: string]: string } };
        } = {};
        for (const channel of state.workspace.channels) {
          // set all types to none by default to capture cases
          // where not all samples have all modifiers
          const types_per_channel: {
            [key: string]: { [key: string]: string };
          } = {};
          for (const sample of channel.samples) {
            const types_per_sample: { [key: string]: string } = {};
            for (const modifier_name of this.modifier_names) {
              types_per_sample[modifier_name] = 'none';
            }

            for (const modifier of sample.modifiers) {
              // we need to be careful with modifiers that are both normsys and histosys
              if (
                types_per_sample[modifier.name] === 'histosys' &&
                modifier.type === 'normsys'
              ) {
                types_per_sample[modifier.name] = 'normhisto';
                continue;
              }
              if (
                types_per_sample[modifier.name] === 'normsys' &&
                modifier.type === 'histosys'
              ) {
                types_per_sample[modifier.name] = 'normhisto';
                continue;
              }
              // else proceed as usual
              types_per_sample[modifier.name] = modifier.type;
            }
            types_per_channel[sample.name] = types_per_sample;
          }
          types[channel.name] = types_per_channel;
        }
        return types;
      },
      number_of_processes(): number {
        return this.normalized_stacked_data[0].processes.length;
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
        this.nps = {} as IFitResults;
        this.process_title_index = {} as { [key: string]: string };
        this.channel_title_index = {} as { [key: string]: string };
        this.process_color_index = {} as { [key: string]: string };
        this.download_urls = {} as { [key: string]: string };
      },
      async get_fit_results(): Promise<void> {
        if (this.fitted) {
          this.nps.bestfit = [...this.fitresults.bestfit];
          return;
        }
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
                this.nps.bestfit = [...this.fitresults.bestfit];
                this.nps.uncertainty = [...this.fitresults.uncertainty];
                this.nps.labels = [...this.fitresults.labels];
                this.nps.correlations = [...this.fitresults.correlations];
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
