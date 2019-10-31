import net from './net'
import { storeUser } from '../stores/storeUser'
import { storeMode } from '../stores/storeCommon'
import toMap from '../image/icon/toMap.png'
import contentBoard from '../image/global/contentBoard.png'

const app = getApp()

function _getKilometerDistance (lat1, lng1, lat2, lng2) {
  var radLat1 = lat1 * Math.PI / 180.0
  var radLat2 = lat2 * Math.PI / 180.0
  var a = radLat1 - radLat2
  var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0
  var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
  s = s * 6378.137//  EARTH_RADIUS单位km
  s = Math.round(s * 10000) / 10000.00
  return s
}

function _getKmDistanceFromPoi (poi1 = {}, poi2 = {}) {
  return _getKilometerDistance(poi1.latitude, poi1.longitude, poi2.latitude, poi2.longitude)
}

function _getDistanceToMe (lat, lng) {
  return _getKilometerDistance(lat, lng, app.globalData.location.latitude, app.globalData.location.longitude)
}

function _isEmpty (v) {
  switch (typeof v) {
    case 'undefined':
      return true
    case 'string':
      if (v.replace(/(^[ \t\n\r]*)|([ \t\n\r]*$)/g, '').length === 0) return true
      break
    case 'boolean':
      if (!v) return true
      break
    case 'number':
      if (v === 0 || isNaN(v)) return true
      break
    case 'object':
      if (v === null || v.length === 0) return true
      for (var i in v) {
        return false
      }
      if (v.length > 0) return false
      return true
  }
  return false
}

// 貌似字符串中出现数组会转换出错，目前无数组转换的需求故不处理
function _strToJson (str) {
  return JSON.parse(str)
}

function _timeToStr (time) {
  let now = new Date()
  let nowTime = now.getTime()
  let difference = nowTime - time
  let diffHours = difference / 1000 / 3600
  let diffMinutes = difference / 1000 / 60
  if (diffHours >= 24) {
    let date = new Date(time)
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
  } else if (diffHours < 24 && diffHours >= 1) {
    return Math.floor(diffHours) + '小时前'
  } else if (diffHours < 1 && diffMinutes >= 1) {
    return Math.floor(diffMinutes) + '分钟前'
  } else if (diffMinutes < 1) {
    return '刚刚'
  } else {
    return '未知'
  }
}

function _formatLocation (longitude, latitude) {
  if (typeof longitude === 'string' && typeof latitude === 'string') {
    longitude = parseFloat(longitude)
    latitude = parseFloat(latitude)
  }
  let lat = longitude > 0 ? 'E: ' : 'W: '
  let lng = latitude > 0 ? 'N: ' : 'S: '
  longitude = Math.abs(longitude)
  latitude = Math.abs(latitude)
  let lngH, lngM, lngS
  lngH = parseInt(longitude)
  lngM = parseInt((longitude - lngH) * 60)
  lngS = parseInt(((longitude - lngH) * 60 - lngM) * 60)
  let latH, latM, latS
  latH = parseInt(latitude)
  latM = parseInt((latitude - latH) * 60)
  latS = parseInt(((latitude - latH) * 60 - latM) * 60)
  return lng + lngH + '°' + lngM + '’' + lngS + '” ' + lat + latH + '°' + latM + '’' + latS + '”'
}

function _getRecordListFrom (list, type = 0) {
  let arr = []
  for (let i = 0; i < list.length; i++) {
    let item = list[i]

    item.imageList = []
    for (let i = 1; i <= 9; i++) {
      if (!_isEmpty(item['img' + i])) {
        item.imageList.push(item['img' + i])
      } else {
        break
      }
    }

    // if (type === 0 && item.content.length > 140) {
    //   item.content = item.content.substring(0, 140)
    //   item.hasMoreText = true
    // } else {
    //   item.hasMoreText = false
    // }

    item.isLiked = !_isEmpty(app.globalData.likesDic[item.recordId])
    item.isFavorited = !_isEmpty(app.globalData.favoritesDic[item.recordId])
    item.timeStr = timeToStr(item.time)

    if (!_isEmpty(app.globalData.location) && app.globalData.location.latitude && app.globalData.location.longitude) {
      let kmNum = _getKilometerDistance(item.lat, item.lng, app.globalData.location.latitude, app.globalData.location.longitude)
      item.distance = kmNum < 1 ? (kmNum * 1000).toFixed(0) + 'm' : kmNum.toFixed(2) + 'km'
    }
    item.locStr = _formatLocation(item.lng, item.lat)
    arr.push(item)
  }
  return arr
}

