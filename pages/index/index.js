//获取应用实例
var amapFile = require('../../libs/amap-wx.js'); //如：..­/..­/libs/amap-wx.js
var markersData = [];
const app = getApp()
Page({
  data: {
    array: [{
      id: '0',
      groupName: '我的采集'
    }],
    index: 0,
    groupId: 0,
    satellite: false,
    descColor: '#000',
    showModal: false,
    scale: 16,
    location: '',
    markers: [],
    istrail: false,
    polyline: [],
    trail: [],
    startAddress: '',
    endAddress: '',
    time: 0,
    timer: '',
    latitude: '',
    longitude: '',
    addressDesc: '',
    trailTitle: '',
    showEditor: false
  },
  makertap: function (e) {
    var id = e.markerId;
    var that = this;
    wx.navigateTo({
      url: '/pages/record/detail/detail?id=' + id,
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: function (data) {
          console.log(data)
        },
        someEvent: function (data) {
          console.log(data)
        }
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据

      }
    })
  },
  onLoad: function () {
    const that = this;
    this.myAmapFun = new amapFile.AMapWX({
      key: 'ded5213a81d5427dc25a33a7657052ff'
    });
    this.mapCtx = wx.createMapContext("map");
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          controls: [{
            id: 6,
            iconPath: '/images/markerIcon.png',
            position: {
              left: res.windowWidth / 2 - 10,
              top: res.windowHeight / 2 - 40,
              width: 20,
              height: 40
            },
            clickable: true
          }]
        })
      }
    })
  },
  onReady() {
    const that = this;
    this.onLoad()
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
        })
      },
    })
    wx.getStorage({
      key: 'isNew',
      success: function (res) {
        that.getGroupList()
      },
      fail: function (res) {
        that.setData({
          showModal: true
        })
      }
    })
    
    this.moveToLocation();
  },
  onShow(e) {
    this.setData({
      latitude: this.data.latitude,
      longitude: this.data.longitude,
    })
   
  },
  controls: function (e) {
    const that = this;
    let {
      scale,
      location,
      addressDesc
    } = this.data;
    const params = {
      id: Number.parseInt(Math.random() * 1000),
      latitude: location.split(',')[1],
      longitude: location.split(',')[0],
      iconPath: '/images/marker.png',
      width: 22,
      height: 32
    }
    const targetData = {
      addressDesc,
      latitude: location.split(',')[1],
      longitude: location.split(',')[0],
      groupId: this.data.groupId
    }
    const projectData = {
      projectName: this.data.array[this.data.index],
      id: this.data.index
    };
    switch (e.currentTarget.id) {
      case '1':
        this.moveToLocation();
        break;
      case '2':
        wx.navigateTo({
          url: '/pages/editor/index?targetData=' + JSON.stringify(targetData),
          events: {
            // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
            acceptDataFromOpenedPage: function (data) {
              setTimeout(() => {
                wx.showToast({
                  title: '添加成功',
                  duration: 1500
                })
                that.getGroupList()
              }, 1000)
            },
            someEvent: function (data) { }
          },
          success: function (res) {
            // 通过eventChannel向被打开页面传送数据
            res.eventChannel.emit('acceptDataFromOpenerPage', {
              data: 'test'
            })
          }
        })
        break;
      case '3':
        wx.navigateTo({
          url: '/pages/record/record?groupId=' + this.data.groupId + '&&groupName=' + this.data.array[this.data.index].groupName,
          events: {
            // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
            acceptDataFromOpenedPage: function (data) {
              console.log(data)
              that.getGroupList()
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
        break;
      case '4':
        this.trailManage()
        break;
      case '5':
        if (scale <= 20) {
          scale += 1
          this.setData({
            scale: scale,
            latitude: location.split(',')[1],
            longitude: location.split(',')[0],
          })
        }
        break;
      case '6':
        if (scale > 10) {
          scale = scale - 1
          this.setData({
            scale: scale,
            latitude: location.split(',')[1],
            longitude: location.split(',')[0],
          })
        }
        break;
      case '7':
        this.setData({
          satellite: !this.data.satellite,
          descColor: this.data.satellite ? '#000' : '#fff'
        })
        break;

    }
  },

  getGroupList() {
    let groupId = wx.getStorageSync('groupId') || 0
    wx.request({
      url: app.globalData.url + 'mobile/group/getGroupByUnionId',
      header: {
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      data: {
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      success: (res) => {
        const array = [];
        array.push({
          id: '0',
          groupName: '我的采集'
        })
        array.push(...res.data)
        let num;
        array.map((item, index) => {
          if (item.id === groupId) {
            num = index;
          }
        })
        if(num===undefined){
          groupId=0;
        }
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
            const markers = [];
            const list = res.data;
            if (list.length > 0) {
              list.map(item => {
                let iconPath= '/images/marker.png';
                if(item.unionId === wx.getStorageSync('userInfo').unionId){
                  iconPath = '/images/marker_checked.png';
                }
                const record = {
                  id: item.id,
                  latitude: JSON.parse(item.coordinate).latitude,
                  longitude: JSON.parse(item.coordinate).longitude,
                  iconPath,
                  width: 22,
                  height: 32
                }
                markers.push(record)
              })
              this.setData({
                markers
              })
            } else {
              this.setData({
                markers: []
              })
            }
          }
        })
        this.setData({
          array,
          groupId: groupId === '' ? 0 : groupId,
          index: num === undefined ? 0 : num
        })
      }
    })
  },
  getCenterLocation: function () {
    const that = this;
    this.mapCtx.getCenterLocation({
      success: function (res) {
        const location = res.longitude + ',' + res.latitude;
        that.setData({
          longitude:res.longitude,
          latitude:res.latitude
        })
        that.getLocation(location)
      }
    })
  },
  trailManage() {
    const trail = this.data.trail;
    const num = this.data.polyline.length;
    let time = 0;
    this.moveToLocation();
    const that = this;
    if (!this.data.istrail) {
      setTimeout(() => {
        this.setData({
          istrail: true,
          startAddress: that.data.addressDesc
        })
      }, 500)
      this.data.timer = setInterval(() => {
        wx.getLocation({
          type: 'gcj02',
          success: (res) => {
            if (trail.length > 0 && trail[trail.length - 1].latitude !== res.latitude && trail[trail.length - 1].longitude !== res.longitude) {
              trail.push({
                latitude: res.latitude,
                longitude: res.longitude,
              })
            } else if (trail.length === 0) {
              trail.push({
                latitude: res.latitude,
                longitude: res.longitude,
              })
            }
            console.log(trail)
            time += 5
            const line = {
              points: trail,
              color: "#FF0000DD",
              width: 5,
              arrowLine: true
            };
            const polyline = that.data.polyline;
            polyline[num] = line
            that.setData({
              polyline,
              time,
              trail
            })
          },
        })
      }, 5000)
    } else {
      this.setData({
        istrail: false,
      })
      clearInterval(this.data.timer)
      if (this.data.trail.length < 2) {
        this.data.polyline.splice(this.data.polyline.length - 1, 1);
        this.setData({
          polyline: [],
          trail: [],
          showEditor: false
        })
        wx.showModal({
          content: '无效的轨迹记录，请重新进行轨迹记录！',
        })
        return
      }
      setTimeout(function () {
        that.setData({
          endAddress: that.data.addressDesc,
          trailTitle: '',
          showEditor: true
        })
      }, 500)
    }
  },
  getLocation: function (location) {
    const that = this;
    this.myAmapFun.getRegeo({
      location: location,
      success: function (data) {
        //成功回调
        let name
        if (data[0].regeocodeData.aois.length > 0) {
          name = data[0].regeocodeData.aois[0].name
        } else {
          let index = data[0].regeocodeData.formatted_address.indexOf('街道')
          name = index === -1 ? data[0].regeocodeData.formatted_address : data[0].regeocodeData.formatted_address.slice(index + 2)
        }
        
        that.setData({
          location: location,
          addressDesc: name
        })

      },
      fail: function (info) {
        //失败回调
        console.log(info)
      }
    });
  },
  moveToLocation: function () {
    this.mapCtx.moveToLocation();
    const that = this;
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
        })
        const location = res.longitude + ',' + res.latitude;
        that.getLocation(location)
      },
    })
  },

  bindPickerChange: function (e) {
    const active = this.data.array[e.detail.value];
    wx.setStorage({
      key: 'groupId',
      data: active.id,
    })
    this.setData({
      index: e.detail.value,
      groupId: active.id
    })
    this.getGroupList()
  },
  bindregionchange: function (e) {
    if (e.type === 'end' && e.causedBy === 'drag') {
      this.getCenterLocation()
    }
  },
  bindGetUserInfo: function () {
    let that = this;
    wx.login({
      success: (res) => {
        wx.getUserInfo({
          withCredentials: true,
          success: (user) => {
            let avatarUrl = user.userInfo.avatarUrl;
            let nickName = user.userInfo.nickName;
            let encryptedData = user.encryptedData;
            let iv = user.iv;
            wx.request({
              url: app.globalData.url + 'mobile/login/getUnionId',
              data: {
                avatar: avatarUrl,
                nickName: nickName,
                encryptedData: encryptedData,
                iv: iv,
                code: res.code
              },
              success: function (callBack) {
                if (callBack.data.invokeSuccess) {
                  that.setData({
                    showModal: false
                  });
                  // 存储用户信息到本地
                  wx.setStorage({
                    key: 'userInfo',
                    data: {
                      avatarUrl: avatarUrl,
                      nickName: nickName,
                      unionId: callBack.data.invokeInfo.unionId
                    },
                    success: function (res) {
                      that.getGroupList()
                    },
                    fail: function (e) {
                      console.log(e)
                    }
                  })
                  wx.setStorage({
                    key: 'isNew',
                    data: true
                  })
                }
              }
            })

          },
          fail: function () { }
        })
      }
    })
  },
  uploadTrail() {
    console.log(this.data.trailTitle === '')
    if (this.data.trailTitle === '') {
      wx.showModal({
        content: '轨迹名称不能为空',
        showCancel: false
      })
      return
    }
    wx.request({
      url: app.globalData.url + 'mobile/trail/add',
      header: {
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      data: {
        unionId: wx.getStorageSync('userInfo').unionId,
        groupId: this.data.groupId,
        name: this.data.trailTitle,
        startAddress: this.data.startAddress,
        endAddress: this.data.endAddress,
        distance: '',
        timeSpan: this.data.time,
        trailContent: JSON.stringify(this.data.trail)
      },
      success: (res) => {
        if (res.data.invokeSuccess) {
          this.setData({
            trail: [],
            polyline: [],
            showEditor: false
          })
          wx.showToast({
            title: '记录成功',
            duration: 1000
          })
        }
      }
    })
  },
  hideEditor() {
    this.setData({
      showEditor: false
    })
  },
  editTitle(e) {
    this.setData({
      trailTitle: e.detail.value
    })
  },
  delTrail() {
    this.data.polyline.splice(this.data.polyline.length - 1, 1);
    this.setData({
      polyline: this.data.polyline,
      trail: [],
      showEditor: false
    })
  },
  onTabItemTap(){
    this.getGroupList()
  }
})