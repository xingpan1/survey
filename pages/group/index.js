const app = getApp();
const time = require('../../utils/util.js');
Page({
  data: {
    TabCur: 0,
    showModal: false,
    showMessage: false,
    groupCur: '',
    tab: ['我创建的', '我参加的', '团队查询'],
    list: [
      [],
      [],
      []
    ],
    showList: [
      [],
      [],
      []
    ],
    pageSize:8,
    pageNum:[1,1,1],
    modalText: '',
    searchText: ''
  },
  onLoad() {
    this.getCreate();
    this.getJoin();
    this.groupSearch();

  },
  tabSelect(e) {
    this.setData({
      TabCur: e.currentTarget.dataset.id
    })
  },
  groupDetail(e) { //获取团队详情
    const that = this;
    wx.navigateTo({
      url: '/pages/group/detail/detail?groupId=' + e.currentTarget.dataset.id,
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: function (data) {
          that.getCreate();
          that.getJoin();
          that.groupSearch();
        },
        someEvent: function (data) {
          console.log(data)
        }
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', {
          data: 'test'
        })
      }
    })
  },
  joinGroup(e) { //根据有无密码确定不同逻辑
    if (e.currentTarget.dataset.password !== '') {
      this.setData({
        value: '',
        showModal: true,
        groupCur: e.currentTarget.dataset.id,
        password: e.currentTarget.dataset.password
      })
    } else {
      this.joinIn(e.currentTarget.dataset.id)
    }
  },
  joinIn(groupId, password = '') { //加入团队请求后台
    wx.request({
      url: app.globalData.url + 'mobile/group/join',
      header: {
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      data: {
        id: groupId,
        password: password,
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      success: (res) => {
        if (!res.data.invokeSuccess) {
          wx.showModal({
            content: res.data.errMsg,
            showCancel: false
          })
        } else {
          this.getJoin();
          this.getCreate();
          this.groupSearch();
          wx.showModal({
            content: res.data.invokeInfo,
            showCancel: false
          })
        }
      },
    })
  },
  inputPassword(e) {
    this.setData({
      value: e.detail.value
    })
  },
  joinConfirm() { //输入密码
    if (this.data.value === this.data.password) {
      this.joinIn(this.data.groupCur, this.data.value)
      this.hideModal()
    } else {

      wx.showModal({
        content: '密码错误！',
        showCancel: false
      })
    }
  },
  hideModal() {
    this.setData({
      showModal: false
    })
  },
  getCreate() { //我创建的团队
    wx.request({
      url: app.globalData.url + 'mobile/group/createGroupByMe',
      header: {
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      data: {
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      success: (res) => {
        const list = this.data.list;
        list[0] = res.data;
        list[0].map(item => {
          item.createTime = time.formatTime(item.createTime)
        })
        this.data.showList[0]=list[0].slice(0,this.data.pageSize)
        this.setData({
          list,
          showList:this.data.showList
        })
      },
    })
  },
  getJoin() { //我参加的团队
    wx.request({
      url: app.globalData.url + 'mobile/group/joinInMe',
      header: {
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      data: {
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      success: (res) => {
        const list = this.data.list;
        list[1] = res.data;
        list[1].map(item => {
          item.createTime = time.formatTime(item.createTime)
        })
        this.data.showList[1] = list[1].slice(0, this.data.pageSize)
        this.setData({
          list,
          showList: this.data.showList
        })
      },
    })
  }, 
  groupSearch() { //全部团队
    wx.request({
      url: app.globalData.url + 'mobile/group/list',
      header: {
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      data: {
        unionId: wx.getStorageSync('userInfo').unionId,
        groupName: this.data.searchText
      },
      success: (res) => {
        const list = this.data.list;
        list[2] = res.data;
        list[2].map(item => {
          item.createTime = time.formatTime(item.createTime)
        })
        this.data.showList[2] = list[2].slice(0, this.data.pageSize)
        this.setData({
          list,
          showList: this.data.showList
        })
      },
    })
  },
  createGroup() {
    const that = this;
    wx.navigateTo({
      url: '/pages/group/create/create',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: function (data) {
          that.getCreate();
          that.groupSearch();
        },
        someEvent: function (data) {
          console.log(data)
        }
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', {
          data: 'test'
        })
      }
    })
  },
  searchText(e) {
    this.setData({
      searchText: e.detail.value
    })
    this.groupSearch()
  },
  onPullDownRefresh() {
    if (this.data.TabCur === 0) {
      this.getCreate()
    } else if (this.data.TabCur === 1) {
      this.getJoin()
    } else if (this.data.TabCur === 2) {
      this.groupSearch()
    }
    wx.stopPullDownRefresh()
  },
  onReachBottom(){
    const index = this.data.TabCur
    const num=this.data.pageNum[index]+1
    const total = num * this.data.pageSize;
    if (total - this.data.pageSize > this.data.list[index]){
      return
    }
    this.data.showList[index]=this.data.list[index].slice(0,total);
    this.setData({
      showList:this.data.showList,
      pageNum:num
    })
  }
})