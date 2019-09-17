import { createStore } from '@mpxjs/core'

export const storeUser = createStore({
  state: {
    userId: 0,
    nickname: '未知',
    headUrl: '',
    sex: 0,
    signature: '暂无简介',
    followedCount: 0,
    followingCount: 0
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
    updateFollowCount (state, { followingCount = 0, followedCount = 0 }) {
      state.followingCount = followingCount || 0
      state.followedCount = followedCount || 0
    },
    updateUserId (state, { userId = 0 }) {
      if (userId > 10000) {
        state.userId = userId
      }
    }
  }
})
