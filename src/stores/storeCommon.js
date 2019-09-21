import { createStore } from '@mpxjs/core'

export const storeMode = createStore({
  state: {
    darkMode: false,
    coverImg: ''
  },
  mutations: {
    openDarkMode (state, { isOpen = false }) {
      wx.setStorageSync('darkMode', isOpen)
      state.darkMode = isOpen
    },
    updateCoverImg (state, { imgUrl = '' }) {
      wx.setStorageSync('coverImg', imgUrl || '')
      state.coverImg = imgUrl || ''
    }
  }
})