function _formatRecordsOnMap ({ list = [], isNeedLine = false, isNeedInclude = false }) {
  // list.reverse()
  let markers = []
  let points = []
  const darkMode = storeMode.state.darkMode
  const bgColor = darkMode ? '#222222' : '#f6f6f6'
  const color = darkMode ? '#cccccc' : '#555555'
  for (let i in list) {
    let item = list[i]
    let callout = ''
    if (item.content) {
      callout = item.content.substring(0, 10) + '...(点击查看)'
    } else {
      callout = '[图片](点击查看)'
    }
    markers.push({
      id: item.recordId,
      latitude: item.lat,
      longitude: item.lng,
      iconPath: item.headUrl || toMap,
      width: '25px',
      height: '25px',
      label: {
        content: '   ' + item.location,
        color: '#2ab3f3',
        fontSize: 14
      },
      callout: {
        content: callout,
        color: color,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#888',
        bgColor: bgColor,
        padding: 2
      }
    })
    if (isNeedLine || isNeedInclude) {
      points.push({
        latitude: item.lat,
        longitude: item.lng
      })
    }
  }
  return {
    markers: markers,
    points: points
  }
}

function _updateUserInfo ({ userInfo, success = function () { } }) {
  storeUser.commit('updateUserInfo', {
    sex: userInfo.gender,
    nickname: userInfo.nickName,
    headUrl: userInfo.avatarUrl
  })
  storeUser.commit('updateHasHadUserInfo', { hasHadUserInfo: true })
  net.reqPut({
    url: 'user/info',
    body: {
      headUrl: userInfo.avatarUrl,
      nickname: userInfo.nickName,
      sex: userInfo.gender
    }
  }).then(data => {
    success(data)
  })
}

function _getLocation ({ success = function () { }, fail = function () { }, complete = function () { } } = {}) {
  wx.getLocation({
    type: 'gcj02', // gcj02是国内坐标，在国外时返回的应该就是wgs84坐标了
    success: (gcj) => {
      app.globalData.location = { longitude: gcj.longitude, latitude: gcj.latitude }
      success(gcj)
    },
    fail: (err) => {
      console.log(err)
      // 被拒绝后只能通过button获取授权，wx.authorize和wx.openSetting都无用，需要button
      wx.getSetting({
        success: (res) => {
          console.log(res)
          if (!res.authSetting['scope.userLocation']) {
            err.customCode = '1001'
          } else {
            wx.showToast({
              title: '获取定位时发生了一些未知错误，请退出微信重试',
              icon: 'none',
              duration: 4000
            })
          }
          fail(err)
        }
      })
    },
    complete: (res) => {
      complete(res)
    }
  })
}

function _clickLike ({ index, that = {}, success = function () { } } = {}) {
  let record = that.getRecord(index)

  const isLiked = !_isEmpty(app.globalData.likesDic[record.recordId])
  if (isLiked !== record.isLiked) { // 数据不一致，就让显示的数据改一下，无需网络请求
    _changeStatus({ type: 0, index, that })
  } else {
    if (isLiked) { // 取消赞
      net.reqPut({
        url: 'love/cancel',
        body: {
          recordId: record.recordId
        }
      }).then(data => {
        _changeStatus({ type: 0, index, that })
        delete (app.globalData.likesDic[record.recordId.toString()])
        success(data)
      })
    } else { // 点赞
      net.reqPost({
        url: 'love/info',
        body: {
          recordId: record.recordId
        }
      }).then(data => {
        _changeStatus({ type: 0, index, that })
        app.globalData.likesDic[record.recordId.toString()] = 'l'
        success(data)
      })
    }
  }
}

function _clickFavorites ({ index, that = {}, success = function () { } } = {}) {
  let record = that.getRecord(index)

  const isFavorited = !_isEmpty(app.globalData.favoritesDic[record.recordId])
  if (isFavorited !== record.isFavorited) { // 数据不一致，就让显示的数据改一下，无需网络请求
    _changeStatus({ type: 1, index, that })
  } else {
    if (isFavorited) { // 取消收藏
      net.reqPut({
        url: 'collection/cancel',
        body: {
          recordId: record.recordId
        }
      }).then(data => {
        _changeStatus({ type: 1, index, that })
        delete (app.globalData.favoritesDic[record.recordId.toString()])
        success(data)
      })
    } else { // 收藏
      net.reqPost({
        url: 'collection',
        body: {
          recordId: record.recordId
        }
      }).then(data => {
        _changeStatus({ type: 1, index, that })
        app.globalData.favoritesDic[record.recordId.toString()] = 'f'
        success(data)
      })
    }
  }
}

function _changeStatus ({ type, index, that } = {}) {
  let record = that.getRecord(index)
  switch (type) {
    case 0: {
      record.isLiked ? record.love-- : record.love++
      record.isLiked = !record.isLiked
      break
    }
    case 1: {
      record.isFavorited = !record.isFavorited
      break
    }
  }
  that.changeRecord(index, record)
}

