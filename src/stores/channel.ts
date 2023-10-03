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
          names.push(
            ...sample.modifiers
              .filter((modifier) => !names.includes(modifier.name))
              .map((modifier) => modifier.name)
          );
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
      modifier_yields(): {
        [key: string]: { [key: string]: { [key: string]: number[] } };
      } {
        const yields = {} as {
          [key: string]: { [key: string]: { [key: string]: number[] } };
        };
        for (const sample of this.samples) {
          const yields_per_sample = {} as {
            [key: string]: { [key: string]: number[] };
          };
          for (const modifier_name of this.workspace_store.modifier_names) {
            yields_per_sample[modifier_name] = {};
            const modifier_type =
              this.modifier_types[sample.name][modifier_name];
            // first check if the modifier is present
            // for this specific sample in this channel
            if (modifier_type === 'none') {
              yields_per_sample[modifier_name]['up'] = new Array(
                this.number_of_bins
              ).fill(0);
              yields_per_sample[modifier_name]['down'] = new Array(
                this.number_of_bins
              ).fill(0);
              continue;
            }
            const modifier = sample.modifiers.find(
              (m) => m.name === modifier_name
            );
            if (!modifier) {
              console.log(
                'Could not find modifier ' +
                  modifier_name +
                  ' for sample ' +
                  sample.name +
                  ' in channel ' +
                  this.name
              );
              continue;
            }
            // do normsys next
            if (modifier_type === 'normsys') {
              yields_per_sample[modifier_name]['up'] = sample.data.map(
                (x) =>
                  x * ((modifier.data as { hi: number; lo: number }).hi - 1)
              );
              yields_per_sample[modifier_name]['down'] = sample.data.map(
                (x) =>
                  x * ((modifier.data as { hi: number; lo: number }).lo - 1)
              );
              continue;
            }
            if (modifier_type === 'histosys') {
              yields_per_sample[modifier_name]['up'] = sample.data.map(
                (x, i) =>
                  (modifier.data as { hi_data: number[]; lo_data: number[] })
                    .hi_data[i] - x
              );
              yields_per_sample[modifier_name]['down'] = sample.data.map(
                (x, i) =>
                  x -
                  (modifier.data as { hi_data: number[]; lo_data: number[] })
                    .lo_data[i]
              );
              continue;
            }
            if (modifier_type === 'normhisto') {
              const second_modifier = sample.modifiers.filter(
                (m) => m.name === modifier_name
              )[1];
              const norm_modifier =
                second_modifier.type === 'normsys' ? second_modifier : modifier;
              const histo_modifier =
                second_modifier.type === 'histosys'
                  ? second_modifier
                  : modifier;
              yields_per_sample[modifier_name]['up'] = sample.data.map(
                (x, i) =>
                  (
                    histo_modifier.data as {
                      hi_data: number[];
                      lo_data: number[];
                    }
                  ).hi_data[i] - x
              );
              yields_per_sample[modifier_name]['down'] = sample.data.map(
                (x, i) =>
                  x -
                  (
                    histo_modifier.data as {
                      hi_data: number[];
                      lo_data: number[];
                    }
                  ).lo_data[i]
              );
              yields_per_sample[modifier_name]['up'] = yields_per_sample[
                modifier_name
              ]['up'].map(
                (x) =>
                  x *
                  ((norm_modifier.data as { hi: number; lo: number }).hi - 1)
              );
              yields_per_sample[modifier_name]['down'] = yields_per_sample[
                modifier_name
              ]['down'].map(
                (x) =>
                  x *
                  ((norm_modifier.data as { hi: number; lo: number }).lo - 1)
              );
              continue;
            }
            // for lumi, normfactors, staterrors do nothing for now
            yields_per_sample[modifier_name]['up'] = new Array(
              this.number_of_bins
            ).fill(0);
            yields_per_sample[modifier_name]['down'] = new Array(
              this.number_of_bins
            ).fill(0);
          }
          yields[sample.name] = yields_per_sample;
        }
        return yields;
      },
      normfactor(state) {
        return (process: IProcess, postfit: boolean): number => {
          let factor = 1.0;
          for (const key in state.workspace_store.normfactors) {
            const normfactor = state.workspace_store.normfactors[key];
            if (
              !process.modifiers.find((m) => {
                return m.name === key;
              })
            )
              continue;
            if (!postfit) {
              factor = factor * normfactor.value;
            } else {
              const np_index: number = state.workspace_store.nps
                ? state.workspace_store.nps.labels.indexOf(key)
                : -1;
              factor =
                factor *
                (state.workspace_store.nps
                  ? state.workspace_store.nps.bestfit[np_index]
                  : 1);
            }
          }
          return factor;
        };
      },
      pulleffects(): (process_name: string, bin: number) => number {
        return (process_name: string, bin: number): number => {
          const sample = this.samples.find((s) => s.name === process_name);
          if (!sample) {
            console.log('Could not find sample with name.');
            return 1;
          }
          const inverse_nominal_yields = 1 / sample.data[bin];
          const modified_yields = this.modifier_yields[process_name];
          let factor = 1.0;
          let modifier_index = 0;
          for (const modifier_name of this.workspace_store.nps.labels) {
            // need to filter out lumi, staterror, normfactor
            const modifier_type =
              this.modifier_types[process_name][modifier_name];
            if (
              modifier_type !== undefined &&
              modifier_type !== 'lumi' &&
              modifier_type !== 'staterror' &&
              modifier_type !== 'normfactor'
            ) {
              factor *=
                1 +
                this.workspace_store.nps.bestfit[modifier_index] *
                  modified_yields[modifier_name]['up'][bin] *
                  inverse_nominal_yields;
            }
            modifier_index += 1;
          }
          return factor;
        };
      },
      yield_of_process(
        state
      ): (process_name: string, postfit: boolean) => number {
        // returns the overall yield of a given process
        return (process_name: string, postfit: boolean): number => {
          const p = state.samples.find((s) => {
            return s.name === process_name;
          });
          if (!p) {
            console.log('Could not find process ' + process_name);
            return 0;
          }
          return (
            p.data.reduce((pv, cv) => pv + cv, 0) * this.normfactor(p, postfit)
          );
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
          const yields = this.yield_of_process(process_name, false);
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
        const normalized_stacked_data = this.stacked_data;
        const total_yield =
          this.stacked_data.processes[
            this.workspace_store.number_of_processes - 1
          ].high;
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
        const bin_number = this.number_of_bins;
        for (let i_bin = 0; i_bin < bin_number; i_bin++) {
          const processes = [] as IStackedProcess[];
          let previous_high = 0;
          for (const process_name of this.workspace_store.process_names) {
            const process = {} as IStackedProcess;
            process.name = process_name;
            process.low = previous_high;
            // find process_index from name in samples
            const sample = this.samples.find((s) => {
              return s.name === process_name;
            });
            // in case a process is not available in this channel, set yields to zero
            if (!sample) {
              process.high = previous_high;
            } else {
              process.high =
                previous_high +
                sample.data[i_bin] * this.normfactor(sample, false);
            }
            processes.push(process);
            previous_high = process.high;
          }
          channel.content.push(processes);
        }
        return channel;
      },
      stacked_data_per_bin_postfit(): IStackedChannelBinwise {
        const channel = {} as IStackedChannelBinwise;
        channel.name = this.name;
        channel.data = this.observations;
        channel.content = [];
        const bin_number = this.number_of_bins;
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
                previous_high +
                sample.data[i_bin] *
                  Math.max(0, this.normfactor(sample, true)) *
                  this.pulleffects(process.name, i_bin);
            }
            processes.push(process);
            previous_high = process.high;
          }
          channel.content.push(processes);
        }
        return channel;
      },
      number_of_bins(): number {
        return this.samples[0].data.length;
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
