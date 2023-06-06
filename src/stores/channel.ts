import { defineStore } from 'pinia';

export const useChannelStore = function (id: number, channel: string) {
  return defineStore('channel' + id + channel, {
    state: () => ({
      name: '',
      title: '',
    }),
    getters: {},
    actions: {},
  });
};
