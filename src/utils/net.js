import { storeUser } from '../stores/storeUser'

const md5 = require('../utils/md5.js')
const hexMD5From = md5.hexMD5From

const baseUrl = 'https://chahuangli.cn/recordAllV2/'
const signWithStr = 'jilu666'
let requestingList = {}

function json2UrlEncoded (element, key, list) {
  var list = list || []
  if (typeof (element) === 'object') {
    for (let idx in element) {
      json2UrlEncoded(element[idx], key ? key + '[' + idx + ']' : idx, list)
    }
  } else {
    list.push(key + '=' + encodeURIComponent(element))
  }
  return list.join('&')
}

const http = ({ url = '', query = {}, body = {}, method = '', ...other } = {}) => {
  wx.showLoading({
    title: ''
  })

  let timeStart = Date.now()
  let sign = ''
  let queryStr = ''

  // GET和DELETE，用排序后的query做sign
  if (method === 'GET' || method === 'DELETE') {
    query['userId'] = storeUser.state.userId
    let sortedQuery = {}
    // 处理query
    let sortedKeys = Object.keys(query).sort()
    let sortedValue = ''
    for (let i in sortedKeys) {
      sortedQuery[sortedKeys[i]] = query[sortedKeys[i]]
      sortedValue += query[sortedKeys[i]]
    }
    sign = hexMD5From(sortedValue + signWithStr)
    queryStr = '?' + json2UrlEncoded(sortedQuery)
  }

  // POST和PUT，用body做sign，无排序
  if (method === 'POST' || method === 'PUT') {
    body['userId'] = storeUser.state.userId
    // 处理body
    sign = hexMD5From(JSON.stringify(body) + signWithStr)
  }

  return new Promise((resolve, reject) => {
    // 一个请求一次只执行一个
    if (requestingList[url] === 'requesting') {
      return
    }
    requestingList[url] = 'requesting'

    wx.request({
      url: getUrl(url) + queryStr,
      data: body,
      method: method,
      header: {
        'content-type': 'application/json', // 默认值 ,另一种是 "content-type": "application/x-www-form-urlencoded"
        'sign': sign
      },
      ...other,
      complete: (res) => {
        delete requestingList[url]

        wx.hideLoading()
        console.log(`\n*************************\nRequest of ${method}：${url + queryStr} | 耗时${Date.now() - timeStart}\nbody:`, body, '\nres:', res, '\n*************************\n')

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (res.data.code === 0) {
            resolve(res.data)
          } else if (res.data.code === 300) {
            wx.showToast({
              title: res.data.message || 'none',
              icon: 'none'
            })
          } else if (res.data.code === 500) {
            wx.showToast({
              title: '网络出错，请重试',
              icon: 'none'
            })
          } else {
            reject(res.data)
            console.log('!!! Request error, data code: ', res.data.code || 'none', 'message: ', res.data.message || 'none')
          }
        } else {
          console.log('!!! Request error, res statusCode: ', res.statusCode || 'none')
          reject(res)
          wx.showToast({
            title: '网络出错：' + (res.statusCode || 'none'),
            icon: 'none'
          })
        }
      }
    })
  })
}

const getUrl = (url) => {
  // 传头像时是URL，会误识别
  // if (url.indexOf('://') === -1) {
  //   url = baseUrl + url
  // }
  return baseUrl + url
}

const reqGet = ({ url, query, body, ...other } = {}) => {
  return http({
    url,
    query,
    body,
    method: 'GET',
    ...other
  })
}

const reqPost = ({ url, query, body, ...other } = {}) => {
  return http({
    url,
    query,
    body,
    method: 'POST',
    ...other
  })
}

const reqPut = ({ url, query, body, ...other } = {}) => {
  return http({
    url,
    query,
    body,
    method: 'PUT',
    ...other
  })
}

const reqDelete = ({ url, query, body, ...other } = {}) => {
  return http({
    url,
    query,
    body,
    method: 'DELETE',
    ...other
  })
}

export default {
  baseUrl,
  reqGet,
  reqPost,
  reqPut,
  reqDelete
}
