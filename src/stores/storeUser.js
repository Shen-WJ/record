import { createStore } from '@mpxjs/core'

export const storeUser = createStore({
  state: {
    userId: 0,
    userCode: '',
    userAuth: {}, // 1001-发布，1002-评论
    hasHadUserInfo: false,
    nickname: '未知',
    headUrl: '',
    sex: 0,
    signature: '暂无简介',
    followedCount: 0,
    followCount: 0
  },
  mutations: {
    updateUserInfo (state, { nickname = '', headUrl = '', sex = 0 }) {
      if (nickname) {
        state.nickname = nickname
      }
      if (headUrl) {
        state.headUrl = headUrl
      }
      if (typeof sex === 'number' || (typeof sex === 'string' && sex.toString() > 0)) {
        state.sex = sex
      }
    },
    updateSignature (state, { signature = 0 }) {
      if (signature) {
        state.signature = signature
      } else {
        state.signature = '暂无简介'
      }
    },
    updateFollowCount (state, { followCount = 0, followedCount = 0 }) {
      state.followCount = followCount || 0
      state.followedCount = followedCount || 0
    },
    updateUserId (state, { userId = 0 }) {
      if (userId > 10000) {
        state.userId = userId
        wx.setStorageSync('userId', userId)
      }
    },
    updateUserCode (state, { userCode = '' }) {
      state.userCode = userCode
      wx.setStorageSync('userCode', userCode)
    },
    updateUserAuth (state, { userAuth = {} }) {
      state.userAuth = { ...state.userAuth, ...userAuth }
    },
    updateHasHadUserInfo (state, { hasHadUserInfo = false }) {
      wx.setStorageSync('hasHadUserInfo', hasHadUserInfo)
      state.hasHadUserInfo = hasHadUserInfo
    }
  },
  getters: {
    authRelease (state) {
      let time = (state.userAuth['1001'] - (new Date()).getTime()) / 1000
      let leftTime = time > 3600 ? (time / 3600).toFixed(1) + '小时' : (time / 60).toFixed(1) + '分钟'
      return {
        canRelease: time <= 0,
        leftTime: leftTime
      }
    }
  }
})
