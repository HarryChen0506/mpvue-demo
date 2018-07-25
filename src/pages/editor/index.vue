<style lang="less">
page {
  width: 100%;
  height: 100%;
}
.page-editor {
  width: 100%;
  height: 100%;
  padding-top: 130rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items:center;
  justify-content:center;
  position: relative;
  .bg {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
  }
  .title {
    width: 100%;
    position: absolute;
    top: 0;
    z-index: 2;
    text-align: center;
    font-size: 36rpx;
    color: #fff;
    .back-wrap {
      width:74rpx;
      height:64rpx;
      position:absolute;
      top:0rpx;
      left:30rpx;
      display: flex;
      flex-direction: column;
      align-items:center;
      justify-content:center;
      .icon-back { 
        width:22rpx;
        height:38rpx;
      }
    }
  }
  .main {
    .pic-wrap {
      width:674rpx;
      height:1042rpx;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items:center;
      .index-bg {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;
      }
      .crop {
        width:560rpx;
        height:748rpx;
        overflow:hidden;
        position:relative;
        // background: red;
        margin-top: 20rpx;
        .bg-img-wrap {
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 1;
          .bg-img {
            width: 100%;
            height: 100%;
          }
          .custom-img {
            position: absolute;
            top: 0px;
            left: 0px;
          }
        } 
        .separate-img-wrap {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 3;
          transition: opacity 1s;          
          &.active {              
            .separate-control{
              opacity: 1
            }
            .separate-border {
              border: 1px solid #fff;
            }
          }          
          // background: #ccc;
          .separate-img {
            width: 100%;
            height: 100%;
          }
          .separate-border {
            position: absolute;
            left:0;
            top:0;
            z-index: -1;
            width: 100%;
            height: 100%;              
          }
          .separate-control {
            opacity: 0;
            width: 50rpx;
            height: 50rpx;
            position: absolute;
            right: -25rpx;
            bottom: -25rpx;
            background: #fff;
            border-radius: 25rpx;
            display: flex;
            align-items:center;
            justify-content:center;
            &.active {
              background: #ccc;
            }
            .icon-rotate {
              width: 50%;
              height: 50%;
            }
          }
        }
      }
    }
  }
}
</style>
<template>
  <div class="page-editor">
    <image class="bg" src="/static/images/bg.png" mode="aspectFill"></image>
    <div class="title" :style="{top: (statusBarHeight + 10) + 'px'}">
      <div id="back" class="back-wrap">
        <image class="icon-back" src="/static/images/icon.back.png" mode="aspectFill"></image>
      </div>
      <text>超时空合影</text>
    </div>
    <div class="main">
      <div class="pic-wrap">
        <image class="index-bg" src="https://static01.versa-ai.com/upload/prod/image/bg_replace/canvas_blank.969b6c6e6d787bbb9ac9ec459f641870.png" mode="aspectFill"></image>
        <div class="crop" id="crop"> 
          <div class="bg-img-wrap" @tap="commonBgClick">
            <image class="bg-img versa" v-if="currentScene.bgUrl" :src="currentScene.bgUrl + '?x-oss-process=image/resize,h_748,w_560'"></image>
          </div>
          <div           
            :class="{'separate-img-wrap': true, 'active': true}"
            :style="stikerStyle">
            <image 
              class="separate-img" 
              :src="sticker.remoteUrl"
              @load="imageLoad"
              @touchstart="stickerOntouchstart" 
              @touchmove="stickerOntouchmove" 
              @touchend="stickerOntouchend"
            ></image>
            <div class="separate-border"></div>
            <div :class="{'separate-control': true, 'active': arrowActive}" v-if="sticker.width > 0" 
              @touchstart="arrowOntouchstart" 
              @touchmove="arrowOntouchmove" 
              @touchend="arrowOntouchend">
              <image class="icon-rotate" src="/static/images/scale.png"></image>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {globalData} from '../../services/globalData.js'
import {changeBg} from '../../services/service.js'
 // 函数截留
