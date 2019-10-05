import { createStore } from '@mpxjs/core'

export const storeMode = createStore({
  state: {
    darkMode: false,
    coverImg: '',
    opacity: 1
  },
  mutations: {
    openDarkMode (state, { isOpen = false }) {
      // 开启黑夜模式，是不透明的
      wx.setStorageSync('opacity', 1)
      state.opacity = 1

      wx.setStorageSync('darkMode', isOpen)
      state.darkMode = isOpen
    },

    updateCoverImg (state, { imgUrl = '' }) {
      // 无图将重置为不透明，有图会辅助重置数据
      if (imgUrl.length <= 0) {
        wx.setStorageSync('opacity', 1)
        state.opacity = 1
      } else if (state.opacity === 1 && imgUrl.length > 0) {
        wx.setStorageSync('opacity', 0.7)
        state.opacity = 0.7
      }

      wx.setStorageSync('coverImg', imgUrl || '')
      state.coverImg = imgUrl || ''
    },

    updateOpacity (state, { opacity = 1 }) {
      if (opacity > 1) opacity = opacity * 0.1
      wx.setStorageSync('opacity', opacity)
      state.opacity = opacity
    },

    chooseBlackTheme (state, { isOpen = false }) {
      // 开启黑色/白色主题的背景图样式
      // 无图时，等同于开启夜间模式openDarkMode
      wx.setStorageSync('darkMode', isOpen)
      state.darkMode = isOpen
    }
  }
})

export const storeNotice = createStore({
  state: {
    redDots: [0, 0, 0, 0, 0] // 做了预留，将来可扩展成-1时不显示数字，只显示红点。目前，只有>0时，显示数字
  },
  mutations: {
    updateRedDots (state, { redDots = [0, 0, 0, 0, 0] }) {
      state.redDots = redDots
    }
  }
})
