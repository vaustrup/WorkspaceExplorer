import { defineStore } from 'pinia';
import { useWorkspaceStore } from './workspace';
import {
  IChannelState,
  IProcess,
  IStackedChannel,
  IStackedChannelBinwise,
  IStackedProcess,
  IWorkspaceState,
} from 'src/interfaces';

export const useChannelStore = function (id: number, channel: string) {
  return defineStore('channel' + id + channel, {
    state: () =>
      ({
        name: '' as string,
        _title: '' as string,
        samples: {},
        observations: [] as number[],
        workspace_store: useWorkspaceStore(id)() as IWorkspaceState,
      } as IChannelState),
    getters: {
      title(): string {
        return this._title === '' ? this.name : this._title;
      },
      normfactor_names(): string[] {
        const factors: string[] = [];
        for (const sample of this.samples) {
          factors.push(
            ...sample.modifiers
              .filter((modifier) => modifier.type === 'normfactor')
              .map((modifier) => modifier.name)
              .filter((name) => !factors.includes(name))
          );
        }
        return factors;
      },
      modifier_names(): string[] {
        const names: string[] = [];
        for (const sample of this.samples) {
          for (const modifier of sample.modifiers) {
            if (names.includes(modifier.name)) {
              continue;
            }
            names.push(modifier.name);
          }
        }
        return names;
      },
      modifier_types(): { [key: string]: { [key: string]: string } } {
        const types = {} as { [key: string]: { [key: string]: string } };
        for (const sample of this.samples) {
          const types_per_sample: { [key: string]: string } = {};
          for (const modifier_name of this.workspace_store.modifier_names) {
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
          types[sample.name] = types_per_sample;
        }
        return types;
      },
      normfactor(state) {
        return (process: IProcess): number => {
          let factor = 1.0;
          for (const key in state.workspace_store.normfactors) {
            const normfactor = state.workspace_store.normfactors[key];
            if (
              !process.modifiers.find((m) => {
                return m.name === key;
              })
            )
              continue;
            factor = factor * normfactor.value;
          }
          return factor;
        };
      },
      yield_of_process(state): (process_name: string) => number {
        // returns the overall yield of a given process
        return (process_name: string): number => {
          const p = state.samples.find((s) => {
            return s.name === process_name;
          });
          if (!p) {
            console.log('Could not find process ' + process_name);
            return 0;
          }
          return p.data.reduce((pv, cv) => pv + cv, 0) * this.normfactor(p);
        };
      },
      stacked_data(): IStackedChannel {
        const channel = {} as IStackedChannel;
        channel.name = this.name;
        const processes = [] as IStackedProcess[];
        let previous_high = 0;
        for (const process_name of this.workspace_store.process_names) {
          const process = {} as IStackedProcess;
          process.name = process_name;
          const yields = this.yield_of_process(process_name);
          process.low = previous_high;
          process.high = previous_high + yields;
          processes.push(process);
          previous_high = process.high;
        }
        channel.processes = processes;
        return channel;
      },
      normalized_stacked_data(): IStackedChannel {
        // returns a stack of overall relative yields of the different processes in the different channels
        let total_yield = 0;
        const normalized_stacked_data = this.stacked_data;
        for (const p of normalized_stacked_data.processes) {
          total_yield += p.high - p.low;
        }
        for (const p of normalized_stacked_data.processes) {
          p.high = (p.high / total_yield) * 100;
          p.low = (p.low / total_yield) * 100;
        }
        return normalized_stacked_data;
      },
      stacked_data_per_bin(): IStackedChannelBinwise {
        const channel = {} as IStackedChannelBinwise;
        channel.name = this.name;
        channel.data = this.observations;
        channel.content = [];
        const bin_number = this.samples[0].data.length;
        for (let i_bin = 0; i_bin < bin_number; i_bin++) {
          const processes = [] as IStackedProcess[];
          let previous_high = 0;
          for (const process_name of this.workspace_store.process_names) {
            const process = {} as IStackedProcess;
            process.name = process_name;
            process.low = previous_high;

            const sample = this.samples.find((s) => {
              return s.name === process_name;
            });
            // in case a process is not available in this channel, set yields to zero
            if (!sample) {
              process.high = previous_high;
            } else {
              process.high =
                previous_high + sample.data[i_bin] * this.normfactor(sample);
            }
            processes.push(process);
            previous_high = process.high;
          }
          channel.content.push(processes);
        }
        return channel;
      },
    },
    actions: {
      cleanup(): void {
        this.name = '';
        this._title = '';
        this.observations = [];
        this.samples = {} as IProcess[];
      },
    },
  });
};
