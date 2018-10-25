'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_3 = require('./chunk-efb9fd9b.js');
var __chunk_1 = require('./chunk-2c19305a.js');
var React = require('react');
var React__default = _interopDefault(React);
var nextRoutes = _interopDefault(require('next-routes'));
var __chunk_2 = require('./chunk-5ea90bae.js');
var utils = require('./utils.js');
var App = require('next/app');
var App__default = _interopDefault(App);
var base4NextjsApollo = _interopDefault(require('@base-cms/base4-nextjs-apollo'));
require('moment');

var isArray = Array.isArray;

var once = function once(fn) {
  var called = false;
  var result;
  return function () {
    if (!called) {
      called = true;
      result = fn.apply(void 0, arguments);
    }

    return result;
  };
};

var createRoutes = once(function (definitions) {
  var routes = nextRoutes();
  definitions.forEach(function (def) {
    return routes.add(def);
  });
  return routes;
});
var withRouting = (function (definitions) {
  return function (ComposedComponent) {
    var WithRouting =
    /*#__PURE__*/
    function (_React$Component) {
      __chunk_1._inherits(WithRouting, _React$Component);

      function WithRouting() {
        __chunk_1._classCallCheck(this, WithRouting);

        return __chunk_1._possibleConstructorReturn(this, __chunk_1._getPrototypeOf(WithRouting).apply(this, arguments));
      }

      __chunk_1._createClass(WithRouting, [{
        key: "render",

        /**
         *
         */
        value: function render() {
          var routes = createRoutes(definitions);
          return React__default.createElement(__chunk_2.RoutingContext.Provider, {
            value: routes
          }, React__default.createElement(ComposedComponent, this.props));
        }
      }], [{
        key: "getInitialProps",

        /**
         *
         * @param {object} args
         */
        value: function () {
          var _getInitialProps = __chunk_1._asyncToGenerator(
          /*#__PURE__*/
          __chunk_3._regeneratorRuntime.mark(function _callee(args) {
            var composedInitialProps;
            return __chunk_3._regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (isArray(definitions)) {
                      _context.next = 2;
                      break;
                    }

                    throw new Error('No route definitions were provided!');

                  case 2:
                    composedInitialProps = {};

                    if (!ComposedComponent.getInitialProps) {
                      _context.next = 7;
                      break;
                    }

                    _context.next = 6;
                    return ComposedComponent.getInitialProps(args);

                  case 6:
                    composedInitialProps = _context.sent;

                  case 7:
                    return _context.abrupt("return", __chunk_1._objectSpread({}, composedInitialProps));

                  case 8:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));

          return function getInitialProps(_x) {
            return _getInitialProps.apply(this, arguments);
          };
        }()
      }]);

      return WithRouting;
    }(React__default.Component);

    WithRouting.displayName = "withRouting(".concat(utils.componentDisplayName(ComposedComponent), ")");
    return WithRouting;
  };
});

var WebsiteApp =
/*#__PURE__*/
function (_App) {
  __chunk_1._inherits(WebsiteApp, _App);

  function WebsiteApp() {
    __chunk_1._classCallCheck(this, WebsiteApp);

    return __chunk_1._possibleConstructorReturn(this, __chunk_1._getPrototypeOf(WebsiteApp).apply(this, arguments));
  }

  __chunk_1._createClass(WebsiteApp, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          Component = _this$props.Component,
          pageProps = _this$props.pageProps;
      return React__default.createElement(App.Container, null, React__default.createElement(Component, pageProps));
    }
  }]);

  return WebsiteApp;
}(App__default);

exports.withApollo = base4NextjsApollo;
exports.WebsiteApp = WebsiteApp;
exports.withRouting = withRouting;