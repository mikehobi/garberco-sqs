import * as core from "../core";
import mediabox from "./mediabox";
import AutoplayHandler from "./AutoplayHandler";

const Vimeo = require("vimeo").Vimeo;
const client = new Vimeo(
  "9d4f4417c518c95db3f8c0461eb7da3e59e7b289",
  "23AxUag/dzswqGCSY6rJdoWMsw2MnYadh4fecPP9JJiXEOS/cVaAkRrsh755tu4gEZPon9tS+j0eyN8x+2Orke5W0aGarrnfjONsurvJt8Wdv9mMQNPfz9AwpKGi+Onn",
  "15807db98b40203e65427ac71121c89a"
);

/**
 *
 * @public
 * @class VideoVimeo
 * @memberof video
 * @classdesc Video default for third-party service embeds.
 * @param {Hobo} $node The element to inject the video module into
 * @param {object} data The video data to work with
 *
 */
class VideoVimeo {
  constructor($node, data) {
    this.$node = $node;
    this.$video = this.$node.find(".js-video-element");
    this.$poster = this.$node.find(".js-video-poster");
    this.$playback = this.$node.find(".js-video-playback");
    this.data = data;
    this._files = {};
    this._video = null;

    this.loadVimeoData();
  }

  /**
   *
   * @public
   * @instance
   * @method loadVimeoData
   * @memberof VideoVimeo
   * @description Attempt to utilize the Vimeo JS API for source files.
   *
   */
  loadVimeoData() {
    const vimeoId = this.data.vimeoUrl.split("/").pop();

    const _this = this;

    client.request(
      {
        method: "GET",
        path: `/videos/${vimeoId}`,
      },
      function (error, body, status_code, headers) {
        _this.handleVimeoData(body);
      }
    );
  }

  /**
   *
   * @public
   * @instance
   * @method handleVimeoData
   * @param {object} vData The response data from Vimeo's API
   * @memberof VideoVimeo
   * @description Process Vimeo API data and find an HD version to use.
   *
   */
  handleVimeoData(vData) {
    this.vData = vData;

    // Organize video files
    this._files = VideoVimeo.logVideoFiles(vData);

    // Assign source file to data
    this.data.sourceUrl = VideoVimeo.getVideoFile(this._files);

    // Assign poster thumbnail
    this.data.posterUrl =
      this.vData.pictures.sizes[this.vData.pictures.sizes.length - 1].link;

    if (core.detect.isDevice()) {
      this.initMobile();
    } else {
      this.initVideo();
    }

    this.applyAspect();
    this.createMediaNode(this.data.id, this.data.sourceUrl, this.$video[0]);
  }

  /**
   *
   * @public
   * @instance
   * @method initMobile
   * @memberof VideoVimeo
   * @description Initialize videos for modile devices.
   *
   */
  initMobile() {
    this.$video[0].setAttribute("controls", true);
    this.$video[0].setAttribute("loop", false);
    this.$video[0].setAttribute("poster", this.data.posterUrl);
    this.$poster.remove();
    this.$playback.remove();
  }

  /**
   *
   * @public
   * @instance
   * @method initVideo
   * @memberof VideoVimeo
   * @description Initialize videos for browsers.
   *
   */
  initVideo() {
    this.$video.on("loadedmetadata", () => {
      if (this.data.autoplayLoop) {
        this.bindAutoplayLoop();
      } else if (this.data.clickToPlay) {
        this.$video[0].removeAttribute("controls");
        this.bindAutoplayLoop(true);
        this.bindClickToPlay();
      }
    });
  }

  /**
   *
   * @public
   * @instance
   * @method loadThumbFile
   * @memberof VideoVimeo
   * @description Load poster image from vimeo.
   *
   */
  loadThumbFile() {
    this.$poster.attr("data-img-src", this.data.posterUrl);

    core.util.loadImages(this.$poster);
  }

