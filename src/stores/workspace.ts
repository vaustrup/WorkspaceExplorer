import { defineStore } from 'pinia';
import { useStoreIDStore } from './storeid';
import type {
  IHEPdataanalysis,
  IStackedChannel,
  IStackedChannelBinwise,
  IStackedProcess,
  IUncertaintyPerSystematic,
  IUncertaintySummary,
  IWorkspace,
} from '../interfaces';
import { color_scheme } from '../utils/colors';
import { Notify } from 'quasar';

export const useWorkspaceStore = function (id: number) {
  return defineStore('workspace' + id, {
    state: () => ({
      workspace: {} as IWorkspace,
      name: '' as string,
      process_title_index: {} as { [key: string]: string },
      channel_title_index: {} as { [key: string]: string },
      process_color_index: {} as { [key: string]: string },
      download_urls: {} as { [key: string]: string },
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
        for (const c of state.workspace.channels) {
          for (const p of c.samples) {
            const yields = p.data.reduce(
              (pv: number, cv: number) => pv + cv,
              0
            );
            if (Object.prototype.hasOwnProperty.call(process_yields, p.name)) {
              process_yields[p.name] += yields;
            } else {
              process_yields[p.name] = yields;
            }
          }
        }
        return process_yields;
      },
      channel_names(state): string[] {
        const list: string[] = [];
        for (const channel of state.workspace.channels) {
          list.push(channel.name);
        }
        return list;
      },
      channel_titles(state): { [key: string]: string } {
        const channel_titles: { [key: string]: string } = {};
        for (const channel_name of this.channel_names) {
          if (channel_name in state.channel_title_index) {
            channel_titles[channel_name] =
              state.channel_title_index[channel_name];
          } else {
            channel_titles[channel_name] = channel_name;
          }
        }
        return channel_titles;
      },
      yield_of_process_in_channel(state) {
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
            return yields;
          }
          return 0;
        };
      },
      normfactors(state) {
        const factors = [];
        const tempNames: string[] = [];
        for (const channel of state.workspace.channels) {
          for (const sample of channel.samples) {
            for (const modifier of sample.modifiers) {
              if (modifier.type !== 'normfactor') {
                continue;
              }
              if (tempNames.includes(modifier.name)) {
                continue;
              }
              let fixed = false;
              for (const parameter of state.workspace.measurements[0].config
                .parameters) {
                if (parameter.name !== modifier.name) {
                  continue;
                }
                fixed = parameter.fixed !== undefined && parameter.fixed;
              }
              const factor = { name: modifier.name, fixed: fixed };
              factors.push(factor);
              tempNames.push(modifier.name);
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
                  previous_high + c.samples[process_index].data[i_bin];
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
      },
      async load_workspace_from_HEPdata(
        analysis: IHEPdataanalysis,
        hepdata_id: string,
        ws_index: number
      ): Promise<void> {
        const response = await (
          await fetch(
            analysis.analysis.replace(
              'landing_page=true',
              'format=json&light=true'
            )
          )
        ).json();
        const workspace = JSON.parse(response.file_contents);
        this.workspace = workspace;
        this.name = 'HEPdataID' + hepdata_id + 'WS' + ws_index;
      },
      delete_workspace(): void {
        const storeid = useStoreIDStore();
        storeid.remove_store_with_id(id);
        this.workspace = {} as IWorkspace;
        this.name = '';
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