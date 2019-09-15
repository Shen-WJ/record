import { createStore } from '@mpxjs/core'

export const storeMode = createStore({
  state: {
    darkMode: false
  },
  mutations: {
    openDarkMode (state, { isOpen = false }) {
      wx.setStorageSync("darkMode", isOpen)
      state.darkMode = isOpen
    }
  }
})
