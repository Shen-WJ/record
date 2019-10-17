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
      // 透明度为0时，等同于开启夜间模式openDarkMode
      wx.setStorageSync('darkMode', isOpen)
      state.darkMode = isOpen
    },

    changeCoverImg (state, { imgUrl = '' }) {
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
    }
  },
  actions: {
    changeCoverImg ({ commit, state }, { filePath = '' }) {
      const fsm = wx.getFileSystemManager()
      const dir = `${wx.env.USER_DATA_PATH}/coverImg`
      const oldCoverImg = state.coverImg || ''
      if (oldCoverImg === filePath) return

      fsm.rmdir({
        dirPath: dir,
        recursive: true,
        fail: err => {
          // 失败了就只删除文件试试
          console.log(err)
          fsm.unlink({
            filePath: oldCoverImg
          })
        },
        complete: res => {
          console.log(res)
          if (filePath === '') {
            commit('changeCoverImg', {
              imgUrl: ''
            })
          } else {
            fsm.mkdir({
              dirPath: dir,
              recursive: true,
              complete: res => {
                console.log(res)
                const houzhui = filePath.split('.').slice(-1)[0]
                fsm.saveFile({
                  tempFilePath: filePath,
                  filePath: `${dir}/img.${houzhui}`,
                  fail: err => {
                    console.log(err)
                    wx.showToast({
                      title: '出了些问题，快去告诉开发者吧',
                      icon: 'none',
                      duration: 3000
                    })
                  },
                  success: res => {
                    console.log(res)
                    commit('changeCoverImg', {
                      imgUrl: res.savedFilePath
                    })
                    // 有些手机性能太差，还没从后台回来
                    let timer = setTimeout(() => {
                      clearTimeout(timer)
                      wx.reLaunch({
                        url: './find' // to home
                      })
                    }, 100)
                  }
                })
              }
            })
          }
        }
      })
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
