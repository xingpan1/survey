const app = getApp();
const time = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    recordList: [],//记录全部内容
    recordShowList:[],//记录分页展示内容
    num:1,//页码
    pageSize:5,//
    trailList:[],
    tab: ['地点', '轨迹'],
    TabCur: 0,
    groupId:'',
    unionId: wx.getStorageSync('userInfo').unionId
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    const groupId = options.groupId;
    wx.setNavigationBarTitle({
      title: options.groupName
    })
    this.setData({
      groupId
    })
    this.getList(groupId)
    wx.showLoading({
      title: '加载中',
    })
  },
  onReady(){
    wx.hideLoading()
  },
  getList(groupId){
    let url = app.globalData.url + 'mobile/record/group/' + groupId + '/data'
    if (groupId == 0) {
      url = app.globalData.url + 'mobile/record/my/data'
    }
    wx.request({
      url: url,
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
            const coordinate = JSON.parse(item.coordinate);
            coordinate.latitude = coordinate.latitude.slice(0, 9);
            coordinate.longitude = coordinate.longitude.slice(0, 10)
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
              coordinate,
              unionId:item.unionId,
              createTime: time.formatTime(item.createTime),
            }
            recordList.push(record)
          })
          this.setData({
            recordList,
            recordShowList:recordList.slice(0,this.data.pageSize)
          })
        }
      }
    })
    wx.request({
      url: app.globalData.url + 'mobile/trail/list',
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      data: {
        unionId: wx.getStorageSync('userInfo').unionId,
        groupId: groupId,
      },
      success: (res) => {
        const data = []
        res.data.map((item) => {
          item.trailDetails[0].createTime = time.formatTime(item.trailDetails[0].createTime);
          data.push(item)
        })

        this.setData({
          trailList: data
        })
      }
    })
  },
  recordDetail(e) {
    wx.navigateTo({
      url: '/pages/record/detail/detail?id=' + e.currentTarget.dataset.id,
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
          data: e.currentTarget.dataset.detail
        })
      }
    })
  },
  trailDetail(e) {
    wx.navigateTo({
      url: '/pages/record/trail/detail?id=' + e.currentTarget.dataset.id,
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: function (data) {
          console.log(data)
        },
        someEvent: function (data) {
          console.log(data)
        }
      },
    })
  },
  tabSelect(e) {
    this.setData({
      TabCur: e.currentTarget.dataset.id
    })
  },
  DelRecord(e){
    const that=this;
    wx.showModal({
      content: '确认删除该记录？',
      confirmColor:'#23d723',
      success(res) {
        if (res.confirm) {
          wx.request({
            url: app.globalData.url + 'mobile/record/' + e.currentTarget.dataset.id+'/delete',
            header: {
              'unionId': wx.getStorageSync('userInfo').unionId,
            },
            success: (res) => {
              if(res.data.invokeSuccess){
                wx.showToast({
                  title: '删除成功',
                  duration:1000
                })
                that.data.recordList.splice(e.currentTarget.dataset.index, 1);
                that.data.recordShowList.splice(e.currentTarget.dataset.index, 1);
                that.setData({
                  recordList: that.data.recordList,
                  recordShowList:that.data.recordShowList
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
  DelTrail(e) {
    const that = this;
    wx.showModal({
      content: '确认删除该记录？',
      confirmColor: '#23d723',
      success(res) {
        if (res.confirm) {
          wx.request({
            url: app.globalData.url + 'mobile/trail/delete/' + e.currentTarget.dataset.id,
            header: {
              'unionId': wx.getStorageSync('userInfo').unionId,
            },
            success: (res) => {
              if (res.data.invokeSuccess) {
                wx.showToast({
                  title: '删除成功',
                  duration: 1000
                })
                that.data.trailList.splice(e.currentTarget.dataset.index, 1);
                that.setData({
                  trailList: that.data.trailList
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
    this.getList(this.data.groupId)
    wx.stopPullDownRefresh()
  },
  onReachBottom() {
    const num=this.data.num+1;
    const index =this.data.pageSize*num
    if (index - this.data.pageSize>this.data.recordList.length){
      return
    }
    this.setData({
      recordShowList:this.data.recordList.slice(0,index),
      num
    })
  },
  onUnload(e){
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('acceptDataFromOpenedPage', {
      data: 'test'
    });
    eventChannel.emit('someEvent', {
      data: 'test'
    });
  }
})