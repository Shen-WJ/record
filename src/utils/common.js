import net from './net'
import { storeUser } from '../stores/storeUser'
import { storeMode } from '../stores/storeCommon'
import toMap from '../image/icon/toMap.png'

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
  if (diffHours >= 24) {
    let date = new Date(time)
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
  } else if (diffHours < 24 && diffHours >= 1) {
    return Math.floor(diffHours) + '小时前'
  } else if (diffHours < 1) {
    return Math.floor(difference / 1000 / 60) + '分钟前'
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

    if (!_isEmpty(app.globalData.location)) {
      let kmNum = _getKilometerDistance(item.lat, item.lng, app.globalData.location.latitude, app.globalData.location.longitude)
      item.distance = kmNum < 1 ? (kmNum * 1000).toFixed(1) + 'm' : kmNum.toFixed(2) + 'km'
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
    fail: (res) => {
      fail(res)
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
