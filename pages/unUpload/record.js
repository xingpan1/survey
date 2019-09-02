const app = getApp();
const time = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    recordList: [], 
    recordShowList: [],//记录分页展示内容
    num: 1,//页码
    pageSize: 5,//
    TabCur: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: options.name
    })
    this.getRecordList()
    wx.showLoading({
      title: '加载中',
    })
  },
  onReady: function() {
    wx.hideLoading()
  },
  getRecordList(){
    wx.request({
      url: app.globalData.url + '/mobile/record/not/upload',
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      data: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      success: (res) => {
        const recordList = [];
        const list = res.data;
        if (list.length > 0) {
          list.map(item => {
            const record = {
              id: item.id,
              imgNum: item.recordDetailModels.filter(model => {
                return model.type === 1
              }).length,
              videoNum: item.recordDetailModels.filter(model => {
                return model.type === 2
              }).length,
              voiceNum: item.recordDetailModels.filter(model => {
                return model.type === 3
              }).length,
              textNum: item.describtion === '' ? 0 : 1,
              nickName: item.nickName,
              recordName: item.recordName,
              coordinate: JSON.parse(item.coordinate),
              createTime: time.formatTime(item.createTime),
              detail: item
            }
            recordList.push(record)
          })
          console.log(recordList)
          this.setData({
            recordList,
            recordShowList: recordList.slice(0, this.data.pageSize)
          })
        }else{
          this.setData({
            recordList:[],
            recordShowList:[]
          })
        }
      }
    }) 
  },
  recordDetail(e) {
    wx.navigateTo({
      url: '/pages/unUpload/editor/index?id=' + e.currentTarget.dataset.id,
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: (data)=> {
          wx.showToast({
            title: '上传成功',
            duration: 1000,
          })
          this.getRecordList()
        },
        someEvent: function(data) {
        }
      },
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', {
          data: e.currentTarget.dataset.detail
        })
      }
    })
  },
  tabSelect(e) {
    console.log(e)
    this.setData({
      TabCur: e.currentTarget.dataset.id
    })
  },
  DelRecord(e) {
    const that = this;
    wx.showModal({
      content: '确认删除该记录？',
      confirmColor: '#23d723',
      success(res) {
        if (res.confirm) {
          wx.request({
            url: app.globalData.url + 'mobile/record/' + e.currentTarget.dataset.id + '/delete',
            header: {
              'unionId': wx.getStorageSync('userInfo').unionId,
            },
            success: (res) => {
              if (res.data.invokeSuccess) {
                wx.showToast({
                  title: '删除成功',
                  duration: 1000
                })
                that.data.recordList.splice(e.currentTarget.dataset.index, 1);
                that.data.recordShowList.splice(e.currentTarget.dataset.index, 1);
                that.setData({
                  recordList: that.data.recordList,
                  recordShowList: that.data.recordShowList
                })
              }
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  onPullDownRefresh() {
    this.getRecordList()
    wx.stopPullDownRefresh()
  },
  onReachBottom() {
    const num = this.data.num + 1;
    const index = this.data.pageSize * num
    if (index - this.data.pageSize > this.data.recordList.length) {
      return
    }
    this.setData({
      recordShowList: this.data.recordList.slice(0, index),
      num
    })
  },
})