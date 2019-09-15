import { createStore } from '@mpxjs/core'

export const storeUser = createStore({
  state: {
    userId: 0,
    nickname: '未知',
    headUrl: '',
    sex: 0,
    signature: '暂无个签'
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
      state.signature = signature
    },
    updateUserId (state, { userId = 0 }) {
      if (userId > 10000) {
        state.userId = userId
      }
    }
  }
})
