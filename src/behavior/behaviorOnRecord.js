const common = require('../utils/common.js')

export const behaviorOnRecord = Behavior({
  behaviors: [],
  properties: {
  },
  data: {
    recordList: [[], []],
  },
  methods: {
    clickToOtherPeople (e) {
      const index = e.currentTarget.dataset.index
      const record = this.getRecord(index)

      wx.navigateTo({
        url: './otherPeople?otherUserId=' + record.userId
      })
    },
    clickToDetail: function (e) {
      const index = e.currentTarget.dataset.index
      const record = this.getRecord(index)

      wx.navigateTo({
        url: './recordDetail?recordId=' + record.recordId + '&section=' + index.section + '&row=' + index.row
      })
    },
    clickToMap: function (e) {
      const index = e.currentTarget.dataset.index
      let record = this.getRecord(index)

      wx.openLocation({
        latitude: record.lat,
        longitude: record.lng
      })
    },
    clickLike: function (e) {
      common.clickLike({
        index: e.currentTarget.dataset.index,
        that: this
      })
    },
    clickFavorites: function (e) {
      common.clickFavorites({
        index: e.currentTarget.dataset.index,
        that: this
      })
    },
    clickShare: function (e) {
      if (!((typeof wx.canIUse === 'function') && wx.canIUse('button.open-type.share'))) {
        wx.showModal({
          title: '当前版本不支持转发按钮',
          content: '请升级至最新版本微信客户端',
          showCancel: false
        })
      }
    },
    previewImage: function (e) {
      const current = e.target.dataset.src
      const record = this.getRecord(e.target.dataset.index)
      wx.previewImage({
        current,
        urls: record.imageList
      })
    },
    getRecord: function (index) {
      return this.recordList[index.section][index.row]
    },
    changeRecord: function (index, record) {
      this.recordList[index.section].splice(index.row, 1, record)
    },
    // 0点赞，1收藏
    changeStatus: function (type, index) {
      common.changeStatus({
        type,
        index,
        that: this
      })
    },
    onPullDownRefresh: function () {
      this.getRequest(true)
    },
    onReachBottom: function () {
      if (!common.isEmpty(this.httpsData) && this.httpsData.hasNextPage) {
        this.getRequest(false)
      }
    },
    onShareAppMessage: function (res) {
      if (res.from === 'button') {
        const record = this.getRecord(res.target.dataset.index)
        const title = common.isEmpty(record.content) ? (record.nickname + '在' + record.location + '说') : record.content
        return {
          title: title,
          path: '/pages/recordDetail/recordDetail?recordId=' + record.recordId
        }
      } else {
        return {
          title: '了解身边的过去，记录过去的身边',
          path: '/pages/locality/locality'
        }
      }
    },
  }
})