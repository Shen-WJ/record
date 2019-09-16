const common = require('../utils/common.js')

export const behaviorOnPeople = Behavior({
  methods: {
    onLoad: function (option) {
      if (option.otherUserId) { // otherPeople
        this.setData({
          otherUserId: parseInt(option.otherUserId)
        }, res => {
          this._getRequest(true)
        })
      } else { // me
        this._getRequest(true)
      }
    },
    onPullDownRefresh: function () {
      this._getRequest(true)
    },
    onReachBottom: function () {
      let component = this.selectComponent('#personalPage')
      if (!common.isEmpty(component.httpsData) && component.httpsData.hasNextPage) {
        this._getRequest(false)
      }
    },
    onShareAppMessage: function (res) {
      let component = this.selectComponent('#personalPage')
      if (res.from === 'button') {
        let btnId = res.target.id
        if (btnId === 'shareOtherPeople') {
          return {
            title: '不是诱导分享，讲真，进来看看',
            path: '/pages/otherPeople?otherUserId=' + this.data.otherUserId
          } 
        } else {
          const record = component.getRecord(res.target.dataset.index)
          const title = common.isEmpty(record.content) ? (record.nickname + '在' + record.location + '说') : record.content
          return {
            title: title,
            path: '/pages/recordDetail?recordId=' + record.recordId
          }
        }
      } else {
        return {
          title: '了解身边的过去，记录过去的身边',
          path: '/pages/locality'
        }
      }
    },
    _getRequest: function (isRefresh) {
      let component = this.selectComponent('#personalPage')
      component.getRequest({
        isRefresh: isRefresh
      })
    }
  }
})