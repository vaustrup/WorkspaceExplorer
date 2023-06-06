export interface IHEPdataentry {
  record: { analyses: IHEPdataanalysis[] };
  resources_with_doi: IDOIentry[];
}

export interface IDOIentry {
  description: string;
  filename: string;
  doi: string;
}

export interface IHEPdataanalysis {
  type: string;
  analysis: string;
}

export interface IAnalysis {
  name: string;
  url: string;
}

export interface IAnalysisOption {
  label: string;
  value: IAnalysis;
}

export interface IFitResults {
  bestfit: number[];
  uncertainty: number[];
  correlations: number[][];
  labels: string[];
}

export interface INPs {
  bestfit: number[];
  labels: string[];
}

export interface ITaskResults {
  ready: boolean;
  successful: boolean;
  value: IFitResults;
}

export interface IProcess {
  name: string;
  data: number[];
  modifiers: IModifier[];
}

export interface IModifier {
  name: string;
  data: null | INormSys | IHistoSys | number[];
  type: string;
}

export interface INormSys {
  hi: number;
  low: number;
}

export interface IHistoSys {
  hi_data: number[];
  lo_data: number[];
}

export interface IChannel {
  name: string;
  samples: Array<IProcess>;
}

export interface IMeasurement {
  name: string;
  config: IConfig;
}

export interface IConfig {
  parameters: IParameter[];
  poi: string;
}

export interface IParameter {
  auxdata?: number[];
  name: string;
  inits?: number[];
  bounds?: number[];
  fixed?: boolean;
  sigmas?: number[];
}

export interface IObservation {
  name: string;
  data: Array<number>;
}

export interface IWorkspace {
  channels: Array<IChannel>;
  measurements: Array<IMeasurement>;
  observations: Array<IObservation>;
}

export interface IStackedProcess {
  name: string;
  low: number;
  high: number;
}

export interface IStackedChannel {
  name: string;
  processes: Array<IStackedProcess>;
}

export interface IStackedChannelBinwise {
  // we need:
  // { name: channel1,
  //   content: [
  //              bin 1
  //              [{name: process1, low: low1, high: high1},
  //               {name: process2, low: low2, high: high2},
  //                ...],
  //              bin 2
  //              [{name: process1, low: low1, high: high1},
  //               {name: process2, low: low2, high: high2},
  //                ...],
  //              ...
  //   ],
  //   data: data1,
  // }
  name: string;
  content: Array<Array<IStackedProcess>>;
  data: Array<number>;
}

export interface INormFactor {
  name: string;
  fixed: boolean;
  value: number;
  processes: string[];
}

export interface IUncertaintyPerSystematic {
  overall: number[];
  per_process: { [key: string]: number[] };
}

export interface IUncertaintyPerChannel {
  overall: number[];
  per_systematic: { [key: string]: IUncertaintyPerSystematic };
}

export interface IUncertaintySummary {
  [key: string]: IUncertaintyPerChannel;
}