function _createContentBoard (content, complete) {
  const boardW = 500
  const boardH = 400

  var ctx = wx.createCanvasContext('contentBoardCanvas')
  // 设置背景
  ctx.setFillStyle('#ffffff')
  ctx.fillRect(0, 0, boardW, boardH)
  // logo
  ctx.drawImage(contentBoard, 0, 0, boardW, boardH)
  // 正文
  ctx.setFontSize(28)
  ctx.setFillStyle('#777777')
  _textHandle(ctx, content, 60, 60, boardW - 120, 36, 6, '...[点击查看]', true, boardW, boardH)

  // 完成
  ctx.draw()
  // 需要延时，否则如果接口返回太快，界面可能获取不到contentBoardCanvas
  let timer = setTimeout(() => {
    clearTimeout(timer)
    wx.canvasToTempFilePath({
      canvasId: 'contentBoardCanvas',
      fail: err => {
        console.log('canvasToTempFilePath err:', err)
      },
      success: res => {
        complete(res.tempFilePath)
      }
    })
  }, 100)
}

function _createCardSingle (record, complete) {
  wx.showLoading({
    title: '',
    mask: true
  })
  let finishDownloads = []
  let imgPath = []

  let cardExist = false
  let cardSingle = wx.getStorageSync('cardSingle') || ''
  wx.getFileInfo({
    filePath: cardSingle,
    success: info => {
      console.log(info)
      cardExist = true
      startDrawCard()
    },
    fail: err => {
      console.log(err)
      net.downloadFile({
        filePath: 'https://record-image-1253413283.cos.ap-shanghai.myqcloud.com/poster.jpg',
        isReadFile: false,
        isShowLoading: false
      }).then(tempFilePath => { // todo 填写path
        wx.setStorageSync('cardSingle', tempFilePath)
        cardSingle = tempFilePath
        cardExist = true
        startDrawCard()
      })
    }
  })

  finishDownloads[0] = false
  wx.getImageInfo({
    src: storeUser.state.headUrl,
    complete: (res) => {
      finishDownloads[0] = true
      console.log(res)
      imgPath[0] = res
      startDrawCard()
    }
  })
  if (record.imageList.length > 0) {
    for (let i = 0; i < record.imageList.length; i++) {
      if (i > 2) break
      finishDownloads[i + 1] = false
      wx.getImageInfo({
        src: record.imageList[i],
        complete: (res) => {
          console.log(res)
          finishDownloads[i + 1] = true
          if (res.width > res.height) {
            res.height = 100 * (res.height / res.width)
            res.width = 100
          } else {
            res.width = 100 * (res.width / res.height)
            res.height = 100
          }
          imgPath[i + 1] = res
          startDrawCard()
        }
      })
    }
  } else {
    startDrawCard()
  }

  function startDrawCard () {
    let countDownloads = 0
    for (let i = 0; i < finishDownloads.length; i++) {
      countDownloads += (finishDownloads[i] ? 1 : 0)
    }
    if (countDownloads < finishDownloads.length || !cardExist) {
      console.log('startDrawCard rejected')
      return
    }
    console.log('startDrawCard & countDownloads:', countDownloads)

    let context = wx.createCanvasContext('cardCanvas')
    context.drawImage(cardSingle, 0, 0, 600, 1000)

    if (imgPath[0].path) {
      context.save() // 先保存状态 已便于画完圆再用
      context.beginPath() // 开始绘制
      context.arc(100, 750, 30, 0, Math.PI * 2, false) // 先画个圆
      context.clip() // 画了圆 再剪切  原始画布中剪切任意形状和尺寸。一旦剪切了某个区域，则所有之后的绘图都会被限制在被剪切的区域内
      context.drawImage(imgPath[0].path, 70, 720, 60, 60) // 推进去图片
      context.restore() // 恢复之前保存的绘图上下文 恢复之前保存的绘图上下午即状态 可以继续绘制
    }
    context.setFontSize(24)
    context.setFillStyle('#333')
    _textHandle(context, storeUser.state.nickname, 140, 750, 160, 30, 1, '')

    const halfLineWidth = 2 // 线条两侧宽度
    for (let i = 1; i < imgPath.length; i++) {
      context.setLineWidth(halfLineWidth * 2)
      context.setStrokeStyle('#ddd')
      if (!_isEmpty(imgPath[i].path)) {
        context.save()
        context.translate(460, 280 + 120 * i)
        context.rotate(((Math.random() - 0.5) * 60) * Math.PI / 180) // 在-0.5至0.5随机，转角在-30°至30°随机
        context.strokeRect(0, 0, imgPath[i].width + halfLineWidth * 2, imgPath[i].height + halfLineWidth * 2)
        context.drawImage(imgPath[i].path, halfLineWidth, halfLineWidth, imgPath[i].width, imgPath[i].height)
        context.restore()
      }
    }

    context.setFontSize(30)
    context.setFillStyle('#f3aa2a')
    let date = new Date(record.time)
    let dateStr = date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日'
    _textHandle(context, '◤' + dateStr + '◢', 80, 360, 800, 44, 1, '')

    if (record.location.length > 0) {
      context.setFontSize(20)
      context.setFillStyle('#2ab3f3')
      _textHandle(context, record.location, 80, 430, 260, 44, 2, '')
    }
    if (record.content.length > 0) {
      context.setFontSize(18)
      context.setFillStyle('#666')
      _textHandle(context, record.content, 80, 560, 260, 44, 4, '···')
    }
    context.draw()

    let timer = setTimeout(() => {
      clearTimeout(timer)
      wx.canvasToTempFilePath({
        canvasId: 'cardCanvas',
        fail: err => {
          console.log('cardCanvas err:', err)
        },
        success: res => {
          complete(res.tempFilePath)
          wx.hideLoading()
        }
      })
    }, 500)
  }
}