  /**
   *
   * @public
   * @instance
   * @method bindAutoplayLoop
   * @memberof VideoVimeo
   * @description Handle autoplay loop video option.
   *
   */
  bindAutoplayLoop(muted = false) {
    this._autoplayHandler = new AutoplayHandler(
      this.$node,
      this.data.id,
      muted
    );
  }

  /**
   *
   * @public
   * @instance
   * @method bindClickToPlay
   * @memberof VideoVimeo
   * @description Handle click-to-play video option.
   *
   */
  bindClickToPlay() {
    this.$video.on("click", () => {
      // If it ain't active... make it active
      if (!this.$node[0].classList.contains("is-active")) {
        requestAnimationFrame(() => {
          if (this._autoplayHandler) {
              this._autoplayHandler.destroy();
          }

          // unmute the video
          mediabox.setVolume(this.data.id, 1);

          // play the video, set controls, and reset time
          this.$video[0].setAttribute("controls", true);
          this.$video[0].currentTime = 0;
          this.$node.addClass("is-active");
          this.$node.addClass("is-playing");
        });
      } 
      // Used to rely on mediabox.isPlaying(this.data.id) but...
      else if (this.$node[0].classList.contains("is-playing")) {
        this.$node.removeClass("is-playing");
      }
      // anyways
      else {
        this.$node.addClass("is-playing");
      }
    });

    mediabox.addMediaEvent( this.data.id, "ended", () => {
        mediabox.stopMedia( this.data.id ).setMediaProp( this.data.id, "currentTime", 0 );

        this.$node.removeClass( "is-active is-playing" );
    });
  }

  /**
   *
   * @public
   * @instance
   * @method createMediaNode
   * @param {string} id The media id
   * @param {string} url The media source url
   * @param {element} node The <video /> element
   * @memberof VideoVimeo
   * @description Execute the MediaBox implementation adding this video to the `library`.
   *
   */
  createMediaNode(id, url, node) {
    mediabox.addVideo({
      id: id,
      src: url.split(","),
      element: node,
      channel: "vid",
    });
  }

  /**
   *
   * @public
   * @instance
   * @method applyAspect
   * @memberof VideoVimeo
   * @description Apply the video's aspect ratio.
   *
   */
  applyAspect() {
    this.$node[0].style.paddingBottom = `${
      (this.vData.height / this.vData.width) * 100
    }%`;
  }

  /**
   *
   * @public
   * @instance
   * @method destroy
   * @memberof VideoVimeo
   * @description Removes events and media for the video instance.
   *
   */
  destroy() {
    this.$video.off("click loadedmetadata");

    if (this._autoplayHandler) {
      this._autoplayHandler.destroy();
    }

    if (mediabox.getMedia(this.data.id)) {
      mediabox.destroyMedia(this.data.id);
    }

    if (this._onScroll) {
      core.emitter.off("app--project-scroll", this._onScroll);
    }
  }
}

/**
 *
 * @public
 * @static
 * @method logVideoFiles
 * @param {object} vData The api response from Vimeo
 * @memberof VideoVimeo
 * @description Organize the files array into something easier to use.
 * @returns {object}
 *
 */

VideoVimeo.logVideoFiles = function (vData) {
  console.log(vData);
  let i = vData.files.length;
  const files = {};

  for (i; i--; ) {
    if (
      !files[vData.files[i].quality] ||
      (files[vData.files[i].quality] &&
        vData.files[i].size > files[vData.files[i].quality].size)
    ) {
      files[vData.files[i].quality] = vData.files[i];
    }
  }

  return files;
};

/**
 *
 * @public
 * @static
 * @method getVideoFile
 * @param {object} files The logged video files
 * @memberof VideoVimeo
 * @description Get the file to play.
 * @returns {string}
 *
 */
VideoVimeo.getVideoFile = function (files) {
  return (
    core.detect.isDevice() ? files.mobile || files.sd : files.hd || files.sd
  ).link;
};

/******************************************************************************
 * Export
 *******************************************************************************/
export default VideoVimeo;
