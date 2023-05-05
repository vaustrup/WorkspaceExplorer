import { defineStore } from 'pinia';
import { useWorkspaceStore } from './workspace';
import type { IAnalysis, IHEPdataentry } from '../interfaces';
import { Notify } from 'quasar';

export const useStoreIDStore = defineStore('storeids', {
  state: () => ({
    ids: [] as number[],
    free_ids: [] as number[],
    checking: false as boolean,
  }),
  actions: {
    load_workspaces_from_local_files(files: FileList): void {
      for (const f of files) {
        const id = this.add_store_with_id();
        const workspace_store = useWorkspaceStore(id)();
        workspace_store.load_workspace_from_local_file(f);
      }
    },
    async load_workspace_from_url(url: string, name?: string): Promise<void> {
      const id = this.add_store_with_id();
      const workspace_store = useWorkspaceStore(id)();
      workspace_store.load_workspace_from_url(url, name);
    },
    async check_workspaces_on_HEPdata(
      hepdata_id: string
    ): Promise<IAnalysis[]> {
      this.checking = true;
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
      this.checking = false;
      return analyses;
    },
    async load_workspaces_from_HEPdata(analyses: IAnalysis[]): Promise<void> {
      for (const analysis of analyses) {
        const id = this.add_store_with_id();
        const workspace_store = useWorkspaceStore(id)();
        workspace_store.load_workspace_from_HEPdata(analysis);
      }
    },
    remove_store_with_id(id: number): void {
      const index = this.ids.indexOf(id);
      if (index === -1) {
        console.log('Could not find ID to remove.');
        return;
      }
      this.ids.splice(index, 1);
      this.free_ids.push(id);
    },
    add_store_with_id(): number {
      let id = 0;
      if (this.ids.length === 0 && this.free_ids.length === 0) {
        id = 0;
      } else if (this.free_ids.length !== 0) {
        const id_or_undefined = this.free_ids.shift();
        if (id_or_undefined === undefined) {
          console.log(
            'Failed to get ID from available IDs, generating new one.'
          );
          id = Math.max(...this.ids) + 1;
        } else {
          id = id_or_undefined;
        }
      } else {
        id = Math.max(...this.ids) + 1;
      }
      this.ids.push(id);
      return id;
    },
  },
});
