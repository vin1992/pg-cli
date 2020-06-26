/**
 * 滚动加载
 */
import React, { Component, PropTypes } from "react";
import classnames from "classnames";

export default class Loader extends Component {
  static propTypes = {
    url: PropTypes.string.isRequired,
    query: PropTypes.object,
    page: PropTypes.number,
    size: PropTypes.number,
    load: PropTypes.bool,
    tips: PropTypes.string, // 加载文案
    ends: PropTypes.string, // 终点提示文案 传空就是不显示
  };

  static defaultProps = {
    page: 1,
    size: 20,
    load: true,
    tips: "正在加载",
    ends: "已经到底啦",
  };

  constructor(props) {
    super(props);
    this.state = {
      threshold: 300,
      hasmore: true,
      loading: false,
      count: 0,
      page: this.props.page,
    };
    this.events = ["scroll", "resize", "lookup"];
  }

  handler = () => {
    // CHECK IS HIDDEN
    if (!this.refs.panel.offsetParent) {
      return;
    }
    if (
      document.documentElement.scrollHeight -
        (document.documentElement.scrollTop || document.body.scrollTop) -
        document.documentElement.clientHeight <
      this.state.threshold
    ) {
      this.loadMore((list, data) => {
        let callback = this.props.callback || $.noop;
        callback(list, data);
      });
    }
  };

  // 判断是否自动加载
  autoLoad(props) {
    // 自动加载首页
    if (props.load) {
      this.loadMore((list, data) => {
        let callback = props.callback || $.noop;
        callback(list, data);
      });
    }
    // 如果不需要自动加载并且当前页码是第一页 说明服务器端已经初始化好了 从page:2翻页
    else if (this.state.page === 1) {
      this.setState({
        page: 2,
      });
    }
  }

  loadMore(fn) {
    if (!this.state.hasmore || this.state.loading) {
      return;
    }
    this.setState(
      {
        loading: true,
      },
      () => {
        this.request = $.ajax({
          url: this.props.url,
          data: Object.assign(
            {
              page: this.state.page,
              size: this.props.size,
            },
            this.props.query
          ),
          success: (res) => {
            this.setState({
              loading: false,
            });
            if (res.code === 200) {
              fn(res.data.list, res.data);
              this.setState({
                page: this.state.page + 1,
                count: this.state.count + res.data.list.length, // 备份
              });
              if (res.data.list.length < this.props.size) {
                this.setState(
                  {
                    hasmore: false,
                  },
                  () => {
                    this.release();
                  }
                );
              }
            }
            // TODO FAILURE
            else {
              fn([]);
            }
          },
        });
      }
    );
  }

  release() {
    if (this.request) {
      this.request.abort();
    }
    this.events.forEach((ename) => {
      $(window).off(ename, this.handler);
    });
  }

  listener() {
    this.release();
    this.events.forEach((ename) => {
      $(window).on(ename, this.handler);
    });
  }

  componentDidMount() {
    this.listener();
    this.autoLoad(this.props);
  }

  componentWillUnmount() {
    this.release();
  }

  // 更新参数 需要重置必要的状态
  componentWillReceiveProps(nextProps) {
    if (JSON.stringify(nextProps.query) !== JSON.stringify(this.props.query)) {
      this.setState(
        {
          hasmore: true,
          loading: false,
          count: 0,
          page: nextProps.page,
        },
        () => {
          this.listener();
          this.autoLoad(nextProps);
        }
      );
    }
  }

  renderLoading() {
    if (this.state.loading) {
      return (
        <div className="loadmore">
          <i className="loading"></i>
          <span className="tips text-gray">{this.props.tips}</span>
        </div>
      );
    } else if (
      !this.state.hasmore &&
      this.state.count > this.state.size &&
      this.props.ends
    ) {
      return (
        <div is class="divider" ui-mode="30%">
          {this.props.ends}
        </div>
      );
    }
  }

  render() {
    let { className, ...others } = this.props;
    let clazz = classnames("loader", className);
    return (
      <div ref="panel" className={clazz}>
        {this.props.children}
        {this.renderLoading()}
      </div>
    );
  }
}
