export interface IHEPdataentry {
  record: { analyses: IHEPdataanalysis[] };
}

export interface IHEPdataanalysis {
  type: string;
  analysis: string;
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
  lo: number;
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
  //   ]
  // }
  name: string;
  content: Array<Array<IStackedProcess>>;
  data: Array<number>;
}

export interface INormFactor {
  name: string;
  fixed: boolean;
}

export interface IUncertaintyWithType {
  hi: number[];
  lo: number[];
  type: string;
}

export interface IUncertainty {
  hi: number[];
  lo: number[];
}

export interface IUncertaintyPerSystematic {
  overall: IUncertainty;
  per_process: { [key: string]: IUncertaintyWithType };
}

export interface IUncertaintyPerChannel {
  overall: IUncertainty;
  per_systematic: { [key: string]: IUncertaintyPerSystematic };
}

export interface IUncertaintySummary {
  [key: string]: IUncertaintyPerChannel;
}
