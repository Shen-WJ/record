const common = require('../utils/common.js')

export const behaviorOnRecord = Behavior({
  behaviors: [],
  properties: {
  },
  data: {
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
      if (e.currentTarget.dataset.type === 0) return
      const index = e.currentTarget.dataset.index
      const record = this.getRecord(index)
      let indexStr = ''
      if (typeof index === 'number') {
        indexStr = '&row=' + index
      } else {
        indexStr = '&section=' + index.section + '&row=' + index.row
      }
      wx.navigateTo({
        url: './recordDetail?recordId=' + record.recordId + indexStr
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
        that: this,
        success: (res) => {
          // 详情页向上一页传值
          if (typeof this.changeFormerPageStatus === 'function') {
            this.changeFormerPageStatus(0)
          }
        }
      })
    },
    clickFavorites: function (e) {
      common.clickFavorites({
        index: e.currentTarget.dataset.index,
        that: this,
        success: (res) => {
          // 详情页向上一页传值
          if (typeof this.changeFormerPageStatus === 'function') {
            this.changeFormerPageStatus(1)
          }
        }
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
    // 0点赞，1收藏，供子页面向上（本页面）调用，当前页面自己不用
    changeStatus: function (type, index) {
      common.changeStatus({
        type,
        index,
        that: this
      })
    }
  }
})
