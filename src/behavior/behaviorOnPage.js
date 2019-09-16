const common = require('../utils/common.js')

export const behaviorOnPage = Behavior({
  data: {
    pageLocation: {}, // 这是对应页面“上一次”做数据请求的定位记录，不做任何其他用途
  },
  methods: {
    onPullDownRefresh: function () {
      if (typeof this.getRequest === 'function') {
        this.getRequest(true)
      }
    },
    onReachBottom: function () {
      if (typeof this.getRequest === 'function') {
        if (!common.isEmpty(this.httpsData) && this.httpsData.hasNextPage) {
          this.getRequest(false)
        }
      }
    },
    onShareAppMessage: function (res) {
      if (res.from === 'button') {
        const record = this.getRecord(res.target.dataset.index)
        const title = common.isEmpty(record.content) ? (record.nickname + '在' + record.location + '说') : record.content
        return {
          title: title,
          path: '/pages/recordDetail?recordId=' + record.recordId
        }
      } else {
        return {
          title: '了解身边的过去，记录过去的身边',
          path: '/pages/locality'
        }
      }
    }
  }
})