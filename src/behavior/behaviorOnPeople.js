import logo1 from '../image/global/logo1.jpg'
import contentBoardHolder from '../image/global/contentBoardHolder.png'
import { behaviorOnRecord } from '../behavior/behaviorOnRecord'
import { storeUser } from '../stores/storeUser'
import { storeMode, storeNotice } from '../stores/storeCommon'
import net from '../utils/net'

const common = require('../utils/common.js')

let elements = [
  wx.createAnimation({ timingFunction: 'ease', duration: 1000 }),
  wx.createAnimation({ timingFunction: 'ease-in', duration: 1000 }),
  wx.createAnimation({ timingFunction: 'ease-in-out', duration: 1000 }),
  wx.createAnimation({ timingFunction: 'ease-out', duration: 1000 })
]

export const behaviorOnPeople = Behavior({
  behaviors: [behaviorOnRecord],
  methods: {
    onLoad: function (option) {
      this.clickHead()
      this.categoryCur = 0
      this.httpsData = []
      this.swipeList = this.selectComponent('#swipeList')

      if (option.otherUserId) { // otherPeople
        this.otherUserId = parseInt(option.otherUserId)
        if (this.otherUserId < 10000) { // userId不合法
          wx.navigateBack({
            delta: 1,
            fail: (res) => {
              common.navToHomePage()
            }
          })
          return
        }
        this.getRequest(true)
        this.isShowFollowBtn = storeUser.state.userId !== this.otherUserId
      } else { // me
        wx.canIUse('hideTabBar') && wx.hideTabBar()

        this.getRequest(true)
      }
    },
    pullDownRefresh: function () {
      this.getRequest(true)
    },
    reachBottom: function () {
      if (!common.isEmpty(this.httpsData[this.categoryCur]) && this.httpsData[this.categoryCur].hasNextPage) {
        this.getRequest(false)
      }
    },
    onShareAppMessage: function (res) {
      if (res.from === 'button') {
        let btnId = res.target.id
        if (btnId === 'shareOtherPeople') {
          return {
            title: '这个人好有趣啊！',
            path: '/pages/otherPeople?otherUserId=' + this.otherUserId
          }
        } else {
          const record = this.getRecord(res.target.dataset.index)
          const title = common.isEmpty(record.content) ? (record.nickname + '在' + record.location + '说') : record.content
          if (record.img1) {
            return {
              title: title,
              path: '/pages/recordDetail?recordId=' + record.recordId,
              imageUrl: record.img1
            }
          } else {
            return {
              title: title,
              path: '/pages/recordDetail?recordId=' + record.recordId,
              imageUrl: contentBoardHolder
            }
          }
        }
      } else {
        return {
          title: '点迹，让附近离你更近。',
          path: '/pages/launch',
          imageUrl: logo1
        }
      }
    },
    swipeTo (e) {
      this.categoryCur = parseInt(e.detail.categoryCur)
      switch (this.categoryCur) {
        case 0: {
          if (this.recordList.length <= 0 && !this.httpsData[0]) {
            this.getRequest(true)
          }
          break
        }
        case 1: {
          if (this.dailyRecordList.length <= 0 && !this.httpsData[1]) {
            this.getRequest(true)
          }
          break
        }
      }
    },
    pullDownOverRefresh () {
      this.isTabFixed = false
      let ani = wx.createAnimation({ timingFunction: 'ease', duration: 500 })
      this.containerAni = ani.top('0rpx').step().export()
      console.log('pullDownOverRefresh')
    },
    pullUpFromTop () {
      this.isTabFixed = true
      let ani = wx.createAnimation({ timingFunction: 'ease', duration: 500 })
      this.containerAni = ani.top('-410rpx').step().export()
      console.log('pullUpFromTop')
    },
    changeCategoryData (categoryCur = 0, requesting, end, total, emptyShow) {
      let aData = {}
      if (typeof requesting === 'boolean') {
        aData.requesting = requesting
      }
      if (typeof end === 'boolean') {
        aData.end = end
      }
      if (typeof total === 'number') {
        aData.total = total
      }
      if (typeof emptyShow === 'boolean') {
        aData.emptyShow = emptyShow
      }
      this.$forceUpdate({
        [`categoryData[${categoryCur}]`]: {
          ...this.categoryData[this.categoryCur],
          ...aData
        }
      })
    },

    // 个人信息，通知，收藏，设置，关注/取消关注，生成海报
    clickToSome: function (e) {
      const type = parseInt(e.currentTarget.dataset.type)
      switch (type) {
        case 0: { // 个人信息
          if (this.pageType === 'me') {
            wx.navigateTo({
              url: './userInfo'
            })
          } else if (this.pageType === 'others') {
            if (e.currentTarget.dataset.position === 'head') {
              wx.previewImage({
                urls: [this.otherHeadUrl]
              })
            }
          }
          break
        }
        case 1: { // 通知
          this.noticeCount = ''
          this.isShowNoticeRedDot = false
          storeNotice.commit('updateRedDots', {
            redDots: [0, 0, 0, 0, 0]
          })
          wx.navigateTo({
            url: './notice'
          })
          break
        }
        case 2: { // 收藏
          wx.navigateTo({
            url: './favorites'
          })
          break
        }
        case 3: { // 设置
          wx.navigateTo({
            url: './settings?pageType=settings'
          })
          break
        }
        case 4: { // 点击关注/取消关注
          if (storeUser.state.userId === this.otherUserId) return
          if (this.otherIsFollowed) {
            net.reqPut({
              url: 'user/unfollow',
              body: {
                followUserId: this.otherUserId
              }
            }).then(data => {
              this.otherIsFollowed = false
              this.otherFollowedCount--
            })
          } else {
            if (!storeUser.state.hasHadUserInfo) {
              this.isShowDialog = true
              return
            }
            net.reqPost({
              url: 'user/follow',
              body: {
                followUserId: this.otherUserId
              }
            }).then(data => {
              this.otherIsFollowed = true
              this.otherFollowedCount++
            })
          }
          break
        }
        case 5: { // 生成海报
          this.isShowGallery = true
          break
        }
      }
    },

    clickHead (e) {
      if (this.isAnimating) return
      this.isAnimating = true
      let timer = setTimeout(() => {
        clearTimeout(timer)
        this.animationOnHead(0)
      }, 0)
      let timer1 = setTimeout(() => {
        clearTimeout(timer1)
        this.animationOnHead(1)
      }, 1500)
    },
    animationOnHead (type) {
      let aniExports = []
      if (type === 0) {
        for (let i = 0; i < elements.length; i++) {
          let animation = elements[i]
          switch (i) {
            case 0: {
              animation.left('0rpx').top('0rpx').step()
              break
            }
            case 1: {
              animation.left('650rpx').top('0rpx').step()
              break
            }
            case 2: {
              animation.left('0rpx').top('260rpx').step()
              break
            }
            case 3: {
              animation.left('650rpx').top('260rpx').step()
              break
            }
          }
          aniExports.push(animation.export())
        }
      } else {
        for (let i = 0; i < elements.length; i++) {
          let animation = elements[i]
          animation.left('325rpx').top('65rpx').step()
          aniExports.push(animation.export())
        }
        this.isAnimating = false
      }
      this.animations = aniExports
    },
    pressToChangeLamp () {
      wx.showActionSheet({
        itemList: ['这里是彩蛋！点击下方↓', storeMode.state.darkMode ? '开灯' : '关灯'],
        success: res => {
          if (res.tapIndex === 1) {
            storeMode.commit('chooseBlackTheme', { isOpen: !storeMode.state.darkMode })
          }
        }
      })
    },

    // 点击是否授权后触发
    authorizeUserInfo (e) {
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.userInfo']) {
            if (this.pageType === 'me') {
              this.isShowDialog = true
            } else {
              this.isShowDialog = false
            }
          } else {
            this.isShowDialog = false
            common.updateUserInfo({
              userInfo: e.detail.detail.userInfo,
              iv: e.detail.detail.iv,
              encryptedData: e.detail.detail.encryptedData
            })
          }
        }
      })
    },

    clickMore: function (e) {
      const index = e.currentTarget.dataset.index
      let record = this.getRecord(index)
      let sheet = []
      sheet = ['生成打卡海报', '删除']
      wx.showActionSheet({
        itemList: sheet,
        success: res => {
          if (res.tapIndex === 0) {
            this.clickDownloadCard(e)
          } else if (res.tapIndex === 1) {
            wx.showModal({
              title: '确认删除？',
              content: '点击删除以删除此点迹',
              confirmText: '删除',
              confirmColor: '#d81e06',
              success: (res) => {
                if (res.confirm) {
                  net.reqDelete({
                    url: 'record/info',
                    query: {
                      recordId: record.recordId
                    }
                  }).then(data => {
                    this.deleteRecord(index)
                  })
                }
              }
            })
          }
        }
      })
    },

    clickToSwitch: function () {
      common.switchToRelease('../pages/me')
    },

    getRecord: function (index) {
      return this.recordList[index]
    },
    changeRecord: function (index, record) {
      this.$forceUpdate({
        [`recordList[${index}]`]: record
      })
    },
    deleteRecord: function (index) {
      let row = (typeof (index) === 'number') ? index : index.row
      let records = this.recordList.slice(0)
      records.splice(row, 1)
      this.recordList = records
    },

    // 0点赞，1收藏
    changeStatus: function (type, index) {
      let row = (typeof (index) === 'number') ? index : index.row
      common.changeStatus({
        type,
        index: row,
        that: this
      })
    },

    templateCatch: function () {
      // 仅为阻挡template上的点击操作，不做任何处理
    },
    clickToMapPage: function () {
      wx.navigateTo({
        url: './mapPage?pageType=person&personType=' + this.pageType + '&otherUserId=' + (this.otherUserId || 0)
      })
    },

    pressDailyRecord (e) {
      if (this.pageType !== 'me') return
      const index = e.currentTarget.dataset.index
      let dailyRecord = this.dailyRecordList[index]
      wx.showActionSheet({
        itemList: ['删除'],
        itemColor: '#d81e06',
        success: res => {
          if (res.tapIndex === 0) {
            net.reqDelete({
              url: 'dailyRecord/info',
              query: {
                recordId: dailyRecord.recordId
              }
            }).then(data => {
              let dailyRecords = this.dailyRecordList.slice(0)
              dailyRecords.splice(index, 1)
              this.dailyRecordList = dailyRecords
              wx.showToast({
                title: '已删除'
              })
            })
          }
        }
      })
    },
    clickDailyRecord (e) {
      const index = e.currentTarget.dataset.index
      let dailyRecord = this.dailyRecordList[index]
      wx.openLocation({
        latitude: dailyRecord.lat,
        longitude: dailyRecord.lng
      })
    },
    formatDailyRecord (list = []) {
      let newList = []
      for (let i in list) {
        let item = list[i]
        item.date = common.timeToStr(item.time, true)
        newList.push(item)
      }
      return newList
    }
  }
})
