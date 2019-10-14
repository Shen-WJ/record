import logo1 from '../image/global/logo1.jpg'
import contentBoardHolder from '../image/global/contentBoardHolder.png'

const common = require('../utils/common.js')

export const behaviorOnPage = Behavior({
  data: {
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
            imageUrl: this.contentBoardSrc || contentBoardHolder
          }
        }
      } else {
        return {
          title: '点迹，让附近离你更近。',
          path: '/pages/launch',
          imageUrl: logo1
        }
      }
    }
  }
})