const throttle = function(func, deltaX) {
  let lastCalledAt = new Date().getTime();
  return function(e) {
    if(new Date().getTime() - lastCalledAt >= deltaX) {
        func.apply(this, arguments);
        lastCalledAt = new Date().getTime();
    } else {
      console.log('不执行')
    }
  }
}
// 角度计算
const getLen = function(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}
const dot = function (v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
}
const getAngle = function (v1, v2) {
  let mr = getLen(v1) * getLen(v2);
  if (mr === 0) return 0;
  let r = dot(v1, v2) / mr;
  if (r > 1) r = 1;
  return Math.acos(r);
}
const cross = function (v1, v2) {
  return v1.x * v2.y - v2.x * v1.y;
}
const getRotateAngle = function (v1, v2) {
  let angle = getAngle(v1, v2);
  if (cross(v1, v2) > 0) {
    angle *= -1;
  }
  return angle * 180 / Math.PI;
}
// 手势模型数据
const gesture = {
  startX: 0,
  startY: 0,
  zoom: false,
  distance: 0,
  preV: {x:null, y:null},
  center: {x:0, y:0}, // 中心点y坐标
  scale: 1
}
export default {
  data () {
    return {
      statusBarHeight: 10,
      frame: { // 画框模型
        width: 280,
        height: 374,
        frameOffsetX: 0, // 画框距离设备顶部距离
        frameOffsetY: 0,  // 画框距离设备左边距离
      },
      sticker: { // 贴纸模型
        isActive: true, // 贴纸选中状态
        remoteUrl: 'https://static01.versa-ai.com/images/process/segment/2018/07/24/9bfe17cc-8f26-11e8-96b5-00163e0075f3.png', // 服务器路径
        originWidth: 0, // 原始宽度
        originHeight: 0, // 原始高度
        autoWidth: 0, // 自适应后的宽度
        autoHeight: 0, // 自适应后的高度
        autoScale: 1, // 相对画框缩放比例
        width: 100, // 实际宽度
        height: 100, // 实际高度
        rotate: 10, // 旋转角度 0-360
        x: 10, // x坐标
        y: 10, // y坐标
      },
      currentScene: {
        bgUrl: "https://static01.versa-ai.com/upload/prod/image/e7686459-ff81-480a-b6c6-b45959908e66.jpg",
        bgZIndex: 0
      }
    }
  },
  computed: {
    stikerStyle () {
      return `width: ${this.sticker.width}px;
              height: ${this.sticker.height}px;
              transform: translate(${this.sticker.x}px, ${this.sticker.y}px) rotate(${this.sticker.rotate}deg`
    }
  },
  methods: {
    imageLoad (e) {
      console.log('imageLoad', e)
      const {detail: {width, height}} = e.mp
      this.sticker.originWidth = width
      this.sticker.originHeight = height
      // 贴纸自适应
      this.stickerAutoSize()
      // this.stickerAutoPosition()
    },
    // 计算frame的实际大小 px
    calFrameRect () {
      this.getFrameRect('crop', rect => {
        console.log('rect', rect)
        this.frame.frameOffsetX = rect.left
        this.frame.frameOffsetY = rect.top
        this.frame.width = rect.width
        this.frame.height = rect.height
      })
    },
    getFrameRect (id, callback) {
      wx.createSelectorQuery().select('#' + id).boundingClientRect(function(rect){
        // rect.id      // 节点的ID
        // rect.dataset // 节点的dataset
        // rect.left    // 节点的左边界坐标
        // rect.right   // 节点的右边界坐标
        // rect.top     // 节点的上边界坐标
        // rect.bottom  // 节点的下边界坐标
        // rect.width   // 节点的宽度
        // rect.height  // 节点的高度
        typeof callback === 'function' && callback(rect)
      }).exec()
    },
    // 贴纸自适应
    async stickerAutoSize () {
      const {currentScene, sticker, frame} = this
      const {originWidth, originHeight} = sticker
     
      // 获取场景数据      
      const imageRatio = originWidth / originHeight
      // const params = JSON.parse(currentScene.sceneConfig)
      // const autoScale = parseFloat(params.size.default)
      const autoScale = 0.4
      sticker.autoScale = autoScale
      
      if (originWidth > originHeight) {
        sticker.autoWidth = frame.width * autoScale
        sticker.autoHeight = sticker.autoWidth / imageRatio
      } else {
        sticker.autoHeight = frame.height * autoScale
        sticker.autoWidth = sticker.autoHeight * imageRatio
      } 
      sticker.width = sticker.autoWidth
      sticker.height = sticker.autoHeight

      // console.log('currentScene', currentScene)
      // console.log('sticker-autosize', sticker)
      // console.log('frame', frame)
    },
    stickerOntouchstart (e) {
      // console.log('stickerOntouchstart', e)
      const {touches} = e.mp
      const {frameOffsetX, frameOffsetY} = this.frame
      if (touches.length === 1) {
        let { clientX, clientY } = touches[0]
        gesture.startX = clientX - frameOffsetX
        gesture.startY = clientY - frameOffsetY
        // this.touchStartEvent = e.touches;
        // console.log('this.frame', this.frame);
        // console.log('gesture-one', gesture);
      } else {        
        let xMove = e.touches[1].clientX - e.touches[0].clientX
        let yMove = e.touches[1].clientY - e.touches[0].clientY
        let distance = Math.sqrt(xMove * xMove + yMove * yMove)
        // 记录旋转
        let v = { x: xMove, y: yMove }
        gesture.preV = v
        gesture.distance = distance
        gesture.zoom = true
        // console.log('双指缩放', gesture)
      }
    }, 
    stickerOntouchmove: throttle(function (e) {
      this.handleStickerOntouchmove(e)
    }, 1000/10),
    handleStickerOntouchmove (e) {
      console.log('stickerOntouchmove', e)
      const {touches} = e.mp
      const {frame, sticker} = this
      const {frameOffsetX, frameOffsetY} = frame
      if (touches.length === 1) {
        //单指移动
        if (gesture.zoom) {
          //缩放状态，不处理单指
          return
        }
        let { clientX, clientY } = touches[0];
        const pointX = clientX - frameOffsetX // 触摸点所在画框坐标系的x坐标
        const pointY = clientY - frameOffsetY // 触摸点所在画框坐标系的y坐标
        let offsetX = pointX - gesture.startX;
        let offsetY = pointY - gesture.startY;
        gesture.startX = pointX;
        gesture.startY = pointY;
        // console.log('gesture', gesture)
        sticker.x += offsetX
        sticker.y += offsetY
      } else {
        //双指缩放
        let xMove = touches[1].clientX - touches[0].clientX;
        let yMove = touches[1].clientY - touches[0].clientY;
        let distance = Math.sqrt(xMove * xMove + yMove * yMove);
        
        // 计算缩放
        let distanceDiff = distance - gesture.distance;
        let newScale = gesture.scale + 0.005 * distanceDiff;
        // console.log('newScale', newScale)
        if (newScale < 0.3) {
          newScale = 0.3;
        }
        if (newScale > 4) {
          newScale = 4;
        }
        let newWidth = newScale * sticker.autoWidth
        let newHeight = newScale * sticker.autoHeight
        let newX = sticker.x - (newWidth - gesture.scale * sticker.autoWidth) * 0.5
        let newY = sticker.y - (newHeight - gesture.scale * sticker.autoHeight) * 0.5

        // 计算旋转
        let newRotate
        let preV = gesture.preV
        let v = {
          x: xMove,
          y: yMove
        }
        if (preV.x !== null) {
          let angle = getRotateAngle(v, preV)          
          newRotate = sticker.rotate + angle
        }
        // 更新数据
        gesture.scale = newScale
        gesture.distance = distance
        gesture.preV = v
        sticker.width = newWidth
        sticker.height = newHeight        
        sticker.x = newX
        sticker.y = newY
        sticker.rotate = newRotate        
      }
    },
    stickerOntouchend (e) {
      const {touches} = e.mp
      if (touches.length === 0) {
        //重置缩放状态
        gesture.zoom = false
      }
    },
    async getThemeData () {
      console.log(123)
      const res = await changeBg.theme('159718980238381056')
      console.log('res', res)
    }
  },
  created () {
    // console.log('editor created')
  },
  async mounted () {
    console.log('editor mounted', this)
    // var app= getApp()
    // console.log('app', app) // I am global data
    console.log('globalData', globalData)
    await this.getThemeData()
     // 计算frame参数
    this.calFrameRect()
  }
}
</script>



  
