// pages/all/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatar: '',
    nickName: '',
    wifi: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.getStorage({
      key: 'userInfo',
      success: (res) => {
        this.setData({
          avatar: res.data.avatarUrl,
          nickName: res.data.nickName,
        })
      },
    })
    wx.getStorage({
      key: 'wifi',
      success: (res) => {
        this.setData({
          wifi: res.data
        })
      },
      fail: (res) => {
        console.log(res)
        wifi: false
      }
    })
  },
  getList() {
    wx.navigateTo({
      url: '/pages/record/record?groupId=0&&groupName=我的采集',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: function(data) {
          console.log(data)
        },
        someEvent: function(data) {
          console.log(data)
        }
      },
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', {
          data: 'test'
        })
      }
    })
  },
  setUpload(e) {
    this.setData({
      wifi: e.detail.value
    })
    if (e.detail.value) {
      wx.setStorage({
        key: 'wifi',
        data: true,
      })
    } else {
      wx.setStorage({
        key: 'wifi',
        data: false,
      })
    }
  },
  getUnupload(){
    wx.navigateTo({
      url: '/pages/unUpload/record?name=未上传记录',
    })
  }
})