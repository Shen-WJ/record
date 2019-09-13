import { createStore } from '@mpxjs/core'

const storeUser = createStore({
  state: {
    userId: 0,
    userInfo: {
      nickname: '未知',
      headUrl: '',
      sex: 0
    }
  },
  mutations: {
    updateUserInfo (state, { nickname = '', headUrl = '', sex = 0 }) {
      if (nickname) {
        state.userInfo.nickname = nickname
      }
      if (headUrl) {
        state.userInfo.headUrl = headUrl
      }
      if (sex) {
        state.userInfo.sex = sex
      }
    },
    updateUserId (state, { userId = 0 }) {
      if (userId > 10000) {
        state.userId = userId
      }
    }
  }
})

export default storeUser
