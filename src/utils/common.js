import net from './net'
import { storeUser } from '../stores/storeUser'
let app = getApp()

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
  longitude = Math.abs(longitude.toFixed(2))
  latitude = Math.abs(latitude.toFixed(2))
  const arrLng = longitude.toString().split('.')
  const arrLat = latitude.toString().split('.')
  return lng + arrLng[0] + '°' + arrLng[1] + '′ ' + lat + arrLat[0] + '°' + arrLat[1] + '′'
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

function _updateUserInfo ({ userInfo, success = function () { } }) {
  storeUser.commit('updateUserInfo', {
    sex: userInfo.gender,
    nickname: userInfo.nickName,
    headUrl: userInfo.avatarUrl
  })
  app.globalData.hasHadUserInfo = true
  wx.setStorageSync('hasHadUserInfo', true)
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
    type: 'gcj02', // gcj02的误差在100m内，wgs84误差能达到500m以上，坚决别用！
    success: (gcj) => {
      app.globalData.location = { longitude: gcj.longitude, latitude: gcj.latitude }
      success(gcj)
      wx.getLocation({
        type: 'wgs84',
        success: wgs => {
          const wgsCal = gcj02ToWgs84(gcj.longitude, gcj.latitude)
          const gcjCal = wgs84ToGcj02(wgs.longitude, wgs.latitude)
          console.log('wgs&gcj', _getKilometerDistance(gcj.latitude, gcj.longitude, wgs.latitude, wgs.longitude) * 1000)
          console.log('wgsCal', _getKilometerDistance(wgsCal.latitude, wgsCal.longitude, wgs.latitude, wgs.longitude) * 1000)
          console.log('gcjCal', _getKilometerDistance(gcjCal.latitude, gcjCal.longitude, gcj.latitude, gcj.longitude) * 1000)
        }
      })
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

/**
 * 提供了百度坐标（BD09）、国测局坐标（火星坐标，GCJ02）、和WGS84坐标系之间的转换
 */
// 定义一些常量
// var x_PI = 3.14159265358979324 * 3000.0 / 180.0
var PI = 3.1415926535897932384626
var a = 6378245.0
var ee = 0.00669342162296594323

/**
 * WGS84转GCj02
 * @param lng
 * @param lat
 * @returns {*[]}
 */
function wgs84ToGcj02 (lng, lat) {
  if (outOfChina(lng, lat)) {
    return [lng, lat]
  } else {
    var dlat = transformlat(lng - 105.0, lat - 35.0)
    var dlng = transformlng(lng - 105.0, lat - 35.0)
    var radlat = lat / 180.0 * PI
    var magic = Math.sin(radlat)
    magic = 1 - ee * magic * magic
    var sqrtmagic = Math.sqrt(magic)
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI)
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI)
    var mglat = lat + dlat
    var mglng = lng + dlng
    return {
      longitude: mglng,
      latitude: mglat
    }
  }
}

/**
 * GCJ02 转换为 WGS84
 * @param lng
 * @param lat
 * @returns {*[]}
 */
function gcj02ToWgs84 (lng, lat) {
  if (outOfChina(lng, lat)) {
    return [lng, lat]
  } else {
    var dlat = transformlat(lng - 105.0, lat - 35.0)
    var dlng = transformlng(lng - 105.0, lat - 35.0)
    var radlat = lat / 180.0 * PI
    var magic = Math.sin(radlat)
    magic = 1 - ee * magic * magic
    var sqrtmagic = Math.sqrt(magic)
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI)
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI)
    var mglat = lat + dlat
    var mglng = lng + dlng
    // return [lng * 2 - mglng, lat * 2 - mglat]
    return {
      longitude: lng * 2 - mglng,
      latitude: lat * 2 - mglat
    }
  }
}

function transformlat (lng, lat) {
  var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0
  return ret
}

function transformlng (lng, lat) {
  var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0
  return ret
}

/**
 * 判断是否在国内，不在国内则不做偏移
 * @param lng
 * @param lat
 * @returns {boolean}
 */
function outOfChina (lng, lat) {
  return (lng < 72.004 || lng > 137.8347) || ((lat < 0.8293 || lat > 55.8271) || false)
}

export const getKilometerDistance = _getKilometerDistance
export const getDistanceToMe = _getDistanceToMe
export const isEmpty = _isEmpty
export const strToJson = _strToJson
export const timeToStr = _timeToStr
export const formatLocation = _formatLocation
export const getRecordListFrom = _getRecordListFrom
export const updateUserInfo = _updateUserInfo
export const getLocation = _getLocation
export const clickLike = _clickLike
export const clickFavorites = _clickFavorites
export const changeStatus = _changeStatus