/**
 * @function _textHandle 绘制文本的换行处理
 * @param ctx 画布上下文
 * @param text 在画布上输出的文本
 * @param numX 绘制文本的左上角x坐标位置
 * @param numY 绘制文本的左上角y坐标位置
 * @param textWidth 文本宽度
 * @param lineHeight 文本的行高
 * @param maxLine 最多多少行，默认6行
 * @param breakStr 文末截断字符，默认'...'
 * @param isAutoCenter 是否xy轴都居中，默认不居中
 * @param boardW 写字板的宽度，居中时需要用，默认500px
 * @param boardH 写字板的高度，居中时需要用，默认400px
 * @author Moss
 */
function _textHandle (ctx, text, numX, numY, textWidth, lineHeight, maxLine = 6, breakStr = '...', isAutoCenter = false, boardW = 500, boardH = 400) {
  var chr = text.split('') // 将一个字符串分割成字符串数组
  var temp = ''
  var row = []
  for (let a = 0; a < chr.length; a++) {
    if (chr[a] === '\n') {
      console.log('has a return char')
      row.push(temp)
      temp = ''
      continue
    }
    if (ctx.measureText(temp).width < textWidth) {
      temp += chr[a]
    } else {
      a-- // 添加a--，防止字符丢失
      row.push(temp)
      temp = ''
    }
  }
  row.push(temp)

  // 如果数组长度大于maxLine 则截取
  if (row.length > maxLine) {
    row = row.slice(0, maxLine)
    if (breakStr.length > 0) {
      let lastItem = row.pop()
      const strLength = lastItem.length
      for (let i = 0; i < strLength; i++) {
        if (ctx.measureText(lastItem.slice(0, strLength - i - 1) + breakStr).width <= textWidth) {
          lastItem = lastItem.slice(0, strLength - i - 1) + breakStr
          break
        }
      }
      row.push(lastItem)
    }
  }

  let tempX = numX
  let tempY = numY
  if (isAutoCenter) {
    tempY = (boardH - row.length * lineHeight) * 0.5 + lineHeight * 0.5 // 行间距可能影响了文字的y值，此处额外补半个行间距
    tempY = (tempY < numY ? numY : tempY)
  }
  for (let b = 0; b < row.length; b++) {
    if (isAutoCenter) { // 居中显示
      tempX = (boardW - ctx.measureText(row[b]).width) * 0.5
    }
    ctx.fillText(row[b], tempX, tempY + b * lineHeight)
  }
}

function _navToHomePage (isRelaunch = false) {
  if (isRelaunch) {
    wx.reLaunch({
      url: './find' // to home
    })
  } else {
    wx.switchTab({
      url: './find'
    })
  }
}

export const getKilometerDistance = _getKilometerDistance
export const getKmDistanceFromPoi = _getKmDistanceFromPoi
export const getDistanceToMe = _getDistanceToMe
export const isEmpty = _isEmpty
export const strToJson = _strToJson
export const timeToStr = _timeToStr
export const formatLocation = _formatLocation
export const getRecordListFrom = _getRecordListFrom
export const formatRecordsOnMap = _formatRecordsOnMap
export const updateUserInfo = _updateUserInfo
export const getLocation = _getLocation
export const clickLike = _clickLike
export const clickFavorites = _clickFavorites
export const changeStatus = _changeStatus
export const createContentBoard = _createContentBoard
export const createCardSingle = _createCardSingle
export const navToHomePage = _navToHomePage
