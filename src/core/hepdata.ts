import { useStoreIDStore } from 'src/stores/storeid';
import { useWorkspaceStore } from 'src/stores/workspace';
import type { IAnalysis, IHEPdataentry, IWorkspace } from 'src/interfaces';
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
  for (const analysis of hepdata_entry?.record.analyses) {
    if (analysis.type !== 'HistFactory') {
      continue;
    }
    analyses.push({
      name: analysis.filename,
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
  for (const analysis of analyses) {
    load_workspace_from_HEPdata(analysis);
  }
}

export async function load_workspace_from_HEPdata_resource(record_id: string): Promise<void> {
  const analysis: IAnalysis = {name: 'Resource ID: ' + record_id, url: 'https://www.hepdata.net/record/resource/'+record_id+'?landing_page=true'}
  load_workspace_from_HEPdata(analysis);
}

export async function load_workspace_from_HEPdata(analysis: IAnalysis): Promise<void> {
  const store_id_store = useStoreIDStore();
  const id = store_id_store.add_store_with_id();
  const workspace_store = useWorkspaceStore(id)();
  const response = await (
    await fetch(analysis.url.replace('landing_page=true', 'format=json'))
  ).json()
  let workspace = {} as IWorkspace
  if (response.file_contents === 'Large text file') {
    workspace = await (
      await fetch(
        analysis.url.replace('landing_page=true', 'view=true')
      )
    ).json();
  }
  else {
    workspace = JSON.parse(response.file_contents);
  }
  workspace_store.workspace = workspace;
  workspace_store.name = analysis.name;
  workspace_store.loading = false;
  workspace_store.create_channel_stores();
}
