import { useStoreIDStore } from 'src/stores/storeid';
import { useWorkspaceStore } from 'src/stores/workspace';
import type { IAnalysis, IHEPdataentry } from 'src/interfaces';
import { Notify } from 'quasar';

export async function check_workspaces_on_HEPdata(
  hepdata_id: string
): Promise<IAnalysis[]> {
  const store_id_store = useStoreIDStore();
  store_id_store.checking = true;
  const hepdata_url =
    'https://www.hepdata.net/record/ins' +
    hepdata_id +
    '?format=json&light=true';
  let hepdata_entry: IHEPdataentry | null = null;
  try {
    hepdata_entry = await (await fetch(hepdata_url)).json();
  } catch {
    Notify.create({
      message:
        'Invalid JSON encountered. Are you sure you provided the correct HEPdata ID?',
      color: 'negative',
      icon: 'report_problem',
      position: 'top',
    });
    return [];
  }
  const analyses: IAnalysis[] | undefined = [];
  if (hepdata_entry?.record.analyses === undefined) {
    return [];
  }
  let analysis_index = -1;
  for (const analysis of hepdata_entry?.record.analyses) {
    analysis_index++;
    if (analysis.type !== 'HistFactory') {
      continue;
    }
    analyses.push({
      name: hepdata_entry.resources_with_doi[analysis_index].filename,
      url: analysis.analysis,
    });
  }
  if (analyses === undefined || analyses.length === 0) {
    Notify.create({
      message:
        'No JSON workspaces are available for this HEPData entry. Are you sure you provided the correct HEPdata ID?',
      color: 'negative',
      icon: 'report_problem',
      position: 'top',
    });
    return [];
  }
  store_id_store.checking = false;
  return analyses;
}

export async function load_workspaces_from_HEPdata(analyses: IAnalysis[]): Promise<void> {
  const store_id_store = useStoreIDStore();
  for (const analysis of analyses) {
    const id = store_id_store.add_store_with_id();
    const workspace_store = useWorkspaceStore(id)();
    workspace_store.load_workspace_from_HEPdata(analysis);
  }
}
