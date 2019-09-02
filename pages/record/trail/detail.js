// pages/record/detail/detail.js
const app = getApp();
const time = require('../../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: '',
    longitude: '',
    latitude: '',
    item: '',
    name:'',
    showEditor: false,
    textValue: '',
    canWrite: true,
    loadModal: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      id: options.id
    })
    this.getDetail(options.id)
  },

  getDetail(id) {
    wx.request({
      url: app.globalData.url + 'mobile/trail/' + id + '/detail',
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      success: (res) => {
        let canWrite=false;
        const data = res.data;
        const item = {
          createTime: time.formatTime(data.trailDetails[0].createTime),
          id: data.id,
          startAddress: data.startAddress,
          endAddress: data.endAddress,
          timeSpan: data.timeSpan,
          name: data.name,
          nickName:data.nickName
        }
        if(data.unionId === wx.getStorageSync('userInfo').unionId){
          canWrite=true
        }
        const trail = [];
        data.trailDetails.map(item=>{
          trail.push(...JSON.parse(item.coordinate))
        })
        const polyline = [{
          points: trail,
          color: "#FF0000DD",
          width: 5,
          arrowLine: true
        }];
        this.setData({
          longitude: JSON.parse(data.trailDetails[0].coordinate)[0].longitude,
          latitude: JSON.parse(data.trailDetails[0].coordinate)[0].latitude,
          item,
          canWrite,
          polyline,
        })
      }
    })
  },

 

  editTitle() {
    this.setData({
      showEditor: true,
      name: this.data.item.name
    })
  },

  hideEditor() {
    this.setData({
      showEditor: false
    })
  },


  textareaAInput(e) {
    this.setData({
      name: e.detail.value
    })
  },

  confirmEdit() {
    if (this.data.name === this.data.item.name) {
      this.setData({
        showEditor: false
      })
      return
    }
    wx.request({
      url: app.globalData.url + 'mobile/trail/update',
      data: {
        id: this.data.id,
        name: this.data.name,
      },
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      success: (res) => {
        if (res.data.invokeSuccess) {
          const item = this.data.item;
          item.name = this.data.name;
          this.setData({
            item,
            name: this.data.name,
            showEditor: false
          })
          wx.showToast({
            title: '编辑成功',
            icon: 'success',
            duration: 2000
          })
        }
      }
    })
  },
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.imgList1,
      current: e.currentTarget.dataset.url
    });
  },
  addUpload() {
    if (this.data.TabCur === 0) {
      wx.chooseImage({
        count: 9, //默认9
        sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album', 'camera'], //从相册选择
        success: (res) => {
          this.upload(this.data.id, res.tempFilePaths, 1)
        }
      });
    } else if (this.data.TabCur === 1) {
      wx.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        camera: 'back',
        success: (res) => {
          console.log(res.tempFilePath);
          const arr = [res.tempFilePath]
          this.upload(this.data.id, arr, 2)
        }
      })
    } else if (this.data.TabCur === 2) {
      this.startVoice()
    }
  },
  upload(recordId, uploadList, type, index = 0) {
    console.log(uploadList)
    wx.uploadFile({
      url: app.globalData.url + 'mobile/record/detail/add', //仅为示例，非真实的接口地址
      filePath: uploadList[index],
      name: 'file',
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      formData: {
        unionId: wx.getStorageSync('userInfo').unionId,
        recordId,
        tmpPath: uploadList[index].filePath,
        type: type,
      },
      success(res) {
        const data = res.data
        //do something
      },
      complete: (res) => {
        if (index < uploadList.length - 1) {
          index++;
          this.upload(recordId, uploadList, type, index)
        } else {
          this.getDetail(this.data.id)
        }
      }
    })
  },
  recorderManager: function() {
    const recorderManager = wx.getRecorderManager()
    recorderManager.options = {
      duration: 600000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'aac',
      frameSize: 50
    }
    const that = this;
    const {
      minute,
      second
    } = this.data;
    recorderManager.setTime = function() {
      let voiceTime = minute * 60 + parseInt(second);
      recorderManager.timer = setInterval(function() {
        voiceTime++
        if (voiceTime >= 10) {
          clearInterval(recorderManager.timer)
          recorderManager.stop(recorderManager.options)
          that.setData({
            loadModal: false,
            minute: '00',
            second: '00'
          })
          wx.showToast({
            title: '录音结束',
            icon: 'success',
            duration: 1000
          })
          return
        }
        let minute = parseInt(voiceTime / 60) < 10 ? "0" + parseInt(voiceTime / 60) : parseInt(voiceTime / 60)
        let second = voiceTime % 60 < 10 ? '0' + voiceTime % 60 : voiceTime % 60
        that.setData({
          minute,
          second
        })
      }, 1000)
    }
    recorderManager.onStart(() => {
      this.setData({
        loadModal: true
      })
      recorderManager.setTime()
      console.log('recorder start')
    })
    recorderManager.onPause(() => {
      clearInterval(recorderManager.timer)
      console.log('recorder pause')
      this.setData({
        isPause: true
      })
    })
    recorderManager.onResume((res) => {
      this.setData({
        isPause: false
      })
      recorderManager.setTime()
    })
    recorderManager.onStop((res) => {
      console.log('recorder stop', res)
      const {
        tempFilePath
      } = res
      clearInterval(recorderManager.timer)
      recorderManager.stop(recorderManager.options)
      const arr = [tempFilePath]
      that.upload(that.data.id, arr, 3)
      that.setData({
        loadModal: false,
        minute: '00',
        second: '00'
      })
      wx.showToast({
        title: '录音结束',
        icon: 'success',
        duration: 1000
      })

    })
    recorderManager.onFrameRecorded((res) => {
      const {
        frameBuffer
      } = res
      console.log('frameBuffer.byteLength', frameBuffer.byteLength)
    })
    return recorderManager
  },
  startVoice: function() {
    const recorderManager = this.recorderManager();
    recorderManager.start(recorderManager.options)
  },
  pauseVoice: function() {
    const recorderManager = this.recorderManager();
    recorderManager.pause(recorderManager.options)
  },
  resumeVoice: function() {
    const recorderManager = this.recorderManager();
    recorderManager.resume(recorderManager.options)
  },
  stopVoice: function() {
    const recorderManager = this.recorderManager();
    recorderManager.stop(recorderManager.options)
  },
  delVoice: function() {
    const recorderManager = this.recorderManager();
    recorderManager.stop(recorderManager.options)
  },
})