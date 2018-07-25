// http 请求的封装

// versa专用的request 需要sessionId
function wxRequest (option = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: option.url,
      data: option.data,
      header: option.header,
      success: function(res) {
        resolve(res)
      },
      fail: function(err){
        reject(err)
      }
    })
  })
}
function request (option = {}) {
  const config = {
    // responseType: 'json'
    // responseType: 'text'
    data: {}
  }
  const newOption = Object.assign({}, config, option)  
  return new Promise(async function (resolve, reject) {
    try {
      let result = await wxRequest(newOption)
      resManage(result, resolve, reject, option)
    } catch (err) {
      reject(err)
    }
  })
}
function resManage (res = {}, resolve, reject, option = {}) {
  const {data, errMsg, header, statusCode} = res
  if (statusCode !== 200) {
    reject(errMsg)
  } else {
    if (data.responseCode === '40001') {
      // 微信小程序登录验证不通过
      // 将自动获取新的sessionId重新验证
      console.log('微信小程序登录验证不通过,将进行续session')
    } else {
      resolve(data)
    }
  }
}
const http = {
  request
}

export default http
