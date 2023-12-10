import { defineStore } from 'pinia';
import { useWorkspaceStore } from 'src/stores/workspace';

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
